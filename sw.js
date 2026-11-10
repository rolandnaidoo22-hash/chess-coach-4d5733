// Chess Review service worker: keeps the app usable offline.
// Page: network first (so updates show up), falling back to the cached copy when offline.
const CACHE = "chess-review-7c565bc1";
// Big, rarely-changing files live in their own cache that updates do NOT wipe (bump ENGINE_CACHE only if the engine/3D files change).
const ENGINE_CACHE = "chess-review-engine-1";
const BIG = /\/(stockfish\.js|stockfish\.wasm|three\.module\.min\.js|pieces\.bin)$/;
const NET_TIMEOUT = 4000; // ms: on a weak signal fall back to the cached copy instead of waiting
// Heavy files (engine wasm, 3D, piece models, bot profile) load the first time they're used, then the fetch handler caches them. Don't download them all during install.
const ASSETS = ["./", "./index.html", "./accounts.js", "./onboard.js", "./ideas.js", "./privacy.html", "./STOCKFISH-LICENSE.txt", "./openings-names.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon.svg", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./traps.js", "./imp.js", "./wish.js", "./learn.js", "./home.js", "./thinkfirst.js", "./thinkfirst-data.js", "./v42.js", "./assess.js", "./v46.js", "./v47.js", "./board3d.js", "./stockfish.js", "./bots-data.js", "./ultimate.js", "./bots-engine.js", "./bots.js", "./openings-data.js", "./openings.js", "./read.js", "./style.js","./style-model.js","./study.js","./charts.js", "./guard.js", "./blunders.js","./review58.js","./coach58.js","./review59.js","./coach59.js","./learn60.js","./memory61.js","./opening62.js","./pin63.js","./blind64.js","./plain64.js","./mind64.js","./gut65.js", "./review66.js", "./resume67.js", "./moves67.js","./moves71.js","./qr74.js","./qr81.js","./pat76.js","./rating68.js","./sync69.js","./brain81.js","./brain81-worker.js","./kids68.js","./photo68.js","./gmchat.js", "./data-openings.js", "./openings-lib.js", "./lesson64.js","./badges.js","./a11y.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== ENGINE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (name, req, res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(name).then(c => c.put(req, copy)).catch(() => {}); } };
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // never touch api.chess.com
  if (req.headers.has("range")) return; // partial responses can't be cached
  // Engine + 3D files: cache first (they are large and rarely change), fill the cache on first use.
  if (BIG.test(url.pathname)) {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => { put(ENGINE_CACHE, req, r); return r; })));
    return;
  }
  // Everything else: network first, but give up after NET_TIMEOUT if we have a cached copy.
  e.respondWith((async () => {
    const cached = await caches.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { put(CACHE, req, r); return r; });
    try {
      if (!cached) return await net;
      return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), NET_TIMEOUT))]);
    } catch (err) {
      if (cached) { net.catch(() => {}); return cached; }
      // Only page loads may fall back to the home page. A missing script/wasm/json must fail cleanly, not return HTML.
      if (req.mode === "navigate") { const home = await caches.match("./index.html"); if (home) return home; }
      return Response.error();
    }
  })());
});
