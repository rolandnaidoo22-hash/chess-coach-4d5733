/* Improvements v25+ (own file imp.js). Adds features; never changes existing ones. */
(function(){
"use strict";
if(window.CRImp) return;
const $=id=>document.getElementById(id);
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LSg=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
const LSs=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } };
const PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const CSS=`.imp1{border-radius:14px;padding:12px 14px;margin:0 0 12px;background:#fff7e6;border:2px solid #f0b44a;color:#222;font-size:16px;line-height:1.45}
.imp1 b.t{display:block;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#a0610a;margin-bottom:4px}
.imp1.ok{background:#eef8ee;border-color:#7cc47f}.imp1.ok b.t{color:#2f7d32}
.imp1 button{margin-top:8px;min-height:44px;border-radius:10px;border:1px solid #d9a441;background:#fff;font-size:15px;font-weight:700;padding:8px 12px;cursor:pointer;color:#7a4a00}
html.dark-mode .imp1{background:#3a2f1c;color:#eee}html.dark-mode .imp1.ok{background:#1f3320}`;
function css(){ if($("impcss")) return; const s=document.createElement("style"); s.id="impcss"; s.textContent=CSS; document.head.appendChild(s); }
const sideName=c=>c==="w"?"White":"Black";
function boardOf(fen){ return window.Patterns&&Patterns._board?Patterns._board(fen):null; }
function sqIdx(s){ return (s.charCodeAt(0)-97)+8*(+s[1]-1); }

/* ================= 1. turning-point headline ================= */
function turningPoint(D){ const P=D.plies, me=D.meta.user_color, opp=me==="w"?"b":"w", C=window.ChessLib&&ChessLib.Chess;
  let wi=-1, wl=0; P.forEach((p,i)=>{ if(p.user&&(p.ep_loss||0)>wl&&/mistake|blunder|miss/.test(p.cls)){ wl=p.ep_loss; wi=i; } });
  if(wi<0||wl<0.08) return null;
  const p=P[wi], q=P[wi+1], best=p.best_san, mvTxt=p.label;
  const pc=(()=>{ const s=p.san[0]; return "NBRQK".includes(s)?PN[s.toLowerCase()]:(p.san.startsWith("O-O")?"king":"pawn"); })();
  let why="";
  try{ const reply=(q&&q.best_uci)||(p.reply_uci&&p.reply_uci[0])||""; const c=new C(p.fen);
    let rm=null; if(reply) rm=c.move({from:reply.slice(0,2),to:reply.slice(2,4),promotion:reply[4]||"q"});
    if(rm&&c.isCheckmate()) why=`it allowed checkmate: ${sideName(opp)} plays ${rm.san}.`;
    else if(rm&&rm.captured&&rm.captured!=="p"){ const B=boardOf(p.fen); const def=B&&Patterns._attackers?Patterns._attackers(B,me,sqIdx(rm.to)).length:0;
      const nm=PN[rm.captured];
      why=def&&VAL[rm.piece]<VAL[rm.captured]?`your ${nm} on ${rm.to} could be taken by a cheaper piece (${rm.san}).`:`your ${nm} on ${rm.to} had no defender, so ${sideName(opp)} could just take it with ${rm.san}.`; }
    else if(p.bad&&p.bad.B&&p.bad.B.state==="missed"&&p.threat&&p.threat.san) why=`you didn't answer ${sideName(opp)}'s threat ${p.threat.san}.`;
    else if(rm&&window.Patterns&&Patterns.tacticAfter){ const t=Patterns.tacticAfter(p.fen,reply); if(t) why=`it walked into a ${t.kind} (${rm.san}).`; }
    if(!why&&rm&&rm.captured==="p"&&/\+/.test(rm.san)) why=`it let ${sideName(opp)} take a pawn with check (${rm.san}) and attack your king.`;
    if(!why&&rm&&rm.captured==="p") why=`it gave away a pawn (${rm.san}) and your position got worse.`;
    if(!why&&rm) why=`it let ${sideName(opp)} play ${rm.san}, a strong reply.`;
  }catch(e){}
  if(!why) why="it made your position much worse.";
  try{ if(best){ const c=new C(p.fen_before); c.move(best); if(c.isCheckmate()) return {i:wi,txt:`On move ${mvTxt} you had checkmate, but you missed it. Play <b>${E(best)}</b> instead: it's checkmate!`,label:mvTxt,best}; } }catch(e){}
  let gain=""; try{ if(best){ const c=new C(p.fen_before); const bm=c.move(best); if(c.isCheckmate()) gain=" (it's checkmate!)"; else if(bm&&bm.captured&&bm.captured!=="p") gain=` (it wins the ${PN[bm.captured]})`; } }catch(e){}
  return {i:wi,txt:`On move ${mvTxt} you moved your ${pc}, but ${why} Play <b>${E(best||"a safer move")}</b> instead${gain}.`,label:mvTxt,best};
}
function headline(){ const s=$("summary"); if(!s||typeof DATA==="undefined"||!DATA||!DATA.plies) return; if(s.querySelector(".imp1")) return; css();
  let tp=null; try{ tp=turningPoint(DATA); }catch(e){ console.error(e); }
  const d=document.createElement("div"); d.className="imp1"+(tp?"":" ok");
  d.innerHTML=tp?`<b class="t">🔑 Turning point</b>${tp.txt.replace(/^(On move )(\S+)/,"$1<b>$2</b>")}<br><button type="button">▶ Show me this move</button>`:`<b class="t">🔑 Turning point</b>No big mistake in this game. Clean play!`;
  if(tp) d.querySelector("button").onclick=()=>{ try{ go(tp.i+1,true); }catch(e){} };
  s.insertBefore(d,s.firstChild); }
function initHeadline(){ const s=$("summary"); if(!s) return; new MutationObserver(()=>headline()).observe(s,{childList:true}); headline(); }

/* ================= shared: mini board, coach pages ================= */
const UNI={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
function miniBoard(fen,flip,arrows){ const rows=fen.split(" ")[0].split("/"); const sym=!!$("pc-wK"); let h=`<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">`;
  const xy=sq=>{ const c=sq.charCodeAt(0)-97, r=8-(+sq[1]); return [flip?7-c:c, flip?7-r:r]; };
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const x=flip?7-c:c,y=flip?7-r:r; h+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${(r+c)%2?"#b58863":"#f0d9b5"}"/>`; }
  rows.forEach((row,r)=>{ let c=0; for(const ch of row){ if(/\d/.test(ch)){ c+=+ch; continue; } const x=flip?7-c:c,y=flip?7-r:r;
    h+=sym?`<use href="#pc-${ch===ch.toUpperCase()?"w":"b"}${ch.toUpperCase()}" x="${x}" y="${y}" width="1" height="1"/>`:`<text x="${x+.5}" y="${y+.8}" font-size=".85" text-anchor="middle">${UNI[ch]}</text>`; c++; } });
  (arrows||[]).forEach(([u,col])=>{ if(!u) return; const [x1,y1]=xy(u.slice(0,2)),[x2,y2]=xy(u.slice(2,4)); h+=`<line x1="${x1+.5}" y1="${y1+.5}" x2="${x2+.5}" y2="${y2+.5}" stroke="${col}" stroke-width=".16" stroke-linecap="round" opacity=".85"/><circle cx="${x2+.5}" cy="${y2+.5}" r=".2" fill="${col}" opacity=".85"/>`; });
  for(let i=0;i<8;i++) h+=`<text x="${i+.04}" y="7.97" font-size=".22" fill="#444">${"abcdefgh"[flip?7-i:i]}</text><text x=".03" y="${i+.24}" font-size=".22" fill="#444">${flip?i+1:8-i}</text>`;
  return h+"</svg>"; }
const PCSS=`.impP h3{margin:16px 0 6px;font-size:18px}.impP .sub{font-size:13px;color:#556;margin:0 0 8px}
.impP .box{border:1px solid #dde;border-radius:14px;background:#fff;padding:12px;margin:10px 0;font-size:15px;line-height:1.45}
.impP .box.bad{border-color:#e57373;background:#fff5f5}.impP .box.good{border-color:#66bb6a;background:#f3fbf3}
.impP .seg{display:flex;gap:6px;margin:6px 0 10px}.impP .seg button{flex:1;min-height:46px;border-radius:12px;border:1px solid #ccd;background:#fff;font-size:16px;font-weight:700;cursor:pointer}
.impP .seg button.on{background:#3b6fb6;color:#fff;border-color:#3b6fb6}
.impP .row{display:flex;justify-content:space-between;align-items:center;gap:8px}.impP .cnt{font-size:22px;font-weight:800;color:#c62828;min-width:44px;text-align:right}
.impP .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.impP .chip{min-height:38px;border-radius:19px;border:1px solid #ccd;background:#f7f9fc;padding:6px 12px;font-size:14px;cursor:pointer}
.impP .chip.on{background:#3b6fb6;color:#fff}.impP .bd{width:min(100%,280px);aspect-ratio:1;border-radius:8px;overflow:hidden;margin:8px 0;box-shadow:0 1px 4px rgba(0,0,0,.25)}.impP .bd svg{display:block;width:100%;height:100%}
.impP .key{font-size:12px;color:#556}.impP a{color:#3b6fb6}.impP .big{font-size:26px;font-weight:800}
html.dark-mode .impP .box{background:#262626;color:#e8e8e8;border-color:#3a3a3a}`;
const TILES=[]; let curPage=null;
function coachSec(){ return $("co17"); }
function addTile(id,ic,t,sub,fn){ TILES.push({id,ic,t,sub,fn}); }
function injectTiles(){ const s=coachSec(); if(!s) return; const g=s.querySelector(".co17grid"); if(!g) return;
  try{ dueBanner(); }catch(e){}
  TILES.forEach(T=>{ if(g.querySelector(`[data-imp="${T.id}"]`)) return; const b=document.createElement("button"); b.className="co17tile"; b.setAttribute("data-imp",T.id);
    b.innerHTML=`<span class="ic">${T.ic}</span><b>${E(T.t)}</b><small>${typeof T.sub==="function"?T.sub():E(T.sub)}</small>`; b.onclick=()=>openPage(T.id); g.appendChild(b); }); }
function openPage(id,arg){ const T=TILES.find(x=>x.id===id); if(!T||!window.Coach17) return; Coach17.open("home"); const s=coachSec(); if(!s) return;
  if(!$("imppcss")){ const st=document.createElement("style"); st.id="imppcss"; st.textContent=PCSS; document.head.appendChild(st); }
  curPage=id; s.classList.add("impP"); window.scrollTo(0,0); T.fn(s,arg); }
function pageHead(t){ return `<div class="co17h"><h2>${t}</h2><div><button class="cbtn" data-impback="1">‹ Back</button></div></div>`; }
function wireBack(s){ s.querySelectorAll("[data-impback]").forEach(b=>b.onclick=()=>{ curPage=null; s.classList.remove("impP"); Coach17.open("home"); }); }
function initTiles(){ const s=coachSec(); if(!s){ if((initTiles.n=(initTiles.n||0)+1)<40) setTimeout(initTiles,250); return; }
  let nav=0; s.addEventListener("click",e=>{ if(e.target.closest("[data-co],[data-trap],[data-imp],#co17today")) nav=Date.now(); },true);
  document.addEventListener("click",e=>{ if(e.target.closest("#homeBtn,#co17cb")) nav=Date.now(); },true);
  if(window.Coach17&&!Coach17.__impw){ const o=Coach17.open; Coach17.open=function(){ nav=Date.now(); return o.apply(this,arguments); }; Coach17.__impw=1; }
  new MutationObserver(()=>{ if(!s.querySelector("[data-impback]")&&curPage){ const T=TILES.find(x=>x.id===curPage);
      if(T&&Date.now()-nav>1500&&s.classList.contains("on")&&s.querySelector(".co17grid")){ T.fn(s); return; } s.classList.remove("impP"); curPage=null; } injectTiles(); }).observe(s,{childList:true}); injectTiles(); }
function recsSorted(){ const m=window.PatternStore?PatternStore.all():{}; return Object.values(m).sort((a,b)=>((b.date||"")+b.id).localeCompare((a.date||"")+a.id)); }
function sansOf(rec){ if(!rec.pgn||!window.ChessLib) return null; try{ const c=new ChessLib.Chess(); c.loadPgn(rec.pgn); return c.history(); }catch(e){ return null; } }
function opp(rec){ return rec.me==="w"?rec.black:rec.white; }
function moveLbl(e){ const n=Math.ceil(e.ply/2); return e.ply%2?`${n}.`:`${n}...`; }
function sanOf(fen,uci){ try{ const c=new ChessLib.Chess(fen); const m=c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||"q"}); return m?m.san:uci; }catch(e){ return uci; } }
function after(fen,uci){ try{ const c=new ChessLib.Chess(fen); c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||"q"}); return c.fen(); }catch(e){ return fen; } }

/* ================= 6. Repeat Check ================= */
const RCK="chessReview.imp.repeat.n";
function trapHits(recs){ const out={}; if(!window.TrapRadar) return out; const tc=LSg("chessReview.traps.v1",null), tg=(tc&&tc.g)||[];
  recs.forEach(r=>{ let s=sansOf(r); if(!s){ const t=tg.find(x=>String(x.id).replace(/\/$/,"")===r.id); s=t&&t.s; } if(!s||s.length<2) return;
    TrapRadar._analyse({s,me:r.me}).res.forEach(x=>{ if(!x.fell) return; const kind=x.role==="watch"?(x.pun?"fell":null):(x.pun?null:"missed"); if(!kind) return;
      const k=x.T.id+"|"+kind; (out[k]=out[k]||{T:x.T,kind,games:[]}).games.push(r); }); });
  return out; }
function caughtBy(recs){ const G={};
  recs.forEach(r=>{ (r.ev||[]).forEach(e=>{ if(!(e.k==="hang"||e.k==="fell")||!e.reply||!e.uci) return; const fa=after(e.fen,e.uci), rs=sanOf(fa,e.reply);
      const key=rs.replace(/[+#]/g,""); (G[key]=G[key]||{san:rs,items:[]}).items.push({r,e,fa}); });
    const s=sansOf(r); if(s&&r.res==="L"&&/#$/.test(s[s.length-1]||"")){ try{ const c=new ChessLib.Chess(); s.slice(0,-1).forEach(x=>c.move(x)); const fb=c.fen(); const key=s[s.length-1].replace(/[+#]/g,"");
      (G[key]=G[key]||{san:s[s.length-1],items:[]}).items.push({r,e:{ply:s.length-1,mate:1},fa:fb}); }catch(e){} } });
  return Object.values(G).map(g=>Object.assign(g,{games:[...new Set(g.items.map(x=>x.r.id))].length})).filter(g=>g.games>=2).sort((a,b)=>b.games-a.games); }
function repeatPage(s){ const n=LSg(RCK,5), all=recsSorted(), recs=all.slice(0,n), K=(window.Patterns&&Patterns.KINDS)||{};
  let h=pageHead("🔁 Repeat Check")+`<p class="co17sm">Are you making the <b>same mistake</b> again and again? Pick how many of your latest games to check.</p>
   <div class="seg">${[2,5,10].map(k=>`<button data-n="${k}" class="${k===n?"on":""}">Last ${k}</button>`).join("")}</div>`;
  if(!all.length){ h+=`<div class="box">No studied games yet. Tap <b>📚 Study my last 20 games</b> on My Coach (or use My patterns) first.</div>`; s.innerHTML=h; wireBack(s); wireSeg(s); return; }
  if(recs.length<n) h+=`<div class="box">Only ${recs.length} studied game${recs.length>1?"s":""} so far. Study more games to fill this up.</div>`;
  // 1. mistake types
  const by={}; recs.forEach(r=>(r.ev||[]).forEach(e=>{ if(!K[e.k]) return; if(e.k==="fgpush"&&!(e.loss>=0.05)) return; (by[e.k]=by[e.k]||[]).push({r,e}); }));
  const kinds=Object.keys(by).sort((a,b)=>by[b].length*(K[b].w||1)-by[a].length*(K[a].w||1));
  h+=`<h3>📋 Your mistake types</h3><p class="sub">Across your last ${recs.length} game${recs.length>1?"s":""}. Tap a move to see it.</p>`;
  h+=kinds.length?kinds.map(k=>{ const L=by[k], gs=new Set(L.map(x=>x.r.id)).size; return `<div class="box ${gs>=2?"bad":""}"><div class="row"><div><b>${E(K[k].t)}</b><br><small>${gs>=2?`🔁 in ${gs} different games`:"in 1 game"}</small></div><div class="cnt">${L.length}×</div></div>
     <div class="chips">${L.slice(0,8).map((x,i)=>`<button class="chip" data-ev="${k}|${i}">${moveLbl(x.e)} vs ${E(opp(x.r))}</button>`).join("")}</div><div class="evb"></div></div>`; }).join(""):`<div class="box good">No repeated mistake types found. 👍</div>`;
  // 2. traps
  const th=Object.values(trapHits(recs)).filter(x=>x.games.length>=2);
  h+=`<h3>🪤 Traps that keep happening</h3><p class="sub">Traps you fell into (or missed) more than once, from Trap Radar.</p>`;
  h+=th.length?th.map(x=>`<div class="box bad"><b>${x.kind==="fell"?"⚠️ You fell for":"❗ You missed"} ${E(x.T.n)} ${x.games.length} times</b><br><small>${E(x.T.op)} · vs ${x.games.map(r=>E(opp(r))).join(", ")}</small><div class="tr19t" style="margin-top:6px"><b>${x.kind==="fell"?"How to avoid it":"How to set it"}:</b> ${E(x.kind==="fell"?x.T.avoid:x.T.setit)}</div></div>`).join(""):`<div class="box good">No trap caught you (or slipped past you) twice. 👍</div>`;
  // 3. caught by the same move
  const cb=caughtBy(recs);
  h+=`<h3>🎯 Caught by the same move</h3><p class="sub">The same opponent move won material or mated you in 2+ games.</p>`;
  h+=cb.length?cb.map((g,gi)=>{ const x=g.items[0], e=x.e, flip=x.r.me==="b", fix=e.best?sanOf(e.fen,e.best):null;
     return `<div class="box bad"><div class="row"><div><b>${E(g.san)} caught you in ${g.games} games</b><br><small>vs ${[...new Set(g.items.map(i=>opp(i.r)))].map(E).join(", ")}</small></div><div class="cnt">${g.items.length}×</div></div>
      <div class="bd">${miniBoard(x.fa,flip,[[x.e.reply||"","#d32f2f"]])}</div>
      <div>${e.mate?`This is the position before <b>${E(g.san)}</b> checkmated you.`:`After your move ${moveLbl(e)} ${E(sanOf(e.fen,e.uci))}, the opponent played <b>${E(g.san)}</b> (red arrow).`}</div>
      ${fix?`<div style="margin-top:6px">✅ <b>The fix:</b> play <b>${E(fix)}</b> instead of ${E(sanOf(e.fen,e.uci))}. Before every move, ask: “what can they take or check next?”</div>`:`<div style="margin-top:6px">✅ <b>The fix:</b> before every move, look at every check and capture your opponent has next.</div>`}</div>`; }).join(""):`<div class="box good">No single opponent move caught you twice. 👍</div>`;
  s.innerHTML=h; wireBack(s); wireSeg(s);
  s.querySelectorAll("[data-ev]").forEach(b=>b.onclick=()=>{ const [k,i]=b.dataset.ev.split("|"), x=by[k][+i], e=x.e, box=b.closest(".box").querySelector(".evb");
    const on=b.classList.contains("on"); box.parentNode.querySelectorAll(".chip").forEach(c=>c.classList.remove("on")); if(on){ box.innerHTML=""; return; } b.classList.add("on");
    box.innerHTML=`<div class="bd">${miniBoard(e.fen,x.r.me==="b",[[e.uci,"#d32f2f"],[e.best&&e.best!==e.uci?e.best:"","#2e7d32"]])}</div><div>${e.uci?`You played <b style="color:#c62828">${E(sanOf(e.fen,e.uci))}</b>`:"Position"}${e.best&&e.uci&&e.best!==e.uci?`, better was <b style="color:#2e7d32">${E(sanOf(e.fen,e.best))}</b>`:""}. <a href="${E(x.r.link)}" target="_blank" rel="noopener">Open game ↗</a></div>`; }); }
function wireSeg(s){ s.querySelectorAll(".seg [data-n]").forEach(b=>b.onclick=()=>{ LSs(RCK,+b.dataset.n); repeatPage(s); }); }
addTile("repeat","🔁","Repeat Check","Same mistakes again? Last 2/5/10 games",repeatPage);

/* ================= 2. Study my last 20 standard games ================= */
const ST={run:false,cancel:false,txt:"",pct:0,done:[],skipped:0,found:0,err:"",worst:null};
async function pick20(user){ const a=await (await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`)).json();
  const arcs=(a.archives||[]).slice().reverse().slice(0,12); const pool={good:[],blitz:[],bullet:[]}; let saved=0; const seen=new Set();
  for(const u of arcs){ const g=await (await fetch(u)).json();
    (g.games||[]).sort((x,y)=>(y.end_time||0)-(x.end_time||0)).forEach(x=>{ if(!x.pgn||x.rules!=="chess"||/SetUp "1"|Variant/.test(x.pgn)) return; const id=String(x.url).replace(/\/$/,""); if(seen.has(id)) return; seen.add(id);
      if(PatternStore.has(id)){ saved++; return; } (x.time_class==="rapid"||x.time_class==="daily"||x.time_class==="classical"?pool.good:x.time_class==="blitz"?pool.blitz:pool.bullet).push(x); });
    ST.txt=`Looking through your games… ${pool.good.length} rapid/daily, ${pool.blitz.length} blitz found`; paintStudy();
    if(pool.good.length>=20) break; }
  let list=pool.good.slice(0,20); if(list.length<20) list=list.concat(pool.blitz.slice(0,20-list.length)); if(list.length<20) list=list.concat(pool.bullet.slice(0,20-list.length));
  return {list,saved,mix:{good:Math.min(20,pool.good.length)}}; }
async function runStudy(){ if(ST.run) return; const user=((window.CRUser&&CRUser.info())||{}).cc||(($("uname")||{}).value||"");
  if(!user){ ST.err="Add your Chess.com username on the home screen first."; paintStudy(); return; }
  if(!window.Analyzer||!window.ReviewApp||!window.PatternStore) return; if(ReviewApp.isRunning()){ ST.run=true; ST.err=""; ST.txt="Waiting for the coach's background check to finish…"; ST.pct=0; paintStudy();
    try{ if(window.Coach17&&Coach17._imp) Coach17._imp.cancel=true; }catch(e){}
    for(let t=0;t<600&&ReviewApp.isRunning();t++) await new Promise(r=>setTimeout(r,1000)); ST.run=false;
    if(ReviewApp.isRunning()){ ST.err="Another analysis is still running. Try again in a minute."; ST.txt=""; paintStudy(); return; } }
  Object.assign(ST,{run:true,cancel:false,txt:"Getting your games from Chess.com…",pct:1,done:[],err:"",worst:null}); paintStudy();
  ReviewApp.setRunning(true); ReviewApp.keepAwake(true); try{ if(window.Coach17&&Coach17._imp) Coach17._imp.pauseFor(true); }catch(e){}
  try{ const {list,saved}=await pick20(user); ST.skipped=saved; ST.found=list.length;
    if(!list.length){ ST.txt=`All your recent games are already studied (${saved} saved).`; ST.pct=100; }
    else { let eng=await ReviewApp.getEngine(); const t0=performance.now();
      for(let k=0;k<list.length;k++){ if(ST.cancel) break; const g=list[k], me=g.white.username.toLowerCase()===user.toLowerCase()?"w":"b", opp=me==="w"?g.black.username:g.white.username;
        try{ const d=await Analyzer.analyzeGame(g.pgn,{engine:eng,username:user,side:"auto",mode:"quick",cancelled:()=>ST.cancel},pr=>{
            const f=pr.phase==="moves"?0.85*(pr.i/(pr.n||1)):pr.phase==="threats"?0.85+0.15*(pr.i/(pr.n||1)):0, el=(performance.now()-t0)/1000, per=(k+f)>0.3?el/(k+f):null, left=per?Math.round(per*(list.length-k-f)):null;
            ST.txt=`Game ${k+1} of ${list.length} (${g.time_class}, vs ${opp})${left!=null?` · about ${left<90?left+" s":Math.round(left/60)+" min"} left`:""}`; ST.pct=100*(k+f)/list.length; paintStudy(true); });
          d.meta.link=g.url; d.meta.pgn=g.pgn; PatternStore.put(d,g.pgn);
          const acc=(d.summary.v7&&d.summary.v7[d.meta.user_color]&&d.summary.v7[d.meta.user_color].accuracy)||d.summary.accuracy||0;
          ST.done.push({opp,tc:g.time_class,acc,url:g.url}); if(!ST.worst||acc<ST.worst.acc) ST.worst={acc,d,opp};
        }catch(err){ if(String(err.message)==="cancelled") break; console.error(err); try{ eng.quit(); }catch(e){} eng=await ReviewApp.getEngine(true); } }
      ST.pct=100; ST.txt=`Done: studied ${ST.done.length} new game${ST.done.length===1?"":"s"}${saved?` (skipped ${saved} already saved)`:""}.`; }
  }catch(e){ console.error(e); ST.err=navigator.onLine===false?"You're offline.":"Couldn't reach Chess.com. Try again."; }
  ST.run=false; ReviewApp.setRunning(false); ReviewApp.keepAwake(false); try{ if(window.Coach17&&Coach17._imp) Coach17._imp.pauseFor(false); }catch(e){}
  paintStudy(); if(ST.worst&&curPage==="study") setTimeout(()=>openWorst(),900); }
function openWorst(){ if(!ST.worst) return; try{ Coach17.hide(true); }catch(e){} curPage=null; try{ loadData(ST.worst.d); }catch(e){ console.error(e); } window.scrollTo(0,0); }
function paintStudy(light){ const s=coachSec(); if(curPage!=="study"||!s) return;
  if(light&&$("impStT")){ $("impStT").textContent=ST.txt; $("impStF").style.width=ST.pct.toFixed(1)+"%"; return; }
  let h=pageHead("📚 Study my last 20 games")+`<p class="co17sm">I fetch your last <b>20 standard games</b> (rapid and daily first, blitz if needed, no Chess960), skip ones already studied, check each one, then open your <b>worst game</b> first.</p>`;
  if(ST.err) h+=`<div class="box bad">${E(ST.err)}</div>`;
  if(ST.run||ST.txt) h+=`<div class="box"><div id="impStT">${E(ST.txt)}</div><div style="height:10px;border-radius:5px;background:#e3e8ef;margin-top:8px;overflow:hidden"><i id="impStF" style="display:block;height:100%;width:${ST.pct}%;background:#3b6fb6"></i></div></div>`;
  if(ST.run) h+=`<button class="cbtn full" id="impStC" style="text-align:center">⏹ Stop</button><p class="co17sm">Keep the app open. About 10–30 seconds per game on a phone.</p>`;
  else h+=`<button class="cbtn full pri" id="impStGo" style="text-align:center;font-size:18px">▶ Study my last 20 games</button>`;
  if(ST.done.length) h+=`<h3>Games studied</h3>`+ST.done.slice().sort((a,b)=>a.acc-b.acc).map((g,i)=>`<div class="box ${i===0?"bad":""}"><div class="row"><div><b>vs ${E(g.opp)}</b><br><small>${E(g.tc)}</small></div><div class="big">${Math.round(g.acc)}%</div></div></div>`).join("");
  if(!ST.run&&ST.worst) h+=`<button class="cbtn full blue" id="impStW" style="text-align:center">🔎 Open my worst game (vs ${E(ST.worst.opp)})</button>`;
  s.innerHTML=h; wireBack(s); const go=$("impStGo"); if(go) go.onclick=runStudy; const c=$("impStC"); if(c) c.onclick=()=>{ ST.cancel=true; }; const w=$("impStW"); if(w) w.onclick=openWorst; }
addTile("study","📚","Study last 20 games","Rapid/daily first, worst game first",s=>paintStudy());

/* ================= 3. Drill my top leak (spaced repetition 1/3/7 days) ================= */
const DK="chessReview.imp.drill.v1", IVL=[1,3,7], DAY=864e5;
const DRILLABLE=["hang","fell","miss","missmate","misstac","notrade","threat"];
function drills(){ return LSg(DK,{items:{},log:[]}); }
function dueList(){ const D=drills(), now=Date.now(); return Object.values(D.items).filter(x=>!x.grad&&x.due<=now); }
function topLeak(){ if(!window.Patterns) return null; const recs=recsSorted(); if(!recs.length) return null; const A=Patterns.aggregate(recs);
  const L=(A.ranked||[]).find(x=>DRILLABLE.includes(x.k)&&x.examples.some(e=>e.fen&&e.best&&e.uci&&e.best!==e.uci)); return L||null; }
function buildQueue(){ const D=drills(), due=dueList(), L=topLeak(), q=due.slice(0,5);
  if(L&&q.length<5){ for(const e of L.examples){ if(q.length>=5) break; if(!(e.fen&&e.best&&e.uci)||e.best===e.uci) continue; const id=e.fen+"|"+e.uci; if(D.items[id]) continue;
      q.push({id,fen:e.fen,best:e.best,uci:e.uci,reply:e.reply||null,k:L.k,title:L.title,box:-1,due:0,isNew:true}); } }
  return {q,L}; }
function schedule(it,ok){ const D=drills(), x=D.items[it.id]||Object.assign({},it); delete x.isNew;
  if(ok){ x.box=(x.box==null||x.box<0?1:x.box+1); if(x.box>=IVL.length){ x.grad=true; x.due=Infinity; } else x.due=Date.now()+IVL[x.box]*DAY; }
  else { x.box=0; x.due=Date.now()+IVL[0]*DAY; x.grad=false; }
  x.last=Date.now(); D.items[it.id]=x; D.log.push([Date.now(),ok?1:0]); D.log=D.log.slice(-300); LSs(DK,D); return x; }
let DQ=null;
function drillPage(s){ if(!DQ||DQ.fin) DQ=Object.assign(buildQueue(),{i:0,ok:0}); const {q,L}=DQ;
  let h=pageHead("🛠 Drill my top leak");
  if(!q.length){ h+=`<div class="box">${L?"Nothing due right now. Come back tomorrow! 🎉":"No studied games yet. Tap <b>📚 Study last 20 games</b> first, then come back."}</div>`; s.innerHTML=h; wireBack(s); return; }
  if(DQ.i>=q.length){ DQ.fin=true; const nx=Object.values(drills().items).filter(x=>!x.grad).sort((a,b)=>a.due-b.due)[0];
    h+=`<div class="box good"><b>Done! ${DQ.ok} of ${q.length} right.</b><br>Positions you missed come back <b>tomorrow</b>; ones you got right come back in 3 days, then 7 days.${nx?`<br><small>Next drill due: ${new Date(nx.due).toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"})}</small>`:""}</div>`;
    s.innerHTML=h; wireBack(s); return; }
  const it=q[DQ.i], G=new ChessLib.Chess(it.fen), me=G.turn(), boxTxt=it.box>=0?` · review ${it.box+1} of 3`:" · new";
  h+=`<p class="co17sm">Your top leak: <b>${E(it.title||(L&&L.title)||"")}</b>. These positions are from <b>your own games</b>, one move before the mistake.</p>
   <div class="co17msg" id="impDm">Position ${DQ.i+1} of ${q.length}${boxTxt}: what should you play as <b>${me==="w"?"White":"Black"}</b>?</div><div class="co17board" id="impDb"></div>
   <div class="co17pz"><button class="cbtn" id="impDh">💡 Hint</button><button class="cbtn" id="impDs">Show answer</button><button class="cbtn pri" id="impDn" style="display:none">Next ▶</button></div><div id="impDx"></div>`;
  s.innerHTML=h; wireBack(s); let done=false, hint=false, arrows=[];
  const msg=t=>{ $("impDm").innerHTML=t; };
  const finish=(ok,played)=>{ done=true; schedule(it,ok); if(ok) DQ.ok++; $("impDn").style.display=""; $("impDh").style.display="none"; $("impDs").style.display="none";
    const bestSan=sanOf(it.fen,it.best), mySan=sanOf(it.fen,it.uci);
    let x=""; if(!ok){ const fa=after(it.fen,played||it.uci); const c=new ChessLib.Chess(fa); let pun="";
        try{ const rep=(played&&played!==it.uci)?null:it.reply; if(rep){ const m=c.move({from:rep.slice(0,2),to:rep.slice(2,4),promotion:rep[4]||"q"}); pun=`They answer <b>${E(m.san)}</b>${m.captured?` and take your ${PN[m.captured]}`:""}${c.isCheckmate()?": checkmate":""}.`; } }catch(e){}
        x=`<div class="box bad">❌ In the game you played <b>${E(mySan)}</b>. ${pun||"That lets your opponent win something."}<br>✅ Better: <b>${E(bestSan)}</b> (green arrow). This one comes back <b>tomorrow</b>.</div>`;
        arrows=[{u:it.uci,c:"#d32f2f"},{u:it.best,c:"#2f7d32"}]; if(it.reply) arrows.push({u:it.reply,c:"#ef6c00"}); }
    else x=`<div class="box good">✅ Correct: <b>${E(bestSan)}</b>! In the game you played ${E(mySan)}. Next review in ${IVL[Math.min(IVL.length-1,(drills().items[it.id]||{}).box||0)]} day(s).</div>`;
    $("impDx").innerHTML=x; redraw(); };
  const extra=()=>({hl:hint&&!done?[{sq:it.best.slice(0,2),c:"#3b6fb6",o:.55}]:[],arrows});
  const redraw=Coach17._tapBoard($("impDb"),G,me,(f,t,ms)=>{ if(done) return; const g2=new ChessLib.Chess(G.fen()); let m=null; try{ m=g2.move({from:f,to:t,promotion:"q"}); }catch(e){}
      if(!m) return; const ok=(f+t)===it.best.slice(0,4)||g2.isCheckmate(); G.move({from:f,to:t,promotion:"q"});
      if(ok){ msg("✅ Correct!"); } else { msg(`❌ ${E(m.san)} isn't it.`); } finish(ok&&!hint,f+t); },extra);
  $("impDh").onclick=()=>{ hint=true; redraw(); msg("💡 Hint: move the highlighted piece. Check every capture and every threat first."); };
  $("impDs").onclick=()=>{ msg("Answer shown."); finish(false,it.uci); };
  $("impDn").onclick=()=>{ DQ.i++; drillPage(s); }; }
addTile("drill","🛠","Drill my top leak",()=>{ const n=dueList().length; return n?`<b style="color:#c62828">${n} due today</b> · spaced review`:"Quiz from your own games"; },s=>{ DQ=null; drillPage(s); });
function dueBanner(){ const s=coachSec(); if(!s) return; const g=s.querySelector(".co17grid"); if(!g||s.querySelector("#impDue")) return; const n=dueList().length; if(!n) return;
  const d=document.createElement("button"); d.id="impDue"; d.className="cbtn full"; d.style.cssText="text-align:center;background:#fff3e0;border-color:#f0b44a;margin-top:10px";
  d.innerHTML=`🛠 ${n} drill${n>1?"s":""} due today: tap to review`; d.onclick=()=>{ DQ=null; openPage("drill"); }; g.parentNode.insertBefore(d,g); }

/* ================= 4. My opening plan ================= */
let OB=null; function obook(){ if(OB) return OB; try{ const j=JSON.parse(($("obook-data")||{}).textContent||"{}"); OB={p:j.p||{},lbl:j.lbl||"players"}; }catch(e){ OB={p:{},lbl:""}; } return OB; }
const okey=fen=>fen.split(" ").slice(0,3).join(" ");
function idea(mySan,bookUci,fen){ const c=new ChessLib.Chess(fen); let bm=null; try{ bm=c.move({from:bookUci.slice(0,2),to:bookUci.slice(2,4),promotion:"q"}); }catch(e){}
  if(/^f[3-6]|^g[45]/.test(mySan)) return "Don't push the f- or g-pawn early: it opens the road to your king.";
  if(/^Q/.test(mySan)&&!(bm&&bm.piece==="q")) return "Don't bring the queen out early: it gets chased and you lose time. Develop knights and bishops first.";
  if(bm&&bm.san.startsWith("O-O")) return "Castle now: get your king safe before anything else.";
  let mm=null; try{ mm=new ChessLib.Chess(fen).move(mySan); }catch(e){}
  if(bm&&(bm.piece==="n"||bm.piece==="b")){ const home=/^[bg][18]$|^[cf][18]$/.test(mm&&mm.from||"");
    if(mm&&(mm.piece==="n"||mm.piece==="b")&&home) return `Your move develops too, but ${bm.san} is the usual one here: knights out before bishops, and they guard your king.`;
    if(mm&&"nbrq".includes(mm.piece)&&!home) return "Develop a NEW piece (knight or bishop) instead of moving the same one again.";
    return "Develop your knights and bishops before pushing more pawns."; }
  if(bm&&bm.piece==="p"&&/[de]/.test(bm.to[0])) return "Fight for the centre with your d- or e-pawn.";
  if(bm&&bm.captured) return "Take back! Keep the material even.";
  return "Develop, castle, then connect your rooks. One move for each piece.";
}
function openingGroups(){ const recs=recsSorted(), G={w:{},b:{}};
  recs.forEach(r=>{ const s=sansOf(r); if(!s||s.length<6) return; const key=s.slice(0,2).join(" "); (G[r.me][key]=G[r.me][key]||[]).push({r,s}); });
  return G; }
function planFor(me){ const G=openingGroups()[me], keys=Object.keys(G).sort((a,b)=>G[b].length-G[a].length); if(!keys.length) return null;
  const games=G[keys[0]], B=obook().p, dev={}; let oppFirst=0;
  let key=keys[0]; for(let n=3;n<=8;n++){ const c={}; games.forEach(g=>{ if(g.s.length>=n){ const k=g.s.slice(0,n).join(" "); c[k]=(c[k]||0)+1; } }); const best=Object.keys(c).sort((a,b)=>c[b]-c[a])[0]; if(best&&c[best]*2>=games.length&&c[best]>=2) key=best; else break; }
  games.forEach(({r,s})=>{ const c=new ChessLib.Chess(); for(let i=0;i<Math.min(s.length,30);i++){ const fen=c.fen(), mine=(i%2===0)===(me==="w"), L=B[okey(fen)], mv=c.move(s[i]);
      if(!mv) break; if(!L){ oppFirst++; break; } const inb=L.some(x=>x[0]===mv.from+mv.to+(mv.promotion||""));
      if(inb) continue; if(!mine){ oppFirst++; break; }
      const k=okey(fen); (dev[k]=dev[k]||{fen,ply:i,mine:{},n:0,games:[]}); dev[k].n++; dev[k].mine[mv.san]=(dev[k].mine[mv.san]||0)+1; dev[k].games.push(r); break; } });
  const D=Object.values(dev).sort((a,b)=>b.n-a.n||a.ply-b.ply)[0];
  let out={me,key,oppFirst,devN:Object.values(dev).reduce((a,d)=>a+d.n,0),count:games.length,total:Object.values(G).reduce((a,b)=>a+b.length,0),others:keys.slice(1,3).map(k=>({k,n:G[k].length}))};
  if(D){ const L=B[okey(D.fen)]||[], tot=L.reduce((a,x)=>a+x[1],0), top=L.slice().sort((a,b)=>b[1]-a[1])[0]; const mySan=Object.keys(D.mine).sort((a,b)=>D.mine[b]-D.mine[a])[0];
    out.dev=Object.assign(D,{mySan,top:top?{uci:top[0],san:sanOf(D.fen,top[0]),pct:Math.round(100*top[1]/Math.max(1,tot))}:null,
      line:(()=>{ const c=new ChessLib.Chess(D.fen); return c; })()}); out.idea=top?idea(mySan,top[0],D.fen):"Develop, castle, then connect your rooks."; }
  // traps that start the same way
  if(window.TrapRadar){ const c=new ChessLib.Chess(); const P=[c.fen().split(" ").slice(0,2).join(" ")]; key.split(" ").forEach(m=>{ c.move(m); P.push(c.fen().split(" ").slice(0,2).join(" ")); });
    out.traps=TrapRadar._db.filter(T=>T.f[1]===P[2]).map(T=>({T,role:T.v===me?"watch":"set",deep:T.f.filter(f=>P.includes(f)).length})).sort((a,b)=>b.deep-a.deep).slice(0,4); }
  return out; }
function moveLine(key){ return key.split(" ").map((m,i)=>(i%2?"":(i/2+1)+". ")+m).join(" "); }
function planPage(s){ let h=pageHead("🗺 My opening plan")+`<p class="co17sm">Built from <b>your own games</b>. For your most-played start with each colour: where you usually leave the normal moves, and what ${E(obook().lbl||"stronger players")} play there.</p>`;
  let any=false;
  ["w","b"].forEach(me=>{ const P=planFor(me); h+=`<h3>${me==="w"?"⚪ As White":"⚫ As Black"}</h3>`; if(!P){ h+=`<div class="box">No studied games as ${me==="w"?"White":"Black"} yet.</div>`; return; } any=true;
    h+=`<div class="box"><b>Your most-played start:</b> ${E(moveLine(P.key))}<br><small>${P.count} of your ${P.total} studied games as ${me==="w"?"White":"Black"}${P.others.length?` · next: ${P.others.map(o=>E(moveLine(o.k))+" ("+o.n+")").join(", ")}`:""}</small></div>`;
    if(P.dev){ const d=P.dev, mv=Math.floor(d.ply/2)+1, lbl=d.ply%2?`${mv}...`:`${mv}.`;
      h+=`<div class="box bad"><b>📍 Where you leave the book: move ${lbl}</b><br><small>You left the book first in ${P.devN} of ${P.count} games (your opponent left first in ${P.oppFirst}). This spot: ${d.n} game${d.n>1?"s":""}.</small><div class="bd">${miniBoard(d.fen,me==="b",[[d.top?d.top.uci:"","#2e7d32"]])}</div>
        You usually play <b style="color:#c62828">${E(d.mySan)}</b> here.${d.top?` Most players play <b style="color:#2e7d32">${E(d.top.san)}</b> (${d.top.pct}% of games, green arrow).`:""}
        <div style="margin-top:8px">💡 <b>Simple idea:</b> ${E(P.idea)}</div></div>`; }
    else h+=`<div class="box good">You stay in the book in this line. 👍</div>`;
    if(P.traps&&P.traps.length) h+=`<div class="box"><b>🪤 Traps in this opening</b>${P.traps.map(t=>`<div style="margin-top:6px">${t.role==="watch"?"🛡 Watch out for":"🎣 You can set"} <b>${E(t.T.n)}</b><br><small>${E(t.role==="watch"?t.T.avoid:t.T.setit)}</small></div>`).join("")}<button class="cbtn full" data-trapgo="1" style="text-align:center;margin-top:8px">🪤 Open Trap Radar</button></div>`; });
  if(!any) h+=`<div class="box">Tap <b>📚 Study last 20 games</b> first, then come back.</div>`;
  s.innerHTML=h; wireBack(s); s.querySelectorAll("[data-trapgo]").forEach(b=>b.onclick=()=>{ curPage=null; s.classList.remove("impP"); window.TrapRadar&&TrapRadar.open(); }); }
addTile("plan","🗺","My opening plan","Where you leave the book + what to play",planPage);

/* ================= 5. Am I getting cleaner? ================= */
const CK5="chessReview.imp.clean.v1", PER_OPEN=3;
const CL={run:false,txt:"",i:0,n:0};
function cstore(){ return LSg(CK5,{list:[],listAt:0,weeks:{}}); }
function dOf(r){ const t=Date.parse(String(r.date||"").replace(/\./g,"-")); return isNaN(t)?0:t; }
function monday(t){ const d=new Date(t); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getTime(); }
function gradeRec(r){ const ev=r.ev||[]; return {hang:ev.filter(e=>e.k==="hang").length,mm:ev.filter(e=>e.k==="missmate").length,
  low:(r.mv||[]).filter(m=>m[3]!=null&&m[3]<60).length,clk:(r.mv||[]).some(m=>m[3]!=null)}; }
async function refreshList(force){ const C=cstore(); if(!force&&Date.now()-C.listAt<30*60*1000&&C.list.length) return C;
  const user=((window.CRUser&&CRUser.info())||{}).cc; if(!user) return C;
  const a=await (await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`)).json(); const arcs=(a.archives||[]).slice(-2).reverse(); let L=[];
  for(const u of arcs){ const j=await (await fetch(u)).json(); (j.games||[]).forEach(x=>{ if(!x.pgn||x.rules!=="chess"||x.time_class==="bullet") return; if(Date.now()-x.end_time*1000>35*864e5) return; L.push({id:String(x.url).replace(/\/$/,""),t:x.end_time*1000,tc:x.time_class}); }); }
  L.sort((x,y)=>y.t-x.t); C.list=L; C.listAt=Date.now(); C.user=user; LSs(CK5,C); C._arcs=arcs; return C; }
async function gradeSome(n){ if(CL.run||!window.Analyzer||!window.ReviewApp||!window.PatternStore) return; if(ReviewApp.isRunning()) return;
  const user=((window.CRUser&&CRUser.info())||{}).cc; if(!user) return; CL.run=true;
  try{ const C=await refreshList(false); const todo=C.list.filter(g=>!PatternStore.has(g.id)).slice(0,n);
    if(todo.length&&!ReviewApp.isRunning()){ ReviewApp.setRunning(true);
      try{ const need=new Set(todo.map(g=>g.id)), pg={}; const a=await (await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`)).json();
        for(const u of (a.archives||[]).slice(-2).reverse()){ const j=await (await fetch(u)).json(); (j.games||[]).forEach(x=>{ const id=String(x.url).replace(/\/$/,""); if(need.has(id)) pg[id]=x.pgn; }); }
        let eng=await ReviewApp.getEngine();
        for(let k=0;k<todo.length;k++){ const g=todo[k]; if(!pg[g.id]) continue; CL.txt=`Grading game ${k+1} of ${todo.length} (quick check)…`; paintClean(true);
          try{ const d=await Analyzer.analyzeGame(pg[g.id],{engine:eng,username:user,side:"auto",mode:"quick",cancelled:()=>false},()=>{}); d.meta.link=g.id; d.meta.pgn=pg[g.id]; PatternStore.put(d,pg[g.id]); }
          catch(e){ console.error(e); try{ eng.quit(); }catch(_){} eng=await ReviewApp.getEngine(true); } }
      } finally { ReviewApp.setRunning(false); } }
  }catch(e){ console.error(e); }
  CL.run=false; CL.txt=""; snapshot(); paintClean(); try{ injectTilesRefresh(); }catch(e){} }
function cleanStats(){ const C=cstore(), recs=recsSorted(), byId={}; recs.forEach(r=>byId[r.id]=r); const now=Date.now(), wk=monday(now);
  const tOf=r=>{ const g=C.list.find(x=>x.id===r.id); return g?g.t:dOf(r); };
  const sum=rs=>rs.reduce((a,r)=>{ const g=gradeRec(r); a.games++; a.hang+=g.hang; a.mm+=g.mm; a.low+=g.low; if(g.clk) a.clkGames++; return a; },{games:0,hang:0,mm:0,low:0,clkGames:0});
  const inR=(a,b)=>recs.filter(r=>{ const t=tOf(r); return t>=a&&t<b; });
  const thisW=sum(inR(wk,now+864e5)), lastW=sum(inR(wk-7*864e5,wk)), month=sum(inR(now-30*864e5,wk)), all=sum(recs);
  const listN=C.list.length, graded=C.list.filter(g=>byId[g.id]).length, wkList=C.list.filter(g=>g.t>=wk), wkGraded=wkList.filter(g=>byId[g.id]).length;
  return {thisW,lastW,month,all,listN,graded,wkN:wkList.length,wkGraded}; }
function snapshot(){ try{ const C=cstore(), S=cleanStats(); C.weeks[(d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`)(new Date(monday(Date.now())))]=Object.assign({at:Date.now()},S.thisW); 
  const keys=Object.keys(C.weeks).sort(); keys.slice(0,-26).forEach(k=>delete C.weeks[k]); LSs(CK5,C); }catch(e){} }
const per=(a,k)=>a.games?a[k]/a.games:null;
function trend(a,b,k){ const x=per(a,k), y=per(b,k); if(x==null||y==null) return ""; if(y<x*0.8) return `<span style="color:#2e7d32;font-weight:800">⬇ better</span>`; if(y>x*1.2) return `<span style="color:#c62828;font-weight:800">⬆ worse</span>`; return `<span style="color:#556">≈ same</span>`; }
function paintClean(light){ const s=coachSec(); if(curPage!=="clean"||!s) return; if(light&&$("impClT")){ $("impClT").textContent=CL.txt; return; }
  const S=cleanStats(), C=cstore(), M=S.month, W=S.thisW;
  const row=(ic,name,k,desc)=>`<div class="box"><div class="row"><div><b>${ic} ${name}</b><br><small>${desc}</small></div><div style="text-align:right">${trend(M,W,k)}</div></div>
    <div style="margin-top:6px">Before this week (30 days): <b>${M[k]} in ${M.games} game${M.games===1?"":"s"}</b>${M.games?` (${(M[k]/M.games).toFixed(1)} per game)`:""}<br>This week: <b>${W[k]} in ${W.games} game${W.games===1?"":"s"}</b>${W.games?` (${(W[k]/W.games).toFixed(1)} per game)`:""}</div></div>`;
  let h=pageHead("🧼 Am I getting cleaner?")+`<p class="co17sm">Your weekly scorecard. Fewer is better. Each game gets a <b>quick check</b> (a few games every time you open the app, so your phone isn't slowed down).</p>
   <div class="box"><b>Graded ${S.graded} of ${S.listN}</b> games from the last 30 days (rapid, daily and blitz; bullet skipped).<br>This week: graded ${S.wkGraded} of ${S.wkN}.
   <div id="impClT" style="margin-top:6px;color:#3b6fb6;font-weight:700">${E(CL.txt)}</div>${S.graded<S.listN?`<button class="cbtn full" id="impClG" style="text-align:center" ${CL.run?"disabled":""}>⚡ Grade ${Math.min(PER_OPEN,S.listN-S.graded)} more now</button>`:""}</div>`;
  h+=row("🎁","Hung pieces","hang","Pieces you left for free");
  h+=row("👑","Missed checkmates","mm","Mate in 1–3 you didn't play");
  h+=row("⏱","Moves under 1 minute","low",`Moves made with less than 1 minute on your clock${M.clkGames<M.games?" (daily games have no clock)":""}`);
  const wks=Object.keys(C.weeks).sort().slice(-8);
  if(wks.length) h+=`<h3>📅 Week by week</h3><div class="box" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th align="left">Week of</th><th>Games</th><th>Hangs</th><th>Missed mates</th><th>&lt;1 min</th></tr>${wks.map(k=>{ const w=C.weeks[k]; return `<tr><td>${new Date(k+"T00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"})}</td><td align="center">${w.games}</td><td align="center">${w.hang}</td><td align="center">${w.mm}</td><td align="center">${w.low}</td></tr>`; }).join("")}</table></div>`;
  s.innerHTML=h; wireBack(s); const g=$("impClG"); if(g) g.onclick=()=>gradeSome(PER_OPEN); }
function injectTilesRefresh(){ const s=coachSec(); const t=s&&s.querySelector('[data-imp="clean"] small'); if(t) t.innerHTML=cleanSub(); }
function cleanSub(){ try{ const S=cleanStats(); return `Weekly scorecard · graded ${S.graded} of ${S.listN||"?"}`; }catch(e){ return "Weekly scorecard"; } }
addTile("clean","🧼","Am I getting cleaner?",cleanSub,s=>{ paintClean(); refreshList(false).then(()=>paintClean()).catch(()=>{}); });
function autoGrade(){ setTimeout(()=>{ if(document.hidden) return; gradeSome(PER_OPEN); },20000); }

/* ================= boot ================= */
const API={addTile,miniBoard,pageHead,wireBack,recsSorted,sansOf,sanOf,after,coachSec,LSg,LSs,E,_tiles:TILES,_cur:()=>curPage,_setCur:v=>{curPage=v;},_tapBoard:()=>Coach17._tapBoard,_tp:turningPoint,_clean:cleanStats,gradeSome,_cl:CL,_plan:planFor,_dq:()=>DQ,_drills:drills,_due:dueList,_topLeak:topLeak,_sched:schedule,_study:ST,runStudy,openPage,_caught:caughtBy,_traps:trapHits};
window.CRImp=API;
function init(){ initHeadline(); initTiles(); try{ snapshot(); }catch(e){} autoGrade(); (API._inits||[]).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,350)); else setTimeout(init,350);
})();
