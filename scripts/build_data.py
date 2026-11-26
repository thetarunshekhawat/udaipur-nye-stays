"""Write the compact data file the website loads: site/data/listings.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = json.loads((ROOT / "data" / "listings_enriched.json").read_text())
stores = json.loads((ROOT / "data" / "darkstores.json").read_text())

TRIP = {"checkIn": "2026-12-29", "checkOut": "2027-01-01", "nights": 3, "guests": 6,
        "city": "Udaipur", "pricesCheckedOn": "2026-11-26"}

LANDMARKS = [
    {"name": "City Palace", "lat": 24.5764, "lng": 73.6835},
    {"name": "Lake Pichola", "lat": 24.5720, "lng": 73.6790},
    {"name": "Fateh Sagar Lake", "lat": 24.6011, "lng": 73.6754},
    {"name": "Saheliyon ki Bari", "lat": 24.6013, "lng": 73.6865},
    {"name": "Udaipur City railway station", "lat": 24.5719, "lng": 73.7166},
    {"name": "Maharana Pratap Airport", "lat": 24.6177, "lng": 73.8961},
]


def clean_name(s):
    return re.sub(r"\s+", " ", s or "").strip()


def price_num(s):
    d = re.sub(r"[^0-9]", "", s or "")
    return int(d) if d else None


out = []
for l in src:
    total = int(l["total"]) if l.get("total") else None
    live = price_num(l.get("liveSearchPrice"))
    item = {
        "id": l["id"],
        "collection": l["collection"],
        "rank": l["rank"],
        "name": clean_name(l["name"]),
        "propertyType": l.get("propertyType"),
        "overviewTitle": l.get("overviewTitle"),
        "overview": l.get("overviewItems") or [],
        "bedrooms": l.get("bedrooms"), "beds": l.get("beds"), "baths": l.get("baths"),
        "roomsText": l.get("roomsText"),
        "capacity": l.get("personCapacity"),
        "total": total,
        "perPersonNight": int(l["perPersonNight"]) if l.get("perPersonNight") else None,
        "perPersonStay": l.get("perPersonStay"),
        "livePrice": live if live and live != total else None,
        "rating": l.get("rating"),
        "reviews": l.get("reviews"),
        "guestFavourite": bool(l.get("isGuestFavorite")) or any("favourite" in b.lower() for b in l.get("badges") or []),
        "topFavourite": any("top" in b.lower() for b in l.get("badges") or []),
        "isNew": not l.get("rating"),
        "freeCancellation": l.get("freeCancellation"),
        "kmFromCityPalace": l.get("kmFromCityPalace"),
        "lat": l.get("lat"), "lng": l.get("lng"),
        "area": l.get("locationSubtitle"),
        "note": l.get("note"),
        "airbnbUrl": l.get("airbnbUrl"),
        "photos": l["photos"],
        "photoLabels": l.get("photoLabels") or [],
        "description": l.get("description") or "",
        "highlights": l.get("highlights") or [],
        "amenityPreview": [a["title"] for a in l.get("amenityPreview") or [] if a.get("available", True)][:10],
        "amenityGroups": [{"title": g["title"], "items": [a["title"] for a in g["items"] if a.get("available", True)]}
                          for g in l.get("amenityGroups") or []],
        "notIncluded": [a["title"] for g in l.get("amenityGroups") or [] for a in g["items"] if not a.get("available", True)],
        "categoryRatings": l.get("categoryRatings") or [],
        "host": l.get("host") or {},
        "sleeping": [s for s in l.get("sleeping") or [] if s.get("beds")],
        "houseRules": l.get("houseRules") or [],
        "safety": l.get("safety") or [],
        "delivery": l.get("delivery") or {},
        "deliveryScore": l.get("deliveryScore", 0),
    }
    item["hasPool"] = item["collection"] == "pool" or any(
        "pool" in a.lower() for g in item["amenityGroups"] for a in g["items"])
    out.append(item)

# Distance from City Palace for every listing (NYE sheet lacks it)
import math
cp = LANDMARKS[0]
for i in out:
    if i["lat"] is not None:
        p1, p2 = math.radians(cp["lat"]), math.radians(i["lat"])
        dl = math.radians(i["lng"] - cp["lng"])
        h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        i["kmCityPalace"] = round(2 * 6371 * math.asin(math.sqrt(h)), 1)

site_data = ROOT / "site" / "data"
site_data.mkdir(parents=True, exist_ok=True)
payload = {"trip": TRIP, "landmarks": LANDMARKS,
           "stores": [{"app": s["platform"], "name": s["name"], "lat": s["lat"], "lng": s["lng"],
                       "area": (s.get("props") or {}).get("area")} for s in stores],
           "listings": out}
p = site_data / "listings.json"
p.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
print(f"wrote {p} ({p.stat().st_size // 1024} KB, {len(out)} listings)", file=sys.stderr)
