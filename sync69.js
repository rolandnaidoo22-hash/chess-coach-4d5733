/* v69: quietly pull new Chess.com games every 2 minutes while the app is open, and on open/resume.
   Polite: only the current month's archive, and the browser revalidates with ETag / If-Modified-Since (cache:"no-cache"). */
(function(){ "use strict"; if(window.CRSync) return;
const K="chessReview.v69.sync", EVERY=120000, NEWFOR=24*3600e3;
const LG=()=>{ try{ return JSON.parse(localStorage.getItem(K)||"null")||{}; }catch(e){ return {}; } };
const SV=s=>{ try{ localStorage.setItem(K,JSON.stringify(s)); }catch(e){} };
const user=()=>(((window.CRUser&&CRUser.info())||{}).cc||"").trim().toLowerCase();
const pad=n=>String(n).padStart(2,"0"), idOf=u=>String(u||"").replace(/\/$/,"");
let st=LG(), busy=null, msg="", imp=false;
if(st.u&&st.u!==user()) st={};
const hm=t=>new Date(t).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
function label(){ if(!user()) return "Add your Chess.com username to get your games";
  const b=busy?"checking for new games…":imp?"checking the new games…":msg;
  return (st.at?`Last refreshed at ${hm(st.at)}`:"Not refreshed yet")+(navigator.onLine===false?" (offline)":"")+(b?` · ${b}`:""); }
function paint(){ document.querySelectorAll(".cr69at").forEach(e=>e.textContent=label()); document.querySelectorAll(".cr69go").forEach(b=>{ b.disabled=!!busy; }); }
function isNew(id){ id=idOf(id); const n=(st.nw||{})[id]; return !!n&&Date.now()-n<NEWFOR; }
function seen(id){ id=idOf(id); if(st.nw&&st.nw[id]){ delete st.nw[id]; SV(st); } }
function mergeCharts(fresh){ try{ const KG="chessReview.v56.charts.games"; const c=JSON.parse(localStorage.getItem(KG)||"null"); if(!c||!Array.isArray(c.games)||!window.CRStudy) return false;
    const have=new Set(c.games.map(g=>g.id)); let add=0; fresh.forEach(g=>{ const r=CRStudy.fromChessCom(g,user()); if(r&&!have.has(r.id)){ c.games.push(r); have.add(r.id); add++; } });
    if(!add) return true; c.games.sort((a,b)=>a.t-b.t); c.games=c.games.slice(-250); localStorage.setItem(KG,JSON.stringify(c)); return true; }catch(e){ return false; } }
async function pull(manual){ const u=user(); if(!u){ msg=""; paint(); return {err:"nouser"}; } if(busy) return busy;
  busy=(async()=>{ paint(); let out={n:0};
    try{ const d=new Date(), url=`https://api.chess.com/pub/player/${encodeURIComponent(u)}/games/${d.getFullYear()}/${pad(d.getMonth()+1)}`;
      const r=await fetch(url,{cache:"no-cache"}); if(r.status===404){ throw new Error("nf"); } if(!r.ok) throw new Error("http "+r.status);
      const j=await r.json(), G=(j.games||[]).filter(g=>g&&g.pgn&&g.rules==="chess"); st.u=u; st.nw=st.nw||{};
      const first=!st.seen; const S=new Set(st.seen||[]), fresh=G.filter(g=>!S.has(idOf(g.url)));
      fresh.forEach(g=>{ S.add(idOf(g.url)); if(!first) st.nw[idOf(g.url)]=Date.now(); });
      st.seen=[...S].slice(-400); st.at=Date.now(); Object.keys(st.nw).forEach(k=>{ if(Date.now()-st.nw[k]>NEWFOR) delete st.nw[k]; }); SV(st);
      out.n=first?0:fresh.length; msg=out.n?`${out.n} new game${out.n>1?"s":""}`:(manual?"no new games":"");
      if(!mergeCharts(G)&&window.CRCharts&&CRCharts._load) try{ await CRCharts._load(true); }catch(e){}
      if(fresh.length&&window.CRRating) CRRating.refresh();
      if((out.n||manual||first)&&!(navigator.onLine===false)) setTimeout(()=>quick(G),0); document.dispatchEvent(new CustomEvent("cr69games",{detail:out}));
    }catch(e){ msg=navigator.onLine===false?"":"couldn't reach Chess.com"; out.err=String(e&&e.message||e); }
    busy=null; paint(); return out; })(); return busy; }
/* quick-check the new games so they appear in the coach's game list; retry if another analysis is running */
async function quick(G,tries){ tries=tries||0; if(!window.Coach17||!Coach17.autoImport) return; imp=true; paint(); let r=null;
  try{ r=await Coach17.autoImport(true,{games:G}); }catch(e){} imp=false; paint();
  if(r==="busy"&&tries<12){ setTimeout(()=>quick(G,tries+1),10000); return; }
  document.dispatchEvent(new CustomEvent("cr69games",{detail:{}})); }
function due(){ return !st.at||Date.now()-st.at>=EVERY; }
function tick(){ if(document.hidden||navigator.onLine===false||!user()) return; if(due()) pull(false); }
setInterval(()=>{ tick(); paint(); },15000);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&user()&&navigator.onLine!==false&&(!st.at||Date.now()-st.at>15000)) pull(false); });
addEventListener("online",()=>pull(false)); addEventListener("offline",paint);
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest(".cr69go"); if(b){ e.preventDefault(); pull(true); } });
const go=()=>setTimeout(()=>{ if(user()) pull(false); },1200);
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",go); else go();
window.CRSync={pull,isNew,seen,label,paint,state:()=>st,
  bar:()=>`<div class="cr69bar" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:6px 0 10px"><button class="cbtn blue cr69go" type="button" style="min-height:44px;font-size:16px">⬇ Get my latest games</button><small class="cr69at" style="color:#556">${label()}</small></div>`,
  tag:id=>isNew(id)?` <span class="cr69new" style="background:#e8f3ff;color:#1a5fb4;border-radius:8px;padding:0 6px;font-size:12px;font-weight:700">new</span>`:""};
})();
