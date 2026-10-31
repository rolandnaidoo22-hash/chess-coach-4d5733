// Chess Review service worker: keeps the app usable offline.
// Page: network first (so updates show up), falling back to the cached copy when offline.
const CACHE = "chess-review-v68";
// Heavy files (engine wasm, 3D, piece models, bot profile) load the first time they're used, then the fetch handler caches them. Don't download them all during install.
const ASSETS = ["./", "./index.html", "./accounts.js", "./onboard.js", "./ideas.js", "./privacy.html", "./STOCKFISH-LICENSE.txt", "./openings-names.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon.svg", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./traps.js", "./imp.js", "./wish.js", "./learn.js", "./home.js", "./thinkfirst.js", "./thinkfirst-data.js", "./v42.js", "./assess.js", "./v46.js", "./v47.js", "./board3d.js", "./stockfish.js", "./bots-data.js", "./ultimate.js", "./bots-engine.js", "./bots.js", "./openings-data.js", "./openings.js", "./read.js", "./style.js","./style-model.js","./study.js","./charts.js", "./guard.js", "./blunders.js","./review58.js","./coach58.js","./review59.js","./coach59.js","./learn60.js","./memory61.js","./opening62.js","./pin63.js","./blind64.js","./plain64.js","./mind64.js","./gut65.js", "./review66.js", "./resume67.js", "./moves67.js","./rating68.js","./kids68.js","./photo68.js","./lesson64.js","./badges.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // never touch api.chess.com
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("./index.html"))));
});
