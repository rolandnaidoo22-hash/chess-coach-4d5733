/* v72: Quick review. Pick a recent game, a short engine pass finds the 3 biggest turning points in your moves,
   and shows each one on a board with arrows and one plain line. Text comes from local templates: no waiting on the network. */
(function(){ "use strict"; if(window.CRQuick72) return;
const $=id=>document.getElementById(id), B=document.body, E_=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const BUDGET=18000, CK="chessReview.v72.quick";
const NAME={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const css=`
#cr66seg button.on72{background:var(--card,#1c1f26);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.3)}
body.cr72q #cr66seg button.on:not([data-t=quick]){background:none;font-weight:400;box-shadow:none}
#cr66seg button{font-size:13.5px}
#cr72{display:none}body.cr72q #cr72{display:flex;flex-direction:column;position:fixed;left:0;right:0;bottom:0;top:var(--cr72t,150px);z-index:58;background:var(--bg,#f5f3ee);padding:6px 8px 8px;overflow:auto}
#cr72 .gl{display:flex;flex-direction:column;gap:6px}
#cr72 .g{display:flex;align-items:center;gap:10px;width:100%;text-align:left;min-height:54px;border-radius:12px;border:1px solid var(--line,rgba(127,127,127,.35));background:var(--card,#fff);color:inherit;font:inherit;padding:6px 10px}
#cr72 .g.L{border:2px solid #ca3431;background:rgba(202,52,49,.08)}
#cr72 .g .r{min-width:52px;text-align:center;font-weight:800;font-size:13px;border-radius:8px;padding:4px 0;background:rgba(127,127,127,.18)}
#cr72 .g.L .r{background:#ca3431;color:#fff}#cr72 .g.W .r{background:#81b64c;color:#fff}
#cr72 .g .t{flex:1;line-height:1.25}#cr72 .g .t small{display:block;opacity:.7;font-size:12.5px}#cr72 .g .go{font-weight:700;color:var(--accent,#2f6fd6);white-space:nowrap}
#cr72 .hint{margin:2px 0 8px;font-size:14px;opacity:.85}
#cr72 .pb{height:10px;border-radius:5px;background:rgba(127,127,127,.25);overflow:hidden;margin:10px 0}#cr72 .pb i{display:block;height:100%;width:0;background:var(--accent,#2f6fd6);transition:width .2s}
#cr72 .hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}#cr72 .hd b{flex:1;font-size:15px}
#cr72 .bd{align-self:center;line-height:0}#cr72 .bd svg{width:100%;height:100%;border-radius:6px}
#cr72 .tx{font-size:15px;line-height:1.35;margin:6px 0;padding:8px 10px;border-radius:12px;background:var(--card,#fff);border-left:5px solid #ca3431}
#cr72 .lg{display:flex;gap:10px;font-size:12px;opacity:.85;flex-wrap:wrap}#cr72 .lg i{display:inline-block;width:14px;height:4px;border-radius:2px;vertical-align:middle;margin-right:3px}
#cr72 .rw{display:flex;gap:8px;margin-top:6px}#cr72 .rw button{flex:1;min-height:44px}
html.dark-mode #cr72 .g,html.dark-mode #cr72 .tx{background:#262626;color:#eee}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
let on=false, job=null, view={k:"list"};
const cache=()=>{ try{ return JSON.parse(localStorage.getItem(CK)||"{}"); }catch(e){ return {}; } };
const save=(id,v)=>{ try{ const c=cache(); c[id]=v; const ks=Object.keys(c); if(ks.length>20) delete c[ks[0]]; localStorage.setItem(CK,JSON.stringify(c)); }catch(e){} };
function games(){ try{ return window.CRSync?CRSync.list():[]; }catch(e){ return []; } }
function build(){ const seg=$("cr66seg"); if(!seg) return false;
  if(!seg.querySelector("[data-t=quick]")){ seg.insertAdjacentHTML("beforeend",`<button type="button" data-t="quick">⚡ Quick review</button>`);
    seg.querySelector("[data-t=quick]").onclick=e=>{ e.stopPropagation(); open(); };
    seg.querySelectorAll("button:not([data-t=quick])").forEach(b=>b.addEventListener("click",()=>close(),true));
    const nw=$("cr66new"); if(nw) nw.addEventListener("click",()=>close(),true); }
  if(!$("cr72")) B.insertAdjacentHTML("beforeend",`<div id="cr72" role="tabpanel" aria-label="Quick review"></div>`);
  return true; }
function place(){ const s=$("cr66seg"); if(s){ const r=s.getBoundingClientRect(); B.style.setProperty("--cr72t",Math.max(0,Math.round(r.bottom+4))+"px"); } }
function open(){ if(!build()) return; on=true; B.classList.add("cr72q"); window.scrollTo(0,0); place(); paint(); const q=$("cr66seg").querySelector("[data-t=quick]"); q.classList.add("on72"); q.setAttribute("aria-selected","true");
  try{ if(window.CRSync&&!games().length) CRSync.pull(false).then(()=>{ if(view.k==="list") paint(); }); }catch(e){} }
function close(){ if(!on) return; on=false; B.classList.remove("cr72q"); const q=document.querySelector("#cr66seg [data-t=quick]"); if(q){ q.classList.remove("on72"); q.setAttribute("aria-selected","false"); } }
function paint(){ const p=$("cr72"); if(!p) return; place();
  if(view.k==="list"){ const L=games(), C=cache();
    p.innerHTML=`<p class="hint">Pick a game. In about half a minute you'll see the 3 moves that cost you most, with arrows.</p>`+(L.length?`<div class="gl">`+L.map(x=>{ const c=x.res==="Lost"?"L":x.res==="Won"?"W":"D";
      return `<button type="button" class="g ${c}" data-u="${E_(x.url)}"><span class="r">${x.res==="Lost"?"Lost":x.res==="Won"?"Won":"Draw"}</span><span class="t"><b>vs ${E_(x.op)}${x.or?` (${E_(x.or)})`:""}</b><small>${new Date(x.t*1000).toLocaleDateString()} · ${E_(x.tc||"")} · you were ${x.me==="w"?"White":"Black"}</small></span><span class="go">${C[x.url]?"See it ›":"Check ›"}</span></button>`; }).join("")+`</div>`
      :`<p class="hint">No games yet. Add your Chess.com username, then tap below.</p>${window.CRSync?CRSync.bar():""}`);
    p.querySelectorAll(".g").forEach(b=>b.onclick=()=>run(b.dataset.u)); return; }
  if(view.k==="run"){ p.innerHTML=`<div class="hd"><b>Checking your game…</b><button type="button" class="btn" id="cr72c">Cancel</button></div><p class="hint" id="cr72pt">Looking for the moves that cost you most.</p><div class="pb"><i id="cr72pf"></i></div><small>Usually done in about 20–30 seconds.</small>`;
    $("cr72c").onclick=()=>{ if(job) job.stop=true; view={k:"list"}; paint(); }; return; }
  if(view.k==="none"){ p.innerHTML=`<div class="hd"><b>vs ${E_(view.g.op)}</b><button type="button" class="btn" id="cr72l">‹ Games</button></div><div class="tx" style="border-left-color:#81b64c">No big mistakes found in your moves. Nicely played! For a closer look, open the full review.</div><div class="rw"><button type="button" class="btn primary" id="cr72f">📋 Open full review</button></div>`;
    $("cr72l").onclick=()=>{ view={k:"list"}; paint(); }; $("cr72f").onclick=()=>full(view.g); return; }
  if(view.k==="show"){ const M=view.r.m, i=view.i, m=M[i], g=view.g;
    const top=$("cr72").getBoundingClientRect().top, room=innerHeight-top-12-230, sz=Math.max(220,Math.min(innerWidth-16,room,560));
    p.innerHTML=`<div class="hd"><b>Turning point ${i+1} of ${M.length} · Move ${Math.ceil(m.ply/2)}</b><button type="button" class="btn" id="cr72l">‹ Games</button></div>
      <div class="bd" style="width:${sz}px;height:${sz}px">${board(m.fen,g.me,m)}</div>
      <div class="lg"><span><i style="background:#d23c3c"></i>your move</span><span><i style="background:#2e9b4f"></i>better move</span>${m.th?`<span><i style="background:#e8a11b"></i>their threat</span>`:""}</div>
      <div class="tx" id="cr72tx">${E_(m.text)}</div>
      <div class="rw"><button type="button" class="btn" id="cr72b" ${i===0?"disabled":""}>‹ Back</button><button type="button" class="btn primary" id="cr72n">${i===M.length-1?"Done ✓":"Next ›"}</button></div>
      <div class="rw"><button type="button" class="btn" id="cr72f">📋 Open full review</button></div>`;
    $("cr72l").onclick=()=>{ view={k:"list"}; paint(); }; $("cr72b").onclick=()=>{ view.i--; paint(); };
    $("cr72n").onclick=()=>{ if(view.i<M.length-1){ view.i++; paint(); } else { view={k:"list"}; paint(); } }; $("cr72f").onclick=()=>full(g); }
}
function full(g){ close(); try{ CRRev66.tab("game"); }catch(e){} try{ const pi=$("pgnIn"); if(pi) pi.value=g.pgn; if(window.CRSync) CRSync.seen(g.url); ReviewApp.analyze(g.pgn); }catch(e){ console.error(e); } }
function board(fen,me,m){ const XY=sq=>{ const f="abcdefgh".indexOf(sq[0]), r=+sq[1]-1; return me==="w"?[f*45,(7-r)*45]:[(7-f)*45,r*45]; };
  let s=`<svg viewBox="0 0 360 360" role="img" aria-label="Board at this moment">`;
  for(let f=0;f<8;f++)for(let r=0;r<8;r++){ const [x,y]=XY("abcdefgh"[f]+(r+1)); s+=`<rect x="${x}" y="${y}" width="45" height="45" fill="${(f+r)%2?"#ebecd0":"#779556"}"/>`; }
  [m.uci.slice(0,2),m.uci.slice(2,4)].forEach(q=>{ const [x,y]=XY(q); s+=`<rect x="${x}" y="${y}" width="45" height="45" fill="#f6eb72" opacity=".5"/>`; });
  for(let i=0;i<8;i++){ const fl=me==="w"?"abcdefgh"[i]:"hgfedcba"[i], rk=me==="w"?8-i:i+1; s+=`<text x="${i*45+43}" y="358" font-size="9" text-anchor="end" fill="#333" font-weight="700">${fl}</text><text x="2" y="${i*45+10}" font-size="9" fill="#333" font-weight="700">${rk}</text>`; }
  fen.split(" ")[0].split("/").forEach((row,ri)=>{ let f=0; for(const ch of row){ if(/\d/.test(ch)){ f+=+ch; continue; } const [x,y]=XY("abcdefgh"[f]+(8-ri)); s+=`<use href="#pc-${ch===ch.toUpperCase()?"w":"b"}${ch.toUpperCase()}" x="${x}" y="${y}" width="45" height="45"/>`; f++; } });
  const ar=(u,c,dash)=>{ const [x1,y1]=XY(u.slice(0,2)).map(v=>v+22.5), [x2,y2]=XY(u.slice(2,4)).map(v=>v+22.5), dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, ex=x2-ux*14, ey=y2-uy*14;
    return `<g class="ar" data-c="${c}"><line x1="${x1+ux*8}" y1="${y1+uy*8}" x2="${ex}" y2="${ey}" stroke="${c}" stroke-width="${dash?6:8}" stroke-linecap="round" ${dash?'stroke-dasharray="9 6"':""} opacity=".85"/><polygon points="${x2},${y2} ${ex-uy*11},${ey+ux*11} ${ex+uy*11},${ey-ux*11}" fill="${c}" opacity=".92"/></g>`; };
  if(m.th) s+=ar(m.th,"#e8a11b",true); if(m.best&&m.best!==m.uci) s+=ar(m.best,"#2e9b4f"); s+=ar(m.uci,"#d23c3c");
  return s+`</svg>`; }
/* ---- the quick engine pass ---- */
const wp=sc=>{ const cp=sc.mate!=null?(sc.mate>0?10000:-10000):sc.cp; return 50+50*(2/(1+Math.exp(-0.00368208*Math.max(-10000,Math.min(10000,cp))))-1); };
let ENG=null; async function eng(){ if(ENG) return ENG; const E=window.Analyzer&&Analyzer.Engine; ENG=new E(()=>new Worker("stockfish.js")); await ENG.init(); return ENG; }
async function run(url){ const g=games().find(x=>x.url===url); if(!g) return; const C=cache()[url]; if(C){ show(g,C); return; }
  if(job) job.stop=true; const J=job={stop:false}; view={k:"run",g}; paint();
  try{ const pg=Analyzer.parsePgn(g.pgn), mv=pg.moves, N=mv.length; const t0=performance.now(); const per=Math.max(50,Math.min(300,Math.round(BUDGET/(N+1))));
    const e=await eng(); const S=[];
    for(let i=0;i<=N;i++){ if(J.stop) return; const fen=i<N?mv[i].before:mv[N-1].after; const r=await e.analyse(fen,14,per,1); S.push({sc:r.score,bm:r.pv&&r.pv[0]||r.bm});
      const pf=$("cr72pf"); if(pf) pf.style.width=Math.round(100*(i+1)/(N+1))+"%"; const pt=$("cr72pt"); if(pt) pt.textContent=`Checking move ${Math.ceil((i+1)/2)} of ${Math.ceil(N/2)}…`; }
    const L=[]; for(let i=0;i<N;i++){ const m=mv[i]; if(m.color!==g.me) continue; const b=wp(S[i].sc), a=100-wp(S[i+1].sc), d=b-a; if(d>=7&&S[i].bm&&S[i].bm!==m.uci) L.push({i,d,b,a}); }
    L.sort((x,y)=>y.d-x.d); const top=L.slice(0,3).sort((x,y)=>x.i-y.i);
    const res={m:top.map(o=>moment(mv,S,o)),ms:Math.round(performance.now()-t0)}; window.CRQuick72.last=res; save(url,res); if(J.stop) return; job=null; show(g,res);
  }catch(err){ console.error(err); job=null; view={k:"list"}; paint(); const p=$("cr72"); if(p) p.insertAdjacentHTML("afterbegin",`<div class="tx">Sorry, that game couldn't be checked. Try the full review instead.</div>`); } }
function show(g,res){ view=res.m.length?{k:"show",g,r:res,i:0}:{k:"none",g}; if(on) paint(); }
function pieceAt(fen,sq){ const rows=fen.split(" ")[0].split("/"), f="abcdefgh".indexOf(sq[0]), r=8-(+sq[1]); let c=0; for(const ch of rows[r]){ if(/\d/.test(ch)){ c+=+ch; continue; } if(c===f) return ch; c++; } return null; }
function moment(mv,S,o){ const m=mv[o.i], fen=m.before, after=m.after, best=S[o.i].bm, rep=S[o.i+1].bm;
  const pc=NAME[(pieceAt(fen,m.uci.slice(0,2))||"p").toLowerCase()], to=m.uci.slice(2,4);
  const grade=o.d>=20?"a big mistake":o.d>=12?"a mistake":"a slip";
  let why=""; let th=null;
  const rsc=S[o.i+1].sc; if(rsc&&rsc.mate!=null&&rsc.mate>0){ why=" This let them force checkmate."; th=rep; }
  else if(rep&&rep.length>=4){ const vic=pieceAt(after,rep.slice(2,4)), att=NAME[(pieceAt(after,rep.slice(0,2))||"p").toLowerCase()];
    if(vic){ why=` It let their ${att} take your ${NAME[vic.toLowerCase()]} on ${rep.slice(2,4)}.`; th=rep; }
    else if(o.d>=12){ why=` It gave them a strong reply: ${att} to ${rep.slice(2,4)}.`; th=rep; } }
  let bt=""; if(best){ const bp=NAME[(pieceAt(fen,best.slice(0,2))||"p").toLowerCase()], bv=pieceAt(fen,best.slice(2,4));
    bt=` Better was your ${bp} to ${best.slice(2,4)}${bv?`, taking their ${NAME[bv.toLowerCase()]}`:""}.`; }
  let lead=o.b>=70&&o.a<55?`You let a win slip: moving your ${pc} to ${to} threw away your lead.`:`You made ${grade}: you moved your ${pc} to ${to}.`;
  return {ply:o.i+1,fen,uci:m.uci,best,th,d:Math.round(o.d),text:lead+why+bt}; }
function tick(){ build(); if(on&&!B.classList.contains("hs-review")) close(); if(on) place(); }
window.CRQuick72={open,close,run,state:()=>view,last:null};
setInterval(tick,400); addEventListener("resize",()=>{ if(on&&view.k==="show") paint(); });
})();
