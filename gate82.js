/* v82: one owner for in-flight engine work.
   The review screen treated every hidden check as "Busy with another check…" at a frozen 5% bar,
   and Cancel did not stop that check. A search that never sent bestmove, or a second go sent
   before the first finished, could hold the busy flag for good. This file queues searches,
   gives up on a hung one, and lets Cancel release the screen. */
(function(root){
"use strict";
function searchBudget(ms){ return Math.max(8000, (Number(ms)||0)*3+3000); }
const GRACE=2000, READY_BUDGET=45000, STUCK_MS=4000;
function createSearchQueue(eng, timers){
  const grace=timers.grace!=null?timers.grace:GRACE;
  let q=Promise.resolve(), dead=false;
  function fail(msg){
    dead=true; eng._gateDead=true;
    const ws=(eng.waiters||[]).splice(0);
    ws.forEach(w=>{ try{ w.rej(new Error(msg)); }catch(e){} });
    try{ if(eng.w&&eng.w.terminate) eng.w.terminate(); }catch(e){}
  }
  function guard(start, budget){
    return new Promise((res,rej)=>{
      let settled=false;
      const finish=(fn,v)=>{ if(settled) return; settled=true; timers.clear(tStop); timers.clear(tKill); fn(v); };
      const tStop=timers.set(()=>{ try{ eng.send("stop"); }catch(e){} }, budget);
      const tKill=timers.set(()=>{ fail("engine timeout"); finish(rej, new Error("engine timeout")); }, budget+grace);
      let p; try{ p=start(); }catch(e){ finish(rej, e); return; }
      Promise.resolve(p).then(v=>finish(res,v), e=>finish(rej,e));
    });
  }
  function enqueue(start, budget){
    const run=q.catch(()=>{}).then(()=>{
      if(dead||eng._gateDead) return Promise.reject(new Error("engine stopped"));
      return guard(start, budget);
    });
    q=run.catch(()=>{});
    return run;
  }
  return {enqueue, stop(){ try{ eng.send("stop"); }catch(e){} }, get dead(){ return dead||!!eng._gateDead; }, fail};
}
function createJobSlot(){
  let job=null;
  return {
    start(){ if(job) job.stop=true; job={stop:false, gen:(job?job.gen:0)+1}; return job; },
    stop(){ if(job) job.stop=true; },
    current(){ return job; },
    isCurrent(J){ return !!J&&job===J; },
    active(J){ return !!J&&job===J&&!J.stop; }
  };
}
function shouldApply(startedId, currentId){ return startedId===currentId; }
function bannerModel(s){
  const a=!!s.progOn, pat=!!s.patOn&&!s.patDone;
  const running=!!s.running;
  const busy=a||pat||running;
  if(!busy) return {busy:false, key:"", lastAt:s.lastAt||0};
  let tx="", fw="", note="Other checks wait until this one is finished.";
  if(pat&&s.batchOwn) note="You can keep using the app.";
  const bg=!a&&!pat&&s.bg;
  if(bg){
    const n=bg.n||1, f=Math.min(1,(bg.k+(bg.f||0))/n);
    tx=`Grading your recent games in the background: game ${Math.min(bg.k+1,n)} of ${n}…`;
    fw=Math.max(5,Math.round(100*f))+"%";
    note="You can look around. Tap Cancel to stop it.";
  } else if(a){ tx=s.progTxt||""; fw=s.progWidth||""; }
  else if(pat){ tx=s.patTxt||""; fw=s.patWidth||""; }
  else if(s.imp&&s.imp.running){
    tx=s.imp.txt||"Checking your latest games in the background…";
    fw=Math.max(5, Math.round(+s.imp.pct||0))+"%";
    note="You can keep using the app. Tap Cancel to stop it.";
  } else if(s.study&&s.study.run){
    tx=s.study.txt||"Studying your games…";
    fw=Math.max(5, Math.round(+s.study.pct||0))+"%";
    note="You can keep using the app. Tap Cancel to stop it.";
  } else tx="Busy with another check…";
  if(!fw) fw="5%";
  const key=tx+"|"+fw;
  const lastAt=key!==s.lastKey?s.now:(s.lastAt||s.now);
  if(s.now-lastAt>90000) note="This is taking longer than usual. Tap Cancel, or reload the page.";
  return {busy:true, tx:tx||"Checking your game…", fw, note, key, lastAt};
}
function applyCancel(w){
  w.stop=true;
  if(w.imp) w.imp.cancel=true;
  if(w.bg) w.bg.cancel=true;
  if(w.study) w.study.cancel=true;
  if(w.batch) w.batch.cancel=true;
  try{ if(w.engineStop) w.engineStop(); }catch(e){}
  return w;
}
function releaseStuck(w, age, limit){
  if(!w.stop||!w.running||w.busyMine) return false;
  if(age<(limit==null?STUCK_MS:limit)) return false;
  w.running=false;
  return true;
}
const api={searchBudget, GRACE, READY_BUDGET, STUCK_MS, createSearchQueue, createJobSlot, shouldApply, bannerModel, applyCancel, releaseStuck};
root.CRGate82=api;
if(typeof document==="undefined"||typeof window==="undefined") return;

const queues=new WeakMap();
const realTimers={set:(fn,ms)=>setTimeout(fn,ms), clear:id=>clearTimeout(id), grace:GRACE};
function queueFor(eng){ let q=queues.get(eng); if(!q){ q=createSearchQueue(eng, realTimers); queues.set(eng,q); } return q; }
let lastEng=null, wants=false, stuckTimer=null;
function stopShared(){ if(lastEng&&!lastEng._gateDead){ try{ lastEng.send("stop"); }catch(e){} } }
function wantsStop(){ return wants; }
function allow(){ wants=false; }
function install(){
  const Engine=window.Analyzer&&Analyzer.Engine;
  if(!Engine||Engine.prototype.__gate82) return;
  Engine.prototype.__gate82=1;
  const origA=Engine.prototype.analyse, origR=Engine.prototype.ready, origQ=Engine.prototype.quit;
  Engine.prototype.analyse=function(fen,depth,movetime,multipv){
    return queueFor(this).enqueue(()=>origA.call(this,fen,depth,movetime,multipv), searchBudget(movetime));
  };
  Engine.prototype.ready=function(){
    return queueFor(this).enqueue(()=>origR.call(this), READY_BUDGET);
  };
  Engine.prototype.quit=function(){
    this._gateDead=true;
    const ws=(this.waiters||[]).splice(0);
    ws.forEach(w=>{ try{ w.rej(new Error("cancelled")); }catch(e){} });
    try{ return origQ.call(this); }catch(e){}
  };
  Engine.prototype.gateStop=function(){ try{ this.send("stop"); }catch(e){} };
  const RA=window.ReviewApp;
  if(RA&&RA.getEngine&&!RA.getEngine.__gate82){
    const origG=RA.getEngine;
    const wrapped=async function(force){
      let e=await origG.call(RA, force);
      if(e&&e._gateDead) e=await origG.call(RA, true);
      lastEng=e; return e;
    };
    wrapped.__gate82=1; RA.getEngine=wrapped;
  }
}
function cancelAll(){
  wants=true;
  const w={imp:window.Coach17&&Coach17._imp, bg:window.CRBg, study:window.CRImp&&CRImp._study};
  applyCancel(w);
  try{
    const pp=document.getElementById("patProg"), pc=document.getElementById("patCancel");
    if(pp&&pp.classList.contains("on")&&!pp.classList.contains("done")&&pc) pc.click();
  }catch(e){}
  try{ const bc=document.getElementById("bCancel"); if(bc) bc.click(); }catch(e){}
  stopShared();
  if(stuckTimer) clearInterval(stuckTimer);
  const started=Date.now();
  stuckTimer=setInterval(()=>{
    const running=!!(window.ReviewApp&&ReviewApp.isRunning&&ReviewApp.isRunning());
    const mine=!!(window.CRBusy&&CRBusy.isMine&&CRBusy.isMine());
    if(!running){ clearInterval(stuckTimer); stuckTimer=null; wants=false; return; }
    const world={stop:true, running:true, busyMine:mine};
    if(releaseStuck(world, Date.now()-started, STUCK_MS)){
      try{ ReviewApp.setRunning(false); }catch(e){}
      try{ if(lastEng&&!lastEng._gateDead) lastEng.quit(); }catch(e){}
      clearInterval(stuckTimer); stuckTimer=null;
    }
  }, 300);
}
function stepAside(){
  let stepped=false;
  try{
    const i=window.Coach17&&Coach17._imp;
    if(i&&i.running&&!i.cancel&&i.pauseFor){ i.pauseFor(true); stepped=true; }
  }catch(e){}
  stopShared();
  return {back(){ if(!stepped) return; stepped=false; try{ const i=window.Coach17&&Coach17._imp; if(i&&!i.cancel&&i.pauseFor) i.pauseFor(false); }catch(e){} }};
}
install();
setInterval(()=>{
  try{
    if(!window.ReviewApp||!ReviewApp.isRunning||!ReviewApp.isRunning()) return;
    if(!(lastEng&&lastEng._gateDead)) return;
    if(window.CRBusy&&CRBusy.isMine&&CRBusy.isMine()) return;
    ReviewApp.setRunning(false);
  }catch(e){}
}, 500);
root.CRGate={wantsStop, allow, cancelAll, stepAside, stopShared, bannerModel, shouldApply, createJobSlot, searchBudget};
})(typeof globalThis!=="undefined"?globalThis:this);
