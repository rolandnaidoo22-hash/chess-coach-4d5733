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
