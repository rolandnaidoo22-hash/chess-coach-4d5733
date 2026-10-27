/* v39: a real home screen ("The Ultimate Chess App"). Own file; it only shows/hides existing parts and calls their open functions.
   v53: sections (Review, Play, Train, Progress). Every feature is in the first paint, so later scripts don't insert tiles after Skip. */
(function(){
"use strict"; if(window.CRHome) return;
const $=id=>document.getElementById(id), B=document.body;
const CSS=`.hsLogo{width:1.25em;height:1.25em;border-radius:22%;vertical-align:-0.22em;margin-right:.1em}

body.hs-on #hs{display:block}#hs{display:none}
body.hs-home .wrap>*:not(#hs),body.hs-home #homeBtn{display:none!important}
body.hs-on:not(.hs-home) #hs .hsT{display:none}
body.hs-on:not(.hs-home) #hs .hsP{display:block}#hs .hsP{display:none}
body.hs-on:not(.hs-review) header,body.hs-on:not(.hs-review) #summary,body.hs-on:not(.hs-review) section.main,body.hs-on:not(.hs-review) #footer,body.hs-on:not(.hs-review) #paste,body.hs-on:not(.hs-review) #ng16{display:none!important}
body.hs-review:not(.hs-game) header,body.hs-review:not(.hs-game) #summary,body.hs-review:not(.hs-game) section.main,body.hs-review:not(.hs-game) #footer{display:none!important}
body.hs-on:not(.hs-goal):not(.hs-set) #home{display:none!important}
body.hs-goal #home>*:not(.wgoal),body.hs-set #home>*:not(.ub16):not(.set3d):not(.nfa40){display:none!important}
body:not(.hs-set) #home>.nfa40{display:none!important}
#home>.nfa40{font-size:12px;color:var(--mute);margin:12px 2px;line-height:1.4}
body.hs-app #hs .hsP{display:none!important}
#hs{padding:4px 0 70px}#hs h1{font-size:26px;margin:6px 0 2px;display:flex;align-items:center;gap:8px}#hs h1 small{font-size:12px;background:#262421;color:#fff;border-radius:6px;padding:2px 7px;font-weight:700}
#hs .hsSub{color:var(--mute);margin:0 0 12px;font-size:14px}
.hsG{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hsSec{grid-column:1/-1;margin:16px 2px 0;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:800}
.hsG .hsSec:first-child{margin-top:2px}
.hsG button{min-height:108px;border-radius:16px;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;text-align:left;padding:12px;display:flex;flex-direction:column;gap:3px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.hsG button .i{font-size:30px;line-height:1.1}.hsG button b{font-size:16.5px}.hsG button small{color:var(--mute);font-size:12.5px;line-height:1.3}
.hsG button.wide{grid-column:1/-1;min-height:84px;flex-direction:row;align-items:center;gap:12px;background:linear-gradient(135deg,#2f7d32,#3b6fb6);color:#fff;border:none}.hsG button.wide small{color:#e8f0ff}.hsG button.wide .i{font-size:38px}
.hsP .hsPh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 8px}.hsP h2{margin:0;font-size:20px}.hsP button{min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;font:inherit;font-weight:700;padding:0 14px;cursor:pointer}
html.dark-mode .hsG button:not(.wide),html.dark-mode .hsP button{background:#262626;color:#eee;border-color:#3a3a3a}`;
const MODES=["home","review","goal","set","app"]; let mode=null, chosen=false;
const TITLES={review:"📋 Review a game",goal:"🎯 Rating goal",set:"⚙ Settings"};
function T(){ return window.Trainer; }
function closeAll(){ try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.CR52&&CR52.closeAll(); }catch(e){} try{ T()&&T().close(); }catch(e){} try{ window.PatternsUI&&PatternsUI.close(); }catch(e){} try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){} const p=$("paste"); if(p) p.classList.remove("open","gopen"); }
function openReviewForm(){ const p=$("paste"); if(p&&(B.classList.contains("nogame")||!chosen)) p.classList.add("open"); }
function setMode(m,push){ if(!MODES.includes(m)) m="home"; mode=m; B.classList.add("hs-on"); MODES.forEach(x=>B.classList.toggle("hs-"+x,x===m)); B.classList.toggle("hs-game",chosen&&!B.classList.contains("nogame"));
  const h=$("hsPt"); if(h) h.textContent=TITLES[m]||""; if(m==="home"){ paint(); window.scrollTo(0,0); }
  if(m==="review") openReviewForm();
  if(push&&m!=="home"){ try{ history.pushState({hs:m},""); }catch(e){} } }
function coachSub(){ const c=$("co17go"); const t=c&&c.innerText.split("\n").map(x=>x.trim()).filter(Boolean); return t&&t[1]?t[1]:"Today's 30-minute plan"; }
function goalSub(){ try{ const g=+JSON.parse(localStorage.getItem("chessReview.wish.goal.v1")); return g?`Your goal: ${g}`:"Set a rating to aim for"; }catch(e){ return "Set a rating to aim for"; } }
function levelSub(){ try{ const H=JSON.parse(localStorage.getItem("chessReview.v45.assess")||"[]"); const h=H[H.length-1]; return h?`${h.level} · ${h.lo}–${h.hi}`:"Skill test + 4-week plan"; }catch(e){ return "Skill test + 4-week plan"; } }
function podSub(){ try{ const lp=JSON.parse(localStorage.getItem("chessReview.lpz.v1")||"{}"); const seen=lp.seen||{}; const n=Object.keys(seen).length; return n?"Come back each day":"One new puzzle every day"; }catch(e){ return "One new puzzle every day"; } }
/* One entry each. Markers (data-v42t / data-v45t / data-v46t) stop the later scripts from inserting the same tile again. */
const TILES=[
 ["coach","🧑‍🏫","My Coach",coachSub,()=>{ setMode("app",true); Coach17.open("home"); },"wide"],
 ["review","📋","Review a game",()=>"Pick a game and see each mistake",()=>{ closeAll(); setMode("review",true); openReviewForm(); }],
 ["games","📚","My games",()=>"Games you already reviewed",()=>{ closeAll(); setMode("review",true); $("paste").classList.add("gopen"); try{ ReviewApp.renderGames(); }catch(e){} }],
 ["trap","🪤","Trap Radar",()=>"Opening traps you fall for",()=>{ setMode("app",true); window.TrapRadar&&TrapRadar.open(); },"",{"data-hs-only":"trap"}],
 ["study52","🔍","Study your opponent",()=>"Report from public games",()=>{ setMode("app",true); window.CRStudy&&CRStudy.open(); }],
 ["bots52","🤖","Play the bots",()=>window.CRUltimate&&CRUltimate.inviteDue()?"📬 1 new message":"Pick a bot, from easy to strong",()=>{ setMode("app",true); window.CRBots&&CRBots.open(); }],
 ["play","🤝","Play a friend",()=>"Or the computer",()=>{ setMode("app",true); T().open("sec","play"); }],
 ["puzzles","🧩","Puzzles",()=>"From your own mistakes",()=>{ setMode("app",true); T().open("sec","puzzles"); }],
 ["v42pod","📅","Puzzle of the day",podSub,()=>{ setMode("app",true); window.V42&&V42.openPuzzles(); },"",{"data-v42t":"v42pod"}],
 ["drills","⚡","Quick drills",()=>"Stop blunders, fast",()=>{ setMode("app",true); T().open("sec","drills"); }],
 ["lessons","🎓","Lessons",()=>"Checkmates, basics, thinking",()=>{ setMode("app",true); T().open("sec","lessons"); }],
 ["learn","📘","Learn the basics",()=>window.CRLearn?CRLearn.progressText():"Pieces, moves and rules",()=>{ closeAll(); setMode("app",true); window.CRLearn&&CRLearn.open(); }],
 ["open52","♞","Learn openings",()=>"Step by step, then drill",()=>{ setMode("app",true); window.CROpenings&&CROpenings.open(); }],
 ["read52","📖","Read",()=>"Illustrated guides",()=>{ setMode("app",true); window.CRRead&&CRRead.open(); }],
 ["board","♟","Board training",()=>"Squares and your real board",()=>{ setMode("app",true); T().open("sec","boardtrain"); }],
 ["v45","🎯","Find my level",levelSub,()=>{ setMode("app",true); window.CRAssess&&CRAssess.open(); },"",{"data-v45t":"1"}],
 ["v46mo","📖","My Openings",()=>"Which openings win you games",()=>{ setMode("app",true); window.CROpen&&CROpen.open(false); },"",{"data-v46t":"1"}],
 ["v42ch","📊","My charts",()=>"Rating and accuracy",()=>{ setMode("app",true); window.V42&&V42.openCharts(); },"",{"data-v42t":"v42ch"}],
 ["progress","📈","My progress",()=>"Patterns, openings, streak",()=>{ setMode("app",true); T().open("sec","progress"); }],
 ["v42xp","🏅","Level & badges",()=>"XP, badges, board colours",()=>{ setMode("app",true); window.V42&&V42.openXP(); },"",{"data-v42t":"v42xp"}],
 ["goal","🎯","Rating goal",goalSub,()=>{ closeAll(); setMode("goal",true); }],
 ["set","⚙","Settings",()=>"Username, board style",()=>{ closeAll(); setMode("set",true); }]];
/* Most-used coaching actions first, then play, train, and progress. */
const ORDER=[
 ["Review",["coach","review","games","trap","study52"]],
 ["Play",["bots52","play"]],
 ["Train",["puzzles","v42pod","drills","lessons","learn","open52","read52","board"]],
 ["Progress",["v45","v46mo","v42ch","progress","v42xp","goal","set"]]];
function paint(){ const g=$("hsG"); if(!g) return; const by=Object.fromEntries(TILES.map(t=>[t[0],t])); g.textContent="";
  ORDER.forEach(([title,ids])=>{ const h=document.createElement("h3"); h.className="hsSec"; h.textContent=title; g.appendChild(h);
    ids.forEach(id=>{ const t=by[id]; if(!t) return; const [ ,i,name,sub,,c,attrs]=t; const b=document.createElement("button"); b.type="button"; b.dataset.hs=id; if(c) b.className=c;
      if(attrs) Object.keys(attrs).forEach(k=>b.setAttribute(k,attrs[k]));
      b.innerHTML=`<span class="i">${i}</span><span><b>${name}</b><br><small></small></span>`; b.querySelector("small").textContent=sub();
      b.onclick=()=>{ try{ t[4](); }catch(e){ console.error(e); } }; g.appendChild(b); }); }); }
function build(){ const w=document.querySelector(".wrap"); if(!w||$("hs")) return; const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  const d=document.createElement("div"); d.id="hs";
  d.innerHTML=`<div class="hsT"><h1><img src="icon-192.png" alt="" class="hsLogo"> The Ultimate Chess App</h1><p class="hsSub">Get better at chess with your own games.</p><div class="hsG" id="hsG"></div></div>
   <div class="hsP"><div class="hsPh"><h2 id="hsPt"></h2><button type="button" id="hsBack">‹ Home</button></div></div>`;
  w.insertBefore(d,w.firstChild); $("hsBack").onclick=()=>goHome(); }
function goHome(){ closeAll(); setMode("home"); try{ if(history.state&&history.state.hs) history.replaceState(null,""); }catch(e){} }
// a game chosen -> review mode
function hookLoad(){ const ld=window.loadData; if(typeof ld!=="function"||ld.__hs) return; const w=function(){ chosen=true; const r=ld.apply(this,arguments); if(mode&&mode!=="review"){ closeAll(); setMode("review",true); } else setMode("review"); try{ document.querySelector("header").scrollIntoView(); }catch(e){} return r; }; w.__hs=1; window.loadData=w; try{ loadData=w; }catch(e){} }
// something else opened (friend link, deep links, coach/trainer pages) -> leave home
function watch(){ const mo=new MutationObserver(()=>{ if(mode!=="home"&&mode!=="goal"&&mode!=="set") return; const on=["tr","co17","pat"].some(id=>{ const e=$(id); return e&&e.classList.contains("on"); }); if(on) setMode("app"); });
  ["tr","pat"].forEach(id=>{ const e=$(id); if(e) mo.observe(e,{attributes:true,attributeFilter:["class"]}); });
  const mo2=new MutationObserver(()=>{ const c=$("co17"); if(c&&!c.__hs){ c.__hs=1; mo.observe(c,{attributes:true,attributeFilter:["class"]}); } }); mo2.observe(document.body,{childList:true,subtree:true}); }
document.addEventListener("click",e=>{ const t=e.target.closest&&e.target.closest('#homeBtn,#trHome,[data-co="exit"]'); if(t) setTimeout(goHome,0); },true);
window.addEventListener("popstate",()=>{ const s=history.state; if(s&&s.hs&&s.hs!=="app") setMode(s.hs); else goHome(); });
function nfa(){ const h=$("home"); if(!h||h.querySelector(".nfa40")) return; const d=document.createElement("p"); d.className="nfa40"; d.textContent="Not affiliated with or endorsed by Chess.com or Lichess. For reviewing finished games only — don't use during live games."; h.appendChild(d); }
function boot(){ build(); nfa(); hookLoad(); watch(); const deep=/ply=|try=|punish=/.test(location.hash); if(deep||window.__crWantReview){ chosen=true; setMode("review"); } else { try{ if(!B.classList.contains("nogame")&&window.ReviewApp&&ReviewApp.loadGames().length) chosen=true; }catch(e){} setMode("home"); }
  setTimeout(paint,1500); document.documentElement.classList.remove("hsboot"); window.addEventListener("crgoal",paint); }
try{ const v=document.getElementById("verV"); if(v&&typeof VERSION!=="undefined") v.textContent=VERSION; }catch(e){}
window.CRHome={setMode,goHome,mode:()=>mode,paint};
try{ boot(); }catch(e){ console.error(e); }
})();
