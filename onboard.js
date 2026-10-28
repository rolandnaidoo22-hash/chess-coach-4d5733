/* v55: first-launch onboarding (usernames -> level -> rating goal), one saved rating goal, and greyed tiles that need a username or goal. Own file; no servers. */
(function(){ "use strict"; if(window.CROnb) return;
const $=id=>document.getElementById(id), GK="chessReview.wish.goal.v1", DONE="chessReview.v55.onb", AFTER="crOnb55assess";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LG=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, LSet=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
/* ---------- one rating goal for every screen ---------- */
const CRGoal={ get(){ let v=0; try{ v=+JSON.parse(LG(GK)); }catch(e){} return v>=100&&v<=3300?Math.round(v):0; },
  set(n){ n=Math.round(+n); if(!(n>=100&&n<=3300)) return false; LSet(GK,JSON.stringify(n));
    try{ if(window.CRWish&&CRWish.goal) CRWish.goal.sync(); else window.dispatchEvent(new CustomEvent("crgoal",{detail:n})); }catch(e){} grey(); return true; } };
window.CRGoal=CRGoal;
const name=()=>{ const u=(window.CRUser&&CRUser.info())||{}; return u.cc||u.li||""; };
/* ---------- the onboarding sheet ---------- */
const CSS=`#onb55{position:fixed;inset:0;z-index:10001;background:rgba(38,36,33,.94);overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:18px 10px}
#onb55 .c{background:var(--card,#fff);color:var(--ink,#222);width:100%;max-width:520px;border-radius:16px;padding:18px 16px;box-sizing:border-box;font-size:15.5px;line-height:1.45}
#onb55 h2{margin:0 0 4px;font-size:22px}#onb55 .st{font-size:12.5px;color:#667;margin-bottom:6px}#onb55 .dots{display:flex;gap:6px;margin:0 0 10px}#onb55 .dots i{flex:1;height:5px;border-radius:3px;background:#ddd}#onb55 .dots i.on{background:#2f7d32}
#onb55 .b{display:block;width:100%;min-height:50px;border-radius:12px;border:1px solid #ccc;background:#fff;color:#222;font:inherit;font-weight:700;margin-top:8px;cursor:pointer}#onb55 .b.pri{background:#2f7d32;border-color:#2f7d32;color:#fff}
#onb55 .chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}#onb55 .chips button{min-height:44px;min-width:64px;border-radius:22px;border:1px solid #3b6fb6;background:#f2f6fd;color:#1d3f73;font-weight:800;font-size:16px;cursor:pointer}#onb55 .chips button.on{background:#3b6fb6;color:#fff}
#onb55 input.g{display:block;width:100%;box-sizing:border-box;min-height:48px;font-size:18px;border-radius:10px;border:1px solid #aab;padding:0 12px}#onb55 .err{color:#c62828;font-size:13.5px;min-height:18px;margin-top:4px}
#onb55 .acSave{display:block;width:100%;min-height:50px;font-size:16px}
html.dark-mode #onb55 .c{background:#262626;color:#eee}html.dark-mode #onb55 .b:not(.pri){background:#333;color:#eee;border-color:#555}
.hsG button.lk55{filter:grayscale(1);opacity:.62;position:relative;background:#f0f0f0!important}.hsG button.lk55.wide{background:#9aa!important}
.hsG button.lk55::after{content:"🔒";position:absolute;top:8px;right:10px;font-size:15px;filter:none}.hsG button.lk55 small{color:#444!important;font-weight:700}
#lk55s{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}#lk55s .c{background:var(--card,#fff);color:inherit;width:100%;max-width:520px;border-radius:16px 16px 0 0;padding:16px;box-sizing:border-box}
#lk55s .b{display:block;width:100%;min-height:50px;border-radius:12px;border:1px solid #ccc;background:#fff;font:inherit;font-weight:700;margin-top:8px;cursor:pointer}#lk55s .b.pri{background:#2f7d32;color:#fff;border-color:#2f7d32}
#home>#gl55{display:none}html body.hs-set #home#home>#gl55#gl55{display:block!important}
html body.hs-set #home#home{display:flex!important;flex-direction:column;padding-bottom:96px}html body.hs-set #home#home>*{margin:0 0 10px!important;box-sizing:border-box}body.hs-set #home>.ub16{order:1}body.hs-set #home>#gl55{order:2}body.hs-set #home>#acSetWrap{order:3}body.hs-set #home>.set3d{order:4}body.hs-set #home>#v46set{order:5}body.hs-set #home>.nfa40{order:9}
#gl55{background:#fff;border:1px solid var(--line,#ddd);border-radius:12px;padding:12px;margin:0 0 8px;box-sizing:border-box}.gl55r{display:flex;align-items:center;gap:10px}.gl55r>div{flex:1;min-width:0}.gl55r b{display:block;font-size:17px}.gl55r small{display:block;color:var(--mute,#666);font-size:13px;line-height:1.35;margin-top:2px}.gl55n{font-size:28px;font-weight:800;color:#3b6fb6;min-width:56px;text-align:right}
html.dark-mode #gl55{background:#262626;color:#eee;border-color:#3a3a3a}
.ub16{flex-wrap:wrap;padding:10px 12px!important}.ub16>span{flex:1 1 0!important;min-width:0;overflow-wrap:anywhere;line-height:1.35}.ub16 .btn{flex:none;min-width:88px}
.bs21r{grid-template-columns:1fr 1fr!important}.bs21r>*{min-width:0}
.ed55{display:block;width:100%;min-height:46px;margin-top:8px;border-radius:10px;border:1px solid #3b6fb6;background:#f2f6fd;color:#1d3f73;font:inherit;font-weight:700;cursor:pointer}`;
function css(){ if($("onb55css")) return; const s=document.createElement("style"); s.id="onb55css"; s.textContent=CSS; document.head.appendChild(s); }
let SH=null;
function sheet(steps,i,opts){ css(); if(!SH){ SH=document.createElement("div"); SH.id="onb55"; document.body.appendChild(SH); }
  const st=steps[i]; if(!st){ finish(opts); return; }
  const dots=steps.length>1?`<div class="dots">${steps.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div><div class="st">Step ${i+1} of ${steps.length}</div>`:"";
  const next=()=>sheet(steps,i+1,opts);
  if(st==="acct"){
    SH.innerHTML=`<div class="c">${dots}<h2>👋 Welcome to The Ultimate Chess App</h2><p style="margin:0 0 6px">Reviews your games, finds your mistakes and turns them into practice. Everything stays on this phone.</p>
      ${window.CRAcct?CRAcct.form("onbAcct","Who are you online?"):""}
      ${opts.fresh?`<button class="b" id="onbSample">See a sample review</button>`:""}<button class="b" id="onbSkip">Skip – I'll add it later</button>
      ${opts.fresh&&window.CRUser&&CRUser.users().length?`<button class="b" id="onbPick">👤 Pick a player already on this phone</button>`:""}</div>`;
    if(window.CRAcct) CRAcct.wire(SH,()=>{ opts.named=true; setTimeout(next,350); });
    $("onbSkip").onclick=()=>{ if(window.CRUser&&!CRUser.id()) CRUser.set("",""); next(); };
    const sm=$("onbSample"); if(sm) sm.onclick=()=>{ close(); if(window.CRUser&&!CRUser.id()) CRUser.set("",""); document.body.classList.remove("nogame"); const ng=$("ng16"); if(ng) ng.remove(); window.__crWantReview=true; try{ loadData(window.EXAMPLE_DATA); }catch(e){ console.error(e); } };
    const pk=$("onbPick"); if(pk) pk.onclick=()=>{ close(); window.R16&&R16.welcome(); };
  } else if(st==="level"){
    SH.innerHTML=`<div class="c">${dots}<h2>🎯 What's your chess level?</h2><p>A 10-minute test: 7 quick questions and 10 puzzles. You get your level, an estimated rating and a 4-week plan.</p>
      <button class="b pri" id="onbLvY">Yes, test me after setup ▶</button><button class="b" id="onbLvN">Skip for now</button><p style="font-size:13px;color:#667;margin:8px 0 0">You can take it any time from the 🎯 Find my level tile.</p></div>`;
    $("onbLvY").onclick=()=>{ opts.assess=true; next(); }; $("onbLvN").onclick=next;
  } else if(st==="goal"){
    const cur=CRGoal.get(); let pick=cur||0;
    SH.innerHTML=`<div class="c">${dots}<h2>🏁 Your rating goal</h2><p>Pick the rating you want to reach. Your coach, plans and progress all use this number.</p>
      <div class="chips">${[400,500,600,800,1000,1200,1500].map(n=>`<button type="button" data-g="${n}" class="${n===cur?"on":""}">${n}</button>`).join("")}</div>
      <label style="font-size:14px">Or type your own<input class="g" id="onbG" inputmode="numeric" placeholder="e.g. 500" value="${cur||""}" aria-label="Rating goal"></label><div class="err" id="onbGe"></div>
      <button class="b pri" id="onbGo">Save my goal ✓</button><button class="b" id="onbGs">Skip – set it later</button></div>`;
    const inp=$("onbG");
    SH.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ SH.querySelectorAll("[data-g]").forEach(x=>x.classList.toggle("on",x===b)); inp.value=b.dataset.g; });
    $("onbGo").onclick=()=>{ const n=+String(inp.value).replace(/\D/g,""); if(!(n>=100&&n<=3300)){ $("onbGe").textContent="Type a rating between 100 and 3300."; return; } CRGoal.set(n); next(); };
    $("onbGs").onclick=next; }
  const c=SH.querySelector(".c"); if(c){ const x=document.createElement("button"); x.type="button"; x.id="welSkip"; x.className="b"; x.style.cssText="border:none;background:none;font-weight:600;color:#667;min-height:40px"; x.textContent=steps.length>1?"Skip setup":"Close";
    x.onclick=()=>{ if(window.CRUser&&!CRUser.id()) CRUser.set("",""); finish({fresh:false,named:opts.named}); }; c.appendChild(x); }
  window.scrollTo(0,0); }
function close(){ if(SH){ SH.remove(); SH=null; } }
function finish(o){ close(); LSet(DONE,"1"); if(o.assess) LSet(AFTER,"1");
  if(o.named){ location.reload(); return; }
  if(o.assess){ try{ localStorage.removeItem(AFTER); }catch(e){} setTimeout(()=>window.CRAssess&&CRAssess.start(),200); return; }
  try{ if(!(window.ReviewApp&&ReviewApp.loadGames().length)) document.body.classList.add("nogame"); }catch(e){} try{ window.CRHome&&CRHome.goHome(); }catch(e){} grey(); }
let started=false;
function start(){ if(started||$("onb55")) return; started=true; sheet(["acct","level","goal"],0,{fresh:true}); }
/* returning players: show only the missing steps, once */
function check(){ if(started||!window.CRUser||!CRUser.id()) return; if(LG(DONE)) return;
  const nn=!name(), ng=!CRGoal.get(); if(!nn&&!ng){ LSet(DONE,"1"); return; }
  let assessed=false; try{ assessed=JSON.parse(LG("chessReview.v45.assess")||"[]").length>0; }catch(e){}
  const steps=[]; if(nn) steps.push("acct"); if(nn&&ng&&!assessed) steps.push("level"); if(ng) steps.push("goal");
  LSet(DONE,"1"); started=true; sheet(steps,0,{fresh:false}); }
/* ---------- greying ---------- */
const NEED_NAME={games:"My games",trap:"Trap Radar",puzzles:"Mistake puzzles",v46mo:"My Openings",v42ch:"My charts",ultimo52:"Ultimo"};
function lockSheet(b,label){ css(); const o=$("lk55s"); if(o) o.remove(); const d=document.createElement("div"); d.id="lk55s";
  d.innerHTML=`<div class="c"><h3 style="margin:0 0 6px">🔒 ${E(label)} uses your own games</h3><p style="margin:0">Add your Chess.com or Lichess username and this fills in with your real games.</p>
   <button class="b pri" id="lk55a">Add your username</button><button class="b" id="lk55v">See the sample instead</button><button class="b" id="lk55x">Not now</button></div>`;
  document.body.appendChild(d); d.onclick=e=>{ if(e.target===d) d.remove(); };
  $("lk55a").onclick=()=>{ d.remove(); window.CRAcct&&CRAcct.ask(()=>{ grey(); window.CRHome&&CRHome.goHome(); }); };
  $("lk55v").onclick=()=>{ d.remove(); b.__lkPass=1; b.click(); b.__lkPass=0; }; $("lk55x").onclick=()=>d.remove(); }
let painting=false;
function grey(){ const g=$("hsG"); if(!g||painting) return; painting=true; try{ css(); const nn=!name(), gl=CRGoal.get();
  g.querySelectorAll("button[data-hs]").forEach(b=>{ const id=b.dataset.hs, sm=b.querySelector("small");
    if(id in NEED_NAME){ b.classList.toggle("lk55",nn); b.dataset.lk=nn?"name":""; if(sm){ if(nn){ if(!b.dataset.sub0) b.dataset.sub0=sm.textContent; sm.textContent="Add your username"; } else if(b.dataset.sub0){ sm.textContent=b.dataset.sub0; delete b.dataset.sub0; } } }
    if(id==="goal"){ b.classList.toggle("lk55",!gl); if(sm) sm.textContent=gl?`Your goal: ${gl}`:"Set a goal"; } });
  const hm=$("home"); if(hm){ let c=$("gl55"); if(!c){ c=document.createElement("div"); c.id="gl55"; c.className="card gl55"; hm.insertBefore(c,hm.firstChild); }
    const h=`<div class="gl55r"><div><b>🎯 Rating goal</b><small>${gl?"Your coach, plans and progress all use this.":"Not set yet. Pick a rating to aim for."}</small></div>${gl?`<span class="gl55n">${gl}</span>`:""}</div><button type="button" class="ed55" id="ed55">${gl?"Change rating goal":"Set a rating goal"}</button>`;
    if(c.dataset.h!==h){ c.dataset.h=h; c.innerHTML=h; } $("ed55").onclick=()=>{ started=false; sheet(["goal"],0,{fresh:false}); }; }
  } finally{ painting=false; } }
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("#hsG button.lk55[data-lk='name']"); if(!b||b.__lkPass) return; e.stopImmediatePropagation(); e.preventDefault(); lockSheet(b,NEED_NAME[b.dataset.hs]||"This"); },true);
function boot(){ css(); grey(); const g=$("hsG"); if(g) new MutationObserver(()=>grey()).observe(g,{childList:true});
  else { const mo=new MutationObserver(()=>{ const h=$("hsG"); if(h){ mo.disconnect(); new MutationObserver(()=>grey()).observe(h,{childList:true}); grey(); } }); mo.observe(document.body,{childList:true,subtree:true}); }
  window.addEventListener("crgoal",()=>setTimeout(grey,0)); document.addEventListener("cr-accounts",()=>setTimeout(grey,0));
  if(window.__crOnbWant&&!(window.CRUser&&CRUser.id())){ const w=$("wel16"); if(w) w.remove(); start(); }
  else if(LG(AFTER)){ try{ localStorage.removeItem(AFTER); }catch(e){} setTimeout(()=>window.CRAssess&&CRAssess.start(),1200); }
  else setTimeout(check,1700); }
window.CROnb={start,check,grey,sheet:(s)=>{ started=false; sheet(s,0,{fresh:false}); }};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
