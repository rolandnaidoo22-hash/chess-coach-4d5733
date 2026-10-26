/* v46: "My Openings" report (Chess.com rapid + daily games) and a simple "Analysis strength" setting. Runs on the phone; only talks to api.chess.com. */
(function(){
"use strict"; if(window.CROpen) return;
const $=id=>document.getElementById(id), B=document.body;
const LS={get:(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } },set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CH=()=>window.ChessLib&&window.ChessLib.Chess||window.Chess;
const KS="chessReview.v46.engine", KC="chessReview.v46.openCache", KW="chessReview.v46.wrong";

/* ================= Analysis strength ================= */
const STR={quick:{label:"Quick",ms:2000,d:16,rev:{depth:14,time:1000,tdepth:11,ttime:300}},
           normal:{label:"Normal",ms:4000,d:20,rev:{depth:18,time:2500,tdepth:13,ttime:700}},
           deep:{label:"Deep",ms:8000,d:24,rev:{depth:22,time:5000,tdepth:15,ttime:1200}}};
function cfg(){ const c=LS.get(KS,{}); return {s:STR[c.s]?c.s:"normal",top3:!!c.top3}; }
function setCfg(p){ LS.set(KS,Object.assign(cfg(),p)); }
function isPhone(){ return /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&Math.min(screen.width,screen.height)<820); }
function threads(){ return isPhone()?1:Math.max(1,Math.min(2,(navigator.hardwareConcurrency||1)-1)); }
const ENG={cfg,
  live(){ const c=cfg(), s=STR[c.s]; return {depth:s.d,ms:s.ms,mpv:c.top3?3:1}; },
  review(){ const c=cfg(), s=STR[c.s]; return Object.assign({label:s.label,mpv:c.top3?3:2},s.rev); },
  threads};
window.CREngine=ENG;
function settingsCard(){ const h=$("home"); if(!h||$("v46set")) return;
  const d=document.createElement("div"); d.id="v46set";
  const c=cfg();
  d.innerHTML=`<h3>🧠 Analysis strength</h3><p class="sub">How long the computer thinks about each position. Longer is more accurate but slower.</p>
   <div class="v46seg" role="radiogroup">${Object.keys(STR).map(k=>`<button type="button" role="radio" data-s="${k}" aria-checked="${c.s===k}" class="${c.s===k?"on":""}"><b>${STR[k].label}</b><small>${STR[k].ms/1000} seconds${k==="normal"?" · best for most":""}</small></button>`).join("")}</div>
   <label class="v46tg"><input type="checkbox" id="v46top3" ${c.top3?"checked":""}> <span><b>Show top 3 moves</b><br><small>See the computer's three best ideas, not just one.</small></span></label>`;
  h.appendChild(d);
  d.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ setCfg({s:b.dataset.s}); d.querySelectorAll("[data-s]").forEach(x=>{ const on=x===b; x.classList.toggle("on",on); x.setAttribute("aria-checked",on); }); window.V42&&V42.toast&&V42.toast("Analysis strength: "+STR[b.dataset.s].label); });
  $("v46top3").onchange=e=>setCfg({top3:e.target.checked}); }

/* ================= My Openings ================= */
const CSS=`#v46set{display:none!important;flex-direction:column;align-items:stretch;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 8px}html.dark-mode #v46set{background:#262626;color:#eee;border-color:#3a3a3a}body.hs-set #home>#v46set{display:flex!important}
#v46set h3{margin:2px 0 2px;font-size:17px}#v46set .sub{margin:0 0 8px;font-size:13.5px}
.v46seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.v46seg button{min-height:56px;border-radius:12px;border:1px solid var(--line);background:#fff;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;color:var(--ink)}
.v46seg button small{font-size:11.5px;color:var(--mute)}.v46seg button.on{border:2px solid var(--accent,#2f7d32);background:#eef7ee}
.v46tg{display:flex!important;align-items:flex-start;gap:10px;font-size:14.5px}.v46tg small{color:var(--mute)}.v46tg input{margin-top:3px}
#v46{display:none;padding:4px 0 90px}#v46.on{display:block}body.hs-home #v46{display:none!important}
#v46 .top{display:flex;align-items:center;gap:10px;margin:4px 0 10px}#v46 .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;margin:0 0 10px}
#v46 h3{margin:0 0 8px;font-size:17px}#v46 p{line-height:1.4}.v46b{min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;font:inherit;font-weight:700;padding:0 14px;cursor:pointer;color:var(--ink)}
.v46b.pri{background:var(--accent,#2f7d32);color:#fff;border:none}.v46b.full{width:100%;margin-top:6px}
#v46 table{width:100%;border-collapse:collapse;font-size:14px}#v46 th,#v46 td{padding:6px 4px;border-bottom:1px solid var(--line);text-align:right}#v46 th:first-child,#v46 td:first-child{text-align:left}
#v46 th{font-size:12.5px;color:var(--mute);font-weight:600}.v46pct{font-weight:800}.v46g{color:#2e7d32}.v46r{color:#c62828}.v46m{color:var(--mute)}
.v46op{display:flex;width:100%;align-items:center;gap:8px;text-align:left;min-height:52px;border:1px solid var(--line);border-radius:12px;background:#fff;margin:0 0 6px;padding:6px 10px;font:inherit;cursor:pointer;color:var(--ink)}
.v46op .n{flex:1}.v46op small{color:var(--mute)}.v46op .p{font-weight:800;font-size:16px}
.v46bar{height:8px;border-radius:4px;background:#eee;overflow:hidden;display:flex;margin-top:4px}.v46bar i{display:block;height:100%}
#v46prog{display:none}#v46prog.on{display:block;position:fixed;top:0;left:50%;transform:translateX(-50%);width:min(100%,760px);box-sizing:border-box;z-index:9000;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));background:var(--card,#fff);border-bottom:1px solid rgba(0,0,0,.15);box-shadow:0 4px 14px rgba(0,0,0,.18);border-radius:0 0 12px 12px;font-size:14px}
#v46prog .pb{height:10px;background:#e6e6e6;border-radius:5px;overflow:hidden;margin-top:6px}#v46prog .pb i{display:block;height:100%;width:0;background:var(--accent,#2f7d32);transition:width .3s}
body.v46an #v46{margin-top:64px}
.v46brd svg{width:100%;height:auto;display:block;border-radius:8px;margin-bottom:6px}.v46mv{font-size:20px;font-weight:800}.v46fix{background:#eef7ee;border-radius:12px;padding:10px;margin:8px 0}.v46bad{background:#fdecec;border-radius:12px;padding:10px;margin:8px 0}
html.dark-mode #v46 .card,html.dark-mode .v46op,html.dark-mode .v46b:not(.pri),html.dark-mode .v46seg button{background:#262626;color:#eee;border-color:#3a3a3a}html.dark-mode .v46fix{background:#1e3320}html.dark-mode .v46bad{background:#3a2020}`;

function prog(on,txt,pct){ let p=$("v46prog"); if(!p){ p=document.createElement("div"); p.id="v46prog"; p.innerHTML=`<div id="v46pt"></div><div class="pb"><i id="v46pf"></i></div>`; B.appendChild(p); }
  p.classList.toggle("on",!!on); B.classList.toggle("v46an",!!on); if(txt!=null) $("v46pt").textContent=txt; if(pct!=null) $("v46pf").style.width=Math.max(3,Math.min(100,pct))+"%"; if(on) window.scrollTo({top:0,behavior:"smooth"}); }

function panel(html){ let d=$("v46"); if(!d){ d=document.createElement("div"); d.id="v46"; document.querySelector(".wrap").appendChild(d); }
  try{ window.Trainer&&Trainer.close(); }catch(e){} try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){}
  ["v42","v45"].forEach(id=>{ const v=$(id); if(v) v.classList.remove("on"); });
  if(window.CRHome) CRHome.setMode("app",true);
  d.innerHTML=`<div class="top"><button class="v46b" data-home>🏠 Home</button><span class="sub" style="margin:0">📖 My Openings</span></div>`+html; d.classList.add("on");
  d.querySelector("[data-home]").onclick=()=>{ close(); window.CRHome&&CRHome.goHome(); }; return d; }
function close(){ const d=$("v46"); if(d){ d.classList.remove("on"); d.innerHTML=""; } prog(false); }

function username(){ let u=""; try{ u=localStorage.getItem("chessReview.username")||""; }catch(e){} if(!u&&$("uname")) u=$("uname").value; return String(u||"").trim(); }

async function getJSON(url){ const r=await fetch(url); if(r.status===404) throw new Error("nouser"); if(!r.ok) throw new Error("http "+r.status); return r.json(); }
async function fetchGames(u,force){
  const c=LS.get(KC,null);
  if(!force&&c&&c.u===u.toLowerCase()&&Date.now()-c.t<6*3600e3) return c.games;
  prog(true,"Finding your games…",5);
  const A=(await getJSON(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}/games/archives`)).archives||[];
  const months=A.slice(-12), out=[];
  for(let i=0;i<months.length;i++){ prog(true,`Downloading games… month ${i+1} of ${months.length}`,10+80*i/months.length);
    try{ const j=await getJSON(months[i]); for(const g of j.games||[]){ if(g.time_class!=="rapid"&&g.time_class!=="daily") continue; if(g.rules&&g.rules!=="chess") continue;
      const me=g.white&&g.white.username.toLowerCase()===u.toLowerCase()?"w":"b"; const res=(me==="w"?g.white:g.black).result;
      const sc=res==="win"?1:["agreed","repetition","stalemate","insufficient","50move","timevsinsufficient"].includes(res)?.5:0;
      out.push({id:(g.url||"").split("/").pop(),url:g.url,me,sc,tc:g.time_class,eco:g.eco||"",pgn:g.pgn||"",end:g.end_time}); } }catch(e){ console.warn("month failed",e.message); } }
  prog(true,"Sorting your openings…",95);
  const slim=out.map(g=>{ const m=movesOf(g.pgn); const h=hdr(g.pgn); return {id:g.id,url:g.url,me:g.me,sc:g.sc,tc:g.tc,ecoc:h.ECO||"",name:nameOf(g.eco||h.ECOUrl||""),mv:m.slice(0,24),end:g.end}; });
  LS.set(KC,{u:u.toLowerCase(),t:Date.now(),games:slim}); return slim; }
function hdr(p){ const h={}; String(p).replace(/\[(\w+) "([^"]*)"\]/g,(_,k,v)=>{ h[k]=v; }); return h; }
function movesOf(p){ let t=String(p).replace(/\[[^\]]*\]/g," ").replace(/\{[^}]*\}/g," ").replace(/\([^)]*\)/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/,"");
  return t.split(/\s+/).filter(x=>x&&!/^\$/.test(x)); }
function nameOf(url){ let s=String(url).split("/").pop()||""; s=s.split(/-\d/)[0]; if(!s||s==="Undefined") return "Other / unnamed";
  const w=s.split("-"); const k=w.findIndex(x=>/^(Opening|Defense|Game|Gambit|Attack|System|Countergambit)$/.test(x));
  let n=(k>=0?w.slice(0,k+1):w.slice(0,3)).join(" "); return n.replace(/\bKings\b/g,"King's").replace(/\bQueens\b/g,"Queen's").replace(/\bBishops\b/g,"Bishop's").replace(/\bPetrovs\b/g,"Petrov's").replace(/\bAlekhines\b/g,"Alekhine's").replace(/Van t Kruijs/,"Van 't Kruijs"); }

function agg(gs){ const a={n:0,w:0,d:0,l:0,s:0}; gs.forEach(g=>{ a.n++; a.s+=g.sc; if(g.sc===1) a.w++; else if(g.sc===.5) a.d++; else a.l++; }); a.p=a.n?Math.round(100*a.s/a.n):0; return a; }
const pc=p=>`<span class="v46pct ${p>=55?"v46g":p<45?"v46r":""}">${p}%</span>`;
function bar(a){ return a.n?`<div class="v46bar"><i style="width:${100*a.w/a.n}%;background:#4caf50"></i><i style="width:${100*a.d/a.n}%;background:#bdbdbd"></i><i style="width:${100*a.l/a.n}%;background:#e57373"></i></div>`:""; }
function groups(G){ const m={}; G.forEach(g=>{ const k=g.me+"|"+g.name; (m[k]=m[k]||{k,me:g.me,name:g.name,ecos:{},games:[]}).games.push(g); if(g.ecoc) m[k].ecos[g.ecoc]=(m[k].ecos[g.ecoc]||0)+1; });
  return Object.values(m).map(o=>Object.assign(o,agg(o.games),{eco:Object.keys(o.ecos).sort((x,y)=>o.ecos[y]-o.ecos[x])[0]||""})); }
let GAMES=null, GR=null;

async function open(force){ const u=username();
  if(!u){ panel(`<div class="card" id="v46who">${window.CRAcct?CRAcct.form("v46ac","Who are you online?"):"<h3>Who are you online?</h3><p>Add a username in ⚙ Settings.</p>"}</div>`);
    if(window.CRAcct) CRAcct.wire($("v46who"),()=>setTimeout(()=>open(true),400)); return; }
  panel(`<div class="card"><p>Loading your openings…</p></div>`);
  try{ GAMES=await fetchGames(u,force); }catch(e){ prog(false); panel(`<div class="card"><h3>Couldn't load your games</h3><p>${e.message==="nouser"?`We couldn't find the username "${E_(u)}". Check it in Settings.`:"Check your internet connection and try again."}</p><button class="v46b pri full" id="v46rt">Try again</button></div>`); $("v46rt").onclick=()=>open(true); return; }
  prog(false); render(u); }

function render(u){ const G=GAMES; GR=groups(G);
  if(!G.length){ panel(`<div class="card"><h3>No rapid or daily games yet</h3><p>This report only uses rapid and daily games (not bullet or blitz). Play a few and come back.</p></div>`); return; }
  const W=G.filter(g=>g.me==="w"), Bk=G.filter(g=>g.me==="b");
  const row=(l,a)=>`<tr><td>${l}</td><td>${a.n}</td><td>${a.w}</td><td>${a.d}</td><td>${a.l}</td><td>${pc(a.p)}</td></tr>`;
  const fm=(gs,f)=>agg(gs.filter(f));
  const e4=g=>g.mv[0]==="e4", d4=g=>g.mv[0]==="d4", oth=g=>g.mv[0]!=="e4"&&g.mv[0]!=="d4";
  const cell=a=>a.n?`${pc(a.p)} <small class="v46m">(${a.n})</small>`:`<span class="v46m">–</span>`;
  const ok=GR.filter(o=>o.n>=3);
  const best=ok.slice().sort((a,b)=>b.p-a.p||b.n-a.n).slice(0,5), worst=ok.slice().sort((a,b)=>a.p-b.p||b.n-a.n).filter(o=>!best.slice(0,Math.max(0,ok.length-5)).includes(o)||ok.length<=5).slice(0,5);
  const item=o=>`<button class="v46op" data-k="${E_(o.k)}"><span class="n"><b>${E_(o.name)}</b><br><small>${o.me==="w"?"♔ as White":"♚ as Black"} · ${o.n} games · ${o.w}W ${o.d}D ${o.l}L${o.eco?" · "+E_(o.eco):""}</small>${bar(o)}</span><span class="p">${pc(o.p)}</span><span>›</span></button>`;
  const d=panel(`<div class="card"><h3>📊 Your results</h3><p class="sub" style="margin:0 0 6px">${G.length} rapid and daily games by <b>${E_(u)}</b> (bullet and blitz skipped). Score % counts a win as 1 and a draw as ½.</p>
    <table><tr><th></th><th>Games</th><th>Won</th><th>Drawn</th><th>Lost</th><th>Score</th></tr>${row("Total",agg(G))}${row("♔ White",agg(W))}${row("♚ Black",agg(Bk))}</table></div>
   <div class="card"><h3>♟ By first move</h3><table><tr><th>First move</th><th>As White</th><th>As Black</th></tr>
    <tr><td>1.e4</td><td>${cell(fm(W,e4))}</td><td>${cell(fm(Bk,e4))}</td></tr><tr><td>1.d4</td><td>${cell(fm(W,d4))}</td><td>${cell(fm(Bk,d4))}</td></tr><tr><td>Other</td><td>${cell(fm(W,oth))}</td><td>${cell(fm(Bk,oth))}</td></tr></table>
    <p class="sub" style="margin:6px 0 0">As Black, this is the move your opponent started with.</p></div>
   ${ok.length?`<div class="card"><h3>✅ Your best openings</h3>${best.map(item).join("")}</div><div class="card"><h3>⚠️ Openings to fix</h3><p class="sub" style="margin:0 0 6px">Tap one to see where you usually go wrong.</p>${worst.map(item).join("")}</div>`:`<div class="card"><p>Play at least 3 games in an opening to see your best and worst ones.</p></div>`}
   <div class="card"><h3>All openings</h3>${GR.slice().sort((a,b)=>b.n-a.n).map(item).join("")}</div>
   <button class="v46b full" id="v46rf">🔄 Get my newest games</button>`);
  d.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>detail(GR.find(o=>o.k===b.dataset.k)));
  $("v46rf").onclick=()=>open(true); window.scrollTo(0,0); }

/* ---- where you go wrong ---- */
const VAL={p:1,n:3,b:3,r:5,q:9,k:0}, PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const cpOf=sc=>sc?(sc.mate!=null?(sc.mate>0?10000-sc.mate:-10000-sc.mate):sc.cp):0;
function reasonBest(fen,san){ const C=CH(), c=new C(fen); let m; try{ m=c.move(san); }catch(e){ return ""; } if(!m) return "";
  if(c.isCheckmate&&c.isCheckmate()) return "It's checkmate!";
  if(m.captured) return `It wins material: it takes the ${PN[m.captured]} on ${m.to}.`;
  if(m.san.startsWith("O-O")) return "Castling puts your king somewhere safe and brings a rook into the game.";
  if((m.piece==="n"||m.piece==="b")&&(m.from[1]==="1"||m.from[1]==="8")) return `It gets a new ${PN[m.piece]} into the game. In the opening, bring out knights and bishops before anything else.`;
  if(m.piece==="p"&&/^[de][45]$/.test(m.to)) return "It grabs the centre with a pawn, giving your pieces more room.";
  if(m.san.includes("+")) return "It's a strong check that pushes the opponent back.";
  return "The computer rates it as the strongest way to keep your position healthy."; }
function reasonBad(fenAfter,replyUci,mv){ const C=CH(); let why=[];
  if(mv&&mv.piece==="q"&&+mv.moveNo<=6) why.push("bringing the queen out this early lets the opponent attack it while developing");
  if(mv&&mv.piece==="k"&&!mv.san.startsWith("O-O")) why.push("moving the king early loses the right to castle");
  if(replyUci){ try{ const c=new C(fenAfter); const r=c.move({from:replyUci.slice(0,2),to:replyUci.slice(2,4),promotion:replyUci[4]||"q"}); if(r&&r.captured) why.push(`it leaves your ${PN[r.captured]} on ${r.to} to be taken (${r.san})`); else if(r) why.push(`the opponent can answer with ${r.san}`); }catch(e){} }
  return why.length?why.join(", and ")+".":"it gives the opponent an easier game."; }
async function engine(){ if(!window.ReviewApp) throw new Error("no engine"); if(ReviewApp.isRunning&&ReviewApp.isRunning()&&!(window.CRBusy&&CRBusy.isMine())) throw new Error("busy"); return ReviewApp.getEngine(); }

async function analyse(o){ const cache=LS.get(KW,{}), key=o.k+"|"+o.n; if(cache[key]) return cache[key];
  const C=CH(); const pos={}; // fen -> {ply, n, moves:{san:count}, games}
  for(const g of o.games){ const c=new C(); for(let i=0;i<Math.min(g.mv.length,20);i++){ const turn=c.turn(); const f=c.fen(); const k=f.split(" ").slice(0,4).join(" ");
      if(turn===g.me){ const p=pos[k]=pos[k]||{fen:f,ply:i,n:0,moves:{},sc:0}; p.n++; p.moves[g.mv[i]]=(p.moves[g.mv[i]]||0)+1; p.sc+=g.sc; }
      let m=null; try{ m=c.move(g.mv[i]); }catch(e){} if(!m) break; } }
  const min=o.n>=6?2:1; const list=Object.values(pos).filter(p=>p.n>=min).sort((a,b)=>a.ply-b.ply||b.n-a.n).slice(0,14);
  let rel=null; if(window.CRBusy) rel=await CRBusy.acquire(); let E; try{ E=await engine(); }catch(e){ rel&&rel(); throw e; } let found=null, worst=null; try{
  for(let i=0;i<list.length;i++){ const p=list[i]; prog(true,`Checking your moves… ${i+1} of ${list.length}`,8+88*i/list.length);
    const san=Object.keys(p.moves).sort((a,b)=>p.moves[b]-p.moves[a])[0];
    const before=await E.analyse(p.fen,12,500,1); const bu=before.bm||before.pv[0]; if(!bu) continue;
    const c=new C(p.fen); const mv=c.move(san); if(!mv) continue; mv.moveNo=p.fen.split(" ")[5];
    if(bu===mv.from+mv.to+(mv.promotion||"")) continue;
    const after=await E.analyse(c.fen(),12,500,1); const loss=cpOf(before.score)+cpOf(after.score);
    const c2=new C(p.fen); const bm=c2.move({from:bu.slice(0,2),to:bu.slice(2,4),promotion:bu[4]||"q"});
    const rec={fen:p.fen,ply:p.ply,n:p.n,san,count:p.moves[san],best:bm?bm.san:bu,loss:Math.round(loss),reply:after.bm||after.pv[0]||"",mv:{piece:mv.piece,san:mv.san,moveNo:mv.moveNo}};
    if(!worst||loss>worst.loss) worst=rec;
    if(loss>=70){ found=rec; break; } } } finally{ rel&&rel(); }
  const res=found||(worst&&worst.loss>=30?worst:null)||{none:true};
  if(res&&!res.none){ const C3=CH(); const c=new C3(res.fen); c.move(res.san); res.why=reasonBad(c.fen(),res.reply,res.mv); res.good=reasonBest(res.fen,res.best); }
  cache[key]=res; LS.set(KW,cache); return res; }

function boardSvg(fen,me){ try{ if(window.R16&&R16.boardSvgStr) return R16.boardSvgStr(fen,{flip:me==="b"}); }catch(e){} return ""; }
async function detail(o){ if(!o) return;
  const head=`<div class="card"><h3>${E_(o.name)} ${o.me==="w"?"(as White)":"(as Black)"}</h3><p class="sub" style="margin:0">${o.n} games · ${o.w} won, ${o.d} drawn, ${o.l} lost · score ${pc(o.p)}${o.eco?" · ECO "+E_(o.eco):""}</p>${bar(o)}</div>`;
  let d=panel(head+`<div class="card"><p>🔎 Looking for where you usually go wrong…</p></div>`);
  let r; try{ r=await analyse(o); }catch(e){ prog(false); d=panel(head+`<div class="card"><p>${e.message==="busy"?"The computer is busy reviewing another game. Try again when it's finished.":"The computer couldn't start. Try again."}</p><button class="v46b full" id="v46bk">‹ Back to my openings</button></div>`); $("v46bk").onclick=()=>render(username()); return; }
  prog(false);
  const num=+r.fen?.split(" ")[5]||1, dots=o.me==="w"?".":"…";
  const body=r.none?`<div class="card"><h3>👍 No big opening mistake</h3><p>In these games your early moves match what the computer likes. Your results here come from later in the game.</p></div>`:
   `<div class="card"><h3>❌ Where you go wrong</h3><div class="v46brd">${boardSvg(r.fen,o.me)}</div>
     <div class="v46bad">You often play <span class="v46mv">${num}${dots}${E_(r.san)}</span> <small>(${r.count} of ${r.n} games from here)</small><br>This costs about <b>${(Math.min(r.loss,999)/100).toFixed(1)} pawns</b> because ${E_(r.why)}</div>
     <div class="v46fix">Better: <span class="v46mv">${num}${dots}${E_(r.best)}</span><br>${E_(r.good)}</div>
     <button class="v46b pri full" id="v46pr">▶ Practice this position</button></div>`;
  d=panel(head+body+`<button class="v46b full" id="v46bk">‹ Back to my openings</button>`);
  const pr=$("v46pr"); if(pr) pr.onclick=()=>{ close(); try{ CRHome.setMode("app",true); Trainer.open("play",{fen:r.fen,me:o.me,from:`Your ${o.name} position. Try ${r.best} this time.`,back:true}); }catch(e){ console.error(e); } };
  $("v46bk").onclick=()=>render(username()); window.scrollTo(0,0); }

function tile(){ const g=$("hsG"); if(!g||g.querySelector("[data-v46t]")) return;
  const b=document.createElement("button"); b.type="button"; b.dataset.v46t="1";
  b.innerHTML=`<span class="i">📖</span><span><b>My Openings</b><br><small>Which openings win you games</small></span>`;
  b.onclick=()=>open(false); const ref=g.querySelector('[data-hs="trap"]'); g.insertBefore(b,ref?ref.nextSibling:null); }
function boot(){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  const g=$("hsG"); if(g) new MutationObserver(tile).observe(g,{childList:true}); tile(); settingsCard(); const hm=$("home"); if(hm) new MutationObserver(()=>{ if(!$("v46set")) settingsCard(); }).observe(hm,{childList:true});
  new MutationObserver(()=>{ if(B.classList.contains("hs-home")) close(); }).observe(B,{attributes:true,attributeFilter:["class"]}); }
window.CROpen={open,close,_groups:groups,_name:nameOf};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,300)); else setTimeout(boot,300);
})();
