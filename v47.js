/* v47: never show "the computer is busy". Wait (pausing background imports) and run automatically. */
(function(){
"use strict"; if(window.CRBusy) return;
const $=id=>document.getElementById(id), B=document.body, sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RA=()=>window.ReviewApp, IMP=()=>window.Coach17&&Coach17._imp;
let mine=0, pausedByUs=false, resumeT=null, chain=Promise.resolve();
function bar(on,txt){ let p=$("v46prog"); if(!p){ p=document.createElement("div"); p.id="v46prog"; p.innerHTML=`<div id="v46pt"></div><div class="pb"><i id="v46pf"></i></div>`; B.appendChild(p); }
  if(on&&!p.classList.contains("on")) window.scrollTo({top:0,behavior:"smooth"});
  p.classList.toggle("on",!!on); const rp=$("prog"); p.style.top=(on&&rp&&rp.classList.contains("on"))?rp.offsetHeight+"px":""; B.classList.toggle("v46an",!!on); if(on){ $("v46pt").textContent=txt; const f=$("v46pf"); f.style.width=((+f.dataset.w||0)%90+10)+"%"; f.dataset.w=(+f.dataset.w||0)+7; } }
function userReview(){ const p=$("prog"); const pat=$("patProg"); return !!(p&&p.classList.contains("on"))&&!(pat&&pat.classList.contains("on")); }
/* Wait until the engine is free, take it, and return release(). onWait(txt) is told what we're waiting for. */
function acquire(opt){ opt=opt||{}; const run=chain.then(()=>take(opt)); chain=run.catch(()=>{}); return run; }
async function take(opt){ const r=RA(); if(!r) throw new Error("no engine");
  clearTimeout(resumeT); let showed=false;
  while(r.isRunning()&&!mine){ const imp=IMP();
    if(imp&&imp.running&&!imp.paused){ imp.pauseFor(true); pausedByUs=true; }
    const txt=userReview()?"Waiting for your game review to finish…":"Waiting for the computer…";
    if(opt.bar!==false){ bar(true,txt); showed=true; } opt.onWait&&opt.onWait(txt); await sleep(400); }
  if(showed) bar(false);
  if(!mine) r.setRunning(true); mine++; let done=false;
  return function release(){ if(done) return; done=true; mine--; if(mine>0) return; r.setRunning(false);
    if(pausedByUs){ resumeT=setTimeout(()=>{ if(!mine&&pausedByUs){ pausedByUs=false; const i=IMP(); i&&i.pauseFor(false); } },2500); } }; }
/* For short one-off callers: take the engine, give it back once its queue is empty. */
async function engine(opt){ const rel=await acquire(opt); const E=await RA().getEngine();
  (async()=>{ await sleep(300); for(let t=0;t<600;t++){ if(!E.waiters||!E.waiters.length) break; await sleep(200); } rel(); })(); return E; }
window.CRBusy={acquire,engine,bar,isMine:()=>mine>0};
})();
