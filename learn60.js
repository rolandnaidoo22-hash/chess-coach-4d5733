/* v60: "Learn from this loss": one mistake -> type -> 30-second lesson -> fix it -> same-pattern puzzles -> spaced repeats -> My rules -> tracking. */
(function(){ "use strict"; if(window.CRLearn60) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const CH=()=>(window.ChessLib&&ChessLib.Chess)||window.Chess, K="chessReview.v60.learn", DAY=864e5, VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const NAME={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const TYPES={
 loose:{t:"Left a piece unprotected",i:"⭕",rule:"Before I let go of a piece, I check: is every one of my pieces still protected, including the one I just moved?",
   why:"A piece with no protector can simply be taken. Most club games are lost this way, not by deep tactics."},
 king:{t:"Left the king open",i:"👑",rule:"Before every move, I look at every check my opponent could give next, and what each one wins.",
   why:"When your king has few defenders, a single check can win material or end the game."},
 threat:{t:"Missed their threat",i:"⚠️",rule:"Before every move, I ask: what does my opponent want to do next? I stop it, or I play something even stronger.",
   why:"Their move had a point. If you don't ask what it is, you walk into it."},
 miss:{t:"Missed a winning chance",i:"🎯",rule:"When my opponent moves, I first look for my own checks, captures and attacks.",
   why:"Your opponent left something open. Checking forcing moves first is how you spot it."}};
function st(){ try{ return Object.assign({rules:[],reps:[],lessons:[]},JSON.parse(localStorage.getItem(K)||"{}")); }catch(e){ return {rules:[],reps:[],lessons:[]}; } }
function save(s){ try{ localStorage.setItem(K,JSON.stringify(s)); }catch(e){} }
const today=()=>new Date().toISOString().slice(0,10);
const isMine=p=>p&&p.user&&["blunder","mistake","miss"].includes(p.cls);
function typeOf(p){ if(!p) return "threat"; if(p.cls==="miss") return "miss"; const C=CH(); let r=(p.reply_uci||[])[0];
  try{ const g=new C(p.fen); if(!r) return "threat"; const to=r.slice(2,4), cap=g.get(to); const m=g.move({from:r.slice(0,2),to,promotion:r[4]||"q"}); if(!m) return "threat";
    if(g.in_checkmate?g.in_checkmate():g.isCheckmate()) return "king"; if(cap&&VAL[cap.type]>=3) return "loose"; if(m.san.includes("+")) return "king"; return "threat"; }catch(e){ return "threat"; } }
function details(p){ const C=CH(), r=(p.reply_uci||[])[0]; let what="";
  try{ const g=new C(p.fen); if(r){ const cap=g.get(r.slice(2,4)), pc=g.get(r.slice(0,2)); const m=g.move({from:r.slice(0,2),to:r.slice(2,4),promotion:r[4]||"q"});
     what=`After ${p.san}, their ${NAME[pc.type]} could ${cap?"take your "+NAME[cap.type]+" on "+r.slice(2,4):"go to "+r.slice(2,4)}${m&&m.san.includes("#")?" with checkmate":m&&m.san.includes("+")?" with check":""}.`; } }catch(e){}
  return what; }
/* the single biggest mistake of the user in the loaded review */
function biggest(Pl){ let b=null, bi=-1; (Pl||[]).forEach((p,i)=>{ if(!isMine(p)) return; const l=+(p.cpl||0)+(p.cls==="blunder"?1e4:p.cls==="miss"?5e3:0); if(!b||l>b.l){ b={l}; bi=i; } }); return bi<0?null:{i:bi,p:Pl[bi]}; }
function gameId(Mt,Pl){ return String(Mt&&Mt.link||[Mt&&Mt.white,Mt&&Mt.black,Mt&&Mt.date,(Pl||[]).length].join("|")).replace(/\/$/,""); }
/* ---- tracking: how often this type shows up in checked games, before and after learning it ---- */
function allGames(){ try{ return Coach17._all(); }catch(e){ return []; } }
function countType(d,ty){ return (d.plies||[]).filter(p=>isMine(p)&&typeOf(p)===ty).length; }
function trend(ty){ const s=st(), L=s.lessons.filter(l=>l.type===ty); if(!L.length) return null; const day=L[0].day, G=allGames();
  const bef=G.filter(g=>g.date<=day), aft=G.filter(g=>g.date>day), avg=a=>a.length?a.reduce((x,g)=>x+countType(g.d,ty),0)/a.length:null;
  return {type:ty,day,nb:bef.length,na:aft.length,b:avg(bef),a:avg(aft)}; }
function trendHtml(ty){ const t=trend(ty); if(!t) return ""; const f=x=>x==null?"–":x.toFixed(1);
  let v; if(!t.na) v=`No checked games since ${t.day} yet. Play a few and check them, and this will show if it is dropping.`;
  else if(t.b==null||!t.nb) v=`Since ${t.day}: ${f(t.a)} per game over ${t.na} game${t.na>1?"s":""}.`;
  else { const d=t.a-t.b; v=`${d<-.05?"📉 Dropping":d>.05?"📈 Going up":"➖ About the same"}: ${f(t.b)} per game before (${t.nb} game${t.nb>1?"s":""}), ${f(t.a)} per game since (${t.na} game${t.na>1?"s":""}).`; }
  return `<div class="ln60tr" data-ty="${ty}"><b>${TYPES[ty].i} ${E_(TYPES[ty].t)}</b><p>${E_(v)}</p></div>`; }
function trackCard(){ const s=st(), tys=[...new Set(s.lessons.map(l=>l.type))]; if(!tys.length) return "";
  return `<div class="card ln60card" id="ln60track"><h3>📘 Mistakes you are working on</h3>${tys.map(trendHtml).join("")}<p class="mute">Counted from your games checked move by move.</p></div>`; }
/* ---- My rules ---- */
function rules(){ return st().rules; }
function addRule(ty){ const s=st(); if(!s.rules.some(r=>r.type===ty)) s.rules.push({type:ty,text:TYPES[ty].rule,at:Date.now()}); save(s); }
function delRule(ty){ const s=st(); s.rules=s.rules.filter(r=>r.type!==ty); save(s); }
function rulesHtml(){ const R=rules(); if(!R.length) return ""; return `<details class="card ln60rules" id="ln60rules" open><summary><b>📌 My rules (${R.length})</b></summary><ul>${R.map(r=>`<li>${E_(r.text)}</li>`).join("")}</ul></details>`; }
/* ---- spaced repeats (1, 3, 7 days) for the daily session ---- */
function schedule(ty,p){ const s=st(), id=ty+":"+(p.fen_before||"").split(" ").slice(0,4).join(" "); if(s.reps.some(r=>r.id===id)) return s.reps.find(r=>r.id===id);
  const t=Date.now(), r={id,type:ty,f:p.fen_before,best:p.best_uci,at:t,due:[1,3,7].map(d=>t+d*DAY),shown:[]}; s.reps.push(r); save(s); return r; }
function due(now){ now=now||Date.now(); const out=[]; st().reps.forEach(r=>{ const n=r.shown.length; if(n<3&&r.due[n]<=now) out.push({id:"rp:"+r.id+":"+n,rid:r.id,n,f:r.f,lab:`Repeat (${[1,3,7][n]}-day): ${TYPES[r.type].t}`}); }); return out; }
function markShown(rid){ const s=st(), r=s.reps.find(x=>x.id===rid); if(r){ r.shown.push(Date.now()); save(s); } }
/* ---- puzzles with the same pattern ---- */
function puzzles(ty,skipFen){ const out=[], seen=new Set([skipFen]);
  allGames().forEach(g=>(g.d.plies||[]).forEach(p=>{ if(out.length<3&&isMine(p)&&p.best_uci&&!seen.has(p.fen_before)&&typeOf(p)===ty){ seen.add(p.fen_before); out.push({f:p.fen_before,best:[p.best_uci.slice(0,4)],src:"From your game vs "+((g.d.meta.user_color==="w"?g.d.meta.black:g.d.meta.white)||"opponent")}); } }));
  try{ if(window.CRBlunders) CRBlunders.moments().forEach(o=>{ if(out.length<3&&o.best&&!seen.has(o.f)){ seen.add(o.f); out.push({f:o.f,best:[o.best.slice(0,4)],src:"Your blunder puzzle"}); } }); }catch(e){}
  const T=window.TFBANK||{}, bank=ty==="miss"?(T.main||[]).map(x=>({f:x.f,best:Object.keys(x.m||{}).filter(u=>(x.m[u]||[])[0]==="b").map(u=>u.slice(0,4)),src:"Find the best move"}))
    :(T.def||[]).map(x=>({f:x.f,best:[String(x.sol||x.best).slice(0,4)],src:"Stop their threat"}));
  const B=bank.filter(x=>x.best.length&&!seen.has(x.f)).sort(()=>Math.random()-.5); while(out.length<4&&B.length) out.push(B.shift()); return out.slice(0,5); }
/* ---- the flow ---- */
let F=null, tm=null;
function stop(){ if(tm){ clearInterval(tm); tm=null; } }
function open(){ stop(); let Pl, Mt; try{ Pl=P; Mt=M; }catch(e){ return; } const b=biggest(Pl); if(!b) return;
  const ty=typeOf(b.p); F={step:1,ty,p:b.p,i:b.i,me:b.p.color,gid:gameId(Mt,Pl),res:Mt&&Mt.result,pz:null,pi:0,solved:0,fixed:false};
  const s=st(); if(!s.lessons.some(l=>l.gid===F.gid)) s.lessons.push({type:ty,gid:F.gid,day:today(),at:Date.now()}); save(s); render(); }
const STEPS=["The mistake","Quick lesson","Fix it","Same pattern","Repeats","My rules","Progress"];
function render(){ stop(); try{ window.CRHome&&CRHome.setMode("app",true); }catch(e){} const pg=U().show("ln60"), T=TYPES[F.ty], p=F.p, mv=`${p.label||p.san}`;
  let h=`<h2>📘 Learn from this ${F.lossy===false?"game":"loss"}</h2><div class="ln60dots">${STEPS.map((x,i)=>`<span class="${i+1===F.step?"on":i+1<F.step?"done":""}">${i+1}</span>`).join("")}</div><p class="ln60st">Step ${F.step} of 7 · ${STEPS[F.step-1]}</p>`;
  if(F.step===1) h+=`<div class="card"><p class="mute">Your biggest mistake in this game</p><div class="ln60big">${T.i} <b>${E_(T.t)}</b></div><p>On move <b>${E_(mv)}</b>. ${E_(details(p))}</p><p>${E_(T.why)}</p></div>`;
  if(F.step===2) h+=`<div class="card"><div class="ln60bar"><i id="ln60tb"></i></div><p class="ln60t" id="ln60tt">30 seconds</p><div class="ln60bd" id="ln60bd"></div>
     <p class="ln60key"><span class="r">■</span> your move <span class="o">■</span> their answer <span class="g">■</span> a better move</p><p>${E_(lesson(F.ty,p))}</p><div class="ln60rule">📌 <b>The rule:</b> ${E_(T.rule)}</div></div>`;
  if(F.step===3) h+=`<div class="card"><p><b>Fix it now.</b> Same position as the game. Find a better move than ${E_(p.san)}.</p><div class="ln60bd" id="ln60bd"></div><p class="ln60msg" id="ln60msg"></p><div class="ln60row"><button id="ln60ans">Show answer</button></div></div>`;
  if(F.step===4){ if(!F.pz) F.pz=puzzles(F.ty,p.fen_before); const z=F.pz[F.pi];
    h+=z?`<div class="card"><p class="mute">Puzzle ${F.pi+1} of ${F.pz.length} · ${E_(z.src)} · solved ${F.solved}</p><p><b>${F.ty==="miss"?"Find the strongest move.":"Find the safe move. Use your rule."}</b></p><div class="ln60bd" id="ln60bd"></div><p class="ln60msg" id="ln60msg"></p><div class="ln60row"><button id="ln60ans">Show answer</button><button id="ln60pn">${F.pi<F.pz.length-1?"Next puzzle ›":"Done"}</button></div></div>`:`<div class="card"><p>No more puzzles with this pattern yet.</p></div>`; }
  if(F.step===5){ const r=schedule(F.ty,p); h+=`<div class="card"><p>This position comes back in your <b>Today's session</b> in Think First, so the lesson sticks:</p><ul class="ln60due">${r.due.map((d,i)=>`<li>${r.shown[i]?"✅":"🗓"} In ${[1,3,7][i]} day${i?"s":""}: ${new Date(d).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</li>`).join("")}</ul></div>`; }
  if(F.step===6){ addRule(F.ty); h+=`<div class="card"><p>Added to <b>My rules</b>. Think First shows your rules before every move.</p><div class="ln60rule">📌 ${E_(T.rule)}</div>${rulesHtml()}<button class="ln60sec" id="ln60tf">🧠 Try it in Think First</button></div>`; }
  if(F.step===7) h+=`<div class="card"><p>We count this mistake in every game you check from now on.</p>${trendHtml(F.ty)}</div><p class="mute">You can also see this on <b>My charts</b>.</p>`;
  h+=`<div class="ln60nav"><button id="ln60b" ${F.step>1?"":"disabled"}>‹ Back</button><button class="pri" id="ln60n">${F.step<7?"Next ›":"Finish"}</button></div>`;
  pg.innerHTML=h; window.scrollTo(0,0);
  $("ln60b").onclick=()=>{ F.step--; render(); }; $("ln60n").onclick=()=>{ if(F.step<7){ F.step++; render(); } else { stop(); try{ U().closeAll(); }catch(e){} try{ window.CRHome&&CRHome.setMode("review",true); }catch(e){} try{ window.CRRev59&&CRRev59.setTab("sum"); }catch(e){} window.scrollTo(0,0); } };
  if($("ln60tf")) $("ln60tf").onclick=()=>{ try{ CRThink.open(); }catch(e){} };
  if(F.step===2){ board(p.fen_before,[{u:p.uci,c:"#c62828"},...((p.reply_uci||[])[0]?[{u:p.reply_uci[0],c:"#ef8f00"}]:[]),...(p.best_uci?[{u:p.best_uci,c:"#2e7d32"}]:[])]); let left=30; tm=setInterval(()=>{ left--; const b=$("ln60tb"), t=$("ln60tt"); if(!b){ stop(); return; } b.style.width=(100-left/30*100)+"%"; t.textContent=left>0?left+" seconds":"Got it? Tap Next."; if(left<=0) stop(); },1000); }
  if(F.step===3) solve(p.fen_before,[String(p.best_uci||"").slice(0,4)],ok=>{ if(ok) F.fixed=true; },`The better move was <b>${E_(p.best_san||"")}</b>.`);
  if(F.step===4&&F.pz[F.pi]){ const z=F.pz[F.pi]; let got=false; solve(z.f,z.best,ok=>{ if(ok&&!got){ got=true; F.solved++; } },null);
    $("ln60pn").onclick=()=>{ if(F.pi<F.pz.length-1){ F.pi++; render(); } else { F.step=5; render(); } }; } }
function lesson(ty,p){ const d=details(p);
  return {loose:`Red is your move. Orange is how they answered: ${d||"they took a piece that had no protector."} Green was safer. Count protectors before you let go.`,
   king:`Red is your move. Orange is their answer: ${d||"a check that hurt."} Green kept your king safer. Look at their checks first.`,
   threat:`Red is your move. Orange is what they did next: ${d||"the point of their last move."} Green dealt with it. Ask what they want before you move.`,
   miss:`Red is what you played. Green was the chance: a forcing move that wins something. Orange is how they got away. Look at your checks and captures first.`}[ty]; }
function board(f,arrows){ const C=CH(); let G; try{ G=new C(f); }catch(e){ return; } Coach17._tapBoard($("ln60bd"),G,F.me,()=>{},()=>({arrows})); }
function solve(f,best,cb,ansHtml){ const C=CH(); let G; try{ G=new C(f); }catch(e){ return; } const me=G.turn(); let arrows=[];
  const msg=(t,c)=>{ const m=$("ln60msg"); if(m){ m.innerHTML=t; m.className="ln60msg "+(c||""); } };
  const draw=Coach17._tapBoard($("ln60bd"),G,me,(a,b)=>{ const u=a+b; if(best.includes(u)){ arrows=[{u,c:"#2e7d32"}]; msg("✅ Yes, that's it.","ok"); cb(true); } else { arrows=[{u,c:"#c62828"}]; msg("Not that one. Use your rule and try again.","no"); cb(false); } draw(); },()=>({arrows}));
  const a=$("ln60ans"); if(a) a.onclick=()=>{ arrows=best.slice(0,1).map(u=>({u,c:"#2e7d32"})); draw(); msg(ansHtml||"Green shows the answer.",""); }; }
/* ---- review button at the end of every review ---- */
function button(){ let Pl, Mt; try{ Pl=P; Mt=M; }catch(e){ return; } const host=$("rv59sum")||$("summary"); if(!host) return; const old=$("ln60go"); if(old) old.remove();
  const b=biggest(Pl); if(!b) return; const uc=Mt&&Mt.user_color, r=Mt&&Mt.result, lost=uc&&r&&((r==="1-0"&&uc==="b")||(r==="0-1"&&uc==="w"));
  host.insertAdjacentHTML("beforeend",`<button type="button" class="ln60go" id="ln60go">📘 Learn from this ${lost?"loss":"game"}<small>Your biggest mistake, a quick lesson, puzzles and a rule to keep</small></button>`);
  $("ln60go").onclick=()=>{ open(); if(F) F.lossy=!!lost; render(); }; }
function hook(){ if(typeof buildSummary!=="function"||buildSummary._ln60) return false; const o=buildSummary; buildSummary=function(){ const r=o.apply(this,arguments); try{ setTimeout(button,0); }catch(e){} return r; }; buildSummary._ln60=1; return true; }
/* Charts: show the tracking card under the charts */
function chartsHook(){ const C=window.CRCharts; if(!C||C._ln60) return; const o=C.open; C.open=async function(){ const r=await o.apply(this,arguments); try{ const root=$("c56root"); if(root&&!$("ln60track")) root.insertAdjacentHTML("beforeend",trackCard()); }catch(e){} return r; }; C._ln60=1; }
const CSS=`.ln60go{display:block;width:100%;margin:14px 0 4px;min-height:56px;border:0;border-radius:14px;background:#5b3fa0;color:#fff;font:inherit;font-weight:800;font-size:17px;padding:10px}.ln60go small{display:block;font-weight:500;font-size:13px;opacity:.9;margin-top:2px}
.ln60dots{display:flex;gap:5px;justify-content:center;margin:4px 0}.ln60dots span{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e6e1d6;font-weight:700;font-size:13px}.ln60dots .on{background:#5b3fa0;color:#fff}.ln60dots .done{background:#9b8ac6;color:#fff}.ln60st{text-align:center;color:var(--mute,#666);margin:2px 0 8px;font-size:14px}
.ln60big{font-size:20px;margin:6px 0}.ln60bd{max-width:360px;margin:6px auto}.ln60bar{height:6px;background:#e6e1d6;border-radius:3px;overflow:hidden}.ln60bar i{display:block;height:100%;width:0;background:#5b3fa0;transition:width 1s linear}.ln60t{font-size:13px;color:var(--mute,#666);margin:4px 0}
.ln60key{font-size:13px}.ln60key .r{color:#c62828}.ln60key .o{color:#ef8f00}.ln60key .g{color:#2e7d32}.ln60rule{background:#f3effa;border-left:4px solid #5b3fa0;padding:8px 10px;border-radius:8px;margin:8px 0}
.ln60msg{min-height:22px;font-weight:600}.ln60msg.ok{color:#2e7d32}.ln60msg.no{color:#b3261e}.ln60row,.ln60nav{display:flex;gap:8px;margin-top:8px}.ln60row button,.ln60nav button,.ln60sec{flex:1;min-height:46px;border-radius:10px;border:1px solid #5b3fa0;background:#fff;color:#5b3fa0;font:inherit;font-weight:700}.ln60nav .pri{background:#5b3fa0;color:#fff}.ln60sec{width:100%;margin-top:8px}
.ln60due{padding-left:18px}.ln60tr{border-top:1px solid var(--line,#e3ddd0);padding-top:6px;margin-top:6px}.ln60tr p{margin:3px 0}.ln60rules ul{margin:6px 0;padding-left:18px}.ln60rules li{margin:3px 0}
html.dark-mode .ln60rule{background:#2b2540;color:#eee}html.dark-mode .ln60row button,html.dark-mode .ln60nav button:not(.pri),html.dark-mode .ln60sec{background:#262626}`;
{ const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
function boot(){ hook(); chartsHook(); try{ if(document.getElementById("rv59sum")||document.getElementById("summary")) button(); }catch(e){} }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot(); setTimeout(boot,1500);
window.CRLearn60={open,typeOf,TYPES,rules,rulesHtml,addRule,delRule,due,markShown,schedule,trend,trackCard,puzzles,_F:()=>F,_st:st,_button:button};
})();
