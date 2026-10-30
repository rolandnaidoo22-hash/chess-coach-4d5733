/* v64: My blind spots (from your analysed games) + Train this. Our own words. */
(function(){ "use strict"; if(window.CRBlind64) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const CH=()=>(window.ChessLib&&ChessLib.Chess)||window.Chess, PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"}, VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const SPOTS={
 knightback:{i:"↩️",t:"Backward knight moves",d:"A knight move that goes back toward its own side was the key move, and it was missed.",lab:["Fork"],nb:1},
 capundef:{i:"🫳",t:"Piece left loose after a capture",d:"You took something, but the piece that captured was left without a protector.",lab:["Hanging piece"],def:1},
 aftercap:{i:"⏸️",t:"Stopped checking after your own capture",d:"Right after a capture, a different piece of yours was left in trouble.",lab:["Hanging piece"],def:1},
 threat:{i:"⚠️",t:"Missed the threat from their last move",d:"Their move attacked one of your pieces, and your reply didn't deal with it.",def:1},
 oppcheck:{i:"♚",t:"Missed a check for your opponent",d:"After your move, your opponent had a check that won something.",lab:["Fork","Skewer"],def:1},
 tactic:{i:"🍴",t:"Walked into a fork, pin or skewer",d:"Your move let your opponent hit two things at once, or pin a piece.",lab:["Fork","Pin","Skewer","Discovered attack"],def:1},
 unsafe:{i:"🎯",t:"Moved a piece to an unsafe square",d:"The piece you just moved could be taken for free, or by a cheaper piece.",lab:["Hanging piece"],def:1},
 loose:{i:"⭕",t:"Left a piece unprotected",d:"A piece you didn't move was left with no protector and could be taken.",lab:["Hanging piece"],def:1},
 missedwin:{i:"💎",t:"Missed a winning check or capture",d:"Your opponent made a slip and a check or capture would have won material or the game.",lab:["Hanging piece","Fork","Checkmate"]},
 earlyq:{i:"👸",t:"Early queen moves",d:"The queen came out in the first five moves and could be chased around.",lab:["Trapped piece"]},
 king:{i:"🏰",t:"King safety",d:"The king stayed in the middle too long, or the pawns in front of it were pushed early.",lab:["Back-rank mate","Checkmate"],def:1}};
const sqI=s=>"abcdefgh".indexOf(s[0])+8*(+s[1]-1);
function after(fen,u){ try{ const g=new (CH())(fen); const m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); return m?{g,m}:null; }catch(e){ return null; } }
const back=(fen,u)=>{ if(!u) return false; const b=window.Patterns&&Patterns._board(fen), p=b&&b[sqI(u.slice(0,2))]; if(!p||p.t!=="n") return false; const d=+u[3]-+u[1]; return p.c==="w"?d<0:d>0; };
const isCap=(fen,u)=>{ const a=after(fen,u); return !!(a&&a.m.captured); };
const isCheck=(fen,u)=>{ const a=after(fen,u); return !!(a&&/[+#]/.test(a.m.san)); };
/* one blind spot for each costly move (ev entries from the pattern extractor) */
function classify(evs){ const by={}; evs.forEach(e=>{ (by[e.ply]=by[e.ply]||[]).push(e); }); const out=[];
  Object.values(by).forEach(L=>{ const e0=L[0], fen=e0.fen, u=e0.uci, f=k=>L.find(e=>e.k===k); let s=null, ex=null;
    const h=f("hang"), fe=f("fell"), mt=f("misstac"), mi=f("miss"), mm=f("missmate");
    const reply=(h&&h.reply)||(fe&&fe.reply)||null, cap=u&&isCap(fen,u), A=u&&after(fen,u), fen2=A?A.g.fen():null;
    if((mt||mi||mm)&&back(fen,e0.best)) s="knightback";
    else if(reply&&fen2&&back(fen2,reply)) s="knightback";
    else if(h&&cap&&h.moved) s="capundef";
    else if((h||fe)&&cap) s="aftercap";
    else if(reply&&fen2&&isCheck(fen2,reply)) s="oppcheck";
    else if(fe) s="tactic";
    else if(h&&h.moved) s="unsafe";
    else if(h){ let pre=false; try{ const b=Patterns._board(fen), c=fen.split(" ")[1], t=sqI(h.sq); pre=Patterns._attackers(b,c==="w"?"b":"w",t).length>0; }catch(x){} s=pre?"threat":"loose"; }
    else if(mm||mi||mt) s=(e0.best&&(isCap(fen,e0.best)||isCheck(fen,e0.best)))||mm?"missedwin":null;
    else if(f("earlyqueen")) s="earlyq"; else if(f("kingcenter")||f("fgpush")) s="king";
    if(!s&&(mi||mt)) s="missedwin"; if(s) out.push({s,ply:e0.ply,fen,uci:u,best:e0.best,reply,loss:Math.max(...L.map(e=>e.loss||0)),lab:e0.lab}); });
  return out; }
/* sources: coach list (full games), pattern store, learn-from-loss lessons */
function games(){ const out=[], seen=new Set(); const ok=x=>x&&Array.isArray(x.ev);
  try{ Coach17._all().forEach(g=>{ let r=null; try{ r=Patterns.extract(ReviewApp.upgrade(g.d)); }catch(e){} if(!ok(r)) return; const id=String(g.id).replace(/\/$/,""); if(seen.has(id)) return; seen.add(id); r.id=id; out.push(r); }); }catch(e){}
  try{ Object.values(PatternStore.all()).forEach(r=>{ if(!ok(r)) return; const id=String(r.id||"").replace(/\/$/,""); if(seen.has(id)) return; seen.add(id); out.push(r); }); }catch(e){}
  return out.filter(r=>r.n>0).sort((a,b)=>String(a.date).localeCompare(String(b.date))); }
function lessons(){ try{ return (CRLearn60._st().lessons||[]).length; }catch(e){ return 0; } }
function map(){ const G=games(), C={}; G.forEach((g,gi)=>classify(g.ev||[]).forEach(x=>{ const o=C[x.s]=C[x.s]||{s:x.s,n:0,ex:[],old:0,neu:0}; o.n++; (gi<G.length/2?o.old++:o.neu++);
    o.ex.push(Object.assign(x,{date:g.date,opp:g.me==="w"?g.black:g.white,me:g.me,gid:g.id,res:g.res})); }));
  const half=Math.max(1,Math.floor(G.length/2)), half2=Math.max(1,G.length-half);
  const L=Object.values(C).map(o=>{ o.ex.sort((a,b)=>b.loss-a.loss); const a=o.old/half, b=o.neu/half2; o.rate=o.n/Math.max(1,G.length);
    o.trend=G.length<12||o.n<4?"few":b<a*0.75?"better":b>a*1.25?"worse":"same"; return o; }).sort((a,b)=>b.n-a.n||b.ex[0].loss-a.ex[0].loss);
  return {games:G.length,spots:L,lessons:lessons()}; }
const TR={few:"Too few games to see a trend yet",better:"📉 Happening less in your recent games",worse:"📈 Happening more in your recent games",same:"➖ About the same lately"};
function open(){ try{ CRHome.setMode("app",true); }catch(e){} const p=CR52.show("bs64"), M=map(), top=M.spots.slice(0,3);
  p.innerHTML=`<h2>🔦 My blind spots</h2><p class="mute">From ${M.games} analysed game${M.games===1?"":"s"} of yours${M.lessons?` and ${M.lessons} lesson${M.lessons>1?"s":""} from your losses`:""}. Each costly move is sorted into one kind of blind spot.</p>
   ${M.games<15?`<div class="card bs64warn">ℹ️ This is based on only ${M.games} game${M.games===1?"":"s"}. Treat it as a first guess; it gets more reliable after about 10–20 checked games.</div>`:""}
   ${top.length?top.map((o,i)=>{ const S=SPOTS[o.s]; return `<div class="card bs64c"><div class="bs64h"><span class="bs64i">${S.i}</span><div><b>${i+1}. ${E_(S.t)}</b><small>${o.n} time${o.n>1?"s":""} in ${M.games} games · ${TR[o.trend]}</small></div></div>
     <p>${E_(S.d)}</p><div class="bs64ex">${o.ex.slice(0,3).map((x,k)=>`<button type="button" class="bs64m" data-s="${o.s}" data-k="${k}" aria-label="Example ${k+1}">${CR52.mini(x.fen,x.me,{arrows:[{u:x.uci,c:"red"}]})}<small>vs ${E_(x.opp||"?")} · ${E_(x.date||"")}</small></button>`).join("")}</div>
     <button type="button" class="bs64go" data-tr="${o.s}">🎯 Train this</button></div>`; }).join("")
   :`<div class="card"><p>No blind spots found yet. Check a few of your games first (My Coach → Check for new games).</p></div>`}
   ${M.spots.length>3?`<details class="card"><summary>Other blind spots</summary><ul>${M.spots.slice(3).map(o=>`<li>${SPOTS[o.s].i} ${E_(SPOTS[o.s].t)}: ${o.n}</li>`).join("")}</ul></details>`:""}
   `;
  p.querySelectorAll(".bs64m").forEach(b=>b.onclick=()=>example(M.spots.find(o=>o.s===b.dataset.s).ex[+b.dataset.k],b.dataset.s));
  p.querySelectorAll("[data-tr]").forEach(b=>b.onclick=()=>train(b.dataset.tr,M)); window.__bs64=M; return M; }
function san(fen,u){ const a=after(fen,u); return a?a.m.san:""; }
function pieceAt(fen,u){ const a=after(fen,u); return a?PN[a.m.piece]:"piece"; }
function example(x,s){ let v=$("bs64ov"); if(!v){ v=document.createElement("div"); v.id="bs64ov"; document.body.appendChild(v); } const S=SPOTS[s], ar=[{u:x.uci,c:"red"}]; if(x.best&&x.best!==x.uci) ar.push({u:x.best,c:"green"});
  let tail=""; if(x.reply){ const A=after(x.fen,x.uci); if(A) tail=` Then their ${pieceAt(A.g.fen(),x.reply)} could go to ${x.reply.slice(2,4)}.`; }
  v.innerHTML=`<div class="bs64sh" role="dialog" aria-label="Example"><div class="s"><button class="x" aria-label="Close">✕</button><b>${S.i} ${E_(S.t)}</b><div class="mute">vs ${E_(x.opp||"?")} · ${E_(x.date||"")} · move ${Math.ceil(x.ply/2)}</div>
   <div class="bs64bd">${CR52.mini(x.fen,x.me,{arrows:ar})}</div><p>🔴 You played your ${pieceAt(x.fen,x.uci)} to ${x.uci.slice(2,4)}.${tail}${x.best&&x.best!==x.uci?` 🟢 A better idea was the ${pieceAt(x.fen,x.best)} to ${x.best.slice(2,4)}.`:""}</p></div></div>`;
  v.querySelector(".x").onclick=()=>v.innerHTML=""; v.firstChild.onclick=e=>{ if(e.target===v.firstChild) v.innerHTML=""; }; }
/* puzzles of the same kind: your own positions first, then tagged bank positions */
function pack(s,M){ const out=[], seen=new Set(), S=SPOTS[s]; const o=(M||map()).spots.find(x=>x.s===s);
  (o?o.ex:[]).forEach(x=>{ if(x.best&&x.best!==x.uci&&!seen.has(x.fen)){ seen.add(x.fen); out.push({f:x.fen,best:[x.best.slice(0,4)],src:"From your game vs "+(x.opp||"?"),ask:"Find a better move than the one you played."}); } });
  const T=window.TFBANK||{}, main=(T.main||[]), def=(T.def||[]);
  const fromMain=x=>({f:x.f,best:Object.keys(x.m||{}).filter(u=>(x.m[u]||[])[0]==="b").map(u=>u.slice(0,4)),src:"Practice position · "+(x.lab||""),ask:"Find the best move."});
  let B=[]; if(S.nb) B=main.filter(x=>Object.keys(x.m||{}).some(u=>x.m[u][0]==="b"&&back(x.f,u))).map(fromMain);
  if(S.lab) B=B.concat(main.filter(x=>S.lab.includes(x.lab)).map(fromMain));
  if(S.def) B=B.concat(def.map(x=>({f:x.f,best:[String(x.sol||x.best).slice(0,4)],src:"Practice position · stop the threat",ask:"Their last move made a threat. Find the move that deals with it."})));
  B.filter(x=>x.best.length&&!seen.has(x.f)).forEach(x=>{ if(out.length<8){ seen.add(x.f); out.push(x); } });
  return out.slice(0,8); }
let TS=null;
function train(s,M){ const p=CR52.show("bs64"), S=SPOTS[s]; TS={s,L:pack(s,M),i:0,ok:0,tries:0};
  p.innerHTML=`<h2>🎯 Train: ${E_(S.t)}</h2><p class="mute">${E_(S.d)}</p><div id="bs64tr"></div><button type="button" class="bs64sec" id="bs64back">‹ My blind spots</button>`; $("bs64back").onclick=open; puz(); }
function puz(){ const el=$("bs64tr"), z=TS.L[TS.i]; if(!z){ el.innerHTML=`<div class="card"><p>✅ Set done: ${TS.ok} of ${TS.L.length} solved first time.</p></div>`; return; }
  const C=CH(); let G; try{ G=new C(z.f); }catch(e){ TS.i++; return puz(); } const me=G.turn(); let ar=[];
  el.innerHTML=`<div class="card"><p class="mute">Puzzle ${TS.i+1} of ${TS.L.length} · ${E_(z.src)}</p><p><b>${E_(z.ask)}</b> You play ${me==="w"?"White":"Black"}.</p><div class="bs64bd" id="bs64pb"></div><div class="bs64msg" id="bs64msg"></div>
   <div class="bs64row"><button type="button" id="bs64ans">Show answer</button><button type="button" id="bs64nx">Next ›</button></div></div>`;
  const msg=t=>$("bs64msg").innerHTML=t;
  const draw=Coach17._tapBoard($("bs64pb"),G,me,(f,q)=>{ const u=f+q; if(z.best.includes(u)){ if(!TS.tries) TS.ok++; ar=[{u,c:"#2f7d32"}]; msg("✅ Yes, that's it."); } else { TS.tries++; msg("Not quite. Look at checks, captures and threats for both sides."); } draw(); },()=>({arrows:ar}));
  $("bs64ans").onclick=()=>{ ar=[{u:z.best[0],c:"#2f7d32"}]; TS.tries++; draw(); msg("Here is the answer."); };
  $("bs64nx").onclick=()=>{ TS.i++; TS.tries=0; puz(); }; }
const st=document.createElement("style"); st.textContent=`
#bs64 h2{margin:6px 0}.bs64warn{background:#fff8e1;border-color:#f0d27a}.bs64c{margin:10px 0}.bs64h{display:flex;gap:10px;align-items:center}.bs64i{font-size:28px}.bs64h small{display:block;color:var(--mute,#666);font-size:13px}
.bs64ex{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0}.bs64m{min-width:0;border:1px solid var(--line,#ddd);border-radius:10px;background:#fff;padding:3px;font:inherit}.bs64m svg{width:100%;height:auto;display:block}.bs64m small{display:block;font-size:11px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bs64go,.bs64sec{width:100%;min-height:48px;border-radius:12px;border:0;background:#3b6fb6;color:#fff;font:inherit;font-weight:800;font-size:16px}.bs64sec{background:#fff;color:#3b6fb6;border:1px solid #3b6fb6;margin-top:8px}
.bs64sh{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}.bs64sh .s{position:relative;background:#fff;width:100%;max-width:520px;max-height:90vh;overflow:auto;border-radius:18px 18px 0 0;padding:14px 14px 20px}
.bs64sh .x{position:absolute;z-index:3;right:8px;top:6px;min-width:44px;min-height:44px;border:0;background:none;font-size:22px}.bs64bd{max-width:420px;margin:8px auto}.bs64bd svg{width:100%;height:auto;display:block}
.bs64msg{min-height:22px;margin:6px 0;font-size:15px}.bs64row{display:grid;grid-template-columns:1fr 1fr;gap:6px}.bs64row button{min-height:46px;border-radius:10px;border:1px solid var(--line,#ccc);background:#fff;font:inherit;font-weight:700}
html.dark-mode .bs64m,html.dark-mode .bs64sh .s,html.dark-mode .bs64row button{background:#262626;color:#eee}`; document.head.appendChild(st);
window.CRBlind64={open,map,classify,pack,train,SPOTS,_games:games};
})();
