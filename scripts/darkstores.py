"""Parse dark-store points (all platforms) from quickcommercemap.com city pages -> data/darkstores.json."""
import html as H
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


def unwrap(v):
    # astro serialisation: [0, value] or [1, [ ... ]]
    if isinstance(v, list) and len(v) == 2 and v[0] in (0, 1):
        v = v[1]
        if isinstance(v, list):
            return [unwrap(x) for x in v]
        return unwrap(v)
    if isinstance(v, dict):
        return {k: unwrap(x) for k, x in v.items()}
    return v


stores = {}
for slug in ["blinkit", "zepto", "swiggy-instamart"]:
    page = subprocess.run(["curl", "-sL", "--compressed", "-A", UA,
                           f"https://quickcommercemap.com/platforms/{slug}/udaipur"],
                          capture_output=True, text=True).stdout
    for m in re.finditer(r'props="([^"]*stores[^"]*)"', page):
        props = unwrap(json.loads(H.unescape(m.group(1))))
        for f in props.get("stores") or []:
            p, g = f.get("properties", {}), f.get("geometry", {})
            c = g.get("coordinates")
            if not c:
                continue
            stores[p.get("slug")] = {"platform": p.get("platform"), "name": p.get("name"),
                                     "area": p.get("locality") or p.get("area") or p.get("neighbourhood"),
                                     "lng": c[0], "lat": c[1], "props": p}
out = list(stores.values())
(ROOT / "data" / "darkstores.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
from collections import Counter
print(Counter(s["platform"] for s in out), file=sys.stderr)
for s in out:
    print(s["platform"], s["name"], s["lat"], s["lng"], file=sys.stderr)
