"""Read the two shortlist spreadsheets and write data/listings_base.json.

Run with: python3 -I scripts/extract.py
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

SOURCES = [
    ("nye", "udaipur_airbnb_nye_photos.xlsx"),
    ("pool", "udaipur_pool_villas_photos.xlsx"),
]

GUESTS = 6
NIGHTS = 3


def num(v):
    if v is None or v == "":
        return None
    try:
        return float(str(v).replace(",", "").strip())
    except ValueError:
        return None


def parse_rooms(s):
    s = (s or "").lower()
    out = {}
    for key, pat in [("bedrooms", r"(\d+)\s*bedroom"), ("beds", r"(\d+)\s*(?:\w+\s)?beds?\b"),
                     ("baths", r"(\d+(?:\.\d+)?)\s*(?:\w+\s)?bath")]:
        m = re.search(pat, s)
        out[key] = float(m.group(1)) if m else None
        if out[key] is not None and out[key].is_integer():
            out[key] = int(out[key])
    return out


def parse_rating(s):
    if not s:
        return None, None
    m = re.match(r"\s*([\d.]+)\s*(?:\((\d+)\))?", str(s))
    if not m:
        return None, None
    return float(m.group(1)), (int(m.group(2)) if m.group(2) else None)


def col(hdr, *names):
    for n in names:
        if n in hdr:
            return hdr.index(n)
    return None


def main():
    listings = []
    for kind, fname in SOURCES:
        ws = openpyxl.load_workbook(DATA / fname).worksheets[0]
        hdr = [c.value for c in ws[1]]
        c_total = col(hdr, "3-night price INR (before taxes)", "3-night total INR")
        c_ppn = col(hdr, "Per person per night (INR)", "Per person per night INR")
        c_rooms = col(hdr, "Bedrooms / beds / baths")
        c_rating = col(hdr, "Rating (reviews)")
        c_badges = col(hdr, "Badges")
        c_cancel = col(hdr, "Free cancellation")
        c_km = col(hdr, "km from City Palace")
        c_geo = col(hdr, "Google Maps (coords approx. ±150m)")
        c_note = col(hdr, "Note")
        c_urls = col(hdr, "All photo URLs")
        for r in ws.iter_rows(min_row=2, values_only=True):
            if not r[1]:
                continue
            urls = [u.strip() for u in re.split(r"\s+", r[c_urls] or "") if u.strip().startswith("http")]
            # de-dupe while keeping order
            seen, photos = set(), []
            for u in urls:
                if u not in seen:
                    seen.add(u)
                    photos.append(u)
            m = re.search(r"Hosting-(\d+)", r[c_urls] or "")
            rating, reviews = parse_rating(r[c_rating]) if c_rating is not None else (None, None)
            lat = lng = None
            if c_geo is not None and r[c_geo]:
                g = re.findall(r"-?\d+\.\d+", str(r[c_geo]))
                if len(g) >= 2:
                    lat, lng = float(g[0]), float(g[1])
            total = num(r[c_total])
            listings.append({
                "id": f"{kind}-{int(num(r[0]))}",
                "collection": kind,
                "rank": int(num(r[0])),
                "name": str(r[1]).strip(),
                "total": total,
                "perPersonNight": num(r[c_ppn]),
                "perPersonStay": round(total / GUESTS) if total else None,
                "perNight": round(total / NIGHTS) if total else None,
                "roomsText": r[c_rooms],
                **parse_rooms(r[c_rooms]),
                "rating": rating,
                "reviews": reviews,
                "badges": [b.strip() for b in re.split(r"[;,]", r[c_badges] or "") if b.strip()] if c_badges is not None else [],
                "freeCancellation": str(r[c_cancel] or "").strip().lower().startswith("y"),
                "kmFromCityPalace": num(r[c_km]) if c_km is not None else None,
                "lat": lat,
                "lng": lng,
                "geoSource": "sheet" if lat else None,
                "note": (r[c_note] if c_note is not None else None),
                "hostingIdFromPhotos": m.group(1) if m else None,
                "photos": photos,
            })
    out = DATA / "listings_base.json"
    out.write_text(json.dumps(listings, ensure_ascii=False, indent=1))
    print(f"wrote {len(listings)} listings -> {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
