/* Golden test for the grading: scripted engine evals in, expected move classes out.
   If a future change shifts a grade, this fails and you can decide whether the shift is intended. */
const assert=require("assert"); const w=require("./harness.js")(); const A=w.Analyzer;
const PGN='[White "Tester"]\n[Black "Opp"]\n[Result "*"]\n\n1. a3 h6 2. h3 a6 3. Nc3 Nc6 4. Nd5 Nf6 5. Nxc7+ Qxc7 *';
// White-POV centipawns for the start position and after plies 1..10.
// 5.Nxc7+?? (ply 9) throws a knight away: 10 -> -300. 4.Nd5 (ply 7) is a harmless side-step (equal eval, but not the engine move).
const WHITE_CP=[20,20,20,20,15,15,10,10,10,-300,-300];
const BEST={6:"g1f3",8:"g1f3"};   // engine's preferred move in those positions (index = position before the move)
const g=A.parsePgn(PGN); const fens=[g.startFen].concat(g.moves.map(m=>m.after));
assert.strictEqual(fens.length,WHITE_CP.length);
// To also exercise a plain blunder: make 4...Nf6 (ply 8) look fine but 3.Nc3 (ply 5) be a mild slip via a scripted best move that differs.
const mock={ send(){}, ready(){return Promise.resolve();},
  analyse(fen){ const i=fens.indexOf(fen); const cp=i<0?0:WHITE_CP[i]; const stm=fen.split(" ")[1]; const nxt=g.moves[i]?(BEST[i]||g.moves[i].uci):null;
    const score={cp:stm==="w"?cp:-cp}; return Promise.resolve({score,pv:nxt?[nxt]:[],depth:12,alt:null,lines:[]}); } };
(async()=>{
  const d=await A.analyzeGame(PGN,{engine:mock,username:"tester",side:"w",mode:"quick",legacy:true},()=>{});
  const cls=d.plies.map(p=>p.cls);
  console.log(cls.join(" "));
  const by=san=>d.plies.find(p=>p.san===san);
  assert.strictEqual(by("Nxc7+").cls,"blunder","a 300cp swing must grade as a blunder");
  assert.ok(["best","excellent","good","book"].includes(by("Nd5").cls),"an equal-eval side-step is not an error: "+by("Nd5").cls);
  const bad=new Set(["inaccuracy","mistake","miss","blunder"]);
  assert.strictEqual(d.plies.filter(p=>bad.has(p.cls)&&p.san!=="Nxc7+").length,0,"no other move may be flagged");
  assert.ok(d.summary.accuracy>0&&d.summary.accuracy<100,"accuracy in range: "+d.summary.accuracy);
  console.log("grading ok, accuracy",d.summary.accuracy);
})().catch(e=>{console.error(e);process.exit(1)});
