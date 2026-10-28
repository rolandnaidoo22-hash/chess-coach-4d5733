/* badges.js (v56): the 12 badges, in plain words. Each one opens on tap, shows exactly what earns it, your real progress,
   the date you earned it, and the reward it unlocks (a board colour or a title on your player card). Every number comes from what you have
   actually done on this phone; nothing is seeded. Original wording. */
(function(){ "use strict"; if(window.CRBadges) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LS={get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const KE="chessReview.v56.badges", KT="chessReview.v56.title", KTH="chessReview.v42.theme";
/* ---------- real counts ---------- */
function counts(){ const s=(window.V42&&V42.stats())||{best:0,wins:[],pod:{}};
  const pz=LS.get("chessReview.puzzles.v1",{cards:{}}), lp=LS.get("chessReview.lpz.v1",{seen:{},th:{}});
  const solved=Object.values(pz.cards||{}).reduce((a,c)=>a+((c&&c.right)||0),0)+Object.values(lp.seen||{}).filter(v=>v===1).length;
  const L=LS.get("chessReview.learn.v1",{}), topics=(window.CRLearn&&CRLearn._topics||[]).map(t=>t.id), learnN=topics.length||8, learnDone=topics.length?topics.filter(id=>L[id]&&L[id].quiz).length:Object.values(L).filter(x=>x&&x.quiz).length;
  let ids=new Set(); try{ Object.keys(window.PatternStore?PatternStore.all():{}).forEach(i=>ids.add(i)); }catch(e){} try{ ReviewApp.loadGames().forEach(g=>ids.add(g.id)); }catch(e){}
  const reviewed=[...ids].filter(i=>!/example|sample|demo/i.test(String(i))).length;
  const wins=s.wins||[], top=wins.reduce((m,w)=>Math.max(m,w.lv||1),0);
  const m3=(lp.th&&lp.th.mateIn3&&lp.th.mateIn3.ok)||0, pod=Object.keys(s.pod||{}).length, rated=(lp.hist||[]).length>0, pr=rated?Math.round(lp.r||0):null;
  return {solved,best:s.best||0,learnDone,learnN,reviewed,wins:wins.length,top,m3,pod,pr}; }
/* ---------- the 12 badges (same ones as before, plainer words) ---------- */
const B=[
 {id:"puz1",i:"🧩",old:"First puzzle",name:"First puzzle",why:"Your first step into tactics.",req:"Solve 1 puzzle (in Puzzles, Puzzle of the day or Coach puzzles).",p:c=>[c.solved,1,"puzzle solved","puzzles solved"],rw:{board:"blue"}},
 {id:"puz50",i:"🧠",old:"50 puzzles",name:"50 puzzles solved",why:"Tactics stick when you see lots of them.",req:"Solve 50 puzzles in total. Only puzzles you get right count.",p:c=>[c.solved,50,"puzzle solved","puzzles solved"],rw:{title:"Puzzle Hunter"}},
 {id:"st3",i:"🔥",old:"3-day streak",name:"3 days in a row",why:"A little practice every day beats a lot once a week.",req:"Train on 3 days in a row (any puzzle, drill, lesson or review counts).",p:c=>[Math.min(c.best,3),3,"day in a row","days in a row"],rw:{board:"coral"}},
 {id:"st7",i:"☄️",old:"7-day streak",name:"7 days in a row",why:"A full week of practice: this is how habits form.",req:"Train on 7 days in a row (any puzzle, drill, lesson or review counts).",p:c=>[Math.min(c.best,7),7,"day in a row","days in a row"],rw:{title:"Every-Day Player"}},
 {id:"rules",i:"📘",old:"Rules master",name:"Knows the rules",why:"You know every rule, including the tricky ones.",req:c=>`Finish all ${c.learnN} Learn the basics topics (pass the quiz at the end of each).`,p:c=>[c.learnDone,c.learnN,"topic finished","topics finished"],rw:{board:"purple"}},
 {id:"rev1",i:"📋",old:"First review",name:"First game reviewed",why:"Looking back at your own games is where learning starts.",req:"Review 1 of your own games (the sample game doesn't count).",p:c=>[c.reviewed,1,"game reviewed","games reviewed"],rw:{board:"walnut"}},
 {id:"rev10",i:"📚",old:"10 games reviewed",name:"10 games reviewed",why:"With 10 games, your patterns start to show.",req:"Review 10 of your own games (the sample game doesn't count).",p:c=>[c.reviewed,10,"game reviewed","games reviewed"],rw:{title:"Game Detective"}},
 {id:"bot1",i:"🤖",old:"Beat the bot",name:"Beat a bot",why:"Your first win against the computer.",req:"Win 1 game against a bot in Play the bots, at any level.",p:c=>[c.wins,1,"win","wins"],rw:{board:"ice"}},
 {id:"bot4",i:"🦾",old:"Beat bot level 4",name:"Beat bot level 4",why:"Level 4 punishes loose moves. Beating it means you are careful.",req:"Win a game against bot level 4 or higher.",p:c=>[c.top>=4?1:0,1,"win at level 4+","wins at level 4+"],note:c=>c.top?`Best so far: you beat level ${c.top}.`:"No bot wins yet.",rw:{title:"Bot Breaker"}},
 {id:"m3",i:"♛",old:"Mate in 3 solved",name:"Solved a mate in 3",why:"Seeing three moves ahead is a big step.",req:"Solve a mate-in-3 puzzle in Coach puzzles.",p:c=>[Math.min(c.m3,1),1,"mate in 3 solved","mates in 3 solved"],rw:{board:"night"}},
 {id:"pod3",i:"📅",old:"3 daily puzzles",name:"3 puzzles of the day",why:"Coming back for the daily puzzle keeps you sharp.",req:"Solve the Puzzle of the day on 3 different days.",p:c=>[Math.min(c.pod,3),3,"day","days"],rw:{board:"gold"}},
 {id:"pr1000",i:"🎯",old:"Puzzle rating 1000",name:"Puzzle rating 1000",why:"Your coach-puzzle rating shows how hard a puzzle you can solve.",req:"Reach a puzzle rating of 1000 in Coach puzzles (everyone starts at 800).",p:c=>[c.pr==null?0:Math.min(c.pr,1000),1000,"rating","rating"],note:c=>c.pr==null?"No coach puzzles done yet, so no rating yet.":`Your puzzle rating now: ${c.pr}.`,rw:{title:"Sharp Eye"}}];
const THEMES={classic:["Classic","#f0d9b5","#b58863"],green:["Green","#eeeed2","#769656"],blue:["Ocean","#dee3e6","#8ca2ad"],purple:["Purple","#e8e0f0","#9a7fb8"],walnut:["Walnut","#e6c9a0","#7d5236"],coral:["Coral","#f4e3d7","#d18b70"],ice:["Ice","#eaf3f8","#7fa6c1"],night:["Night","#c9c9c9","#4b5563"],gold:["Gold","#f6e7b0","#b8892b"]};
const FREE=["classic","green"];
const reqOf=(b,c)=>typeof b.req==="function"?b.req(c):b.req;
const rwText=b=>b.rw.board?`Unlocks the <b>${THEMES[b.rw.board][0]}</b> board colour`:`Unlocks the title <b>“${E_(b.rw.title)}”</b> on your player card`;
/* ---------- earned state: always from real data; the store only keeps the date ---------- */
function state(){ const c=counts(); let st=LS.get(KE,null); const first=!st; st=st||{at:{}}; let ch=first;
  const out=B.map(b=>{ const [have,need]=b.p(c), ok=have>=need; if(ok&&!(b.id in st.at)){ st.at[b.id]=first?0:Date.now(); ch=true; } if(!ok&&(b.id in st.at)){ delete st.at[b.id]; ch=true; } return {b,ok,have,need,at:st.at[b.id]}; });
  if(ch) LS.set(KE,st); return {c,list:out}; }
const earnedBoards=S=>FREE.concat(S.list.filter(x=>x.ok&&x.b.rw.board).map(x=>x.b.rw.board));
const earnedTitles=S=>S.list.filter(x=>x.ok&&x.b.rw.title).map(x=>x.b.rw.title);
function title(){ const S=state(), t=LS.get(KT,""); return t&&earnedTitles(S).includes(t)?t:""; }
function fixLocked(){ const S=state(), th=LS.get(KTH,"classic"); if(!earnedBoards(S).includes(th)){ LS.set(KTH,"classic"); window.V42&&V42.applyTheme(); } }
/* ---------- screens ---------- */
const CSS=`.bg56{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.bg56 button{border:2px solid var(--line,#ddd);border-radius:14px;background:#fff;padding:12px 8px;text-align:center;font:inherit;color:inherit;cursor:pointer;min-height:132px}
.bg56 .ic{display:block;font-size:34px;line-height:1.1}.bg56 b{display:block;font-size:16px;margin:4px 0}.bg56 .st{display:block;font-size:14.5px;font-weight:700}
.bg56 .ok{border-color:#2e7d32;background:#f1f8f1}.bg56 .ok .st{color:#1b5e20}.bg56 .lock{background:#f3f3f3}.bg56 .lock .ic{filter:grayscale(1);opacity:.45}.bg56 .lock b{color:#555}.bg56 .lock .st{color:#555}
.bd56{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-end;justify-content:center}.bd56>div{background:#fff;color:#222;border-radius:18px 18px 0 0;padding:18px 18px 28px;width:100%;max-width:520px;max-height:88vh;overflow:auto;box-sizing:border-box;font-size:17px;line-height:1.45}
.bd56 h3{margin:0 0 4px;font-size:22px}.bd56 .big{font-size:44px}.bd56 .tag{display:inline-block;font-weight:800;border-radius:999px;padding:3px 12px;font-size:15px}.bd56 .tag.ok{background:#e3f2e3;color:#1b5e20}.bd56 .tag.lock{background:#eee;color:#444}
.bd56 dt{font-weight:800;margin-top:12px;font-size:15px;color:#555}.bd56 dd{margin:2px 0 0}.bd56 .bar{height:12px;background:#eee;border-radius:6px;overflow:hidden;margin-top:6px}.bd56 .bar i{display:block;height:100%;background:#2e7d32}
.bd56 button.x{margin-top:16px;width:100%;font-size:17px;padding:12px;border-radius:12px;border:0;background:#2e7d32;color:#fff;font-weight:700}
#rw56{background:#fff;border:1px solid var(--line,#ddd);border-radius:12px;padding:12px;box-sizing:border-box}#rw56 h4{margin:4px 0 6px;font-size:16px}#rw56 .th{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#rw56 .th button,#rw56 .tl button{border:2px solid var(--line,#ddd);border-radius:12px;background:#fff;padding:6px;font:inherit;font-size:13.5px;color:inherit;line-height:1.25}#rw56 .th svg{width:100%;display:block;border-radius:6px;margin-bottom:4px}
#rw56 button.on{border-color:#2e7d32;box-shadow:0 0 0 2px #2e7d3233}#rw56 button[disabled]{opacity:.55;background:#f3f3f3}#rw56 .tl{display:flex;flex-wrap:wrap;gap:8px}#rw56 .tl button{padding:8px 10px}
html body.hs-set #home#home>#rw56{order:2}#home>#rw56{display:none}html body.hs-set #home#home>#rw56#rw56{display:block!important}
.ttl56{display:inline-block;margin-left:6px;font-size:12px;font-weight:700;color:#1b5e20;background:#e3f2e3;border-radius:999px;padding:1px 8px}
html.dark-mode .bg56 button,html.dark-mode .bd56>div,html.dark-mode #rw56,html.dark-mode #rw56 button{background:#262626;color:#eee}`;
function css(){ if($("bg56css")) return; const s=document.createElement("style"); s.id="bg56css"; s.textContent=CSS; document.head.appendChild(s); }
const fmtD=t=>new Date(t).toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"});
const prog=x=>{ const [h,n,one,many]=x.b.p(state().c); return x.b.id==="pr1000"?`${h} of ${n}`:`${h} of ${n} ${n===1?one:many}`; };
function grid(S){ return `<div class="bg56" id="bg56">${S.list.map((x,i)=>`<button type="button" data-i="${i}" class="${x.ok?"ok":"lock"}" aria-label="${E_(x.b.name)}: ${x.ok?"earned":"locked"}"><span class="ic">${x.b.i}</span><b>${E_(x.b.name)}</b><span class="st">${x.ok?"✓ Earned":`🔒 ${E_(prog(x))}`}</span></button>`).join("")}</div>`; }
function detail(i){ css(); const S=state(), x=S.list[i], b=x.b, c=S.c, [h,n]=b.p(c), pct=Math.min(100,Math.round(100*h/n));
  const d=document.createElement("div"); d.className="bd56"; d.id="bd56";
  d.innerHTML=`<div role="dialog" aria-label="${E_(b.name)}"><div class="big">${b.i}</div><h3>${E_(b.name)}</h3>${x.ok?`<span class="tag ok">✓ Earned${x.at?` on ${fmtD(x.at)}`:""}</span>`:`<span class="tag lock">🔒 Not earned yet</span>`}
   <dl><dt>What it's for</dt><dd>${E_(b.why)}</dd><dt>How to earn it</dt><dd>${E_(reqOf(b,c))}</dd>
   <dt>Your progress</dt><dd><b>${E_(prog(x))}</b>${b.note?`<br><small>${E_(b.note(c))}</small>`:""}<div class="bar"><i style="width:${pct}%"></i></div></dd>
   <dt>Reward</dt><dd>${rwText(b)}. ${x.ok?"Choose it in ⚙ Settings.":"Earn the badge to unlock it."}</dd></dl>
   <button type="button" class="x" id="bd56x">Close</button></div>`;
  document.body.appendChild(d); const close=()=>d.remove(); $("bd56x").onclick=close; d.onclick=e=>{ if(e.target===d) close(); }; }
function openXP(){ css(); const s=V42.stats(), S=state(), cur=s.cur, nx=s.next, pct=nx?Math.round(100*(s.xp-cur[0])/(nx[0]-cur[0])):100, n=S.list.filter(x=>x.ok).length;
  const d=V42._panel(`<h2>🏅 My level & badges</h2>
   <div class="card"><div class="v42lvl"><span class="big">${cur[2]}</span><div style="flex:1"><b style="font-size:19px">Level ${s.lvl}: ${cur[1]}</b><div class="v42bar"><i style="width:${pct}%"></i></div><small style="font-size:14px">${s.xp} XP${nx?` · ${nx[0]-s.xp} XP to level ${s.lvl+1} (${nx[1]})`:" · top level!"}</small></div></div></div>
   <div class="card"><h3 style="margin:0 0 4px">Badges: ${n} of ${B.length} earned</h3><p class="sub" style="margin:0 0 10px;font-size:15px">Tap a badge to see what earns it, your progress and what it unlocks.</p>${grid(S)}</div>
   <div class="card"><h3 style="margin:0 0 4px">🎨 Rewards</h3><p class="sub" style="margin:0;font-size:15px">Badges unlock board colours and titles for your player card. Choose them in ⚙ Settings.</p><button class="v42b full" id="bg56set" style="margin-top:8px">Open Settings</button></div>
   <div class="card"><h3 style="margin:0 0 6px">How to earn XP</h3><p class="sub" style="margin:0;font-size:15px">• 10 XP for each puzzle, drill or check you do<br>• 50 XP for each Learn the basics topic<br>• 25 XP for each game you review<br>• 15 XP for each day you train<br>• 30 XP for each puzzle of the day<br>• 40 XP × bot level when you beat the bot</p></div>`);
  d.querySelectorAll("#bg56 [data-i]").forEach(b=>b.onclick=()=>detail(+b.dataset.i));
  $("bg56set").onclick=()=>{ V42._close(); window.CRHome&&CRHome.setMode("set",true); }; }
const mini=(l,dk)=>{ let r=""; for(let y=0;y<4;y++) for(let x=0;x<4;x++) r+=`<rect x="${x*10}" y="${y*10}" width="10" height="10" style="fill:${(x+y)%2?dk:l}"/>`; return `<svg viewBox="0 0 40 40">${r}</svg>`; };
function settings(){ const hm=$("home"); if(!hm||!document.body.classList.contains("hs-set")) return; css(); const S=state(), okB=earnedBoards(S), okT=earnedTitles(S), th=LS.get(KTH,"classic"), tt=title();
  const need=id=>{ const x=B.find(b=>b.rw.board===id||b.rw.title===id); return x?x.name:""; };
  const h=`<h3 style="margin:0 0 2px">🎨 Board colour & title</h3><small style="color:var(--mute,#666);font-size:13.5px">Earn badges to unlock more. Locked ones show the badge you need.</small>
   <h4>Board colour</h4><div class="th">${Object.entries(THEMES).map(([id,t])=>{ const ok=okB.includes(id); return `<button type="button" data-th="${id}" class="${id===th?"on":""}" ${ok?"":"disabled"} aria-label="${t[0]}${ok?"":" (locked)"}">${mini(t[1],t[2])}${ok?(id===th?"✓ ":"")+t[0]:`🔒 ${t[0]}<br><small>Badge: ${E_(need(id))}</small>`}</button>`; }).join("")}</div>
   <h4>Title on your player card</h4><div class="tl"><button type="button" data-tt="" class="${tt?"":"on"}">${tt?"":"✓ "}No title</button>${B.filter(b=>b.rw.title).map(b=>{ const ok=okT.includes(b.rw.title); return `<button type="button" data-tt="${E_(b.rw.title)}" class="${tt===b.rw.title?"on":""}" ${ok?"":"disabled"}>${ok?(tt===b.rw.title?"✓ ":"")+E_(b.rw.title):`🔒 ${E_(b.rw.title)}<br><small>Badge: ${E_(b.name)}</small>`}</button>`; }).join("")}</div>`;
  let c=$("rw56"); if(!c){ c=document.createElement("div"); c.id="rw56"; const g=$("gl55"); g&&g.parentNode===hm?g.after(c):hm.insertBefore(c,hm.firstChild); }
  if(c.dataset.h===h) return; c.dataset.h=h; c.innerHTML=h;
  c.querySelectorAll("[data-th]:not([disabled])").forEach(b=>b.onclick=()=>{ LS.set(KTH,b.dataset.th); V42.applyTheme(); settings(); window.V42&&V42.toast("Board colour changed."); });
  c.querySelectorAll("[data-tt]:not([disabled])").forEach(b=>b.onclick=()=>{ LS.set(KT,b.dataset.tt); settings(); bar(); }); }
function bar(){ const t=title(); document.querySelectorAll(".ub16>span").forEach(s=>{ let e=s.querySelector(".ttl56"); if(!t){ if(e) e.remove(); return; } if(!e){ e=document.createElement("span"); e.className="ttl56"; s.appendChild(e); } if(e.textContent!==t) e.textContent=t; }); }
function boot(){ css(); if(!window.V42) return setTimeout(boot,100); V42.openXP=openXP; fixLocked();
  let q=0; const tick=()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; try{ settings(); bar(); }catch(e){ console.warn(e); } }); };
  new MutationObserver(tick).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]}); tick(); }
window.CRBadges={B,state,counts,title,openXP:()=>openXP(),detail};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
