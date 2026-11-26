"""Merge sheet data + matched Airbnb page details into data/listings_enriched.json."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from airbnb import BASE, fetch, parse_listing, photo_key  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
base = json.loads((ROOT / "data" / "listings_base.json").read_text())
matches = json.loads((ROOT / "data" / "matches.json").read_text())
index = json.loads((ROOT / "data" / "search_index.json").read_text())

out = []
for l in base:
    m = matches.get(l["id"]) or {}
    aid = m.get("airbnbId")
    rec = dict(l)
    rec["matchMethod"] = m.get("method")
    if aid:
        html = fetch(f"{BASE}/rooms/{aid}", f"room_{aid}.html")
        det = parse_listing(html, aid) if html else None
        if det:
            # room labels for sheet photos, from Airbnb's photo tour
            label = {}
            for stop in det.pop("photoTour"):
                for u in stop["photos"]:
                    k = photo_key(u)
                    if k:
                        label[k] = stop["name"]
            det.pop("pagePhotoKeys", None)
            rec["photoLabels"] = [label.get(photo_key(u)) for u in l["photos"]]
            sheet_lat, sheet_lng = l["lat"], l["lng"]
            rec.update(det)
            if not det.get("lat") and sheet_lat:
                rec["lat"], rec["lng"] = sheet_lat, sheet_lng
            rec["geoSource"] = "airbnb" if det.get("lat") else rec.get("geoSource")
            # fill rating gaps (pool sheet has none)
            if rec.get("rating") is None and det.get("airbnbRating"):
                rec["rating"], rec["reviews"] = det["airbnbRating"], det.get("airbnbReviews")
        s = index.get(aid)
        if s:
            rec["liveSearchPrice"] = s.get("price")
            rec["liveSearchPriceLabel"] = s.get("priceLabel")
    out.append(rec)

(ROOT / "data" / "listings_enriched.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
have = lambda k: sum(1 for r in out if r.get(k))
print(f"{len(out)} listings | url {have('airbnbUrl')} | coords {have('lat')} | desc {have('description')} | "
      f"amenities {have('amenityGroups')} | host {sum(1 for r in out if (r.get('host') or {}).get('name'))} | "
      f"rating {have('rating')} | catRatings {have('categoryRatings')} | live price {have('liveSearchPrice')}",
      file=sys.stderr)
