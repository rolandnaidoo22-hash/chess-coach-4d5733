/* The app always opens on the home screen. If the phone throws the page away while an analysis is running, that analysis carries on. Also: make "Get my latest games" stand out when new games may be waiting. */
(function(){
"use strict"; if(window.CRResume67) return;
const $=id=>document.getElementById(id), KS="chessReview.v67.where", KR="chessReview.v67.run", KF="chessReview.v67.lastFetch", MAXAGE=12*3600e3, STALE=30*60e3;
const LG=(k)=>{ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } };
let restoring=true;
function where(){ const H=window.CRHome; if(!H) return null; const w={at:Date.now(),mode:H.mode()};
  try{ if(w.mode==="review"&&!document.body.classList.contains("nogame")&&typeof DATA!=="undefined"&&DATA&&DATA.plies){ w.gid=ReviewApp.gameId(DATA); w.ply=typeof cur!=="undefined"?cur:0; w.tab=window.CRRev59&&CRRev59.tab(); } }catch(e){}
  try{ const p=$("paste"), pt=$("pat"); w.sub=pt&&pt.classList.contains("on")?"pat":p&&p.classList.contains("gopen")?"games":"game"; }catch(e){}
  return w; }
function save(){ if(restoring) return; const w=where(); if(w) try{ localStorage.setItem(KS,JSON.stringify(w)); }catch(e){} }
function restore(){ const run=LG(KR), H=window.CRHome, R=window.ReviewApp;
  const fresh=x=>x&&Date.now()-(x.at||0)<MAXAGE;
  try{
    /* Every launch opens on the home screen. (It used to reopen the last screen, which left a blank page when that screen
       was one of the tools, such as Play the bots, because the tool itself is not reopened.) An analysis that was still
       running is the one exception: it carries on below so the work is not lost. */
    if(fresh(run)&&run.pgn&&!R.isRunning()){ H.setMode("review",true);
      const u=$("uname"); if(u&&run.uname) u.value=run.uname; const sd=$("side"); if(sd&&run.side) sd.value=run.side;
      const m=document.querySelector(`input[name=mode][value=${run.mode==="quick"?"quick":"deep"}]`); if(m) m.checked=true;
      const pi=$("pgnIn"); if(pi) pi.value=run.pgn; window.__cr67resumed=1; R.analyze(run.pgn); }
  }catch(e){ console.error(e); }
  restoring=false; save(); }
/* "Get my latest games": blue when it's been a while, plain after a fetch */
function paintFetch(){ const b=$("bFetch"); if(!b) return; const t=+(localStorage.getItem(KF)||0), stale=Date.now()-t>STALE;
  b.classList.toggle("primary",stale); b.classList.toggle("cr67fresh",!stale); b.title=stale?"New games may be waiting":"Fetched recently"; }
function watchFetch(){ const fl=$("fetchList"); if(!fl||fl.__cr67) return; fl.__cr67=1;
  new MutationObserver(()=>{ if(fl.querySelector(".gitem")){ try{ localStorage.setItem(KF,String(Date.now())); }catch(e){} paintFetch(); } }).observe(fl,{childList:true,subtree:true}); }
window.CRResume67={save,restore,where,paintFetch,_keys:{KS,KR,KF}};
const ready=()=>window.CRHome&&window.ReviewApp&&window.CRRev59&&$("bFetch")&&$("pbody")&&$("pbody").dataset.v43;
let n=0; (function wait(){ if(ready()||n++>60){ setTimeout(()=>{ restore(); watchFetch(); paintFetch(); },300); return; } setTimeout(wait,150); })();
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") save(); else paintFetch(); });
addEventListener("pagehide",save); addEventListener("freeze",save); setInterval(save,4000); setInterval(paintFetch,60000);
})();
