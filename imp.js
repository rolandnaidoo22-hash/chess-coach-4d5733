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
  TILES.forEach(T=>{ if(g.querySelector(`[data-imp="${T.id}"]`)) return; const b=document.createElement("button"); b.className="co17tile"; b.setAttribute("data-imp",T.id);
    b.innerHTML=`<span class="ic">${T.ic}</span><b>${E(T.t)}</b><small>${typeof T.sub==="function"?T.sub():E(T.sub)}</small>`; b.onclick=()=>openPage(T.id); g.appendChild(b); }); }
function openPage(id,arg){ const T=TILES.find(x=>x.id===id); if(!T||!window.Coach17) return; Coach17.open("home"); const s=coachSec(); if(!s) return;
  if(!$("imppcss")){ const st=document.createElement("style"); st.id="imppcss"; st.textContent=PCSS; document.head.appendChild(st); }
  curPage=id; s.classList.add("impP"); window.scrollTo(0,0); T.fn(s,arg); }
function pageHead(t){ return `<div class="co17h"><h2>${t}</h2><div><button class="cbtn" data-impback="1">‹ Back</button></div></div>`; }
function wireBack(s){ s.querySelectorAll("[data-impback]").forEach(b=>b.onclick=()=>{ curPage=null; s.classList.remove("impP"); Coach17.open("home"); }); }
function initTiles(){ const s=coachSec(); if(!s){ if((initTiles.n=(initTiles.n||0)+1)<40) setTimeout(initTiles,250); return; }
  new MutationObserver(()=>{ if(!s.querySelector("[data-impback]")){ s.classList.remove("impP"); curPage=null; } injectTiles(); }).observe(s,{childList:true}); injectTiles(); }
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

/* ================= boot ================= */
const API={_tp:turningPoint,openPage,_caught:caughtBy,_traps:trapHits};
window.CRImp=API;
function init(){ initHeadline(); initTiles(); (API._inits||[]).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,350)); else setTimeout(init,350);
})();
