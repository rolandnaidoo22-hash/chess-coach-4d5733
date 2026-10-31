/* Review screen layout: one top bar, simple tabs, a short "new review" chooser, one progress card, a guided walk through key moments. */
(function(){
const $=id=>document.getElementById(id), B=document.body;
const css=`
body.hs-review #hs{position:sticky;top:0;z-index:60;background:var(--bg,#0f1115);padding-bottom:6px}
body.hs-review #homeBtn{display:none!important}
body{padding-bottom:84px}
#cr66top{display:none}body.hs-review #cr66top{display:block}
#cr66seg{display:flex;gap:4px;background:rgba(127,127,127,.15);border-radius:12px;padding:3px;margin:6px 0 0}
#cr66seg button{flex:1;border:0;background:none;color:inherit;font:inherit;font-size:14px;padding:9px 4px;border-radius:9px;min-height:40px}
#cr66seg button.on{background:var(--card,#1c1f26);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.3)}
#cr66new{width:100%;margin-top:6px;min-height:44px;font-weight:700}
body.hs-review #paste .phead{display:none}body.hs-review #paste:not(.open):not(.gopen){display:none}
#cr66ch{display:flex;gap:6px;margin:4px 0 10px;flex-wrap:wrap}
#cr66ch button{flex:1;min-width:30%;min-height:42px;border-radius:10px;border:1px solid rgba(127,127,127,.4);background:none;color:inherit;font:inherit;font-size:13px}
#cr66ch button.on{border-color:var(--accent,#4c8bf5);background:rgba(76,139,245,.18);font-weight:700}
.cr66g{display:none}#pbody[data-src=latest] .cr66g[data-g=latest],#pbody[data-src=li] .cr66g[data-g=li],#pbody[data-src=paste] .cr66g[data-g=paste]{display:block}
#cr66set{margin:10px 0}#cr66set summary{cursor:pointer;padding:6px 0}
#cr66prog{display:none;margin-top:6px;padding:10px;border-radius:12px;background:var(--card,#1c1f26);border:1px solid var(--accent,#4c8bf5)}
body.cr66busy #cr66prog{display:block}body.cr66busy #prog,body.cr66busy #patProg{display:none!important}
#cr66prog .pbar{height:8px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden;margin:6px 0}
#cr66prog .pbar i{display:block;height:100%;background:var(--accent,#4c8bf5);width:0}
#cr66prog .r{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px}
body.cr66busy [data-cr66d]{opacity:.45}
#cr66walk{width:100%;min-height:46px;margin:6px 0 4px;font-weight:700}
#cr66w{position:fixed;left:8px;right:8px;bottom:8px;z-index:70;padding:8px 10px;border-radius:12px;max-height:30vh;overflow:auto;background:var(--card,#1c1f26);border:2px solid var(--accent,#4c8bf5);box-shadow:0 4px 18px rgba(0,0,0,.5)}
#cr66w p{margin:2px 0 6px;font-size:14px;line-height:1.35}#cr66w .r{display:flex;gap:8px}#cr66w .r button{flex:1;min-height:40px}
#cr66w .h{display:flex;align-items:center;gap:8px}#cr66w .h b{flex:1}#cr66wx{min-width:44px;min-height:40px;font-size:18px;font-weight:800;padding:0}
body.cr66walking{padding-bottom:calc(30vh + 20px)}body.cr66walking .side{padding-bottom:calc(30vh + 24px)!important;scroll-padding-bottom:calc(30vh + 24px)}
.cr66more{margin-top:12px;border-top:1px solid rgba(127,127,127,.25);padding-top:6px}.cr66more>summary{cursor:pointer;padding:8px 0;font-weight:700}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
const tab=t=>{ const p=$("paste"), pt=$("pat"); if(!p) return;
  if(t==="game"){ p.classList.remove("open","gopen"); if(pt&&pt.classList.contains("on")&&window.PatternsUI) PatternsUI.toggle(); if(B.classList.contains("nogame")) p.classList.add("open"); }
  if(t==="games"){ p.classList.remove("open"); p.classList.add("gopen"); if(pt&&pt.classList.contains("on")&&window.PatternsUI) PatternsUI.toggle(); try{ ReviewApp.renderGames(); }catch(e){} }
  if(t==="pat"){ p.classList.remove("open","gopen"); if(pt&&!pt.classList.contains("on")) $("bOpenPat").click(); }
  window.scrollTo(0,0); sync(); };
const openNew=()=>{ tab("game"); $("paste").classList.add("open"); sync(); const u=$("uname"); if($("pbody").dataset.src==="latest"&&u&&!u.value) u.focus({preventScroll:true}); };
function build(){ const hs=document.querySelector("#hs .hsP"); if(!hs||$("cr66top")) return !!$("cr66top");
  hs.insertAdjacentHTML("beforeend",`<div id="cr66top"><button type="button" class="btn primary" id="cr66new">＋ New review</button>
   <div id="cr66seg" role="tablist"><button type="button" data-t="game">This game</button><button type="button" data-t="games">My games<span id="cr66gc"></span></button><button type="button" data-t="pat">Patterns<span id="cr66pc"></span></button></div>
   <div id="cr66prog" role="status"><div class="r"><span id="cr66pt">Checking your game…</span><button type="button" class="btn" id="cr66cancel">Cancel</button></div><div class="pbar"><i id="cr66pf"></i></div><small>Other checks wait until this one is finished.</small></div></div>`);
  $("cr66new").onclick=openNew; $("cr66seg").querySelectorAll("button").forEach(b=>b.onclick=()=>tab(b.dataset.t));
  $("cr66cancel").onclick=()=>{ const p=$("prog"); if(p&&p.classList.contains("on")) $("bCancel").click(); else { const c=$("patCancel"); if(c) c.click(); } };
  return true; }
function chooser(){ const pb=$("pbody"); if(!pb||$("cr66ch")||!pb.dataset.v43) return; const kids=[...pb.children], top=el=>kids.find(k=>k.contains(el));
  const g={}; ["latest","li","paste"].forEach(k=>{ const d=document.createElement("div"); d.className="cr66g"; d.dataset.g=k; g[k]=d; });
  const u=top($("uname")), f=$("bFetch"), fr=top(f), fl=$("fetchList"), li=top($("li16")), pg=top($("pgnIn")), md=document.querySelector("#pbody .prow.modes");
  if(u) g.latest.appendChild(u); if(fr){ if(fr.querySelector("#bAnalyze")&&fr!==pg){ const r=document.createElement("div"); r.className="prow"; r.appendChild(f); g.latest.appendChild(r); } else g.latest.appendChild(fr); } if(fl) g.latest.appendChild(fl);
  if(li) g.li.appendChild(li);
  kids.forEach(k=>{ if(k!==u&&k!==fr&&k!==fl&&k!==li&&k!==md&&k.id!=="perr"&&k.id!=="prog"&&pb.contains(k)) g.paste.appendChild(k); }); if(fr&&fr.parentNode===pb) g.paste.appendChild(fr);
  pb.insertAdjacentHTML("afterbegin",`<div id="cr66ch" role="tablist"><button type="button" data-s="latest">My latest games</button><button type="button" data-s="li">Lichess</button><button type="button" data-s="paste">Paste a game</button></div>`);
  const ch=$("cr66ch"); ch.after(g.latest,g.li,g.paste);
  if(md){ const d=document.createElement("details"); d.id="cr66set"; d.innerHTML="<summary>⚙ How careful should the check be?</summary>"; d.appendChild(md); g.paste.after(d); }
  const set=s=>{ pb.dataset.src=s; ch.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.s===s)); };
  ch.querySelectorAll("button").forEach(b=>b.onclick=()=>set(b.dataset.s)); set("latest"); }
const BUSY="#bAnalyze,#bFetch,#liGet,#liOne,#patRun,#fetchList button,#mygames button[data-an],#mygames .an,#mygames button[data-up]";
function sync(){ const p=$("paste"); if(!p||!$("cr66seg")) return; const pt=$("pat"), t=pt&&pt.classList.contains("on")?"pat":p.classList.contains("gopen")?"games":"game";
  $("cr66seg").querySelectorAll("button").forEach(b=>{ b.classList.toggle("on",b.dataset.t===t); b.setAttribute("aria-selected",b.dataset.t===t); });
  $("cr66new").classList.toggle("on",p.classList.contains("open"));
  const gc=$("gcount"), pc=$("patCount"); $("cr66gc").textContent=gc?" "+gc.textContent.trim():""; $("cr66pc").textContent=pc?" "+pc.textContent.trim():""; }
let warm=0;
function tick(){ if(!warm&&B.classList.contains("hs-review")&&window.ReviewApp&&ReviewApp.getEngine){ warm=1; setTimeout(()=>{ try{ ReviewApp.getEngine(); }catch(e){} },400); }
  if(!build()) return; chooser(); sync();
  const pr=$("prog"), pp=$("patProg"), a=pr&&pr.classList.contains("on"), b=pp&&pp.classList.contains("on");
  let busy=a||b; try{ busy=busy||ReviewApp.isRunning(); }catch(e){}
  B.classList.toggle("cr66busy",!!busy);
  if(busy){ const tx=a?$("progTxt").textContent:b?$("patProgTxt").textContent:"", fw=a?$("progFill").style.width:b?($("patProgFill")||{style:{}}).style.width:"";
    $("cr66pt").textContent=tx||"Checking your game…"; $("cr66pf").style.width=fw||"5%";
    document.querySelectorAll(BUSY).forEach(e=>{ if(!e.disabled){ e.disabled=true; e.dataset.cr66d="1"; } }); }
  else document.querySelectorAll("[data-cr66d]").forEach(e=>{ e.disabled=false; delete e.dataset.cr66d; });
  decorate(); }
const GR={blunder:"a big mistake",mistake:"a mistake",miss:"a missed chance",inaccuracy:"a small slip"};
let W=null;
function walk(i){ const L=W||[]; if(i<0||i>=L.length){ stop(); return; } W.i=i; const ply=L[i]; try{ go(ply,true); }catch(e){}
  const pl=(window.P||P||[])[ply-1]||{}, mv=Math.ceil(ply/2), cls=pl.cls||"";
  let txt=`Move ${mv}: this was ${GR[cls]||"a key moment"}.`; try{ if(pl.expl&&window.plainChess){ let e=String(plainChess(pl.expl)).trim(); const g=[(GR[cls]||"").replace(/^an? /,""),{blunder:"blunder",miss:"miss(ed)?",mistake:"mistake",inaccuracy:"inaccuracy"}[cls]].filter(Boolean).join("|"); /* drop the grade word when the coach line repeats it */ for(let k=0;k<3&&g;k++){ const e2=e.replace(new RegExp("^(an? )?("+g+")( chance)?[.!:,]?\\s*","i"),""); if(e2===e) break; e=e2; } if(e) txt+=" "+e.charAt(0).toUpperCase()+e.slice(1); } }catch(e){}
  txt+=" Look at the board, then try to spot the better idea before you go on.";
  let c=$("cr66w"); if(!c){ document.body.insertAdjacentHTML("beforeend",`<div id="cr66w" role="region" aria-label="Key moments"><div class="h"><b id="cr66wh"></b><button type="button" class="btn" id="cr66wx" aria-label="Close">✕</button></div><p id="cr66wp"></p><div class="r"><button type="button" class="btn" id="cr66wb">‹ Back</button><button type="button" class="btn primary" id="cr66wn">Next ›</button></div></div>`);
    $("cr66wx").onclick=()=>stop(); $("cr66wb").onclick=()=>walk(W.i-1); $("cr66wn").onclick=()=>walk(W.i+1); }
  B.classList.add("cr66walking"); $("cr66wh").textContent=`Key moment ${i+1} of ${L.length}`; $("cr66wp").textContent=txt;
  $("cr66wb").disabled=i===0; $("cr66wn").textContent=i===L.length-1?"Done ✓":"Next ›"; }
function stop(){ const c=$("cr66w"); if(c) c.remove(); B.classList.remove("cr66walking"); W=null; } /* v70: closing the card keeps you where you are */
function decorate(){ const s=$("rv59sum"); if(!s||!s.firstElementChild||s.dataset.cr66===s.firstElementChild.textContent+s.childElementCount) return;
  const ol=s.querySelector("ol.rv59top");
  if(ol&&!$("cr66walk")){ ol.querySelectorAll("li").forEach(li=>{ const b=li.querySelector(".rv59show"), l=li.querySelector(".rv59l"); if(b&&l){ const ply=+b.dataset.ply, pl=(P||[])[ply-1]||{}; l.textContent=`Move ${Math.ceil(ply/2)} · ${GR[pl.cls]||"key moment"}`; } });
    ol.insertAdjacentHTML("beforebegin",`<button type="button" class="btn primary" id="cr66walk">▶ Walk me through it</button>`);
    $("cr66walk").onclick=()=>{ W=[...ol.querySelectorAll(".rv59show")].map(b=>+b.dataset.ply); if(W.length) walk(0); }; }
  const gs=$("gt65s"); let anchor=ol||s.querySelector(".rv59acc"); if(gs&&anchor&&anchor.nextElementSibling!==gs) anchor.after(gs);
  let more=s.querySelector(".cr66more"); const work=s.querySelector(".rv59work");
  if(work){ if(!more){ more=document.createElement("details"); more.className="cr66more"; more.innerHTML="<summary>More from this game: practise and lessons</summary>";
      const h=work.previousElementSibling; let n=(h&&h.tagName==="H3")?h:work; const it=[]; while(n){ it.push(n); n=n.nextElementSibling; } it.forEach(e=>{ if(e!==gs) more.appendChild(e); }); s.appendChild(more); }
    [...s.children].filter(e=>e.parentNode===s&&more.compareDocumentPosition(e)&4).forEach(e=>more.appendChild(e));
    const ln=$("ln60go"); if(ln){ let top=ln; while(top.parentNode&&top.parentNode!==more&&top.parentNode!==s) top=top.parentNode; if(top.parentNode===more) s.insertBefore(top,more); } }
  s.dataset.cr66=s.firstElementChild.textContent+s.childElementCount; }
// close the chooser once a game loads, so the result comes first
const hook=()=>{ if(typeof window.loadData!=="function"||window.loadData.__cr66) return; const _l=window.loadData; const f=function(){ const r=_l.apply(this,arguments); try{ const p=$("paste"); if(p) p.classList.remove("open","gopen"); stopQuiet(); }catch(e){} return r; }; f.__cr66=1; window.loadData=f; try{ loadData=f; }catch(e){} };
function stopQuiet(){ const c=$("cr66w"); if(c) c.remove(); B.classList.remove("cr66walking"); W=null; }
window.CRRev66={tab,openNew,walk,stop,tick};
setInterval(()=>{ hook(); tick(); },300); document.addEventListener("DOMContentLoaded",()=>{ hook(); tick(); });
})();
