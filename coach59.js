/* v59: Ask coach: game picker, Review all (multi-game patterns), and a chat that uses the player's own games and stats. */
(function(){ "use strict"; if(window.CRAsk59) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const URL_=()=>window.CR59_URL||"https://chess-coach-grok.chess-review.workers.dev";
const MAXLEN=500, GAP=8000, PER_SESSION=20, KEEP=8, SK="chessReview.v59.chat";
const LG=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
function sess(){ try{ return Object.assign({msgs:[],sent:[],focus:null},JSON.parse(sessionStorage.getItem(SK)||"{}")); }catch(e){ return {msgs:[],sent:[],focus:null}; } }
function saveS(x){ try{ sessionStorage.setItem(SK,JSON.stringify(x)); }catch(e){} }
const cut=(s,n)=>String(s==null?"":s).replace(/<[^>]+>/g,"").slice(0,n);
function more(){ const C=LG("chessReview.v56.charts.games",null), n=C&&C.games?C.games.length:0; return n?`<p class="mute ac59more">${n} games synced from your account. Only games checked move by move can be reviewed here; tap <b>Check for new games</b> to check your newest ones. <b>Review all</b> and <b>Chat</b> use all of them.</p>`:""; }
function games(){ try{ return Coach17._games(); }catch(e){ return []; } }
function gameCtx(k,full){ try{ const p=Coach17._grokPayload(k); const o={date:p.date,opponent:cut(p.opponent,40),colour:p.colour,result:p.result,opening:cut(p.opening,60),accuracy:p.accuracy,
    mistakes:(p.mistakes||[]).slice(0,full?6:3).map(m=>({move:m.move,type:m.cls,what:cut(m.what,full?220:110)}))}; if(full){ o.phases=p.phases; o.pgn=cut(p.pgn,1800); } return o; }catch(e){ return null; } }
function ctx(focusK){ const C=LG("chessReview.v56.charts.games",null), G=C&&C.games||[], last=G.slice(-20), e=(G.slice().reverse().find(g=>g.e)||{}).e||null;
  let met=null; try{ met=window.CR58?CR58.metrics():null; }catch(x){} let goal=0; try{ goal=window.CRGoal?CRGoal.get():0; }catch(x){}
  const L=games(); const o={rating:e,goal:goal||null,recent:{games:last.length,won:last.filter(g=>g.r===1).length,drawn:last.filter(g=>g.r===.5).length,lost:last.filter(g=>g.r===0).length},
    trends:met?{checkedGames:met.n,hungPiecesPerGame:met.hung!=null?+met.hung.toFixed(2):null,accuracy:met.acc!=null?Math.round(met.acc):null,bigMistakesPerGame:{opening:+met.ph.o.toFixed(2),middlegame:+met.ph.m.toFixed(2),endgame:+met.ph.e.toFixed(2)}}:null,
    games:L.slice(0,8).map(g=>gameCtx(g.k,false)).filter(Boolean),
    synced:(()=>{ const A=LG("chessReview.v56.charts.an",{}); return G.slice(-12).reverse().map(g=>{ const a=A[g.id], o={date:new Date(g.t).toISOString().slice(0,10),opponent:cut(g.op,30),result:g.r===1?"Win":g.r===.5?"Draw":"Loss",rating:g.e||null,timeControl:g.tc}; if(a){ const c={o:0,m:0,e:0}; a.forEach(([p,f,l])=>{ if(l>=300&&c[f]!=null) c[f]++; }); o.bigMistakes={opening:c.o,middlegame:c.m,endgame:c.e}; } return o; }); })()};
  if(focusK!=null) o.focus=gameCtx(focusK,true); let j=JSON.stringify(o); while(j.length>9000&&(o.games.length>2||o.synced.length>4)){ if(o.synced.length>4) o.synced.pop(); else o.games.pop(); j=JSON.stringify(o); } return o; }
async function post(body){ const r=await fetch(URL_(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); let d=null; try{ d=await r.json(); }catch(e){}
  if(!r.ok||!d||!d.report) throw new Error(d&&d.error?d.error:"The coach could not answer right now ("+r.status+")."); return d.report; }
const md=t=>{ try{ return Coach17._md(t); }catch(e){ return E_(t).replace(/\n/g,"<br>"); } };
function open(view){ try{ window.CRHome&&CRHome.setMode("app",true); }catch(e){} try{ window.Coach17&&Coach17.hide(); }catch(e){} const p=U().show("ac59"); const L=games(), S=sess();
  p.innerHTML=`<h2>💬 Ask coach</h2>
   <div class="ac59tabs"><button data-v="pick" class="${view!=="chat"&&view!=="all"?"on":""}">Pick a game</button><button data-v="all" class="${view==="all"?"on":""}">Review all</button><button data-v="chat" class="${view==="chat"?"on":""}">Chat</button></div><div id="ac59b"></div>`;
  p.querySelectorAll(".ac59tabs [data-v]").forEach(b=>b.onclick=()=>open(b.dataset.v)); const B=$("ac59b");
  if(view==="all") return allView(B,L); if(view==="chat") return chatView(B,L,S);
  B.innerHTML=L.length?`<p class="mute">Your recent games. Tap one for a coach review of it.</p><div class="ac59list">${L.map(g=>`<button class="ac59g" data-k="${g.k}"><span class="ac59r ${g.res==="Win"?"w":g.res==="Draw"?"d":"l"}">${g.res==="Win"?"W":g.res==="Draw"?"D":"L"}</span><span><b>vs ${E_(g.opp)}</b><small>${E_(g.date)} · ${g.colour==="w"?"White":"Black"}${g.opening?" · "+E_(g.opening):""}</small></span><span class="ac59a">›</span></button>`).join("")}</div>
   ${more()}<button class="ac59sec" id="ac59sync">🔄 Check for new games</button>`
   :`<div class="card"><p>No checked games yet. Add your Chess.com username in Settings, or review a game with <b>Review a new game</b>, and it will appear here.</p></div><button class="ac59sec" id="ac59sync">🔄 Check for new games</button>`;
  B.querySelectorAll(".ac59g").forEach(b=>b.onclick=()=>{ try{ Coach17.open("gm",{k:+b.dataset.k}); }catch(e){ console.error(e); } });
  $("ac59sync").onclick=()=>sync(); if(SY.on) sync(true); }
const SY={on:false};
async function sync(watch){ const b=$("ac59sync"); if(!b) return; b.disabled=true; b.insertAdjacentHTML("afterend",`<p class="mute ac59st" id="ac59st">Checking Chess.com…</p>`);
  const tick=setInterval(()=>{ const t=$("ac59st"), x=Coach17._imp; if(t&&x&&x.txt) t.textContent=x.txt; },700);
  if(watch){ while(Coach17._imp&&Coach17._imp.running) await new Promise(r=>setTimeout(r,1000)); clearInterval(tick); SY.on=false; if($("ac59sync")) open("pick"); return; }
  SY.on=true; const before=games().length, have=new Set(games().map(g=>String(g.id||"").replace(/\/$/,"")));
  let r; try{ r=await Coach17.autoImport(true,{have}); }catch(e){} clearInterval(tick); SY.on=false;
  const msg=(Coach17._imp&&Coach17._imp.txt)||"";
  if(!$("ac59sync")) return; open("pick"); const nb=$("ac59sync"); if(!nb) return;
  nb.insertAdjacentHTML("afterend",`<p class="mute ac59st">${E_(r==="busy"?"Another game is being checked right now. Try again in a minute.":msg||(games().length>before?"New games added.":"No newer games found."))}</p>`); }
async function allView(B,L){ let met=null; try{ met=window.CR58?CR58.metrics():null; }catch(e){} if(L.length<3&&!met){ B.innerHTML=`<div class="card"><p>Review all needs at least 3 checked games. You have ${L.length}.</p></div>`; return; }
  const k="chessReview.v59.all", c=(()=>{ try{ return JSON.parse(sessionStorage.getItem(k)||"null"); }catch(e){ return null; } })();
  B.innerHTML=`<p class="mute">One report across your recent games${met?" ("+met.n+" with mistake checks)":""}: the habits that keep costing you, and what to work on.</p><button class="ac59big" id="ac59run">${c?"🔄 Make a new report":"📋 Review all my games"}</button><div id="ac59out" class="card ac59rep" ${c?"":"hidden"}>${c?md(c):""}</div>`;
  $("ac59run").onclick=async()=>{ const b=$("ac59run"), out=$("ac59out"); b.disabled=true; b.textContent="Reading your games… (up to a minute)"; out.hidden=false; out.innerHTML=`<p class="mute">Working…</p>`;
    try{ const t=await post({v:4,mode:"all",ctx:ctx(null)}); sessionStorage.setItem(k,JSON.stringify(t)); out.innerHTML=md(t); }catch(e){ out.innerHTML=`<p class="ac59err">${E_(e.message)}</p>`; } b.disabled=false; b.textContent="🔄 Make a new report"; }; }
function chatView(B,L,S){ const fo=S.focus, fg=fo!=null?L.find(g=>g.k===fo):null;
  B.innerHTML=`<div class="ac59ctx"><label>About: <select id="ac59f"><option value="">All my games</option>${L.map(g=>`<option value="${g.k}" ${g.k===fo?"selected":""}>${E_(g.date)} vs ${E_(g.opp)} (${g.res})</option>`).join("")}</select></label></div>
   <div class="ac59chat" id="ac59log">${S.msgs.length?S.msgs.map(m=>bubble(m)).join(""):`<p class="mute ac59hint">Ask anything about your chess. The coach reads your recent games and stats. Try: “Why do I keep losing in the middlegame?” or “What should I practise this week?”</p>`}</div>
   <form id="ac59form" class="ac59form"><textarea id="ac59in" maxlength="${MAXLEN}" rows="2" placeholder="Ask your coach…"></textarea><div class="ac59fr"><small id="ac59n">0/${MAXLEN}</small><button type="submit" class="ac59send" id="ac59send">Send</button></div></form>
   <p class="mute ac59lim">${PER_SESSION-S.sent.length} questions left this session. Chat history is kept until you close the app.</p>${S.msgs.length?`<button class="ac59sec" id="ac59clr">Clear chat</button>`:""}`;
  const log=$("ac59log"); log.scrollTop=log.scrollHeight;
  $("ac59f").onchange=e=>{ const x=sess(); x.focus=e.target.value===""?null:+e.target.value; saveS(x); };
  $("ac59in").oninput=e=>$("ac59n").textContent=e.target.value.length+"/"+MAXLEN;
  if($("ac59clr")) $("ac59clr").onclick=()=>{ const x=sess(); x.msgs=[]; saveS(x); open("chat"); };
  $("ac59form").onsubmit=async ev=>{ ev.preventDefault(); const x=sess(), t=$("ac59in").value.trim().slice(0,MAXLEN); if(!t) return;
    const now=Date.now(), lastT=x.sent[x.sent.length-1]||0, err=m=>{ log.insertAdjacentHTML("beforeend",`<p class="ac59err">${E_(m)}</p>`); log.scrollTop=log.scrollHeight; };
    if(x.sent.length>=PER_SESSION) return err("You've reached this session's limit of "+PER_SESSION+" questions. Come back later.");
    if(now-lastT<GAP) return err("Please wait a few seconds before sending again.");
    x.sent.push(now); x.msgs.push({r:"u",t}); saveS(x); $("ac59in").value=""; $("ac59n").textContent="0/"+MAXLEN;
    const h=log.querySelector(".ac59hint"); if(h) h.remove(); log.insertAdjacentHTML("beforeend",bubble({r:"u",t})+`<div class="ac59b c" id="ac59wait">…</div>`); log.scrollTop=log.scrollHeight; $("ac59send").disabled=true;
    try{ const a=await post({v:4,mode:"chat",ctx:ctx(x.focus),msgs:x.msgs.slice(-KEEP).map(m=>({r:m.r,t:cut(m.t,MAXLEN*2)}))}); const y=sess(); y.msgs.push({r:"c",t:a.slice(0,4000)}); saveS(y); $("ac59wait").outerHTML=bubble({r:"c",t:a}); }
    catch(e){ const y=sess(); y.msgs.pop(); saveS(y); $("ac59wait").outerHTML=`<p class="ac59err">${E_(e.message)}</p>`; }
    $("ac59send").disabled=false; log.scrollTop=log.scrollHeight; $("ac59form").nextElementSibling.textContent=`${PER_SESSION-sess().sent.length} questions left this session. Chat history is kept until you close the app.`; }; }
function bubble(m){ return `<div class="ac59b ${m.r==="u"?"u":"c"}">${m.r==="u"?E_(m.t).replace(/\n/g,"<br>"):md(m.t)}</div>`; }
const CSS=`#ac59 h2{margin:4px 0 8px}.ac59tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 0 10px}.ac59tabs button{min-height:44px;border-radius:10px;border:1px solid var(--line,#ddd);background:#fff;font:inherit;font-weight:700}.ac59tabs button.on{background:#3b6fb6;color:#fff;border-color:#3b6fb6}
.ac59list{display:flex;flex-direction:column;gap:6px}.ac59g{display:flex;align-items:center;gap:10px;min-height:56px;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff;padding:6px 10px;text-align:left;font:inherit;color:inherit}.ac59g span:nth-child(2){flex:1;min-width:0}.ac59g small{display:block;color:var(--mute,#666);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ac59a{font-size:22px;color:#3b6fb6}
.ac59r{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800}.ac59r.w{background:#2e7d32}.ac59r.d{background:#8a8a8a}.ac59r.l{background:#c62828}
.ac59sec{width:100%;min-height:44px;margin-top:10px;border-radius:10px;border:1px solid #3b6fb6;background:#fff;color:#3b6fb6;font:inherit;font-weight:700}.ac59big{width:100%;min-height:50px;border-radius:12px;border:0;background:#3b6fb6;color:#fff;font:inherit;font-weight:800}.ac59rep{margin-top:10px;font-size:15px}
.ac59ctx select{font:inherit;font-size:16px;min-height:44px;max-width:100%;border-radius:10px}.ac59chat{display:flex;flex-direction:column;gap:8px;max-height:55vh;overflow:auto;margin:8px 0;padding:4px}.ac59b{max-width:88%;padding:8px 11px;border-radius:14px;font-size:15px;line-height:1.4}.ac59b.u{align-self:flex-end;background:#3b6fb6;color:#fff;border-bottom-right-radius:4px}.ac59b.c{align-self:flex-start;background:#f0ede6;border-bottom-left-radius:4px}.ac59b p{margin:4px 0}
.ac59form textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;border-radius:12px;border:1px solid var(--line,#ccc);padding:10px}.ac59fr{display:flex;align-items:center;justify-content:space-between;gap:8px}.ac59send{min-height:44px;min-width:96px;border-radius:10px;border:0;background:#3b6fb6;color:#fff;font:inherit;font-weight:800}.ac59err{color:#b3261e;font-size:14px}.ac59lim{font-size:12.5px}
html.dark-mode .ac59g,html.dark-mode .ac59tabs button:not(.on),html.dark-mode .ac59sec{background:#262626;color:#eee}html.dark-mode .ac59b.c{background:#2a2a2a;color:#eee}`;
{ const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
window.CRAsk59={open,_ctx:ctx,_limits:{MAXLEN,GAP,PER_SESSION,KEEP}};
})();
