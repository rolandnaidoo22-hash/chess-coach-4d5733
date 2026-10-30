/* v64: Think out loud (bot games) + Tilt guard and Mood check. Our own words. */
(function(){ "use strict"; if(window.CRMind64) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const LG=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, LS=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const CH=()=>(window.ChessLib&&ChessLib.Chess)||window.Chess, PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"}, VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const KT="chessReview.v64.thinkAloud", KB="chessReview.v64.botlog", KP="chessReview.v64.plans", KTG="chessReview.v64.tilt";
/* ================= Think out loud ================= */
const CHIPS=[["attk","⚔️ Attack the king"],["attp","🎯 Attack a piece"],["def","🛡 Defend"],["dev","🚀 Develop"],["trade","🔁 Trade"],["unsure","🤷 Not sure"]];
const CAT={attk:"attack",attp:"attack",def:"defend",dev:"develop",trade:"trade",unsure:"unsure"}, CATW={attack:"attack",defend:"defend",develop:"develop your pieces",trade:"trade pieces",calm:"improve a piece calmly",unsure:"(not sure)"};
const on=()=>LG(KT,0)===1;
function attach(G){ G.tol={plans:[],cur:null,turnAt:null,times:[]}; const r=$("b52grd"); if(!r) return; const b=document.createElement("button"); b.className="bt"; b.id="b64tol"; r.parentNode.appendChild(b);
  const lab=()=>{ b.textContent=on()?"💭 Think out loud: On":"💭 Think out loud: Off"; b.setAttribute("aria-pressed",String(on())); b.classList.toggle("go",on()); };
  lab(); b.onclick=()=>{ LS(KT,on()?0:1); lab(); window.CRBots&&CRBots._game()===G&&draw(G); }; }
function draw(G){ if(!G||!G.tol) return; const g=G.g, mine=!G.thinking&&!g.isGameOver()&&g.turn()===G.me;
  if(mine&&G.tol.turnAt==null) G.tol.turnAt=Date.now();
  const el=$("b52ask"); if(!el||!on()||!mine||G.warn) return; const c=G.tol.cur;
  el.innerHTML=c?`<div class="tl64 done">💭 Plan: <b>${E_(CHIPS.find(x=>x[0]===c.plan)[1])}</b>${c.text?` · “${E_(c.text)}”`:""} <button type="button" id="tl64ch">change</button><small>Now make your move.</small></div>`
   :`<div class="tl64"><b>💭 What's your plan?</b><div class="tl64c">${CHIPS.map(([k,t])=>`<button type="button" data-p="${k}">${t}</button>`).join("")}</div><input id="tl64t" maxlength="80" placeholder="Add a few words (optional)" autocomplete="off"></div>`;
  if(c){ $("tl64ch").onclick=()=>{ G.tol.cur=null; draw(G); }; return; }
  el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ G.tol.cur={plan:b.dataset.p,text:($("tl64t").value||"").trim().slice(0,80)}; draw(G); }); }
function before(G,m){ if(!G||!G.tol) return; const g=G.g, now=Date.now(); if(G.tol.turnAt) G.tol.times.push((now-G.tol.turnAt)/1000); G.tol.turnAt=null;
  if(on()){ const c=G.tol.cur||{plan:"none",text:""}; G.tol.plans.push({i:g.history().length,uci:m.from+m.to+(m.promotion||""),plan:c.plan,text:c.text}); } G.tol.cur=null; }
function finish(G){ if(!G||!G.tol||G.tol.fin) return; G.tol.fin=1; const g=G.g, res=g.isCheckmate()?(g.turn()===G.me?0:1):.5, T=G.tol.times;
  const L=LG(KB,[]); L.push({t:Date.now(),r:res,spm:T.length?Math.round(T.reduce((a,b)=>a+b,0)/T.length*10)/10:null,n:T.length,bot:G.bot.name}); LS(KB,L.slice(-60));
  if(G.tol.plans.length){ const m=$("b52msg"); if(m){ const b=document.createElement("button"); b.className="bt go"; b.id="tl64cmp"; b.textContent="💭 How did my plans go?"; b.onclick=()=>compare(G); m.after(b); } }
  try{ refresh(); }catch(e){} }
const sqN=i=>"abcdefgh"[i%8]+(Math.floor(i/8)+1);
function needed(p){ const b=Patterns._board(p.fen_before), me=p.color, op=me==="w"?"b":"w";
  for(let i=0;i<64;i++){ const x=b[i]; if(!x||x.c!==me||!"nbrq".includes(x.t)) continue; const A=Patterns._attackers(b,op,i); if(!A.length) continue;
    const D=Patterns._attackers(b,me,i).length, cheap=Math.min(...A.map(s=>VAL[b[s].t]||0)); if(!D||cheap<VAL[x.t]) return {c:"defend",why:`your ${PN[x.t]} was under attack`}; }
  if(p.best_uci){ try{ const g=new (CH())(p.fen_before), mv=g.move({from:p.best_uci.slice(0,2),to:p.best_uci.slice(2,4),promotion:p.best_uci[4]||"q"});
    if(mv&&(mv.captured||/[+#]/.test(mv.san))&&["miss","mistake","blunder"].includes(p.cls)) return {c:"attack",why:"there was a forcing move (a check or a capture) that won something"}; }catch(e){} }
  const n=+p.fen_before.split(" ")[5], home=me==="w"?{1:"n",6:"n",2:"b",5:"b"}:{57:"n",62:"n",58:"b",61:"b"}, left=Object.keys(home).filter(s=>b[s]&&b[s].c===me&&b[s].t===home[s]).length;
  if(n<=12&&left>=2) return {c:"develop",why:`${left} of your knights and bishops were still at home`};
  let mm=0,mo=0; b.forEach(x=>{ if(x&&x.t!=="k") x.c===me?mm+=VAL[x.t]:mo+=VAL[x.t]; }); if(mm-mo>=3) return {c:"trade",why:"you were ahead, and trading pieces makes a lead easier to keep"};
  return {c:"calm",why:"there was no urgent threat, so improving your worst piece was enough"}; }
const COST={blunder:"this move cost a lot",mistake:"this move cost a fair bit",miss:"a chance slipped by",inaccuracy:"a small slip"};
function rows(d,plans){ const P=d.plies; return plans.map(x=>{ const p=P[x.i]; if(!p) return null; const nd=needed(p), cat=CAT[x.plan]||"unsure", good=!COST[p.cls];
  const fit=cat==="unsure"||x.plan==="none"?(good?"ok":"miss"):cat===nd.c||(nd.c==="calm"&&cat!=="defend")?(good?"fit":"idea"):(good?"ok":"off");
  const mv=`Move ${Math.floor(x.i/2)+1}: ${p.san}`, cw=COST[p.cls]||"this move cost something", CW=cw[0].toUpperCase()+cw.slice(1);
  const said=x.plan==="none"?"You didn't pick a plan.":cat==="unsure"?"You weren't sure.":`You planned to ${CATW[cat]}${x.text?` (“${x.text}”)`:""}.`;
  const t={fit:`✅ Good match: the position needed you to ${CATW[nd.c]}, because ${nd.why}.`,idea:`🟡 Right idea, but ${cw}. The position needed you to ${CATW[nd.c]}, because ${nd.why}. Check the move itself next time.`,
    ok:`👍 The move was fine. The position mainly needed you to ${CATW[nd.c]}, because ${nd.why}.`,off:`🔴 The position needed you to ${CATW[nd.c]} instead, because ${nd.why}. ${CW}.`,
    miss:`🔴 ${CW}. The position needed you to ${CATW[nd.c]}, because ${nd.why}.`}[fit];
  return {i:x.i,mv,plan:x.plan,text:x.text,said,needed:nd.c,why:nd.why,fit,line:t,cls:p.cls}; }).filter(Boolean); }
async function compare(G){ try{ CRHome.setMode("app",true); }catch(e){} const g=G.g, C=CH(), c=new C(); g.history().forEach(s=>c.move(s));
  const me=G.me; c.header("White",me==="w"?"You":G.bot.name,"Black",me==="b"?"You":G.bot.name,"Result",g.isCheckmate()?(g.turn()==="w"?"0-1":"1-0"):"1/2-1/2","Date",new Date().toISOString().slice(0,10).replace(/-/g,"."));
  const pgn=c.pgn(), plans=G.tol.plans.slice(), bot=G.bot.name, p=CR52.show("tl64");
  p.innerHTML=`<h2>💭 Your plans vs ${E_(bot)}</h2><div id="tl64o">${window.CRMem?CRMem.loader("Checking each move…"):"Checking each move…"}</div>`;
  let d; for(let w=0;ReviewApp.isRunning()&&w<240;w++){ if(w===2&&$("tl64o")) $("tl64o").insertAdjacentHTML("beforeend",`<p class="mute">Another game is being checked first. This starts right after.</p>`); await new Promise(r=>setTimeout(r,1000)); }
  try{ ReviewApp.setRunning(true); const eng=await ReviewApp.getEngine(); d=await Analyzer.analyzeGame(pgn,{engine:eng,username:"You",side:me,mode:"quick",cancelled:()=>false},()=>{}); d.meta.pgn=pgn; }catch(e){ $("tl64o").innerHTML=`<p>Couldn't check this game: ${E_(e.message)}</p>`; return; }finally{ ReviewApp.setRunning(false); }
  const R=rows(d,plans); d.meta.plans64={}; R.forEach(r=>d.meta.plans64[r.i]={plan:r.plan,text:r.text,fit:r.fit,needed:r.needed,line:r.line});
  const rec={id:"tl"+Date.now(),at:Date.now(),bot,me,pgn,rows:R}; const L=LG(KP,[]); L.unshift(rec); LS(KP,L.slice(0,10)); render(rec,d); ask(rec); return rec; }
function render(rec,d){ const o=$("tl64o"); if(!o) return; const n=rec.rows.filter(r=>r.fit==="fit"||r.fit==="ok").length;
  o.innerHTML=`<p class="mute">${rec.rows.length} plan${rec.rows.length>1?"s":""} · ${n} worked out well. Short and plain: what you said, and what the position needed.</p>
   <ol class="tl64r">${rec.rows.map(r=>`<li class="${r.fit}"><b>${E_(r.mv)}</b><span>${E_(r.said)}</span><span>${E_(r.line)}</span></li>`).join("")}</ol>
   <div class="card"><b>🧑‍🏫 Coach</b><div id="tl64ai">${window.CRMem?CRMem.loader("Coach is thinking…"):"…"}</div></div>
   ${d?`<button type="button" class="bs64go" id="tl64rv">📋 Open this game in Review</button>`:""}`;
  const b=$("tl64rv"); if(b) b.onclick=()=>{ try{ CR52.closeAll(); CRHome.setMode("review",true); loadData(d); CRRev59&&CRRev59.setTab("moves"); }catch(e){ console.error(e); } }; }
async function ask(rec){ const el=()=>$("tl64ai"); const local=rec.rows.filter(r=>r.fit!=="fit"&&r.fit!=="ok").slice(0,2).map(r=>r.mv+": "+r.line).join(" ")||"Your plans matched what the positions needed. Keep saying your plan before each move.";
  const body={mode:"chat",msgs:[{r:"u",t:"I played a bot game and said my plan before each move. Compare what I planned with what each position needed, in plain words. Do not tell me exact best moves; tell me what to look for. End with one habit to practise."}],
    ctx:{type:"think_out_loud",bot:rec.bot,side:rec.me==="w"?"White":"Black",plans:rec.rows.slice(0,30).map(r=>({move:r.mv,said:r.said,needed:r.needed,why:r.why,result:r.fit,cost:r.cls}))}};
  try{ if(window.CRMem){ const m=CRMem.summary(); if(m.length) body.memory=m; } }catch(e){}
  let a=null; try{ const r=await fetch(window.CR59_URL||"https://chess-coach-grok.chess-review.workers.dev",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); const j=await r.json(); if(r.ok&&j.report) a=j.report; }catch(e){}
  const txt=a||local; if(el()) el().innerHTML=a?(window.Coach17&&Coach17._md?Coach17._md(a):E_(a)):`<p>${E_(local)}</p><p class="mute">(The coach couldn't be reached, so this is the app's own summary.)</p>`;
  try{ window.CRMem&&CRMem.add({kind:"plan",q:"Think out loud vs "+rec.bot,a:txt,game:new Date(rec.at).toISOString().slice(0,10)+" vs "+rec.bot}); }catch(e){} rec.coach=txt; const L=LG(KP,[]); if(L[0]&&L[0].id===rec.id){ L[0].coach=txt.slice(0,2000); LS(KP,L); } }
/* plan line on the review board when the game has plans */
const os=window.show; if(typeof os==="function") window.show=show=function(){ const r=os.apply(this,arguments); try{ const P64=DATA&&DATA.meta&&DATA.meta.plans64, el=$("mv63"); if(P64&&el&&cur>0&&P64[cur-1]){ const x=P64[cur-1]; el.insertAdjacentHTML("beforeend",`<div class="tl64rv ${x.fit}">💭 ${E_(x.line)}</div>`); } }catch(e){} return r; };
/* ================= Tilt guard + Mood check ================= */
const tg=()=>Object.assign({on:true,dis:0},LG(KTG,{}));
function results(){ const out=[]; try{ (LG("chessReview.v56.charts.games",{}).games||[]).forEach(g=>{ if(g.t&&g.r!=null) out.push({t:+g.t,r:+g.r,src:"online"}); }); }catch(e){}
  LG(KB,[]).forEach(g=>out.push({t:g.t,r:g.r,spm:g.spm,src:"bot"})); return out.sort((a,b)=>a.t-b.t); }
function state(){ const R=results(), now=Date.now(), last=R[R.length-1]; let streak=0; for(let i=R.length-1;i>=0&&R[i].r===0;i--) streak++;
  const T=R.filter(x=>x.spm!=null), med=(()=>{ const s=T.slice(0,-1).map(x=>x.spm).sort((a,b)=>a-b); return s.length>=4?s[Math.floor(s.length/2)]:null; })();
  const l2=T[T.length-1], prev=l2?R[R.indexOf(l2)-1]:null, fast=!!(med&&l2&&prev&&prev.r===0&&l2.spm<0.6*med&&l2===last);
  const recent=last&&now-last.t<6*3600e3, S=tg();
  const why=streak>=3?"three":streak>=2?"two":fast?"fast":null, active=!!(S.on&&recent&&why&&S.dis!==last.t);
  return {R,last,streak,fast,med,why,active,on:S.on,last5:R.slice(-5)}; }
const MSG={three:"Three tough games in a row. That happens to every player. A short reset often helps the next game go better.",two:"Two tough games in a row. Want a quick reset before the next one?",fast:"Your last game went a lot quicker than you usually play. A calm minute can help you see more on the board."};
function card(where){ const s=state(); if(!s.active) return ""; return `<div class="card tg64" id="tg64${where||""}" role="status"><b>🌿 Quick reset?</b><p>${MSG[s.why]}</p>
  <div class="tg64b"><button type="button" data-tg="break">☕ 5-minute break</button><button type="button" data-tg="calm">🧩 2-minute calm puzzles</button><button type="button" data-tg="no">Not now</button></div>
  <a href="#" data-tg="off" class="tg64off">Turn off these reminders</a></div>`; }
function wire(root){ root.querySelectorAll("[data-tg]").forEach(b=>b.onclick=e=>{ e.preventDefault(); const k=b.dataset.tg, S=tg(), s=state();
  if(k==="no"){ S.dis=s.last&&s.last.t; LS(KTG,S); refresh(); } else if(k==="off"){ S.on=false; LS(KTG,S); refresh(); } else if(k==="on"){ S.on=true; S.dis=0; LS(KTG,S); refresh(); }
  else if(k==="break") brk(); else if(k==="calm") calm(); else if(k==="open"){ const c=$("mood64c"); if(c){ c.hidden=!c.hidden; } } }); }
function moodHtml(){ const s=state(); if(!s.on) return `<div class="mood64" id="mood64"><span>🌤 Mood check is off.</span><a href="#" data-tg="on">Turn on</a></div>`;
  const dots=s.last5.map(x=>x.r===1?"✅":x.r===0?"❌":"➖").join(""), msg=s.active?"a few tough games lately":"things look steady";
  return `<div class="mood64 ${s.active?"warm":""}" id="mood64"><span>${s.active?"🌧":"🌤"} <b>Mood check:</b> ${msg}${dots?` <span class="mood64d" aria-label="last results">${dots}</span>`:""}</span>${s.active?`<a href="#" data-tg="open">Reset ideas</a>`:""}<div id="mood64c" ${s.active?"hidden":"hidden"}>${card("h")}</div></div>`; }
function refresh(){ const g=$("hsG"); if(g){ let m=$("mood64"); const h=moodHtml(); if(m) m.outerHTML=h; else g.insertAdjacentHTML("afterbegin",h); wire($("mood64")); }
  const bl=$("tg64b"); if(bl){ const c=card("b"); if(c){ bl.outerHTML=c; wire($("tg64b")); } else bl.remove(); } }
setInterval(()=>{ const g=$("hsG"); if(g&&!$("mood64")) refresh(); },1000);
function gate(p){ const c=card("b"); if(!c||!p) return; p.insertAdjacentHTML("afterbegin",c); wire($("tg64b")); }
function overlay(html){ let d=$("tg64o"); if(d) d.remove(); d=document.createElement("div"); d.id="tg64o"; d.innerHTML=`<div class="s">${html}</div>`; document.body.appendChild(d); return d; }
let tmr=null; function brk(){ const end=Date.now()+5*60e3, d=overlay(`<h3>☕ Short break</h3><div class="tg64t" id="tg64t">5:00</div><p>Look away from the screen. Stand up, stretch, have some water. Breathe in for four, out for four.</p><button type="button" id="tg64e">I'm ready</button>`);
  clearInterval(tmr); const tick=()=>{ const s=Math.max(0,Math.round((end-Date.now())/1000)); const t=$("tg64t"); if(t) t.textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); if(!s||!t){ clearInterval(tmr); if(t) t.textContent="Done 🌿"; } }; tick(); tmr=setInterval(tick,1000);
  $("tg64e").onclick=()=>{ clearInterval(tmr); d.remove(); const S=tg(), s=state(); S.dis=s.last&&s.last.t; LS(KTG,S); refresh(); }; }
function calm(){ const T=(window.TFBANK&&TFBANK.main)||[], L=T.filter(x=>x.r&&x.r<=1000).sort(()=>Math.random()-.5).slice(0,6); let i=0, n=0; const end=Date.now()+2*60e3;
  const d=overlay(`<h3>🧩 Calm puzzles</h3><p class="mute" id="tg64ct">2:00 · no score, no rush</p><div class="bs64bd" id="tg64pb"></div><div id="tg64pm" class="bs64msg"></div><div class="bs64row"><button type="button" id="tg64nx">Next</button><button type="button" id="tg64e">Finish</button></div>`);
  const fin=()=>{ clearInterval(tmr); d.remove(); const S=tg(), s=state(); S.dis=s.last&&s.last.t; LS(KTG,S); refresh(); };
  const one=()=>{ const z=L[i%Math.max(1,L.length)]; if(!z){ $("tg64pm").textContent="Nice and easy. That's enough for now."; return; } const G=new (CH())(z.f), me=G.turn(), best=Object.keys(z.m||{}).filter(u=>z.m[u][0]==="b").map(u=>u.slice(0,4)); let ar=[];
    $("tg64pm").textContent=`You play ${me==="w"?"White":"Black"}. Take your time.`; const dr=Coach17._tapBoard($("tg64pb"),G,me,(f,q)=>{ if(best.includes(f+q)){ n++; ar=[{u:f+q,c:"#2f7d32"}]; $("tg64pm").textContent="✅ Nicely spotted."; } else $("tg64pm").textContent="Not that one. Slow look: what is loose?"; dr(); },()=>({arrows:ar})); };
  one(); $("tg64nx").onclick=()=>{ i++; one(); }; $("tg64e").onclick=fin;
  clearInterval(tmr); tmr=setInterval(()=>{ const s=Math.max(0,Math.round((end-Date.now())/1000)), t=$("tg64ct"); if(t) t.textContent=s?`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} · no score, no rush`:`Time's up · ${n} spotted. Ready when you are.`; if(!s) clearInterval(tmr); },1000); }
const st=document.createElement("style"); st.textContent=`
.tl64{border:1px solid var(--line,#ddd);border-radius:12px;padding:8px;background:#f4f8ff}.tl64c{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tl64c button{min-height:40px;border-radius:20px;border:1px solid #3b6fb6;background:#fff;color:#1e4f91;font:inherit;font-weight:700;font-size:14px;padding:0 12px}
.tl64 input{width:100%;box-sizing:border-box;min-height:40px;border-radius:10px;border:1px solid var(--line,#ccc);padding:0 10px;font:inherit}.tl64.done small{display:block;color:var(--mute,#666)}.tl64.done button{border:0;background:none;color:#3b6fb6;text-decoration:underline;font:inherit;min-height:32px}
.tl64r{padding-left:0;list-style:none}.tl64r li{border:1px solid var(--line,#ddd);border-left:6px solid #9aa;border-radius:10px;padding:8px 10px;margin:6px 0;display:flex;flex-direction:column;gap:3px;font-size:15px;background:#fff}.tl64r li.fit,.tl64r li.ok{border-left-color:#2f7d32}.tl64r li.idea{border-left-color:#e8b11b}.tl64r li.off,.tl64r li.miss{border-left-color:#c62828}
.tl64rv{font-size:13.5px;font-weight:600;margin-top:4px;padding:6px 8px;border-radius:8px;background:#f4f8ff;text-align:left}
.mood64{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;grid-column:1/-1;border:1px solid var(--line,#ddd);border-radius:12px;padding:8px 12px;background:#fff;font-size:14.5px}.mood64.warm{background:#f3f7ee;border-color:#cfe0bf}.mood64 a{font-weight:700;color:#3b6fb6;min-height:32px;display:inline-flex;align-items:center}.mood64 #mood64c{flex-basis:100%}.mood64d{letter-spacing:1px}
.tg64{background:#f3f7ee;border-color:#cfe0bf}.tg64b{display:grid;grid-template-columns:1fr 1fr;gap:6px}.tg64b button{min-height:46px;border-radius:12px;border:1px solid #7aa36b;background:#fff;font:inherit;font-weight:700}.tg64b button[data-tg=no]{grid-column:1/-1;border-color:var(--line,#ccc);color:var(--mute,#555)}.tg64off{display:inline-block;margin-top:8px;font-size:13px;color:var(--mute,#666)}
#tg64o{position:fixed;inset:0;z-index:9100;background:rgba(20,40,25,.55);display:flex;align-items:center;justify-content:center;padding:12px}#tg64o .s{background:#fff;border-radius:18px;padding:16px;max-width:460px;width:100%;max-height:92vh;overflow:auto;text-align:center}#tg64o button{min-height:46px;border-radius:12px;border:1px solid #7aa36b;background:#fff;font:inherit;font-weight:700;padding:0 16px}.tg64t{font-size:48px;font-weight:800;margin:8px 0}
html.dark-mode .mood64,html.dark-mode .tl64r li,html.dark-mode #tg64o .s,html.dark-mode .tl64{background:#262626;color:#eee}`; document.head.appendChild(st);
window.CRMind64={attach,draw,before,finish,compare,rows,needed,state,refresh,gate,card,brk,calm,_plans:()=>LG(KP,[])};
})();
