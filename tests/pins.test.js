const assert=require("assert"); const w=require("./harness.js")();
const {Pos,hanging}=w.Analyzer._internals; const sq=n=>"abcdefgh".indexOf(n[0])+8*(+n[1]-1);
// 1) Pinned attacker can't capture: black Nd... white pawn d3 "attacked" only by a knight on e5? use bishop pinned on file.
//    White Ke1, white Be2 pinned? simple: black Re8 pins white Ne4 to Ke1 along e-file; Ne4 "attacks" d6 where black pawn sits but cannot take.
let p=new Pos("4r1k1/8/3p4/8/4N3/8/8/4K3 w - - 0 1");
assert.strictEqual(p.canCapture(sq("e4"),sq("d6")),false,"pinned knight must not capture off the pin line");
// 2) a pinned rook may still capture along the pin line
p=new Pos("4r1k1/8/8/8/4R3/8/8/4K3 w - - 0 1"); assert.strictEqual(p.canCapture(sq("e4"),sq("e8")),true);
// 3) hanging(): black pawn d6 attacked only by a pinned white knight is NOT hanging
p=new Pos("4r1k1/8/3p4/8/4N3/8/8/4K3 w - - 0 1"); assert.strictEqual(hanging(p,"b",sq("d6")),false);
// 4) same position, knight not pinned (king elsewhere) -> pawn d6 is hanging
p=new Pos("4r1k1/8/3p4/8/4N3/8/8/K7 w - - 0 1"); assert.strictEqual(hanging(p,"b",sq("d6")),true);
// 5) diagonal pin
p=new Pos("6k1/8/8/8/3b4/2N5/1K6/8 w - - 0 1"); // Bd4 pins Nc3 to Kb2? line b2-c3-d4
assert.strictEqual(p.canCapture(sq("c3"),sq("a4")),false);
console.log("pins ok");
