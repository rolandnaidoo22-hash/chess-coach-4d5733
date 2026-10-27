/* v41: "Learn the basics" — rules for complete beginners. Own file; uses the app's board drawing (Trainer.boardSvg) and chess.js. */
(function(){
"use strict"; if(window.CRLearn) return;
const $=id=>document.getElementById(id), KEY="chessReview.learn.v1";
const LS={get(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } },set(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} }};
const NAME={k:"King",q:"Queen",r:"Rook",b:"Bishop",n:"Knight",p:"Pawn"};
const pic=(c,t,sz)=>`<svg viewBox="0 0 45 45" width="${sz||44}" height="${sz||44}"><use href="#pc-${c}${t.toUpperCase()}"/></svg>`;
const CSS=`#lrn{display:none;padding:4px 0 80px;max-width:560px;margin-left:auto;margin-right:auto}#lrn.on{display:block}
#lrn h2{font-size:21px;margin:6px 0 4px}#lrn h3{font-size:17px;margin:16px 0 6px}#lrn p{line-height:1.45;margin:6px 0}#lrn .mute{color:var(--mute);font-size:13.5px}
#lrn .lt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;min-height:62px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--ink);font:inherit;padding:10px 12px;margin:0 0 8px;cursor:pointer}
#lrn .lt .i{font-size:26px;width:34px;text-align:center}#lrn .lt b{font-size:16px}#lrn .lt small{display:block;color:var(--mute);font-size:12.5px}#lrn .lt .tk{margin-left:auto;font-size:20px}
#lrn .card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:10px 12px;margin:8px 0}
#lrn .pcs{display:grid;grid-template-columns:1fr 1fr;gap:8px}#lrn .pc{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:6px 8px;background:#fff}#lrn .pc b{font-size:15px}#lrn .pc small{display:block;color:var(--mute);font-size:12px;line-height:1.3}
#lrn .bd{width:100%;max-width:none;margin:8px auto;touch-action:none;user-select:none}#lrn .bd svg{width:100%;height:auto;display:block;border-radius:6px}
#lrn .msg{min-height:24px;font-weight:700;margin:6px 0}#lrn .ok{color:#2e7d32}#lrn .no{color:#c62828}
#lrn .row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}#lrn .bt{min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-weight:700;padding:0 14px;cursor:pointer}#lrn .bt.on,#lrn .bt.go{background:#2f7d32;color:#fff;border-color:#2f7d32}
#lrn .tray{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:6px 0}#lrn .tray button{width:44px;height:48px;border:2px solid var(--line);border-radius:10px;background:#fff;padding:0;touch-action:none}#lrn .tray button.sel{border-color:#f5c518;background:#fff8d6}
#lrn .qo{display:block;width:100%;text-align:left;min-height:46px;margin:6px 0;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--ink);font:inherit;padding:8px 12px;cursor:pointer}#lrn .qo.right{background:#e3f4e4;border-color:#2e7d32}#lrn .qo.wrong{background:#fde6e6;border-color:#c62828}
#lrn ul{padding-left:20px;margin:6px 0}#lrn li{margin:4px 0;line-height:1.4}#lrn .bar{height:8px;background:#e6e6e6;border-radius:5px;overflow:hidden;margin:4px 0 12px}#lrn .bar i{display:block;height:100%;background:#2f7d32}
html.dark-mode #lrn .lt,html.dark-mode #lrn .card,html.dark-mode #lrn .pc,html.dark-mode #lrn .bt:not(.on):not(.go),html.dark-mode #lrn .qo,html.dark-mode #lrn .tray button{background:#262626;color:#eee;border-color:#3a3a3a}`;

/* ---------- topics ---------- */
const TOPICS=[
 {id:"pieces",i:"♟",t:"The pieces",s:"Names, pictures and points"},
 {id:"moves",i:"➡",t:"How each piece moves",s:"See the squares, then try it"},
 {id:"setup",i:"🧩",t:"Setting up the board",s:"Light on the right, queen on her colour"},
 {id:"castle",i:"🏰",t:"Castling",s:"Both sides, and when you can't"},
 {id:"ep",i:"👻",t:"En passant",s:"The special pawn capture"},
 {id:"promo",i:"👑",t:"Pawn promotion",s:"A pawn becomes a new piece"},
 {id:"check",i:"✚",t:"Check, checkmate, stalemate",s:"How a game is won (or drawn)"},
 {id:"draws",i:"🤝",t:"Draws",s:"Short list of the draw rules"}];
const QUIZ={
 pieces:[["How many points is a rook worth?",["3","5","9"],1,"Rook = 5. Knight and bishop = 3, queen = 9, pawn = 1."],
  ["Which piece can you never lose?",["The queen","The king","The rook"],1,"The king is never captured. If it's trapped (checkmate), the game ends."],
  ["How many pawns does each player start with?",["6","8","10"],1,"8 pawns each, in a row in front of the other pieces."],
  ["Which is worth more?",["A knight","A bishop","They're about the same (3 each)"],2,"Knight and bishop are both worth about 3."]],
 moves:[["Which piece moves in an L shape and can jump over pieces?",["Bishop","Knight","Rook"],1,"The knight: 2 squares one way, 1 square to the side. It's the only piece that jumps."],
  ["How does a bishop move?",["Straight lines","Diagonally, any distance","One square any way"],1,"Bishops move diagonally and stay on one colour all game."],
  ["How does a pawn capture?",["Straight forward","One square diagonally forward","Backwards"],1,"Pawns move straight but capture one square diagonally forward."],
  ["How far can the king move?",["One square in any direction","Any distance","Two squares"],0,"The king moves one square in any direction (castling is the one exception)."]],
 setup:[["Which corner square must be light?",["Bottom-left","Bottom-right","Top-left"],1,"Light on the right: the bottom-right square (h1 for White) is light."],
  ["Where does the white queen go?",["On a dark square","On her own colour: the light square d1","Next to the rook"],1,"Queen on her own colour: white queen on light d1, black queen on dark d8."],
  ["What are files?",["The columns a to h","The rows 1 to 8","The diagonals"],0,"Files are the columns (a–h). Ranks are the rows (1–8)."],
  ["What goes next to the rooks?",["Bishops","Knights","Pawns"],1,"Rook, knight, bishop, queen, king, bishop, knight, rook."]],
 castle:[["When you castle, how far does the king move?",["1 square","2 squares toward the rook","3 squares"],1,"The king moves 2 squares toward the rook, and the rook jumps over to the other side of it."],
  ["Can you castle when you're in check?",["Yes","No"],1,"No. You can't castle out of check, through check, or into check."],
  ["Your king moved once and came back. Can it still castle?",["Yes","No, never in this game"],1,"Once the king has moved, it can never castle in that game."],
  ["Can there be pieces between the king and the rook?",["Yes","No, the squares must be empty"],1,"All squares between them must be empty."]],
 ep:[["Who can capture en passant?",["Only a pawn","Any piece","Only the king"],0,"Only a pawn can capture en passant, and only a pawn can be captured that way."],
  ["When can you do it?",["Any time later","Only on the very next move","Only in the endgame"],1,"Only right away, on the move just after their pawn jumped 2 squares. Wait and the chance is gone."],
  ["Where does your pawn end up?",["On the square the enemy pawn skipped over","Where the enemy pawn was","It stays put"],0,"It moves diagonally to the square the other pawn jumped over, and the other pawn is removed."]],
 promo:[["What can a pawn become when it reaches the last row?",["Only a queen","A queen, rook, bishop or knight","A king"],1,"Any of queen, rook, bishop or knight. Never a king, and it can't stay a pawn."],
  ["What do most players choose?",["Queen","Knight","Bishop"],0,"Almost always a queen, because it's the strongest. Sometimes a knight gives check or avoids stalemate."],
  ["Can you have two queens?",["No","Yes"],1,"Yes! You can promote even if your first queen is still on the board."]],
 check:[["What is check?",["Your king is attacked","Your queen is attacked","The game is over"],0,"Check = the king is attacked. You must get out of it on your next move."],
  ["Three ways out of check are:",["Move the king, block, or capture the attacker","Castle, resign, or wait","Move any piece"],0,"Move the king, put a piece in the way, or take the attacking piece."],
  ["What is stalemate?",["A win","The player to move has no legal moves but is NOT in check: a draw","Checkmate"],1,"Stalemate is a draw. Careful when you're winning: leave their king a move or give check!"],
  ["What is checkmate?",["The king is in check and has no way out","Any check","Taking the queen"],0,"Checkmate: in check with no escape. The game is over."]],
 draws:[["Is the game a draw if both sides have only a king left?",["Yes, nobody can checkmate","No"],0,"Yes. Not enough pieces to checkmate is a draw (king vs king, king + bishop vs king, king + knight vs king)."],
  ["The same position happens 3 times. Then…",["It's a draw","The game goes on","White wins"],0,"Threefold repetition is a draw."],
  ["50 moves each with no capture and no pawn move…",["It's a draw","The player with more pieces wins"],0,"The 50-move rule: a draw can be claimed (online it's automatic)."]]};

/* ---------- small board widget ---------- */
function sqAt(el,ev){ const r=el.getBoundingClientRect(); if(!r.width) return null; const x=Math.floor(8*(ev.clientX-r.left)/r.width), y=Math.floor(8*(ev.clientY-r.top)/r.height); if(x<0||x>7||y<0||y>7) return null; return "abcdefgh"[x]+(8-y); }
function mkBoard(el,onTap){ const B={fen:"8/8/8/8/8/8/8/8 w - - 0 1",o:{}};
  B.draw=(fen,o)=>{ B.fen=fen||B.fen; B.o=o||{}; el.innerHTML=Trainer.boardSvg(B.fen,"w",Object.assign({loose:false},B.o),false); };
  let down=null; el.addEventListener("pointerdown",ev=>{ const s=sqAt(el,ev); if(!s) return; down=s; onTap&&onTap(s); ev.preventDefault(); });
  el.addEventListener("pointerup",ev=>{ const s=sqAt(el,ev), d=down; down=null; if(s&&d&&s!==d) onTap&&onTap(s); });
  return B; }
/* a playable chess.js board: tap a piece to see dots, tap a dot to move. */
function playBoard(el,msgEl,fen,check,after){ let c=new Chess(fen), sel=null, lock=false;
  const draw=extra=>B.draw(c.fen(),Object.assign({hl:sel?[{sq:sel,c:"#f5c518",o:.65}]:[],dots:sel?c.moves({square:sel,verbose:true}).map(m=>m.to):[]},extra||{}));
  const B=mkBoard(el,sq=>{ if(lock) return; const p=c.get(sq); if(p&&p.color===c.turn()){ sel=sq; draw(); return; } if(!sel) return;
    const cands=c.moves({square:sel,verbose:true}).filter(m=>m.to===sq); const from=sel; sel=null; if(!cands.length){ draw(); return; }
    const doMove=mv=>{ const before=c.fen(); const m=c.move({from:mv.from,to:mv.to,promotion:mv.promotion}); const r=check(m,c,before)||{};
      msgEl.className="msg "+(r.ok?"ok":r.ok===false?"no":""); msgEl.innerHTML=r.msg||"";
      draw({hl:[{sq:m.from,c:"#f5c518",o:.35},{sq:m.to,c:r.ok===false?"#d23c3c":"#2e9b4f",o:.55}]});
      if(r.ok===false){ lock=true; setTimeout(()=>{ c=new Chess(before); lock=false; draw(); },1400); } else if(after) after(m,c,r); };
    if(cands[0].promotion){ promoAsk(cands[0].color,t=>{ if(t) doMove(cands.find(m=>m.promotion===t)); else draw(); }); } else doMove(cands[0]); });
  draw(); return {B,reset:f=>{ c=new Chess(f||fen); sel=null; lock=false; msgEl.textContent=""; draw(); },chess:()=>c,draw,lock:v=>lock=v}; }
function promoAsk(col,cb){ const o=document.createElement("div"); o.className="promo"; o.innerHTML=`<div class="promob"><p><b>Your pawn becomes:</b></p><div class="promor">${["q","r","b","n"].map(t=>`<button class="btn" data-p="${t}">${pic(col,t,40)}<small>${NAME[t]}</small></button>`).join("")}</div></div>`;
  document.body.appendChild(o); o.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ o.remove(); cb(b.dataset.p); }); }

/* ---------- lone-piece move maker (for "how pieces move") ---------- */
const F="abcdefgh"; const at=(f,r)=>f>=0&&f<8&&r>=0&&r<8?F[f]+(r+1):null;
function lone(t,sq,enemy){ const f=F.indexOf(sq[0]), r=+sq[1]-1, out=[]; enemy=enemy||[];
  const ray=(df,dr,one)=>{ let x=f+df,y=r+dr; while(at(x,y)){ out.push(at(x,y)); if(one||enemy.includes(at(x,y))) break; x+=df; y+=dr; } };
  const O=[[1,0],[-1,0],[0,1],[0,-1]], D=[[1,1],[1,-1],[-1,1],[-1,-1]];
  if(t==="r") O.forEach(d=>ray(...d)); if(t==="b") D.forEach(d=>ray(...d)); if(t==="q") O.concat(D).forEach(d=>ray(...d)); if(t==="k") O.concat(D).forEach(d=>ray(...d,true));
  if(t==="n") [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,b])=>{ const s=at(f+a,r+b); if(s) out.push(s); });
  if(t==="p"){ if(at(f,r+1)&&!enemy.includes(at(f,r+1))){ out.push(at(f,r+1)); if(r===1&&!enemy.includes(at(f,r+2))) out.push(at(f,r+2)); } [-1,1].forEach(d=>{ const s=at(f+d,r+1); if(s&&enemy.includes(s)) out.push(s); }); }
  return out; }
function fenOf(map){ let rows=[]; for(let r=7;r>=0;r--){ let s="",e=0; for(let f=0;f<8;f++){ const p=map[F[f]+(r+1)]; if(p){ if(e){ s+=e; e=0; } s+=p; } else e++; } if(e) s+=e; rows.push(s); } return rows.join("/")+" w - - 0 1"; }
const MOVEINFO={k:["e4","The king moves 1 square in any direction. Keep it safe!"],q:["d4","The queen moves any distance: straight or diagonal. The strongest piece."],r:["d4","The rook moves any distance in straight lines: up, down, left, right."],b:["d4","The bishop moves any distance diagonally. It stays on one colour."],n:["d4","The knight jumps in an L: 2 squares one way, then 1 to the side. It can jump over pieces."],p:["e2","The pawn moves 1 square forward (2 on its first move). It captures 1 square diagonally forward. It can't move backwards."]};

/* ---------- screens ---------- */
let root=null;
function done(){ return LS.get(); }
function tick(id,part){ const s=LS.get(); s[id]=s[id]||{}; s[id][part]=true; LS.set(s); }
function isDone(id){ const s=LS.get()[id]; return !!(s&&s.quiz); }
function progressText(){ const n=TOPICS.filter(t=>isDone(t.id)).length; return n?`${n} of ${TOPICS.length} done`:"Pieces, moves and rules"; }
function menu(){ const n=TOPICS.filter(t=>isDone(t.id)).length;
  root.innerHTML=`<h2>📘 Learn the basics</h2><p class="mute">New to chess? Start at the top. Each topic has a short lesson, a board to try, and a quick quiz. Pass the quiz to get a ✅.</p>
  <div class="bar"><i style="width:${Math.round(100*n/TOPICS.length)}%"></i></div><p class="mute">${n} of ${TOPICS.length} topics done</p>
  ${TOPICS.map((t,k)=>`<button class="lt" data-t="${t.id}"><span class="i">${t.i}</span><span><b>${k+1}. ${t.t}</b><small>${t.s}</small></span><span class="tk">${isDone(t.id)?"✅":"○"}</span></button>`).join("")}`;
  root.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>topic(b.dataset.t)); }
function head(id){ const T=TOPICS.find(t=>t.id===id), k=TOPICS.indexOf(T); return `<div class="row"><button class="bt" data-back>‹ All topics</button></div><h2>${T.i} ${T.t}</h2>`; }
function foot(id){ const k=TOPICS.findIndex(t=>t.id===id); return `<h3>📝 Quick quiz</h3><div id="lq"></div>${k<TOPICS.length-1?`<div class="row"><button class="bt" data-next>Next topic: ${TOPICS[k+1].t} ›</button></div>`:""}`; }
function wire(id){ root.querySelector("[data-back]").onclick=menu; const nx=root.querySelector("[data-next]"); if(nx) nx.onclick=()=>topic(TOPICS[TOPICS.findIndex(t=>t.id===id)+1].id); quiz(id,$("lq")); window.scrollTo(0,0); }
function quiz(id,el){ const Q=QUIZ[id]; let k=0, right=0;
  const show=()=>{ if(k>=Q.length){ const pass=right===Q.length; if(pass) tick(id,"quiz");
      el.innerHTML=`<div class="card"><p class="msg ${pass?"ok":"no"}">${pass?"✅ All correct! Topic done.":`${right} of ${Q.length} right. Get them all to finish the topic.`}</p><div class="row"><button class="bt" data-again>↻ Try the quiz again</button><button class="bt go" data-menu>All topics</button></div></div>`;
      el.querySelector("[data-again]").onclick=()=>quiz(id,el); el.querySelector("[data-menu]").onclick=menu; return; }
    const [q,opts,a,why]=Q[k]; el.innerHTML=`<div class="card"><p class="mute">Question ${k+1} of ${Q.length}</p><p><b>${q}</b></p>${opts.map((o,i)=>`<button class="qo" data-o="${i}">${o}</button>`).join("")}<p class="msg" id="lqm"></p></div>`;
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.o; el.querySelectorAll("[data-o]").forEach(x=>{ x.disabled=true; if(+x.dataset.o===a) x.classList.add("right"); }); if(i!==a) b.classList.add("wrong"); else right++;
      $("lqm").className="msg "+(i===a?"ok":"no"); $("lqm").innerHTML=(i===a?"✅ Correct. ":"❌ Not quite. ")+`<span style="font-weight:400">${why}</span><br><button class="bt go" id="lqn" style="margin-top:8px">${k+1<Q.length?"Next question ›":"See result"}</button>`; $("lqn").onclick=()=>{ k++; show(); }; }); };
  show(); }
function topic(id){ ({pieces,moves,setup,castle,ep,promo,check,draws})[id](); try{ history.pushState({hs:"app",lrn:id},""); }catch(e){} }

function pieces(){ const L=[["k","King","Can't be captured","The most important piece. Lose it (checkmate) and you lose the game."],["q","Queen","9 points","The strongest piece."],["r","Rook","5 points","Looks like a castle tower."],["b","Bishop","3 points","Has a slit on its head."],["n","Knight","3 points","The horse."],["p","Pawn","1 point","The small ones in front. You have 8."]];
  root.innerHTML=head("pieces")+`<p>Each side has 16 pieces: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights and 8 pawns. White always moves first.</p>
  <div class="pcs">${L.map(([t,n,v,d])=>`<div class="pc">${pic("w",t)}${pic("b",t,34)}<span><b>${n}</b><small><b>${v}</b><br>${d}</small></span></div>`).join("")}</div>
  <div class="card"><p><b>Why points matter:</b> before you trade, add up the points. Giving a knight (3) for a rook (5) is good for you. Giving a queen (9) for a bishop (3) is bad.</p></div>
  <h3>Name that piece</h3><div class="card" id="lnp"></div>`+foot("pieces"); wire("pieces");
  const el=$("lnp"); let n=0; const ask=()=>{ const t="kqrbnp"[Math.floor(Math.random()*6)], c=Math.random()<.5?"w":"b";
    el.innerHTML=`<div style="text-align:center">${pic(c,t,80)}</div><div class="row" style="justify-content:center">${"kqrbnp".split("").map(x=>`<button class="bt" data-n="${x}">${NAME[x]}</button>`).join("")}</div><p class="msg" id="lnm">${n?`Streak: ${n}`:""}</p>`;
    el.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{ const ok=b.dataset.n===t; n=ok?n+1:0; $("lnm").className="msg "+(ok?"ok":"no"); $("lnm").textContent=ok?`✅ Yes, a ${NAME[t].toLowerCase()}!`:`❌ That's a ${NAME[t].toLowerCase()}.`; setTimeout(ask,900); }); }; ask(); }

function moves(){ root.innerHTML=head("moves")+`<p>Pick a piece. The dots show every square it can move to. Then move it to the ⭐ gold square. Do 3 in a row for each piece.</p>
  <div class="row" id="lmp">${"kqrbnp".split("").map(t=>`<button class="bt" data-p="${t}">${NAME[t]}</button>`).join("")}</div>
  <p id="lmi"></p><div class="bd" id="lmb"></div><p class="msg" id="lmm"></p><p class="mute">Pieces can't jump over others (only the knight can). You capture by moving onto an enemy piece's square.</p>`+foot("moves"); wire("moves");
  let t=null, sq=null, sel=false, goal=null, cnt=0, enemy=[];
  const B=mkBoard($("lmb"),s=>{ if(!t) return; if(s===sq){ sel=true; draw(); return; } if(!sel) return; const ok=lone(t,sq,enemy).includes(s);
    if(!ok){ $("lmm").className="msg no"; $("lmm").textContent=`❌ A ${NAME[t].toLowerCase()} can't go there. Follow the dots.`; return; }
    if(s!==goal){ $("lmm").className="msg no"; $("lmm").textContent="That's a legal move, but go to the ⭐ gold square."; return; }
    cnt++; sq=s; sel=false; enemy=enemy.filter(e=>e!==s); $("lmm").className="msg ok"; $("lmm").textContent=cnt>=3?`✅ Great! You know how the ${NAME[t].toLowerCase()} moves.`:`✅ Yes! ${cnt} of 3.`;
    if(cnt>=3){ const s2=LS.get(); s2.moves=s2.moves||{}; s2.moves["p_"+t]=true; LS.set(s2); paintBtns(); } newGoal(); draw(); });
  const newGoal=()=>{ if(t==="p"&&sq[1]==="8"){ sq="e2"; enemy=["d3"]; } const L=lone(t,sq,enemy); goal=L[Math.floor(Math.random()*L.length)]; };
  const draw=()=>{ const map={}; map[sq]=t==="p"?"P":t.toUpperCase(); enemy.forEach(e=>map[e]="n"); B.draw(fenOf(map),{hl:[{sq:goal,c:"#e0a800",o:.75}].concat(sel?[{sq,c:"#f5c518",o:.6}]:[]),dots:lone(t,sq,enemy)}); };
  const paintBtns=()=>{ const s=(LS.get().moves)||{}; $("lmp").querySelectorAll("[data-p]").forEach(b=>{ b.classList.toggle("on",b.dataset.p===t); b.textContent=NAME[b.dataset.p]+(s["p_"+b.dataset.p]?" ✓":""); }); };
  const pick=p=>{ t=p; sq=MOVEINFO[p][0]; enemy=p==="p"?["d3"]:[]; cnt=0; sel=false; newGoal(); $("lmi").innerHTML=`${pic("w",p,30)} <b>${NAME[p]}:</b> ${MOVEINFO[p][1]}${p==="p"?" The black knight on d3 shows the diagonal capture.":""} <br><span class="mute">Tap the ${NAME[p].toLowerCase()}, then tap the ⭐ square.</span>`; $("lmm").textContent=""; paintBtns(); draw(); };
  $("lmp").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>pick(b.dataset.p)); pick("r"); }

function setup(){ root.innerHTML=head("setup")+`<ul><li><b>Light on the right:</b> turn the board so each player has a light square in the bottom-right corner.</li>
  <li><b>Back row, from the corners in:</b> rook, knight, bishop, then queen and king in the middle.</li><li><b>Queen on her own colour:</b> white queen on the light square (d1), black queen on the dark square (d8). The kings face each other on e1 and e8.</li>
  <li><b>Pawns:</b> all 8 on the second row (rank 2 for White, rank 7 for Black).</li><li><b>Files</b> are the columns a to h. <b>Ranks</b> are the rows 1 to 8. A square's name is file + rank, like e4.</li></ul>
  <div class="bd" id="lsb0"></div><p class="mute" style="text-align:center">Gold: the light square on the right (h1). Green: queens on their own colour.</p>
  <h3>🧩 Set up the board</h3><p>Drag each white piece to its square, or tap a piece and then tap the square.</p><div class="tray" id="lst"></div><div class="bd" id="lsb"></div><p class="msg" id="lsm"></p><div class="row"><button class="bt" id="lsr">↻ Start again</button></div>`+foot("setup"); wire("setup");
  const B0=mkBoard($("lsb0")); B0.draw("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",{hl:[{sq:"h1",c:"#e0a800",o:.7},{sq:"d1",c:"#2e9b4f",o:.55},{sq:"d8",c:"#2e9b4f",o:.55}]});
  const HOME={a1:"R",b1:"N",c1:"B",d1:"Q",e1:"K",f1:"B",g1:"N",h1:"R"}; let tray, map, sel=null;
  const reset=()=>{ tray="RNBQKBNR".split(""); map={}; for(let i=0;i<8;i++) map[F[i]+"2"]="P"; sel=null; $("lsm").textContent=""; paint(); };
  const paint=()=>{ $("lst").innerHTML=tray.map((p,i)=>`<button data-i="${i}" class="${sel===i?"sel":""}">${pic("w",p.toLowerCase(),40)}</button>`).join("")||"<p class='msg ok'>✅ Perfect setup!</p>";
    $("lst").querySelectorAll("[data-i]").forEach(b=>b.addEventListener("pointerdown",ev=>{ sel=+b.dataset.i; paint(); ev.preventDefault(); })); B.draw(fenOf(map)); };
  const place=s=>{ if(sel==null||!tray[sel]) return; const p=tray[sel]; if(map[s]){ msg(false,"That square is taken."); return; }
    if(HOME[s]===p){ map[s]=p; tray.splice(sel,1); sel=null; msg(true,tray.length?"✅ Right!":"✅ Perfect! The board is set up. White moves first."); if(!tray.length) tick("setup","drag"); paint(); }
    else { msg(false,`❌ The ${NAME[p.toLowerCase()].toLowerCase()} doesn't go on ${s}. ${p==="Q"?"Queen on her own colour (light square)!":p==="K"?"The king goes next to the queen.":"Remember: rook, knight, bishop from the corner."}`); } };
  const msg=(ok,t)=>{ $("lsm").className="msg "+(ok?"ok":"no"); $("lsm").textContent=t; };
  const B=mkBoard($("lsb"),s=>place(s));
  document.addEventListener("pointerup",ev=>{ if(sel==null||!$("lsb")) return; const r=$("lsb").getBoundingClientRect(); if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom) return; const s=sqAt($("lsb"),ev); if(s) place(s); });
  $("lsr").onclick=reset; reset(); }

function castle(){ root.innerHTML=head("castle")+`<p>Castling is the only move where two pieces move at once. It tucks your king away safely and brings a rook into the game.</p>
  <ul><li><b>Short (king side, O-O):</b> king e1 → g1, rook h1 → f1.</li><li><b>Long (queen side, O-O-O):</b> king e1 → c1, rook a1 → d1.</li><li>To castle, move the <b>king two squares</b> toward the rook. The rook jumps over by itself.</li></ul>
  <h3>Try it</h3><p id="lci"></p><div class="bd" id="lcb"></div><p class="msg" id="lcm"></p><div class="row" id="lcs"></div>
  <div class="card"><b>You can't castle if:</b><ul><li>your king or that rook has already moved (even once),</li><li>there's any piece between them,</li><li>your king is in check right now,</li><li>the king would pass through or land on an attacked square.</li></ul></div>`+foot("castle"); wire("castle");
  const STEPS=[["Castle short (king side): tap your king, then g1.","r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",m=>m.flags.includes("k")?{ok:true,msg:"✅ Short castle! King on g1, rook on f1."}:{ok:false,msg:"Not castling. Move the king 2 squares to g1."}],
   ["Now castle long (queen side): king to c1.","r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",m=>m.flags.includes("q")?{ok:true,msg:"✅ Long castle! King on c1, rook on d1."}:{ok:false,msg:"Move the king 2 squares to c1."}],
   ["The black rook on f8 attacks f1. Your king can't pass through f1, so short castling is not allowed. Find the castle you CAN do.","4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1",m=>m.flags.includes("q")?{ok:true,msg:"✅ Right! Long castling is fine. Short was blocked because the king would cross an attacked square."}:{ok:false,msg:"Short castling isn't allowed here. Look at the other side."}],
   ["You're in check from the bishop! You can't castle out of check. Get out of check another way.","4k3/8/8/b7/8/8/8/R3K2R w KQ - 0 1",(m,c)=>({ok:true,msg:`✅ ${m.san}: out of check. (The king had no castling dots: no castling while in check.)`})]];
  let k=0; const pb=playBoard($("lcb"),$("lcm"),STEPS[0][1],(m,c)=>STEPS[k][2](m,c),(m,c,r)=>{ if(r.ok){ pb.lock(true); if(k===STEPS.length-1) tick("castle","try"); steps(); } });
  const steps=()=>{ $("lcs").innerHTML=STEPS.map((s,i)=>`<button class="bt ${i===k?"on":""}" data-s="${i}">${i+1}${i<k||(LS.get().castle||{}).try?" ✓":""}</button>`).join("")+(k<STEPS.length-1?`<button class="bt go" data-s="${k+1}">Next ›</button>`:""); $("lcs").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>go(+b.dataset.s)); };
  const go=i=>{ k=i; $("lci").innerHTML=`<b>Step ${i+1} of ${STEPS.length}:</b> ${STEPS[i][0]}`; pb.reset(STEPS[i][1]); steps(); }; go(0); }

function ep(){ root.innerHTML=head("ep")+`<p>"En passant" is French for "in passing". If an enemy pawn jumps 2 squares and lands right <b>beside</b> your pawn, you may capture it as if it had moved only 1 square.</p>
  <ul><li>Only pawns can do it, and only on your <b>very next move</b>.</li><li>Your pawn moves diagonally to the square the enemy pawn skipped. The enemy pawn is removed.</li></ul>
  <h3>Try it</h3><p id="lei"></p><div class="bd" id="leb"></div><p class="msg" id="lem"></p><div class="row"><button class="bt" id="ler">↻ Again</button></div>`+foot("ep"); wire("ep");
  const START="4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1";
  const pb=playBoard($("leb"),$("lem"),START,(m)=>m.flags.includes("e")?{ok:true,msg:"✅ En passant! Your pawn went to d6 and the black pawn on d5 is gone."}:{ok:false,msg:`${m.san} is legal, but you missed the en passant capture. Try e5 takes d6.`},(m,c,r)=>{ if(r.ok){ pb.lock(true); tick("ep","try"); } });
  const run=()=>{ pb.reset(START); pb.lock(true); $("lei").innerHTML="Watch: Black pushes the d-pawn 2 squares…"; setTimeout(()=>{ const c=pb.chess(); c.move("d5"); pb.draw({hl:[{sq:"d7",c:"#f5c518",o:.4},{sq:"d5",c:"#f5c518",o:.6}],arrows:[{u:"d7d5",c:"orange"}]}); pb.lock(false);
    $("lei").innerHTML="It landed next to your e5 pawn. <b>Your move:</b> tap your pawn on e5, then tap d6 to capture en passant."; },900); };
  $("ler").onclick=run; run(); }

function promo(){ root.innerHTML=head("promo")+`<p>When a pawn reaches the far side of the board (row 8 for White, row 1 for Black), it <b>must</b> turn into a queen, rook, bishop or knight. Most of the time pick a queen.</p>
  <h3>Try it</h3><p>Push your pawn to b8 and choose a queen.</p><div class="bd" id="lpb"></div><p class="msg" id="lpm"></p><div class="row"><button class="bt" id="lpr">↻ Again</button></div>`+foot("promo"); wire("promo");
  const S="4k3/1P6/8/8/8/8/8/4K3 w - - 0 1";
  const pb=playBoard($("lpb"),$("lpm"),S,(m)=>m.promotion?{ok:true,msg:m.promotion==="q"?"✅ A new queen! Now you have a big advantage.":`✅ You made a ${NAME[m.promotion].toLowerCase()}. That's allowed, but a queen is usually best.`}:{ok:false,msg:"Move the pawn to b8."},(m,c,r)=>{ if(r.ok){ pb.lock(true); tick("promo","try"); } });
  $("lpr").onclick=()=>pb.reset(S); }

function check(){ root.innerHTML=head("check")+`<ul><li><b>Check:</b> your king is attacked. You must fix it right away: <b>move</b> the king, <b>block</b> with a piece, or <b>capture</b> the attacker.</li>
  <li><b>Checkmate:</b> in check with no way out. The game is over: that side loses.</li><li><b>Stalemate:</b> the player to move is <b>not</b> in check but has no legal move. It's a <b>draw</b>, even if one side has much more.</li></ul>
  <h3>Try it</h3><p id="lki"></p><div class="bd" id="lkb"></div><p class="msg" id="lkm"></p><div class="row" id="lks"></div>`+foot("check"); wire("check");
  const STEPS=[["You're in check from the rook. Get out of check! (Only legal moves show dots.)","4k3/8/8/8/8/8/4r3/2B1K3 w - - 0 1",m=>({ok:true,msg:`✅ ${m.san}: out of check.${m.captured?" Capturing the attacker is often best!":""}`})],
   ["Checkmate in 1: use the rook. Their own pawns trap the king.","6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",(m,c)=>c.isCheckmate()?{ok:true,msg:"✅ Checkmate! Back-row mate."}:{ok:false,msg:"Not checkmate yet. Look at the back row (row 8)."}],
   ["Checkmate in 1 with the queen, but don't stalemate!","7k/8/5K2/8/8/8/8/6Q1 w - - 0 1",(m,c)=>c.isCheckmate()?{ok:true,msg:"✅ Checkmate! The king is attacked and has no square."}:c.isStalemate()?{ok:false,msg:"🤝 Stalemate! Their king isn't in check but can't move, so it's a draw. Try again."}:{ok:false,msg:"Not checkmate. Try another queen move."}]];
  let k=0; const pb=playBoard($("lkb"),$("lkm"),STEPS[0][1],(m,c)=>STEPS[k][2](m,c),(m,c,r)=>{ if(r.ok){ pb.lock(true); if(k===STEPS.length-1) tick("check","try"); steps(); } });
  const steps=()=>{ $("lks").innerHTML=STEPS.map((s,i)=>`<button class="bt ${i===k?"on":""}" data-s="${i}">${i+1}</button>`).join("")+(k<STEPS.length-1?`<button class="bt go" data-s="${k+1}">Next ›</button>`:""); $("lks").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>go(+b.dataset.s)); };
  const go=i=>{ k=i; $("lki").innerHTML=`<b>Step ${i+1} of ${STEPS.length}:</b> ${STEPS[i][0]}`; pb.reset(STEPS[i][1]); steps(); }; go(0); }

function draws(){ root.innerHTML=head("draws")+`<p>A draw means nobody wins. It happens when:</p><ul>
  <li><b>Stalemate:</b> the player to move has no legal move and isn't in check.</li><li><b>Agreement:</b> both players agree to a draw.</li>
  <li><b>Same position 3 times</b> (threefold repetition).</li><li><b>50-move rule:</b> 50 moves each with no capture and no pawn move.</li>
  <li><b>Not enough pieces to checkmate:</b> king vs king, king + bishop vs king, king + knight vs king.</li><li><b>Online:</b> if your time runs out but your opponent can't possibly checkmate you, it's a draw, not a loss.</li></ul>
  <div class="bd" id="ldb"></div><p class="mute" style="text-align:center">King + knight vs king: a draw, nobody can checkmate.</p>`+foot("draws"); wire("draws");
  mkBoard($("ldb")).draw("8/8/3k4/8/8/2N5/4K3/8 w - - 0 1"); }

/* ---------- open / close ---------- */
function ensure(){ if(root) return; const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  root=document.createElement("div"); root.id="lrn"; const w=document.querySelector(".wrap")||document.body; const hs=$("hs"); if(hs&&hs.parentNode===w) hs.after(root); else w.insertBefore(root,w.firstChild); }
function open(id){ ensure(); try{ window.Trainer&&Trainer.close(); }catch(e){} root.classList.add("on"); if(id) topic(id); else menu(); window.scrollTo(0,0); }
function close(){ if(root){ root.classList.remove("on"); root.innerHTML=""; } document.querySelectorAll(".promo").forEach(x=>x.remove()); }
window.addEventListener("popstate",()=>{ const s=history.state; if(root&&root.classList.contains("on")&&s&&s.hs==="app"&&!s.lrn) menu(); });
window.CRLearn={open,close,progressText,_topics:TOPICS};
})();
