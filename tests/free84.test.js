/* Free Board logic: moves, undo/redo branches, special moves, game end, setup checks, FEN paste. */
const assert=require("assert"), fs=require("fs"), path=require("path"), vm=require("vm");
const lib=require("./harness.js")().ChessLib;
const ctx=vm.createContext({ChessLib:lib,console}); ctx.window=ctx;
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","free84.js"),"utf8"),ctx);
const F=ctx.CRFree84;
const run=(st,us)=>{ for(const u of us){ const n=F.play(st,u); assert.ok(n,"legal "+u); delete n.last; st=n; } return st; };
// basic play, illegal blocked
let st=F.blank(); assert.strictEqual(F.play(st,"e2e5"),null,"illegal move blocked");
st=run(st,["e2e4","e7e5","g1f3"]); assert.strictEqual(st.idx,3); assert.strictEqual(JSON.stringify(F.line(st).map(m=>m.san)),JSON.stringify(["e4","e5","Nf3"]));
// undo then same move keeps the future, different move replaces it
let u=Object.assign({},st,{idx:1}); let k=F.play(u,"e7e5"); assert.strictEqual(k.moves.length,3); assert.strictEqual(k.idx,2);
k=F.play(u,"c7c5"); assert.strictEqual(JSON.stringify(k.moves),JSON.stringify(["e2e4","c7c5"]));
// castling, en passant, promotion
st=run(F.blank(),["e2e4","a7a6","g1f3","a6a5","f1c4","a5a4","e1g1"]); assert.strictEqual(F.line(st).pop().san,"O-O");
st=run(F.blank(),["e2e4","a7a6","e4e5","d7d5","e5d6"]); assert.ok(F.line(st).pop().flags.includes("e"),"en passant");
st=Object.assign(F.blank(),{start:"8/P6k/8/8/8/8/8/K7 w - - 0 1"}); st=run(st,["a7a8n"]); assert.strictEqual(F.line(st).pop().san,"a8=N");
// game end
st=run(F.blank(),["f2f3","e7e5","g2g4","d8h4"]); let s=F.status(F.gameAt(st)); assert.ok(s.end&&/Checkmate\. Black wins/.test(s.t));
s=F.status(F.gameAt(Object.assign(F.blank(),{start:"7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"}))); assert.ok(s.end&&/Stalemate/.test(s.t));
s=F.status(F.gameAt(Object.assign(F.blank(),{start:"4k3/8/8/8/8/8/8/R3K3 b - - 0 1"}))); assert.ok(!s.end&&/Black to move/.test(s.t));
// clean(): bad saved data falls back, illegal tail dropped, idx clamped
assert.strictEqual(F.clean(null).start,F.START);
st=F.clean({v:1,start:F.START,moves:["e2e4","e2e4","e7e5"],idx:9,orient:"b"}); assert.strictEqual(JSON.stringify([...st.moves]),JSON.stringify(["e2e4"])); assert.strictEqual(st.idx,1); assert.strictEqual(st.orient,"b");
assert.strictEqual(F.clean({v:1,start:"junk",moves:[]}).start,F.START);
// setup
let m=F.mapOf(F.START); assert.strictEqual(F.setupFen(m,"w"),F.START);
delete m.h1; assert.strictEqual(F.castleRights(m),"Qkq");
assert.ok(!F.checkFen("8/8/8/8/8/8/8/4K3 w - - 0 1").ok,"needs two kings");
assert.ok(!F.checkFen("4k3/8/8/8/8/8/8/P3K3 w - - 0 1").ok,"no pawn on rank 1");
assert.ok(!F.checkFen("4k3/8/8/8/8/8/8/4R1K1 w - - 0 1").ok,"side not to move in check");
assert.ok(F.checkFen("4k3/8/8/8/8/8/8/4R1K1 b - - 0 1").ok);
// FEN paste
let r=F.parseFen("  rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR   b KQkq e3 0 1 "); assert.ok(r.ok); assert.ok(r.fen.startsWith("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq"));
r=F.parseFen("4k3/8/8/8/8/8/8/4K3"); assert.ok(r.ok); assert.strictEqual(r.fen,"4k3/8/8/8/8/8/8/4K3 w - - 0 1");
r=F.parseFen("4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1"); assert.ok(r.ok); assert.strictEqual(r.fen.split(" ")[2],"-","impossible castling dropped");
assert.ok(!F.parseFen("hello").ok); assert.ok(!F.parseFen("").ok);
// numbering for a set-up position with Black to move
assert.strictEqual(JSON.stringify(F.numbering("4k3/8/8/8/8/8/8/4K3 b - - 0 12")),JSON.stringify({off:1,no:12}));
console.log("free84 ok");
