/* v45: "Find my level" skill assessment. Runs on the phone, no server. Puzzles: Lichess puzzle database (CC0), solutions checked with Stockfish 17 + python-chess. */
(function(){
"use strict";
const $=id=>document.getElementById(id), B=document.body;
const LS={get:(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } },set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KH="chessReview.v45.assess", KO="chessReview.v45.offered", KD="chessReview.v45.draft";
const CH=()=>window.ChessLib&&window.ChessLib.Chess||window.Chess;
const PUZ=[{"id":"080uV","fen":"r3r1k1/1ppqbppp/p1n1bn2/8/1P6/P1Q1PN2/1B1NBPPP/R3K2R b KQ - 6 14","mv":["f6d5","c3g7"],"r":458,"cat":"mate","theme":"mateIn1"},{"id":"1TZ2w","fen":"2rr4/pp3pkp/1b2pp2/4n3/4N3/1N2P3/PP3PPP/2RR2K1 w - - 12 18","mv":["c1c8","d8d1"],"r":634,"cat":"material","theme":"hangingPiece"},{"id":"00qqD","fen":"r3k2r/ppp2Bp1/2n5/2p1p2p/4P1n1/3P1N1q/PPP2P1N/R3QRK1 b kq - 0 14","mv":["e8f7","f3g5","f7g8","g5h3"],"r":804,"cat":"fork","theme":"fork"},{"id":"0CnxQ","fen":"8/2p5/1p1p1k2/p7/2P2PB1/PP6/3K4/1b6 b - - 2 46","mv":["b1f5","g4f5","f6f5","d2e3"],"r":952,"cat":"defend","theme":"defensiveMove"},{"id":"QEw28","fen":"Q1n3k1/n1q2ppb/4p2p/3pP3/3P4/1NP2N1P/r4PP1/R5K1 b - - 1 24","mv":["a2b2","a1a7"],"r":1060,"cat":"pin","theme":"pin"},{"id":"01nyk","fen":"8/1k6/1P2p1p1/2KpP3/7P/8/8/8 w - - 1 48","mv":["c5d6","d5d4","d6e6","d4d3"],"r":1156,"cat":"endgame","theme":"pawnEndgame"},{"id":"004mT","fen":"5Q2/8/1b1kp1p1/5p2/3p4/5qPK/7P/8 b - - 1 51","mv":["d6c6","f8a8","c6d6","a8f3"],"r":1361,"cat":"skewer","theme":"skewer"},{"id":"005Bm","fen":"4rk2/p1q5/1p3Q1b/8/1p5N/2P1p3/P3P3/2K5 b - - 0 43","mv":["c7f7","h4g6","f8g8","f6h8"],"r":1434,"cat":"mate","theme":"mateIn2"},{"id":"019Oa","fen":"3q4/5kpp/p1p5/1p1n4/2p1Q1P1/P6P/1PPB4/1K6 w - - 0 33","mv":["e4h7","d5f6","h7f5","d8d2"],"r":1565,"cat":"discovered","theme":"discoveredAttack"},{"id":"00Wi9","fen":"8/8/3n1P2/2k5/2pp1K2/P7/8/3B4 w - - 2 63","mv":["f4e5","d4d3","f6f7","d6f7"],"r":1729,"cat":"calc","theme":"crushing"}];
const PUZB=[{"id":"0AKwW","fen":"8/2k5/5p2/p2R4/1p5P/1Pp5/P1P5/1K4r1 w - - 2 44","mv":["d5d1","g1d1"],"r":441,"cat":"mate","theme":"mateIn1"},{"id":"2V8Ei","fen":"5rk1/p2nppbp/3p2p1/2pP4/P1q1PP2/1RN5/3QN1PP/2n2R1K w - - 0 20","mv":["e2c1","c4f1"],"r":584,"cat":"material","theme":"hangingPiece"},{"id":"02Jv8","fen":"1r4k1/p2R2pp/1pN1p3/8/8/8/bP3PPP/6K1 b - - 0 26","mv":["b8c8","c6e7","g8f8","e7c8"],"r":841,"cat":"fork","theme":"fork"},{"id":"0KKVK","fen":"8/p7/1p6/2pk2pP/4Rn2/2P5/6P1/7K w - - 1 55","mv":["h5h6","d5e4","h6h7","f4g6"],"r":964,"cat":"defend","theme":"defensiveMove"},{"id":"00tB9","fen":"1k1r3r/1bq1b1p1/p2p4/2nBp1P1/4P3/4BP2/1PPQN3/2KR3R w - - 3 24","mv":["d5b7","c5b3","c1b1","b3d2"],"r":1142,"cat":"pin","theme":"pin"},{"id":"04QLZ","fen":"8/8/4k3/K4p2/4P2p/6pP/P5P1/8 b - - 0 43","mv":["f5e4","a5b4","e6d5","b4c3"],"r":1176,"cat":"endgame","theme":"pawnEndgame"},{"id":"02tfs","fen":"8/3Q4/6p1/3p1kP1/3qpp1p/1P5P/P4PK1/8 b - - 5 43","mv":["f5e5","d7g7","e5f5","g7d4"],"r":1385,"cat":"skewer","theme":"skewer"},{"id":"00voi","fen":"1r6/2r2p1R/7R/4pPk1/2B2n2/1P3P1P/P4K2/8 b - - 0 43","mv":["c7c4","h3h4","g5f5","h7f7"],"r":1444,"cat":"mate","theme":"mateIn2"},{"id":"03ELV","fen":"r3r3/pp3pbk/2p3pB/3b4/8/2qB2QP/P1P3P1/3R1R1K b - - 0 22","mv":["g7h6","d3g6","f7g6","g3c3"],"r":1635,"cat":"discovered","theme":"discoveredAttack"},{"id":"00WlQ","fen":"2r1r1k1/pp3pp1/4bb1p/2qp4/Q7/1PNRPN2/P4PPP/3R2K1 w - - 0 19","mv":["c3d5","e6d5","a4e8","c8e8"],"r":1756,"cat":"calc","theme":"crushing"}];
const SETS={A:PUZ,B:PUZB};
const nextSet=()=>{ const H=LS.get(KH,[]); const l=H[H.length-1]; return !l?"A":((l.set||"A")==="A"?"B":"A"); };
const CATN={mate:"Checkmate",material:"Winning material",fork:"Forks",defend:"Defending",pin:"Pins",endgame:"Endgames",skewer:"Skewers",discovered:"Discovered attacks",calc:"Calculation"};
const ASK={mate:"Find the checkmate.",material:"Win material.",fork:"Find the best move. Look for a fork.",defend:"You are under threat. Find the best move.",pin:"Find the best move.",endgame:"Endgame: find the winning move.",skewer:"Find the best move.",discovered:"Find the best move.",calc:"Find the best move. Think a few moves ahead."};
const ASKX={mate:"Find the checkmate.",material:"Find the best move.",fork:"Find the best move.",defend:"Find the best move.",pin:"Find the best move.",endgame:"Find the best move.",skewer:"Find the best move.",discovered:"Find the best move.",calc:"Find the best move."};
const PIECES=[["p","♟ Pawn"],["n","♞ Knight"],["b","♝ Bishop"],["r","♜ Rook"],["q","♛ Queen"],["k","♚ King"]];
const Q=[
 {id:"exp",t:"How much chess have you played?",type:"one",o:["I've never played","I know the rules","I play now and then","I play regularly","I play in clubs or tournaments"]},
 {id:"pc",t:"Do you know how each piece moves?",type:"grid",rows:PIECES,o:["Yes","No"]},
 {id:"sp",t:"Do you know these special moves?",type:"grid",rows:[["castle","🏰 Castling"],["ep","👻 En passant"],["promo","👑 Promotion"]],o:["Yes","No","Not sure"]},
 {id:"tac",t:"Do you know these tactics?",sub:"Tactics are short tricks that win something.",type:"grid",rows:[["fork","🍴 Fork"],["pin","📌 Pin"],["skewer","🍢 Skewer"],["disc","💥 Discovered attack"],["dbl","✌ Double check"]],o:["Never heard of it","Heard of it","I understand it","I use it in games"]},
 {id:"op",t:"How many opening moves can you play from memory?",sub:"Opening moves are the first moves of the game.",type:"one",o:["None","1–3","4–8","8–15","More than 15"]},
 {id:"eg",t:"Can you win these endgames?",sub:"K = king, Q = queen, R = rook, P = pawn.",type:"grid",rows:[["kq","King + Queen vs King"],["kr","King + Rook vs King"],["kp","King + Pawn vs King"]],o:["Yes","No","Not sure"]},
 {id:"st",t:"What's your biggest struggle?",type:"one",o:["I lose pieces by mistake","I miss tactics","Openings","Not knowing what to do in the middle of the game","Endgames","Running out of time","Confidence"]}];
const BANDS=[[0,"Beginner",0,600,"the rules, keeping pieces safe and basic tactics"],[20,"Novice",600,1000,"forks, pins and opening principles"],[40,"Intermediate",1000,1400,"calculation, positional play and endgames"],[60,"Advanced",1400,1800,"strategy, complex tactics and an opening repertoire"],[80,"Expert",1800,2200,"deep preparation and tournament play"]];

/* ---------- CSS ---------- */
const CSS=`#v45{display:none;padding:4px 0 90px}#v45.on{display:block}body.hs-home #v45{display:none!important}
#v45 h2{font-size:22px;margin:6px 0 4px}#v45 .sub{color:var(--mute,#666);font-size:14px;margin:0 0 12px;line-height:1.4}
#v45 .card{background:#fff;border:1px solid var(--line,#ddd);border-radius:16px;padding:14px;margin:0 0 12px}
#v45 .top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
.v45b{min-height:46px;border-radius:12px;border:1px solid var(--line,#ddd);background:#fff;font:inherit;font-weight:700;padding:0 14px;cursor:pointer;color:var(--ink,#222)}
.v45b.pri{background:#2f7d32;color:#fff;border:none}.v45b.full{width:100%;margin:6px 0}.v45b:disabled{opacity:.45}
.v45bar{height:8px;background:#e7e3da;border-radius:6px;overflow:hidden;margin:4px 0 10px}.v45bar i{display:block;height:100%;background:#2f7d32}
.v45opt{display:block;width:100%;text-align:left;min-height:52px;margin:0 0 8px;border-radius:14px;border:2px solid var(--line,#ddd);background:#fff;font:inherit;font-size:16px;padding:10px 14px;cursor:pointer;color:var(--ink,#222)}
.v45opt.on{border-color:#2f7d32;background:#e9f5ea;font-weight:700}
.v45row{margin:0 0 12px}.v45row>b{display:block;margin:0 0 6px;font-size:16px}.v45chips{display:flex;flex-wrap:wrap;gap:6px}
.v45chips button{flex:1 1 auto;min-height:44px;border-radius:12px;border:2px solid var(--line,#ddd);background:#fff;font:inherit;font-size:14px;padding:6px 10px;cursor:pointer;color:var(--ink,#222)}
.v45chips button.on{border-color:#2f7d32;background:#e9f5ea;font-weight:700}
#v45bd{width:100%;max-width:420px;margin:0 auto;display:block;touch-action:manipulation}#v45bd svg{width:100%;height:auto;display:block;border-radius:8px}
.v45msg{font-size:16px;font-weight:700;margin:8px 0;min-height:24px}.v45msg.ok{color:#2f7d32}.v45msg.bad{color:#b3261e}
.v45big{font-size:40px;font-weight:800;line-height:1}.v45lv{display:flex;gap:14px;align-items:center}
.v45note{background:#fff7e0;border:1px solid #f0d58a;border-radius:12px;padding:10px;font-size:14px;margin:0 0 12px}
.v45wk{border-left:4px solid #2f7d32;padding:2px 0 2px 10px;margin:0 0 14px}.v45wk h4{margin:0 0 4px;font-size:16px}.v45wk p{margin:0 0 6px;font-size:14px;color:var(--mute,#666)}
.v45wk button{margin:0 6px 6px 0;min-height:40px}
.v45li{margin:0;padding-left:18px}.v45li li{margin:0 0 4px}
.v45hist{width:100%;border-collapse:collapse;font-size:14px}.v45hist td{padding:6px 4px;border-top:1px solid var(--line,#eee)}
#v45offer{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9500;display:flex;align-items:flex-end;justify-content:center}
#v45offer .c{background:#fff;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));width:100%;max-width:520px;box-sizing:border-box}
#v45offer h3{margin:0 0 6px;font-size:20px}#v45offer p{margin:0 0 12px;color:var(--mute,#666);font-size:15px;line-height:1.4}`;

/* ---------- panel ---------- */
function panel(html){ let d=$("v45"); if(!d){ d=document.createElement("div"); d.id="v45"; document.querySelector(".wrap").appendChild(d); }
  try{ window.Trainer&&Trainer.close(); }catch(e){} try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){}
  try{ const v=$("v42"); v&&v.classList.remove("on"); }catch(e){}
  if(window.CRHome) CRHome.setMode("app",true);
  d.innerHTML=`<div class="top"><button class="v45b" data-home>🏠 Home</button><span class="sub" style="margin:0">🎯 Find my level</span></div>`+html; d.classList.add("on");
  d.querySelector("[data-home]").onclick=()=>{ close(); window.CRHome&&CRHome.goHome(); }; window.scrollTo(0,0); return d; }
function close(){ const d=$("v45"); if(d){ d.classList.remove("on"); d.innerHTML=""; } stopT(); }
let T=null; const stopT=()=>{ if(T){ clearInterval(T); T=null; } };

/* ---------- state ---------- */
let S=null; // {ans:{}, qi, pi, res:[]}
function start(){ const set=nextSet(); S={ans:{},qi:0,pi:0,res:[],t0:Date.now(),set,P:SETS[set]}; intro(); }
function intro(){ const H=LS.get(KH,[]);
  panel(`<h2>🎯 Find my level</h2><p class="sub">Answer 7 quick questions, then try 10 puzzles from real games. You get your level, an estimated rating and a 4-week plan that uses this app.</p>
  <div class="card"><b>Takes about 10 minutes.</b><ul class="v45li sub" style="margin-top:6px"><li>There are no wrong answers in the questions. Be honest!</li><li>The puzzles count most (70%).</li><li>If you don't know a puzzle, tap “I don't know”. That's fine.</li></ul></div>
  <button class="v45b pri full" id="v45go">Start ▶</button>${H.length?`<button class="v45b full" id="v45last">📄 See my last result</button>`:""}`);
  $("v45go").onclick=()=>question(); if($("v45last")) $("v45last").onclick=()=>results(H[H.length-1],true); }

function question(){ const q=Q[S.qi], a=S.ans[q.id]||(q.type==="grid"?{}:null), n=Q.length+S.P.length;
  const done=q.type==="one"?a!=null:q.rows.every(r=>a[r[0]]!=null);
  let body;
  if(q.type==="one") body=q.o.map((o,i)=>`<button class="v45opt ${a===i?"on":""}" data-i="${i}">${E_(o)}</button>`).join("");
  else body=q.rows.map(r=>`<div class="v45row"><b>${E_(r[1])}</b><div class="v45chips">${q.o.map((o,i)=>`<button class="${a[r[0]]===i?"on":""}" data-r="${r[0]}" data-i="${i}">${E_(o)}</button>`).join("")}</div></div>`).join("");
  const d=panel(`<div class="sub" style="margin:0">Question ${S.qi+1} of ${Q.length}</div><div class="v45bar"><i style="width:${100*S.qi/n}%"></i></div>
   <h2>${E_(q.t)}</h2>${q.sub?`<p class="sub">${E_(q.sub)}</p>`:""}<div class="card">${body}</div>
   <div style="display:flex;gap:8px"><button class="v45b" id="v45bk" style="flex:1">‹ Back</button><button class="v45b pri" id="v45nx" style="flex:2" ${done?"":"disabled"}>Next ›</button></div>`);
  d.querySelectorAll(".v45opt").forEach(b=>b.onclick=()=>{ S.ans[q.id]=+b.dataset.i; question(); });
  d.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ const o=S.ans[q.id]||{}; o[b.dataset.r]=+b.dataset.i; S.ans[q.id]=o; const y=scrollY; question(); scrollTo(0,y); });
  $("v45bk").onclick=()=>{ if(S.qi===0) intro(); else { S.qi--; question(); } };
  $("v45nx").onclick=()=>{ if(S.qi<Q.length-1){ S.qi++; question(); } else { S.pi=0; puzzleIntro(); } }; }

function puzzleIntro(){ panel(`<h2>🧩 Now 10 puzzles</h2><p class="sub">They start easy and get harder.${S.set==="B"?" This is a new set of puzzles, different from last time.":""} Tap a piece, then tap where it should go.</p>
  <div class="card"><ul class="v45li sub"><li>One wrong move ends the puzzle. That's OK, just keep going.</li><li>We also time you, but take the time you need.</li><li>After each puzzle, tell us how sure you were.</li></ul></div><button class="v45b pri full" id="v45go">Start the puzzles ▶</button>`);
  $("v45go").onclick=()=>puzzle(); }

/* ---------- puzzle board ---------- */
function puzzle(){ const p=S.P[S.pi], C=CH(), g=new C(p.fen); g.move({from:p.mv[0].slice(0,2),to:p.mv[0].slice(2,4),promotion:p.mv[0][4]||"q"});
  const me=g.turn(), n=Q.length+S.P.length; let ply=1, sel=null, over=false, t0=0, last=[p.mv[0].slice(0,2),p.mv[0].slice(2,4)], before=p.fen;
  const ask=ASKX[p.cat];
  const d=panel(`<div class="sub" style="margin:0">Puzzle ${S.pi+1} of ${S.P.length}</div><div class="v45bar"><i style="width:${100*(Q.length+S.pi)/n}%"></i></div>
   <h2>${me==="w"?"⚪ White":"⚫ Black"} to move</h2><p class="sub" style="margin:0 0 6px">${E_(ask)}</p>
   <div id="v45bd"></div><div class="v45msg" id="v45m"></div><div id="v45ft"><button class="v45b full" id="v45idk">🤷 I don't know</button></div><div class="sub" id="v45tm" style="text-align:right"></div>`);
  const draw=fen=>{ const hl=[]; last&&last.forEach(s=>hl.push({sq:s,c:"#f6f669",o:.45})); if(sel) hl.push({sq:sel,c:"#2f7d32",o:.5});
    const dots=sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[];
    $("v45bd").innerHTML=Trainer.boardSvg(fen||g.fen(),me,{hl,dots,loose:false}); };
  draw(before); setTimeout(()=>{ if(!$("v45bd")) return; draw(); t0=Date.now();
    T=setInterval(()=>{ const e=$("v45tm"); if(!e){ stopT(); return; } if(!over) e.textContent="⏱ "+Math.round((Date.now()-t0)/1000)+" s"; },500); },700);
  const finish=ok=>{ over=true; stopT(); const secs=Math.round((Date.now()-(t0||Date.now()))/1000);
    const m=$("v45m"); m.className="v45msg "+(ok?"ok":"bad"); 
    if(!ok){ const s=p.mv[ply]; m.textContent=(ok===null?"No problem. ":"Not quite. ")+"The best move was shown with a green box."; last=[s.slice(0,2),s.slice(2,4)]; sel=null;
      $("v45bd").innerHTML=Trainer.boardSvg(g.fen(),me,{hl:[{sq:last[0],c:"#2f7d32",o:.55},{sq:last[1],c:"#2f7d32",o:.55}],loose:false}); }
    else m.textContent="✅ Solved in "+secs+" s!";
    $("v45ft").innerHTML=`<div class="card" style="margin-top:4px"><b>${ok?"How sure were you?":"How sure were you about this one?"}</b><div class="v45chips" style="margin-top:8px"><button data-c="0">🎲 Guessed</button><button data-c="1">🙂 Fairly sure</button><button data-c="2">💯 Certain</button></div></div>`;
    $("v45ft").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ S.res[S.pi]={id:p.id,cat:p.cat,r:p.r,ok:!!ok,secs,conf:+b.dataset.c};
      b.classList.add("on"); setTimeout(()=>{ if(S.pi<S.P.length-1){ S.pi++; puzzle(); } else done(); },250); }); };
  $("v45idk").onclick=()=>{ if(!over&&t0) finish(null); };
  const sqAt=ev=>{ const sv=$("v45bd").querySelector("svg"); if(!sv) return null; const r=sv.getBoundingClientRect(); const x=Math.floor((ev.clientX-r.left)/r.width*8), y=Math.floor((ev.clientY-r.top)/r.height*8);
    if(x<0||x>7||y<0||y>7) return null; return me==="w"?"abcdefgh"[x]+(8-y):"abcdefgh"[7-x]+(y+1); };
  $("v45bd").onclick=ev=>{ if(over||!t0) return; const sq=sqAt(ev); if(!sq) return; const pc=g.get(sq);
    if(pc&&pc.color===me){ sel=sq; draw(); return; } if(!sel) return;
    const mv=g.moves({square:sel,verbose:true}).find(m=>m.to===sq); if(!mv){ sel=null; draw(); return; }
    const uci=sel+sq+(mv.promotion?"q":""), want=p.mv[ply]; sel=null;
    g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:"q"}); last=[uci.slice(0,2),uci.slice(2,4)];
    const right=uci===want||(uci.slice(0,4)===want.slice(0,4))||g.isCheckmate();
    if(!right){ g.undo(); draw(); finish(false); return; }
    ply++; draw(); if(g.isCheckmate()||ply>=p.mv.length){ finish(true); return; }
    const r=p.mv[ply]; setTimeout(()=>{ g.move({from:r.slice(0,2),to:r.slice(2,4),promotion:r[4]||"q"}); last=[r.slice(0,2),r.slice(2,4)]; ply++; draw(); $("v45m").textContent="Good! Keep going."; $("v45m").className="v45msg ok"; },450); }; }

/* ---------- scoring ---------- */
function score(ans,res){
  let pw=0,pt=0; res.forEach(x=>{ const w=x.r/1000; pw+=w; if(x.ok){ const tf=x.secs<=30?1:x.secs>=150?0.6:1-0.4*(x.secs-30)/120; pt+=w*tf*(x.conf===0?0.85:1); } });
  const P=pw?70*pt/pw:0;
  const avg=(o,k)=>{ const v=Object.values(o||{}); return v.length?v.reduce((a,b)=>a+b,0)/v.length/k:0; };
  const yes=o=>Object.values(o||{}).reduce((a,v)=>a+(v===0?1:v===2?0.3:0),0);
  const qq=6*((ans.exp||0)/4)+4*(Object.values(ans.pc||{}).filter(v=>v===0).length/6)+3*(yes(ans.sp)/3)+8*avg(ans.tac,3)+4*((ans.op||0)/4)+5*(yes(ans.eg)/3);
  const tot=Math.round(Math.max(0,Math.min(100,P+qq)));
  const bi=tot>=80?4:tot>=60?3:tot>=40?2:tot>=20?1:0, b=BANDS[bi];
  const lo=b[0], hi=bi===4?100:BANDS[bi+1][0], fr=(tot-lo)/(hi-lo), est=Math.round((b[2]+fr*(b[3]-b[2]))/25)*25;
  return {score:tot,puz:Math.round(P),quiz:Math.round(qq),band:bi,level:b[1],est,lo:Math.max(0,est-100),hi:est+100,bandLo:b[2],bandHi:b[3],overclaim:(qq/30)-(P/70)>0.35&&qq>=15};
}
function profile(ans,res){ const st=[],wk=[], cats={}; res.forEach(x=>{ (cats[x.cat]=cats[x.cat]||[]).push(x); });
  Object.entries(cats).forEach(([c,a])=>{ const ok=a.filter(x=>x.ok).length; if(ok===a.length) st.push(CATN[c]+" (puzzles solved)"); else if(ok===0) wk.push({k:c,t:CATN[c]+" (puzzle missed)"}); });
  const badPc=PIECES.filter(p=>(ans.pc||{})[p[0]]===1).map(p=>p[1].split(" ")[1].toLowerCase());
  if(badPc.length) wk.unshift({k:"rules",t:"How the "+badPc.join(", ")+" "+(badPc.length>1?"move":"moves")});
  else st.push("You know how every piece moves");
  const sp=ans.sp||{}; const spN=[["castle","castling"],["ep","en passant"],["promo","promotion"]].filter(x=>sp[x[0]]!==0).map(x=>x[1]);
  if(spN.length) wk.push({k:"rules",t:"Special moves: "+spN.join(", ")});
  const tac=ans.tac||{}; const tUse=Object.values(tac).filter(v=>v>=2).length; if(tUse>=4) st.push("You know the main tactics by name"); else if(tUse<=1) wk.push({k:"tacticsT",t:"Tactics ideas (fork, pin, skewer)"});
  const eg=ans.eg||{}; if(eg.kq===0&&eg.kr===0) st.push("Basic checkmates with queen and rook"); else wk.push({k:"egmate",t:"Checkmating with king + queen or rook"});
  if((ans.op||0)<=1) wk.push({k:"open",t:"Opening moves and principles"}); else if(ans.op>=3) st.push("You know your openings");
  return {st:st.slice(0,5),wk:wk.slice(0,6)}; }

/* ---------- links to existing features ---------- */
const TH={hangingPiece:0,fork:1,pin:2,skewer:3,mateIn1:4,mateIn2:5,discoveredAttack:7,endgame:10,defensiveMove:11,mateIn3:12};
const go=fn=>()=>{ close(); try{ if(window.CRHome) CRHome.setMode("app",true); fn(); }catch(e){ console.error(e); } };
const L={
 learn:["📘 Learn the basics",go(()=>CRLearn.open())],
 lessons:["🎓 Lessons",go(()=>Trainer.open("sec","lessons"))],
 drills:["⚡ Quick drills",go(()=>Trainer.open("sec","drills"))],
 puzzles:["🧩 Puzzles from my games",go(()=>Trainer.open("sec","puzzles"))],
 trap:["🪤 Trap Radar (openings)",go(()=>TrapRadar.open())],
 play:["🤖 Play the bot",go(()=>Trainer.open("sec","play"))],
 coach:["🧑‍🏫 My Coach",go(()=>Coach17.open("home"))],
 review:["📋 Review a game",()=>{ close(); try{ CRHome.goHome(); document.querySelector('#hsG [data-hs="review"]').click(); }catch(e){} }],
};
const th=(k,label)=>[label,go(()=>Trainer.open("lthemes",{k:TH[k]}))];
const CATL={mate:th("mateIn1","♛ Mate in 1 set"),material:th("hangingPiece","🎁 Hanging pieces"),fork:th("fork","🍴 Fork puzzles"),pin:th("pin","📌 Pin puzzles"),skewer:th("skewer","🍢 Skewer puzzles"),
 discovered:th("discoveredAttack","💥 Discovered attacks"),endgame:th("endgame","🏁 Endgame puzzles"),defend:th("defensiveMove","🛡 Defend! puzzles"),calc:th("mateIn2","♛♛ Mate in 2 set")};
const STRUG=[["Stop losing pieces","Before every move, check: is the piece I'm moving safe? Is anything else now unprotected?",[L.drills,th("hangingPiece","🎁 Hanging pieces")]],
 ["Spot more tactics","Do a few tactics puzzles every day. Look at checks, captures and threats first.",[th("fork","🍴 Fork puzzles"),th("pin","📌 Pin puzzles"),L.puzzles]],
 ["Better openings","Learn the traps in your openings and follow the opening rules: centre, develop, castle.",[L.trap,L.lessons]],
 ["Middle-game plans","Review your games to see where the plan went wrong, and use your coach's daily plan.",[L.review,L.coach]],
 ["Endgames","Practise winning with few pieces left.",[th("endgame","🏁 Endgame puzzles"),L.lessons]],
 ["Use your clock well","Play the bot with a 10-minute clock. Spend more time on hard moves, less on easy ones.",[L.play]],
 ["Build confidence","Small wins every day: solve the puzzle of the day and beat the bot on an easy level, then step up.",[L.play,th("mateIn1","♛ Mate in 1 set")]]];
function plan(ans,res,sc,pr){ const W=[]; const wkK=pr.wk.map(w=>w.k), miss=res.filter(x=>!x.ok).map(x=>x.cat);
  const tacMiss=[...new Set(miss.filter(c=>c!=="endgame"&&c!=="calc"))];
  if(wkK.includes("rules")||sc.band===0) W.push(["The rules and safe pieces","Go through the basics until every piece and special move feels easy. Then do mate-in-1 puzzles.",[L.learn,th("mateIn1","♛ Mate in 1 set"),th("hangingPiece","🎁 Hanging pieces")]]);
  if(tacMiss.length) W.push(["Tactics you missed","10–15 minutes a day on the puzzle types you missed in the test.",tacMiss.slice(0,3).map(c=>CATL[c])]);
  else W.push(["Sharper tactics","You solved the tactics. Now go for longer ones: mate in 2 and mate in 3.",[th("mateIn2","♛♛ Mate in 2 set"),th("mateIn3","♛♛♛ Mate in 3 set"),L.drills]]);
  const s=STRUG[ans.st!=null?ans.st:1]; W.push([s[0]+" (your choice)",s[1],s[2]]);
  if(wkK.includes("egmate")||miss.includes("endgame")) W.push(["Endgames","Learn the basic checkmates and simple pawn endgames.",[L.lessons,th("endgame","🏁 Endgame puzzles")]]);
  if(wkK.includes("open")) W.push(["Opening principles","Learn the opening rules and the traps people fall for in your openings.",[L.trap,L.lessons]]);
  W.push(["Play, review, repeat","Play the bot or real games, review each one in the app, and practise the mistakes it finds.",[L.play,L.review,L.puzzles]]);
  const out=[]; W.forEach(w=>{ if(out.length<4&&!out.some(o=>o[0]===w[0])) out.push(w); }); while(out.length<4) out.push(W[W.length-1]);
  out[3]=[out[3][0]+" + retake the test",out[3][1]+" At the end of the week, retake “Find my level” to see how far you've come.",out[3][2]]; return out; }
function chessComRating(){ try{ const A=(window.PatternStore&&PatternStore.all())||[]; const r=A.filter(x=>x.myElo).sort((a,b)=>String(a.date).localeCompare(String(b.date))); const x=r[r.length-1]; return x?{elo:x.myElo,date:x.date,tc:x.tc}:null; }catch(e){ return null; } }

function done(){ const sc=score(S.ans,S.res), pr=profile(S.ans,S.res); const d=new Date();
  const rec={date:d.toISOString(),set:S.set,ans:S.ans,res:S.res,...sc,st:pr.st,wk:pr.wk,mins:Math.round((Date.now()-S.t0)/60000)};
  const H=LS.get(KH,[]); H.push(rec); LS.set(KH,H.slice(-30)); LS.set(KO,1); results(rec,false); try{ window.CRHome&&CRHome.paint&&CRHome.paint(); }catch(e){} }

function results(rec,old){ const pr={st:rec.st||[],wk:rec.wk||[]}, sc=rec, W=plan(rec.ans,rec.res,sc,pr), cc=chessComRating(), H=LS.get(KH,[]);
  const solved=rec.res.filter(x=>x.ok).length;
  const d=panel(`<h2>♞ Your chess profile</h2><p class="sub">${old?"From your test on ":"Done! "}${new Date(rec.date).toLocaleDateString()}${old?".":". Here's what we found."}</p>
   <div class="card"><div class="v45lv"><div class="v45big">${sc.score}</div><div><b style="font-size:19px">${E_(sc.level)}</b><div class="sub" style="margin:2px 0 0">Score out of 100</div></div></div>
    <div class="v45bar" style="margin-top:10px"><i style="width:${sc.score}%"></i></div>
    <p style="margin:6px 0 4px;font-size:16px">Estimated rating: <b>${sc.lo}–${sc.hi}</b></p>
    ${cc?`<p style="margin:0 0 4px;font-size:15px">Your Chess.com rating: <b>${E_(cc.elo)}</b> <span class="sub">(latest game in the app)</span></p>`:""}
    <p class="sub" style="margin:4px 0 0">Puzzles: ${solved} of ${rec.res.length} solved (${sc.puz} of 70 points) · Questions: ${sc.quiz} of 30 points</p>
    <p class="sub" style="margin:6px 0 0">At this level, work on ${E_(BANDS[sc.band][4])}.</p></div>
   ${sc.overclaim?`<div class="v45note">💡 Your answers show you know a lot, but the puzzles were harder for you. That's normal! The puzzles count more, so your level is based mostly on them. Practise and retake the test: your score will catch up.</div>`:""}
   <div class="card"><h3 style="margin:0 0 6px">💪 Strengths</h3>${pr.st.length?`<ul class="v45li">${pr.st.map(s=>`<li>${E_(s)}</li>`).join("")}</ul>`:`<p class="sub">Keep going: your strengths will show up as you practise.</p>`}
    <h3 style="margin:12px 0 6px">🎯 Work on</h3>${pr.wk.length?`<ul class="v45li">${pr.wk.map(s=>`<li>${E_(s.t)}</li>`).join("")}</ul>`:`<p class="sub">Nothing big. Great job!</p>`}</div>
   <div class="card"><h3 style="margin:0 0 8px">📅 Your 4-week plan</h3><p class="sub">About 15–20 minutes a day. Tap a button to jump straight to that part of the app.</p>
    ${W.map((w,i)=>`<div class="v45wk"><h4>Week ${i+1}: ${E_(w[0])}</h4><p>${E_(w[1])}</p>${w[2].map((l,j)=>`<button class="v45b" data-w="${i}" data-j="${j}">${E_(l[0])}</button>`).join("")}</div>`).join("")}</div>
   <div class="card"><h3 style="margin:0 0 6px">🧩 Your puzzles (Set ${E_(rec.set||"A")})</h3><table class="v45hist">${rec.res.map((x,i)=>`<tr><td>${i+1}. ${E_(CATN[x.cat])}</td><td>~${x.r}</td><td>${x.ok?"✅":"❌"}</td><td>${x.secs}s</td><td>${["🎲","🙂","💯"][x.conf]||""}</td></tr>`).join("")}</table></div>
   ${H.length>1?`<div class="card"><h3 style="margin:0 0 6px">📈 Past results</h3><table class="v45hist">${H.slice().reverse().map(h=>`<tr><td>${new Date(h.date).toLocaleDateString()}</td><td><b>${h.score}</b></td><td>${E_(h.level)}</td><td>${h.lo}–${h.hi}</td><td>Set ${E_(h.set||"A")}</td></tr>`).join("")}</table></div>`:""}
   <button class="v45b pri full" id="v45re">🔄 Retake the test</button>`);
  d.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>W[+b.dataset.w][2][+b.dataset.j][1]());
  $("v45re").onclick=start; }

/* ---------- entry points ---------- */
function open(){ const H=LS.get(KH,[]); if(H.length) results(H[H.length-1],true); else start(); }
function tile(){ const g=$("hsG"); if(!g||g.querySelector("[data-v45t]")) return; const H=LS.get(KH,[]), h=H[H.length-1];
  const b=document.createElement("button"); b.type="button"; b.dataset.v45t="1";
  b.innerHTML=`<span class="i">🎯</span><span><b>Find my level</b><br><small>${h?E_(h.level+" · "+h.lo+"–"+h.hi):"Skill test + 4-week plan"}</small></span>`;
  b.onclick=open; const ref=g.querySelector('[data-hs="review"]'); g.insertBefore(b,ref?ref.nextSibling:g.firstChild); }
function offer(){ if(LS.get(KO,0)||LS.get(KH,[]).length) return; if($("wel16")||!B.classList.contains("hs-home")) return;
  let n=0; try{ n=(window.PatternStore&&PatternStore.all().length)||0; }catch(e){} if(n>0){ LS.set(KO,1); return; }
  const d=document.createElement("div"); d.id="v45offer"; d.innerHTML=`<div class="c"><h3>🎯 What's your chess level?</h3><p>Take a 10-minute test: 7 questions and 10 puzzles. You get your level, an estimated rating and a 4-week plan.</p>
   <button class="v45b pri full" id="v45oy">Find my level ▶</button><button class="v45b full" id="v45on">Skip for now</button><p style="font-size:13px;margin:8px 0 0">You can take it any time from the 🎯 Find my level tile.</p></div>`;
  B.appendChild(d); LS.set(KO,1); $("v45oy").onclick=()=>{ d.remove(); start(); }; $("v45on").onclick=()=>d.remove(); }
function boot(){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  const g=$("hsG"); if(g) new MutationObserver(tile).observe(g,{childList:true}); tile();
  new MutationObserver(()=>{ if(B.classList.contains("hs-home")) close(); }).observe(B,{attributes:true,attributeFilter:["class"]});
  /* no auto popup: Skip should land on a home screen that stays still. The tile is always there. */ }
window.CRAssess={open,start,score,_sets:SETS,nextSet};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,300)); else setTimeout(boot,300);
})();
