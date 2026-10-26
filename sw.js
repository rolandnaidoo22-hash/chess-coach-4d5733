// Chess Review service worker: keeps the app usable offline.
// Page: network first (so updates show up), falling back to the cached copy when offline.
const CACHE = "chess-review-v52";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon.svg", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./traps.js", "./imp.js", "./wish.js", "./learn.js", "./home.js", "./v42.js", "./assess.js", "./v46.js", "./v47.js", "./board3d.js", "./three.module.min.js", "./pieces.bin", "./stockfish.js", "./stockfish.wasm", "./bots-data.js", "./ultimate.js", "./bots-engine.js", "./bots.js", "./openings-data.js", "./openings.js", "./read.js", "./style.js","./style-model.js", "./corban-profile.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // never touch api.chess.com
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("./index.html"))));
});
