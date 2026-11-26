"""Match each sheet listing to its Airbnb listing ID.

Strategy: a listing page "matches" when its photos overlap the sheet's photos
(photo file UUIDs are unique per upload). Candidates come from the Hosting-<id>
in the sheet's photo URLs, then from Airbnb search result pages.
Writes data/matches.json: {sheet_id: {airbnbId, overlap, nameSim, method}}
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from airbnb import BASE, fetch, parse_listing, photo_key, similarity, deferred_state  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
base = json.loads((ROOT / "data" / "listings_base.json").read_text())
out_p = ROOT / "data" / "matches.json"
matches = json.loads(out_p.read_text()) if out_p.exists() else {}


def score(listing, airbnb_id):
    html = fetch(f"{BASE}/rooms/{airbnb_id}", f"room_{airbnb_id}.html")
    if not html:
        return None
    det = parse_listing(html, airbnb_id)
    if not det:
        return None
    sheet_keys = {photo_key(u) for u in listing["photos"]} - {None}
    page_keys = set(det["pagePhotoKeys"])
    overlap = len(sheet_keys & page_keys) / max(1, min(len(sheet_keys), len(page_keys)))
    return {"airbnbId": str(airbnb_id), "overlap": round(overlap, 2),
            "nameSim": round(similarity(listing["name"], det["airbnbTitle"]), 2),
            "airbnbTitle": det["airbnbTitle"]}


def ids_in_photos(listing):
    ids = []
    for u in listing["photos"]:
        for m in re.findall(r"Hosting-(\d+)", u):
            if m not in ids:
                ids.append(m)
    return ids


def good(s):
    return s and (s["overlap"] >= 0.5 or (s["nameSim"] >= 0.9 and s["overlap"] >= 0.2))


INDEX_P = ROOT / "data" / "search_index.json"
index = json.loads(INDEX_P.read_text()) if INDEX_P.exists() else {}


def price_num(s):
    d = re.sub(r"[^0-9]", "", s or "")
    return int(d) if d else None


def from_index(l):
    """Best search-result candidate: same name and the exact same 3-night price."""
    best = None
    for aid, r in index.items():
        ns = similarity(l["name"], r.get("name") or "")
        same_price = l["total"] and price_num(r.get("price")) == int(l["total"])
        if ns >= 0.85 and same_price and (not best or ns > best[0]):
            best = (ns, aid)
    return best


def main():
    for l in base:
        hit = from_index(l)
        if hit:
            s = score(l, hit[1]) or {"airbnbId": hit[1], "overlap": None, "nameSim": round(hit[0], 2)}
            s["method"] = "search-name+price"
            matches[l["id"]] = s
            print(l["id"], l["name"][:40], "->", s, file=sys.stderr)
            continue
        if l["id"] in matches and matches[l["id"]].get("airbnbId") and matches[l["id"]].get("nameSim", 0) >= 0.8:
            continue
        best = None
        for cid in ids_in_photos(l)[:4]:
            s = score(l, cid)
            if s and (not best or (s["overlap"], s["nameSim"]) > (best["overlap"], best["nameSim"])):
                best = s
            if good(best):
                break
        if good(best):
            best["method"] = "photo-hosting-id"
            matches[l["id"]] = best
        else:
            matches[l["id"]] = {"airbnbId": None, "bestTry": best}
        print(l["id"], l["name"][:40], "->", matches[l["id"]], file=sys.stderr)
        out_p.write_text(json.dumps(matches, ensure_ascii=False, indent=1))
    out_p.write_text(json.dumps(matches, ensure_ascii=False, indent=1))
    ok = sum(1 for v in matches.values() if v.get("airbnbId"))
    print(f"matched {ok}/{len(base)}", file=sys.stderr)


if __name__ == "__main__":
    main()
