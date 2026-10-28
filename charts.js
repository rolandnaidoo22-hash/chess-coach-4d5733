/* charts.js (v56): "My charts" — six charts from your public Chess.com / Lichess games.
   Each chart answers one question, gives one takeaway computed from the data, and one "Practise this" button.
   Engine numbers come only from the app's own engine analysis; nothing is estimated without it. Not affiliated with Chess.com or Lichess. */
(function(){ "use strict"; if(window.CRCharts) return;
const $=id=>document.getElementById(id), LS={get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }};
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KG="chessReview.v56.charts.games", KA="chessReview.v56.charts.an", MAXKEEP=250, ANN=40, BIG=300, REFRESH=6*3600e3;
const pct=x=>Math.round(100*x)+"%", mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const score=gs=>gs.length?gs.reduce((s,g)=>s+g.r,0)/gs.length:0;
const TCN={bullet:"Bullet",blitz:"Blitz",rapid:"Rapid",daily:"Daily",classical:"Rapid"};
const tcN=t=>TCN[t]||"Other";
function who(){ const A=window.CRAcct; if(!A) return {cc:"",li:""}; return {cc:(A.cc&&A.cc())||"",li:(A.li&&A.li())||""}; }
const keyOf=w=>(w.cc||"").toLowerCase()+"|"+(w.li||"").toLowerCase();
/* ---------- data ---------- */
async function fetchGames(w){ const out=[], notes=[];
  if(w.cc){ const r=await CRStudy.fetchOwn("c"); out.push(...r.games); notes.push(...r.notes.map(n=>"Chess.com: "+n)); }
  if(w.li){ const r=await CRStudy.fetchOwn("l"); out.push(...r.games); notes.push(...r.notes.map(n=>"Lichess: "+n)); }
  const seen=new Set(), gs=out.filter(g=>g&&!seen.has(g.id)&&seen.add(g.id)).sort((a,b)=>a.t-b.t).slice(-MAXKEEP); return {games:gs,notes}; }
function saveGames(c){ for(let i=0;i<4;i++){ if(LS.set(KG,c)) return; c.games=c.games.slice(Math.ceil(c.games.length/4)); } }
let busy=false;
async function load(force){ const w=who(), k=keyOf(w); let c=LS.get(KG,null); if(c&&c.k!==k) c=null; const stale=c&&c.games&&c.games.length&&!("op" in c.games[c.games.length-1]);
  if(c&&!force&&!stale&&Date.now()-c.t<REFRESH) return c;
  try{ const r=await fetchGames(w); if(!r.games.length&&c) return Object.assign(c,{note:r.notes.join(" ")||"Couldn't refresh; showing saved games."});
    c={k,t:Date.now(),games:r.games,notes:r.notes}; saveGames(c); return c; }
  catch(e){ if(c) return Object.assign(c,{note:"Offline or couldn't refresh: showing your saved games."}); throw e; } }
function anAll(){ return LS.get(KA,{}); }
/* ---------- svg helpers ---------- */
function line(series,o){ const W=340,H=160,pl=34,pr=8,pt=10,pb=20; const all=series.flatMap(s=>s.v).filter(v=>v!=null); if(all.length<2) return "";
  let mn=Math.min(...all), mx=Math.max(...all); if(o.min!=null) mn=Math.min(mn,o.min); if(o.max!=null) mx=Math.max(mx,o.max); if(mx-mn<20){ mn-=10; mx+=10; }
  const n=series[0].v.length, X=i=>pl+(W-pl-pr)*(n<2?0:i/(n-1)), Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  const grid=[mn,(mn+mx)/2,mx].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#ddd"/><text x="${pl-4}" y="${(Y(v)+4).toFixed(1)}" font-size="10" text-anchor="end" fill="#888">${Math.round(v)}</text>`).join("");
  const pl_=s=>`<polyline points="${s.v.map((v,i)=>v==null?null:X(i).toFixed(1)+","+Y(v).toFixed(1)).filter(Boolean).join(" ")}" fill="none" stroke="${s.c}" stroke-width="${s.w||2}" opacity="${s.o||1}"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E_(o.label||"")}">${grid}${series.map(pl_).join("")}<text x="${pl}" y="${H-5}" font-size="10" fill="#888">older</text><text x="${W-pr}" y="${H-5}" font-size="10" fill="#888" text-anchor="end">newest</text></svg>`; }
function bars(rows){ /* rows: {label, val 0..1, txt, n, flag, c} */ return `<div class="c56bars">${rows.map(r=>`<div class="c56br"><div class="c56bl"><span>${E_(r.label)}</span><small>${r.n} game${r.n===1?"":"s"}${r.flag?` · <b class="c56sm">small sample</b>`:""}</small></div><div class="c56bt"><i style="width:${Math.max(2,Math.round(100*r.val))}%;background:${r.c||"#3b6fb6"}"></i></div><small class="c56lg" style="margin-top:2px">${E_(r.txt)}</small></div>`).join("")}</div>`; }
function stack(rows){ /* rows: {label,n,w,d,l} */ return `<div class="c56bars">${rows.map(r=>{ const t=r.n||1; return `<div class="c56br"><div class="c56bl"><span>${E_(r.label)}</span><small>${r.n} games</small></div><div class="c56st"><i style="width:${100*r.w/t}%;background:#2e7d32"></i><i style="width:${100*r.d/t}%;background:#9e9e9e"></i><i style="width:${100*r.l/t}%;background:#c62828"></i></div><small class="c56lg">${r.w} won · ${r.d} drawn · ${r.l} lost · score ${pct(r.s)}</small></div>`; }).join("")}</div>`; }
/* ---------- practise targets (existing features only) ---------- */
const GO={
  think:["🧠 Practise: Think First",()=>window.CRThink&&CRThink.open()],
  openings:["♞ Practise: Learn openings",()=>window.CROpenings&&CROpenings.open()],
  myopen:["📖 Practise: My Openings",()=>window.CROpen&&CROpen.open(false)],
  pawn:["👑 Practise: Pawn endgames",()=>window.Trainer&&Trainer.open("pawn")],
  lessons:["🎓 Practise: Checkmate & king-safety lessons",()=>window.Trainer&&Trainer.open("sec","lessons")],
  drills:["⚡ Practise: Quick drills",()=>window.Trainer&&Trainer.open("sec","drills")],
  def:["🛡 Practise: Save yourself",()=>window.CRThink&&CRThink._def()],
  blunders:["🩹 Practise: Puzzles from my blunders",()=>window.CRBlunders&&CRBlunders.open()],
  session:["☀️ Practise: Today's session",()=>window.CRThink&&CRThink._daily()],
  puzzles:["🧩 Practise: Puzzles from your mistakes",()=>window.Trainer&&Trainer.open("sec","puzzles")]};
function card(id,q,body,take,n,go){ return `<div class="card c56" id="c56-${id}"><h3>${E_(q)}</h3><div class="c56n">${E_(n)}</div>${body}<p class="c56t">${take}</p>${go?`<button class="v42b pri full c56go" data-go="${go}">${GO[go][0]}</button>`:""}</div>`; }
/* ---------- v57: hung pieces + streak ---------- */
function cHung(G){ const B=window.CRBlunders; if(!B||!window.CRGuard) return ""; const S=B.hungSeries(G), gu=B.guard(), A=anAll(), set=G.slice(-ANN), done=set.filter(g=>A[g.id]).length;
  const nG=S.filter(x=>x.src==="g").length, nB=S.length-nG, q="Am I hanging fewer pieces?";
  const warnTxt=(gu.heed||gu.ign)?` Blunder check vs bots: you took back ${gu.heed||0} and played on ${gu.ign||0} time${(gu.ign||0)===1?"":"s"}.`:"";
  if(S.length<2){ return card("hung",q,`<p class="c56na">${nG?"":"Not analysed yet. "}Needs at least 2 checked games or bot games.</p>${done<set.length?`<button class="v42b full c56an">🔎 Analyse my ${set.length} newest games</button><div class="c56pg"></div>`:""}`,"Play a bot game or check your games to start this chart."+warnTxt,`${nG} games checked · ${nB} bot games`,"def"); }
  const L=S.slice(-20), mx=Math.max(1,...L.map(x=>x.n)), h=Math.floor(L.length/2), avg=a=>a.reduce((x,y)=>x+y.n,0)/Math.max(1,a.length), a1=avg(L.slice(0,h)), a2=avg(L.slice(h)), f=x=>(Math.round(x*10)/10).toString();
  const body=`<div class="c57hb">${L.map(x=>`<div title="${new Date(x.t).toLocaleDateString("en-GB")}"><em>${x.n}</em><i class="${x.src}" style="height:${Math.max(3,70*x.n/mx)}px"></i><small>${new Date(x.t).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</small></div>`).join("")}</div>
   <span class="c56lg"><b class="c57k g"></b> your games (checked) · <b class="c57k b"></b> bot games · oldest on the left</span>`;
  const take=L.length<6?`Only ${L.length} games so far. Average ${f(avg(L))} hung pieces a game.`:a2<a1-.15?`<b>Yes.</b> Down from ${f(a1)} to ${f(a2)} hung pieces a game. Keep it up.`:a2>a1+.15?`<b>No, more lately:</b> up from ${f(a1)} to ${f(a2)} a game. Practise spotting threats.`:`<b>About the same:</b> ${f(a2)} a game. Practise spotting threats to bring it down.`;
  return card("hung",q,body,take+warnTxt,`${nG} games checked · ${nB} bot games · a hung piece = a move that let them win a piece (rule check)`,"def"); }
function cStreak(){ const B=window.CRBlunders; if(!B) return ""; const s=B.streak();
  const body=`<div class="c57st">${s.last.map(d=>`<i class="${d.on?"on":""}" title="${d.d}"></i>`).join("")}</div><span class="c56lg">Last 28 days, oldest first. Green = you trained that day.</span>`;
  const take=s.n?`<b>${s.n}-day streak</b> 🔥 Best ever: ${s.best} days. Do today's session to keep it going.`:s.total?`No streak right now. Best ever: ${s.best} days. Start a new one today.`:`No training days yet. Do today's session to start a streak.`;
  return card("streak","Am I training every day?",body,take,`${s.total} training day${s.total===1?"":"s"} in total`,"session"); }
/* ---------- the six charts ---------- */
function cRating(G,sel){ const tk=g=>(g.site==="l"||/lichess\.org/.test(g.id)?"Lichess ":"Chess.com ")+tcN(g.tc), cls={}; G.forEach(g=>{ if(g.e) cls[tk(g)]=(cls[tk(g)]||0)+1; }); const order=Object.keys(cls).sort((a,b)=>cls[b]-cls[a]); sel=cls[sel]?sel:order[0];
  if(!sel) return card("rating","Am I actually improving?","","No rated games found yet.","0 games","think");
  const L=G.filter(g=>tk(g)===sel&&g.e), v=L.map(g=>g.e), k=Math.min(10,Math.floor(v.length/2));
  const chips=`<div class="v42chips c56tc">${order.map(c=>`<button data-tc="${c}" class="${c===sel?"on":""}">${c} (${cls[c]})</button>`).join("")}</div>`;
  let take="Need at least 4 rated games in one time control to tell.";
  if(k>=2){ const a=Math.round(mean(v.slice(0,k))), b=Math.round(mean(v.slice(-k))), d=b-a, sw=Math.round(Math.max(...v.slice(-k))-Math.min(...v.slice(-k)));
    take=d>=25?`Yes: your last ${k} games average <b>${b}</b>, up <b>${d}</b> from <b>${a}</b> in your first ${k}. Keep the habit that got you here.`
      :d<=-25?`Down: your last ${k} games average <b>${b}</b>, ${-d} below <b>${a}</b> in your first ${k}. Slow down and check every move.`
      :`Flat: <b>${a}</b> → <b>${b}</b> (${d>=0?"+":""}${d}). Swings of up to ${sw} points are good and bad days, not real change. A steady thinking routine is what moves it.`; }
  return card("rating","Am I actually improving, or just having good and bad days?",chips+line([{v,c:"#3b6fb6",w:2.2}],{label:"rating"}),take,`${sel} rating · ${L.length} games`,"think"); }
function cPhase(G,A){ const set=G.slice(-ANN), done=set.filter(g=>A[g.id]);
  if(done.length<set.length||!done.length) return card("phase","Where do I lose games: opening, middlegame or endgame?",`<p class="c56na">Not analysed yet. ${done.length} of ${set.length} newest games checked by the app's engine.</p><button class="v42b full c56an">🔎 Analyse my ${set.length} newest games</button><div class="c56pg"></div>`,"No numbers until the engine has checked your games.",`${set.length} newest games`,null);
  const P={o:{n:0,b:0,l:"Opening"},m:{n:0,b:0,l:"Middlegame"},e:{n:0,b:0,l:"Endgame"}}; done.forEach(g=>A[g.id].forEach(([ply,ph,loss])=>{ const x=P[ph]; if(x){ x.n++; if(loss>=BIG) x.b++; } }));
  const ks=["o","m","e"], rate=k=>P[k].n?P[k].b/P[k].n:0, mx=Math.max(...ks.map(rate),.01), ok=ks.filter(k=>P[k].n>=15), worst=ok.sort((a,b)=>rate(b)-rate(a))[0];
  const rows=["o","m","e"].map(k=>({label:P[k].l,val:rate(k)/mx,txt:`${(100*rate(k)).toFixed(1)} big mistakes per 100 moves (${P[k].b} of ${P[k].n} moves)`,n:done.filter(g=>A[g.id].some(x=>x[1]===k)).length,flag:P[k].n<15,c:k===worst?"#c62828":"#3b6fb6"}));
  const go=worst==="o"?"openings":worst==="e"?"pawn":"think";
  const take=worst?`Your shakiest phase is the <b>${P[worst].l.toLowerCase()}</b>: ${(100*rate(worst)).toFixed(1)} big mistakes per 100 moves. Practise it first.`:"Not enough moves in any phase yet to say.";
  return card("phase","Where do I lose games: opening, middlegame or endgame?",bars(rows)+`<small class="c56lg">A big mistake loses 3 pawns or more of value, checked by the app's engine.</small>`,take,`${done.length} engine-checked games`,worst?go:null); }
function cOpen(G){ const M={}; G.forEach(g=>{ const nm=String(g.name||"Unknown opening").split(":")[0].replace(/\s*\([A-E]\d\d\)\s*$/,"").trim()||"Unknown opening"; (M[nm]=M[nm]||[]).push(g); });
  const rows=Object.entries(M).sort((a,b)=>b[1].length-a[1].length).slice(0,8).map(([nm,gs])=>({label:nm,n:gs.length,s:score(gs)}));
  const big=rows.filter(r=>r.n>=5), worst=big.slice().sort((a,b)=>a.s-b.s)[0], best=big.slice().sort((a,b)=>b.s-a.s)[0];
  const take=big.length>=2&&worst.s<best.s?`Best: <b>${E_(best.label)}</b> (${pct(best.s)} in ${best.n} games). Worst: <b>${E_(worst.label)}</b> (${pct(worst.s)} in ${worst.n} games). Study or drop the ${E_(worst.label)}.`
    :"Not enough games in two or more openings (5+ each) to compare yet.";
  return card("open","Which openings win for me, and which should I drop?",bars(rows.map(r=>({label:r.label,val:r.s,txt:`score ${pct(r.s)}`,n:r.n,flag:r.n<5,c:worst&&r.label===worst.label?"#c62828":best&&r.label===best.label?"#2e7d32":"#3b6fb6"})))+`<small class="c56lg">Score: win = 1, draw = ½. Fewer than 5 games is flagged as a small sample.</small>`,take,`Top ${rows.length} openings · ${G.length} games`,"openings"); }
function cColour(G){ const agg=gs=>({n:gs.length,w:gs.filter(g=>g.r===1).length,d:gs.filter(g=>g.r===.5).length,l:gs.filter(g=>g.r===0).length,s:score(gs)});
  const W=agg(G.filter(g=>g.c==="w")), B=agg(G.filter(g=>g.c==="b")); let take=`You score ${pct(W.s)} with White (${W.n} games) and ${pct(B.s)} with Black (${B.n} games).`;
  const weak=W.n>=10&&B.n>=10&&Math.abs(W.s-B.s)>=.1?(W.s<B.s?"White":"Black"):null; take+=weak?` You leak with <b>${weak}</b>: practise your ${weak} openings.`:W.n<10||B.n<10?" Need 10+ games with each colour to compare.":" No real gap between the colours.";
  return card("colour","Where do I leak: with White or with Black?",stack([Object.assign({label:"♔ White"},W),Object.assign({label:"♚ Black"},B)])+`<small class="c56lg">Green won · grey drawn · red lost</small>`,take,`${G.length} games`,"myopen"); }
function cEnds(G){ const H={mate:"Checkmate",resign:"Resignation",time:"Time",abandon:"Left the game",other:"Other"}, W={}, L={}; let d=0;
  G.forEach(g=>{ if(g.r===.5){ d++; return; } const k=H[g.how]?g.how:"other", T=g.r===1?W:L; T[k]=(T[k]||0)+1; });
  const nW=Object.values(W).reduce((a,b)=>a+b,0), nL=Object.values(L).reduce((a,b)=>a+b,0), ks=Object.keys(H).filter(k=>W[k]||L[k]);
  const rows=ks.map(k=>`<tr><td>${H[k]}</td><td>${W[k]||0}</td><td>${L[k]||0}</td></tr>`).join("");
  const top=Object.entries(L).sort((a,b)=>b[1]-a[1])[0]; let take="No losses yet in these games.", go=null;
  if(top&&nL>=5){ const sh=top[1]/nL; take=`Most of your losses end by <b>${H[top[0]].toLowerCase()}</b>: ${top[1]} of ${nL} (${pct(sh)}).`;
    if(top[0]==="mate"){ take+=" That points at king safety."; go="lessons"; } else if(top[0]==="time"){ take+=" Practise faster, safer decisions."; go="drills"; } else { take+=" You usually resign once a mistake has cost too much: check for threats before each move."; go="think"; } }
  else if(top) take=`Only ${nL} losses so far: too few to see a pattern.`;
  const svg=`<table class="c56tb"><tr><th>How it ended</th><th>You won</th><th>You lost</th></tr>${rows}<tr><td>Draws</td><td colspan="2">${d}</td></tr></table>`;
  return card("ends","How do my games end?",svg,take,`${nW} wins · ${nL} losses · ${d} draws`,go||"think"); }
const wp=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
function accOf(a){ const v=a.map(([p,ph,loss])=>Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*(wp(0)-wp(-loss)))-3.1669))); return v.length?mean(v):null; }
function cAcc(G,A){ const set=G.slice(-ANN), done=set.filter(g=>A[g.id]);
  if(done.length<set.length||done.length<2) return card("acc","Are my moves getting cleaner, even when results wobble?",`<p class="c56na">Not analysed yet. ${done.length} of ${set.length} newest games checked by the app's engine.</p><button class="v42b full c56an">🔎 Analyse my ${set.length} newest games</button><div class="c56pg"></div>`,"No accuracy numbers until the engine has checked your games.",`${set.length} newest games`,null);
  const v=done.map(g=>accOf(A[g.id])).map(x=>x==null?null:Math.round(x)), av=v.map((_,i)=>{ const w=v.slice(Math.max(0,i-4),i+1).filter(x=>x!=null); return w.length?mean(w):null; });
  const k=Math.min(10,Math.floor(v.length/2)), a=Math.round(mean(v.slice(0,k))), b=Math.round(mean(v.slice(-k))), d=b-a;
  const take=d>=3?`Cleaner: your last ${k} games average <b>${b}%</b>, up from <b>${a}%</b>. That holds even on the games you lost.`:d<=-3?`Less clean lately: <b>${b}%</b> in your last ${k} games vs <b>${a}%</b> before. Puzzles from your own mistakes help.`:`Steady at about <b>${b}%</b> (was ${a}%). To push it up, practise the mistakes you actually make.`;
  return card("acc","Are my moves getting cleaner, even when results wobble?",line([{v,c:"#9e9e9e",w:1.2,o:.6},{v:av,c:"#2e7d32",w:2.6}],{min:0,max:100,label:"accuracy"})+`<small class="c56lg">Grey: each game · Green: average of 5. App estimate from the engine's check (depth 8), not Chess.com or Lichess accuracy.</small>`,take,`${done.length} engine-checked games`,"puzzles"); }
/* ---------- analysis ---------- */
let running=false;
async function analyse(G){ if(running) return; running=true; const A=anAll(), todo=G.slice(-ANN).filter(g=>!A[g.id]); let k=0;
  const pg=()=>document.querySelectorAll(".c56pg").forEach(e=>e.innerHTML=`<div class="c56bar"><i style="width:${Math.round(100*k/Math.max(1,todo.length))}%"></i></div><small>Engine checking game ${Math.min(k+1,todo.length)} of ${todo.length}… you can keep using the app.</small>`);
  try{ pg(); for(const g of todo){ if(!$("c56root")) break; try{ A[g.id]=await CRStyle.analyseGame(g); }catch(e){ console.warn(e); break; } k++; pg(); if(k%5===0) LS.set(KA,A); } }
  finally{ const keep=new Set(G.map(g=>g.id)); Object.keys(A).forEach(id=>{ if(!keep.has(id)) delete A[id]; }); LS.set(KA,A); running=false; if($("c56root")) paint(); } }
/* ---------- page ---------- */
const CSS=`.c56 h3{margin:0 0 2px;font-size:16px}.c56n{font-size:12.5px;color:var(--mute,#777);margin-bottom:6px}.c56 svg{width:100%;height:auto;display:block}.c56t{margin:8px 0}.c56na{color:var(--mute,#777)}
.c56bars{display:flex;flex-direction:column;gap:8px}.c56bl{display:flex;justify-content:space-between;gap:6px;font-size:13.5px;min-width:0}.c56bl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.c56bl small{flex:none;color:var(--mute,#777)}
.c56bt{position:relative;background:#eee;border-radius:6px;height:14px;overflow:hidden}.c56bt i{display:block;height:100%;border-radius:6px}.c56bt em{position:absolute;left:6px;top:2px;font-style:normal;font-size:12px;color:#111;text-shadow:0 0 3px #fff}
.c56st{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#eee}.c56st i{display:block;height:100%}.c56lg{display:block;color:var(--mute,#777);font-size:12px;margin-top:4px}.c56sm{color:#b26a00}
.c56tb{width:100%;border-collapse:collapse;font-size:13.5px}.c56tb td,.c56tb th{border-bottom:1px solid #e5e5e5;padding:5px 4px;text-align:left}.c56tb td+td,.c56tb th+th{text-align:center}
.c56bar{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin:6px 0 2px}.c56bar i{display:block;height:100%;background:#2e7d32}.c56tc{flex-wrap:wrap}.c57hb{display:flex;align-items:flex-end;gap:3px;height:110px}.c57hb div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0}.c57hb i{display:block;width:80%;border-radius:3px 3px 0 0}.c57hb i.g,.c57k.g{background:#c62828}.c57hb i.b,.c57k.b{background:#3b6fb6}.c57hb em{font-style:normal;font-size:11px;font-weight:700}.c57hb small{font-size:8.5px;color:var(--mute,#777);white-space:nowrap;overflow:hidden}
.c57k{display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle}.c57st{display:grid;grid-template-columns:repeat(14,1fr);gap:4px}.c57st i{display:block;aspect-ratio:1;border-radius:4px;background:#e5e5e5}.c57st i.on{background:#2e7d32}
#c56root{max-width:100%;overflow-x:hidden;padding-bottom:90px}`;
function css(){ if($("c56css")) return; const s=document.createElement("style"); s.id="c56css"; s.textContent=CSS; document.head.appendChild(s); }
let DATA=null, SEL=null;
function shell(inner){ css(); return V42._panel(`<div id="c56root"><h2>📈 My charts</h2>${inner}</div>`); }
function paint(){ const c=DATA; if(!c) return; const G=c.games, A=anAll(), w=who();
  const src=[w.cc&&`Chess.com: ${E_(w.cc)}`,w.li&&`Lichess: ${E_(w.li)}`].filter(Boolean).join(" · ");
  const d=shell(`<p class="sub">Your ${G.length} newest public games (${src}). Each chart answers one question and points at one thing to practise.${c.note?`<br><small>${E_(c.note)}</small>`:""}${c.notes&&c.notes.length?`<br><small>${E_(c.notes.join(" "))}</small>`:""}</p>
   ${G.length?[cRating(G,SEL),cPhase(G,A),cOpen(G),cColour(G),cEnds(G),cAcc(G,A),cHung(G),cStreak()].join(""):`<div class="card"><p>No games found for ${src}.</p></div>`}
   <div class="row"><button class="v42b full" id="c56rf">🔄 Refresh games</button></div>`);
  d.querySelectorAll(".c56tc [data-tc]").forEach(b=>b.onclick=()=>{ SEL=b.dataset.tc; paint(); });
  d.querySelectorAll(".c56go").forEach(b=>b.onclick=()=>{ const f=GO[b.dataset.go][1]; V42._close(); try{ f(); }catch(e){ console.warn(e); } });
  d.querySelectorAll(".c56an").forEach(b=>b.onclick=()=>{ b.disabled=true; b.textContent="Checking…"; analyse(G); });
  if(running) analyse(G); /* no-op; repaint progress */
  const rf=$("c56rf"); if(rf) rf.onclick=()=>open(true); }
async function open(force){ const w=who();
  if(!w.cc&&!w.li){ const d=shell(`<div class="card"><p><b>Add your Chess.com or Lichess username</b> to see your charts. They are made from your own public games: rating, results with each colour, openings, where you make mistakes, how games end and accuracy.</p></div><button class="v42b pri full" id="v42add" type="button">Add your Chess.com or Lichess username</button>`);
    $("v42add").onclick=()=>{ window.CRAcct?CRAcct.ask(()=>open(true)):0; }; return; }
  shell(`<div class="card"><p>Reading your public games…</p></div>`);
  try{ DATA=await load(force); paint(); }
  catch(e){ shell(`<div class="card"><p>Couldn't load your games: ${E_(e.message||e)}</p><button class="v42b full" id="c56rt">Try again</button></div>`); $("c56rt").onclick=()=>open(true); } }
window.CRCharts={open,_load:load,_accOf:accOf};
})();
