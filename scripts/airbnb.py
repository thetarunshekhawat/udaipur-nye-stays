"""Shared helpers: fetch an Airbnb listing page (cached) and parse its embedded data."""
import json
import re
import subprocess
import time
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "cache"
CACHE.mkdir(parents=True, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130 Safari/537.36")
BASE = "https://www.airbnb.co.in"


def fetch(url, cache_name, max_age_h=72):
    p = CACHE / cache_name
    if p.exists() and time.time() - p.stat().st_mtime < max_age_h * 3600 and p.stat().st_size > 5000:
        return p.read_text(encoding="utf-8", errors="replace")
    r = subprocess.run(["curl", "-sL", "--compressed", "-A", UA, "-H", "Accept-Language: en-IN,en;q=0.9",
                        "-w", "\n__STATUS__%{http_code}", url], capture_output=True, text=True, timeout=60)
    body, _, status = r.stdout.rpartition("\n__STATUS__")
    time.sleep(0.8)
    if status != "200":
        return None
    p.write_text(body, encoding="utf-8")
    return body


def deferred_state(html):
    m = re.search(r'<script id="data-deferred-state-0"[^>]*>(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def similarity(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.9
    return SequenceMatcher(None, a, b).ratio()


def ugc(o):
    if not isinstance(o, dict):
        return None
    c = o.get("content") or o.get("ugcContent") or o
    return c.get("localizedStringWithTranslationPreference") or c.get("localizedString") or c.get("source")


def html_to_text(h):
    if not h:
        return ""
    h = re.sub(r"<br\s*/?>", "\n", h)
    h = re.sub(r"</?b>", "", h)
    h = re.sub(r"<[^>]+>", "", h)
    for a, b in [("&amp;", "&"), ("&quot;", '"'), ("&#39;", "'"), ("&lt;", "<"), ("&gt;", ">"), ("&nbsp;", " ")]:
        h = h.replace(a, b)
    return re.sub(r"\n{3,}", "\n\n", h).strip()


def parse_listing(html, listing_id):
    """Return a dict of details from a /rooms/<id> page, or None."""
    st = deferred_state(html)
    if not st:
        return None
    try:
        node = st["niobeClientData"][0][1]["data"]["node"]
        pp = node["pdpPresentation"]
    except (KeyError, IndexError, TypeError):
        return None
    out = {"airbnbId": str(listing_id), "airbnbUrl": f"{BASE}/rooms/{listing_id}"}
    out["airbnbTitle"] = ugc(pp.get("title"))
    loc = pp.get("location") or {}
    out["lat"], out["lng"] = loc.get("latitude"), loc.get("longitude")
    out["locationSubtitle"] = loc.get("subtitle")
    ov = pp.get("overview") or {}
    out["overviewTitle"] = ov.get("title")
    out["overviewItems"] = ov.get("items") or []
    out["propertyType"] = (pp.get("sharingConfig") or {}).get("propertyType")
    out["personCapacity"] = pp.get("personCapacity")
    desc = (pp.get("descriptions") or {}).get("longDescriptionHtml")
    out["description"] = html_to_text(ugc(desc) if isinstance(desc, dict) else desc)
    # highlights
    hl = []
    for h in pp.get("highlights") or []:
        t = ugc(h.get("headline")) or (h.get("headline") or {}).get("text") if isinstance(h.get("headline"), dict) else None
        b = ugc(h.get("body")) if isinstance(h.get("body"), dict) else None
        if not t and isinstance(h.get("title"), str):
            t = h["title"]
        if t:
            hl.append({"title": t, "body": b})
    out["highlights"] = hl
    # amenities
    am = pp.get("amenities") or {}
    groups = []
    for g in am.get("seeAllAmenitiesGroups") or []:
        items = [{"title": a.get("title"), "icon": a.get("icon"), "available": a.get("available", True)}
                 for a in g.get("amenities") or [] if a.get("title")]
        if items:
            groups.append({"title": g.get("title"), "items": items})
    out["amenityGroups"] = groups
    preview = []
    for g in am.get("previewAmenitiesGroups") or []:
        preview += [{"title": a.get("title"), "icon": a.get("icon"), "available": a.get("available", True)}
                    for a in g.get("amenities") or [] if a.get("title")]
    out["amenityPreview"] = preview
    # quality
    q = pp.get("quality") or {}
    stats = ((q.get("listingRatingStats") or {}).get("overallRatingStats") or {})
    out["airbnbRating"] = stats.get("ratingAverage")
    try:
        out["airbnbReviews"] = int(stats.get("ratingCount")) if stats.get("ratingCount") is not None else None
    except ValueError:
        out["airbnbReviews"] = None
    out["isGuestFavorite"] = q.get("isGuestFavorite")
    out["isNewListing"] = q.get("isNewListing")
    out["categoryRatings"] = [{"label": c.get("label"), "rating": c.get("localizedRating")}
                              for c in q.get("categoryRatings") or [] if c.get("label")]
    # host
    hi = pp.get("hostInfo") or {}
    pd = hi.get("passportData") or {}
    out["host"] = {
        "name": pd.get("name"),
        "photo": pd.get("profilePictureUrl"),
        "isSuperhost": pd.get("isSuperhost"),
        "title": pd.get("titleText"),
        "stats": [{"label": s.get("label"), "value": s.get("value")} for s in pd.get("stats") or []],
    }
    # rules / safety
    def groups_of(x):
        res = []
        for g in (x or {}).get("groupItems") or []:
            items = [i.get("title") for i in g.get("items") or [] if i.get("title")]
            if items:
                res.append({"title": g.get("title"), "items": items})
        return res
    out["houseRules"] = groups_of(pp.get("rules"))
    out["safety"] = groups_of(pp.get("safetyAndProperty"))
    # sleeping arrangements
    sa = []
    for s in (pp.get("sleepingArrangements") or {}).get("stops") or []:
        d = [x.get("text") for x in ((s.get("description") or {}).get("descriptions") or []) if x.get("text")]
        sa.append({"name": s.get("name"), "beds": ", ".join(d)})
    out["sleeping"] = sa
    # photo tour (room-labelled) and all photo urls on page
    tour = []
    for s in (pp.get("mediaTour") or {}).get("stops") or []:
        imgs = [((i.get("image") or {}).get("uri")) for i in s.get("items") or [] if (i.get("image") or {}).get("uri")]
        if imgs:
            tour.append({"name": s.get("name"), "photos": imgs})
    out["photoTour"] = tour
    out["pagePhotoKeys"] = sorted(set(re.findall(r"/original/([0-9a-f-]{36})\.", html)))
    return out


def photo_key(url):
    m = re.search(r"/original/([0-9a-f-]{36})\.", url or "")
    return m.group(1) if m else None
