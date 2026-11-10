/* Champion bot: list entry, position book, engine fallback, and no source name in shipping files. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const forbidden = /magnus|carlsen/i;
const shipping = [
  "bots-data.js", "bots.js", "bots-engine.js", "champion.js", "champion-book.json",
  "privacy.html", "sw.js", "home.js"
];
shipping.forEach(name => {
  const t = fs.readFileSync(path.join(root, name), "utf8");
  assert.ok(!forbidden.test(t), name + " must not name the book source");
});

const data = fs.readFileSync(path.join(root, "bots-data.js"), "utf8");
assert.ok(/id:"champion"/.test(data), "Champion is in the bot list");
assert.ok(/name:"Champion"/.test(data), "visible name is Champion");
assert.ok(/elo:2500/.test(data), "Champion has a rating label");
assert.ok(/bookId:"champion"/.test(data), "Champion uses the position book");
assert.ok(/quietBias/.test(data) && /tradeAhead/.test(data), "Champion has positional style knobs");
assert.ok(!/norway|world champion|chess\.com/i.test(data.match(/id:"champion"[\s\S]*?\n\}/)[0]), "Champion bio stays original");

const idx = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(/champion\.js/.test(idx), "index.html loads champion.js");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.ok(/champion\.js/.test(sw) && /champion-book\.json/.test(sw), "service worker precaches Champion files");
const eng = fs.readFileSync(path.join(root, "bots-engine.js"), "utf8");
assert.ok(/CRChampion\.bookMove/.test(eng), "engine consults the Champion book first");
assert.ok(/quietBias/.test(eng) && /tradeAhead/.test(eng), "engine applies positional / trade-when-ahead style");
assert.ok(/!bot\.bookId/.test(eng), "Opponent Brain book is skipped for book-backed bots");

const priv = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
assert.ok(/Practice bots/.test(priv), "privacy page mentions practice-bot book updates");
assert.ok(/only on this phone/.test(priv));

const wf = fs.readFileSync(path.join(root, "tools/champion-book-workflow.yml"), "utf8");
assert.ok(/cron:/.test(wf) && /workflow_dispatch/.test(wf), "workflow is scheduled and manual");
assert.ok(/gh-pages/.test(wf) && /Refusing/.test(wf), "workflow refuses to push live branches");

const book = JSON.parse(fs.readFileSync(path.join(root, "champion-book.json"), "utf8"));
assert.ok(book.games >= 40, "book used a reasonable number of games: " + book.games);
assert.ok(book.positions >= 100, "book has positions: " + book.positions);
assert.ok(book.depth >= 12 && book.depth <= 16, "depth is 12–16");
assert.ok(book.from && book.to, "book records a date range");
assert.ok(!forbidden.test(JSON.stringify(book)), "book JSON does not name the source");
const startKey = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
assert.ok(book.book[startKey], "start position is in the book");
assert.ok(book.book[startKey].e4 || book.book[startKey].d4, "start position includes e4 and/or d4");

const src = fs.readFileSync(path.join(root, "champion.js"), "utf8");
function load() {
  const store = {};
  const localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  };
  const window = { localStorage, document: { getElementById() { return null; } } };
  window.window = window;
  const fetch = async () => ({ ok: true, json: async () => book });
  const ctx = {
    window, document: window.document, localStorage, fetch,
    navigator: { onLine: true },
    console, setTimeout, clearTimeout, Date, Math, JSON, String, Object, Array, Promise, Error, atob
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.CRChampion;
}

async function main() {
  const C = load();
  assert.ok(C, "CRChampion exported");
  ["bookMove", "loadBook", "fenKey", "pick"].forEach(k => assert.strictEqual(typeof C[k], "function", k));
  await C.loadBook();

  assert.strictEqual(C.fenKey("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"),
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -");

  const first = [
    { san: "e4" }, { san: "d4" }, { san: "c4" }, { san: "Nf3" }, { san: "g3" }, { san: "b3" }
  ];
  const m1 = await C.bookMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", first);
  assert.ok(m1 && ["e4", "d4", "c4"].includes(m1.san), "book move from the start is a main first move: " + (m1 && m1.san));

  const afterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
  const black = [{ san: "c5" }, { san: "e5" }, { san: "e6" }, { san: "c6" }, { san: "g6" }, { san: "Nf6" }, { san: "d6" }];
  const m2 = await C.bookMove(afterE4, black);
  assert.ok(m2 && ["c5", "e6", "g6"].includes(m2.san), "book reply to 1.e4: " + (m2 && m2.san));

  const afterD4 = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1";
  const m3 = await C.bookMove(afterD4, [{ san: "Nf6" }, { san: "d5" }, { san: "g6" }, { san: "e6" }, { san: "c5" }, { san: "f5" }]);
  assert.ok(m3 && ["Nf6", "d5", "g6"].includes(m3.san), "book reply to 1.d4: " + (m3 && m3.san));

  const empty = "8/8/8/8/8/4k3/8/4K3 w - - 0 1";
  const m4 = await C.bookMove(empty, [{ san: "Kd2" }, { san: "Kf2" }]);
  assert.strictEqual(m4, null, "unknown position falls through to the engine");

  console.log("champion ok");
}
main().catch(err => { console.error(err); process.exit(1); });
