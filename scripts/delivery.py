"""Estimate quick-commerce coverage per listing from public dark-store locations.

Dark stores: quickcommercemap.com (data/darkstores.json). Quick-commerce apps
usually serve roughly a 2-3 km radius around each dark store, a bit wider in
smaller cities. Straight-line distance, so it is an estimate, not a live check.
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
listings = json.loads((ROOT / "data" / "listings_enriched.json").read_text())
stores = json.loads((ROOT / "data" / "darkstores.json").read_text())

PLATFORMS = {"blinkit": "Blinkit", "zepto": "Zepto", "swiggy_instamart": "Instamart"}
LIKELY_KM = 3.0      # inside a typical delivery radius
BORDERLINE_KM = 5.0  # edge of zone; depends on exact address and the night


def km(a_lat, a_lng, b_lat, b_lng):
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lng - a_lng)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


for l in listings:
    res = {}
    for key, label in PLATFORMS.items():
        best = None
        for s in stores:
            if s["platform"] != key or l.get("lat") is None:
                continue
            d = km(l["lat"], l["lng"], s["lat"], s["lng"])
            if not best or d < best[0]:
                best = (d, s)
        if not best:
            continue
        d, s = best
        status = "likely" if d <= LIKELY_KM else "borderline" if d <= BORDERLINE_KM else "unlikely"
        res[key] = {"app": label, "status": status, "km": round(d, 1),
                    "store": s["name"], "storeArea": (s.get("props") or {}).get("area")}
    l["delivery"] = res
    l["deliveryScore"] = sum({"likely": 2, "borderline": 1}.get(v["status"], 0) for v in res.values())

(ROOT / "data" / "listings_enriched.json").write_text(json.dumps(listings, ensure_ascii=False, indent=1))
from collections import Counter
for key in PLATFORMS:
    print(key, Counter(l["delivery"][key]["status"] for l in listings), file=sys.stderr)
print("no app likely:", sum(1 for l in listings if not any(v["status"] == "likely" for v in l["delivery"].values())),
      file=sys.stderr)
