/* v68: the player's rating, always fresh from Chess.com (public stats) on open, resume and fetch. Last known value is kept on the phone for offline. */
(function(){ "use strict"; if(window.CRRating) return;
const K="chessReview.v68.rating", TC=[["rapid","Rapid"],["blitz","Blitz"],["bullet","Bullet"],["daily","Daily"]];
const LG=()=>{ try{ return JSON.parse(localStorage.getItem(K)||"null"); }catch(e){ return null; } };
const user=()=>(((window.CRUser&&CRUser.info())||{}).cc||"").trim();
let cur=LG(), busy=null, live=false;
if(cur&&cur.u&&cur.u!==user().toLowerCase()) cur=null;
function pickTc(st){ /* the time control he plays most, rapid by default */
  let best="rapid", n=-1; TC.forEach(([k])=>{ const x=st["chess_"+k]; if(!x||!x.last) return; const r=x.record||{}, g=(r.win||0)+(r.loss||0)+(r.draw||0); if(g>n||(g===n&&k==="rapid")){ n=g; best=k; } });
  return st["chess_"+best]&&st["chess_"+best].last?best:(st.chess_rapid?"rapid":null); }
function ago(t){ const m=Math.round((Date.now()-t)/60000); return m<1?"just now":m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:`${Math.round(m/1440)} days ago`; }
const tcName=k=>(TC.find(x=>x[0]===k)||[,k])[1];
function label(){ if(!cur) return user()?"Chess.com rating, loading…":"Add your Chess.com username"; return `Chess.com ${tcName(cur.tc)} · ${live?"updated "+ago(cur.at):"last known, "+ago(cur.at)+(navigator.onLine===false?" (offline)":"")}`; }
function paint(){ document.querySelectorAll(".cr68go").forEach(e=>{ const g=window.CRGoal&&CRGoal.get(); if(g&&cur) e.textContent=Math.max(0,g-cur.r); }); document.querySelectorAll(".cr68v").forEach(e=>{ if(cur) e.textContent=cur.r; }); document.querySelectorAll(".cr68m").forEach(e=>e.textContent=label()); }
async function refresh(){ const u=user(); if(!u) return null; if(busy) return busy;
  busy=(async()=>{ try{ const r=await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}/stats`,{cache:"no-store"}); if(!r.ok) throw 0; const st=await r.json(), tc=pickTc(st);
      if(tc){ cur={r:st["chess_"+tc].last.rating,tc,at:Date.now(),u:u.toLowerCase()}; live=true; try{ localStorage.setItem(K,JSON.stringify(cur)); }catch(e){} document.dispatchEvent(new CustomEvent("cr68rating",{detail:cur})); } }
    catch(e){ live=false; } busy=null; paint(); return cur; })(); return busy; }
window.CRRating={now:()=>cur, refresh, label, isLive:()=>live,
  html:(fb)=>`<b class="cr68v">${cur?cur.r:(fb||"–")}</b>`, meta:()=>`<small class="cr68m" style="display:block">${label()}</small>`};
setInterval(paint,30000);
const go=()=>refresh();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",go); else setTimeout(go,0);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) go(); });
addEventListener("online",go);
/* every fetch of games from Chess.com also refreshes the rating */
const of=window.fetch; window.fetch=function(u){ try{ const s=String(u&&u.url||u); if(/api\.chess\.com\/pub\/player\/[^/]+\/games/.test(s)) setTimeout(go,0); }catch(e){} return of.apply(this,arguments); };
})();
