# Udaipur NYE stays

An Airbnb-style site for browsing the group's shortlist of 86 Udaipur stays for
**29 Dec 2026 – 1 Jan 2027, 6 guests**: 40 NYE homes and 46 pool villas.

Live site: https://thetarunshekhawat.github.io/udaipur-nye-stays/

## What it does

- Grid of listings with swipeable photo cards, ratings, badges, total and per-person prices.
- Two lists (NYE stays, Pool villas) plus an "All stays" view that shows each place once.
- Quick filters (free cancellation, guest favourite, pool, 3+ bedrooms, rated 4.8+, near City Palace,
  quick commerce), a filters panel (price per person, bedrooms, delivery apps) and sorting.
- Map view: price pins for every listing, dark stores for Blinkit, Zepto and Instamart with 3 km rings,
  and landmarks. Side by side on desktop, "Show map" button on phones.
- Listing page: photo grid, full gallery grouped by room, lightbox, host, highlights, description,
  sleeping arrangements, amenities, category ratings, location map, house rules, and a booking card
  with a "Check on Airbnb" link that opens the real listing with our dates and 6 guests.
- Shortlist: heart any stay (saved in that browser), then "Share my shortlist" makes a link like
  `#/saved/nye-3,pool-10` that friends can open and add to their own shortlist.

## Quick-commerce coverage

The "Likely / Borderline / Unlikely" labels are an **estimate**: straight-line distance from each listing's
approximate location to the nearest dark store of each app.

- Likely: nearest store within 3 km
- Borderline: 3–5 km
- Unlikely: over 5 km

Dark-store locations come from quickcommercemap.com (Udaipur: Blinkit 8, Zepto 4, Instamart 3).
The apps' own location checks block automated access, so they were not queried directly.
Airbnb listing locations are approximate (blurred by a few hundred metres), so check the app with the
exact address before relying on it, especially late on 31 Dec.

## Data pipeline

Source sheets: `data/udaipur_airbnb_nye_photos.xlsx`, `data/udaipur_pool_villas_photos.xlsx`.

```bash
python3 -I scripts/extract.py        # sheets -> data/listings_base.json
python3 -I scripts/search_index.py   # Airbnb search results for our dates -> data/search_index.json
python3 -I scripts/match.py          # sheet row -> Airbnb listing ID -> data/matches.json
python3 -I scripts/enrich.py         # listing page details -> data/listings_enriched.json
python3 -I scripts/darkstores.py     # dark-store points -> data/darkstores.json
python3 -I scripts/delivery.py       # coverage estimate, added to listings_enriched.json
python3 -I scripts/build_data.py     # compact site/data/listings.json
```

Matching: each sheet row is matched to the Airbnb search result with the same name **and** the exact same
3-night price for our dates (81 of 86). The other 5 are matched by photo overlap with the listing page.
All 86 matched. Two places (The Rainbow Villa, Mountain Villa Udaipur) are in both sheets.

Fetched pages are cached in `data/cache/` (not committed).

## Run locally

```bash
cd site && python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

No build step: `site/` is plain HTML, CSS and JavaScript with Leaflet and OpenStreetMap tiles.

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes `site/` to GitHub Pages.

## Changelog

- 2026-11-26: First version. Extracted 86 listings and 2,732 photos from both sheets; matched all 86 to their
  Airbnb listings; added descriptions, amenities, hosts, category ratings, house rules and locations;
  quick-commerce coverage estimate; Airbnb-style site with map, gallery and shareable shortlist; tested
  on desktop (1440 px) and phone (iPhone 14 emulation).
