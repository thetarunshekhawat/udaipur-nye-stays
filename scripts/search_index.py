"""Page through Airbnb search results for our dates and build data/search_index.json
({airbnbId: {name, lat, lng, photoKeys, price, rating}}).
"""
import base64
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlencode

sys.path.insert(0, str(Path(__file__).resolve().parent))
from airbnb import BASE, deferred_state, fetch, photo_key  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "search_index.json"

COMMON = {"checkin": "2026-12-29", "checkout": "2027-01-01", "adults": "6"}
QUERIES = [
    ("pool", {"amenities[]": "7"}),
    ("entire", {"room_types[]": "Entire home/apt"}),
    ("entire-cheap", {"room_types[]": "Entire home/apt", "price_max": "9000"}),
    ("pool-cheap", {"amenities[]": "7", "price_max": "9000"}),
    ("all", {}),
    ("pool-3br", {"amenities[]": "7", "min_bedrooms": "3"}),
    ("pool-4br", {"amenities[]": "7", "min_bedrooms": "4"}),
    ("pool-5br", {"amenities[]": "7", "min_bedrooms": "5"}),
    ("pool-9-11k", {"amenities[]": "7", "price_min": "9000", "price_max": "11000"}),
    ("pool-11-13k", {"amenities[]": "7", "price_min": "11000", "price_max": "13000"}),
    ("pool-13-16k", {"amenities[]": "7", "price_min": "13000", "price_max": "16000"}),
    ("entire-9-11k", {"room_types[]": "Entire home/apt", "price_min": "9000", "price_max": "11000"}),
    ("entire-3br-cheap", {"room_types[]": "Entire home/apt", "min_bedrooms": "3", "price_max": "12000"}),
]
MAX_PAGES = 15


def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)


def decode_id(gid):
    try:
        return base64.b64decode(gid).decode().split(":")[-1]
    except Exception:
        return None


def parse_results(st):
    res = {}
    for d in walk(st):
        if d.get("__typename") != "StaySearchResult":
            continue
        dsl = d.get("demandStayListing") or {}
        lid = decode_id(dsl.get("id") or "")
        if not lid:
            continue
        name = ((dsl.get("description") or {}).get("name") or {}).get("localizedStringWithTranslationPreference")
        coord = ((dsl.get("location") or {}).get("coordinate") or {})
        pics = [p.get("picture") for p in d.get("contextualPictures") or [] if p.get("picture")]
        price = (((d.get("structuredDisplayPrice") or {}).get("primaryLine")) or {})
        res[lid] = {
            "name": name or d.get("title"),
            "cardTitle": d.get("title"),
            "lat": coord.get("latitude"), "lng": coord.get("longitude"),
            "photoKeys": [k for k in (photo_key(u) for u in pics) if k],
            "priceLabel": price.get("accessibilityLabel"),
            "price": price.get("discountedPrice") or price.get("price"),
            "rating": d.get("avgRatingLocalized"),
        }
    return res


def cursors(st):
    for d in walk(st):
        if isinstance(d.get("pageCursors"), list):
            return d["pageCursors"]
    return []


def main():
    index = json.loads(OUT.read_text()) if OUT.exists() else {}
    for tag, extra in QUERIES:
        params = {**COMMON, **extra}
        url0 = f"{BASE}/s/Udaipur--Rajasthan--India/homes?" + urlencode(params)
        html = fetch(url0, f"search_{tag}_0.html", max_age_h=24)
        st = deferred_state(html) if html else None
        if not st:
            print(tag, "no results page", file=sys.stderr)
            continue
        cur = cursors(st)
        found = parse_results(st)
        for i, c in enumerate(cur[1:MAX_PAGES], start=1):
            h = fetch(url0 + "&" + urlencode({"cursor": c}), f"search_{tag}_{i}.html", max_age_h=24)
            s2 = deferred_state(h) if h else None
            if s2:
                found.update(parse_results(s2))
        new = sum(1 for k in found if k not in index)
        index.update(found)
        print(f"{tag}: {len(found)} listings ({new} new), pages={min(len(cur), MAX_PAGES)}", file=sys.stderr)
        OUT.write_text(json.dumps(index, ensure_ascii=False, indent=1))
    print("index size", len(index), file=sys.stderr)


if __name__ == "__main__":
    main()
