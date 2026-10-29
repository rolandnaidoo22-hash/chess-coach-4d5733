/* v54: "Think First" - a thinking-process trainer for players rated about 500-1300.
   Four steps before every move: danger scan, forcing moves, shortlist, choose + safety check.
   Levels fade the help: 1 Guided, 2 Quick (no hints, 30-second timer), 3 Silent. Positions: TFBANK (checked with Stockfish)
   plus moments from the player's own reviewed games (checked live with the app's own Stockfish). Saved in localStorage only. */
(function(){
"use strict"; if(window.CRThink) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, K="chessReview.tf.v1";
const NM={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"}, VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const COL={c:"#d23c3c",x:"#e07b00",t:"#f5c518"}, TNAME={c:"check",x:"capture",t:"threat"};
const STEPS=["Danger scan","Forcing moves","Shortlist","Cross out","Choose and check"];
const LV={1:"Guided",2:"Quick",3:"Silent"}, TIME=30;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const today=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
function S(){ return Object.assign({lvl:1,max:1,run:0,hist:[],days:[],cat:{},sess:{}},U().LS.get(K,{})); }
function save(s){ U().LS.set(K,s); }
const CH=()=>U().CH();
const opp=c=>c==="w"?"b":"w";
/* ---------- chess helpers (our own words) ---------- */
function phrase(fen,u){ const g=new (CH())(fen); let m; try{ m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); }catch(e){ return u; } if(!m) return u;
  if(m.flags.includes("k")) return "Castle on the king's side"; if(m.flags.includes("q")) return "Castle on the queen's side";
  let s=cap(NM[m.piece])+(m.captured?" takes ":" to ")+m.to; if(m.promotion) s+=", making a "+NM[m.promotion]; return s; }
function vmove(fen,u){ const g=new (CH())(fen); try{ return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); }catch(e){ return null; } }
function uciOf(m){ return m.from+m.to+(m.promotion||""); }
/* forcing moves for the side to move: checks, captures, threats (a quiet move that attacks a loose or bigger piece) */
function forcing(fen){ const C=CH(), g=new C(fen), me=g.turn(), out=[], seen=new Set();
  g.moves({verbose:true}).forEach(m=>{ const u=m.from+m.to; if(seen.has(u)) return; seen.add(u);
    if(/[+#]/.test(m.san)){ out.push({u,k:"c",m}); return; }
    if(m.captured){ out.push({u,k:"x",m}); return; }
    const h=new C(fen); h.move(m); const f=h.fen().split(" "); f[1]=me; f[3]="-"; let t; try{ t=new C(f.join(" ")); }catch(e){ return; }
    const hit=t.moves({square:m.to,verbose:true}).some(x=>x.captured&&x.captured!=="k"&&x.captured!=="p"&&(VAL[x.captured]>VAL[m.piece]||!h.isAttacked(x.to,opp(me))));
    if(hit&&!h.isAttacked(m.to,opp(me))) out.push({u,k:"t",m}); });
  return out; }
/* after my move: can they check me, or win something (take a loose piece or a bigger one)? */
function danger(fen,u){ const C=CH(), g=new C(fen), me=g.turn(); const m=vmove(fen,u); if(!m) return false; g.move({from:m.from,to:m.to,promotion:m.promotion});
  return g.moves({verbose:true}).some(x=>/[+#]/.test(x.san)||(x.captured&&(VAL[x.captured]>VAL[x.piece]||!(()=>{ const h=new C(g.fen()); h.move(x); return h.isAttacked(x.to,me); })()))); }
/* category for the blind-spot card */
function cats(f){ const m=f.m, me=m.color, out=[]; const back=me==="w"?(+m.to[1]<+m.from[1]):(+m.to[1]>+m.from[1]);
  const df=Math.abs("abcdefgh".indexOf(m.to[0])-"abcdefgh".indexOf(m.from[0])), dr=Math.abs(+m.to[1]-+m.from[1]);
  if(f.k==="x"&&back) out.push("backward captures"); if(f.k==="c"&&m.piece==="n") out.push("knight checks");
  if(df&&df===dr&&"bq".includes(m.piece)) out.push("diagonal "+(f.k==="c"?"checks":f.k==="x"?"captures":"threats"));
  if(Math.max(df,dr)>=4) out.push("long-distance moves"); if(f.k==="c"&&m.piece==="q") out.push("queen checks"); if(f.k==="t") out.push("quiet threats");
  if(m.piece==="p"&&f.k!=="c") out.push("pawn "+(f.k==="x"?"captures":"threats")); return out; }
/* ---------- threats against me (Step 1) ---------- */
function threatJS(fen){ const C=CH(), g=new C(fen), me=g.turn();
  if(g.inCheck()){ const k=g.board().flat().find(p=>p&&p.type==="k"&&p.color===me); return {sq:g.attackers(k.square,opp(me)),u:null,why:"check"}; }
  const f=fen.split(" "); f[1]=opp(me); f[3]="-"; let n; try{ n=new C(f.join(" ")); }catch(e){ return null; }
  let best=null; n.moves({verbose:true}).forEach(x=>{ if(!x.captured||x.captured==="k") return; const h=new C(n.fen()); h.move(x); const gn=VAL[x.captured]-(h.isAttacked(x.to,me)?VAL[x.piece]:0);
    if(gn>=2&&(!best||gn>best.g)) best={g:gn,x}; });
  if(!best) return null; const sq=n.moves({verbose:true}).filter(x=>x.to===best.x.to&&x.captured).map(x=>x.from);
  return {sq:[...new Set(sq)],u:best.x.from+best.x.to,why:"take",cp:best.x.captured}; }
function threatText(fen,t){ const g=new (CH())(fen); if(!t) return "No real threat this time. Now look for your own chances.";
  const fr=t.u?t.u.slice(0,2):t.sq[0], p=g.get(fr), pn=p?NM[p.type]:"piece";
  if(t.why==="check") return `Their ${pn} on ${fr} is giving check. Deal with that first.`;
  if(t.why==="mate") return `Their ${pn} on ${fr} threatens checkmate on ${t.at}.`;
  const to=t.u.slice(2,4), free=!new (CH())(fen).isAttacked(to,g.turn());
  return `Their ${pn} on ${fr} can take your ${NM[t.cp]} on ${to}${free?" for free":""}.`; }
/* ---------- result sentence about the player's OWN move (15 words or fewer, no engine numbers) ---------- */
function reason(P,u){ const r=reason0(P,u); if(r.split(/\s+/).length<=15) return r; const tg=tagOf(P,u)||"", me=phrase(P.f,u);
  return tg==="A"?`After ${me}, they can checkmate you.`:tg[0]==="L"?`${me} loses your ${NM[tg[1]]||"piece"}.`:r.split(/\s+/).slice(0,15).join(" "); }
function reason0(P,u){ const t=P.m[u]||P.m[Object.keys(P.m).find(k=>k.slice(0,4)===u.slice(0,4))]||["m","","S"], cls=t[0], tg=t[2]||"", me=phrase(P.f,u), bp=phrase(P.f,P.best);
  const after=(()=>{ const g=new (CH())(P.f); const m=vmove(P.f,u); if(m) g.move({from:m.from,to:m.to,promotion:m.promotion}); return g.fen(); })();
  const rep=t[1]?phrase(after,t[1]):"";
  if(tg==="M") return `${me} leads to checkmate. Brilliant.`;
  if(tg[0]==="W") return `${me} wins their ${NM[tg[1]]||"piece"}.`;
  if(tg==="A") return `After ${me}, they can checkmate you. Start with: ${rep}.`;
  if(tg[0]==="L") return `After ${me}, they reply ${rep} and win your ${NM[tg[1]]||"piece"}.`;
  if(cls==="b") return `${me} is the best move here. Well found.`;
  if(cls==="g") return `${me} is fine, but ${bp} was stronger.`;
  return `${me} is safe, but it misses ${bp}.`; }
const clsOf=(P,u)=>{ const t=P.m[u]||P.m[Object.keys(P.m).find(k=>k.slice(0,4)===u.slice(0,4))]; return t?t[0]:"m"; };
const tagOf=(P,u)=>{ const t=P.m[u]||P.m[Object.keys(P.m).find(k=>k.slice(0,4)===u.slice(0,4))]; return t?t[2]:"S"; };
/* ---------- positions from the player's own reviewed games, checked live with the app's Stockfish ---------- */
function ownMoments(){ const out=[]; try{ if(window.CRBlunders) out.push(...CRBlunders.moments()); }catch(e){} try{ Object.values(window.PatternStore?PatternStore.all():{}).forEach(r=>(r.ev||[]).forEach(e=>{ if(e.fen&&e.best&&e.best!==e.uci&&/^(missmate|misstac|miss|hang|fell)$/.test(e.k)) out.push({id:r.id+"|"+e.ply,f:e.fen,best:e.best,k:e.k,src:/lichess\.org/i.test(String(r.pgn||"").slice(0,400)+String(r.id||""))?"Lichess":""}); })); }catch(e){}
  const seen=new Set(); return out.filter(x=>{ const k=x.f.split(" ").slice(0,4).join(" "); if(seen.has(k)) return false; seen.add(k); return true; }); }
async function liveCheck(o){ const E=window.CRBotEngine; await E.boot(); const g=new (CH())(o.f), me=g.turn(), n=Math.min(24,g.moves().length);
  const list=await E.candidates(o.f,n,2500); if(!list.length) return null; const best=list[0].score, m={};
  for(const x of list){ const d=best-x.score; const cls=(d<=30||(best>90000&&x.score>90000))?"b":(d<=120&&x.score>-150)?"g":"m"; let tg=x.score>90000?"M":x.score<-90000?"A":cls==="m"?"S":"F"; m[x.uci]=[cls,"",tg]; }
  const P={id:o.lp?o.id:"own:"+o.id,f:o.f,lm:o.lm||"",pf:o.pf,lab:o.lab||(o.src?"From your "+o.src+" game":"From your game"),best:list[0].uci,m,t:threatJS(o.f),own:!o.lp,live:true,bl:o.bl,isDef:o.isDef}; return P; }
async function liveReply(P,u){ if(!P.live) return; const t=P.m[u]; if(t&&t[0]!=="m") return; const E=window.CRBotEngine; const g=new (CH())(P.f); const m=vmove(P.f,u); g.move({from:m.from,to:m.to,promotion:m.promotion});
  try{ const r=await E.candidates(g.fen(),1,800); const x=r[0]; if(!x) return; const c=g.get(x.uci.slice(2,4)); const tg=x.score>90000?"A":(c&&VAL[c.type]>=1)?"L"+c.type:"S"; P.m[u]=["m",x.uci,tg]; }catch(e){} }
/* ---------- state for one position ---------- */
let W=null, timer=null;
function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }
function bank(){ return (window.TFBANK&&TFBANK.main)||[]; }
function pickBank(list,n,avoid){ const s=S(), seen=s.seen||{}; const L=list.filter(p=>!(avoid||[]).includes(p.id)).sort((a,b)=>(seen[a.id]||0)-(seen[b.id]||0)||Math.random()-.5); return L.slice(0,n); }
function markSeen(id){ const s=S(); s.seen=s.seen||{}; s.seen[id]=(s.seen[id]||0)+1; save(s); }
function head(P,step){ const s=S(), L=W.lvl; return `<div class="tfh"><span class="tfl">Level ${L}: ${LV[L]}</span>${W.sess?`<span class="tfl">Session ${W.sess.i+1}/${W.sess.q.length}</span>`:""}<span class="tfl tag">${U().E_(P.lab)}</span><span id="tfT" class="tfT"></span></div>
 ${step?`<div class="tfst">${STEPS.map((n,i)=>`<i class="${i+1<step?"done":i+1===step?"on":""}">${i+1}</i>`).join("")}</div><h3>Step ${step} of ${STEPS.length}: ${STEPS[step-1]}</h3>`:""}`; }
function startTimer(sec,onEnd){ stopTimer(); const el=$("tfT"); if(!el) return; let left=sec; el.textContent="⏱ "+left; el.classList.remove("low");
  timer=setInterval(()=>{ left--; const e=$("tfT"); if(!e){ stopTimer(); return; } e.textContent="⏱ "+Math.max(0,left); e.classList.toggle("low",left<=10); if(left<=0){ stopTimer(); onEnd(); } },1000); }
function boardIn(el,onTap){ const B=U().board(el,onTap); return B; }
function lmArrow(P){ return P.lm?[{u:P.lm,c:"blue"}]:[]; }
/* ---------- the page ---------- */
function page(){ return U().show("tf54"); }
function open(){ W=null; stopTimer(); const p=page(), s=S(), E_=U().E_; const st=stats();
  p.innerHTML=`<h2>🧠 Think First</h2><p class="mute">Stop moving on instinct. Five quick steps before every move, until they become a habit.</p>
  <div class="tfsteps">${STEPS.map((n,i)=>`<div><b>${i+1}</b><span>${["What do they want?","Checks, captures, threats","Pick 2–3 moves","Cross out the ones that fail","Move, then safety check"][i]}</span></div>`).join("")}</div>
  ${window.CRLearn60?CRLearn60.rulesHtml():""}${window.CRLearn60&&CRLearn60.due().length?`<p class="mute">🗓 ${CRLearn60.due().length} mistake repeat(s) due in today's session.</p>`:""}<button class="lt tfgo" id="tfDaily"><span class="i">☀️</span><span><b>Today's 10-minute session</b><small>${s.sess&&s.sess.d===today()&&s.sess.done?"Done today ✅ Play again any time":"5 of your own mistakes, 3 defence puzzles, 1 checks drill · 10–15 min"}</small></span></button>
  <button class="lt" id="tfOne"><span class="i">🎯</span><span><b>Practise one position</b><small>Level ${s.lvl}: ${LV[s.lvl]}</small></span></button>
  <button class="lt" id="tfBl"><span class="i">🩹</span><span><b>Puzzles from my blunders</b><small>Big mistakes from your own games</small></span></button>
  <button class="lt" id="tfDef"><span class="i">🛡</span><span><b>Save yourself</b><small>They have a threat. Find the move that stops it.</small></span></button>
  <button class="lt" id="tfSpeed"><span class="i">⚡</span><span><b>Find all the checks</b><small>20 seconds, tap every check</small></span></button>
  <h3>Your level</h3><div class="row" id="tfLv">${[1,2,3].map(l=>`<button class="bt ${s.lvl===l?"go":""}" data-l="${l}" ${l>s.max?"disabled":""}>${l>s.max?"🔒 ":""}${l}. ${LV[l]}</button>`).join("")}</div>
  <p class="mute">${s.max<3?`Move up after 10 positions in a row with no missed check or capture. Now: ${s.run}/10.`:"All levels unlocked."} ${["","All five steps, with hints.","Same steps, no hints, 30 seconds a step.","Just move. The app only steps in when you are about to hang a piece or miss a mate."][s.lvl]}</p>
  ${statsHtml(st)}
  <details class="card tfcred" id="tfCred"><summary><b>Where these habits come from</b></summary>
   <p><b>Asking what they want first</b> (prophylaxis): an idea made famous by Aron Nimzowitsch and later taught in depth by the trainer Mark Dvoretsky.</p>
   <p><b>Listing candidate moves before you calculate:</b> Alexander Kotov popularised this in his book <i>Think Like a Grandmaster</i>. Here it is simply a habit: name 2–3 moves before you choose.</p>
   <p><b>Crossing out moves that fail</b> (elimination): a method Dvoretsky taught for narrowing the choice quickly.</p>
   <p class="mute">The steps and wording in this app are our own simplified version for club players.</p></details>`;
  $("tfDaily").onclick=daily; $("tfOne").onclick=()=>{ W={lvl:S().lvl}; play(pickBank(bank(),1)[0]); }; $("tfSpeed").onclick=()=>{ W={lvl:S().lvl}; speed(); }; $("tfBl").onclick=()=>window.CRBlunders&&CRBlunders.open(); $("tfDef").onclick=defOne;
  p.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{ const s=S(); s.lvl=+b.dataset.l; save(s); open(); }); }
/* ---------- stats ---------- */
function stats(){ const s=S(), H=s.hist||[]; const days=[...new Set(s.days||[])].sort(); let streak=0; { let d=new Date(); for(;;){ const k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); if(days.includes(k)){ streak++; d.setDate(d.getDate()-1); } else if(!streak&&k===today()){ d.setDate(d.getDate()-1); } else break; } }
  const t=H.filter(h=>h.ms).slice(-30), avg=t.length?Math.round(t.reduce((a,h)=>a+h.ms,0)/t.length/1000):0;
  const st=k=>{ const a=H.filter(h=>h[k]!=null).slice(-30); return a.length?Math.round(100*a.reduce((x,h)=>x+h[k],0)/a.length):null; };
  let spot=null; Object.entries(s.cat||{}).forEach(([k,v])=>{ if(v.n>=4){ const r=v.miss/v.n; if(!spot||r>spot.r) spot={k,r}; } });
  if(!spot){ const d=H.filter(h=>h.s1!=null).slice(-30); if(d.length>=4){ const r=1-d.reduce((a,h)=>a+h.s1,0)/d.length; if(r>.2) spot={k:"their threats (Step 1)",r}; } }
  // hung pieces per game over time: from reviewed games if any, else from Think First days
  let hung=[]; try{ hung=Object.values(window.PatternStore?PatternStore.all():{}).filter(r=>r.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-12).map(r=>({x:String(r.date).slice(5,10),y:(r.ev||[]).filter(e=>e.k==="hang").length})); }catch(e){}
  let hungSrc="per reviewed game"; if(!hung.length){ hungSrc="per 10 Think First moves"; const by={}; H.forEach(h=>{ const d=by[h.d]||(by[h.d]={n:0,h:0}); d.n++; if(h.hung) d.h++; }); hung=Object.entries(by).sort().slice(-12).map(([d,v])=>({x:d.slice(5),y:Math.round(10*v.h/v.n*10)/10})); }
  return {streak,avg,n:H.length,s1:st("s1"),s2:st("s2"),s3:st("s3"),s4:st("s4"),spot,hung,hungSrc}; }
function statsHtml(st){ const bar=(l,v)=>`<div class="tfbar"><span>${l}</span><i><b style="width:${v||0}%"></b></i><em>${v==null?"–":v+"%"}</em></div>`; const mx=Math.max(1,...st.hung.map(h=>h.y));
  return `<h3>Your progress</h3><div class="tfstats"><div><b>${st.streak}</b><span>day streak 🔥</span></div><div><b>${st.avg?st.avg+"s":"–"}</b><span>average per position</span></div><div><b>${st.n}</b><span>positions done</span></div></div>
  <div class="card tfspot">${st.spot?`<b>🔦 Blind spot</b><p>You miss ${U().E_(st.spot.k)} ${Math.round(st.spot.r*100)}% of the time.</p>`:`<b>🔦 Blind spot</b><p class="mute">Do a few positions and your weakest habit shows up here.</p>`}</div>
  <div class="card"><b>Score by step</b>${bar("1. Threats spotted",st.s1)}${bar("2. Forcing moves found",st.s2)}${bar("3. Good shortlist",st.s3)}${bar("4. Good final move",st.s4)}</div>
  <div class="card"><b>Hung pieces ${st.hungSrc}</b>${st.hung.length?`<div class="tfch">${st.hung.map(h=>`<div><i style="height:${Math.max(4,58*h.y/mx)}px"></i><em>${h.y}</em><small>${h.x}</small></div>`).join("")}</div><p class="mute">Lower is better.</p>`:`<p class="mute">Review some games or do a few positions to see this.</p>`}</div>`; }
function record(r){ const s=S(); r.d=today(); s.hist=(s.hist||[]).concat([r]).slice(-500); s.days=[...new Set((s.days||[]).concat([today()]))].slice(-120);
  (r.cats||[]).forEach(([k,miss])=>{ const c=s.cat[k]||(s.cat[k]={n:0,miss:0}); c.n++; if(miss) c.miss++; }); delete r.cats;
  let up=null; if(r.cleanCX!=null){ s.run=r.cleanCX?(s.run||0)+1:0; if(s.run>=10&&s.lvl<3&&s.max<=s.lvl){ s.max=s.lvl+1; s.lvl=s.lvl+1; s.run=0; up=s.lvl; } }
  save(s); return up; }
/* ---------- one position, Levels 1 and 2 ---------- */
async function play(P){ stopTimer(); if(!P){ open(); return; } W=Object.assign(W||{},{P,t0:Date.now(),st:{}}); if(!W.lvl) W.lvl=S().lvl; if(!P.own) markSeen(P.id);
  if(W.lvl===3) return silent(P); step1(P); }
function step1(P){ const p=page(), g=new (CH())(P.f), me=g.turn(), L=W.lvl; let pick=null;
  p.innerHTML=`${head(P,1)}${window.CRLearn60?CRLearn60.rulesHtml():""}<p class="tfq">Before you think about your move, what is your opponent threatening?</p>
   <p class="mute">${P.lm?`They just played <b>${phrase(fenBefore(P),P.lm)}</b> (blue arrow). `:""}Tap the piece that is attacking, or tap No threat.</p>
   <div class="bd" id="tfB"></div><div class="msg" id="tfM"></div>
   <div class="row"><button class="bt" id="tfNo">No threat</button><button class="bt go" id="tfOk" disabled>Check my answer</button>${L===1?`<button class="bt" id="tfHint">💡 Hint</button>`:""}</div><div id="tfOut"></div>`;
  const B=boardIn($("tfB"),sq=>{ if(W.st.s1!=null) return; const pc=g.get(sq); if(!pc||pc.color===me) return; pick=sq; draw(); $("tfOk").disabled=false; $("tfM").textContent=`You picked their ${NM[pc.type]} on ${sq}.`; $("tfM").className="msg"; });
  B.orient=me; const draw=(extra)=>B.draw(P.f,Object.assign({arrows:lmArrow(P),hl:pick?[{sq:pick,c:"#f5c518",o:.6}]:[]},extra||{})); draw();
  const done=(ans)=>{ if(W.st.s1!=null) return; stopTimer(); const t=P.t; const ok=t?(ans!=="none"&&t.sq.includes(ans)):ans==="none"; W.st.s1=ok?1:0;
    const hl=[]; if(t) t.sq.forEach(s=>hl.push({sq:s,c:"#d23c3c",o:.55})); if(t&&t.u) hl.push({sq:t.u.slice(2,4),c:"#d23c3c",o:.35}); if(ans&&ans!=="none"&&!ok) hl.push({sq:ans,c:"#888",o:.5});
    draw({hl,arrows:t&&t.u?[{u:t.u,c:"red"}]:lmArrow(P)});
    const m=$("tfM"); m.className="msg "+(ok?"ok":"no"); m.innerHTML=(ok?"✅ Nice. ":ans==="timeout"?"⏱ Time's up. ":"❌ Not quite. ")+U().E_(threatText(P.f,t));
    $("tfOut").innerHTML=`<div class="row"><button class="bt go" id="tfN">Next: Step 2 ›</button></div>`; $("tfN").onclick=()=>step2(P); $("tfNo").disabled=$("tfOk").disabled=true; };
  $("tfNo").onclick=()=>done("none"); $("tfOk").onclick=()=>done(pick);
  if($("tfHint")) $("tfHint").onclick=()=>{ $("tfM").className="msg"; $("tfM").textContent=P.t&&P.t.u?"Look at their pieces that can take something of yours.":P.lm?"Ask: what does the piece they just moved attack now?":"Look for checks and captures they could make."; };
  if(L===2) startTimer(TIME,()=>done("timeout")); }
function fenBefore(P){ if(P.pf) return P.pf; // rebuild the position before their last move (for naming it)
  try{ const C=CH(); const g=new C(P.f); const sq=P.lm.slice(2,4), fr=P.lm.slice(0,2), pc=g.get(sq); if(!pc) return P.f; const h=new C(P.f); h.remove(sq); h.put(pc,fr); const f=h.fen().split(" "); f[1]=pc.color; f[3]="-"; return f.join(" "); }catch(e){ return P.f; } }
function step2(P){ const p=page(), g=new (CH())(P.f), me=g.turn(), L=W.lvl, F=forcing(P.f), marked=[]; let sel=null;
  const tot=k=>F.filter(f=>f.k===k).length, got=k=>marked.filter(u=>{ const f=F.find(f=>f.u===u); return f&&f.k===k; }).length;
  p.innerHTML=`${head(P,2)}${targetsTip(P.f,L)}<p class="tfq">Tap every check, capture and threat YOU have.</p><p class="mute">Tap your piece, then the square. Tap a marked move again to remove it.</p>
   <div class="tfleg"><span style="background:${COL.c}"></span>Check <span style="background:${COL.x}"></span>Capture <span style="background:${COL.t}"></span>Threat</div>
   <div class="tfcnt" id="tfC"></div><div class="bd" id="tfB"></div><div class="msg" id="tfM"></div>
   <div class="row"><button class="bt go" id="tfOk">I found them all</button></div><div id="tfOut"></div>`;
  const arrows=()=>marked.map(u=>{ const f=F.find(f=>f.u===u); return {u,c:COL[f.k]}; });
  const cnt=()=>{ $("tfC").innerHTML=["c","x","t"].map(k=>`<span style="border-color:${COL[k]}">${cap(TNAME[k])+"s"} ${got(k)}${L===1?"/"+tot(k):""}</span>`).join(""); };
  const B=boardIn($("tfB"),sq=>{ if(W.st.s2!=null) return; const pc=g.get(sq);
    if(pc&&pc.color===me&&(!sel||sel!==sq)){ const m0=sel&&g.moves({square:sel,verbose:true}).find(m=>m.to===sq); if(!m0){ sel=sq; draw(); return; } }
    if(!sel) return; const u=sel+sq, m=g.moves({square:sel,verbose:true}).find(m=>m.to===sq); sel=null; if(!m){ draw(); return; }
    const f=F.find(f=>f.u===u), msg=$("tfM");
    if(marked.includes(u)){ marked.splice(marked.indexOf(u),1); msg.textContent="Removed."; msg.className="msg"; }
    else if(f){ marked.push(u); msg.className="msg ok"; msg.textContent=L===1?`${phrase(P.f,u)}: a ${TNAME[f.k]}.`:"Marked."; }
    else { msg.className="msg"; msg.textContent=L===1?`${phrase(P.f,u)} is a quiet move, not a check, capture or threat.`:"Not a forcing move."; }
    cnt(); draw(); });
  B.orient=me; const draw=(o)=>B.draw(P.f,Object.assign({arrows:arrows(),hl:sel?[{sq:sel,c:"#f5c518",o:.6}]:[],dots:sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[]},o||{})); draw(); cnt();
  const done=(why)=>{ if(W.st.s2!=null) return; stopTimer(); sel=null; const miss=F.filter(f=>!marked.includes(f.u));
    W.st.marked=marked.slice(); W.st.F=F; W.st.cx=["c","x"].every(k=>got(k)===tot(k)); W.st.s2=F.length?marked.length/F.length:1; W.st.cats=[];
    F.forEach(f=>cats(f).forEach(c=>W.st.cats.push([c,!marked.includes(f.u)])));
    draw({arrows:arrows().concat(miss.map(f=>({u:f.u,c:COL[f.k],dash:true})))});
    const m=$("tfM"); if(!miss.length){ m.className="msg ok"; m.textContent=(F.length?`✅ You found all ${F.length}.`:"✅ Right: there are none here."); }
    else { m.className="msg no"; m.innerHTML=(why==="timeout"?"⏱ Time's up. ":"")+"Dashed arrows are ones you missed:<br>"+miss.slice(0,3).map(f=>`You missed ${U().E_(phrase(P.f,f.u))}, a ${TNAME[f.k]}.`).join("<br>")+(miss.length>3?`<br>…and ${miss.length-3} more.`:""); }
    $("tfOk").disabled=true; $("tfOut").innerHTML=`<div class="row"><button class="bt go" id="tfN">Next: Step 3 ›</button></div>`; $("tfN").onclick=()=>step3(P); };
  $("tfOk").onclick=()=>done(); if(L===2) startTimer(TIME,()=>done("timeout")); }
function step3(P){ const p=page(), g=new (CH())(P.f), me=g.turn(), L=W.lvl, M=W.st.marked, tray=[]; let quiet=null, qsel=null, qmode=false;
  p.innerHTML=`${head(P,3)}<p class="tfq">Pick your best 2–3 candidates.</p><p class="mute">Drag moves into the tray, or just tap them. You can also add one quiet move.</p>
   <div class="tfchips" id="tfCh"></div><div class="tftray" id="tfTr"></div>
   <div class="row"><button class="bt" id="tfQ">➕ Add a quiet move</button><button class="bt go" id="tfOk" disabled>Next: Step 4 ›</button></div><div class="msg" id="tfM"></div><div class="bd" id="tfB"></div>`;
  const B=boardIn($("tfB"),sq=>{ if(!qmode) return; const pc=g.get(sq); if(pc&&pc.color===me){ qsel=sq; draw(); return; } if(!qsel) return;
    const m=g.moves({square:qsel,verbose:true}).find(m=>m.to===sq); qsel=null; if(!m){ draw(); return; } const u=m.from+m.to+(m.promotion||"");
    if(W.st.F.some(f=>f.u===u.slice(0,4))){ $("tfM").textContent="That one is forcing. Pick it from the list above."; draw(); return; }
    quiet=u; qmode=false; paint(); $("tfM").className="msg ok"; $("tfM").textContent=`Added the quiet move ${phrase(P.f,u)}.`; });
  B.orient=me; const draw=()=>B.draw(P.f,{arrows:tray.map(u=>({u,c:COL[(W.st.F.find(f=>f.u===u)||{k:"t"}).k]})).concat(quiet?[{u:quiet,c:"green"}]:[]),hl:qsel?[{sq:qsel,c:"#f5c518",o:.6}]:[],dots:qsel?g.moves({square:qsel,verbose:true}).map(m=>m.to):[]});
  const chip=(u,inTray)=>{ const f=W.st.F.find(f=>f.u===u); return `<button class="tfchip" data-u="${u}" style="border-color:${f?COL[f.k]:"#2e9b4f"}">${U().E_(phrase(P.f,u))}${inTray?" ✕":""}</button>`; };
  function paint(){ const left=M.filter(u=>!tray.includes(u)); $("tfCh").innerHTML=left.length?left.map(u=>chip(u,false)).join(""):`<span class="mute">${M.length?"All your marked moves are in the tray.":"You didn't mark any moves in Step 2. Add a quiet move instead."}</span>`;
    $("tfTr").innerHTML=`<b>Shortlist ${tray.length}/3${quiet?" + 1 quiet":""}</b>`+(tray.map(u=>chip(u,true)).join("")+(quiet?`<button class="tfchip" data-q="1" style="border-color:#2e9b4f">${U().E_(phrase(P.f,quiet))} ✕</button>`:"")||`<span class="mute">Drop moves here</span>`);
    $("tfOk").disabled=!(tray.length||quiet); $("tfOk").textContent=(tray.length+(quiet?1:0))>=2?"Next: Step 4 ›":"Next: Step 5 ›"; draw(); wire(); }
  function toggle(u){ if(tray.includes(u)) tray.splice(tray.indexOf(u),1); else if(tray.length<3) tray.push(u); else { $("tfM").textContent="Up to 3. Remove one first."; return; } paint(); }
  function wire(){ document.querySelectorAll("#tfTr [data-q]").forEach(b=>b.onclick=()=>{ quiet=null; paint(); });
    document.querySelectorAll(".tfchip[data-u]").forEach(b=>{ let sx=0,sy=0,drag=false;
      b.onpointerdown=e=>{ sx=e.clientX; sy=e.clientY; drag=false; try{ b.setPointerCapture(e.pointerId); }catch(_){} };
      b.onpointermove=e=>{ if(!e.buttons&&e.pointerType==="mouse") return; const dx=e.clientX-sx, dy=e.clientY-sy; if(!drag&&Math.hypot(dx,dy)>8) drag=true; if(drag){ b.style.transform=`translate(${dx}px,${dy}px)`; b.classList.add("drag"); } };
      b.onpointerup=e=>{ const u=b.dataset.u; if(!drag){ toggle(u); return; } b.style.transform=""; const r=$("tfTr").getBoundingClientRect(), inT=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
        if(inT!==tray.includes(u)) toggle(u); else paint(); }; }); }
  $("tfQ").onclick=()=>{ qmode=true; $("tfM").className="msg"; $("tfM").textContent="Tap your piece, then the square for your quiet move."; $("tfB").scrollIntoView({block:"center",behavior:"smooth"}); };
  $("tfOk").onclick=()=>{ stopTimer(); W.st.tray=tray.slice(); W.st.quiet=quiet; const list=tray.concat(quiet?[quiet]:[]); W.st.s3=list.some(u=>clsOf(P,u)==="b")?1:list.some(u=>clsOf(P,u)==="g")?.5:0; W.st.out=[]; if(list.length>=2) stepX(P); else { W.st.sx=null; step4(P); } };
  if(L===1&&M.length) $("tfM").textContent="Hint: put the move that wins the most, or stops their threat, first."; paint();
  if(L===2) startTimer(TIME,()=>{ if(!tray.length&&!quiet&&M.length) tray.push(M[0]); if(!tray.length&&!quiet){ const any=g.moves({verbose:true})[0]; quiet=uciOf(any); } $("tfOk").disabled=false; $("tfOk").click(); }); }
/* v59: "Targets" tip before the move search (a tip, not a named system) */
function targetsTip(fen,L){ try{ const C=CH(), g=new C(fen), me=g.turn(), th=opp(me), loose=[], B=g.board();
  B.forEach(r=>r.forEach(q=>{ if(q&&q.color===th&&q.type!=="k"&&q.type!=="p"&&!g.isAttacked(q.square,th)) loose.push(NM[q.type]+" on "+q.square); }));
  const k=B.flat().find(q=>q&&q.type==="k"&&q.color===th); let weak=""; if(k){ const f="abcdefgh".indexOf(k.square[0]), r=+k.square[1], dir=th==="w"?1:-1; let sh=0;
    for(let df=-1;df<=1;df++){ const ff=f+df; if(ff<0||ff>7) continue; const sq="abcdefgh"[ff]+(r+dir); const pc=(r+dir>=1&&r+dir<=8)?g.get(sq):null; if(pc&&pc.type==="p"&&pc.color===th) sh++; }
    const home=th==="w"?r===1:r===8, centre=f>=3&&f<=4; if(g.inCheck()) weak=""; else if(centre&&!home) weak="their king has left home and is out in the open"; else if(centre&&home&&B.flat().filter(q=>q&&q.color===th&&"nb".includes(q.type)&&q.square[1]===(th==="w"?"1":"8")).length<2) weak="their king is still in the middle"; else if(sh<=1) weak="their king has few pawns in front of it"; }
  let body; if(L>=3) body="Before you search, ask: which of their pieces is loose (nobody guards it), and is their king short of cover?";
  else { const bits=[]; if(loose.length) bits.push(`loose piece${loose.length>1?"s":""}: <b>${loose.slice(0,3).join(", ")}</b> (nobody guards ${loose.length>1?"them":"it"})`); if(weak) bits.push(weak);
    body=bits.length?"Look for targets first. "+bits.map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(". ")+". Forcing moves that hit these are worth a closer look.":"Look for targets first: a loose piece (nobody guards it) or a king without cover. None stand out here, so check every forcing move."; }
  return `<div class="tftip" id="tfTgt">💡 <b>Tip: targets.</b> ${body}</div>`; }catch(e){ return ""; } }
/* v59: Step 4, cross out the moves that fail (elimination) */
function stepX(P){ const p=page(), g=new (CH())(P.f), me=g.turn(), L=W.lvl, list=W.st.tray.concat(W.st.quiet?[W.st.quiet]:[]), out=[];
  const adv=L>=3?`<div class="card tfadv" id="tfAdv"><b>Silent level: two extra checks</b><p>1. Follow a forcing line (checks and captures) to the point where it stops. Pause there and judge that position as if you were seeing it for the first time: who is safer, who has more?</p><p>2. Try the same moves in a different order. Sometimes the second move works better first, or one order gives them a check in between.</p></div>`:"";
  p.innerHTML=`${head(P,4)}<p class="tfq">Cross out every candidate that fails.</p><p class="mute">A move fails if it leaves something hanging, lets them check you or win material, or ignores their threat. Keep at least one.</p>${adv}
   <div class="tfchips tfx" id="tfX">${list.map(u=>`<button class="tfchip" data-u="${u}">${U().E_(phrase(P.f,u))}</button>`).join("")}</div><div class="bd" id="tfB"></div><div class="msg" id="tfM"></div>
   <div class="row"><button class="bt go" id="tfOk">Done crossing out</button>${L===1?`<button class="bt" id="tfHint">💡 Hint</button>`:""}</div><div id="tfOut"></div>`;
  const B=boardIn($("tfB"),null); B.orient=me; const draw=()=>B.draw(P.f,{arrows:list.map(u=>({u,c:out.includes(u)?"#999":"green",dash:out.includes(u)}))}); draw();
  document.querySelectorAll("#tfX .tfchip").forEach(b=>b.onclick=()=>{ if(W.st.sx!==undefined&&W.st.sxDone) return; const u=b.dataset.u;
    if(out.includes(u)) out.splice(out.indexOf(u),1); else if(out.length<list.length-1) out.push(u); else { $("tfM").className="msg"; $("tfM").textContent="Keep at least one move."; return; }
    b.classList.toggle("x",out.includes(u)); draw(); });
  if($("tfHint")) $("tfHint").onclick=()=>{ $("tfM").className="msg"; $("tfM").textContent="For each move, picture the board after it. Can they check you, or take something for free?"; };
  const done=()=>{ stopTimer(); W.st.sxDone=1; const bad=u=>danger(P.f,u)||clsOf(P,u)==="m"; const right=out.filter(bad).length, wrong=out.filter(u=>!bad(u)).length, missed=list.filter(u=>!out.includes(u)&&bad(u));
    W.st.out=out.slice(); W.st.sx=list.length?(list.length-wrong-missed.length)/list.length:1;
    const m=$("tfM"); const lines=[]; if(right) lines.push(`✅ ${right} correctly crossed out.`); if(wrong) lines.push(`⚠️ You crossed out ${out.filter(u=>!bad(u)).map(u=>U().E_(phrase(P.f,u))).join(", ")}, but it holds up.`); if(missed.length) lines.push(`❌ ${missed.map(u=>U().E_(phrase(P.f,u))).join(", ")} fails: it lets them check you or win something.`); if(!lines.length) lines.push("✅ Nothing here fails. Good list.");
    m.className="msg "+(wrong||missed.length?"no":"ok"); m.innerHTML=lines.join("<br>"); $("tfOk").disabled=true;
    $("tfOut").innerHTML=`<div class="row"><button class="bt go" id="tfN">Next: Step 5 ›</button></div>`; $("tfN").onclick=()=>step4(P); };
  $("tfOk").onclick=done; if(L===2) startTimer(TIME,done); }
function step4(P){ const p=page(), g=new (CH())(P.f), me=g.turn(), L=W.lvl, list=W.st.tray.concat(W.st.quiet?[W.st.quiet]:[]).filter(u=>!(W.st.out||[]).includes(u)); let pick=list.length===1?list[0]:null;
  p.innerHTML=`${head(P,5)}<p class="tfq">Pick your move.</p><div class="tfchips" id="tfCh">${list.map(u=>`<button class="tfchip" data-u="${u}">${U().E_(phrase(P.f,u))}</button>`).join("")}</div>
   <div class="bd" id="tfB"></div><div id="tfAsk"></div><div class="msg" id="tfM"></div><div id="tfOut"></div>`;
  const B=boardIn($("tfB"),null); B.orient=me; const draw=o=>B.draw(P.f,o||{arrows:pick?[{u:pick,c:"green"}]:[]});
  const ask=()=>{ draw(); document.querySelectorAll("#tfCh .tfchip").forEach(b=>b.classList.toggle("on",b.dataset.u===pick));
    $("tfAsk").innerHTML=`<div class="card tfask"><b>Safety check: ${U().E_(phrase(P.f,pick))}</b><p>After this move, can they check you, take something, or attack something?</p><div class="row"><button class="bt" data-a="1">Yes</button><button class="bt" data-a="0">No</button></div>${L===1?`<p class="mute">💡 Picture the board after your move. Look at every check and capture they get.</p>`:""}</div>`;
    $("tfAsk").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>finish(P,pick,b.dataset.a==="1")); };
  document.querySelectorAll("#tfCh .tfchip").forEach(b=>b.onclick=()=>{ if(W.st.s4!=null) return; pick=b.dataset.u; ask(); });
  if(pick) ask(); else draw();
  if(L===2) startTimer(TIME,()=>{ if(W.st.s4==null){ pick=pick||list[0]; finish(P,pick,null); } }); }
async function finish(P,u,said){ if(W.st.s4!=null) return; stopTimer(); W.st.s4=-1; const g=new (CH())(P.f), me=g.turn(); const m=vmove(P.f,u);
  $("tfAsk").innerHTML=""; $("tfM").textContent=P.live?"Checking your move…":""; await liveReply(P,u);
  const cls=clsOf(P,u), tg=tagOf(P,u), real=danger(P.f,u), safeOk=said==null?false:(said===real); W.st.s4=cls==="b"?1:cls==="g"?.5:0;
  const after=new (CH())(P.f); after.move({from:m.from,to:m.to,promotion:m.promotion}); const t=P.m[u]||[];
  const arrows=[{u,c:cls==="m"?"red":"green"}]; if(t[1]&&cls==="m") arrows.push({u:t[1],c:"red",dash:true}); if(cls!=="b"&&P.best) arrows.push({u:P.best,c:"green",dash:true});
  const B=boardIn(($("tfB").innerHTML="",$("tfB")),null); B.orient=me; B.draw(P.f,{arrows});
  // which step went wrong
  const s=W.st, best=P.best, bf=(s.F||[]).find(f=>f.u===best.slice(0,4)); let why="";
  const threatMissed=s.s1===0&&P.t;
  if(cls==="b") why=threatMissed?"You found the right move but skipped Step 1, so you missed their threat.":(said!=null&&!safeOk)?"Right move! But Step 5's safety check answer was off. Look again next time.":"Every step went right. That's the habit.";
  else if((s.out||[]).some(u=>u.slice(0,4)===best.slice(0,4))) why=`Step 4 went wrong: you crossed out ${phrase(P.f,best)}, but it was the best move. Cross out a move only when you can say what it allows.`;
  else if(threatMissed&&(tg==="A"||tg[0]==="L")) why="Step 1 went wrong: you missed their threat, and it cost you.";
  else if(bf&&!s.marked.includes(bf.u)) why=`Step 2 went wrong: you didn't spot ${phrase(P.f,best)}, a ${TNAME[bf.k]}.`;
  else if(s.marked.includes(best.slice(0,4))&&!s.tray.includes(best.slice(0,4))) why=`Step 3 went wrong: you marked ${phrase(P.f,best)} but left it off your list.`;
  else if(s.tray.includes(best.slice(0,4))||s.quiet===best) why=`Step 5 went wrong: ${phrase(P.f,best)} was on your list. Compare more carefully.`;
  else if(said!=null&&!safeOk) why="Step 5 went wrong: your safety check missed their reply.";
  else why=`The best move was a quiet one: ${phrase(P.f,best)}.`;
  const verdict=cls==="b"?["⭐ Best move","ok"]:cls==="g"?["👍 Good move","ok"]:["❌ Mistake","no"];
  const hungNow=tg==="A"||tg[0]==="L";
  $("tfCh").innerHTML=""; $("tfM").innerHTML="";
  $("tfOut").innerHTML=`<div class="card tfres ${verdict[1]}"><h3 class="${verdict[1]}">${verdict[0]}</h3><p><b>${U().E_(reason(P,u))}</b></p><p>${U().E_(why)}</p>
    ${said!=null?`<p class="mute">Safety check: you said ${said?"Yes":"No"}. ${real?"They do get a check or a capture that wins something.":"They get nothing dangerous."} ${safeOk?"✅":"❌"}</p>`:""}
    <div class="tfsc">${["Threats","Forcing","Shortlist","Cross out","Final"].map((n,i)=>{ const v=[s.s1,s.s2,s.s3,s.sx,s.s4][i]; if(v==null&&i===3) return ""; return `<span class="${v>=.99?"ok":v>0?"mid":"no"}">${n} ${v>=.99?"✓":v>0?"½":"✗"}</span>`; }).join("")}</div></div>
    <div class="row"><button class="bt go" id="tfN">${W.sess?"Next ›":"Next position ›"}</button><button class="bt" id="tfH">Think First home</button></div>`;
  const up=record({id:P.id,ms:Date.now()-W.t0,s1:s.s1,s2:s.s2,s3:s.s3,s4:s.s4,cls,hung:hungNow?1:0,lvl:W.lvl,cleanCX:s.cx,cats:s.cats,def:!!P.isDef});
  if(W.sess) sessNote({s1:s.s1,def:P.isDef,ok:cls!=="m",cats:s.cats});
  if(up) $("tfOut").insertAdjacentHTML("afterbegin",`<div class="card tfup">🎉 <b>Level up! You reached Level ${up}: ${LV[up]}.</b> 10 positions in a row with no missed check or capture.</div>`);
  if(window.CRIdeas){ const box=document.createElement("div"); box.className="card"; box.id="tfIdeas"; const row=$("tfOut").querySelector(".row"); $("tfOut").insertBefore(box,row);
    const G=[]; if(P.best&&P.best.slice(0,4)!==u.slice(0,4)) G.push({fen:P.f,uci:P.best,title:"Why "+phrase(P.f,P.best),sub:"the best move"});
    G.push({fen:P.f,uci:u,title:"Why "+phrase(P.f,u),sub:G.length?"your move":"your move, the best one"});
    CRIdeas.mount(box,G,(af,x,g)=>{ if(!af){ B.draw(P.f,{arrows}); return; } B.draw(af,{arrows:x.a,hl:[{sq:g.uci.slice(0,2),c:"#f2d35b",o:.45},{sq:g.uci.slice(2,4),c:"#f2d35b",o:.55}]}); }); }
$("tfN").onclick=next; $("tfH").onclick=()=>{ W.sess=null; open(); }; $("tfOut").scrollIntoView({block:"nearest",behavior:"smooth"}); }
/* ---------- Level 3: silent ---------- */
function silentIdeas(){ return `<details class="card tfadv" id="tfAdv"><summary><b>Silent level: advanced ideas</b></summary><p>💡 <b>Targets:</b> which of their pieces is loose, and is their king short of cover?</p><p>1. <b>Pause where the forcing line ends.</b> Follow the checks and captures until they run out. Stop there and judge that position fresh, as if it were a new puzzle: who is safer, who has more?</p><p>2. <b>Try a different order.</b> Play the same moves in another order in your head. Sometimes one order works and the other gives them a check or a capture in between.</p></details>`; }
function silent(P){ const p=page(), g=new (CH())(P.f), me=g.turn(); let sel=null, paused=false;
  p.innerHTML=`${head(P,0)}${window.CRLearn60?CRLearn60.rulesHtml():""}<p class="tfq">Your move.</p><p class="mute">${P.lm?`They just played ${phrase(fenBefore(P),P.lm)}.`:""} Think it through, then move.</p>${silentIdeas()}<div class="bd" id="tfB"></div><div id="tfAsk"></div><div class="msg" id="tfM"></div><div id="tfOut"></div>`;
  const B=boardIn($("tfB"),sq=>{ if(paused||W.st.s4!=null) return; const pc=g.get(sq); if(pc&&pc.color===me&&sel!==sq&&!(sel&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq))){ sel=sq; draw(); return; }
    if(!sel) return; const m=g.moves({square:sel,verbose:true}).find(m=>m.to===sq); sel=null; if(!m){ draw(); return; } go(uciOf(m)); });
  B.orient=me; const draw=()=>B.draw(P.f,{arrows:lmArrow(P),hl:sel?[{sq:sel,c:"#f5c518",o:.6}]:[],dots:sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[]}); draw();
  async function go(u){ await liveReply(P,u); const tg=tagOf(P,u), bestTag=tagOf(P,P.best), hang=tg==="A"||tg[0]==="L", missMate=bestTag==="M"&&tg!=="M";
    if((hang||missMate)&&!W.st.paused){ paused=true; W.st.paused=1; B.draw(P.f,{arrows:[{u,c:"orange"}]});
      $("tfAsk").innerHTML=`<div class="card tfpause"><b>✋ Pause. Did you check their reply?</b><p class="mute">${hang?"Picture their best answer to this move.":"There may be something much better. Look at every check."}</p><div class="row"><button class="bt go" id="tfBack">Take it back</button><button class="bt" id="tfAny">Play it anyway</button></div></div>`;
      $("tfBack").onclick=()=>{ paused=false; $("tfAsk").innerHTML=""; draw(); }; $("tfAny").onclick=()=>{ paused=false; done(u); }; return; }
    done(u); }
  function done(u){ W.st={s1:null,s2:null,s3:null,marked:[],tray:[],F:[],cats:[],paused:W.st.paused}; $("tfAsk").innerHTML=""; $("tfB").innerHTML=""; W.st.s4=null;
    // reuse the result screen (no step scores at this level)
    const cls=clsOf(P,u); const tg=tagOf(P,u); W.st.s4=cls==="b"?1:cls==="g"?.5:0; const t=P.m[u]||[];
    const arrows=[{u,c:cls==="m"?"red":"green"}]; if(t[1]&&cls==="m") arrows.push({u:t[1],c:"red",dash:true}); if(cls!=="b") arrows.push({u:P.best,c:"green",dash:true});
    const B2=boardIn($("tfB"),null); B2.orient=me; B2.draw(P.f,{arrows});
    const verdict=cls==="b"?["⭐ Best move","ok"]:cls==="g"?["👍 Good move","ok"]:["❌ Mistake","no"];
    $("tfOut").innerHTML=`<div class="card tfres ${verdict[1]}"><h3 class="${verdict[1]}">${verdict[0]}</h3><p><b>${U().E_(reason(P,u))}</b></p>${W.st.paused?`<p class="mute">The app stepped in once on this position.</p>`:""}</div>
      <div class="row"><button class="bt go" id="tfN">${W.sess?"Next ›":"Next position ›"}</button><button class="bt" id="tfH">Think First home</button></div>`;
    record({id:P.id,ms:Date.now()-W.t0,s4:W.st.s4,cls,hung:(tg==="A"||tg[0]==="L")?1:0,lvl:3,cleanCX:null});
    if(W.sess) sessNote({s1:null,def:P.isDef,ok:cls!=="m",cats:[]});
    $("tfN").onclick=next; $("tfH").onclick=()=>{ W.sess=null; open(); }; }
}
/* ---------- speed drill: tap every check in 20 seconds ---------- */
function speed(P){ stopTimer(); if(!P){ const c=bank().filter(p=>{ const n=forcing(p.f).filter(f=>f.k==="c").length; return n>=2&&n<=6; }); P=c[Math.floor(Math.random()*c.length)]; }
  const p=page(), g=new (CH())(P.f), me=g.turn(), checks=forcing(P.f).filter(f=>f.k==="c").map(f=>f.u), got=[]; let sel=null, over=false;
  p.innerHTML=`${head(P,0)}<h3>⚡ Find all the checks</h3><p class="tfq">Tap every check you have. 20 seconds!</p><div class="tfcnt" id="tfC"></div><div class="bd" id="tfB"></div><div class="msg" id="tfM"></div><div id="tfOut"></div>`;
  const cnt=()=>{ $("tfC").innerHTML=`<span style="border-color:${COL.c}">Checks found ${got.length}</span>`; };
  const B=boardIn($("tfB"),sq=>{ if(over) return; const pc=g.get(sq); if(pc&&pc.color===me&&!(sel&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq))){ sel=sq; draw(); return; }
    if(!sel) return; const u=sel+sq; sel=null; if(checks.includes(u)&&!got.includes(u)){ got.push(u); $("tfM").className="msg ok"; $("tfM").textContent="✅ "+phrase(P.f,u)+"!"; if(got.length===checks.length) end(); }
    else if(!got.includes(u)){ $("tfM").className="msg no"; $("tfM").textContent="Not a check."; } cnt(); draw(); });
  B.orient=me; const draw=o=>B.draw(P.f,Object.assign({arrows:got.map(u=>({u,c:COL.c})),hl:sel?[{sq:sel,c:"#f5c518",o:.6}]:[]},o||{})); draw(); cnt();
  function end(){ if(over) return; over=true; stopTimer(); const miss=checks.filter(u=>!got.includes(u)); draw({arrows:got.map(u=>({u,c:COL.c})).concat(miss.map(u=>({u,c:COL.c,dash:true}))),hl:[]});
    $("tfM").className="msg "+(miss.length?"no":"ok"); $("tfM").innerHTML=`You found ${got.length}/${checks.length} checks.`+(miss.length?"<br>"+miss.map(u=>`You missed ${U().E_(phrase(P.f,u))}.`).join("<br>"):" Perfect!");
    const s=S(); s.hist=(s.hist||[]).slice(); s.days=[...new Set((s.days||[]).concat([today()]))]; s.speed=(s.speed||[]).concat([[today(),got.length,checks.length]]).slice(-60); save(s);
    if(W.sess){ W.sess.speed=[got.length,checks.length]; }
    $("tfOut").innerHTML=`<div class="row"><button class="bt go" id="tfN">${W.sess?"Finish session ›":"Try another"}</button><button class="bt" id="tfH">Think First home</button></div>`;
    $("tfN").onclick=W.sess?next:()=>speed(); $("tfH").onclick=()=>{ W.sess=null; open(); }; }
  startTimer(20,end); }
/* ---------- daily session ---------- */
async function daily(){ const lvl=S().lvl; W={lvl}; const p=page(); p.innerHTML=`<h2>☀️ Today's session</h2><p class="mute" id="tfLd">Getting your positions ready…</p>`;
  const q=[]; const om=ownMoments(), bl=om.filter(o=>o.bl).slice(0,8), rest=om.filter(o=>!o.bl).sort(()=>Math.random()-.5); let own=bl.concat(rest).slice(0,8), nOwn=0;
  for(const o of own){ if(nOwn>=5) break; if($("tfLd")) $("tfLd").textContent=`Getting your positions ready… ${nOwn}/5`; try{ const P=await Promise.race([liveCheck(o),new Promise(r=>setTimeout(()=>r(null),9000))]); if(P&&Object.keys(P.m).length>=3){ q.push(P); nOwn++; } }catch(e){} }
  try{ const rp=window.CRLearn60?CRLearn60.due().slice(0,2):[]; for(const o of rp){ if($("tfLd")) $("tfLd").textContent="Getting your repeats ready…"; const P=await Promise.race([liveCheck(o),new Promise(r=>setTimeout(()=>r(null),9000))]); if(P){ P.lab=o.lab; P.rep=1; q.unshift(P); CRLearn60.markShown(o.rid); } } }catch(e){}
  pickBank(bank(),5-q.length).forEach(P=>q.push(P));
  const dl=await defLive(1); pickBank((TFBANK.def||[]),3-dl.length).forEach(P=>q.push(Object.assign({},P,{isDef:true,lab:"Save yourself"}))); dl.forEach(P=>q.push(P));
  q.push({speed:true}); W.sess={i:0,q,nOwn,log:[],lvl}; run(); }
function run(){ const s=W.sess; const P=s.q[s.i]; if(!P) return summary(); W.st={}; if(P.speed) return speed(); if(P.isDef) introDef(P); else { play(P); if(P.bl&&window.CRBlunders) CRBlunders.decorate(P); } }
async function defLive(n){ const out=[]; if(!window.CRBlunders) return out; const s=S(), seen=s.seen||{}; const pool=CRBlunders.defPool().slice().sort((a,b)=>(seen[a.id]||0)-(seen[b.id]||0)||Math.abs(a.r-1300)-Math.abs(b.r-1300)+(Math.random()-.5)*400);
  for(const o of pool.slice(0,n+2)){ if(out.length>=n) break; try{ const P=await Promise.race([liveCheck(o),new Promise(r=>setTimeout(()=>r(null),9000))]); if(P){ P.isDef=true; P.lab="Save yourself"; markSeen(o.id); out.push(P); } }catch(e){} } return out; }
async function defOne(){ const p=page(); p.innerHTML=`<h2>🛡 Save yourself</h2><p class="mute" id="tfLd">Getting a position ready…</p>`; W={lvl:S().lvl,defMode:true};
  let P=null; if(Math.random()<.6) P=(await defLive(1))[0]; if(!P){ const b=pickBank(TFBANK.def||[],1)[0]; P=b&&Object.assign({},b,{isDef:true,lab:"Save yourself"}); } if(!P) return open(); W.defMode=true; introDef(P); }
async function ownOne(o,after){ const p=page(); p.innerHTML=`<h2>🩹 Your blunder</h2><p class="mute">Getting the position ready…</p>`; W={lvl:S().lvl};
  let P=null; try{ P=await liveCheck(o); }catch(e){} if(!P){ p.innerHTML+=`<p>Couldn't check this position. Try again.</p>`; return; } W.after=after; play(P); CRBlunders.decorate(P); }
function introDef(P){ play(P); setTimeout(()=>{ const h=document.querySelector("#tf54 .tfq"); if(h) h.insertAdjacentHTML("beforebegin",`<div class="card tfdef">🛡 <b>Defence puzzle.</b> Their threat is real. Your best move must stop it.</div>`); },0);
  const r=$("tf54"); if(!r) return; const ob=new MutationObserver(()=>{ const o=$("tfOut"); if(o&&o.innerHTML.trim()&&!r.querySelector(".tfdefw")){ ob.disconnect(); let t=""; try{ const th=P.t||threatJS(P.f); t=th?threatText(P.f,th):"They had a hidden threat, like a mating attack. Only the best move stops it."; }catch(e){}
    o.insertAdjacentHTML("afterbegin",`<div class="card tfdef tfdefw"><b>🛡 What they threatened</b><p>${U().E_(t)}</p><p class="mute">The best defence was <b>${U().E_(phrase(P.f,P.best||P.sol))}</b>. Before every move, ask: what does their last move attack?</p></div>`); } });
  ob.observe(r,{childList:true,subtree:true}); setTimeout(()=>ob.disconnect(),6e5); }
function sessNote(n){ if(W.sess) W.sess.log.push(n); }
function next(){ if(!W.sess&&W.after){ const f=W.after; W.after=null; return f(); } if(!W.sess&&W.defMode) return defOne(); if(!W.sess){ const P=pickBank(bank(),1)[0]; W.st={}; play(P); return; } W.sess.i++; run(); }
const TOMORROW={"backward captures":"backward captures","knight checks":"knight checks","diagonal checks":"diagonal attacks","diagonal captures":"diagonal attacks","diagonal threats":"diagonal attacks","long-distance moves":"long-distance moves","queen checks":"queen checks","quiet threats":"quiet threats","pawn captures":"pawn captures","pawn threats":"pawn threats"};
function summary(){ stopTimer(); const s=W.sess, L=s.log, p=page(); const sp=L.filter(x=>x.s1!=null), threats=sp.filter(x=>x.s1).length;
  const m={}; L.forEach(x=>(x.cats||[]).forEach(([k,miss])=>{ const c=m[k]||(m[k]={n:0,miss:0}); c.n++; if(miss) c.miss++; }));
  let w=Object.entries(m).filter(([k,v])=>v.miss).sort((a,b)=>b[1].miss/b[1].n-a[1].miss/a[1].n)[0]; const tom=w?TOMORROW[w[0]]||w[0]:(threats<sp.length?"spotting their threats":"keep the streak going");
  const good=L.filter(x=>x.ok).length, def=L.filter(x=>x.def), defOk=def.filter(x=>x.ok).length;
  const st=S(); st.sess={d:today(),done:true,tom}; save(st);
  p.innerHTML=`<h2>☀️ Session done!</h2><div class="card tfsum"><p class="big">${sp.length?`Today you spotted <b>${threats}/${sp.length}</b> threats.`:`Today you played <b>${L.length}</b> positions.`}</p><p class="big">Tomorrow: <b>${U().E_(tom)}</b>.</p></div>
   <div class="tfstats"><div><b>${good}/${L.length}</b><span>good or best moves</span></div><div><b>${defOk}/${def.length}</b><span>threats stopped</span></div><div><b>${s.speed?s.speed[0]+"/"+s.speed[1]:"–"}</b><span>checks in 20s</span></div></div>
   <p class="mute">${s.nOwn?`${s.nOwn} position${s.nOwn>1?"s":""} came from your own games.`:"Review some of your games and future sessions will use positions from them."}</p>
   <div class="row"><button class="bt go" id="tfH">Think First home</button></div>`;
  W.sess=null; $("tfH").onclick=open; window.scrollTo(0,0); }
function sub(){ const s=S(); const st=stats(); return st.streak?`🔥 ${st.streak}-day streak · Level ${s.lvl}`:"Four steps before every move"; }
const CSS=`#tf54 .tfh{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0}.tfl{font-size:12px;font-weight:800;background:#262421;color:#fff;border-radius:8px;padding:3px 8px}.tfl.tag{background:#3b6fb6}
.tfT{margin-left:auto;font-weight:800;font-size:15px;background:#fff3c4;border-radius:8px;padding:2px 8px}.tfT:empty{display:none}.tfT.low{background:#d23c3c;color:#fff}
.tfst{display:flex;gap:6px;margin:8px 0 0}.tfst i{flex:1;text-align:center;font-style:normal;font-weight:800;border-radius:8px;background:#e9e6df;color:#777;padding:3px 0}.tfst i.on{background:#2f7d32;color:#fff}.tfst i.done{background:#a5d6a7;color:#1b5e20}
#tf54 h3{margin:8px 0 2px}.tfq{font-size:17px;font-weight:800;margin:6px 0 2px!important}
.tfsteps{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 12px}.tfsteps div{border-radius:12px;background:linear-gradient(135deg,#2f7d32,#3b6fb6);color:#fff;padding:8px 10px;display:flex;gap:8px;align-items:center}.tfsteps b{font-size:22px}.tfsteps span{font-size:13px;line-height:1.25;font-weight:700}
.tfleg{font-size:13px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.tfleg span{display:inline-block;width:18px;height:8px;border-radius:4px;margin-left:6px}
.tfcnt{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.tfcnt span{border:2px solid;border-radius:10px;padding:3px 9px;font-weight:800;font-size:14px;background:#fff}
.tftip{background:#fff7e0;border:1px solid #e8cf7a;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:14px;color:#3d3210}.tfadv,.tfcred{padding:10px 12px;margin:8px 0;font-size:14px}.tfadv summary,.tfcred summary{cursor:pointer;min-height:32px}.tfadv p,.tfcred p{margin:6px 0}
.tfx .tfchip.x{text-decoration:line-through;opacity:.55;border-style:dashed}html.dark-mode .tftip{background:#2d2614;color:#eee}
.tfchips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;min-height:30px}.tfchip{min-height:44px;border-radius:12px;border:2px solid #888;background:#fff;color:var(--ink);font:inherit;font-weight:700;padding:0 12px;touch-action:none;cursor:pointer}.tfchip.on{background:#2f7d32;color:#fff;border-color:#2f7d32}.tfchip.drag{position:relative;z-index:5;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.tftray{border:2px dashed #3b6fb6;border-radius:14px;min-height:64px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#f2f6fd}.tftray b{width:100%;font-size:13px;color:#3b6fb6}
.tfres.ok{border-color:#2e7d32}.tfres.no{border-color:#c62828}.tfres h3{margin:0 0 4px}.tfsc{display:flex;gap:5px;flex-wrap:wrap}.tfsc span{font-size:12.5px;font-weight:800;border-radius:8px;padding:2px 7px;background:#eee}.tfsc .ok{background:#c8e6c9;color:#1b5e20}.tfsc .mid{background:#fff3c4}.tfsc .no{background:#ffcdd2;color:#b71c1c}
.tfask{border:2px solid #f5c518!important}.tfpause{border:2px solid #e07b00!important;background:#fff8ec!important}.tfup{background:#fff3c4!important;border-color:#d4af37!important}.tfdef{background:#eef4ff!important}
.tfstats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.tfstats div{border:1px solid var(--line);border-radius:12px;background:#fff;padding:8px;text-align:center}.tfstats b{display:block;font-size:20px}.tfstats span{font-size:11.5px;color:var(--mute)}
.tfbar{display:flex;align-items:center;gap:6px;font-size:13px;margin:5px 0}.tfbar span{width:44%}.tfbar i{flex:1;height:10px;background:#eee;border-radius:5px;overflow:hidden}.tfbar i b{display:block;height:100%;background:#2f7d32}.tfbar em{width:38px;text-align:right;font-style:normal;font-weight:700}
.tfch{display:flex;align-items:flex-end;gap:4px;height:96px;margin-top:6px}.tfch div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}.tfch i{display:block;width:70%;background:#d23c3c;border-radius:3px 3px 0 0}.tfch em{font-style:normal;font-size:11px;font-weight:700}.tfch small{font-size:9.5px;color:var(--mute)}
.tfsum .big{font-size:18px}
html.dark-mode .tfstats div,html.dark-mode .tfchip:not(.on),html.dark-mode .tfcnt span{background:#262626;color:#eee}html.dark-mode .tftray{background:#1d2633}html.dark-mode .tfpause,html.dark-mode .tfup,html.dark-mode .tfdef{background:#2a2a2a!important}`;
{ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); }
try{ U().onClose(()=>{ stopTimer(); }); }catch(e){}
window.CRThink={_targets:targetsTip,_stepX:stepX,_W:()=>W,_silent:silent,open,sub,_own:ownOne,_def:defOne,_P:()=>W&&W.P,_play:id=>{ W={lvl:S().lvl}; play((bank().concat(TFBANK.def||[])).find(p=>p.id===id)||bank()[0]); },_speed:()=>{ W={lvl:S().lvl}; speed(); },_daily:daily,_finish:u=>{ W.st=Object.assign({marked:[],tray:[],F:[],cats:[]},W.st,{s4:null}); step4(W.P); W.st.s4=null; return finish(W.P,u,null); },_forcing:forcing,_reason:reason,_bank:()=>TFBANK};
})();
