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
  try{ const u=m.from+m.to+(m.promotion||""), w=window.CRGuard&&CRGuard.check(g.fen(),u); if(w){ G.tol.bl=(G.tol.bl||0)+1; const v=w.k==="mate"?100:({q:9,r:5,b:3,n:3,p:1}[w.piece]||1); if(!G.tol.tp||v>G.tol.tp.v) G.tol.tp={v,fen:g.fen(),uci:u,k:w.k,piece:w.piece,sq:w.sq,side:G.me,move:Math.floor(g.history().length/2)+1}; } }catch(e){}
  if(on()){ const c=G.tol.cur||{plan:"none",text:""}; G.tol.plans.push({i:g.history().length,uci:m.from+m.to+(m.promotion||""),plan:c.plan,text:c.text}); } G.tol.cur=null; }
function finish(G){ if(!G||!G.tol||G.tol.fin) return; G.tol.fin=1; const g=G.g, res=g.isCheckmate()?(g.turn()===G.me?0:1):.5, T=G.tol.times;
  const L=LG(KB,[]); L.push({t:Date.now(),r:res,spm:T.length?Math.round(T.reduce((a,b)=>a+b,0)/T.length*10)/10:null,n:T.length,bl:G.tol.bl||0,mate:g.isCheckmate()&&res===0?1:0,h:new Date().getHours(),bot:G.bot.name,tp:res===0?G.tol.tp||null:null}); LS(KB,L.slice(-60));
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
  const mv=`Move ${Math.floor(x.i/2)+1}`, cw=COST[p.cls]||"this move cost something", CW=cw[0].toUpperCase()+cw.slice(1);
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
  let a=null; try{ const r=await fetch(window.CR59_URL||"https://chess-coach-grok.chess-review.workers.dev",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); const j=await r.json(); if(r.ok&&j.report) a=j.report; }catch(e){} if(a&&window.plainChess) a=plainChess(a);
  const txt=a||local; if(el()) el().innerHTML=a?(window.Coach17&&Coach17._md?Coach17._md(a):E_(a)):`<p>${E_(local)}</p><p class="mute">(The coach couldn't be reached, so this is the app's own summary.)</p>`;
  try{ window.CRMem&&CRMem.add({kind:"plan",q:"Think out loud vs "+rec.bot,a:txt,game:new Date(rec.at).toISOString().slice(0,10)+" vs "+rec.bot}); }catch(e){} rec.coach=txt; const L=LG(KP,[]); if(L[0]&&L[0].id===rec.id){ L[0].coach=txt.slice(0,2000); LS(KP,L); } }
/* plan line on the review board when the game has plans */
const os=window.show; if(typeof os==="function") window.show=show=function(){ const r=os.apply(this,arguments); try{ const P64=DATA&&DATA.meta&&DATA.meta.plans64, el=$("mv63"); if(P64&&el&&cur>0&&P64[cur-1]){ const x=P64[cur-1]; el.insertAdjacentHTML("beforeend",`<div class="tl64rv ${x.fit}">💭 ${E_(x.line)}</div>`); } }catch(e){} return r; };
/* ================= Tilt Guard (v64b): learns YOUR normal on this phone, from games finished in this app only. Nothing is sent anywhere. ================= */
const tg=()=>Object.assign({on:true,dis:0},LG(KTG,{}));
const med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s.length?s[Math.floor(s.length/2)]:null; }, avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const late=h=>h>=22||h<5, morning=h=>h>=5&&h<12;
/* v64c: also learns from the user's synced online games (read from this phone only). Clock times give seconds per move; games without clocks only count for wins/losses. */
function clk(pgn){ const out=[], re=/\[%clk (\d+):(\d+):(\d+(?:\.\d+)?)\]/g; let m; while((m=re.exec(pgn||""))) out.push(+m[1]*3600+ +m[2]*60+ +m[3]); return out; }
function online(){ let u=""; try{ u=JSON.parse(localStorage.getItem("chessReview.currentUser"))||""; }catch(e){ u=localStorage.getItem("chessReview.currentUser")||""; }
  const A=LG(`chessReview.u.${u}.coach.games.v1`,[]), out=[]; if(!Array.isArray(A)) return out;
  A.forEach(x=>{ try{ const d=x.data||{}, M=d.meta||{}, me=M.user_color, res=M.result; if(!me||!res) return;
    const r=res==="1/2-1/2"?0.5:((res==="1-0")===(me==="w")?1:0), pgn=M.pgn||"", hd=k=>{ const z=pgn.match(new RegExp(`\\[${k} "([^"]+)"\\]`)); return z&&z[1]; };
    const ed=hd("UTCDate")||hd("EndDate"), et=hd("EndTime")||hd("UTCTime"); let t=(+x.t||0)*1000; if(ed&&et){ const z=Date.parse(ed.replace(/\./g,"-")+"T"+et+"Z"); if(z) t=z; }
    const tc=String(M.time_control||hd("TimeControl")||""), inc=+(tc.split("+")[1]||0), P=(d.plies||[]).filter(p=>p.user), n=P.length;
    const bl=P.filter(p=>p.cls==="blunder").length, C=clk(pgn); let spm=null;
    if(!tc.includes("/")&&C.length>=10){ const o=me==="w"?0:1, mine=C.filter((_,i)=>i%2===o), dt=[]; for(let i=1;i<mine.length;i++) dt.push(Math.max(0,mine[i-1]-mine[i]+inc)); if(dt.length>=5) spm=Math.round(avg(dt)*10)/10; }
    const lost=r===0, mate=lost&&/checkmate/i.test(M.termination||""), top=(d.summary&&d.summary.top||[]).map(q=>(d.plies||[]).find(p=>p.ply===q.ply)).find(p=>p&&p.user);
    out.push({t,r,spm,n,bl:n?bl:null,mate:mate?1:0,h:new Date(t).getHours(),src:"on",tc,bot:M.white&&M.black?(me==="w"?M.black:M.white):"",tp:lost&&top?{fen:top.fen_before,uci:top.uci,side:me,k:"online"}:null}); }catch(e){} });
  return out; }
function all(){ return LG(KB,[]).filter(g=>g&&g.n>=5&&g.spm!=null).map(g=>Object.assign({src:"app"},g)).concat(online()).sort((a,b)=>a.t-b.t); }
const key=g=>g.src==="on"?"on:"+g.tc:"app";
/* "right after" = the next game started within 2 hours; a game long after a loss counts as calm */
const soon=(a,b)=>!!(a&&b&&b.t-a.t<2*3600e3), afterLoss=(G,i)=>i>0&&G[i-1].r===0&&soon(G[i-1],G[i]);
function bases(G){ const B={}; G.forEach((g,i)=>{ const k=key(g); B[k]=B[k]||{c:[]}; if(g.spm!=null&&g.n>=5&&!afterLoss(G,i)&&!late(g.h==null?12:g.h)) B[k].c.push(g); });
  for(const k in B){ const c=B[k].c; B[k]=c.length<3?{ready:false,calm:c.length}:{ready:true,calm:c.length,spm:med(c.map(g=>g.spm)),rate:avg(c.filter(g=>g.bl!=null).map(g=>g.bl/g.n))||0}; } return B; }
/* each game measured against the player's own normal for that kind of game */
function norm(G){ const B=bases(G); G.forEach(g=>{ const b=B[key(g)]; g.ps=b&&b.ready&&g.spm!=null?g.spm/b.spm:null; g.rr=b&&b.ready&&g.bl!=null&&g.n?g.bl/g.n-b.rate:null; }); return B; }
function games(){ return all().filter(g=>g.src==="app"); }
function baseline(G){ const B=bases(G||all()); return B.app||{ready:false,calm:0}; }
function rushed(g,B){ const b=B[key(g)]; return !!(b&&b.ready&&g.spm!=null&&g.bl!=null&&g.spm<=0.6*b.spm&&(g.bl/g.n)>=b.rate+Math.max(0.05,b.rate*0.5)); }
function state(){ const G=all(), B=bases(G), last=G[G.length-1], prev=G[G.length-2], S=tg(), now=Date.now();
  const hit=!!(last&&prev&&prev.r===0&&soon(prev,last)&&rushed(last,B)), recent=!!(last&&now-last.t<6*3600e3);
  const active=!!(S.on&&hit&&recent&&S.dis!==last.t);
  return {G,B,last,prev,hit,active,on:S.on,why:hit?"rushed":null,last5:G.slice(-5)}; }
const MSG="You look rushed right now. Your last few moves were much faster than usual. Take five minutes first.";
function card(where){ const s=state(); if(!s.active) return ""; return `<div class="card tg64" id="tg64${where||""}" role="status"><b>🌿 A calm moment first?</b><p>${MSG}</p>
  <div class="tg64b"><button type="button" data-tg="calm">🧩 Try one calm puzzle</button><button type="button" data-tg="tp">🔎 Look at that one turning point</button><button type="button" data-tg="play">▶ Play again anyway</button></div>
  <a href="#" data-tg="off" class="tg64off">Turn off these reminders</a></div>`; }
function dismiss(){ const S=tg(), s=state(); S.dis=s.last&&s.last.t; LS(KTG,S); refresh(); }
function wire(root){ if(!root) return; root.querySelectorAll("[data-tg]").forEach(b=>b.onclick=e=>{ e.preventDefault(); const k=b.dataset.tg, S=tg();
  if(k==="play") dismiss(); else if(k==="off"){ S.on=false; LS(KTG,S); refresh(); } else if(k==="on"){ S.on=true; S.dis=0; LS(KTG,S); refresh(); }
  else if(k==="calm") calm(); else if(k==="tp") turning(); else if(k==="diary") diary(); else if(k==="open"){ const c=$("mood64c"); if(c) c.hidden=!c.hidden; } }); }
function moodHtml(){ const s=state(); if(!s.on) return `<div class="mood64" id="mood64"><span>🌤 Mood check is off.</span><a href="#" data-tg="on">Turn on</a> <a href="#" data-tg="diary">My Tilt Diary</a></div>`;
  return `<div class="mood64 ${s.active?"warm":""}" id="mood64"><span>${s.active?"🌿 <b>Mood check:</b> you look a bit rushed":"🌤 <b>Mood check:</b> things look steady"}</span>${s.active?`<a href="#" data-tg="open">Calm choices</a>`:""}<a href="#" data-tg="diary">My Tilt Diary</a><div id="mood64c" hidden>${card("h")}</div></div>`; }
function refresh(){ const g=$("hsG"); if(g){ const m=$("mood64"), h=moodHtml(); if(m) m.outerHTML=h; else g.insertAdjacentHTML("afterbegin",h); wire($("mood64")); }
  const bl=$("tg64b"); if(bl){ const c=card("b"); if(c){ bl.outerHTML=c; wire($("tg64b")); } else bl.remove(); } }
setInterval(()=>{ const g=$("hsG"); if(g&&!$("mood64")) refresh(); },1000);
function gate(p){ const c=card("b"); if(!c||!p) return; p.insertAdjacentHTML("afterbegin",c); wire($("tg64b")); }
function overlay(html){ let d=$("tg64o"); if(d) d.remove(); d=document.createElement("div"); d.id="tg64o"; d.innerHTML=`<div class="s">${html}</div>`; document.body.appendChild(d); return d; }
/* one calm puzzle: no timer, no rating, no score */
function calm(){ const T=(window.TFBANK&&TFBANK.main)||[], L=T.filter(x=>x.r&&x.r<=900), z=L[Math.floor(Math.random()*L.length)];
  const d=overlay(`<h3>🧩 One calm puzzle</h3><p class="mute">Take all the time you like.</p><div class="bs64bd" id="tg64pb"></div><div id="tg64pm" class="bs64msg"></div><div class="bs64row"><button type="button" id="tg64sh">Show me</button><button type="button" id="tg64e">Close</button></div>`);
  $("tg64e").onclick=()=>d.remove(); if(!z){ $("tg64pm").textContent="No puzzle found on this phone."; return; }
  const G=new (CH())(z.f), me=G.turn(), best=Object.keys(z.m||{}).filter(u=>z.m[u][0]==="b").map(u=>u.slice(0,4)); let ar=[];
  $("tg64pm").textContent=`You play ${me==="w"?"White":"Black"}. Look at every capture first.`;
  const dr=Coach17._tapBoard($("tg64pb"),G,me,(f,q)=>{ if(best.includes(f+q)){ ar=[{u:f+q,c:"#2f7d32"}]; $("tg64pm").textContent="✅ Nicely spotted. Ready when you are."; } else $("tg64pm").textContent="Not that one. Slow look: what is loose?"; dr(); },()=>({arrows:ar}));
  $("tg64sh").onclick=()=>{ ar=[{u:best[0],c:"#2f7d32"}]; $("tg64pm").textContent="Here it is. Ready when you are."; dr(); }; }
/* the one moment that mattered in the game you just lost */
function turning(){ const G=all(), L=G.slice().reverse().find(g=>g.r===0&&g.tp), d0=L&&L.tp;
  if(!d0){ overlay(`<h3>🔎 Turning point</h3><p>No single big moment was saved for your last loss. It was a close game.</p><button type="button" id="tg64e">Close</button>`); $("tg64e").onclick=()=>$("tg64o").remove(); return; }
  const mvP=(()=>{ try{ const g=new (CH())(d0.fen), m=g.move({from:d0.uci.slice(0,2),to:d0.uci.slice(2,4),promotion:d0.uci[4]||"q"}); return PN[m.piece]; }catch(e){ return "piece"; } })();
  const line=d0.k==="online"?`Here, moving your ${mvP} was the moment this game turned. Before moving, check what your opponent can take or attack next.`:d0.k==="mate"?`Here, moving your ${mvP} let your opponent give checkmate. Before moving, look at every check they could give.`:(PN[d0.piece]===mvP&&d0.sq===d0.uci.slice(2,4))?`Here, your ${mvP} moved to a square where it could be taken for free.`:`Here, moving your ${mvP} left your ${PN[d0.piece]||"piece"} where it could be taken for free.`;
  const d=overlay(`<h3>🔎 That one turning point</h3><p class="mute">From your ${L.src==="on"?"online ":""}game against ${E_(L.bot||"the bot")}</p><div class="bs64bd">${CR52.mini(d0.fen,d0.side||"w",{arrows:[{u:d0.uci,c:"#d32f2f"}],hl:d0.sq?[{sq:d0.sq,c:"#f5a623",o:.6}]:[]})}</div><p class="tg64line">${E_(line)}</p><button type="button" id="tg64e">Close</button>`);
  $("tg64e").onclick=()=>d.remove(); }
/* My Tilt Diary: only patterns with at least 3 games behind them */
/* My Tilt Diary: only patterns with at least 3 games behind them */
function diary(){ try{ CRHome.setMode("app",true); }catch(e){} const p=CR52.show("td64"), G=all(), B=norm(G), MIN=3, lines=[];
  const nApp=G.filter(g=>g.src==="app").length, nOn=G.filter(g=>g.src==="on").length, noClk=G.filter(g=>g.src==="on"&&g.spm==null).length;
  const after=f=>G.filter((g,i)=>i>0&&soon(G[i-1],g)&&f(G[i-1],i)), P=L=>L.filter(g=>g.ps!=null), R=L=>L.filter(g=>g.rr!=null);
  const chk=(L,fast,loose)=>{ const a=P(L), b=R(L); if(a.length>=MIN&&med(a.map(g=>g.ps))<=0.75) lines.push(["⏩",fast,a.length]); else if(b.length>=MIN&&avg(b.map(g=>g.rr))>=0.04) lines.push(["⭕",loose,b.length]); };
  chk(after(q=>q.r===0&&q.mate),"You rush most after a checkmate loss. Your next game is usually much quicker than your normal pace.","After a checkmate loss, your next game usually has more big mistakes than normal.");
  chk(after((q,i)=>q.r===0&&i>1&&G[i-2].r===0&&soon(G[i-2],q)),"After two losses in a row, you play much faster than usual.","After two losses in a row, your next game usually has more big mistakes than normal.");
  chk(after(q=>q.r===0&&!q.mate),"After a loss, your next game tends to be quicker than usual.","After a loss, your next game usually has more big mistakes than normal.");
  chk(after(q=>q.r===1),"After a win, you tend to speed up in the next game.","After a win, your next game usually has more big mistakes than normal.");
  const rm=L=>avg(R(L).map(g=>g.rr)), LN=G.filter(g=>late(g.h)), DY=G.filter(g=>!late(g.h));
  if(R(LN).length>=MIN&&R(DY).length>=MIN&&rm(LN)>=rm(DY)+0.04) lines.push(["🌙","Late at night, you make more big mistakes than in the daytime.",R(LN).length]);
  else if(P(LN).length>=MIN&&P(DY).length>=MIN&&med(P(LN).map(g=>g.ps))<=0.75*med(P(DY).map(g=>g.ps))) lines.push(["🌙","Late at night, you play much faster than in the daytime.",P(LN).length]);
  const MO=G.filter(g=>morning(g.h)), OT=G.filter(g=>!morning(g.h)), wr=L=>avg(L.map(g=>g.r));
  if(MO.length>=MIN&&OT.length>=MIN&&wr(MO)>wr(OT)+0.15&&(P(MO).length<MIN||P(OT).length<MIN||med(P(MO).map(g=>g.ps))>=med(P(OT).map(g=>g.ps)))) lines.push(["🌅","Your best games are in the morning, when you take your time.",MO.length]);
  const pace=(k,label)=>{ const b=B[k]; if(!b) return ""; if(!b.ready) return `<li>${label}: play a few more calm games (${b.calm} of 3 so far) so the app can learn your normal pace.</li>`; const per=b.rate>0?Math.round(1/b.rate):null;
    return `<li>${label}: about ${Math.round(b.spm)} seconds a move in a calm game${per?`, with a big mistake about once every ${per} moves`:", with very few big mistakes"}.</li>`; };
  const tcName=tc=>{ const m=+String(tc).split("+")[0]; return m?`${Math.round(m/60)}-minute online games`:"online games"; };
  const paces=[pace("app","Games in this app")].concat(Object.keys(B).filter(k=>k.startsWith("on:")).map(k=>pace(k,tcName(k.slice(3))))).join("");
  p.innerHTML=`<h2>📓 My Tilt Diary</h2><p class="mute">Built from ${nApp} game${nApp===1?"":"s"} you finished in this app and ${nOn} online game${nOn===1?"":"s"} you synced. It stays on this phone and works offline.</p>
   ${noClk?`<p class="mute">${noClk} online game${noClk===1?" has":"s have"} no clock times, so ${noClk===1?"it only counts":"they only count"} for wins and losses.</p>`:""}
   <div class="card"><b>Your normal pace</b>${paces?`<ul class="td64p">${paces}</ul>`:`<p>Play a few more calm games so the app can learn your normal pace.</p>`}</div>
   <div class="card"><b>What the app has noticed</b>${lines.length?`<ul class="td64l">${lines.map(([i,t,n])=>`<li><span>${i}</span><span>${E_(t)}<small>Seen in ${n} games</small></span></li>`).join("")}</ul>`:`<p>No clear pattern yet. A pattern only shows up here after it has happened in at least ${MIN} games.</p>`}</div>
   <div class="card td64set"><span>Calm reminders: <b>${tg().on?"On":"Off"}</b></span><a href="#" data-tg="${tg().on?"off":"on"}">${tg().on?"Turn off":"Turn on"}</a></div>`;
  wire(p); p.querySelectorAll("[data-tg=off],[data-tg=on]").forEach(a=>a.addEventListener("click",()=>setTimeout(diary,0))); return lines; }
const st=document.createElement("style"); st.textContent=`
.tl64{border:1px solid var(--line,#ddd);border-radius:12px;padding:8px;background:#f4f8ff}.tl64c{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tl64c button{min-height:40px;border-radius:20px;border:1px solid #3b6fb6;background:#fff;color:#1e4f91;font:inherit;font-weight:700;font-size:14px;padding:0 12px}
.tl64 input{width:100%;box-sizing:border-box;min-height:40px;border-radius:10px;border:1px solid var(--line,#ccc);padding:0 10px;font:inherit}.tl64.done small{display:block;color:var(--mute,#666)}.tl64.done button{border:0;background:none;color:#3b6fb6;text-decoration:underline;font:inherit;min-height:32px}
.tl64r{padding-left:0;list-style:none}.tl64r li{border:1px solid var(--line,#ddd);border-left:6px solid #9aa;border-radius:10px;padding:8px 10px;margin:6px 0;display:flex;flex-direction:column;gap:3px;font-size:15px;background:#fff}.tl64r li.fit,.tl64r li.ok{border-left-color:#2f7d32}.tl64r li.idea{border-left-color:#e8b11b}.tl64r li.off,.tl64r li.miss{border-left-color:#c62828}
.tl64rv{font-size:13.5px;font-weight:600;margin-top:4px;padding:6px 8px;border-radius:8px;background:#f4f8ff;text-align:left}
.mood64{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;grid-column:1/-1;border:1px solid var(--line,#ddd);border-radius:12px;padding:8px 12px;background:#fff;font-size:14.5px}.mood64.warm{background:#f3f7ee;border-color:#cfe0bf}.mood64 a{font-weight:700;color:#3b6fb6;min-height:32px;display:inline-flex;align-items:center}.mood64 #mood64c{flex-basis:100%}.mood64d{letter-spacing:1px}
.tg64{background:#f3f7ee;border-color:#cfe0bf}.tg64b{display:grid;grid-template-columns:1fr;gap:8px}.tg64line{font-size:17px}.td64l{list-style:none;padding:0}.td64p{padding-left:18px;margin:6px 0;font-size:16px}.td64p li{margin:4px 0}.td64l li{display:flex;gap:10px;padding:8px 0;font-size:16.5px}.td64l small{display:block;color:var(--mute,#666);font-size:13px}.td64set{display:flex;justify-content:space-between;align-items:center}.td64set a{font-weight:700;color:#3b6fb6;min-height:44px;display:inline-flex;align-items:center}.tg64b button{min-height:46px;border-radius:12px;border:1px solid #7aa36b;background:#fff;font:inherit;font-weight:700}.tg64b button{font-size:16px;min-height:50px}.tg64b button[data-tg=play]{border-color:var(--line,#ccc)}.tg64off{display:inline-block;margin-top:8px;font-size:13px;color:var(--mute,#666)}
#tg64o{position:fixed;inset:0;z-index:9100;background:rgba(20,40,25,.55);display:flex;align-items:center;justify-content:center;padding:12px}#tg64o .s{background:#fff;border-radius:18px;padding:16px;max-width:460px;width:100%;max-height:92vh;overflow:auto;text-align:center}#tg64o button{min-height:46px;border-radius:12px;border:1px solid #7aa36b;background:#fff;font:inherit;font-weight:700;padding:0 16px}.tg64t{font-size:48px;font-weight:800;margin:8px 0}
html.dark-mode .mood64,html.dark-mode .tl64r li,html.dark-mode #tg64o .s,html.dark-mode .tl64{background:#262626;color:#eee}`; document.head.appendChild(st);
window.CRMind64={attach,draw,before,finish,compare,rows,needed,state,refresh,gate,card,calm,turning,diary,baseline,online,all,_plans:()=>LG(KP,[])};
})();
