/* v39: a real home screen ("The Ultimate Chess App"). Own file; it only shows/hides existing parts and calls their open functions.
   v53: sections (Review, Play, Train, Progress). Every feature is in the first paint, so later scripts don't insert tiles after Skip.
   Option C: a short home (greeting, coach note, one task, two chips, More) plus a searchable More list of every feature. */
(function(){
"use strict"; if(window.CRHome) return;
const $=id=>document.getElementById(id), B=document.body;
const CSS=`
.hsLogo{width:1.25em;height:1.25em;border-radius:22%;vertical-align:-0.22em;margin-right:.1em}
body.hs-on #hs{display:block}#hs{display:none}
body.hs-home .wrap>*:not(#hs),body.hs-home #homeBtn,body.hs-more .wrap>*:not(#hs),body.hs-more #homeBtn,body.hs-plan .wrap>*:not(#hs),body.hs-plan #homeBtn,body.hs-home #verLbl,body.hs-more #verLbl,body.hs-plan #verLbl{display:none!important}
body.hs-on:not(.hs-home) #hs .hsT{display:none}
body.hs-on:not(.hs-home) #hs .hsP{display:block}#hs .hsP{display:none}
body.hs-more #hs .hsP,body.hs-plan #hs .hsP{display:none!important}
body.hs-more #hs .hsMore,body.hs-plan #hs .hsPlan{display:block}
#hs .hsMore,#hs .hsPlan{display:none}
body.hs-on:not(.hs-review) header,body.hs-on:not(.hs-review) #summary,body.hs-on:not(.hs-review) section.main,body.hs-on:not(.hs-review) #footer,body.hs-on:not(.hs-review) #paste,body.hs-on:not(.hs-review) #ng16{display:none!important}
body.hs-review:not(.hs-game) header,body.hs-review:not(.hs-game) #summary,body.hs-review:not(.hs-game) section.main,body.hs-review:not(.hs-game) #footer{display:none!important}
body.hs-on:not(.hs-goal):not(.hs-set) #home{display:none!important}
body.hs-goal #home>*:not(.wgoal),body.hs-set #home>*:not(.ub16):not(.set3d):not(.nfa40){display:none!important}
body:not(.hs-set) #home>.nfa40{display:none!important}
#home>.nfa40{font-size:12px;color:var(--mute);margin:12px 2px;line-height:1.4}
body.hs-app #hs .hsP{display:none!important}
#hs{padding:4px 0 16px}#hs h1{font-size:22px;margin:6px 0 2px;display:flex;align-items:center;gap:8px;letter-spacing:-.02em}#hs h1 small{font-size:12px;background:#262421;color:#fff;border-radius:6px;padding:2px 7px;font-weight:700}
#hs .hsSub{color:var(--mute);margin:0 0 12px;font-size:14px}
.hsT{min-height:calc(100dvh - 36px);display:flex;flex-direction:column}
.hsG{display:flex;flex-direction:column;flex:1}
.hsHi{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:10px 0 0}
.hsLede{color:var(--mute);margin:2px 0 14px;font-size:14px}
.hsCard{background:#fff;border:1px solid var(--line,#e4dfd5);border-radius:16px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.05);margin:0 0 12px}
.hsCoach .who{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.hsAv{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2f7d32,#3b6fb6);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}
.hsCoach .who b{display:block;font-size:15px}
.hsCoach .who small{color:var(--mute);font-size:12.5px}
.hsCoach p{margin:0;font-size:16px;line-height:1.4;letter-spacing:-.01em}
.hsKicker{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:800;color:var(--mute);margin:0 0 4px}
.hsTask b{display:block;font-size:20px;letter-spacing:-.02em}
.hsTask small{display:block;margin:4px 0 0;color:var(--mute);font-size:13.5px}
.hsStart{margin-top:12px;width:100%;min-height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#2f7d32,#3b6fb6);color:#fff;font:inherit;font-weight:800;font-size:16px;box-shadow:0 4px 12px rgba(47,125,50,.22);cursor:pointer}
.hsAlts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 8px}
.hsAlt{min-height:52px;border-radius:14px;border:1px solid var(--line,#e4dfd5);background:#fff;padding:8px 10px;display:flex;align-items:center;gap:8px;font:inherit;color:var(--ink,#262421);box-shadow:0 1px 2px rgba(0,0,0,.04);cursor:pointer;text-align:left}
.hsAlt .i{font-size:20px}
.hsAlt b{font-size:13.5px;font-weight:750;line-height:1.2}
.hsLink{display:block;text-align:center;color:#3b6fb6;font-weight:750;font-size:14.5px;text-decoration:none;padding:8px 0 4px;background:none;border:none;box-shadow:none;min-height:0;font:inherit;cursor:pointer;width:100%}
.hsMoreBtn{margin:8px 0 0;width:100%;min-height:52px;border-radius:16px;border:1px solid var(--line,#e4dfd5);background:#fff;font:inherit;font-weight:800;font-size:16px;color:var(--ink,#262421);display:flex;flex-direction:row;align-items:center;justify-content:space-between;padding:0 16px;box-shadow:0 1px 3px rgba(0,0,0,.05);cursor:pointer}
.hsMoreBtn span{color:var(--mute);font-weight:600;font-size:13px}
.hsGrow{flex:1 1 12px;min-height:12px}
#hsMarks{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.mood64{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 10px;border:none;background:transparent;padding:8px 4px;margin:4px 0 0;font-size:13px;color:var(--mute);min-height:48px;box-sizing:border-box}
.mood64.warm{background:#f3f7ee;border-radius:12px;border:1px solid #cfe0bf;color:var(--ink,#262421)}
.mood64 a{font-weight:700;color:#3b6fb6;min-height:32px;display:inline-flex;align-items:center}
.mood64 #mood64c{flex-basis:100%}
html.dark-mode .mood64{background:transparent;color:#bbb}
html.dark-mode .mood64.warm{background:#262626;color:#eee}
html.dark-mode .hsCard,html.dark-mode .hsAlt,html.dark-mode .hsMoreBtn,html.dark-mode .hsP button,html.dark-mode .hsFind,html.dark-mode .hsItem,html.dark-mode .hsBack{background:#262626;color:#eee;border-color:#3a3a3a}
/* More + plan */
.hsPh{display:flex;align-items:center;gap:8px;margin:4px 0 12px;min-height:44px}
.hsP .hsPh{justify-content:space-between}
.hsP h2,.hsPh h2{margin:0;font-size:20px;letter-spacing:-.02em;flex:1}
.hsBack,.hsP button{min-width:44px;min-height:44px;border-radius:12px;border:1px solid var(--line,#e4dfd5);background:#fff;font:inherit;font-weight:800;font-size:15px;color:var(--ink,#262421);padding:0 12px;cursor:pointer}
.hsFind{width:100%;min-height:44px;border-radius:12px;border:1px solid var(--line,#e4dfd5);background:#fff;padding:0 14px;font:inherit;color:var(--ink,#262421);margin:0 0 8px;box-sizing:border-box}
.hsFind::placeholder{color:var(--mute)}
.hsSec{margin:14px 2px 6px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);font-weight:800}
.hsList{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 4px}
.hsItem{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line,#e4dfd5);border-radius:12px;padding:8px 10px;min-height:46px;font:inherit;font-size:13.5px;font-weight:700;color:var(--ink,#262421);text-align:left;cursor:pointer}
.hsItem .i{font-size:18px;width:22px;text-align:center;flex:none}
.hsItem.lk55{filter:grayscale(1);opacity:.62;position:relative}
.hsItem.lk55::after{content:"🔒";position:absolute;top:6px;right:8px;font-size:13px;filter:none}
.hsSteps{display:flex;flex-direction:column;gap:8px}
.hsStep{display:flex;align-items:flex-start;gap:12px;background:#fff;border:1px solid var(--line,#e4dfd5);border-radius:16px;padding:12px 14px;font:inherit;text-align:left;color:var(--ink,#262421);cursor:pointer}
.hsStep .num{width:28px;height:28px;border-radius:50%;background:#262421;color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;flex:none;margin-top:2px}
.hsStep.on{border-color:#b7c9a4;background:#f3f7ee}
.hsStep.on .num{background:#2f7d32}
.hsStep b{display:block;font-size:15.5px}
.hsStep small{color:var(--mute);font-size:12.5px}
html.dark-mode .hsStep{background:#262626;color:#eee;border-color:#3a3a3a}
html.dark-mode .hsStep.on{background:#1c2a1c;border-color:#2f7d32}
/* leftover tile styles: only hidden markers or any later-injected feature tile, never the Option C controls */
#hsMarks button,.hsG>button[data-hs],.hsG>button[data-v42t],.hsG>button[data-v45t],.hsG>button[data-v46t]{min-height:108px;border-radius:16px;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;text-align:left;padding:12px;display:flex;flex-direction:column;gap:3px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.06)}
#hsMarks button .i,.hsG>button[data-hs] .i{font-size:30px;line-height:1.1}
.hsStartCard{grid-column:1/-1;background:linear-gradient(135deg,#2e7d32,#1565c0);color:#fff;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
`;
const MODES=["home","review","goal","set","app","more","plan"]; let mode=null, chosen=false;
const TITLES={review:"📋 Review a game",goal:"🎯 Rating goal",set:"⚙ Settings",more:"More",plan:"Today's plan"};
const NEED_NAME={games:"My games",trap:"Trap Radar",puzzles:"Mistake puzzles",v46mo:"My Openings",v42ch:"My charts",ultimo52:"Ultimo"};
function T(){ return window.Trainer; }
function closeAll(){ try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.CR52&&CR52.closeAll(); }catch(e){} try{ T()&&T().close(); }catch(e){} try{ window.PatternsUI&&PatternsUI.close(); }catch(e){} try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){} const p=$("paste"); if(p) p.classList.remove("open","gopen"); }
function openReviewForm(){ const p=$("paste"); if(p&&(B.classList.contains("nogame")||!chosen)) p.classList.add("open"); }
function setMode(m,push){ if(!MODES.includes(m)) m="home"; mode=m; B.classList.add("hs-on"); MODES.forEach(x=>B.classList.toggle("hs-"+x,x===m)); B.classList.toggle("hs-game",chosen&&!B.classList.contains("nogame"));
  const h=$("hsPt"); if(h) h.textContent=TITLES[m]||""; if(m==="home"){ paint(); window.scrollTo(0,0); }
  if(m==="more"){ paintMore(); window.scrollTo(0,0); }
  if(m==="plan"){ paintPlan(); window.scrollTo(0,0); }
  if(m==="review") openReviewForm();
  if(push&&m!=="home"){ try{ history.pushState({hs:m},""); }catch(e){} } }
function coachSub(){ const c=$("co17go"); const t=c&&c.innerText.split("\n").map(x=>x.trim()).filter(Boolean); return t&&t[1]?t[1]:"Today's 30-minute plan"; }
function goalSub(){ try{ const g=+JSON.parse(localStorage.getItem("chessReview.wish.goal.v1")); return g?`Your goal: ${g}`:"Set a rating to aim for"; }catch(e){ return "Set a rating to aim for"; } }
function levelSub(){ try{ const H=JSON.parse(localStorage.getItem("chessReview.v45.assess")||"[]"); const h=H[H.length-1]; return h?`${h.level} · ${h.lo}–${h.hi}`:"Skill test + 4-week plan"; }catch(e){ return "Skill test + 4-week plan"; } }
function podSub(){ try{ const lp=JSON.parse(localStorage.getItem("chessReview.lpz.v1")||"{}"); const seen=lp.seen||{}; const n=Object.keys(seen).length; return n?"Come back each day":"One new puzzle every day"; }catch(e){ return "One new puzzle every day"; } }
function greetName(){ try{ const i=(window.CRUser&&CRUser.info&&CRUser.info())||{}; let raw=String(i.cc||i.li||localStorage.getItem("chessReview.username")||"").trim(); if(!raw) return ""; if(/^[a-z0-9_]+$/.test(raw)) raw=raw.charAt(0).toUpperCase()+raw.slice(1); return raw; }catch(e){ return ""; } }
function hasName(){ try{ const i=(window.CRUser&&CRUser.info&&CRUser.info())||{}; return !!(i.cc||i.li||(localStorage.getItem("chessReview.username")||"").trim()); }catch(e){ return false; } }
function lastGame(){ try{ const list=window.ReviewApp&&ReviewApp.loadGames(); if(!list||!list.length) return null; const g=list[0], d=g.data||{}, meta=d.meta||{}; let opening=String(meta.opening||"").replace(/[’']/g,"").trim(); if(opening) opening=opening.split(/[:,]/)[0].trim(); const col=g.user||meta.user_color||""; const side=col==="w"||col==="white"?"you played White":col==="b"||col==="black"?"you played Black":""; return {g,opening,side}; }catch(e){ return null; } }
function openTile(id){ const t=TILES.find(x=>x[0]===id); if(!t) return; try{ t[4](); }catch(e){ console.error(e); } }
function startLastReview(){ const info=lastGame(); if(!info){ openTile("bots52"); return; } try{ chosen=true; closeAll(); const d=window.ReviewApp.upgrade?ReviewApp.upgrade(info.g.data):info.g.data; window.loadData(d); const p=$("paste"); if(p) p.classList.remove("open","gopen"); }catch(e){ console.error(e); openTile("review"); } }
function todayTask(){ const info=lastGame(); if(info){ const bits=[info.opening,info.side].filter(Boolean); return {id:"review-last",title:"Review your last game",sub:bits.join(" · ")||"See each mistake",cta:"Start review",go:startLastReview}; }
  return {id:"bots52",title:"Play the bots",sub:"Play a first game, then review it",cta:"Start playing",go:()=>openTile("bots52")}; }
function coachNote(){ if(lastGame()) return "Start with your last game. A few moments are worth a second look."; return "Start with a game against a bot. Then we'll look at it together."; }
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
 ["ask59","💬","Ask coach",()=>"Pick a game, review them all, or ask a question",()=>{ setMode("app",true); window.CRAsk59&&CRAsk59.open(); }],
 ["bl57","🩹","My blunder puzzles",()=>"Big mistakes from your own games",()=>{ setMode("app",true); window.CRBlunders&&CRBlunders.open(); }],
 ["tf54","🧠","Think First",()=>window.CRThink?CRThink.sub():"Four steps before every move",()=>{ setMode("app",true); window.CRThink&&CRThink.open(); }],
 ["corban52","🧢","Corban",()=>"Plays like a real friend",()=>{ setMode("app",true); const b=(window.CRBotsData||[]).find(x=>x.id==="corban"); b&&b.open?b.open():window.CRBots&&CRBots.open(); }],
 ["ultimo52","🦉","Ultimo",()=>"The bot that adapts to you",()=>{ setMode("app",true); window.CRBots&&CRBots._rematch(); }],
 ["board","♟","Board training",()=>"Squares and your real board",()=>{ setMode("app",true); T().open("sec","boardtrain"); }],
 ["v45","🎯","Find my level",levelSub,()=>{ setMode("app",true); window.CRAssess&&CRAssess.open(); },"",{"data-v45t":"1"}],
 ["v46mo","📖","My Openings",()=>"Which openings win you games",()=>{ setMode("app",true); window.CROpen&&CROpen.open(false); },"",{"data-v46t":"1"}],
 ["v42ch","📊","My charts",()=>"Rating, openings, mistakes",()=>{ setMode("app",true); window.V42&&V42.openCharts(); },"",{"data-v42t":"v42ch"}],
 ["progress","📈","My progress",()=>"Patterns, openings, streak",()=>{ setMode("app",true); T().open("sec","progress"); }],
 ["v42xp","🏅","Level & badges",()=>"XP, badges, board colours",()=>{ setMode("app",true); window.V42&&V42.openXP(); },"",{"data-v42t":"v42xp"}],
 ["goal","🎯","Rating goal",goalSub,()=>{ closeAll(); setMode("goal",true); }],
 ["gc65","🫀","Your Gut Check",()=>"Were your feelings right?",()=>{ setMode("app",true); window.CRGut65&&CRGut65.open(); }],
 ["bs64","🔦","My blind spots",()=>"What you keep missing, and practice",()=>{ setMode("app",true); window.CRBlind64&&CRBlind64.open(); }],
 ["ls64","🎓","Community lessons",()=>"Short lessons from real games",()=>{ setMode("app",true); window.CRLesson64&&CRLesson64.feed(); }],
 ["td64","📓","My Tilt Diary",()=>"How you play after a loss",()=>{ setMode("app",true); window.CRMind64&&CRMind64.diary(); }],
 ["kids68","🧒","Kids Mode",()=>"Big buttons, stars, no ratings. For children",()=>{ window.CRKids&&CRKids.open(); },"wide kid68"],
 ["photo68","🖼","My photo board",()=>"Use your own photos for the board and pieces",()=>{ window.CRPhoto&&CRPhoto.open(); }],
 ["set","⚙","Settings",()=>"Username, rating goal, board",()=>{ closeAll(); setMode("set",true); }]];
const MORE_GROUPS=[
 ["Review",["coach","ask59","review","games","bs64","gc65","trap"]],
 ["Learn",["learn","open52","lessons","ls64","read52","tf54","kids68"]],
 ["Train",["puzzles","v42pod","bl57","drills","board","study52"]],
 ["Play",["bots52","play","corban52","ultimo52"]],
 ["Progress",["progress","v42ch","v46mo","v45","goal","v42xp","td64","photo68"]],
 ["Settings",["set"]]];
function byId(){ return Object.fromEntries(TILES.map(t=>[t[0],t])); }
function addMarkers(g){ const box=document.createElement("div"); box.id="hsMarks"; box.setAttribute("aria-hidden","true");
  TILES.forEach(t=>{ const [id,i,name,sub,,c,attrs]=t; const b=document.createElement("button"); b.type="button"; b.dataset.hs=id; if(c) b.className=c;
    if(attrs) Object.keys(attrs).forEach(k=>b.setAttribute(k,attrs[k]));
    b.innerHTML=`<span class="i">${i}</span><span><b></b><br><small></small></span>`;
    b.querySelector("b").textContent=name; b.querySelector("small").textContent=sub();
    b.onclick=()=>{ try{ t[4](); }catch(e){ console.error(e); } }; box.appendChild(b); });
  g.appendChild(box); }
function addMood(g){
  // Reserve the Mood check row in the first paint so it cannot pop in later and shove the layout.
  g.insertAdjacentHTML("beforeend",`<div class="mood64" id="mood64"><span>🌤 <b>Mood check:</b> things look steady</span><a href="#" data-tg="diary">My Tilt Diary</a></div>`);
  const ph=$("mood64"); if(ph) ph.querySelectorAll("[data-tg=diary]").forEach(a=>a.onclick=e=>{ e.preventDefault(); try{ window.CRMind64&&CRMind64.diary(); }catch(x){} }); }
function paint(){ const g=$("hsG"); if(!g) return; g.textContent="";
  const name=greetName(), task=todayTask();
  const hi=document.createElement("p"); hi.className="hsHi"; hi.textContent=name?"Hi "+name:"Hi"; g.appendChild(hi);
  const lede=document.createElement("p"); lede.className="hsLede"; lede.textContent="Here's one thing for today."; g.appendChild(lede);
  const coach=document.createElement("div"); coach.className="hsCard hsCoach";
  coach.innerHTML=`<div class="who"><div class="hsAv">🧑‍🏫</div><div><b>My Coach</b><small></small></div></div><p></p>`;
  coach.querySelector("small").textContent=coachSub(); coach.querySelector("p").textContent=coachNote();
  coach.querySelector(".who").addEventListener("click",()=>openTile("coach")); g.appendChild(coach);
  const card=document.createElement("div"); card.className="hsCard hsTask";
  card.innerHTML=`<div class="hsKicker">Today's task</div><b></b><small></small><button type="button" class="hsStart"></button>`;
  card.querySelector("b").textContent=task.title; card.querySelector("small").textContent=task.sub; card.querySelector(".hsStart").textContent=task.cta;
  card.querySelector(".hsStart").onclick=task.go; g.appendChild(card);
  const alts=document.createElement("div"); alts.className="hsAlts";
  [["bots52","🤖","Play the bots"],["v42pod","📅","Puzzle of the day"]].forEach(([id,i,lab])=>{
    const b=document.createElement("button"); b.type="button"; b.className="hsAlt"; b.innerHTML=`<span class="i">${i}</span><b></b>`;
    b.querySelector("b").textContent=lab; b.onclick=()=>openTile(id); alts.appendChild(b); });
  g.appendChild(alts);
  const plan=document.createElement("button"); plan.type="button"; plan.className="hsLink"; plan.textContent="See today's plan"; plan.onclick=()=>setMode("plan",true); g.appendChild(plan);
  const more=document.createElement("button"); more.type="button"; more.className="hsMoreBtn"; more.id="hsMoreBtn"; more.innerHTML=`More<span>All other features</span>`; more.onclick=()=>setMode("more",true); g.appendChild(more);
  const grow=document.createElement("div"); grow.className="hsGrow"; g.appendChild(grow);
  addMarkers(g); addMood(g);
  try{ window.CRMind64&&CRMind64.refresh(); }catch(e){} }
function isLocked(id){ if(id in NEED_NAME) return !hasName(); if(id==="goal"){ try{ return !(window.CRGoal&&CRGoal.get()); }catch(e){ return false; } } return false; }
function paintMore(query){ const root=$("hsMore"); if(!root) return; const by=byId(); const q=String(query||"").trim().toLowerCase();
  let body=root.querySelector(".hsMoreBody"); if(!body){ body=document.createElement("div"); body.className="hsMoreBody"; root.appendChild(body); }
  body.textContent="";
  MORE_GROUPS.forEach(([title,ids])=>{
    const items=ids.map(id=>by[id]).filter(t=>t&&(!q||t[2].toLowerCase().includes(q)));
    if(!items.length) return;
    const h=document.createElement("h3"); h.className="hsSec"; h.textContent=title; body.appendChild(h);
    const list=document.createElement("div"); list.className="hsList";
    items.forEach(t=>{ const [id,i,name]=t; const b=document.createElement("button"); b.type="button"; b.className="hsItem"+(isLocked(id)?" lk55":""); b.dataset.hs=id;
      b.innerHTML=`<span class="i">${i}</span>`; b.appendChild(document.createTextNode(name));
      b.onclick=()=>{ const mark=$("hsMarks")&&$("hsMarks").querySelector(`[data-hs="${id}"]`); if(mark) mark.click(); else openTile(id); };
      list.appendChild(b); });
    body.appendChild(list); }); }
function paintPlan(){ const root=$("hsPlan"); if(!root) return; let body=root.querySelector(".hsPlanBody"); if(!body){ body=document.createElement("div"); body.className="hsPlanBody"; root.appendChild(body); }
  body.textContent="";
  const task=todayTask();
  const steps=lastGame()?[
    {title:task.title,sub:task.sub,go:task.go,on:true},
    {title:"Puzzle of the day",sub:podSub(),go:()=>openTile("v42pod")},
    {title:"Play the bots",sub:"A slow game, then review it",go:()=>openTile("bots52")}
  ]:[
    {title:task.title,sub:task.sub,go:task.go,on:true},
    {title:"Learn the basics",sub:"Pieces, moves and rules",go:()=>openTile("learn")},
    {title:"Puzzle of the day",sub:podSub(),go:()=>openTile("v42pod")}
  ];
  const wrap=document.createElement("div"); wrap.className="hsSteps";
  steps.forEach((s,i)=>{ const b=document.createElement("button"); b.type="button"; b.className="hsStep"+(s.on?" on":"");
    b.innerHTML=`<div class="num">${i+1}</div><div><b></b><small></small></div>`;
    b.querySelector("b").textContent=s.title; b.querySelector("small").textContent=s.sub; b.onclick=s.go; wrap.appendChild(b); });
  body.appendChild(wrap);
  const more=document.createElement("button"); more.type="button"; more.className="hsLink"; more.style.marginTop="16px"; more.textContent="See all features"; more.onclick=()=>setMode("more",true); body.appendChild(more); }
function backFromPanel(){ try{ if(history.state&&history.state.hs){ history.back(); return; } }catch(e){} goHome(); }
function build(){ const w=document.querySelector(".wrap"); if(!w||$("hs")) return; const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  const d=document.createElement("div"); d.id="hs";
  d.innerHTML=`<div class="hsT"><h1><img src="icon-192.png" alt="" class="hsLogo"> The Ultimate Chess App</h1><div class="hsG" id="hsG"></div></div>
   <div class="hsMore" id="hsMore"><div class="hsPh"><button type="button" class="hsBack" data-back>Back</button><h2>More</h2></div><input class="hsFind" id="hsFind" type="search" placeholder="Find something" aria-label="Find something"></div>
   <div class="hsPlan" id="hsPlan"><div class="hsPh"><button type="button" class="hsBack" data-back>Back</button><h2>Today's plan</h2></div></div>
   <div class="hsP"><div class="hsPh"><h2 id="hsPt"></h2><button type="button" id="hsBack">Back</button></div></div>`;
  w.insertBefore(d,w.firstChild);
  $("hsBack").onclick=()=>backFromPanel();
  d.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>backFromPanel());
  const find=$("hsFind"); if(find) find.addEventListener("input",()=>paintMore(find.value)); }
function goHome(){ closeAll(); setMode("home"); try{ if(history.state&&history.state.hs) history.replaceState(null,""); }catch(e){} }
// a game chosen -> review mode
function hookLoad(){ const ld=window.loadData; if(typeof ld!=="function"||ld.__hs) return; const w=function(){ chosen=true; const r=ld.apply(this,arguments); if(mode&&mode!=="review"){ closeAll(); setMode("review",true); } else setMode("review"); try{ document.querySelector("header").scrollIntoView(); }catch(e){} return r; }; w.__hs=1; window.loadData=w; try{ loadData=w; }catch(e){} }
// something else opened (friend link, deep links, coach/trainer pages) -> leave home
function watch(){ const mo=new MutationObserver(()=>{ if(mode!=="home"&&mode!=="goal"&&mode!=="set"&&mode!=="more"&&mode!=="plan") return; const on=["tr","co17","pat"].some(id=>{ const e=$(id); return e&&e.classList.contains("on"); }); if(on) setMode("app"); });
  ["tr","pat"].forEach(id=>{ const e=$(id); if(e) mo.observe(e,{attributes:true,attributeFilter:["class"]}); });
  const mo2=new MutationObserver(()=>{ const c=$("co17"); if(c&&!c.__hs){ c.__hs=1; mo.observe(c,{attributes:true,attributeFilter:["class"]}); } }); mo2.observe(document.body,{childList:true,subtree:true}); }
document.addEventListener("click",e=>{ const t=e.target.closest&&e.target.closest('#homeBtn,#trHome,[data-co="exit"]'); if(t) setTimeout(goHome,0); },true);
window.addEventListener("popstate",()=>{ const s=history.state; if(s&&s.hs&&s.hs!=="app") setMode(s.hs); else goHome(); });
function nfa(){ const h=$("home"); if(!h||h.querySelector(".nfa40")) return; const p=document.createElement("p"); p.className="nfa40"; p.textContent="Not affiliated with or endorsed by Chess.com or Lichess. For reviewing finished games only — don't use during live games."; h.appendChild(p); }
function boot(){ build(); nfa(); hookLoad(); watch(); const deep=/ply=|try=|punish=/.test(location.hash); if(deep||window.__crWantReview){ chosen=true; setMode("review"); } else { try{ if(!B.classList.contains("nogame")&&window.ReviewApp&&ReviewApp.loadGames().length) chosen=true; }catch(e){} setMode("home"); }
  setTimeout(paint,1500); document.documentElement.classList.remove("hsboot"); window.addEventListener("crgoal",paint); }
try{ const v=document.getElementById("verV"); if(v&&typeof VERSION!=="undefined") v.textContent=VERSION; }catch(e){}
window.CRHome={setMode,goHome,mode:()=>mode,paint,paintMore,openTile};
try{ boot(); }catch(e){ console.error(e); }
})();
