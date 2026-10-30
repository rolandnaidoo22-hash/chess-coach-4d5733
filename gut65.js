/* v65: Emotion tags + "Your Gut Check". Tag a move as confident, guessing or panicking; later see how often each feeling was right.
   Optional, never blocks play, one tap to undo. Everything stays on this phone. */
(function(){ "use strict"; if(window.CRGut65) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LG=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, LS=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const KG="chessReview.v65.gut", KP="chessReview.v65.gutGames", MIN=3;
const F=[["conf","😎","Confident","you felt confident"],["guess","🤔","Guessing","you were guessing"],["panic","😰","Panicking","you felt panicky"]], FN=k=>F.find(f=>f[0]===k);
const GOOD=["best","brilliant","great","excellent","good","book"], BAD=["mistake","blunder","miss"];
const PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const all=()=>LG(KG,[]), save=L=>LS(KG,L.slice(-600));
function chips(cur,attr){ return `<div class="gt65c" role="group" aria-label="How did this move feel?">${F.map(([k,i,t])=>`<button type="button" ${attr}="${k}" class="${cur===k?"on":""}" aria-pressed="${cur===k}">${i} ${t}</button>`).join("")}</div>`; }
function setTag(o){ const L=all(), i=L.findIndex(x=>x.gid===o.gid&&x.ply===o.ply); if(i>=0){ if(L[i].feel===o.feel){ L.splice(i,1); save(L); return null; } L[i]=Object.assign(L[i],o); } else L.push(Object.assign({at:Date.now()},o)); save(L); return o.feel; }
const tagOf=(gid,ply)=>{ const x=all().find(x=>x.gid===gid&&x.ply===ply); return x&&x.feel; };
/* ---------- in-app games ---------- */
function lastMine(G){ const h=G.g.history({verbose:true}); for(let i=h.length-1;i>=0;i--) if(h[i].color===G.me){ let fen=h[i].before; if(!fen){ try{ const c=new (CR52.CH())(G.start||undefined); h.slice(0,i).forEach(m=>c.move({from:m.from,to:m.to,promotion:m.promotion})); fen=c.fen(); }catch(e){} } return {ply:i+1,m:h[i],fen}; } return null; }
function box(){ let el=$("gt65g"); if(!el){ const a=$("b52ask"); if(!a) return null; el=document.createElement("div"); el.id="gt65g"; a.insertAdjacentElement("afterend",el); } return el; }
function draw(G){ if(!G||!G.g) return; if(!G.gid) G.gid="app"+(G.t0||(G.t0=Date.now())); const el=box(); if(!el) return; const g=G.g;
  if(g.isGameOver()){ const n=all().filter(x=>x.gid===G.gid).length; el.innerHTML=n?`<div class="gt65end">You tagged ${n} move${n>1?"s":""} with a feeling. <button type="button" id="gt65see">🫀 See your gut check</button></div>`:""; const b=$("gt65see"); if(b) b.onclick=()=>check(G.gid).then(()=>open(G.gid)); return; }
  const L=lastMine(G); if(!L){ el.innerHTML=""; return; } const cur=tagOf(G.gid,L.ply);
  el.innerHTML=`<div class="gt65"><span>How did your last move feel? <small>(optional)</small></span>${chips(cur,"data-gt")}</div>`;
  el.querySelectorAll("[data-gt]").forEach(b=>b.onclick=()=>{ setTag({gid:G.gid,ply:L.ply,feel:b.dataset.gt,fen:L.fen||null,uci:L.m.from+L.m.to+(L.m.promotion||""),side:G.me,src:"app",opp:G.bot&&G.bot.name,cls:null}); draw(G); }); }
function finish(G){ try{ if(!G||!G.gid) return; const L=all().filter(x=>x.gid===G.gid); if(!L.length) return; const g=G.g, C=new (CR52.CH())(); g.history().forEach(s=>C.move(s));
  const h=g.history({verbose:true}); const A=all(); A.forEach(x=>{ if(x.gid===G.gid&&!x.fen&&h[x.ply-1]) x.fen=h[x.ply-1].before; }); save(A.filter(x=>x.gid!==G.gid||x.ply<=h.length));
  const P=LG(KP,[]).filter(p=>p.gid!==G.gid); P.push({gid:G.gid,pgn:C.pgn(),me:G.me,bot:G.bot&&G.bot.name,at:Date.now()}); LS(KP,P.slice(-20)); draw(G); }catch(e){ console.warn(e); } }
/* check tagged in-app games with the same quick review the app uses everywhere */
let busy=false;
async function check(only){ if(busy) return; const P=LG(KP,[]).filter(p=>!only||String(p.gid)===String(only)); if(!P.length) return; busy=true;
  try{ for(const p of P){ for(let w=0;ReviewApp.isRunning()&&w<240;w++) await new Promise(r=>setTimeout(r,1000));
      let d; try{ ReviewApp.setRunning(true); const eng=await ReviewApp.getEngine(); d=await Analyzer.analyzeGame(p.pgn,{engine:eng,username:"You",side:p.me,mode:"quick",cancelled:()=>false},()=>{}); }catch(e){ d=null; } finally{ ReviewApp.setRunning(false); }
      if(!d) continue; const A=all(); A.forEach(x=>{ if(x.gid===p.gid){ const q=d.plies[x.ply-1]; if(q){ x.cls=q.cls; x.fen=q.fen_before||x.fen; x.uci=q.uci||x.uci; } } }); save(A); LS(KP,LG(KP,[]).filter(z=>z.gid!==p.gid)); } }
  finally{ busy=false; } }
/* ---------- game review (in-app or synced online games) ---------- */
function rgid(){ try{ return ReviewApp.gameId(DATA); }catch(e){ return null; } }
function rv(){ const mv=$("mv63"); if(!mv) return; let el=$("gt65r"); if(!el){ el=document.createElement("div"); el.id="gt65r"; mv.insertAdjacentElement("afterend",el); }
  let p=null; try{ p=cur>0&&P&&P[cur-1]; }catch(e){} const mine=p&&(p.user||p.color===UC), gid=rgid();
  if(!mine||!gid){ el.innerHTML=""; return; } const ply=cur, t=tagOf(gid,ply);
  el.innerHTML=`<div class="gt65 rv"><span>How did you feel about this move? <small>(optional)</small></span>${chips(t,"data-gr")}</div>`;
  el.querySelectorAll("[data-gr]").forEach(b=>b.onclick=()=>{ const link=(M&&M.link)||""; setTag({gid,ply,feel:b.dataset.gr,fen:p.fen_before,uci:p.uci,side:p.color,cls:p.cls,src:/^https?:/.test(link)?"online":"review",opp:p.color==="w"?M.black:M.white}); rv(); sumCard(); }); }
function sumCard(){ const s=$("rv59sum")||$("summary"); if(!s) return; let el=$("gt65s"); const gid=rgid(), L=gid?all().filter(x=>x.gid===gid&&x.cls):[];
  if(!L.length){ if(el) el.remove(); return; } if(!el){ el=document.createElement("div"); el.id="gt65s"; el.className="card gt65sum"; s.appendChild(el); }
  const lines=F.map(([k,i,,w])=>{ const T=L.filter(x=>x.feel===k); if(!T.length) return ""; const g=T.filter(x=>GOOD.includes(x.cls)).length; return `<li>${i} ${w[0].toUpperCase()+w.slice(1)} on ${T.length} move${T.length>1?"s":""}: ${g} ${g===1?"was":"were"} good.</li>`; }).join("");
  el.innerHTML=`<b>🫀 Your gut check for this game</b><ul>${lines}</ul><button type="button" id="gt65op">See all your feelings</button>`; $("gt65op").onclick=()=>open(); }
(function hook(){ if(typeof window.show!=="function"||typeof window.buildSummary!=="function") return setTimeout(hook,300);
  const os=window.show; window.show=show=function(){ const r=os.apply(this,arguments); try{ rv(); }catch(e){} return r; };
  const ob=window.buildSummary; window.buildSummary=buildSummary=function(){ const r=ob.apply(this,arguments); try{ setTimeout(()=>{ sumCard(); rv(); },30); }catch(e){} return r; }; })();
/* ---------- "Your Gut Check" ---------- */
function where(x){ return x.src==="app"?`in your game against ${E_(x.opp||"a bot")}`:x.src==="online"?`in your online game against ${E_(x.opp||"an opponent")}`:`in a game you reviewed`; }
function moveWords(x){ try{ const g=new (CR52.CH())(x.fen), m=g.move({from:x.uci.slice(0,2),to:x.uci.slice(2,4),promotion:x.uci[4]||"q"}); return `${m.captured?"taking with":"moving"} your ${PN[m.piece]}`; }catch(e){ return "that move"; } }
function stats(){ const L=all(), J=L.filter(x=>x.cls), out={}; F.forEach(([k])=>{ const T=J.filter(x=>x.feel===k); out[k]={n:T.length,good:T.filter(x=>GOOD.includes(x.cls)).length,bad:T.filter(x=>BAD.includes(x.cls)).length,wait:L.filter(x=>x.feel===k&&!x.cls).length}; }); return {L,J,out}; }
function open(focus){ try{ CRHome.setMode("app",true); }catch(e){} const p=CR52.show("gc65"), S=stats(), pend=LG(KP,[]).length;
  const rows=F.map(([k,i,t,w])=>{ const s=S.out[k]; if(s.n>=MIN) return `<li class="gt65row"><span class="i">${i}</span><span>When ${w}, your move was good <b>${s.good} of ${s.n}</b> times.${s.bad?`<small>${s.bad} turned out to be a mistake or worse.</small>`:""}</span></li>`;
    const need=MIN-s.n; return `<li class="gt65row"><span class="i">${i}</span><span><b>${t}:</b> tag ${need} more move${need>1?"s":""} with this feeling to see how often it is right.${s.n?`<small>${s.n} so far.</small>`:""}</span></li>`; }).join("");
  const mis=S.J.filter(x=>(x.feel==="conf"&&BAD.includes(x.cls))||(x.feel==="panic"&&GOOD.includes(x.cls))).sort((a,b)=>b.at-a.at).slice(0,12);
  p.innerHTML=`<h2>🫀 Your Gut Check</h2><p class="mute">How often your feeling about a move matched how good the move really was. Tag moves while you play or in Review. It stays on this phone.</p>
   <div class="card"><ul class="gt65l">${rows}</ul>${pend?`<p class="mute">${pend} game${pend>1?"s have":" has"} tagged moves waiting to be checked.</p><button type="button" id="gt65chk" class="bs64go">Check them now</button>`:""}</div>
   <div class="card"><b>Where your feeling misled you</b>${mis.length?`<ul class="gt65m">${mis.map((x,j)=>`<li><button type="button" data-mi="${j}">${x.feel==="conf"?"😎 You felt sure, but it was a mistake":"😰 You felt panicky, but it was a good move"}<small>${E_(where(x))}, move ${Math.ceil(x.ply/2)}</small></button><div class="gt65bd" id="gt65b${j}" hidden></div></li>`).join("")}</ul>`:`<p>Nothing yet. When a sure-feeling move goes wrong, or a panicky one turns out well, it shows up here.</p>`}</div>`;
  p.querySelectorAll("[data-mi]").forEach(b=>b.onclick=()=>{ const x=mis[+b.dataset.mi], d=$("gt65b"+b.dataset.mi); if(!d.hidden){ d.hidden=true; return; }
    const bad=x.feel==="conf"; d.innerHTML=x.fen?`${CR52.mini(x.fen,x.side||"w",{arrows:[{u:x.uci,c:bad?"#d97706":"#2f7d32"}]})}<p>${bad?`Here, ${moveWords(x)} felt safe, but it gave something away. A quick look at what your opponent can take next would have caught it.`:`Here, ${moveWords(x)} felt scary, but it was a good move. Your first instinct was right.`}</p>`:"<p>No board saved for this move.</p>"; d.hidden=false; });
  const c=$("gt65chk"); if(c) c.onclick=async()=>{ c.disabled=true; c.textContent="Checking… you can keep using the app"; await check(); open(); };
  return S; }
const st=document.createElement("style"); st.textContent=`
.gt65{margin:8px 0;padding:8px 10px;border-radius:14px;background:var(--card,#fff);border:1px solid var(--line,#ddd)}.gt65>span{display:block;font-size:15px;margin-bottom:6px}.gt65 small{color:var(--mute,#666)}
.gt65c{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.gt65c button{min-height:52px;border-radius:14px;border:2px solid var(--line,#ccc);background:#fff;font:inherit;font-size:15px;font-weight:700;padding:4px 2px;color:#222}
.gt65c button.on{border-color:#3b6fb6;background:#e8f0fb}html.dark-mode .gt65c button{background:#262626;color:#eee}html.dark-mode .gt65c button.on{background:#1d3352}
.gt65end{margin:8px 0;font-size:15px}.gt65end button,.gt65sum button{min-height:46px;border-radius:12px;border:1px solid #3b6fb6;background:#fff;font:inherit;font-weight:700;padding:0 14px;margin-top:6px}
.gt65l,.gt65m{list-style:none;padding:0;margin:6px 0}.gt65row{display:flex;gap:10px;padding:8px 0;font-size:16.5px}.gt65row .i{font-size:22px}.gt65row small{display:block;color:var(--mute,#666);font-size:13.5px}
.gt65m button{width:100%;text-align:left;min-height:52px;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff;font:inherit;font-size:15.5px;padding:8px 10px;margin:4px 0}.gt65m small{display:block;color:var(--mute,#666);font-size:13px}
.gt65bd{padding:6px 0}.gt65bd svg{max-width:100%;height:auto}.gt65bd p{font-size:16px}`;
document.head.appendChild(st);
window.CRGut65={draw,finish,check,open,stats,setTag,_all:all};
})();
