/* v57: puzzles from your own blunders, "Save yourself" defence puzzles, bot-game guard log, training streak. */
(function(){ "use strict"; if(window.CRBlunders) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, E_=s=>U().E_(s), LS=()=>U().LS;
const CH=()=>window.ChessLib&&ChessLib.Chess||window.Chess;
const KB="chessReview.v57.blunders", KA="chessReview.v56.charts.an", KGU="chessReview.v57.guard", BIG=300, PER=3, ANN=40;
const today=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const dstr=t=>t?new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"";
const siteOf=g=>g.site==="l"||/lichess\.org/.test(g.id)?"Lichess":"Chess.com";
function st(){ const s=LS().get(KB,null); return s&&s.v===1?s:{v:1,items:{},done:{},seen:{}}; }
function save(s){ LS().set(KB,s); }
function fensOf(g){ const C=CH(), ch=new C(), f=[ch.fen()], u=[]; for(const x of g.m){ const r=ch.move(x); if(!r) break; u.push(r.from+r.to+(r.promotion||"")); f.push(ch.fen()); } return {f,u}; }
/* ---------- build ---------- */
let running=false;
async function games(){ if(!window.CRCharts) return {games:[]}; return await CRCharts._load(false); }
async function analyse(G,onP){ const A=LS().get(KA,{}), todo=G.slice(-ANN).filter(g=>!A[g.id]); let k=0; onP&&onP("check",0,todo.length);
  for(const g of todo){ try{ A[g.id]=await CRStyle.analyseGame(g); }catch(e){ console.warn(e); break; } k++; onP&&onP("check",k,todo.length); if(k%5===0) LS().set(KA,A); }
  LS().set(KA,A); return A; }
async function build(G,onP){ if(running) return; running=true; const E=window.CRBotEngine; await E.boot(); const s=st(), A=LS().get(KA,{});
  const todo=G.filter(g=>A[g.id]&&!s.done[g.id]); let k=0; onP&&onP("find",0,todo.length);
  try{ for(const g of todo){ const {f,u}=fensOf(g); const big=A[g.id].filter(x=>x[2]>=BIG&&f[x[0]]&&u[x[0]]).sort((a,b)=>b[2]-a[2]).slice(0,PER);
      for(const [ply,ph,loss] of big){ const fen=f[ply], played=u[ply];
        const L=await E.candidates(fen,1,700); const best=L[0]&&L[0].uci; if(!best||best.slice(0,4)===played.slice(0,4)) continue;
        const R=await E.candidates(f[ply+1],1,500); const reply=R[0]&&R[0].uci;
        const tg=CRGuard.tag(fen,played,best,reply,L[0].score); const san=g.m[ply];
        s.items[g.id+"|"+ply]={id:g.id+"|"+ply,gid:g.id,ply,f:fen,u:played,san,best,reply,loss,k:tg.k,t:tg.t,why:tg.why,op:g.op||"",oe:g.oe||0,at:g.t,site:siteOf(g),c:g.c,mn:Math.floor(ply/2)+1}; }
      s.done[g.id]=1; k++; onP&&onP("find",k,todo.length); if(k%3===0) save(s); } }
  finally{ const keep=new Set(G.map(g=>g.id)); Object.keys(s.done).forEach(id=>{ if(!keep.has(id)) delete s.done[id]; }); Object.keys(s.items).forEach(id=>{ if(!keep.has(s.items[id].gid)) delete s.items[id]; }); save(s); running=false; } }
function items(){ return Object.values(st().items).sort((a,b)=>b.at-a.at||a.ply-b.ply); }
const vsTxt=b=>`vs ${b.op||"opponent"}${b.oe?" ("+b.oe+")":""} · ${b.site} · ${dstr(b.at)} · move ${b.mn}`;
function moment(b){ return {id:"bl:"+b.id,f:b.f,best:b.best,k:b.k,lab:b.t+" · from your game",bl:b}; }
function moments(){ const s=st(); return items().map(moment).sort((a,b)=>(s.seen[a.bl.id]||0)-(s.seen[b.bl.id]||0)); }
function markSeen(id,ok){ const s=st(); s.seen[id]=(s.seen[id]||0)+1; if(ok!=null){ s.res=s.res||{}; s.res[id]=ok?1:-1; } (s.days=s.days||[]).includes(today())||s.days.push(today()); s.days=s.days.slice(-200); save(s); }
/* card shown above a blunder puzzle; the reason line shows once the move is chosen */
function decorate(P){ const b=P&&P.bl; if(!b) return; markSeen(b.id);
  const put=()=>{ const r=$("tf54"); if(!r||r.querySelector(".bl57c")) return; const h=r.querySelector(".tfq"); if(!h) return;
    h.insertAdjacentHTML("beforebegin",`<div class="card bl57c"><b>🩹 Your blunder: <span class="bl57t">${E_(b.t)}</span></b><div class="bl57g">${E_(vsTxt(b))}</div><div class="mute">You played <b>${E_(b.san)}</b> here. Find a better move.</div></div>`); };
  setTimeout(put,0); const r=$("tf54"); if(!r) return;
  const ob=new MutationObserver(()=>{ put(); const o=$("tfOut"); if(o&&o.innerHTML.trim()&&!r.querySelector(".bl57w")){ const ok=!!r.querySelector(".tfres.ok"); { const q=st(); q.res=q.res||{}; q.res[b.id]=ok?1:-1; save(q); } o.insertAdjacentHTML("afterbegin",`<div class="card bl57w"><b>Why it went wrong: ${E_(b.t)}</b><p>${E_(b.why)}</p></div>`); ob.disconnect(); } });
  ob.observe(r,{childList:true,subtree:true}); setTimeout(()=>ob.disconnect(),10*60e3); }
/* ---------- defence puzzles from the bundled Lichess set (defensiveMove theme) ---------- */
let DEF=null;
function defPool(){ if(DEF) return DEF; DEF=[]; try{ String(window.LPUZ||"").split("\n").forEach(l=>{ const p=l.split(","); if(p.length<5||!((+p[4])&(1<<11))) return; const mv=p[2].split(" "); if(mv.length<2) return;
    const g=new (CH())(p[1]); const r=g.move({from:mv[0].slice(0,2),to:mv[0].slice(2,4),promotion:mv[0][4]||"q"}); if(!r) return;
    DEF.push({id:"ld:"+p[0],f:g.fen(),lm:mv[0],best:mv[1],r:+p[3],lab:"Save yourself",isDef:true,lp:1,pf:p[1]}); }); }catch(e){ console.warn(e); } return DEF; }
/* ---------- bot guard log ---------- */
function guard(){ return LS().get(KGU,{games:[]}); }
function guardSave(x){ LS().set(KGU,x); }
function myRating(){ try{ const c=LS().get("chessReview.v56.charts.games",null); const g=c&&c.games&&c.games.slice().reverse().find(g=>g.e); return g?g.e:0; }catch(e){ return 0; } }
function guardOn(){ const x=guard(); if(typeof x.on==="boolean") return x.on; const r=myRating(); return !r||r<1200; }
function setGuard(on){ const x=guard(); x.on=!!on; guardSave(x); }
function logBot(gid,patch){ const x=guard(); let r=x.games.find(g=>g.gid===gid); if(!r){ r={gid,t:Date.now(),hung:0,heed:0,ign:0,n:0}; x.games.push(r); } Object.keys(patch).forEach(k=>{ if(typeof patch[k]==="number"&&k!=="t") r[k]=(r[k]||0)+patch[k]; else r[k]=patch[k]; });
  if(patch.heed||patch.ign){ (x.days=x.days||[]).includes(today())||x.days.push(today()); } x.heed=(x.heed||0)+(patch.heed||0); x.ign=(x.ign||0)+(patch.ign||0); x.games=x.games.slice(-120); guardSave(x); }
/* ---------- hung pieces per game (for Charts) ---------- */
function hungSeries(G){ const A=LS().get(KA,{}), out=[];
  G.filter(g=>A[g.id]).forEach(g=>{ const {f,u}=fensOf(g); let n=0; A[g.id].forEach(([ply,ph,loss])=>{ if(loss>=200&&f[ply]&&u[ply]&&CRGuard.check(f[ply],u[ply])) n++; }); out.push({t:g.t,n,src:"g"}); });
  const bots=guard().games.filter(x=>x.n>=4).map(x=>({t:x.t,n:x.hung,src:"b"})); return out.concat(bots).sort((a,b)=>a.t-b.t); }
function days(){ const D=new Set(); try{ Object.entries(LS().get("chessReview.daily.v1",{days:{}}).days||{}).forEach(([d,v])=>{ if(Object.values(v||{}).some(n=>n>0)) D.add(d); }); }catch(e){}
  try{ (LS().get("chessReview.tf.v1",{}).days||[]).forEach(d=>D.add(d)); }catch(e){} (st().days||[]).forEach(d=>D.add(d)); (guard().days||[]).forEach(d=>D.add(d)); return D; }
function streak(){ const D=days(); const k=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  let n=0, d=new Date(); if(!D.has(k(d))) d.setDate(d.getDate()-1); while(D.has(k(d))){ n++; d.setDate(d.getDate()-1); }
  const s=[...D].sort(); let best=0, run=0, prev=null; s.forEach(x=>{ const t=Date.parse(x+"T12:00:00"); run=prev&&Math.round((t-prev)/864e5)===1?run+1:1; prev=t; best=Math.max(best,run); });
  const last=[]; const e=new Date(); for(let i=27;i>=0;i--){ const q=new Date(e); q.setDate(e.getDate()-i); last.push({d:k(q),on:D.has(k(q))}); } return {n,best,last,total:D.size}; }
/* ---------- screen ---------- */
const CSS=`#bl57 .bl57i{display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff;color:inherit;font:inherit;padding:8px;margin:6px 0;min-height:64px;cursor:pointer}
#bl57 .bl57i svg{width:72px;height:72px;flex:none;border-radius:6px}#bl57 .bl57i b{display:block}.bl57t{display:inline-block;background:#c62828;color:#fff;border-radius:8px;padding:1px 7px;font-size:13px}.bl57g{font-size:12.5px;color:var(--mute,#777);margin:2px 0}
.bl57c{border:2px solid #c62828!important;background:#fff6f6!important}.bl57w{border:2px solid #3b6fb6!important}#bl57 .bl57pg{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin:6px 0}#bl57 .bl57pg i{display:block;height:100%;background:#2e7d32}
#bl57 .bl57tags{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}#bl57 .bl57tags span{background:#eee;border-radius:8px;padding:2px 8px;font-size:12.5px;font-weight:700}
html.dark-mode #bl57 .bl57i{background:#262626}html.dark-mode .bl57c{background:#2a2020!important}`;
function css(){ if($("bl57css")) return; const s=document.createElement("style"); s.id="bl57css"; s.textContent=CSS; document.head.appendChild(s); }
function page(){ css(); return U().show("bl57"); }
function pgBar(el,kind,k,n){ if(!el) return; el.innerHTML=`<p class="mute">${kind==="check"?"Checking your games with the engine":"Finding your big mistakes"}: ${k} of ${n}…</p><div class="bl57pg"><i style="width:${n?Math.round(100*k/n):0}%"></i></div>`; }
async function open(){ const p=page(); const w=window.CRAcct?{cc:CRAcct.cc&&CRAcct.cc(),li:CRAcct.li&&CRAcct.li()}:{};
  if(!w.cc&&!w.li){ p.innerHTML=`<h2>🩹 Puzzles from my blunders</h2><div class="card"><p>Add your Chess.com or Lichess username. The app checks your own public games, finds your biggest mistakes and turns each one into a "find the better move" puzzle.</p></div><div class="row"><button class="bt go" id="bl57add">Add your username</button></div>`;
    $("bl57add").onclick=()=>CRAcct.ask(()=>open()); return; }
  p.innerHTML=`<h2>🩹 Puzzles from my blunders</h2><p class="mute">Reading your games…</p>`;
  let c; try{ c=await games(); }catch(e){ p.innerHTML=`<h2>🩹 Puzzles from my blunders</h2><div class="card"><p>Couldn't load your games: ${E_(e.message||e)}</p></div><div class="row"><button class="bt" id="bl57rt">Try again</button></div>`; $("bl57rt").onclick=open; return; }
  paint(c.games||[]); }
function paint(G){ const p=page(), A=LS().get(KA,{}), s=st(), set=G.slice(-ANN), an=set.filter(g=>A[g.id]).length, built=set.filter(g=>s.done[g.id]).length, L=items();
  const tags={}; L.forEach(b=>tags[b.t]=(tags[b.t]||0)+1);
  const need=an<set.length, needB=set.some(g=>A[g.id]&&!s.done[g.id]);
  p.innerHTML=`<h2>🩹 Puzzles from my blunders</h2><p class="mute">Your biggest mistakes (the engine says they lost 3+ pawns' worth) from your ${set.length} newest public games. Find the move you should have played.</p>
   ${need||needB?`<div class="card"><b>${an?`${an} of ${set.length} games checked`:"Not analysed yet"}</b><p class="mute">${an?"":"The app's engine has not checked your games yet. "}This runs on your phone and takes a few minutes.</p><button class="bt go" id="bl57go">🔎 ${need?`Check my ${set.length} newest games`:"Find my blunders"}</button><div id="bl57pg"></div></div>`:""}
   ${L.length?`<div class="bl57tags">${Object.entries(tags).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<span>${E_(t)} ×${n}</span>`).join("")}</div>
   <div class="row"><button class="bt go" id="bl57all">▶ Solve them in order</button></div>
   ${L.slice(0,40).map((b,i)=>`<button class="bl57i" data-i="${i}">${U().mini(b.f,b.c)}<span><span class="bl57t">${E_(b.t)}</span>${s.res&&s.res[b.id]===1?" ✅":""}<span class="bl57g">${E_(vsTxt(b))}</span><span class="mute">You played ${E_(b.san)}</span></span></button>`).join("")}`
   :an&&!needB?`<div class="card"><p>No big mistakes found in your checked games. Nice!</p></div>`:""}`;
  const go=$("bl57go"); if(go) go.onclick=async()=>{ go.disabled=true; const el=$("bl57pg"), onP=(k,a,b)=>pgBar($("bl57pg"),k,a,b);
    try{ await analyse(G,onP); await build(G.slice(-ANN),onP); }catch(e){ console.warn(e); } if($("bl57")&&$("bl57").classList.contains("on")) paint(G); };
  p.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>play(L[+b.dataset.i],L.slice(+b.dataset.i+1)));
  const all=$("bl57all"); if(all) all.onclick=()=>play(L.find(b=>!(s.res&&s.res[b.id]===1))||L[0],L); }
function play(b,rest){ if(!b||!window.CRThink) return; CRThink._own(moment(b),rest&&rest.length?()=>play(rest[0],rest.slice(1)):null); }
window.CRBlunders={open,moments,decorate,defPool,markSeen,items,build,analyse,guardOn,setGuard,guard,logBot,hungSeries,streak,days,_st:st};
})();
