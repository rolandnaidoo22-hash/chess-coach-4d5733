/* v81: Opponent Brain. Reads games this phone already synced, then once a day
   pulls each rival's public Chess.com monthly archives and keeps a short summary
   (openings, first moves, head-to-head). Coach, Review, bots and Trap Radar stay as they are.
   Storage keys: chessReview.brain.meta / .opponents / .botstats (per player, like the rest). */
(function(){
"use strict"; if(window.CRBrain) return;
const KM="chessReview.brain.meta", KO="chessReview.brain.opponents", KB="chessReview.brain.botstats";
const DAY=24*3600*1000, GAP=1100, PLY=8;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chess=()=>window.ChessLib&&ChessLib.Chess||window.Chess;
const dayKey=t=>{ const d=new Date(t||Date.now()); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const sec=t=>{ t=+t||0; return t>1e12?Math.round(t/1000):Math.round(t); };
const when=t=>{ try{ return new Date(t).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(e){ return ""; } };
const me=()=>(((window.CRUser&&CRUser.info())||{}).cc||"").trim();
const meId=()=>me().toLowerCase();
const pct=x=>Math.round(100*(x||0))+"%";
const lsGet=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
function lsSet(k,v){ const s=JSON.stringify(v); try{ localStorage.setItem(k,s); return true; }catch(e){ return false; } }
let META=null, OPPS=null, BOTS=null, SEEN=null;
function meta(){ if(!META){ META=lsGet(KM,{seen:[],today:null}); if(!META.today) META.today={d:dayKey(),mine:0,opps:[],archive:0}; } return META; }
function saveMeta(){ const m=meta(); m.seen=(SEEN? [...SEEN]:m.seen||[]).slice(-800); lsSet(KM,m); }
function opps(){ if(!OPPS) OPPS=lsGet(KO,{}); return OPPS; }
function saveOpps(){ let o=opps(), keys=Object.keys(o);
  if(keys.length>48){ keys.sort((a,b)=>lastT(o[a])-lastT(o[b])); keys.slice(0,keys.length-40).forEach(k=>delete o[k]); }
  if(!lsSet(KO,o)){ keys=Object.keys(o); if(keys.length){ delete o[keys[0]]; lsSet(KO,o); } } }
function bots(){ if(!BOTS) BOTS=lsGet(KB,{bands:{}}); if(!BOTS.bands) BOTS.bands={}; return BOTS; }
function saveBots(){ lsSet(KB,bots()); }
function seen(){ if(!SEEN){ SEEN=new Set(meta().seen||[]); Object.keys(opps()).forEach(k=>((opps()[k].h2h)||[]).forEach(g=>{ if(g&&g.url) SEEN.add(g.url); })); } return SEEN; }
const lastT=o=>Math.max(0,...((o&&o.h2h)||[]).map(g=>g.t||0));
function feedOn(){ const p=document.getElementById("feed81"); return !!(p&&p.classList.contains("on")); }
function touchToday(){ const m=meta(); if(!m.today||m.today.d!==dayKey()) m.today={d:dayKey(),mine:0,opps:[],archive:0}; return m.today; }
function band(elo){ const e=+elo||0; if(e<400) return "0-399"; if(e<700) return "400-699"; if(e<1000) return "700-999"; if(e<1300) return "1000-1299"; if(e<1600) return "1300-1599"; return "1600+"; }
const BANDS=["0-399","400-699","700-999","1000-1299","1300-1599","1600+"];
function headers(pgn){ const H={}; String(pgn||"").replace(/\[(\w+)\s+"([^"]*)"\]/g,(_,k,v)=>{ H[k]=v; }); return H; }
function sansFrom(pgn){ const C=chess(); if(C&&pgn){ try{ const g=new C(); g.loadPgn(pgn); const h=g.history(); if(h&&h.length) return h; }catch(e){} }
  if(window.CRStudy&&CRStudy.parsePgn){ try{ return CRStudy.parsePgn(pgn).sans||[]; }catch(e){} }
  return []; }
function openingName(sans,H){ try{ if(window.CRECO){ const r=CRECO.lookup(sans); const l=r&&CRECO.label(r); if(l) return l.replace(/\s*\([A-Z]\d+[a-z]?\)\s*$/,"").split(":")[0].trim(); } }catch(e){}
  if(H&&H.Opening) return String(H.Opening).split(":")[0].trim();
  const f=sans&&sans[0]; if(f==="e4") return "King's pawn"; if(f==="d4") return "Queen's pawn"; if(f==="c4") return "English"; if(f==="Nf3") return "Reti"; return f?("Starts "+f):"Unknown"; }
function ensure(name){ const u=String(name||"").trim(); const id=u.toLowerCase(); if(!id||id===meId()) return null;
  const all=opps(); if(!all[id]) all[id]={u:id,name:u,lastPulled:0,months:[],rating:null,openingsW:{},openingsB:{},lines:{},h2h:[],traps:[],puzzles:[],gamesSeen:0};
  else if(u&&u!==id&&(!all[id].name||all[id].name===id)) all[id].name=u;
  return all[id]; }
function addOpen(bag,name,res){ const k=name||"Unknown"; const x=bag[k]||(bag[k]={n:0,sc:0}); x.n++; x.sc+=res; }
function addLine(o,side,sans,res){ const seq=(sans||[]).slice(0,PLY); if(seq.length<4) return; const k=side+"|"+seq.join(" ");
  const x=o.lines[k]||(o.lines[k]={n:0,sc:0,seq:seq,side:side}); x.n++; x.sc+=res;
  const keys=Object.keys(o.lines); if(keys.length>36){ keys.sort((a,b)=>o.lines[b].n-o.lines[a].n); keys.slice(10).forEach(id=>delete o.lines[id]); } }
function prune(o){ const top=(bag,n)=>{ const e=Object.entries(bag||{}).sort((a,b)=>b[1].n-a[1].n).slice(0,n); const out={}; e.forEach(([k,v])=>out[k]=v); return out; };
  o.openingsW=top(o.openingsW,12); o.openingsB=top(o.openingsB,12);
  const ls=Object.entries(o.lines||{}).sort((a,b)=>b[1].n-a[1].n).slice(0,8); o.lines={}; ls.forEach(([k,v])=>o.lines[k]=v);
  o.h2h=(o.h2h||[]).sort((a,b)=>b.t-a.t).slice(0,16);
  o.puzzles=(o.puzzles||[]).slice(-8); o.traps=(o.traps||[]).slice(0,8); }
function addBot(rating,sans,side){ const elo=+rating; if(!elo||!sans||!sans.length) return; const B=bots(); const b=band(elo); const bag=B.bands[b]||(B.bands[b]={n:0}); bag.n++;
  for(let i=0;i<sans.length&&i<PLY;i++){ if(((i%2)===0)!==(side==="w")) continue; const prev=i?sans[i-1]:"*"; const k=i+"|"+prev; const cell=bag[k]||(bag[k]={}); cell[sans[i]]=(cell[sans[i]]||0)+1;
    const keys=Object.keys(cell); if(keys.length>8){ keys.sort((a,c)=>cell[c]-cell[a]); keys.slice(6).forEach(x=>delete cell[x]); } } }
function scanTactics(o,sans,row){ const C=chess(); if(!C||!window.CRGuard||!sans) return; const g=new C(); let n=0; const seenCap=new Set();
  for(let i=0;i<sans.length&&i<40;i++){ let m; try{ m=g.move(sans[i]); }catch(e){ break; } if(!m) break;
    if(m.piece==="n"){ const fk=CRGuard._fork(g,m.to,m.color==="w"?"b":"w");
      if(fk&&n<3){ const who=m.color===row.me?"me":"them"; o.puzzles.push({id:row.url+"|f"+i,opp:o.u,kind:"fork",who:who,san:m.san,fen:g.fen(),t:row.t,ply:i,hit:(fk.hit||[]).slice(0,2).map(x=>x.type)}); n++; } }
    const cap=CRGuard._bestCap(g); const capKey=cap?cap.x.to+"|"+cap.x.san:"";
    if(cap&&cap.gain>=3&&capKey&&!seenCap.has(capKey)&&sans[i+1]!==cap.x.san&&n<3){ seenCap.add(capKey); const missed=g.turn()===row.me?"me":"them";
      o.puzzles.push({id:row.url+"|h"+i,opp:o.u,kind:"hang",who:missed,san:m.san,fen:g.fen(),reply:cap.x.san,from:cap.x.from,to:cap.x.to,t:row.t,ply:i,piece:cap.x.captured}); n++; } } }
function addTraps(o,sans,meCol){ if(!window.TrapRadar||!TrapRadar._analyse||!sans||sans.length<4) return;
  let pack; try{ pack=TrapRadar._analyse({s:sans.slice(0,40),me:meCol}); }catch(e){ return; }
  (pack&&pack.res||[]).forEach(R=>{ if(!R.fell) return; const id=R.T.id+"|"+(R.role||"")+"|"+(R.pun?"1":"0"); let t=o.traps.find(x=>x.id===id);
    if(!t){ t={id:id,name:R.T.n,role:R.role,pun:!!R.pun,n:0}; o.traps.push(t); } t.n++; }); }
function mergeH2H(o,row,sans){ if(!row||!row.url) return false; if((o.h2h||[]).some(g=>g.url===row.url)) return false;
  o.h2h.push({url:row.url,t:sec(row.t),me:row.me,res:row.res,tc:row.tc||"",opn:row.opn||"Unknown",mr:row.mr||0,or:row.or||0,sans:(sans||[]).slice(0,PLY),added:Date.now()});
  if(row.or){ o.rating=row.or; o.ratingAt=sec(row.t)*1000; }
  try{ scanTactics(o,sans,row); }catch(e){} try{ addTraps(o,sans,row.me); }catch(e){}
  const td=touchToday(); td.mine++; if(o.name&&td.opps.indexOf(o.u)<0) td.opps.push(o.u); return true; }
function sideRes(result){ if(result==="win") return 1; if(/agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(result||"")) return 0.5; return 0; }
function myResWord(meSide,g){ const mine=meSide==="w"?g.white:g.black; if(!mine) return "L"; if(mine.result==="win") return "W"; if(/agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(mine.result||"")) return "D"; return "L"; }
function foldArchive(o,g){ if(!g||!g.pgn||(g.rules&&g.rules!=="chess")) return false; const wu=(g.white&&g.white.username||"").toLowerCase(), bu=(g.black&&g.black.username||"").toLowerCase();
  const side=wu===o.u?"w":bu===o.u?"b":null; if(!side) return false;
  const url=g.url||""; if(url&&(seen().has(url)||(o.h2h||[]).some(h=>h.url===url))) return false;
  const mine=side==="w"?g.white:g.black, other=side==="w"?g.black:g.white; const sans=sansFrom(g.pgn); if(sans.length<2) return false;
  const H=headers(g.pgn), opn=openingName(sans,H), res=sideRes(mine&&mine.result); const bag=side==="w"?o.openingsW:o.openingsB;
  addOpen(bag,opn,res); addLine(o,side,sans,res); if(mine&&mine.rating&&(g.time_class==="rapid"||!o.rating)){ o.rating=mine.rating; o.ratingAt=(g.end_time||0)*1000; }
  addBot(mine&&mine.rating,sans,side); o.gamesSeen=(o.gamesSeen||0)+1;
  if(other&&other.username&&other.username.toLowerCase()===meId()){ const row={url:g.url||String(g.end_time),t:g.end_time||0,me:side==="w"?"b":"w",res:myResWord(side==="w"?"b":"w",g),tc:g.time_class||"",opn:opn,mr:other.rating||0,or:mine.rating||0};
    if(!seen().has(row.url)){ seen().add(row.url); mergeH2H(o,row,sans); } }
  return true; }
function ingestRow(row){ try{
  if(!row||!row.op) return; const url=String(row.url||""); if(url&&seen().has(url)) return; if(url) seen().add(url);
  let sans=row.sans||null, opn=row.opn||""; if(!sans&&row.pgn){ sans=sansFrom(row.pgn); if(!opn) opn=openingName(sans,headers(row.pgn)); }
  if(!sans||sans.length<2){ if(url) seen().add(url); return; }
  const o=ensure(row.op); if(!o){ if(url) seen().add(url); return; }
  const meCol=row.me==="b"?"b":"w"; const word=row.res==="W"||row.res==="Won"?"W":row.res==="D"||row.res==="Draw"?"D":"L";
  const their=meCol==="w"?"b":"w", oppRes=word==="L"?1:word==="D"?0.5:0, opnName=opn||openingName(sans,{});
  addOpen(their==="w"?o.openingsW:o.openingsB,opnName,oppRes);
  addLine(o,their,sans,oppRes);
  addBot(row.or,sans,their);
  mergeH2H(o,{url:url||("local-"+o.u+"-"+sec(row.t)),t:row.t,me:meCol,res:word,tc:row.tc,opn:opn||openingName(sans,{}),mr:row.mr,or:row.or},sans);
  prune(o);
}catch(e){} }
function collect(){ const rows=[];
  try{ const list=window.CRSync&&CRSync.list?CRSync.list():[]; list.forEach(x=>{ if(x&&x.op) rows.push({url:x.url,t:x.t,me:x.me,op:x.op,or:x.or,res:x.res,tc:x.tc,pgn:x.pgn}); }); }catch(e){}
  try{ const c=JSON.parse(localStorage.getItem("chessReview.v56.charts.games")||"null"); (c&&c.games||[]).forEach(g=>{ if(!g||!g.op||!g.m) return;
    rows.push({url:g.id,t:sec(g.t),me:g.c,op:g.op,or:g.oe,mr:g.e,res:g.r===1?"W":g.r===0.5?"D":"L",tc:g.tc,sans:g.m,opn:g.name}); }); }catch(e){}
  return rows; }
let ingesting=false, ingestAgain=false;
function ingestAsync(){ if(ingesting){ ingestAgain=true; return; } ingesting=true; const rows=collect(); let i=0;
  const step=()=>{ const end=Math.min(rows.length,i+10); for(;i<end;i++) ingestRow(rows[i]); if(i<rows.length){ setTimeout(step,0); return; }
    saveOpps(); saveMeta(); saveBots(); ingesting=false; if(ingestAgain){ ingestAgain=false; ingestAsync(); return; }
    if(feedOn()&&view==="home") render(); try{ if(document.body.classList.contains("hs-home")&&window.CRHome) CRHome.paint(); }catch(e){} injectCoach(); };
  step(); }
function recOf(o){ let w=0,d=0,l=0; (o.h2h||[]).forEach(g=>{ if(g.res==="W") w++; else if(g.res==="D") d++; else l++; }); return {w:w,d:d,l:l,n:w+d+l,pts:w+d*0.5}; }
function listOpps(){ return Object.keys(opps()).map(k=>opps()[k]); }
function openingMap(){ const M={}; listOpps().forEach(o=>(o.h2h||[]).forEach(g=>{ const k=(g.me==="w"?"White":"Black")+" · "+(g.opn||"Unknown");
  const x=M[k]||(M[k]={k:k,n:0,pts:0,me:g.me,opn:g.opn||"Unknown"}); x.n++; x.pts+=g.res==="W"?1:g.res==="D"?0.5:0; }));
  const rows=Object.values(M).sort((a,b)=>b.n-a.n); const fix=rows.filter(r=>r.n>=2).sort((a,b)=>(a.pts/a.n)-(b.pts/b.n))[0]||rows[0]||null;
  const crowd={}; listOpps().forEach(o=>["openingsW","openingsB"].forEach(s=>Object.entries(o[s]||{}).forEach(([name,v])=>{ const x=crowd[name]||(crowd[name]={name:name,n:0,sc:0}); x.n+=v.n; x.sc+=v.sc; })));
  return {rows:rows,fix:fix,crowd:Object.values(crowd).sort((a,b)=>b.n-a.n).slice(0,6)}; }
function rivals(){ const rows=listOpps().map(o=>({o:o,r:recOf(o)})).filter(x=>x.r.n).sort((a,b)=>b.r.n-a.r.n||a.r.pts-b.r.pts);
  const tough=rows.filter(x=>x.r.n>=2).slice().sort((a,b)=>(a.r.pts/a.r.n)-(b.r.pts/b.r.n)||b.r.l-a.r.l)[0]||null; return {rows:rows,tough:tough}; }
function allTraps(){ const M={}; listOpps().forEach(o=>(o.traps||[]).forEach(t=>{ const x=M[t.id]||(M[t.id]={id:t.id,name:t.name,role:t.role,pun:t.pun,n:0,opp:o.name||o.u}); x.n+=t.n; }));
  return Object.values(M).sort((a,b)=>b.n-a.n); }
function allPuzzles(){ const out=[]; listOpps().forEach(o=>(o.puzzles||[]).forEach(p=>out.push(p))); return out.sort((a,b)=>(b.t||0)-(a.t||0)).slice(0,24); }
function weekly(){ const since=Math.floor(Date.now()/1000)-7*86400; const games=[];
  listOpps().forEach(o=>(o.h2h||[]).forEach(g=>{ if((g.t||0)>=since) games.push(Object.assign({opp:o.name||o.u,ou:o.u},g)); }));
  games.sort((a,b)=>b.t-a.t); const who={}; const opn={}; let pts=0;
  games.forEach(g=>{ who[g.opp]=(who[g.opp]||0)+1; const k=g.opn||"Unknown"; const x=opn[k]||(opn[k]={name:k,n:0,pts:0}); x.n++; x.pts+=g.res==="W"?1:g.res==="D"?0.5:0; pts+=g.res==="W"?1:g.res==="D"?0.5:0; });
  const opens=Object.values(opn).sort((a,b)=>b.n-a.n); const worked=opens.filter(x=>x.n&&x.pts/x.n>=0.5).sort((a,b)=>b.pts-a.pts)[0];
  const leak=opens.filter(x=>x.n>=1).sort((a,b)=>(a.pts/a.n)-(b.pts/b.n))[0];
  let train="Play one more game this week so the report has something to teach.";
  if(leak&&leak.pts/leak.n<0.5) train="Train "+leak.name+" first. That is where this week went wrong.";
  else if(worked) train="Keep "+worked.name+". It is working. Add one drill on the line you face most.";
  return {games:games,n:games.length,pts:pts,who:who,opens:opens,worked:worked,leak:leak,train:train}; }
function topLine(o){ const ls=Object.values(o.lines||{}).sort((a,b)=>b.n-a.n); return ls[0]||null; }
function ghosts(){ return listOpps().map(o=>{ const r=recOf(o); return {o:o,r:r,line:topLine(o)}; }).filter(x=>x.r.l>0||x.line).sort((a,b)=>b.r.l-a.r.l||b.r.n-a.r.n).slice(0,8); }
function league(){ return listOpps().map(o=>({o:o,r:recOf(o)})).filter(x=>x.r.n>=3).sort((a,b)=>b.r.n-a.r.n||b.r.pts-a.r.pts); }
function coachTip(){ if(!me()) return "Add your Chess.com name in Settings. After your games sync, this brain learns who you face.";
  const os=listOpps(); if(!os.length) return "Sync your games. The brain starts with the people you just played, then reads their public games once a day.";
  const traps=allTraps().filter(t=>t.role==="watch"&&t.pun); if(traps[0]) return "Watch for "+traps[0].name+". It showed up against "+traps[0].opp+". Drill the way out before the next game.";
  const map=openingMap(); if(map.fix&&map.fix.n>=2&&map.fix.pts/map.fix.n<=0.45) return "Fix "+map.fix.opn+" as "+(map.fix.me==="w"?"White":"Black")+" first. You scored "+pct(map.fix.pts/map.fix.n)+" in "+map.fix.n+" games.";
  const rv=rivals(); if(rv.tough&&rv.tough.r.pts/rv.tough.r.n<0.5) return (rv.tough.o.name||rv.tough.o.u)+" has the edge ("+rv.tough.r.l+" loss"+(rv.tough.r.l===1?"":"es")+"). Practise their first moves before you play again.";
  const w=weekly(); if(w.n) return "This week: "+w.n+" game"+(w.n>1?"s":"")+", "+w.pts+" point"+(w.pts===1?"":"s")+". "+w.train;
  return "Keep playing. Every game adds a little to your opponent brain."; }
function bookMove(elo,hist,legal){ if(!legal||!legal.length) return null; const ply=(hist||[]).length; if(ply>=PLY) return null; const bag=(bots().bands||{})[band(elo)]; if(!bag) return null;
  const prev=ply?hist[ply-1]:"*"; const cell=bag[ply+"|"+prev]; if(!cell) return null; let san=null,best=2;
  Object.keys(cell).forEach(s=>{ if(cell[s]>best){ best=cell[s]; san=s; } }); if(!san) return null; return legal.find(m=>m.san===san)||null; }
function botView(){ return BANDS.map(id=>{ const bag=(bots().bands||{})[id]; let top=null;
  if(bag){ const cell=bag["0|*"]||{}; let n=0; Object.keys(cell).forEach(s=>{ if(cell[s]>n){ n=cell[s]; top=s; } }); if(n<1) top=null; }
  return {id:id,n:bag?bag.n||0:0,top:top,who:id==="0-399"?"Pip":id==="400-699"?"Maisie":""}; }); }
function blurb(){ if(JOB.on) return JOB.text||"Updating…"; const n=listOpps().length; if(!n) return "Grows from your games"; return n+" rival"+(n===1?"":"s")+" in the brain"; }
function snapshot(){ const t=touchToday(); return {opps:listOpps().length,games:listOpps().reduce((s,o)=>s+(o.h2h||[]).length,0),today:t,running:!!JOB.on,tip:coachTip()}; }

/* ---------- daily archive pull (Chess.com public API only) ---------- */
let JOB={on:false,cancel:false,manual:false,text:"",pct:0,err:""}, nextAt=0;
const busyApp=()=>!!(window.ReviewApp&&ReviewApp.isRunning&&ReviewApp.isRunning()&&!(window.Coach17&&Coach17._imp&&Coach17._imp.running));
function monthOf(url){ const m=/(\d{4})\/(\d{2})\/?$/.exec(String(url||"")); return m?m[1]+"/"+m[2]:""; }
async function getJson(url){ const wait=Math.max(0,nextAt-Date.now()); if(wait) await sleep(wait); if(JOB.cancel) throw new Error("cancel");
  nextAt=Date.now()+GAP; let r; try{ r=await fetch(url,{cache:"no-store"}); }catch(e){ throw new Error("network"); }
  if(r.status===429){ nextAt=Date.now()+8000; await sleep(8000); if(JOB.cancel) throw new Error("cancel"); r=await fetch(url,{cache:"no-store"}); nextAt=Date.now()+GAP; }
  if(r.status===404) return null; if(!r.ok) throw new Error("http "+r.status); return r.json(); }
function needPull(){ const now=Date.now(); return listOpps().filter(o=>{ if(o.missing&&o.lastPulled&&now-o.lastPulled<7*DAY) return false; if(!o.lastPulled) return true; return now-o.lastPulled>=20*3600*1000; }); }
function paintProg(){ const el=document.getElementById("br81prog"); if(!el){ if(feedOn()&&view==="home") render(); return; }
  const n=document.createElement("div"); n.innerHTML=progHtml(); const node=n.firstElementChild; if(node) el.replaceWith(node); bindProg(); }
function finishJob(msg){ JOB.on=false; JOB.cancel=false; JOB.text=msg||""; JOB.pct=msg?100:JOB.pct; const m=meta(); if(msg){ m.lastPullNote=msg; m.lastPullAt=Date.now(); saveMeta(); } paintProg(); saveOpps(); saveBots();
  try{ if(document.body.classList.contains("hs-home")&&window.CRHome) CRHome.paint(); }catch(e){} if(feedOn()&&view==="home") render(); }
function pauseJob(msg){ JOB.on=false; JOB.text=msg; const m=meta(); m.lastPullNote=msg; m.lastPullAt=Date.now();
  if(!JOB.manual){ if(m.chunksD!==dayKey()){ m.chunksD=dayKey(); m.chunks=0; } m.chunks=(m.chunks||0)+1; saveMeta(); if(m.chunks<3) setTimeout(()=>{ if(!JOB.on&&!document.hidden&&navigator.onLine!==false) run(false); },3*60*1000); }
  else saveMeta(); paintProg(); saveOpps(); }
async function pullOne(o,idx,total,t0,limit){ JOB.text="Rival "+(idx+1)+" of "+total+": "+(o.name||o.u); JOB.pct=Math.max(3,Math.round(100*idx/Math.max(1,total))); paintProg();
  const arch=await getJson("https://api.chess.com/pub/player/"+encodeURIComponent(o.u)+"/games/archives"); if(JOB.cancel) throw new Error("cancel");
  if(!arch){ o.missing=true; o.lastPulled=Date.now(); saveOpps(); return; }
  const urls=arch.archives||[]; let keys=urls.map(monthOf).filter(Boolean);
  if(o.lastPulled){ const d=new Date(o.lastPulled-3*DAY); const cut=d.getUTCFullYear()*12+d.getUTCMonth(); keys=keys.filter(k=>{ const p=k.split("/").map(Number); return p[0]*12+(p[1]-1)>=cut; }); }
  const done=new Set(o.months||[]); const todo=keys.filter(k=>!done.has(k)); const by={}; urls.forEach(u=>{ const k=monthOf(u); if(k) by[k]=u; });
  for(let j=0;j<todo.length;j++){ if(JOB.cancel) throw new Error("cancel"); if(Date.now()-t0>limit){ saveOpps(); pauseJob("Paused to be polite. Tap Update brain to continue."); return "pause"; }
    if(busyApp()){ saveOpps(); pauseJob("Paused while a review is running."); return "pause"; }
    const k=todo[j]; JOB.text=(o.name||o.u)+" · "+k+" · month "+(j+1)+" of "+todo.length; JOB.pct=Math.round(100*(idx+(j/Math.max(1,todo.length)))/Math.max(1,total)); paintProg();
    let jsn=null; try{ jsn=await getJson(by[k]); }catch(e){ if(String(e&&e.message)==="cancel") throw e; continue; }
    let added=0; ((jsn&&jsn.games)||[]).forEach(g=>{ try{ if(foldArchive(o,g)) added++; }catch(err){} }); prune(o);
    o.months=o.months||[]; if(o.months.indexOf(k)<0) o.months.push(k); const td=touchToday(); td.archive=(td.archive||0)+added; saveMeta(); saveOpps(); saveBots(); }
  o.lastPulled=Date.now(); o.missing=false; saveOpps(); }
async function run(manual){ if(JOB.on) return; JOB.manual=!!manual; JOB.err="";
  if(navigator.onLine===false){ JOB.err="offline"; JOB.text="You're offline. The brain will try when you're back."; paintProg(); return; }
  if(!me()){ JOB.err="nouser"; JOB.text="Add your Chess.com name in Settings first."; paintProg(); return; }
  if(!manual){ const m=meta(); if(m.failAt&&Date.now()-m.failAt<30*60*1000) return; if(m.lastDaily&&Date.now()-m.lastDaily<DAY&&!(m.chunks&&m.chunksD===dayKey()&&m.chunks<3&&m.lastPullNote&&/Paused/.test(m.lastPullNote))) return; }
  JOB.on=true; JOB.cancel=false; JOB.text="Looking up rivals…"; JOB.pct=4; paintProg(); const t0=Date.now(); const limit=manual?12*60*1000:4*60*1000;
  try{ const list=needPull(); if(!list.length){ const m=meta(); m.lastDaily=Date.now(); saveMeta(); finishJob(listOpps().length?"Everyone is up to date.":"No rivals yet. Sync a few of your games first."); return; }
    for(let i=0;i<list.length;i++){ if(JOB.cancel) throw new Error("cancel"); if(Date.now()-t0>limit){ pauseJob("Paused to be polite. Tap Update brain to continue."); return; }
      const r=await pullOne(list[i],i,list.length,t0,limit); if(r==="pause") return; }
    const m=meta(); m.lastDaily=Date.now(); m.chunks=0; saveMeta(); finishJob("Caught up. Summaries are saved on this phone."); }
  catch(e){ const msg=String(e&&e.message||e); if(msg==="cancel"){ finishJob("Stopped. What was read is saved."); return; }
    JOB.on=false; JOB.err=msg; JOB.text=msg==="network"?"Couldn't reach the public game list. Try again in a minute.":"The public game list said no ("+msg+")."; const m=meta(); m.failAt=Date.now(); m.lastPullNote=JOB.text; m.lastPullAt=Date.now(); saveMeta(); paintProg(); } }
function cancel(){ JOB.cancel=true; JOB.text="Stopping…"; paintProg(); }
function armDaily(){ const tick=()=>{ if(document.hidden||JOB.on||navigator.onLine===false||!me()) return; if(busyApp()) return; const m=meta();
    if(m.lastDaily&&Date.now()-m.lastDaily<DAY) return; run(false); };
  const go=()=>{ if(window.requestIdleCallback) requestIdleCallback(()=>setTimeout(tick,400),{timeout:20000}); else setTimeout(tick,8000); };
  setTimeout(go,20000); setInterval(tick,30*60*1000); document.addEventListener("visibilitychange",()=>{ if(!document.hidden) setTimeout(tick,4000); }); }

/* ---------- screens ---------- */
const CSS=`#feed81 .brg{display:grid;grid-template-columns:1fr 1fr;gap:8px}#feed81 .brg button{min-height:84px;border-radius:14px;border:1px solid var(--line);background:#fff;color:inherit;font:inherit;text-align:left;padding:10px;cursor:pointer;display:flex;flex-direction:column;gap:2px}
#feed81 .brg button b{font-size:15px}#feed81 .brg button small{color:var(--mute);font-size:12.5px;line-height:1.3}#feed81 .brg .wide{grid-column:1/-1;min-height:64px}
#feed81 .br81bar{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin:6px 0}#feed81 .br81bar i{display:block;height:100%;background:#2f7d32}
#feed81 .wdl{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:4px 0}#feed81 .wdl i{display:block;height:100%}
html.dark-mode #feed81 .brg button{background:#262626;border-color:#3a3a3a}html.dark-mode #feed81 .br81bar{background:#333}`;
let styled=false, view="home";
function css(){ if(styled) return; styled=true; const s=document.createElement("style"); s.id="br81css"; s.textContent=CSS; document.head.appendChild(s); }
function shell(backLabel,back){ css(); const p=window.CR52.show("feed81");
  p.innerHTML=`<button type="button" class="btn bk70" id="br81back">‹ ${E(backLabel)}</button><div id="br81body"></div>`;
  p.querySelector("#br81back").onclick=back; return p.querySelector("#br81body"); }
function progHtml(){ if(JOB.on) return `<div id="br81prog" class="card" aria-live="polite"><b>Updating brain…</b><div class="br81bar"><i style="width:${Math.max(4,JOB.pct||4)}%"></i></div><p class="mute" style="margin:0">${E(JOB.text||"Reading public games…")}</p><button type="button" class="bt" id="br81stop">Stop</button></div>`;
  const m=meta(); const note=JOB.text||m.lastPullNote||"Not updated yet. Tap Update brain, or leave the app open and it runs once a day.";
  return `<div id="br81prog" class="card"><button type="button" class="bt go" id="br81go">Update brain</button><p class="mute" style="margin:6px 0 0">${E(note)}${m.lastPullAt&&!JOB.text?" · "+E(when(m.lastPullAt)):""}</p></div>`; }
function bindProg(){ const g=document.getElementById("br81go"), s=document.getElementById("br81stop"); if(g) g.onclick=()=>run(true); if(s) s.onclick=()=>cancel(); }
function learnedToday(){ const d=dayKey(); const names=new Set(); let mine=0; listOpps().forEach(o=>(o.h2h||[]).forEach(g=>{ if(g.added&&dayKey(g.added)===d){ mine++; names.add(o.u); } })); return {mine, opps:[...names], archive:(touchToday().archive)||0}; }
function todayHtml(){ const t=learnedToday(); const n=listOpps().length; const games=listOpps().reduce((s,o)=>s+(o.h2h||[]).length,0);
  if(!me()) return `<div class="card"><b>Today</b><p style="margin:4px 0 0">Add your Chess.com name in Settings, then sync your games. The brain stays empty until then, and everything else still works.</p></div>`;
  if(!n) return `<div class="card"><b>Today added</b><p style="margin:4px 0 0">Nothing yet. Open Review and tap Get my latest games. Rivals show up here after that.</p></div>`;
  const bits=[]; if(t.mine) bits.push(t.mine+" of your game"+(t.mine===1?"":"s")); if(t.opps.length) bits.push(t.opps.length+" rival"+(t.opps.length===1?"":"s")); if(t.archive) bits.push(t.archive+" public game"+(t.archive===1?"":"s")+" summarised");
  const line=bits.length?("Today added "+bits.join(" · ")+"."):("No new games today. The brain already knows "+n+" rival"+(n===1?"":"s")+" from "+games+" game"+(games===1?"":"s")+".");
  return `<div class="card"><b>Today added</b><p style="margin:4px 0 0">${E(line)}</p></div>`; }
function mini(id,icon,title,sub){ return `<button type="button" data-go="${id}"><b>${icon} ${E(title)}</b><small>${E(sub)}</small></button>`; }
function renderHome(){ const body=shell("Home",()=>{ try{ CRHome.goHome(); }catch(e){ location.hash=""; } }); view="home";
  const map=openingMap(), rv=rivals(), tr=allTraps(), pz=allPuzzles(), w=weekly(), gh=ghosts(), lg=league(), bv=botView().filter(b=>b.n);
  const mapSub=map.fix?(map.fix.opn+" · "+pct(map.fix.n?map.fix.pts/map.fix.n:0)+(map.fix.n>=2?" · fix this":"")):"Sync games to see your score";
  const rvSub=rv.rows.length?(rv.rows.length+" people"+(rv.tough?" · toughest "+(rv.tough.o.name||rv.tough.o.u):"")):"People you play most";
  const trSub=tr[0]?tr[0].name:"Traps from your games";
  const pzSub=pz.length?pz.length+" moment"+(pz.length===1?"":"s")+" to try":"Hanging pieces and forks";
  const wSub=w.n?w.n+" game"+(w.n===1?"":"s")+" this week":"Your last 7 days";
  const gSub=gh.length?"Practise an opening that beat you":"Shows up after a loss";
  const lSub=lg.length?lg.length+" regular"+(lg.length===1?"":"s"):"People faced 3+ times";
  const bSub=bv.length?bv.map(b=>b.id+" "+(b.top||"")).slice(0,2).join(" · "):"Move habits by rating";
  body.innerHTML=`<h2>🧠 Opponent Brain</h2><p class="mute">A memory of the people you play. Short, on this phone, and it grows after your games sync.</p>
    ${todayHtml()}${progHtml()}
    <div class="card"><b>Coach tip</b><p style="margin:4px 0 0">${E(coachTip())}</p><button type="button" class="bt" data-go="coach">Read the tip</button></div>
    <div class="brg">
      ${mini("map","🗺","Opening battle map",mapSub)}
      ${mini("rivals","♟","Rival board",rvSub)}
      ${mini("traps","🪤","Watch for",trSub)}
      ${mini("puzzles","🧩","From your games",pzSub)}
      ${mini("weekly","📅","Weekly report",wSub)}
      ${mini("ghost","👻","Ghost prep",gSub)}
      ${mini("league","🏆","League of regulars",lSub)}
      ${mini("bots","🤖","Better bots",bSub)}
      <button type="button" class="wide" data-go="study"><b>🔍 Full report on one player</b><small>Opens Study your opponent. Opponent Brain keeps the short memory.</small></button>
    </div>`;
  bindProg(); body.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>openGo(b.dataset.go)); }
function openGo(id){ if(id==="study"){ try{ window.CRStudy&&CRStudy.open(); }catch(e){} return; } view=id; render(); }
function backHome(){ view="home"; render(); }
function bar(r){ const n=r.n||1; return `<div class="wdl"><i style="width:${100*r.w/n}%;background:#2e7d32"></i><i style="width:${100*r.d/n}%;background:#9e9e9e"></i><i style="width:${100*r.l/n}%;background:#c62828"></i></div>`; }
function renderMap(){ const body=shell("Brain",backHome); const map=openingMap();
  let h=`<h2>🗺 Opening battle map</h2><p class="mute">Openings people played against you, your score, and what to fix first.</p>`;
  if(!map.rows.length) h+=`<div class="card">No games in the brain yet. Sync your games, then come back. Your other training still works.</div>`;
  else { if(map.fix) h+=`<div class="card"><b>${map.fix.n>=2?"Fix first":"Most played"}</b><p style="margin:4px 0 0">${E(map.fix.opn)} as ${map.fix.me==="w"?"White":"Black"} · ${map.fix.pts} / ${map.fix.n} (${pct(map.fix.n?map.fix.pts/map.fix.n:0)}). ${map.fix.n>=2?"Learn that line before you play it again.":"One game so far. A second one makes the weak spot clearer."}</p></div>`;
    h+=map.rows.slice(0,10).map(r=>`<div class="card"><b>${E(r.k)}</b><div>${r.pts} / ${r.n} · ${pct(r.n?r.pts/r.n:0)}</div><div class="br81bar"><i style="width:${r.n?Math.round(100*r.pts/r.n):0}%"></i></div></div>`).join("");
    const pulled=listOpps().reduce((s,o)=>s+(o.gamesSeen||0),0);
    if(pulled&&map.crowd.length) h+=`<h3>What they play in their public games</h3><p class="mute">${pulled} games summarised on this phone, including games that were not against you.</p>`+map.crowd.map(c=>`<div class="card">${E(c.name)} · ${c.n} game${c.n===1?"":"s"} · they score ${pct(c.n?c.sc/c.n:0)}</div>`).join("");
    else h+=`<p class="mute">Tap Update brain and it will read the openings they play against other people. Your score above is already from your own games.</p>`; }
  body.innerHTML=h; }
function renderRivals(){ const body=shell("Brain",backHome); const rv=rivals();
  let h=`<h2>♟ Rival board</h2><p class="mute">People you play most, the head-to-head, and who beats you most.</p>`;
  if(!rv.rows.length) h+=`<div class="card">No rivals yet. After your games sync, each opponent lands here.</div>`;
  else { if(rv.tough) h+=`<div class="card"><b>Beats you most</b><p style="margin:4px 0 0">${E(rv.tough.o.name||rv.tough.o.u)} · you ${rv.tough.r.w}–${rv.tough.r.d}–${rv.tough.r.l}. Practise their opening in Ghost prep.</p></div>`;
    h+=rv.rows.slice(0,12).map(x=>{ const o=x.o,r=x.r; return `<button type="button" class="lt" data-u="${E(o.u)}"><span class="i">♟</span><span><b>${E(o.name||o.u)}</b><small>${o.rating?E(o.rating)+" · ":""}${r.w} wins · ${r.d} draws · ${r.l} losses · ${r.n} games</small></span></button>`; }).join(""); }
  body.innerHTML=h; body.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>renderRival(b.dataset.u)); }
function renderRival(u){ const o=opps()[u]; const body=shell("Rivals",()=>{ view="rivals"; render(); }); if(!o){ body.innerHTML=`<div class="card">That rival is not on this phone.</div>`; return; }
  const r=recOf(o), line=topLine(o); view="rival";
  body.innerHTML=`<h2>${E(o.name||o.u)}</h2><p class="mute">${o.rating?"Rating snapshot "+E(o.rating)+". ":""}${o.gamesSeen?o.gamesSeen+" public games summarised. ":""}${o.lastPulled?"Updated "+E(when(o.lastPulled))+".":"Public games not read yet."}</p>
    <div class="card"><b>Head to head</b><p style="margin:4px 0">${r.w} wins · ${r.d} draws · ${r.l} losses</p>${bar(r)}
    ${(o.h2h||[]).slice(0,6).map(g=>`<div>${E(g.res)} as ${g.me==="w"?"White":"Black"} · ${E(g.opn)} · ${g.t?E(new Date(g.t*1000).toLocaleDateString()):""}</div>`).join("")}</div>
    ${line?`<div class="card"><b>Their first moves</b><p style="margin:4px 0 0">${E(line.seq.join(" "))} · ${line.n} time${line.n===1?"":"s"}</p></div>`:""}
    <div class="row"><button type="button" class="bt go" id="br81gh">👻 Practise this opening</button><button type="button" class="bt" id="br81st">🔍 Full report</button></div>`;
  const gh=body.querySelector("#br81gh"); if(gh) gh.onclick=()=>playGhost(o);
  const st=body.querySelector("#br81st"); if(st) st.onclick=()=>{ try{ window.CRStudy&&CRStudy.study(o.name||o.u,"c"); }catch(e){} }; }
function trapBlurb(t){ const id=(t.id||"").split("|")[0]; const T=(window.TrapRadar&&TrapRadar._db||[]).find(x=>x.id===id); if(!T) return "";
  return t.role==="watch"?T.avoid:T.setit; }
function renderTraps(){ const body=shell("Brain",backHome); const tr=allTraps();
  let h=`<h2>🪤 Watch for</h2><p class="mute">Same traps from your games. Drill them in Trap Radar.</p>`;
  if(!tr.length) h+=`<div class="card">No trap from your games yet. Play a few, or open Trap Radar for the built-in list.</div>`;
  else h+=tr.slice(0,8).map(t=>`<div class="card"><b>${E(t.name)}</b><p style="margin:4px 0">${t.role==="watch"?(t.pun?"You fell in":"You stepped in, and they missed it"):(t.pun?"You caught them":"You could have set this")} · ${t.n} time${t.n===1?"":"s"} · ${E(t.opp)}</p><p class="mute" style="margin:0">${E(trapBlurb(t))}</p></div>`).join("");
  h+=`<div class="row"><button type="button" class="bt go" id="br81tr">Open Trap Radar</button></div>`;
  body.innerHTML=h; const b=body.querySelector("#br81tr"); if(b) b.onclick=()=>{ try{ window.TrapRadar&&TrapRadar.open(); }catch(e){} }; }
const NM={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
function renderPuzzles(){ const body=shell("Brain",backHome); const pz=allPuzzles();
  let h=`<h2>🧩 From your games</h2><p class="mute">Moments you or they missed a hanging piece or a fork.</p>`;
  if(!pz.length) h+=`<div class="card">None yet. They appear when a game in the brain has a hanging piece or a knight fork.</div>`;
  else h+=pz.slice(0,12).map((p,i)=>{ const who=p.who==="me"?"You":"They"; const what=p.kind==="fork"?`fork (${(p.hit||[]).map(x=>NM[x]||x).join(" and ")})`:`hanging ${NM[p.piece]||"piece"}`;
    return `<button type="button" class="lt" data-i="${i}"><span class="i">🧩</span><span><b>${E(who)} · ${E(what)}</b><small>after ${E(p.san)} · vs ${E((opps()[p.opp]||{}).name||p.opp)}</small></span></button>`; }).join("");
  h+=`<div class="row"><button type="button" class="bt" id="br81bl">My blunder puzzles</button></div>`;
  body.innerHTML=h; body.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>renderTry(pz[+b.dataset.i]));
  const bl=body.querySelector("#br81bl"); if(bl) bl.onclick=()=>{ try{ window.CRBlunders&&CRBlunders.open(); }catch(e){} }; }
function renderTry(p){ const body=shell("Puzzles",()=>{ view="puzzles"; render(); }); if(!p){ body.innerHTML=`<div class="card">That moment is gone.</div>`; return; }
  const who=p.who==="me"?"You":"They"; const title=p.kind==="fork"?`${who} walked into a fork with ${p.san}.`:`${who} missed a hanging ${NM[p.piece]||"piece"} after ${p.san}.`;
  body.innerHTML=`<h2>🧩 Try this moment</h2><div class="card"><p style="margin:0">${E(title)}</p>${p.reply?`<p class="mute">Play ${E(p.reply)} on the board.</p>`:`<p class="mute">Look at the knight fork, then try a blunder puzzle.</p>`}</div>
    <div class="bd" id="br81bd"></div><div class="msg" id="br81m"></div>
    <div class="row"><button type="button" class="bt" id="br81more">More blunder puzzles</button></div>`;
  try{ const B=CR52.board(body.querySelector("#br81bd"),sq=>tapTry(p,sq)); B.orient=(p.fen.split(" ")[1]==="b")?"b":"w"; B.draw(p.fen,{hl:p.to?[{sq:p.to,c:"#2e7d32",o:.35}]:[]}); body.__B=B; }catch(e){}
  const more=body.querySelector("#br81more"); if(more) more.onclick=()=>{ try{ window.CRBlunders&&CRBlunders.open(); }catch(e){} }; }
let sel=null;
function tapTry(p,sq){ const body=document.getElementById("br81body"); const B=body&&body.__B; const C=chess(); if(!B||!C||!p.reply) return; const g=new C(p.fen);
  const pc=g.get(sq); if(pc&&pc.color===g.turn()){ sel=sq; B.draw(p.fen,{hl:[{sq:sq,c:"#3b6fb6",o:.45}],dots:g.moves({square:sq,verbose:true}).map(m=>m.to)}); return; }
  if(!sel) return; const mv=g.moves({square:sel,verbose:true}).find(m=>m.to===sq); sel=null; if(!mv){ B.draw(p.fen); return; }
  const ok=mv.san===p.reply||(mv.from===p.from&&mv.to===p.to); const msg=document.getElementById("br81m");
  if(ok){ g.move(mv); B.draw(g.fen(),{hl:[{sq:mv.to,c:"#2e7d32",o:.5}]}); if(msg){ msg.className="msg ok"; msg.textContent="Yes. That's the capture."; } }
  else { B.draw(p.fen,{hl:p.to?[{sq:p.to,c:"#2e7d32",o:.4}]:[]}); if(msg){ msg.className="msg no"; msg.textContent="Not that one. The capture is "+p.reply+"."; } } }
function renderWeekly(){ const body=shell("Brain",backHome); const w=weekly();
  let h=`<h2>📅 Weekly report</h2><p class="mute">The last 7 days: who, what they played, what worked, and one thing to train.</p>`;
  if(!w.n) h+=`<div class="card">No games in the last 7 days yet. Play a couple, sync, and this page fills in.</div>`;
  else { const names=Object.keys(w.who).map(n=>n+" ("+w.who[n]+")").join(", ");
    h+=`<div class="card"><b>Who</b><p style="margin:4px 0 0">${E(names)}</p><p style="margin:4px 0 0">${w.pts} point${w.pts===1?"":"s"} from ${w.n} game${w.n===1?"":"s"}.</p></div>`;
    h+=`<div class="card"><b>What they played</b>${w.opens.slice(0,5).map(o=>`<div>${E(o.name)} · ${o.n} · you scored ${pct(o.n?o.pts/o.n:0)}</div>`).join("")}</div>`;
    h+=`<div class="card"><b>What worked</b><p style="margin:4px 0 0">${w.worked?E(w.worked.name)+" ("+pct(w.worked.pts/w.worked.n)+").":"Nothing clear yet. Keep the games coming."}</p></div>`;
    h+=`<div class="card"><b>One thing to train</b><p style="margin:4px 0 0">${E(w.train)}</p></div>`; }
  body.innerHTML=h; }
function lostColor(o){ const g=(o.h2h||[]).filter(x=>x.res==="L"); const c={w:0,b:0}; g.forEach(x=>{ c[x.me]=(c[x.me]||0)+1; }); if(c.b>c.w) return "b"; if(c.w) return "w"; return (o.h2h[0]&&o.h2h[0].me)||"w"; }
function playGhost(o){ const line=topLine(o); const seq=line?line.seq.slice():((o.h2h[0]&&o.h2h[0].sans)||[]).slice();
  const src=(window.CRBotsData||[]).find(b=>b.id==="pip")||(window.CRBotsData||[])[0]; if(!src||!window.CRBots) return;
  const w=[],b=[]; seq.forEach((san,i)=>{ (i%2?b:w).push(san); });
  const bot=Object.assign({},src,{id:"ghost",name:"Practice ghost",style:"Opens like "+(o.name||o.u),openings:[w.length?w:src.openings[0],b.length?b:src.openings[1]],
    chat:Object.assign({},src.chat,{start:["Let's practise this opening.","I'll start the way they do."]})});
  try{ window.CRHome&&CRHome.setMode("app",true); }catch(e){} CRBots._startBot(bot,lostColor(o)); }
function drillGhost(o){ const line=topLine(o); const seq=line?line.seq.slice():((o.h2h[0]&&o.h2h[0].sans)||[]); if(seq.length<2||!window.CROpenings||!window.CR52) { playGhost(o); return; }
  const C=chess(); if(!C){ playGhost(o); return; } const g=new C(), moves=[];
  seq.forEach(san=>{ const before=g.fen(); let m; try{ m=g.move(san); }catch(e){} if(!m) return; let why=m.san; try{ why=CROpenings._explain(m,before,g.fen(),moves.length); }catch(e){} moves.push([m.san,why]); });
  if(!moves.length){ playGhost(o); return; }
  const id="brain-ghost-"+o.u, side=lostColor(o); const item={id:id,name:"Prep vs "+(o.name||o.u),icon:"👻",side:side,sub:"Their first moves",tags:"ghost "+o.u,moves:moves};
  const K="chessReview.v52.myLines", L=CR52.LS.get(K,[]).filter(x=>x.id!==id); L.push(item); CR52.LS.set(K,L); try{ CROpenings._drill(id); }catch(e){ playGhost(o); } }
function renderGhost(){ const body=shell("Brain",backHome); const gh=ghosts();
  let h=`<h2>👻 Ghost prep</h2><p class="mute">Practise against an opening that beat you. The ghost is a bot, not the real player.</p>`;
  if(!gh.length) h+=`<div class="card">When someone beats you, their first moves show up here as a practice game.</div>`;
  else h+=gh.map(x=>{ const o=x.o, seq=(x.line&&x.line.seq)||((o.h2h[0]&&o.h2h[0].sans)||[]); return `<div class="card"><b>${E(o.name||o.u)}</b><p class="mute" style="margin:4px 0">${x.r.l?x.r.l+" loss"+(x.r.l===1?"":"es")+" to them. ":""}${seq.length?E(seq.join(" ")):"Their games are still being read."}</p>
      <div class="row"><button type="button" class="bt go" data-play="${E(o.u)}">Play ghost</button><button type="button" class="bt" data-drill="${E(o.u)}">Drill the line</button></div></div>`; }).join("");
  body.innerHTML=h; body.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{ const o=opps()[b.dataset.play]; if(o) playGhost(o); });
  body.querySelectorAll("[data-drill]").forEach(b=>b.onclick=()=>{ const o=opps()[b.dataset.drill]; if(o) drillGhost(o); }); }
function renderLeague(){ const body=shell("Brain",backHome); const lg=league();
  let h=`<h2>🏆 League of regulars</h2><p class="mute">People you have faced 3 or more times, most games first.</p>`;
  if(!lg.length) h+=`<div class="card">Nobody on the ladder yet. Play the same person 3 times and they join.</div>`;
  else h+=lg.map((x,i)=>`<div class="card"><b>${i+1}. ${E(x.o.name||x.o.u)}</b><div>${x.r.n} games · you ${x.r.w}–${x.r.d}–${x.r.l} · ${pct(x.r.n?x.r.pts/x.r.n:0)}</div>${bar(x.r)}</div>`).join("");
  body.innerHTML=h; }
function renderCoach(){ const body=shell("Brain",backHome); const tip=coachTip();
  body.innerHTML=`<h2>Coach tip</h2><div class="card"><p style="margin:0;font-size:18px">${E(tip)}</p></div>
    <p class="mute">This comes from your games on this phone. My Coach still runs your 30 minutes. This is one extra line from the brain.</p>
    <div class="row"><button type="button" class="bt go" id="br81co">Open My Coach</button><button type="button" class="bt" id="br81map">Opening map</button></div>`;
  const c=body.querySelector("#br81co"); if(c) c.onclick=()=>{ try{ window.Coach17&&Coach17.open("home"); }catch(e){} };
  const m=body.querySelector("#br81map"); if(m) m.onclick=()=>{ view="map"; render(); }; }
function renderBots(){ const body=shell("Brain",backHome); const rows=botView();
  let h=`<h2>🤖 Better bots</h2><p class="mute">Anonymous first moves, grouped by rating. Pip can copy the 0–399 band. Maisie can copy 400–699. With no games, they play exactly as before.</p>`;
  h+=rows.map(b=>{ const note=b.n?(b.n+" game"+(b.n===1?"":"s")+(b.top?" · most common first move "+b.top:"")):"No games in this band yet.";
    return `<div class="card"><b>${E(b.id)}${b.who?" · "+E(b.who):""}</b><p style="margin:4px 0 0">${E(note)}</p></div>`; }).join("");
  h+=`<div class="row"><button type="button" class="bt go" id="br81pip">Play Pip</button><button type="button" class="bt" id="br81mai">Play Maisie</button></div>`;
  body.innerHTML=h;
  const p=body.querySelector("#br81pip"), m=body.querySelector("#br81mai");
  if(p) p.onclick=()=>{ try{ window.CRHome&&CRHome.setMode("app",true); window.CRBots&&CRBots._start("pip","w"); }catch(e){} };
  if(m) m.onclick=()=>{ try{ window.CRHome&&CRHome.setMode("app",true); window.CRBots&&CRBots._start("maisie","w"); }catch(e){} }; }
function render(){ const fn={home:renderHome,map:renderMap,rivals:renderRivals,traps:renderTraps,puzzles:renderPuzzles,weekly:renderWeekly,ghost:renderGhost,league:renderLeague,coach:renderCoach,bots:renderBots};
  try{ (fn[view]||renderHome)(); }catch(e){ console.error(e); const body=shell("Home",()=>{ try{ CRHome.goHome(); }catch(err){} }); body.innerHTML=`<div class="card">Opponent Brain hit a snag. Your other pages are fine. Go home and open it again.</div>`; } }
function open(){ try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){} try{ window.PatternsUI&&PatternsUI.close(); }catch(e){}
  try{ window.CRHome&&CRHome.setMode("app",true); }catch(e){} view="home"; render(); }

function injectCoach(){ const s=document.getElementById("co17"); if(!s||!s.querySelector(".co17grid")||s.querySelector("#br81tip")) return;
  const tip=coachTip(); const html=`<div class="co17today" id="br81tip"><h3>From your games</h3><p>${E(tip)}</p><button type="button" class="cbtn" id="br81open">Open Opponent Brain</button></div>`;
  const today=s.querySelector(".co17today"); if(today) today.insertAdjacentHTML("afterend",html); else s.querySelector(".co17grid").insertAdjacentHTML("beforebegin",html);
  const b=s.querySelector("#br81open"); if(b) b.onclick=()=>open(); }
function hookCoach(){ const s=document.getElementById("co17"); if(!s){ hookCoach.n=(hookCoach.n||0)+1; if(hookCoach.n<50) setTimeout(hookCoach,200); return; } if(s.__br81) return; s.__br81=1; new MutationObserver(()=>{ try{ injectCoach(); }catch(e){} }).observe(s,{childList:true}); injectCoach(); }
function studyNote(){ const p=document.getElementById("study52"); if(!p||!p.classList.contains("on")||p.querySelector("#br81study")) return; const h=p.querySelector("h2"); if(!h) return;
  h.insertAdjacentHTML("afterend",`<div class="card" id="br81study"><b>Opponent Brain</b> keeps a short memory of the people you play. <button type="button" class="bt" id="br81stgo">Open Opponent Brain</button></div>`);
  const b=p.querySelector("#br81stgo"); if(b) b.onclick=()=>open(); }
function watchStudy(){ const hook=()=>{ const p=document.getElementById("study52"); if(!p||p.__br81) return; p.__br81=1; new MutationObserver(()=>{ try{ studyNote(); }catch(e){} }).observe(p,{childList:true}); studyNote(); };
  setTimeout(hook,1500); document.addEventListener("click",()=>setTimeout(hook,30),true); }

document.addEventListener("cr69games",()=>{ try{ ingestAsync(); }catch(e){} });
function boot(){ hookCoach(); watchStudy(); const start=()=>{ try{ ingestAsync(); }catch(e){} armDaily(); };
  if(window.requestIdleCallback) requestIdleCallback(start,{timeout:2500}); else setTimeout(start,500); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
window.CRBrain={snapshot,blurb,tip:coachTip,run,cancel,bookMove,openingMap,rivals,traps:allTraps,puzzles:allPuzzles,weekly,ghosts,league,coachTip,botStats:botView,ingest:ingestAsync,open};
window.CRFeed={open};
})();
