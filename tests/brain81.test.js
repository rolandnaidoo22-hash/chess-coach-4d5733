/* Opponent Brain: load the browser module in a stub window and check the public API,
   empty states, search wiring, and bookMove lookup. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(root, "brain81.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home.js"), "utf8");
const idx = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const eng = fs.readFileSync(path.join(root, "bots-engine.js"), "utf8");

assert.ok(/brain81\.js/.test(idx), "index.html loads brain81.js");
assert.ok(/brain81\.js/.test(sw), "service worker precaches brain81.js");
assert.ok(/CRBrain\.bookMove/.test(eng), "bots consult Opponent Brain bookMove");
assert.ok(home.includes('"Opponent Brain"') || home.includes("'Opponent Brain'"), "More list names Opponent Brain");
assert.ok(home.includes('["puzzles","v42pod","bl57","drills","board","study52","brain81"]'), "Opponent Brain sits with Study your opponent in Train");
assert.ok(home.includes("(t[2]+\" \"+(t[7]||\"\")).toLowerCase()"), "More search also matches keywords");
assert.ok(/brain rival rivals feed memory openings/.test(home), "Opponent Brain has search keywords");
assert.ok(!/Opponent Feed/.test(src), "user-visible name is Opponent Brain, not Opponent Feed");

function load(userCc, storeSeed) {
  const store = Object.assign({}, storeSeed || {});
  const listeners = {};
  const document = {
    readyState: "loading",
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getElementById() { return null; },
    createElement() {
      return { style: {}, textContent: "", classList: { contains() { return false; } },
        querySelector() { return null; }, querySelectorAll() { return []; },
        appendChild() {}, setAttribute() {}, remove() {} };
    },
    head: { appendChild() {} },
    body: { classList: { contains() { return false; } } }
  };
  const localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  };
  const CRUser = { info() { return { cc: userCc || "" }; } };
  const window = { document, localStorage, CRUser };
  window.window = window;
  const ctx = {
    window, document, localStorage, CRUser,
    navigator: { onLine: true },
    console, setTimeout, clearTimeout, Date, Math, JSON, String, Object, Array, Set, Promise, Error
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.CRBrain;
}

const empty = load("");
assert.ok(empty, "CRBrain is exported");
["snapshot", "blurb", "tip", "run", "cancel", "bookMove", "openingMap", "open"].forEach(k => {
  assert.strictEqual(typeof empty[k], "function", "CRBrain." + k);
});
const snap = empty.snapshot();
assert.strictEqual(snap.opps, 0, "no rivals before any games");
assert.strictEqual(snap.games, 0, "no head-to-head games yet");
assert.ok(/Add your Chess\.com name/.test(empty.tip()), empty.tip());
assert.strictEqual(empty.blurb(), "Grows from your games");
assert.strictEqual(empty.bookMove(250, [], [{ san: "e4" }, { san: "d4" }]), null, "bookMove is a no-op without data");
assert.deepStrictEqual(empty.openingMap().rows, []);

const named = load("prishennaidoo");
assert.ok(/Sync your games/.test(named.tip()), named.tip());

const now = Date.now();
const seeded = load("prishennaidoo", {
  "chessReview.brain.opponents": JSON.stringify({
    testrival: {
      u: "testrival", name: "TestRival", lastPulled: now, months: ["2026/11"], rating: 480,
      openingsW: { "Italian Game": { n: 3, sc: 2 } }, openingsB: {},
      lines: { "w|e4 e5 Nf3 Nc6": { n: 3, sc: 2, seq: ["e4", "e5", "Nf3", "Nc6"], side: "w" } },
      h2h: [
        { url: "g1", t: 1730000000, me: "w", res: "L", tc: "rapid", opn: "Italian Game", mr: 452, or: 480, sans: ["e4", "e5", "Nf3", "Nc6"], added: now },
        { url: "g2", t: 1730001000, me: "w", res: "L", tc: "rapid", opn: "Italian Game", mr: 450, or: 485, sans: ["e4", "e5", "Nf3", "Nc6"], added: now },
        { url: "g3", t: 1730002000, me: "w", res: "W", tc: "rapid", opn: "Italian Game", mr: 455, or: 470, sans: ["e4", "e5", "Nf3", "Nc6"], added: now }
      ],
      traps: [], puzzles: [], gamesSeen: 8
    }
  }),
  "chessReview.brain.botstats": JSON.stringify({
    bands: { "0-399": { n: 6, "0|*": { e4: 5, d4: 1 } } }
  })
});
const snap2 = seeded.snapshot();
assert.strictEqual(snap2.opps, 1);
assert.strictEqual(snap2.games, 3);
assert.ok(/rival/.test(seeded.blurb()), seeded.blurb());
const map = seeded.openingMap();
assert.ok(map.rows.length >= 1, "opening map has rows");
assert.strictEqual(map.fix && map.fix.opn, "Italian Game");
const legal = [{ san: "e4" }, { san: "d4" }];
const picked = seeded.bookMove(250, [], legal);
assert.ok(picked && picked.san === "e4", "Pip-band book prefers the common first move");
assert.strictEqual(seeded.bookMove(250, [], [{ san: "c4" }]), null, "bookMove stays legal");

console.log("brain81 ok");

assert.ok(/brain81-worker\.js/.test(sw), "service worker precaches brain81-worker.js");
const priv = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
assert.ok(/Opponent Brain/.test(priv), "privacy page names Opponent Brain");
assert.ok(/last 3 months/.test(priv), "privacy page says last 3 months");
assert.ok(/only on this phone/.test(priv), "privacy page says summary stays on the phone");
const wsrc = fs.readFileSync(path.join(root, "brain81-worker.js"), "utf8");
assert.ok(/onmessage/.test(wsrc), "worker has onmessage");
assert.ok(/CRBrainWorker/.test(wsrc), "worker exports CRBrainWorker");

const wself = {};
const wctx = { self: wself, globalThis: wself, console, JSON, String, Object, Array, Date, Math, Error, setTimeout, clearTimeout };
wself.self = wself;
vm.createContext(wctx);
vm.runInContext(wsrc, wctx);
const WorkerAPI = wctx.CRBrainWorker || wself.CRBrainWorker;
assert.ok(WorkerAPI && typeof WorkerAPI.parsePgn === "function", "worker parsePgn");
const parsed = WorkerAPI.parsePgn('[White "A"]\n[Black "B"]\n[Opening "Italian Game"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *');
assert.strictEqual(Array.from(parsed.sans).slice(0, 6).join(" "), "e4 e5 Nf3 Nc6 Bc4 Bc5");
assert.strictEqual(parsed.H.Opening, "Italian Game");
const parsedGames = WorkerAPI.parseGames([{
  url: "u1", pgn: '[White "A"]\n[Black "B"]\n\n1. e4 e5 2. Nf3 Nc6 *',
  white: { username: "A" }, black: { username: "B" }, end_time: 1730000000, rules: "chess"
}]);
assert.strictEqual(parsedGames.length, 1);
assert.ok(parsedGames[0].sans.includes("e4"));

function loadNav(userCc, storeSeed, navExtra) {
  const store = Object.assign({}, storeSeed || {});
  const listeners = {};
  const document = {
    readyState: "loading",
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getElementById() { return null; },
    createElement() {
      return { style: {}, textContent: "", classList: { contains() { return false; } },
        querySelector() { return null; }, querySelectorAll() { return []; },
        appendChild() {}, setAttribute() {}, remove() {} };
    },
    head: { appendChild() {} },
    body: { classList: { contains() { return false; } } }
  };
  const localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  };
  const CRUser = { info() { return { cc: userCc || "" }; } };
  const navigator = Object.assign({ onLine: true }, navExtra || {});
  const window = { document, localStorage, CRUser };
  window.window = window;
  const ctx = {
    window, document, localStorage, CRUser, navigator,
    console, setTimeout, clearTimeout, Date, Math, JSON, String, Object, Array, Set, Promise, Error
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.CRBrain;
}

const helpers = loadNav("prishennaidoo");

// Current-month: last 3 local months plus UTC current; never skip the current month after it was stored.
const pullNow = Date.parse("2026-11-10T12:00:00+02:00");
const archives = [
  "https://api.chess.com/pub/player/x/games/2026/08",
  "https://api.chess.com/pub/player/x/games/2026/09",
  "https://api.chess.com/pub/player/x/games/2026/10",
  "https://api.chess.com/pub/player/x/games/2026/11"
];
const first = helpers.monthsToRead(archives, [], pullNow);
assert.ok(first.includes("2026/11"), "first pull includes the current month: " + first);
assert.ok(first.includes("2026/10") && first.includes("2026/09"), "first pull includes the previous two months: " + first);
assert.ok(!first.includes("2026/08"), "first pull skips months older than 3: " + first);
const again = helpers.monthsToRead(archives, first, pullNow);
assert.strictEqual(JSON.stringify(again), JSON.stringify(["2026/11"]), "later pulls still refresh the current month: " + again);
assert.strictEqual(JSON.stringify(helpers.monthsToRead(archives, ["2026/09", "2026/10", "2026/11"], pullNow)), JSON.stringify(["2026/11"]));

// Re-reading a current-month archive must not double-count once the URL is seen.
const folder = loadNav("prishennaidoo");
const opp = { u: "rival", name: "Rival", openingsW: {}, openingsB: {}, lines: {}, h2h: [], months: [], gamesSeen: 0, traps: [], puzzles: [] };
const game = {
  url: "https://www.chess.com/game/live/991",
  sans: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
  opening: "Italian Game",
  white: { username: "Rival", result: "win", rating: 500 },
  black: { username: "Other", result: "lose", rating: 480 },
  end_time: Math.floor(Date.now() / 1000),
  time_class: "rapid",
  rules: "chess"
};
assert.strictEqual(folder.foldArchive(opp, game), true, "first fold counts the archive game");
assert.strictEqual(opp.gamesSeen, 1);
assert.ok(opp.openingsW["Italian Game"] && opp.openingsW["Italian Game"].n === 1);
assert.strictEqual(folder.foldArchive(opp, game), false, "second fold of the same URL is skipped");
assert.strictEqual(opp.gamesSeen, 1, "gamesSeen does not double-count");
assert.strictEqual(opp.openingsW["Italian Game"].n, 1, "opening count does not double-count");

// Lichess name mix-up: charts games from Lichess must not become Chess.com rivals.
assert.strictEqual(helpers.isChessComGame({ site: "l", op: "liUser", id: "https://lichess.org/abc" }), false);
assert.strictEqual(helpers.isChessComGame({ site: "c", op: "ccUser", id: "https://www.chess.com/game/live/1" }), true);
assert.strictEqual(helpers.isChessComGame({ id: "https://lichess.org/xyz", op: "liUser", m: ["e4"] }), false);
assert.strictEqual(helpers.isChessComGame({ id: "https://www.chess.com/game/live/2", op: "ccUser", m: ["e4"] }), true);
const mixed = loadNav("prishennaidoo", {
  "chessReview.v56.charts.games": JSON.stringify({
    games: [
      { id: "https://lichess.org/abc123", site: "l", op: "lichessRival", m: ["e4", "e5"], c: "w", t: Date.now(), r: 1, name: "King's Pawn", e: 1400, oe: 1380, tc: "blitz" },
      { id: "https://www.chess.com/game/live/99", site: "c", op: "ccRival", m: ["e4", "e5"], c: "w", t: Date.now(), r: 0, name: "Italian Game", e: 452, oe: 480, tc: "rapid" }
    ]
  })
});
const rows = mixed.collect();
assert.ok(rows.every(r => r.op !== "lichessRival"), "collect drops Lichess chart games: " + JSON.stringify(rows));
assert.ok(rows.some(r => r.op === "ccRival"), "collect keeps Chess.com chart games");

// Ghost must play only the rival's side / moves.
const ghostO = {
  lines: {
    "w|e4 e5 Nf3 Nc6": { n: 5, seq: ["e4", "e5", "Nf3", "Nc6"], side: "w" }
  },
  h2h: [{ res: "L", me: "b", sans: ["e4", "e5", "Nf3", "Nc6"] }]
};
// User lost as Black, so they should play Black again; rival was White on the stored line.
const plan = helpers.ghostPlan(ghostO);
assert.ok(plan, "ghostPlan returns a plan");
assert.strictEqual(plan.rivalSide, "w");
assert.strictEqual(plan.userPlays, "b");
assert.strictEqual(JSON.stringify(helpers.ghostBooks(plan)), JSON.stringify([["e4", "Nf3"], []]));

const ghostMismatch = {
  lines: {
    "w|e4 e5 Nf3 Nc6": { n: 9, seq: ["e4", "e5", "Nf3", "Nc6"], side: "w" },
    "b|e4 e5 Nf3 Nc6": { n: 2, seq: ["e4", "e5", "Nf3", "Nc6"], side: "b" }
  },
  h2h: [{ res: "L", me: "w", sans: ["e4", "e5"] }, { res: "L", me: "w", sans: ["e4", "c5"] }]
};
// User lost more as White, prefer the line where the rival was Black even if it is less common.
const plan2 = helpers.ghostPlan(ghostMismatch);
assert.strictEqual(plan2.rivalSide, "b");
assert.strictEqual(plan2.userPlays, "w");
assert.strictEqual(JSON.stringify(helpers.ghostBooks(plan2)), JSON.stringify([[], ["e5", "Nc6"]]));

// Backwards fork label: who is the victim, not the knight that forked.
assert.strictEqual(helpers.forkWho("w", "w"), "them", "I moved the knight: they walked into it");
assert.strictEqual(helpers.forkWho("b", "w"), "me", "they moved the knight: I walked into it");
assert.strictEqual(helpers.forkTitle({ who: "me", san: "Nf5" }), "You walked into a fork with Nf5.");
assert.strictEqual(helpers.forkTitle({ who: "them", san: "Nf5" }), "They walked into a fork with Nf5.");

// Recency weight: one month old is half as strong as a game today.
const t0 = Date.parse("2026-11-10T12:00:00Z");
assert.strictEqual(helpers.ageWeight(t0, t0), 1);
assert.ok(Math.abs(helpers.ageWeight(t0 - 30 * 86400 * 1000, t0) - 0.5) < 1e-9, "30-day game has weight 1/2");
assert.ok(Math.abs(helpers.ageWeight(t0 - 60 * 86400 * 1000, t0) - (1 / 3)) < 1e-9, "60-day game has weight 1/3");

const nowSec = Math.floor(Date.now() / 1000);
const recent = nowSec - 86400;
const old = nowSec - 180 * 86400;
const weighted = loadNav("prishennaidoo", {
  "chessReview.brain.opponents": JSON.stringify({
    a: {
      u: "a", name: "A", openingsW: {}, openingsB: {}, lines: {}, traps: [], puzzles: [], gamesSeen: 0,
      h2h: [
        { url: "a1", t: old, me: "w", res: "L", opn: "Old Italian" },
        { url: "a2", t: old, me: "w", res: "L", opn: "Old Italian" },
        { url: "a3", t: recent, me: "w", res: "W", opn: "Old Italian" },
        { url: "b1", t: recent, me: "b", res: "L", opn: "New Sicilian" },
        { url: "b2", t: recent, me: "b", res: "L", opn: "New Sicilian" },
        { url: "b3", t: old, me: "b", res: "W", opn: "New Sicilian" }
      ]
    }
  })
});
const wmap = weighted.openingMap();
assert.strictEqual(wmap.fix && wmap.fix.opn, "New Sicilian", "recent losses outweigh an old win when picking what to fix: " + (wmap.fix && wmap.fix.opn));
assert.ok(wmap.fix.n === 3, "raw game count stays 3");
assert.ok(weighted.mapRate(wmap.fix) < 0.25, "weighted rate on recent losses is worse than 1/3");

// Mobile-data / unknown connection gates, remembered per player via meta.dataOk.
assert.strictEqual(helpers.connectionKind(), "unknown");
assert.strictEqual(helpers.mayDownload(false), "no", "unknown connection does not auto-download");
assert.strictEqual(helpers.mayDownload(true), "ask", "unknown connection asks before the first Update brain");
const wifi = loadNav("prishennaidoo", {}, { connection: { type: "wifi" } });
assert.strictEqual(wifi.connectionKind(), "wifi");
assert.strictEqual(wifi.mayDownload(true), "yes");
const cell = loadNav("prishennaidoo", {}, { connection: { type: "cellular" } });
assert.strictEqual(cell.connectionKind(), "cellular");
assert.strictEqual(cell.mayDownload(true), "ask");
assert.strictEqual(cell.mayDownload(false), "ask");
assert.ok(/mobile data/.test(cell.askCopy()), cell.askCopy());
const remembered = loadNav("prishennaidoo", {
  "chessReview.brain.meta": JSON.stringify({ seen: [], today: null, dataOk: true })
}, { connection: { type: "cellular" } });
assert.strictEqual(remembered.mayDownload(false), "yes", "a saved yes is remembered even on mobile data");

console.log("brain81 step1+7 ok");
