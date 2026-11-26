/* Udaipur NYE stays: a static shortlist viewer (no build step). */
(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => (n == null ? "" : "₹" + Math.round(n).toLocaleString("en-IN"));
  const kInr = (n) => (n >= 100000 ? "₹" + (n / 100000).toFixed(1) + "L" : "₹" + (n / 1000).toFixed(n >= 10000 ? 1 : 1).replace(/\.0$/, "") + "k");
  const img = (u, w = 720) => (u ? u.split("?")[0] + "?im_w=" + w : "");
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const ICON = {
    star: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M15.1 1.58 11.3 9.4l-8.6 1.25c-.8.12-1.12 1.1-.54 1.66l6.22 6.06-1.47 8.57c-.14.8.7 1.4 1.42 1.03L16 23.92l7.7 4.05c.72.38 1.56-.23 1.42-1.03l-1.47-8.57 6.22-6.06c.58-.56.26-1.54-.54-1.66L20.7 9.4l-3.8-7.82a1 1 0 0 0-1.8 0Z" fill="currentColor"/></svg>',
    heart: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28c7-4.7 14-10 14-17 0-3.9-3.1-7-7-7-2.8 0-5.2 1.7-7 4-1.8-2.3-4.2-4-7-4-3.9 0-7 3.1-7 7 0 7 7 12.3 14 17Z"/></svg>',
    left: '<svg viewBox="0 0 32 32" width="12" height="12" aria-hidden="true"><path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
    right: '<svg viewBox="0 0 32 32" width="12" height="12" aria-hidden="true"><path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28" fill="none" stroke="currentColor" stroke-width="4"/></svg>',
    close: '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path d="m6 6 20 20M26 6 6 26" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    share: '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path d="M27 18v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9M16 3v20M9 10l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    grid: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 1h4v4H1zM6 1h4v4H6zM11 1h4v4h-4zM1 6h4v4H1zM6 6h4v4H6zM11 6h4v4h-4zM1 11h4v4H1zM6 11h4v4H6zM11 11h4v4h-4z" fill="currentColor"/></svg>',
    map: '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path d="m11 4 10 4 8-3v22l-8 3-10-4-8 3V7l8-3Zm0 3-5 2v15l5-2V7Zm2 0v15l6 2.4v-15L13 7Zm8 2.4v15l5-1.9v-15l-5 1.9Z" fill="currentColor"/></svg>',
    list: '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path d="M3 6h4v4H3zM10 7h19v2H10zM3 14h4v4H3zM10 15h19v2H10zM3 22h4v4H3zM10 23h19v2H10z" fill="currentColor"/></svg>',
    filter: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 1.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1ZM11 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 1.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1ZM1 4.25h7v1.5H1zM14 4.25h1v1.5h-1zM1 9.25h1v1.5H1zM8 9.25h7v1.5H8z" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 32 32" width="14" height="14" aria-hidden="true"><path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    all: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 3 15h4v13h18V15h4L16 4Zm0 3.3L23 13v13h-5v-7h-4v7H9V13l7-5.7Z" fill="currentColor"/></svg>',
    nye: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2v5M16 25v5M2 16h5M25 16h5M6 6l3.5 3.5M22.5 22.5 26 26M26 6l-3.5 3.5M9.5 22.5 6 26" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="4" fill="currentColor"/></svg>',
    pool: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 4a3 3 0 0 1 3 3v13h-2v-4H9v4H7V7a1 1 0 0 0-2 0H3a3 3 0 0 1 3-3h4Zm-1 3v7h2V7a1 1 0 0 0-1-1H8.8c.1.3.2.6.2 1ZM23 4a3 3 0 0 1 3 3v13h-2v-4h-2v4h-2V7a1 1 0 0 0-2 0h-2a3 3 0 0 1 3-3h4Zm-1 3v7h2V7a1 1 0 0 0-1-1h-1.2c.1.3.2.6.2 1ZM2 23c2 0 3 1.5 5 1.5S10 23 12 23s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5 3-1.5 3-1.5v2.2c-.8.6-1.8 1.3-3 1.3-2 0-3-1.5-5-1.5s-3 1.5-5 1.5-3-1.5-5-1.5-3 1.5-5 1.5-3-1.5-5-1.5V23Z" fill="currentColor"/></svg>',
    saved: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28c7-4.7 14-10 14-17 0-3.9-3.1-7-7-7-2.8 0-5.2 1.7-7 4-1.8-2.3-4.2-4-7-4-3.9 0-7 3.1-7 7 0 7 7 12.3 14 17Z" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    trophy: '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path d="M8 3h16v3h5v4a6 6 0 0 1-6 6h-.4A8 8 0 0 1 17 20.9V25h5v4H10v-4h5v-4.1A8 8 0 0 1 9.4 16H9a6 6 0 0 1-6-6V6h5V3Zm0 5H5v2a4 4 0 0 0 3.2 3.9A8 8 0 0 1 8 12V8Zm19 0h-3v4c0 .7-.1 1.3-.2 1.9A4 4 0 0 0 27 10V8Z" fill="currentColor"/></svg>',
    bed: '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true"><path d="M26 4a2 2 0 0 1 2 2v10.3c1.2.7 2 2 2 3.4V28h-2v-3H4v3H2v-8.3c0-1.4.8-2.7 2-3.4V6c0-1.1.9-2 2-2h20ZM26 18H6a2 2 0 0 0-2 2v3h24v-3a2 2 0 0 0-2-2ZM26 6H6v10h2v-3c0-1.1.9-2 2-2h4c.8 0 1.5.4 1.8 1h.4c.3-.6 1-1 1.8-1h4c1.1 0 2 .9 2 2v3h2V6Zm-12 7h-4v3h4v-3Zm8 0h-4v3h4v-3Z" fill="currentColor"/></svg>',
  };
  const AMEN_ICON = [
    [/wifi/i, '<path d="M16 24a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0-6c2.4 0 4.6.9 6.3 2.4l-1.4 1.4A7 7 0 0 0 16 20a7 7 0 0 0-4.9 1.8l-1.4-1.4A9 9 0 0 1 16 18Zm0-6c4 0 7.6 1.5 10.3 4l-1.4 1.4A12.9 12.9 0 0 0 16 14c-3.4 0-6.6 1.3-8.9 3.4L5.7 16A15 15 0 0 1 16 12Zm0-6c5.6 0 10.7 2.1 14.6 5.6l-1.4 1.4A19 19 0 0 0 16 8 19 19 0 0 0 2.8 13l-1.4-1.4A21 21 0 0 1 16 6Z"/>'],
    [/kitchen|cooking|microwave|oven|stove/i, '<path d="M26 1a5 5 0 0 1 5 5c0 6.4-1.7 10.8-5 12.9V31h-2V1h2Zm-9 0v7a5 5 0 0 1-4 4.9V31h-2V12.9A5 5 0 0 1 7 8V1h2v7a3 3 0 0 0 2 2.8V1h2v9.8A3 3 0 0 0 15 8V1h2Z"/>'],
    [/parking|car|ev charger/i, '<path d="M26 19a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM7 19a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm13.7-13a3 3 0 0 1 2.6 1.5L26 13h2c1.7 0 3 1.3 3 3v7h-2v-7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v7H2v-7c0-1.7 1.3-3 3-3h2.4l3.3-5.6A3 3 0 0 1 13.3 6h7.4Zm0 2h-7.4a1 1 0 0 0-.9.5L9.7 13h14l-2.2-4.5a1 1 0 0 0-.8-.5Z"/>'],
    [/tv|hdtv|television|projector/i, '<path d="M9 29v-2h2v-2H6a5 5 0 0 1-5-4.8V8a5 5 0 0 1 4.8-5H26a5 5 0 0 1 5 4.8V20a5 5 0 0 1-4.8 5H21v2h2v2H9Zm10-4h-6v2h6v-2Zm7-20H6a3 3 0 0 0-3 2.8V20a3 3 0 0 0 2.8 3H26a3 3 0 0 0 3-2.8V8a3 3 0 0 0-2.8-3Z"/>'],
    [/air con|ac –|ac -|heating|fan/i, '<path d="M17 1v4.03l4.03-2.32 1 1.73L17 7.34v6.93l6-3.46V5h2v4.65l3.49-2.02 1 1.74L26 11.38l4.03 2.33-1 1.73L24 12.54 18 16l6 3.46 5.03-2.9 1 1.73L26 20.62l3.49 2.01-1 1.74L25 22.35V27h-2v-5.81l-6-3.46v6.93l5.03 2.9-1 1.73L17 26.97V31h-2v-4.03l-4.03 2.32-1-1.73L15 24.66v-6.93l-6 3.46V27H7v-4.65l-3.49 2.02-1-1.74L6 20.62l-4.03-2.33 1-1.73L8 19.46 14 16l-6-3.46-5.03 2.9-1-1.73L6 11.38 2.51 9.37l1-1.74L7 9.65V5h2v5.81l6 3.46V7.34l-5.03-2.9 1-1.73L15 5.03V1h2Z"/>'],
    [/pool|hot tub|bath/i, '<path d="M24 26c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 28c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 26ZM20 3a4 4 0 0 1 4 3.8V9h-2V7a2 2 0 0 0-1.85-2H20a2 2 0 0 0-2 1.85V11h6v2h-6v4h6v2h-6v3.12a3.95 3.95 0 0 1-2-1.12 3.98 3.98 0 0 0-.67-.5V7a4 4 0 0 1 4-4ZM12 3a4 4 0 0 1 4 3.8V9h-2V7a2 2 0 0 0-1.85-2H12a2 2 0 0 0-2 1.85V21.5a3.97 3.97 0 0 0-2 .5V7a4 4 0 0 1 4-4Z"/>'],
    [/workspace|desk/i, '<path d="M26 2a5 5 0 0 1 5 4.8V22a2 2 0 0 1-1.8 2H22v4h3v2H7v-2h3v-4H3a2 2 0 0 1-2-1.8V7a5 5 0 0 1 4.8-5H26ZM20 24h-8v4h8v-4Zm9-4H3v2h26v-2ZM26 4H6a3 3 0 0 0-3 2.8V18h26V7a3 3 0 0 0-2.8-3Z"/>'],
    [/camera/i, '<path d="M23 3a2 2 0 0 1 2 1.85v1.67l5-2.5v11.96l-5-2.5V15a2 2 0 0 1-1.85 2H17v4h-6v-4H5a2 2 0 0 1-2-1.85V5a2 2 0 0 1 1.85-2H23Zm-8 14h-2v2h2v-2Zm8-12H5v10h18V5Zm5 2.24-3 1.5v2.52l3 1.5V7.24Z"/>'],
    [/pet/i, '<path d="M13.7 13.93a4 4 0 0 1 5.28.6l.29.37 4.77 6.75a4 4 0 0 1 .6 3.34 4 4 0 0 1-4.5 2.91l-.4-.08-3.48-.93a1 1 0 0 0-.52 0l-3.47.93a4 4 0 0 1-2.94-.35l-.4-.25a4 4 0 0 1-1.2-5.2l.23-.37 4.77-6.75a4 4 0 0 1 .96-.97ZM5.5 10a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm21 0a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM12 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm8 0a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"/>'],
    [/washing|washer|dryer/i, '<path d="M26 2a3 3 0 0 1 3 2.82V27a3 3 0 0 1-2.82 3H6a3 3 0 0 1-3-2.82V5a3 3 0 0 1 2.82-3H26Zm1 8H5v17a1 1 0 0 0 .88 1H26a1 1 0 0 0 1-.88V10ZM16 12a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM26 4H6a1 1 0 0 0-1 .88V8h22V5a1 1 0 0 0-.88-1H26ZM8 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>'],
    [/view|garden|lake|mountain|valley|skyline|beach/i, '<path d="m28 23-8-12-4.6 6.9L12 13 4 23h24ZM12 16.4l2.2 3.1L13.3 21H8.2l3.8-4.6ZM20 14.6l4.3 6.4H15.7l4.3-6.4ZM24 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>'],
    [/fireplace|firepit/i, '<path d="M16 2c1 4 5 7 5 12a5 5 0 0 1-10 0c0-2 .7-3.4 2-5-.1 2 .5 3.5 2 4 0-4 0-7 1-11Zm-8 24h16v2H8v-2Z"/>'],
    [/balcony|patio|terrace/i, '<path d="M23 1a2 2 0 0 1 2 1.85V19h4v2h-2v8h2v2H3v-2h2v-8H3v-2h4V3a2 2 0 0 1 1.85-2H23Zm-2 20h-4v8h4v-8Zm-6 0h-4v8h4v-8Zm-6 0H7v8h2v-8Zm16 0h-2v8h2v-8Zm-2-18H9v16h14V3Z"/>'],
  ];
  const amenIcon = (t) => {
    const hit = AMEN_ICON.find(([re]) => re.test(t));
    return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">${hit ? hit[1] : '<path d="M16 3a13 13 0 1 1 0 26 13 13 0 0 1 0-26Zm6 8.6-8 8-4-4-1.4 1.4 5.4 5.4 9.4-9.4-1.4-1.4Z"/>'}</svg>`;
  };
  const HL_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 1c.8 0 1.5.5 1.8 1.2l3 7 7.5.7c.8 0 1.4.6 1.7 1.3.2.8 0 1.6-.6 2.1l-5.7 5 1.7 7.4c.2.8-.1 1.6-.8 2-.6.5-1.5.5-2.2.1L16 24l-6.5 3.9a2 2 0 0 1-2.2-.1 2 2 0 0 1-.8-2l1.7-7.4-5.7-5a2 2 0 0 1-.6-2.1c.3-.8.9-1.3 1.7-1.3l7.5-.7 3-7C14.4 1.5 15.2 1 16 1Zm0 2.1-3.4 7.8-8.5.7 6.4 5.6-1.9 8.3 7.4-4.4 7.4 4.4-1.9-8.3 6.4-5.6-8.5-.7L16 3Z"/></svg>';

  const APPS = [
    { key: "blinkit", name: "Blinkit", short: "B" },
    { key: "zepto", name: "Zepto", short: "Z" },
    { key: "swiggy_instamart", name: "Instamart", short: "I" },
  ];
  const STATUS_TXT = { likely: "Likely delivers", borderline: "Borderline", unlikely: "Unlikely" };

  // ---------- state ----------
  let DATA, BY_ID = {};
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const S = {
    cat: store.get("udr_cat", "all"),
    sort: store.get("udr_sort", "recommended"),
    showMap: store.get("udr_map", true),
    showStores: store.get("udr_stores", true),
    quick: new Set(store.get("udr_quick", [])),
    f: Object.assign({ min: null, max: null, minBedrooms: 0, apps: [] }, store.get("udr_f", {})),
    saved: new Set(store.get("udr_saved", [])),
    visited: new Set(store.get("udr_visited", [])),
    mobileMap: false,
  };
  const persist = () => {
    store.set("udr_cat", S.cat); store.set("udr_sort", S.sort); store.set("udr_map", S.showMap);
    store.set("udr_stores", S.showStores); store.set("udr_quick", [...S.quick]); store.set("udr_f", S.f);
    store.set("udr_saved", [...S.saved]); store.set("udr_visited", [...S.visited]);
  };

  const QUICK = [
    { id: "free", label: "Free cancellation", test: (l) => l.freeCancellation },
    { id: "fav", label: "Guest favourite", test: (l) => l.guestFavourite },
    { id: "qc", label: "Quick commerce likely", dot: "#0b6b13", test: (l) => Object.values(l.delivery).some((d) => d.status === "likely") },
    { id: "all3", label: "All 3 apps likely", test: (l) => APPS.every((a) => l.delivery[a.key]?.status === "likely") },
    { id: "pool", label: "Has a pool", test: (l) => l.hasPool },
    { id: "br3", label: "3+ bedrooms", test: (l) => (l.bedrooms || 0) >= 3 },
    { id: "r48", label: "Rated 4.8+", test: (l) => (l.rating || 0) >= 4.8 },
    { id: "near", label: "Within 5 km of City Palace", test: (l) => (l.kmCityPalace ?? 99) <= 5 },
  ];
  const SORTS = {
    recommended: { label: "Our order", fn: (a, b) => (a.collection === b.collection ? a.rank - b.rank : a.collection === "nye" ? -1 : 1) },
    priceAsc: { label: "Price: low to high", fn: (a, b) => a.total - b.total },
    priceDesc: { label: "Price: high to low", fn: (a, b) => b.total - a.total },
    rating: { label: "Top rated", fn: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0) },
    distance: { label: "Closest to City Palace", fn: (a, b) => (a.kmCityPalace ?? 99) - (b.kmCityPalace ?? 99) },
    delivery: { label: "Best quick-commerce", fn: (a, b) => b.deliveryScore - a.deliveryScore || a.total - b.total },
  };

  function inCat(l, cat) {
    if (cat === "nye") return l.collection === "nye";
    if (cat === "pool") return l.collection === "pool";
    return true;
  }
  function uniqueAll(list) {
    // "All" shows each Airbnb listing once (two places are in both sheets)
    const seen = new Set();
    return list.filter((l) => { const k = l.airbnbUrl || l.id; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function filtered() {
    let list = DATA.listings.filter((l) => inCat(l, S.cat));
    if (S.cat === "all") list = uniqueAll(list);
    for (const q of QUICK) if (S.quick.has(q.id)) list = list.filter(q.test);
    const { min, max, minBedrooms, apps } = S.f;
    if (min) list = list.filter((l) => l.perPersonStay >= min);
    if (max) list = list.filter((l) => l.perPersonStay <= max);
    if (minBedrooms) list = list.filter((l) => (l.bedrooms || 0) >= minBedrooms);
    if (apps.length) list = list.filter((l) => apps.every((a) => l.delivery[a]?.status === "likely"));
    return list.sort(SORTS[S.sort].fn);
  }
  const filterCount = () => (S.f.min ? 1 : 0) + (S.f.max ? 1 : 0) + (S.f.minBedrooms ? 1 : 0) + S.f.apps.length;

  // ---------- small UI bits ----------
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function updateSavedCount() {
    const c = $("#savedcount"); c.textContent = S.saved.size; c.classList.toggle("zero", !S.saved.size);
  }
  function toggleSave(id) {
    if (S.saved.has(id)) { S.saved.delete(id); toast("Removed from your shortlist"); }
    else { S.saved.add(id); toast("Saved to your shortlist"); }
    persist(); updateSavedCount();
    $$(`[data-heart="${id}"]`).forEach((b) => { b.classList.toggle("on", S.saved.has(id)); b.setAttribute("aria-pressed", S.saved.has(id)); });
    const pin = markerById[id]; if (pin) pin.getElement()?.querySelector(".ppin")?.classList.toggle("saved", S.saved.has(id));
  }
  const typeLine = (l) => {
    const t = (l.propertyType || "Home").replace(/^Entire /, "");
    return `${t[0].toUpperCase() + t.slice(1)} in Udaipur`;
  };
  const kmLine = (l) => (l.kmCityPalace != null ? `${l.kmCityPalace} km from City Palace` : "");
  const ratingHtml = (l) => l.rating
    ? `<span class="r">${ICON.star}${l.rating.toFixed(2).replace(/0$/, "")}${l.reviews ? ` (${l.reviews})` : ""}</span>`
    : `<span class="r">${ICON.star}New</span>`;
  const qcBadges = (l) => `<div class="qc">${APPS.map((a) => {
    const d = l.delivery[a.key]; if (!d) return "";
    return `<span class="${d.status}" title="${esc(a.name)}: ${esc(STATUS_TXT[d.status])}, nearest store ${d.km} km">${esc(a.name)}</span>`;
  }).join("")}</div>`;

  function cardHtml(l) {
    const photos = l.photos.slice(0, 6);
    const badge = l.topFavourite ? `<span class="pill-badge">${ICON.trophy} Top guest favourite</span>`
      : l.guestFavourite ? `<span class="pill-badge">Guest favourite</span>`
      : l.isNew ? `<span class="pill-badge">New</span>` : "";
    return `<a class="card" href="#/l/${l.id}" data-id="${l.id}">
      <div class="media">
        <div class="track-img" data-i="0">${photos.map((p, i) => `<img ${i ? 'data-src' : 'src'}="${esc(img(p))}" alt="" ${i ? "" : 'loading="lazy"'} decoding="async">`).join("")}</div>
        ${badge}
        <button class="heart ${S.saved.has(l.id) ? "on" : ""}" data-heart="${l.id}" aria-label="Save ${esc(l.name)}" aria-pressed="${S.saved.has(l.id)}">${ICON.heart}</button>
        <button class="nav prev" data-dir="-1" aria-label="Previous photo" hidden>${ICON.left}</button>
        <button class="nav next" data-dir="1" aria-label="Next photo" ${photos.length < 2 ? "hidden" : ""}>${ICON.right}</button>
        <div class="dots">${photos.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
      </div>
      <div class="meta">
        <div class="row1"><span class="t">${esc(typeLine(l))}</span>${ratingHtml(l)}</div>
        <div class="l">${esc(l.name)}</div>
        <div class="l">${esc([l.bedrooms && plural(l.bedrooms, "bedroom"), l.beds && plural(l.beds, "bed"), kmLine(l)].filter(Boolean).join(" · "))}</div>
        <div class="p"><b>${inr(l.total)}</b> for 3 nights</div>
        <div class="pp">${inr(l.perPersonStay)} per person · ${inr(l.perPersonNight)}/person/night</div>
        ${qcBadges(l)}
      </div>
    </a>`;
  }

  function wireCards(root) {
    root.addEventListener("click", (e) => {
      const heart = e.target.closest("[data-heart]");
      if (heart) { e.preventDefault(); e.stopPropagation(); toggleSave(heart.dataset.heart); return; }
      const nav = e.target.closest(".nav");
      if (nav) {
        e.preventDefault(); e.stopPropagation();
        const media = nav.closest(".media"), track = $(".track-img", media);
        const imgs = $$("img", track), n = imgs.length;
        let i = Math.max(0, Math.min(n - 1, +track.dataset.i + +nav.dataset.dir));
        track.dataset.i = i;
        [i, i + 1].forEach((k) => { const im = imgs[k]; if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });
        track.style.transform = `translateX(${-100 * i}%)`;
        $$(".dots i", media).forEach((d, k) => d.classList.toggle("on", k === i));
        $(".prev", media).hidden = i === 0; $(".next", media).hidden = i === n - 1;
      }
    });
    // touch swipe on cards
    let sx = 0, sy = 0, tgt = null;
    root.addEventListener("touchstart", (e) => { const m = e.target.closest(".media"); if (!m) return; tgt = m; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (!tgt) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { const b = $(dx < 0 ? ".next" : ".prev", tgt); if (b && !b.hidden) b.click(); tgt.dataset.swiped = "1"; }
      tgt = null;
    });
    root.addEventListener("click", (e) => { const m = e.target.closest(".media"); if (m && m.dataset.swiped) { e.preventDefault(); delete m.dataset.swiped; } }, true);
    root.addEventListener("mouseover", (e) => { const c = e.target.closest(".card"); if (c) highlightPin(c.dataset.id, true); });
    root.addEventListener("mouseout", (e) => { const c = e.target.closest(".card"); if (c && !c.contains(e.relatedTarget)) highlightPin(c.dataset.id, false); });
  }

  // ---------- map ----------
  let map = null, markerById = {}, storeLayer = null;
  const TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  function baseMap(el, opts = {}) {
    const m = L.map(el, { zoomControl: true, scrollWheelZoom: true, ...opts });
    L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19 }).addTo(m);
    return m;
  }
  function storeMarkers(withRadius) {
    const g = L.layerGroup();
    for (const s of DATA.stores) {
      const a = APPS.find((x) => x.key === s.app);
      if (withRadius) L.circle([s.lat, s.lng], { radius: 3000, color: getComputedStyle(document.documentElement).getPropertyValue(`--${s.app === "swiggy_instamart" ? "instamart" : s.app}`).trim() || "#888", weight: 1, opacity: .5, fillOpacity: .05, interactive: false }).addTo(g);
      L.marker([s.lat, s.lng], { icon: L.divIcon({ className: "", html: `<div class="store-dot ${s.app}">${a.short}</div>`, iconSize: [0, 0] }), keyboard: false, zIndexOffset: -500 })
        .bindTooltip(`${esc(a.name)} dark store · ${esc(s.area || s.name)}`).addTo(g);
    }
    return g;
  }
  function landmarkMarkers() {
    const g = L.layerGroup();
    for (const p of DATA.landmarks) L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="lmk ${p.name === "City Palace" ? "main" : ""}">${esc(p.name)}</div>`, iconSize: [0, 0] }), keyboard: false, interactive: false, zIndexOffset: -800 }).addTo(g);
    return g;
  }
  function mapCard(l) {
    return `<a class="mapcard" href="#/l/${l.id}"><img src="${esc(img(l.photos[0], 480))}" alt="">
      <div class="b"><div class="row1" style="display:flex;justify-content:space-between;gap:8px"><span class="t">${esc(typeLine(l))}</span>${ratingHtml(l)}</div>
      <div class="muted">${esc(l.name)}</div><div style="margin-top:4px"><b>${inr(l.total)}</b> for 3 nights · ${inr(l.perPersonStay)}/person</div>${qcBadges(l)}</div></a>`;
  }
  function buildResultsMap(el, list) {
    if (map) { map.remove(); map = null; }
    markerById = {};
    map = baseMap(el);
    landmarkMarkers().addTo(map);
    storeLayer = storeMarkers(true);
    if (S.showStores) storeLayer.addTo(map);
    const pts = [];
    for (const l of list) {
      if (l.lat == null) continue;
      pts.push([l.lat, l.lng]);
      const cls = ["ppin", l.collection === "pool" ? "pool" : "", S.saved.has(l.id) ? "saved" : "", S.visited.has(l.id) ? "visited" : ""].join(" ");
      const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<div class="${cls}">${kInr(l.total)}</div>`, iconSize: [0, 0] }), riseOnHover: true })
        .bindPopup(mapCard(l), { closeButton: true, offset: [0, -8], autoPanPaddingTopLeft: [20, 60] })
        .addTo(map);
      m.on("mouseover", () => { const c = $(`.card[data-id="${l.id}"]`); c && c.classList.add("hl"); });
      m.on("mouseout", () => { const c = $(`.card[data-id="${l.id}"]`); c && c.classList.remove("hl"); });
      markerById[l.id] = m;
    }
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 }); else map.setView([24.585, 73.71], 12);
    const order = list.filter((l) => markerById[l.id]).sort((a, b) => (S.saved.has(b.id) - S.saved.has(a.id)));
    const declutter = () => {
      const placed = [];
      for (const l of order) {
        const m = markerById[l.id], el = m.getElement()?.querySelector(".ppin"); if (!el) continue;
        const pt = map.latLngToContainerPoint(m.getLatLng());
        const w = 62, h = 28;
        const hit = placed.some((q) => Math.abs(q.x - pt.x) < w && Math.abs(q.y - pt.y) < h);
        el.classList.toggle("mini", hit);
        m.setZIndexOffset(hit ? -200 : 200);
        if (!hit) placed.push(pt);
      }
    };
    const zoomCls = () => map.getContainer().classList.toggle("far", map.getZoom() < 13);
    map.on("zoomend moveend", declutter); map.on("zoomend", zoomCls); zoomCls(); setTimeout(declutter, 60);
    const legend = L.control({ position: window.innerWidth <= 950 ? "topright" : "bottomleft" });
    legend.onAdd = () => {
      const d = L.DomUtil.create("div", "maplegend");
      d.innerHTML = `<label><input type="checkbox" id="lg-stores" ${S.showStores ? "checked" : ""}> Dark stores (3 km rings)</label>
        <div><span class="sw" style="background:var(--blinkit)"></span> Blinkit &nbsp;<span class="sw" style="background:var(--zepto)"></span> Zepto &nbsp;<span class="sw" style="background:var(--instamart)"></span> Instamart</div>
        <div><span class="sw" style="background:#1e88e5"></span> Pool villa sheet</div>`;
      L.DomEvent.disableClickPropagation(d);
      d.querySelector("#lg-stores").addEventListener("change", (e) => { S.showStores = e.target.checked; persist(); S.showStores ? storeLayer.addTo(map) : storeLayer.remove(); });
      return d;
    };
    legend.addTo(map);
    setTimeout(() => map && map.invalidateSize(), 50);
  }
  function highlightPin(id, on) {
    const m = markerById[id]; if (!m) return;
    const el = m.getElement()?.querySelector(".ppin"); if (!el) return;
    el.classList.toggle("hl", on); m.setZIndexOffset(on ? 1000 : 0);
  }

  // ---------- views ----------
  const app = () => $("#app");

  function viewHome() {
    app().onclick = null;
    const counts = { all: uniqueAll(DATA.listings).length, nye: DATA.listings.filter((l) => l.collection === "nye").length, pool: DATA.listings.filter((l) => l.collection === "pool").length };
    const list = filtered();
    const fc = filterCount();
    const split = S.showMap && window.innerWidth > 1128;
    app().innerHTML = `
      <div class="catbar">
        <div class="catbar-inner">
          <div class="cats" role="tablist">
            ${[["all", "All stays", ICON.all], ["nye", "NYE stays", ICON.nye], ["pool", "Pool villas", ICON.pool]].map(([k, t, ic]) =>
              `<button class="cat ${S.cat === k ? "on" : ""}" data-cat="${k}" role="tab" aria-selected="${S.cat === k}">${ic}<span>${t} <span class="n">${counts[k]}</span></span></button>`).join("")}
          </div>
          <div class="bar-actions">
            <button class="btn-outline" id="openfilters">${ICON.filter}<span class="lbl">Filters</span>${fc ? `<span class="badge">${fc}</span>` : ""}</button>
          </div>
        </div>
        <div class="chips">${QUICK.map((q) => `<button class="chip ${S.quick.has(q.id) ? "on" : ""}" data-q="${q.id}">${esc(q.label)}</button>`).join("")}</div>
      </div>
      <section class="results">
        <div class="results-head">
          <div><h1>${list.length ? `${plural(list.length, "stay")} for 29 Dec – 1 Jan` : "No exact matches"}</h1>
            <div class="sub">6 guests · 3 nights · prices before taxes</div></div>
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
            <select class="sort" id="sort" aria-label="Sort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${S.sort === k ? "selected" : ""}>${v.label}</option>`).join("")}</select>
            <label class="toggle maptoggle-wrap"><span>Show map</span><input type="checkbox" id="maptoggle" ${S.showMap ? "checked" : ""}><span class="track"></span></label>
          </div>
        </div>
        ${list.length ? `<div class="${split ? "split" : ""}">
            <div class="grid" id="grid">${list.map(cardHtml).join("")}</div>
            ${split ? `<div class="mapcol"><div class="map" id="map"></div></div>` : ""}
          </div>`
        : `<div class="empty"><h2>No stays match all of these</h2><p>Try removing a filter.</p><button class="btn-dark-outline" id="clearall">Clear filters</button></div>`}
      </section>
      <button class="mapfab" id="mapfab">${S.mobileMap ? `Show list ${ICON.list}` : `Show map ${ICON.map}`}</button>
      ${S.mobileMap ? `<div class="mapfull"><div class="map" id="mmap"></div></div>` : ""}`;

    $$(".cat").forEach((b) => b.onclick = () => { S.cat = b.dataset.cat; persist(); viewHome(); });
    $$(".chip").forEach((b) => b.onclick = () => { const q = b.dataset.q; S.quick.has(q) ? S.quick.delete(q) : S.quick.add(q); persist(); viewHome(); });
    $("#sort").onchange = (e) => { S.sort = e.target.value; persist(); viewHome(); };
    $("#maptoggle").onchange = (e) => { S.showMap = e.target.checked; persist(); viewHome(); };
    $("#openfilters").onclick = openFilters;
    $("#mapfab").onclick = () => { S.mobileMap = !S.mobileMap; viewHome(); window.scrollTo(0, 0); };
    const clear = $("#clearall"); if (clear) clear.onclick = clearFilters;
    const grid = $("#grid"); if (grid) wireCards(grid);
    if (split && list.length) buildResultsMap($("#map"), list);
    else if (S.mobileMap) buildResultsMap($("#mmap"), list);
    else if (map) { map.remove(); map = null; markerById = {}; }
    document.title = "Udaipur NYE stays · our shortlist";
  }

  function clearFilters() { S.quick.clear(); S.f = { min: null, max: null, minBedrooms: 0, apps: [] }; persist(); viewHome(); }

  function openFilters() {
    const f = JSON.parse(JSON.stringify(S.f));
    const pps = DATA.listings.map((l) => l.perPersonStay);
    const lo = Math.min(...pps), hi = Math.max(...pps);
    const render = () => {
      const n = (() => { const saved = S.f; S.f = f; const c = filtered().length; S.f = saved; return c; })();
      modal(`Filters`, `
        <div class="fgroup"><h3>Price per person</h3><p>For the whole 3-night stay, split 6 ways. Range in this list: ${inr(lo)} – ${inr(hi)}.</p>
          <div class="range"><label>Minimum<input type="number" inputmode="numeric" id="fmin" placeholder="${lo}" value="${f.min ?? ""}"></label>
          <label>Maximum<input type="number" inputmode="numeric" id="fmax" placeholder="${hi}" value="${f.max ?? ""}"></label></div></div>
        <div class="fgroup"><h3>Bedrooms</h3><p>At least this many.</p><div class="seg">${[0, 2, 3, 4, 5].map((b) => `<button data-br="${b}" class="${f.minBedrooms === b ? "on" : ""}">${b ? b + "+" : "Any"}</button>`).join("")}</div></div>
        <div class="fgroup"><h3>Quick commerce</h3><p>Show only stays where these apps likely deliver (nearest dark store within 3 km).</p>
          <div class="checks">${APPS.map((a) => `<label><input type="checkbox" data-app="${a.key}" ${f.apps.includes(a.key) ? "checked" : ""}> ${a.name}</label>`).join("")}</div></div>`,
        `<button class="btn-text" id="fclear">Clear all</button><button class="btn-dark" id="fapply">Show ${plural(n, "stay")}</button>`);
      const num = (v) => (v === "" ? null : Math.max(0, +v));
      $("#fmin").onchange = (e) => { f.min = num(e.target.value); render(); };
      $("#fmax").onchange = (e) => { f.max = num(e.target.value); render(); };
      $$("[data-br]").forEach((b) => b.onclick = () => { f.minBedrooms = +b.dataset.br; render(); });
      $$("[data-app]").forEach((c) => c.onchange = () => { f.apps = $$("[data-app]").filter((x) => x.checked).map((x) => x.dataset.app); render(); });
      $("#fclear").onclick = () => { f.min = f.max = null; f.minBedrooms = 0; f.apps = []; render(); };
      $("#fapply").onclick = () => { S.f = f; persist(); closeModal(); viewHome(); };
    };
    render();
  }

  function modal(title, body, foot) {
    $("#modal-root").innerHTML = `<div class="modal" id="modal"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-h"><button class="x" id="mx" aria-label="Close">${ICON.close}</button>${esc(title)}</div>
      <div class="sheet-b">${body}</div>${foot ? `<div class="sheet-f">${foot}</div>` : ""}</div></div>`;
    document.body.style.overflow = "hidden";
    $("#mx").onclick = closeModal;
    $("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
  }
  function closeModal() { $("#modal-root").innerHTML = ""; document.body.style.overflow = ""; }

  // ---------- listing page ----------
  let lpMap = null;
  function viewListing(id) {
    const l = BY_ID[id];
    if (!l) { app().innerHTML = `<div class="lp"><div class="empty"><h2>Listing not found</h2><a href="#/">Back to all stays</a></div></div>`; return; }
    S.visited.add(id); persist();
    const p = l.photos;
    const share = ` <button class="linkbtn" id="lpshare">${ICON.share} Share</button>
      <button class="linkbtn ${S.saved.has(id) ? "on" : ""}" data-heart="${id}" aria-pressed="${S.saved.has(id)}"><svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M16 28c7-4.7 14-10 14-17 0-3.9-3.1-7-7-7-2.8 0-5.2 1.7-7 4-1.8-2.3-4.2-4-7-4-3.9 0-7 3.1-7 7 0 7 7 12.3 14 17Z"/></svg> Save</button>`;
    const airbnbLink = l.airbnbUrl ? `${l.airbnbUrl}?check_in=${DATA.trip.checkIn}&check_out=${DATA.trip.checkOut}&adults=${DATA.trip.guests}` : null;
    const host = l.host || {};
    const hostStats = (host.stats || []).map((s) => `${s.value} ${s.label.toLowerCase()}`).join(" · ");
    const amenCount = l.amenityGroups.reduce((n, g) => n + g.items.length, 0);
    const preview = (l.amenityPreview.length ? l.amenityPreview : l.amenityGroups.flatMap((g) => g.items)).slice(0, 10);
    const sameSpot = l.note ? `<div class="sec"><h2>Note from our spreadsheet</h2><div class="notebox">${esc(l.note)}</div></div>` : "";
    const live = l.livePrice && Math.abs(l.livePrice - l.total) > 100
      ? `<div class="livewarn">Airbnb showed <b>${inr(l.livePrice)}</b> for these dates when we checked on 26 Nov (sheet price ${inr(l.total)}). Check the live price before booking.</div>` : "";

    app().innerHTML = `<article class="lp">
      <a class="lp-back" href="#/" id="lpback">${ICON.back} All stays</a>
      <div class="lp-title"><h1>${esc(l.name)}</h1><div class="lp-actions">${share}</div></div>
      <div class="pgrid">${p.slice(0, 5).map((u, i) => `<button data-photo="${i}" aria-label="Open photo ${i + 1}"><img src="${esc(img(u, i ? 720 : 1200))}" alt="${esc(l.photoLabels[i] || "")}" ${i ? 'loading="lazy"' : ""}></button>`).join("")}
        <button class="showall" id="showall">${ICON.grid} Show all ${p.length} photos</button></div>
      <div class="lp-body">
        <div class="lp-main">
          <div class="sec overview">
            <h2>${esc(l.overviewTitle || typeLine(l))}</h2>
            <div class="items">${(l.overview.length ? l.overview : [l.roomsText]).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
            <div class="ratingline">${l.rating ? `${ICON.star.replace("<svg", '<svg width="14" height="14"')} ${l.rating} · ${plural(l.reviews || 0, "review")}` : "★ New listing, no ratings yet"}${l.kmCityPalace != null ? ` <span class="muted">· ${l.kmCityPalace} km from City Palace</span>` : ""}</div>
            ${l.guestFavourite ? `<div class="favbox"><div class="lb">${l.topFavourite ? "Top guest<br>favourite" : "Guest<br>favourite"}</div><div class="tx">One of the most loved homes on Airbnb, according to guests</div>${l.rating ? `<div class="sc">${l.rating}<div class="muted" style="font-size:12px;font-weight:400">${l.reviews} reviews</div></div>` : ""}</div>` : ""}
          </div>
          ${host.name ? `<div class="sec host">${host.photo ? `<img src="${esc(img(host.photo, 240))}" alt="">` : ""}<div><div class="n">Hosted by ${esc(host.name)}</div><div class="s">${esc([host.isSuperhost ? "Superhost" : host.title, hostStats].filter(Boolean).join(" · "))}</div></div></div>` : ""}
          <div class="sec"><h2>Quick commerce for NYE supplies</h2>
            <div class="qcbox">${APPS.map((a) => { const d = l.delivery[a.key]; if (!d) return "";
              return `<div class="qcrow"><div class="logo ${a.key}">${a.short}</div><div><div class="n">${a.name}</div><div class="d">Nearest dark store: ${esc(d.storeArea || d.store)}, ${d.km} km away (straight line)</div></div><span class="status ${d.status}">${STATUS_TXT[d.status]}</span></div>`; }).join("")}</div>
            <p class="fine">An estimate from public dark-store locations: within 3 km usually delivers, 3–5 km is borderline, beyond 5 km usually not. Check the app with the exact address before relying on it, especially late on 31 Dec.</p></div>
          ${l.highlights.length ? `<div class="sec"><div class="hl-list">${l.highlights.slice(0, 4).map((h) => `<div class="hl-item">${HL_ICON}<div><div class="t">${esc(h.title)}</div>${h.body ? `<div class="d">${esc(h.body)}</div>` : ""}</div></div>`).join("")}</div></div>` : ""}
          ${l.description ? `<div class="sec"><h2>About this place</h2><div class="desc">${esc(l.description)}</div>${l.description.length > 380 ? `<button class="morebtn" id="moredesc">Show more ${ICON.right}</button>` : ""}</div>` : ""}
          ${l.sleeping.length ? `<div class="sec"><h2>Where you'll sleep</h2><div class="sleep">${l.sleeping.map((s) => `<div>${ICON.bed}<b>${esc(s.name)}</b><span>${esc(s.beds)}</span></div>`).join("")}</div></div>` : ""}
          ${preview.length ? `<div class="sec"><h2>What this place offers</h2><div class="amen">${preview.map((a) => `<div>${amenIcon(a)}<span>${esc(a)}</span></div>`).join("")}</div>
            ${amenCount > preview.length ? `<button class="btn-dark-outline" id="allamen">Show all ${amenCount} amenities</button>` : ""}</div>` : ""}
          ${l.categoryRatings.length ? `<div class="sec"><div class="bigrating">${ICON.star.replace("<svg", '<svg width="20" height="20"')} ${l.rating} · ${plural(l.reviews || 0, "review")}</div>
            <div class="catratings">${l.categoryRatings.map((c) => `<div><div class="lbl">${esc(c.label)}</div><div class="val">${esc(c.rating)}</div></div>`).join("")}</div>
            ${airbnbLink ? `<p class="fine">Read the guest reviews on <a href="${esc(airbnbLink)}#reviews" target="_blank" rel="noopener">Airbnb</a>.</p>` : ""}</div>` : ""}
          <div class="sec"><h2>Where you'll be</h2><p class="muted" style="margin-top:-10px">${esc(l.area || "Udaipur, Rajasthan, India")}. Airbnb shows an approximate location; the exact address comes after booking.</p><div class="lpmap" id="lpmap"></div></div>
          ${l.houseRules.length || l.safety.length ? `<div class="sec"><h2>Things to know</h2><div class="rules">
            ${l.houseRules.map((g) => `<div><h3>${esc(g.title || "House rules")}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
            ${l.safety.map((g) => `<div><h3>${esc(g.title || "Safety & property")}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
            <div><h3>Cancellation</h3><ul><li>${l.freeCancellation ? "Free cancellation available (see terms on Airbnb)" : "Check the cancellation policy on Airbnb"}</li></ul></div></div></div>` : ""}
          ${sameSpot}
        </div>
        <aside class="bookcol"><div class="book">
          <div class="price">${inr(l.total)} <small>for 3 nights</small></div>
          <div class="pp">${inr(l.perPersonNight)} per person per night</div>
          <div class="dates"><div class="r"><div class="c"><div class="k">Check-in</div><div class="v">29/12/2026</div></div><div class="c"><div class="k">Checkout</div><div class="v">01/01/2027</div></div></div>
            <div class="g"><div class="k">Guests</div><div class="v">6 guests</div></div></div>
          ${airbnbLink ? `<a class="cta" href="${esc(airbnbLink)}" target="_blank" rel="noopener">Check on Airbnb</a>` : ""}
          <button class="cta ghost" data-heart="${id}">${S.saved.has(id) ? "Saved to shortlist ♥" : "Add to shortlist"}</button>
          <div class="note">Opens the real listing with our dates and 6 guests</div>
          <div class="lines"><div><span>3 nights total</span><span>${inr(l.total)}</span></div><div><span>Split 6 ways</span><span>${inr(l.perPersonStay)}</span></div>
            <div class="tot"><span>Per person, per night</span><span>${inr(l.perPersonNight)}</span></div></div>
          ${live}
        </div></aside>
      </div>
      <div class="mobbar"><div><div class="price">${inr(l.total)} <span class="muted" style="font-weight:400">· 3 nights</span></div><div class="pp">${inr(l.perPersonStay)} per person</div></div>
        ${airbnbLink ? `<a class="cta" href="${esc(airbnbLink)}" target="_blank" rel="noopener">Check on Airbnb</a>` : ""}</div>
    </article>`;

    window.scrollTo(0, 0);
    document.title = `${l.name} · Udaipur NYE stays`;
    app().onclick = (e) => {
      const h = e.target.closest("[data-heart]");
      if (h && h.dataset.heart === id) { e.preventDefault(); toggleSave(id); $$(".cta.ghost").forEach((b) => b.textContent = S.saved.has(id) ? "Saved to shortlist ♥" : "Add to shortlist"); }
    };
    $("#lpback").onclick = (e) => { if (history.length > 1 && lastRoute === "home") { e.preventDefault(); history.back(); } };
    $$("[data-photo]").forEach((b) => b.onclick = () => openGallery(l, +b.dataset.photo));
    $("#showall").onclick = () => openGallery(l, null);
    $("#lpshare").onclick = () => shareLink(location.href, l.name);
    const md = $("#moredesc"); if (md) md.onclick = () => modal("About this place", `<div style="white-space:pre-line">${esc(l.description)}</div>`);
    const aa = $("#allamen"); if (aa) aa.onclick = () => modal("What this place offers",
      l.amenityGroups.map((g) => `<div class="amen-group"><h3>${esc(g.title || "")}</h3>${g.items.map((a) => `<div>${amenIcon(a)}<span>${esc(a)}</span></div>`).join("")}</div>`).join("")
      + (l.notIncluded.length ? `<div class="amen-group"><h3>Not included</h3>${l.notIncluded.map((a) => `<div style="text-decoration:line-through;color:var(--ink-2)">${amenIcon(a)}<span>${esc(a)}</span></div>`).join("")}</div>` : ""));

    if (lpMap) { lpMap.remove(); lpMap = null; }
    if (l.lat != null) {
      lpMap = baseMap($("#lpmap"), { scrollWheelZoom: false });
      landmarkMarkers().addTo(lpMap);
      storeMarkers(false).addTo(lpMap);
      L.circle([l.lat, l.lng], { radius: 350, color: "#ff385c", weight: 2, fillOpacity: .15 }).addTo(lpMap);
      L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<div class="ppin hl">${kInr(l.total)}</div>`, iconSize: [0, 0] }) }).addTo(lpMap);
      const near = DATA.stores.map((s) => [s.lat, s.lng]).sort((a, b) => Math.hypot(a[0] - l.lat, a[1] - l.lng) - Math.hypot(b[0] - l.lat, b[1] - l.lng)).slice(0, 3);
      lpMap.fitBounds([[l.lat, l.lng], ...near], { padding: [40, 40], maxZoom: 14 });
    }
  }

  // ---------- gallery ----------
  function openGallery(l, startAt) {
    const groups = [];
    l.photos.forEach((u, i) => {
      const name = l.photoLabels[i] || "More photos";
      let g = groups.find((x) => x.name === name); if (!g) groups.push(g = { name, items: [] });
      g.items.push(i);
    });
    const ordered = groups.flatMap((g) => g.items);
    const el = document.createElement("div");
    el.className = "gallery"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "All photos");
    el.innerHTML = `<div class="gallery-h"><button class="linkbtn" id="gclose" style="text-decoration:none">${ICON.back}</button><span class="muted">${plural(l.photos.length, "photo")}</span><span></span></div>
      <div class="gallery-b">
        ${groups.length > 1 ? `<div class="gtags">${groups.map((g, gi) => `<button data-g="${gi}"><img src="${esc(img(l.photos[g.items[0]], 240))}" alt="" loading="lazy">${esc(g.name)}</button>`).join("")}</div>` : ""}
        ${groups.map((g, gi) => `<section class="groom" id="g${gi}">${groups.length > 1 ? `<h2>${esc(g.name)}</h2>` : ""}<div class="gphotos">${g.items.map((i) => `<button data-i="${i}"><img src="${esc(img(l.photos[i], 960))}" alt="${esc(g.name)}" loading="lazy" decoding="async"></button>`).join("")}</div></section>`).join("")}
      </div>`;
    document.body.appendChild(el); document.body.style.overflow = "hidden";
    const close = () => { el.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape" && !$(".lightbox")) close(); };
    document.addEventListener("keydown", onKey);
    $("#gclose", el).onclick = close;
    $$("[data-g]", el).forEach((b) => b.onclick = () => $(`#g${b.dataset.g}`, el).scrollIntoView({ behavior: "smooth", block: "start" }));
    $$(".gphotos [data-i]", el).forEach((b) => b.onclick = () => openLightbox(l, ordered, ordered.indexOf(+b.dataset.i)));
    if (startAt != null) openLightbox(l, ordered, Math.max(0, ordered.indexOf(startAt)));
  }
  function openLightbox(l, order, pos) {
    const el = document.createElement("div");
    el.className = "lightbox";
    const draw = () => {
      const i = order[pos];
      el.innerHTML = `<div class="top"><button id="lbx">${ICON.close} Close</button><span>${pos + 1} / ${order.length}</span><span></span></div>
        <div class="stage"><img src="${esc(img(l.photos[i], 1440))}" alt="${esc(l.photoLabels[i] || "")}">
        <button class="arrow l" aria-label="Previous">${ICON.left}</button><button class="arrow r" aria-label="Next">${ICON.right}</button></div>`;
      $("#lbx", el).onclick = close;
      $(".arrow.l", el).onclick = () => go(-1); $(".arrow.r", el).onclick = () => go(1);
      const nx = new Image(); nx.src = img(l.photos[order[(pos + 1) % order.length]], 1440);
    };
    const go = (d) => { pos = (pos + d + order.length) % order.length; draw(); };
    const onKey = (e) => { if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); else if (e.key === "Escape") close(); };
    const close = () => { el.remove(); document.removeEventListener("keydown", onKey); };
    let sx = 0;
    el.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(el); draw();
  }

  // ---------- shortlist ----------
  function shareLink(url, title) {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) { navigator.share({ title, url }).catch(() => {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copied"), () => prompt("Copy this link", url));
  }
  function viewSaved(sharedIds) {
    app().onclick = null;
    const shared = Array.isArray(sharedIds);
    const ids = shared ? sharedIds.filter((i) => BY_ID[i]) : [...S.saved].filter((i) => BY_ID[i]);
    const list = ids.map((i) => BY_ID[i]);
    const shareUrl = `${location.origin}${location.pathname}#/saved/${ids.join(",")}`;
    const total = list.reduce((n, l) => n + (l.perPersonStay || 0), 0);
    app().innerHTML = `<section class="results" style="padding-top:32px">
      <div class="savedhead"><div><h1>${shared ? "A friend's shortlist" : "Your shortlist"}</h1>
        <p>${list.length ? `${plural(list.length, "stay")} · from ${inr(Math.min(...list.map((l) => l.perPersonStay)))} per person${list.length > 1 ? ` · average ${inr(total / list.length)}` : ""}` : "Tap the heart on any stay to add it here."}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${shared && list.length ? `<button class="btn-dark" id="adopt">Add all to my shortlist</button>` : ""}
          ${!shared && list.length ? `<button class="btn-dark" id="shareSaved">${ICON.share} Share my shortlist</button>` : ""}
          <a class="btn-outline" href="#/" style="text-decoration:none">Browse all stays</a></div></div>
      ${list.length ? `<div class="grid" id="grid">${list.map(cardHtml).join("")}</div>`
        : `<div class="empty"><h2>No saved stays yet</h2><p>As you search, tap the heart icon to save the places you like.</p><a class="btn-dark-outline" style="display:inline-block;text-decoration:none" href="#/">Start exploring</a></div>`}
      ${list.length ? `<div class="sec" style="border:0;padding-top:48px"><h2>On the map</h2><div class="lpmap" id="savedmap"></div></div>` : ""}
    </section>`;
    const grid = $("#grid"); if (grid) wireCards(grid);
    const a = $("#adopt"); if (a) a.onclick = () => { ids.forEach((i) => S.saved.add(i)); persist(); updateSavedCount(); toast(`Added ${plural(ids.length, "stay")} to your shortlist`); location.hash = "#/saved"; };
    const s = $("#shareSaved"); if (s) s.onclick = () => shareLink(shareUrl, "Our Udaipur NYE shortlist");
    if (list.length) buildResultsMap($("#savedmap"), list);
    document.title = (shared ? "Shared shortlist" : "Your shortlist") + " · Udaipur NYE stays";
    window.scrollTo(0, 0);
  }

  // ---------- trip sheet ----------
  function tripInfo() {
    const n = DATA.listings.length;
    modal("Our trip", `<p style="font-size:16px;margin-top:0"><b>Udaipur, Rajasthan</b><br>Mon 29 Dec 2026 → Thu 1 Jan 2027 · 3 nights · 6 guests</p>
      <p class="muted">${n} options across two lists we put together: NYE stays (homes and apartments in and around the city) and pool villas (mostly out of town). Heart the ones you like, then share your shortlist link in the group.</p>
      <p class="muted">Prices are before taxes for the full stay and were checked on 26 Nov 2026. "Per person" splits the total six ways.</p>`);
  }

  // ---------- router ----------
  let lastRoute = null;
  function route() {
    closeModal();
    $$(".gallery, .lightbox").forEach((e) => e.remove()); document.body.style.overflow = "";
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    if (lpMap && a !== "l") { lpMap.remove(); lpMap = null; }
    if (a === "l" && b) { viewListing(decodeURIComponent(b)); lastRoute = "listing"; }
    else if (a === "saved") { viewSaved(b ? decodeURIComponent(b).split(",") : undefined); lastRoute = "saved"; }
    else { const y = lastRoute === "listing" ? homeScroll : 0; viewHome(); lastRoute = "home"; if (y) requestAnimationFrame(() => window.scrollTo(0, y)); }
  }
  let homeScroll = 0;
  window.addEventListener("scroll", () => { if (lastRoute === "home") homeScroll = window.scrollY; }, { passive: true });
  window.addEventListener("hashchange", route);
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (lastRoute === "home" && S.showMap && (!!$(".mapcol")) !== (window.innerWidth > 1128)) viewHome(); }, 200); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#modal")) closeModal(); });

  // ---------- boot ----------
  fetch("data/listings.json").then((r) => r.json()).then((d) => {
    DATA = d; d.listings.forEach((l) => (BY_ID[l.id] = l));
    S.saved = new Set([...S.saved].filter((i) => BY_ID[i]));
    updateSavedCount();
    $("#searchpill").onclick = tripInfo;
    route();
  }).catch((err) => { app().innerHTML = `<div class="empty"><h2>Couldn't load the listings</h2><p>${esc(err.message)}</p></div>`; });
})();
