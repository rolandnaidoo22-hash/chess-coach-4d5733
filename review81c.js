/* v81c: Game Review. Two players, accuracy, and move labels, then the moves one by one.
   Uses the engine lines already stored on the game. Does not replace Coach, Patterns, or the bots. */
(function(){
"use strict"; if(window.CRReview81) return;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ORDER=["great","best","excellent","good","book","inaccuracy","mistake","miss","blunder"];
const ALWAYS=["best","excellent","good","inaccuracy","mistake","blunder"];
const NAME={great:"Great",best:"Best",excellent:"Excellent",good:"Good",book:"Book",inaccuracy:"Inaccuracy",mistake:"Mistake",miss:"Missed chance",blunder:"Blunder"};
const COL={great:"#5c8bb0",best:"#81b64c",excellent:"#96bc4b",good:"#77915f",book:"#a88865",inaccuracy:"#e6a817",mistake:"#e67e22",miss:"#e06a50",blunder:"#c0392b"};
function winWhite(ev){ if(!ev) return 50; if(ev.mate!=null) return ev.mate>0?100:0;
  const cp=+ev.cp||0; return 50+50*(2/(1+Math.exp(-0.00368208*cp))-1); }
function winMover(ev,color){ const w=winWhite(ev); return color==="w"?w:100-w; }
function accuracy(diff){ const a=103.1668*Math.exp(-0.04354*Math.max(0,diff))-3.1669; return Math.max(0,Math.min(100,a)); }
function playedBest(p){ if(!p||!p.uci||!p.best_uci) return false; return p.uci.slice(0,4)===p.best_uci.slice(0,4); }
function gradeMove(p, prev){
  const c=p.color==="b"?"b":"w";
  const before=winMover(p.eval_before,c), after=winMover(p.eval,c);
  const diff=Math.max(0, before-after);
  const best=playedBest(p);
  let cls;
  if(best){ cls="best"; if(p.alt_eval&&after-winMover(p.alt_eval,c)>=10) cls="great"; }
  else if(diff<2) cls="excellent";
  else if(diff<5) cls="good";
  else if(diff<10) cls="inaccuracy";
  else if(diff<20) cls="mistake";
  else cls="blunder";
  if(p.cls==="book"&&diff<2) cls="book";
  if(!best&&diff>=10&&prev&&prev.diff>=10&&before>=60) cls="miss";
  const acc=best||diff<0.05?100:accuracy(diff);
  return {cls, acc, diff, before, after, best};
}
function reviewOf(plies){ const grades=[]; let prev=null;
  (plies||[]).forEach(p=>{ const g=gradeMove(p, prev); grades.push(g); prev=g; });
  const side=color=>{ const mine=[]; grades.forEach((g,i)=>{ if(plies[i].color===color) mine.push(g); });
    const acc=mine.length?Math.round(mine.reduce((s,g)=>s+g.acc,0)/mine.length*10)/10:null;
    const counts={}; ORDER.forEach(k=>counts[k]=mine.filter(g=>g.cls===k).length);
    return {acc, counts, n:mine.length}; };
  return {grades, w:side("w"), b:side("b")}; }
function showAcc(n){ if(n==null||isNaN(n)) return "–"; const r=Math.round(n*10)/10; return (Math.abs(r-Math.round(r))<0.05?String(Math.round(r)):r.toFixed(1)); }

const CSS=`#gr81{margin:0 0 12px}#gr81 h2{font-size:20px;margin:0 0 2px}#gr81 .sub{color:var(--mute,#667);font-size:13px;margin:0 0 8px}
.gr81top{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
.gr81top .who{font-weight:800;font-size:15px;line-height:1.2}.gr81top .who small{display:block;font-weight:600;color:var(--mute,#667);font-size:12px}
.gr81top .who.r{text-align:right}
.gr81acc{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center;margin:8px 0}
.gr81acc .n{font-size:30px;font-weight:800;text-align:center;border-radius:12px;padding:6px 0;background:#f4f1ea}
.gr81acc .lab{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mute,#667);text-align:center}
.gr81row{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;min-height:32px;font-weight:800}
.gr81row b{text-align:center;font-size:16px}.gr81row i{justify-self:center;font-style:normal;color:#fff;border-radius:8px;padding:2px 8px;font-size:13px;font-weight:800}
#gr81go{width:100%;min-height:48px;margin-top:10px;font-weight:800;border-radius:12px;border:0;background:#3b6fb6;color:#fff;font:inherit}
#gr81step{display:none;align-items:center;gap:6px;margin:0 0 8px;padding:6px;border-radius:12px;border:1px solid var(--line,#ddd);background:#fff}
#gr81step.on{display:flex}#gr81step button{min-height:44px;min-width:44px;border-radius:10px;border:1px solid var(--line,#ccc);background:#fff;font:inherit;font-weight:800}
#gr81step .t{flex:1;min-width:0;font-size:14.5px;line-height:1.25}#gr81step .t small{display:block;color:var(--mute,#667);font-weight:600}
#gr81last{margin-left:6px}
html.dark-mode .gr81acc .n,html.dark-mode #gr81step,html.dark-mode #gr81step button{background:#262626;color:#eee;border-color:#444}`;
let styled=false, stepOn=false, last=null;
function css(){ if(styled) return; styled=true; const s=document.createElement("style"); s.id="gr81css"; s.textContent=CSS; document.head.appendChild(s); }
function rows(rep){ return ORDER.filter(k=>ALWAYS.indexOf(k)>=0||rep.w.counts[k]||rep.b.counts[k]).map(k=>`<div class="gr81row"><b>${rep.w.counts[k]||0}</b><i style="background:${COL[k]}">${NAME[k]}</i><b>${rep.b.counts[k]||0}</b></div>`).join(""); }
function plies(){ try{ return (typeof P!=="undefined"&&P&&P.length)?P:[]; }catch(e){ return []; } }
function meta(){ try{ return (typeof M!=="undefined")?M:null; }catch(e){ return null; } }
function paint(){ css(); const el=document.getElementById("rv59sum"); const P=plies(), M=meta(); if(!el||!P.length||!M) return;
  let host=document.getElementById("gr81"); if(!host){ el.insertAdjacentHTML("afterbegin",`<div id="gr81"></div>`); host=document.getElementById("gr81"); }
  last=reviewOf(P); const me=(typeof UC!=="undefined"&&UC)?UC:"w";
  host.innerHTML=`<h2>Game Review</h2><p class="sub">Both players, from the engine check on this phone.</p>
    <div class="gr81top"><div class="who">${E(M.white||"White")}${me==="w"?"<small>You</small>":""}</div><div></div><div class="who r">${E(M.black||"Black")}${me==="b"?"<small>You</small>":""}</div></div>
    <div class="gr81acc"><div class="n">${showAcc(last.w.acc)}</div><div class="lab">Accuracy</div><div class="n">${showAcc(last.b.acc)}</div></div>
    ${rows(last)}
    <button type="button" id="gr81go">See the moves</button>`;
  const goBtn=host.querySelector("#gr81go"); if(goBtn) goBtn.onclick=seeMoves;
  const old=el.querySelector(".rv59acc"); if(old) old.remove();
}
function ensureStep(){ css(); if(document.getElementById("gr81step")) return;
  const b=document.getElementById("board"); const html=`<div id="gr81step"></div>`;
  if(b) b.insertAdjacentHTML("beforebegin", html); else document.querySelector("section.main")&&document.querySelector("section.main").insertAdjacentHTML("afterbegin", html);
}
function renderStep(){ const bar=document.getElementById("gr81step"); if(!bar) return;
  const on=stepOn&&document.body.classList.contains("rv59-moves"); bar.classList.toggle("on", !!on); if(!on||!last) return;
  const i=typeof cur==="number"?cur:0; const Ps=plies(); const p=Ps[i-1]; const g=last.grades[i-1];
  const n=Ps.length;
  if(!p||!g){ bar.innerHTML=`<button type="button" id="gr81sum">‹ Summary</button><div class="t"><b>Start</b><small>Tap next for the first move.</small></div><button type="button" id="gr81next" aria-label="Next move">›</button>`; }
  else { const tag=`<i style="background:${COL[g.cls]};color:#fff;border-radius:7px;padding:0 6px;font-style:normal">${NAME[g.cls]}</i>`;
    const better=!g.best&&p.best_san?`Better: ${E(p.best_san)}`:`${Math.round(g.acc)} accuracy`;
    bar.innerHTML=`<button type="button" id="gr81prev" aria-label="Previous move">‹</button><div class="t"><b>${E(p.label||p.san)} ${tag}</b><small>${better}</small></div><button type="button" id="gr81next" aria-label="Next move">›</button><button type="button" id="gr81sum">Summary</button>`; }
  const sum=bar.querySelector("#gr81sum"); if(sum) sum.onclick=()=>{ stepOn=false; try{ window.CRRev59&&CRRev59.setTab("sum"); }catch(e){} renderStep(); window.scrollTo(0,0); };
  const prev=bar.querySelector("#gr81prev"); if(prev) prev.onclick=()=>{ if(typeof go==="function") go(Math.max(0,i-1), true); };
  const next=bar.querySelector("#gr81next"); if(next) next.onclick=()=>{ if(typeof go==="function") go(Math.min(n,i+1), true); };
}
function seeMoves(){ stepOn=true; try{ window.CRHome&&CRHome.setMode("review", true); }catch(e){} try{ window.CRRev59&&CRRev59.setTab("moves"); }catch(e){} ensureStep(); if(typeof go==="function") go(Math.max(1, typeof cur==="number"&&cur?cur:1), true); else renderStep(); }
function openLatest(){ let d=null; try{ const list=window.ReviewApp&&ReviewApp.loadGames&&ReviewApp.loadGames(); if(list&&list[0]) d=ReviewApp.upgrade?ReviewApp.upgrade(list[0].data):list[0].data; }catch(e){}
  try{ window.CRHome&&CRHome.setMode("review", true); }catch(e){}
  if(d&&typeof loadData==="function"){ loadData(d); return; }
  const p=document.getElementById("paste"); if(p) p.classList.add("open");
  const m=document.getElementById("patErr")||document.getElementById("perr"); if(m&&!d) m.textContent="Analyze a game first. Game Review opens on the summary.";
}
function wireButtons(){ const pr=document.getElementById("patRun"); if(pr&&!document.getElementById("gr81last")){ const b=document.createElement("button"); b.id="gr81last"; b.type="button"; b.className="btn"; b.textContent="Game Review"; b.onclick=openLatest; pr.insertAdjacentElement("afterend", b); } }
function hook(){
  if(typeof window.buildSummary==="function"&&!window.buildSummary.__gr81){ const ob=window.buildSummary; const f=function(){ const r=ob.apply(this, arguments); try{ paint(); }catch(e){ console.error(e); } return r; }; f.__gr81=1; window.buildSummary=f; try{ buildSummary=f; }catch(e){} }
  if(typeof window.go==="function"&&!window.go.__gr81){ const og=window.go; const f=function(){ const r=og.apply(this, arguments); try{ renderStep(); }catch(e){} return r; }; f.__gr81=1; window.go=f; try{ go=f; }catch(e){} }
  if(window.CRRev59&&CRRev59.setTab&&!CRRev59.setTab.__gr81){ const os=CRRev59.setTab; const f=function(t){ const r=os.apply(this, arguments); try{ renderStep(); }catch(e){} return r; }; f.__gr81=1; CRRev59.setTab=f; }
  wireButtons(); try{ paint(); }catch(e){}
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook); else hook();
setTimeout(hook, 400);
window.CRReview81={reviewOf, gradeMove, winWhite, accuracy, paint, seeMoves, openLatest};
})();
