/* v52: "Play a player's style". Type a Chess.com username: the app reads that player's PUBLIC game archives (api.chess.com),
   keeps them on this phone, builds an opening book from their moves and a mistake profile (checked by the bundled Stockfish worker
   in the background, once per game). The bot then plays their openings and makes mistakes about as often as they do.
   One preloaded bot, "Corban", ships ready-made (corban-profile.json). Re-checks for new games at most every 3 days. */
(function(){
"use strict"; if(window.CRStyle) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, CH=()=>window.ChessLib&&ChessLib.Chess||window.Chess;
const PFX="chessReview.v52.style.", BOOKPLY=30, DAY=864e5, REFRESH=3*DAY, DEPTH=8;
const key=f=>f.split(" ").slice(0,4).join(" ");
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const PRESET={corban:{user:"corban_hercules",name:"Corban",file:"corban-profile.json",sub:"Plays like Prishen's friend Corban"}};
const G="#d4af37", D="#1b1712", L="#f3e3b0";
const avatar=(letter,hat)=>`<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="${D}" stroke="${G}" stroke-width="2"/><circle cx="32" cy="26" r="11" fill="${G}"/>${hat?`<path d="M20 22q12-14 24 0l2 2H18z" fill="${L}"/><rect x="18" y="21" width="28" height="3" rx="1.5" fill="${L}"/>`:""}<path d="M16 58c0-11 7-17 16-17s16 6 16 17z" fill="${G}"/><text x="32" y="55" font-size="11" font-weight="800" text-anchor="middle" fill="${D}" font-family="sans-serif">${E_(letter)}</text></svg>`;
/* ---------- storage ---------- */
function load(user){ try{ return JSON.parse(localStorage.getItem(PFX+user.toLowerCase()))||null; }catch(e){ return null; } }
function save(d){ for(let t=0;t<4;t++){ try{ localStorage.setItem(PFX+d.user.toLowerCase(),JSON.stringify(d)); return true; }catch(e){ if(d.games.length<40) return false; const old=d.games.splice(0,Math.ceil(d.games.length*0.15)); old.forEach(g=>delete d.an[g.id]); } } return false; }
function users(){ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(PFX)) out.push(k.slice(PFX.length)); } return out; }
/* ---------- fetch + parse public games ---------- */
function sans(pgn){ const body=pgn.replace(/^\[.*\]\s*$/gm,"").replace(/\{[^}]*\}/g," ").replace(/\([^)]*\)/g," ").replace(/\$\d+/g," ");
  return body.split(/\s+/).map(t=>t.replace(/^\d+\.(\.\.)?/,"")).filter(t=>t&&!/^\d+\.+$/.test(t)&&!/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)); }
function parseGame(g,user){ if(!g.pgn||(g.rules&&g.rules!=="chess")) return null; const u=user.toLowerCase();
  const c=g.white&&g.white.username.toLowerCase()===u?"w":g.black&&g.black.username.toLowerCase()===u?"b":null; if(!c) return null;
  const C=CH(), ch=new C(), m=[]; for(const t of sans(g.pgn)){ let r=null; try{ r=ch.move(t,{sloppy:true}); }catch(e){} if(!r) break; m.push(r.san); }
  if(m.length<2) return null; const me=c==="w"?g.white:g.black;
  return {id:g.url||g.uuid||String(g.end_time),c,tc:g.time_class||"?",r:me.result==="win"?1:/agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(me.result)?0.5:0,e:me.rating,t:g.end_time||0,m}; }
async function getJSON(u){ const r=await fetch(u,{cache:"no-store"}); if(!r.ok) throw new Error(r.status===404?"No player with that username.":"Couldn't reach the server ("+r.status+")."); return r.json(); }
/* full=true: every month; otherwise only the newest archive(s) since the last check */
async function fetchGames(d,full,onP){ const a=(await getJSON(`https://api.chess.com/pub/player/${encodeURIComponent(d.user.toLowerCase())}/games/archives`)).archives||[];
  const todo=full?a:a.filter(u=>!d.lastMonth||u>=d.lastMonth); const have=new Set(d.games.map(g=>g.id)); let added=0;
  for(let i=0;i<todo.length;i++){ onP&&onP(`Reading games: month ${i+1} of ${todo.length}`,(i+1)/todo.length); let j; try{ j=await getJSON(todo[i]); }catch(e){ continue; }
    (j.games||[]).forEach(g=>{ const x=parseGame(g,d.user); if(x&&!have.has(x.id)){ d.games.push(x); have.add(x.id); added++; } }); }
  d.games.sort((x,y)=>x.t-y.t); if(a.length) d.lastMonth=a[a.length-1]; d.fetched=Date.now(); return added; }
/* ---------- book + mistake profile ---------- */
function book(d,ids){ const B={w:{},b:{}}, C=CH(); d.games.forEach(g=>{ if(ids&&!ids.has(g.id)) return; const ch=new C();
  for(let i=0;i<Math.min(BOOKPLY,g.m.length);i++){ const side=i%2?"b":"w"; if(side===g.c){ const k=key(ch.fen()), b=B[side][k]||(B[side][k]={}); b[g.m[i]]=(b[g.m[i]]||0)+1; } try{ ch.move(g.m[i]); }catch(e){ break; } } }); return B; }
function phaseOf(fen,ply){ if(ply<20) return "open"; const VAL={q:9,r:5,b:3,n:3}; let s=0; for(const ch of fen.split(" ")[0]) s+=VAL[ch.toLowerCase()]||0; return s<=26?"end":"mid"; }
/* analyse one game: [ply, phase, loss] for each of the player's moves */
async function analyseGame(g){ await CRBotEngine.boot(); const C=CH(), ch=new C(), fens=[ch.fen()]; g.m.forEach(x=>{ ch.move(x); fens.push(ch.fen()); });
  const sc=[]; for(let i=0;i<fens.length;i++){ const t=new C(fens[i]); if(t.isCheckmate()){ sc.push(-1000); continue; } if(t.isGameOver()){ sc.push(0); continue; }
    const l=await CRBotEngine.candidates(fens[i],1,400,DEPTH); const s=l[0]?l[0].score:0; sc.push(Math.max(-1000,Math.min(1000,s))); }
  const out=[]; for(let i=0;i<g.m.length;i++){ if((i%2?"b":"w")!==g.c) continue; const loss=Math.max(0,Math.min(1000,sc[i]+sc[i+1])); out.push([i,phaseOf(fens[i],i)[0],loss]); }
  return out; }
function profile(d,ids){ const P={}, T={}; ["o","m","e"].forEach(p=>P[p]={n:0,sum:0,inacc:0,mist:0,blun:0});
  d.games.forEach(g=>{ if(ids&&!ids.has(g.id)) return; const a=d.an[g.id]; if(!a) return; const t=T[g.tc]||(T[g.tc]={n:0,sum:0,blun:0});
    a.forEach(([ply,ph,loss])=>{ const x=P[ph]; x.n++; x.sum+=loss; t.n++; t.sum+=loss; if(loss>=300){ x.blun++; t.blun++; } else if(loss>=100) x.mist++; else if(loss>=50) x.inacc++; }); });
  const f=x=>({n:x.n,acpl:x.n?Math.round(x.sum/x.n):0,inacc:x.n?x.inacc/x.n:0,mist:x.n?x.mist/x.n:0,blun:x.n?x.blun/x.n:0});
  const tc={}; Object.keys(T).forEach(k=>tc[k]={n:T[k].n,acpl:T[k].n?Math.round(T[k].sum/T[k].n):0,blun:T[k].n?T[k].blun/T[k].n:0});
  return {open:f(P.o),mid:f(P.m),end:f(P.e),tc}; }
/* ---------- the bot ---------- */
const STR=[{id:0,label:"His style",scale:1,ms:350,depth:10},{id:1,label:"+200",scale:0.55,ms:600,depth:13},{id:2,label:"+400",scale:0.3,ms:900,depth:16}];
const pickW=o=>{ const e=Object.entries(o), tot=e.reduce((a,b)=>a+b[1],0); let r=Math.random()*tot; for(const [k,v] of e){ r-=v; if(r<=0) return k; } return e[0][0]; };
function makePicker(d,strength,opt){ opt=opt||{}; const B=opt.book||book(d), P=opt.prof||profile(d), S=STR[strength||0];
  return async function(fen,history){ const C=CH(), g=new C(fen), side=g.turn(), t0=Date.now(), legal=g.moves({verbose:true}); if(!legal.length) return null;
    const wait=async m=>{ if(opt.noDelay) return m; const ms=600+Math.random()*1600-(Date.now()-t0); if(ms>0) await new Promise(r=>setTimeout(r,ms)); return m; };
    const ply=history.length, bk=ply<BOOKPLY&&B[side][key(fen)];
    if(bk&&Object.keys(bk).length&&(strength===0||Math.random()<0.8)){ const san=pickW(bk), m=legal.find(x=>x.san===san); if(m) return wait(Object.assign({book:true},m)); }
    const ph=P[{o:"open",m:"mid",e:"end"}[phaseOf(fen,ply)[0]]]||P.mid, sc=S.scale;
    const r=Math.random(), cat=r<ph.blun*sc?"blun":r<(ph.blun+ph.mist)*sc?"mist":r<(ph.blun+ph.mist+ph.inacc)*sc?"inacc":"best";
    let list=[]; try{ await CRBotEngine.boot(); list=await CRBotEngine.candidates(fen,5,opt.ms||S.ms,opt.depth||S.depth); }catch(e){}
    const cand=list.map(c=>({c,m:legal.find(x=>x.from+x.to+(x.promotion||"")===c.uci)})).filter(x=>x.m); if(!cand.length) return wait(legal[Math.floor(Math.random()*legal.length)]);
    const best=cand[0].c.score, loss=x=>best-x.c.score, rng={inacc:[50,100],mist:[100,300],blun:[300,1e9]}[cat];
    if(cat==="best"){ const near=cand.filter(x=>loss(x)<=15); return wait(Object.assign({cat},near[Math.floor(Math.random()*near.length)].m)); }
    let pool=cand.filter(x=>loss(x)>=rng[0]&&loss(x)<rng[1]);
    if(!pool.length&&cat==="blun"){ const h=CRBotEngine.hangingMoves(fen); if(h.length) return wait(Object.assign({cat,blunder:true},h[Math.floor(Math.random()*h.length)])); }
    if(!pool.length) pool=[cand[Math.min(cand.length-1,cat==="inacc"?1:cand.length-1)]];
    return wait(Object.assign({cat},pool[Math.floor(Math.random()*pool.length)].m)); }; }
/* ---------- background analysis (only games not analysed yet) ---------- */
let running=null;
function analyseAll(d,onP){ if(running) return running; running=(async()=>{ const todo=d.games.filter(g=>!d.an[g.id]); let k=0;
  for(const g of todo){ while(window.CRBots&&CRBots._game()&&CRBots._game().bot.styleUser) await new Promise(r=>setTimeout(r,1500)); // pause while you play this bot
    try{ d.an[g.id]=await analyseGame(g); }catch(e){ console.warn(e); } k++; onP&&onP(k,todo.length); if(k%5===0||k===todo.length) save(d); }
  d.prof=profile(d); save(d); running=null; })(); return running; }
/* ---------- screens ---------- */
function preset(id){ return PRESET[id]; }
async function ensure(user,presetId){ let d=load(user); if(d) return d;
  if(presetId){ try{ const r=await fetch(PRESET[presetId].file); if(r.ok){ d=await r.json(); d.user=PRESET[presetId].user; save(d); return d; } }catch(e){} }
  return null; }
function botFor(d,strength,presetId){ const p=d.prof||profile(d), name=presetId?PRESET[presetId].name:d.user, el=avgElo(d);
  return {id:presetId||"ps-"+d.user.toLowerCase(),name:name+(strength?" "+STR[strength].label:""),elo:el+(strength?200*strength:0),style:(presetId?"Plays like Corban":"Plays like "+d.user)+" · "+STR[strength].label,styleUser:d.user,
    avatar:avatar((name[0]||"?").toUpperCase(),!!presetId),chat:{start:["Let's play. I'll play my usual openings."],capture:["Got one!"],check:["Check!"],lost:["Good game, you won."],won:["Good game!"],draw:["A draw."]},
    pick:makePicker(d,strength)}; }
function avgElo(d){ const r=d.games.filter(g=>g.tc==="rapid"&&g.e).slice(-30); const a=(r.length?r:d.games.filter(g=>g.e).slice(-30)); return a.length?Math.round(a.reduce((s,g)=>s+g.e,0)/a.length/10)*10:0; }
const pct=x=>(x*100).toFixed(x<0.1?1:0)+"%";
function statsHtml(d){ const p=profile(d), B=book(d), nb=Object.keys(B.w).length+Object.keys(B.b).length, done=d.games.filter(g=>d.an[g.id]).length;
  const row=(t,x)=>`<tr><td>${t}</td><td>${x.n?x.acpl:"–"}</td><td>${x.n?pct(x.blun):"–"}</td><td>${x.n?pct(x.mist):"–"}</td></tr>`;
  return `<div class="card"><b>📒 What the bot knows</b><p class="mute" style="margin:4px 0">${d.games.length} games · ${nb} opening positions in the book · ${done} of ${d.games.length} games checked for mistakes</p>
   <table style="width:100%;font-size:13px;border-collapse:collapse"><tr><th align="left">Part of game</th><th align="left">Avg. loss</th><th align="left">Blunders</th><th align="left">Mistakes</th></tr>${row("Opening",p.open)}${row("Middle",p.mid)}${row("Endgame",p.end)}</table>
   <p class="mute" style="margin:4px 0">Avg. loss = how much a move gives away on average (100 = about a pawn). Blunder = gives away 3+ pawns.</p></div>`; }
async function open(user,presetId,note){ const p=U().show("bots52"); let d=await ensure(user,presetId);
  if(!d){ p.innerHTML=`<p>Loading…</p>`; return addUser(user); }
  const name=presetId?PRESET[presetId].name:d.user, el=avgElo(d); let strength=+(U().LS.get(PFX+"str."+d.user.toLowerCase(),0));
  p.innerHTML=`<h2>${name} <span class="elo">${el}</span></h2><div class="say"><span class="av">${avatar((name[0]||"?").toUpperCase(),!!presetId)}</span><span class="bub">${presetId?"Plays the openings Corban plays, and slips up about as often as he does.":"Plays the openings this player plays, and slips up about as often as they do."}</span></div>
   <div id="ps52note" class="mute"></div><div id="ps52prog"></div><div id="ps52st">${statsHtml(d)}</div>
   <h3>Strength</h3><div class="row" id="ps52s">${STR.map(s=>`<button class="bt ${s.id===strength?"go":""}" data-s="${s.id}">${s.label}</button>`).join("")}</div>
   <h3>Play as</h3><div class="row"><button class="bt go" data-c="w">♔ White</button><button class="bt go" data-c="b">♚ Black</button></div><div class="row"><button class="bt" id="ps52back">‹ All bots</button>${presetId?"":`<button class="bt" id="ps52del">🗑 Remove</button>`}</div>`;
  p.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ strength=+b.dataset.s; U().LS.set(PFX+"str."+d.user.toLowerCase(),strength); p.querySelectorAll("[data-s]").forEach(x=>x.classList.toggle("go",x===b)); });
  p.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>CRBots._startBot(botFor(d,strength,presetId),b.dataset.c));
  $("ps52back").onclick=()=>CRBots.open(); if($("ps52del")) $("ps52del").onclick=()=>{ if(confirm("Remove this player's games from your phone?")){ localStorage.removeItem(PFX+d.user.toLowerCase()); CRBots.open(); } };
  const prog=(t,f)=>{ const e=$("ps52prog"); if(!e) return; e.innerHTML=f>=1?"":`<div class="card"><b>${E_(t)}</b><div style="height:10px;background:#eee;border-radius:5px;margin-top:6px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(f*100)}%;background:#d4af37"></i></div></div>`; };
  const an=()=>{ const left=d.games.filter(g=>!d.an[g.id]).length; if(!left) return; analyseAll(d,(k,n)=>{ prog(`Checking games for mistakes: ${k} of ${n} (runs in the background)`,k/n); if(k===n||k%5===0){ const s=$("ps52st"); if(s) s.innerHTML=statsHtml(d); } }); };
  if(note) $("ps52note").textContent=note;
  if(Date.now()-(d.fetched||0)>REFRESH&&navigator.onLine!==false){ $("ps52note").textContent="Checking for new games…";
    fetchGames(d,false,null).then(n=>{ save(d); const t=n?`Updated: ${n} new game${n>1?"s":""} added. The bot is learning them now.`:"Up to date: no new games since the last check."; const e=$("ps52note"); if(e) e.textContent=t+" (checks every 3 days)"; const s=$("ps52st"); if(s) s.innerHTML=statsHtml(d); an(); })
      .catch(()=>{ const e=$("ps52note"); if(e) e.textContent="Couldn't check for new games right now. Using the saved games."; an(); }); }
  else { if(!note) $("ps52note").textContent=`Last checked for new games ${Math.max(0,Math.round((Date.now()-d.fetched)/DAY))} day(s) ago. Checks every 3 days.`; an(); } }
async function addUser(user){ user=(user||"").trim().replace(/^@/,""); const p=U().show("bots52");
  if(!/^[A-Za-z0-9_-]{3,25}$/.test(user)){ CRBots.open(); return; }
  p.innerHTML=`<h2>👤 ${E_(user)}</h2><div id="ps52prog" class="card"><b id="ps52t">Looking up ${E_(user)}…</b><div style="height:10px;background:#eee;border-radius:5px;margin-top:6px;overflow:hidden"><i id="ps52f" style="display:block;height:100%;width:3%;background:#d4af37"></i></div></div><div class="row"><button class="bt" id="ps52back">‹ All bots</button></div>`;
  $("ps52back").onclick=()=>CRBots.open();
  const d={user,games:[],an:{},fetched:0,lastMonth:""};
  try{ await fetchGames(d,true,(t,f)=>{ $("ps52t")&&($("ps52t").textContent=t); $("ps52f")&&($("ps52f").style.width=Math.round(f*100)+"%"); }); }
  catch(e){ if($("ps52t")) $("ps52t").textContent="⚠️ "+e.message; return; }
  if(!d.games.length){ if($("ps52t")) $("ps52t").textContent="No public games found for this player."; return; }
  save(d); open(user,null,`Loaded ${d.games.length} games.`); }
function listExtra(p){ const known=users().filter(u=>!u.startsWith("str.")&&u!==PRESET.corban.user);
  const box=document.createElement("div");
  box.innerHTML=`<h3>👤 Play a player's style</h3><p class="mute">Type a Chess.com username. The bot learns that player's openings and mistakes from their public games.</p>
   ${known.map(u=>{ const d=load(u); return d?`<button class="lt" data-ps="${E_(d.user)}"><span class="av">${avatar(d.user[0].toUpperCase())}</span><span><b>${E_(d.user)}</b><small>${d.games.length} games learned</small></span></button>`:""; }).join("")}
   <div class="row" style="flex-wrap:nowrap"><input type="text" id="ps52u" placeholder="Username" autocapitalize="off" autocorrect="off" spellcheck="false"><button class="bt go" id="ps52go">Learn</button></div>`;
  p.appendChild(box); box.querySelectorAll("[data-ps]").forEach(b=>b.onclick=()=>open(b.dataset.ps));
  $("ps52go").onclick=()=>{ const u=$("ps52u").value.trim(); if(u.toLowerCase()===PRESET.corban.user) open(PRESET.corban.user,"corban"); else if(load(u)) open(u); else addUser(u); }; }
/* Corban: a named, preloaded bot in the normal list */
(window.CRBotsData=window.CRBotsData||[]).push({id:"corban",name:"Corban",elo:430,style:"Plays like a real friend",tag:"Real player's style",
  story:"Learned from Corban's real games: his favourite openings and how often he slips up. Keeps learning as he plays.",
  avatar:avatar("C",true),chat:{start:[""]},open:()=>open(PRESET.corban.user,"corban")});
/* holdout test helper (used by the test script): train on 85%, check how often the bot plays the player's real move on the other 15% */
async function holdout(d,frac,maxOut){ const ids=d.games.map(g=>g.id), test=new Set(ids.filter((id,i)=>(i*7919)%100<frac*100)), train=new Set(ids.filter(i=>!test.has(i)));
  const B=book(d,train), P=profile(d,train), pick=makePicker(d,0,{book:B,prof:P,noDelay:true,ms:250,depth:10}), C=CH();
  let bN=0,bTop=0,bSamp=0,oN=0,oHit=0,eHit=0,cov=0,tot=0;
  for(const g of d.games){ if(!test.has(g.id)) continue; const ch=new C();
    for(let i=0;i<g.m.length;i++){ const side=i%2?"b":"w"; if(side===g.c){ const fen=ch.fen(), bk=i<BOOKPLY&&B[side][key(fen)];
        if(i<BOOKPLY) tot++;
        if(bk){ cov++; bN++; const e=Object.entries(bk).sort((a,b)=>b[1]-a[1]); if(e[0][0]===g.m[i]) bTop++; bSamp+=(bk[g.m[i]]||0)/e.reduce((s,x)=>s+x[1],0); }
        else if(oN<maxOut&&i>=6){ oN++; const m=await pick(fen,g.m.slice(0,i)); if(m&&m.san===g.m[i]) oHit++; const l=await CRBotEngine.candidates(fen,1,250,10); if(l[0]&&ch.moves({verbose:true}).some(x=>x.from+x.to+(x.promotion||"")===l[0].uci&&x.san===g.m[i])) eHit++; } }
      ch.move(g.m[i]); } }
  return {trainGames:train.size,testGames:test.size,bookPositionsTried:bN,bookTop1:bN?bTop/bN:0,bookSampled:bN?bSamp/bN:0,bookCoverage:tot?cov/tot:0,outOfBookTried:oN,outOfBookMatch:oN?oHit/oN:0,engineBestMatch:oN?eHit/oN:0}; }
window.CRStyle={open,addUser,listExtra,load,save,fetchGames,analyseAll,analyseGame,book,profile,makePicker,holdout,parseGame,_STR:STR};
})();
