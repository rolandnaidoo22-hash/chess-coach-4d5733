/* study.js (v52): "Study your opponent". Type a username, pick Chess.com / Lichess / both, get a plain-English report
   built from that player's public games. Separate from the bots: nothing here creates a bot. Cached on this phone. */
(function(){
"use strict"; if(window.CRStudy) return;
const $=id=>document.getElementById(id), U=()=>window.CR52, E_=s=>U().E_(s);
const PFX="chessReview.v52.study.", KR="chessReview.v52.studyRecent", MAXG=300;
const NM={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
const SITE={c:"Chess.com",l:"Lichess"};
const pct=x=>Math.round(100*x)+"%";
/* ---------- PGN ---------- */
function splitPgn(t){ return t.replace(/\r/g,"").split(/\n\n(?=\[Event )/).filter(x=>x.trim()); }
function parsePgn(pgn){ const H={}; pgn.replace(/^\[(\w+)\s+"([^"]*)"\]/gm,(_,k,v)=>{ H[k]=v; });
  const body=pgn.replace(/^\[.*\]\s*$/gm,""), sans=[], clk=[]; const re=/\{([^}]*)\}|\(|\)|(\d+\.(?:\.\.)?)|(\$\d+)|([^\s{}()]+)/g; let m, depth=0;
  while((m=re.exec(body))){ if(m[0]==="("){ depth++; continue; } if(m[0]===")"){ depth--; continue; } if(depth) continue;
    if(m[1]!=null){ const c=/%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(m[1]); if(c&&sans.length) clk[sans.length-1]=Math.round(+c[1]*3600+ +c[2]*60+ +c[3]); continue; }
    if(m[4]&&!/^(1-0|0-1|1\/2-1\/2|\*)$/.test(m[4])) sans.push(m[4].replace(/[!?]+$/,"")); }
  return {H,sans,clk}; }
function replay(sans){ const C=U().CH(), ch=new C(), m=[]; for(const t of sans){ let r=null; try{ r=ch.move(t,{sloppy:true}); }catch(e){} if(!r) break; m.push(r.san); } return m; }
function tcOf(tc){ if(!tc||tc==="-") return "daily"; const [b,i]=tc.split("+").map(Number), e=b+40*(i||0); return e<180?"bullet":e<480?"blitz":e<1500?"rapid":"classical"; }
function slugName(u){ const s=(u||"").split("/openings/")[1]; return s?decodeURIComponent(s).replace(/-\d.*$/,"").replace(/-/g," "):""; }
function rec(site,id,c,tc,res,how,e,oe,t,P,name){ const m=replay(P.sans); if(m.length<2) return null;
  const myClk=P.clk.filter((x,i)=>(i%2?"b":"w")===c); return {id,site,c,tc,r:res,how,e:+e||0,oe:+oe||0,t,m,clk:myClk,name}; }
function fromChessCom(g,user){ if(!g.pgn||(g.rules&&g.rules!=="chess")) return null; const u=user.toLowerCase();
  const c=g.white&&g.white.username.toLowerCase()===u?"w":g.black&&g.black.username.toLowerCase()===u?"b":null; if(!c) return null;
  const me=c==="w"?g.white:g.black, op=c==="w"?g.black:g.white, P=parsePgn(g.pgn);
  const res=me.result==="win"?1:/agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(me.result)?0.5:0;
  const why=res===1?op.result:me.result, how=res===0.5?"draw":why==="timeout"?"time":why==="resigned"?"resign":why==="checkmated"?"mate":why==="abandoned"?"abandon":"other";
  return rec("c",g.url||String(g.end_time),c,g.time_class||"?",res,how,me.rating,op.rating,(g.end_time||0)*1000,P,(window.CRECO&&CRECO.label(CRECO.lookup(P.sans)))||P.H.Opening||slugName(P.H.ECOUrl)); }
function fromLichess(pgn,user){ const P=parsePgn(pgn), H=P.H, u=user.toLowerCase(); if(H.Variant&&H.Variant!=="Standard") return null;
  const c=(H.White||"").toLowerCase()===u?"w":(H.Black||"").toLowerCase()===u?"b":null; if(!c) return null;
  const res=H.Result==="1/2-1/2"?0.5:(H.Result==="1-0")===(c==="w")?1:0, last=P.sans[P.sans.length-1]||"";
  const how=res===0.5?"draw":H.Termination==="Time forfeit"?"time":H.Termination==="Abandoned"?"abandon":/#$/.test(last)?"mate":H.Termination==="Normal"?"resign":"other";
  const t=Date.parse((H.UTCDate||"").replace(/\./g,"-")+"T"+(H.UTCTime||"00:00:00")+"Z")||0;
  return rec("l",H.Site||H.GameId||String(t),c,tcOf(H.TimeControl),res,how,c==="w"?H.WhiteElo:H.BlackElo,c==="w"?H.BlackElo:H.WhiteElo,t,P,(window.CRECO&&CRECO.label(CRECO.lookup(P.sans)))||H.Opening||""); }
/* ---------- fetch (public games only) ---------- */
async function getJ(u,site){ const r=await fetch(u,{cache:"no-store"}); if(r.status===404) throw new Error("User not found."); if(r.status===429) throw new Error(`${site} is busy right now. Try again in a minute.`); if(!r.ok) throw new Error(`Couldn't reach ${site} (${r.status}).`); return r.json(); }
async function fetchChessCom(user,onP,own){ if(!own&&window.CRHidden&&CRHidden(user)) throw new Error("User not found."); const a=((await getJ(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`,"Chess.com")).archives||[]).slice().reverse(), out=[];
  for(let i=0;i<a.length&&out.length<MAXG;i++){ onP&&onP(`Chess.com: reading month ${i+1}`,Math.min(.95,out.length/MAXG)); let j; try{ j=await getJ(a[i],"Chess.com"); }catch(e){ if(/busy/.test(e.message)) throw e; continue; }
    (j.games||[]).slice().reverse().forEach(g=>{ if(out.length<MAXG){ const x=fromChessCom(g,user); if(x) out.push(x); } }); }
  return out; }
async function fetchLichess(user,onP,own){ if(!own&&window.CRHidden&&CRHidden(user)) throw new Error("User not found."); onP&&onP("Lichess: downloading games",.3);
  const r=await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=${MAXG}&clocks=true&opening=true&pgnInJson=false`,{headers:{Accept:"application/x-chess-pgn"},cache:"no-store"});
  if(r.status===404) throw new Error("User not found."); if(r.status===429) throw new Error("Lichess is busy right now. Try again in a minute."); if(!r.ok) throw new Error(`Couldn't reach Lichess (${r.status}).`);
  return splitPgn(await r.text()).map(p=>fromLichess(p,user)).filter(Boolean); }
/* ---------- cache ---------- */
const kOf=(user,src)=>PFX+src+"."+user.toLowerCase();
function load(user,src){ if(window.CRHidden&&CRHidden(user)) return null; return U().LS.get(kOf(user,src),null); }
function save(d){ for(let t=0;t<4;t++){ try{ localStorage.setItem(kOf(d.user,d.src),JSON.stringify(d)); return; }catch(e){ if(d.games.length<40) return; d.games.splice(0,Math.ceil(d.games.length/4)); } } }
function remember(user,src){ const r=U().LS.get(KR,[]).filter(x=>!(x.u.toLowerCase()===user.toLowerCase()&&x.s===src)); r.unshift({u:user,s:src}); U().LS.set(KR,r.slice(0,6)); }
async function fetchAll(user,src,onP,own){ const games=[], notes=[];
  if(src.includes("c")) try{ games.push(...await fetchChessCom(user,onP,own)); }catch(e){ notes.push(e.message); }
  if(src.includes("l")) try{ games.push(...await fetchLichess(user,onP,own)); }catch(e){ notes.push(e.message); }
  games.sort((a,b)=>a.t-b.t); const notes2=[...new Set(notes)]; return {games,notes:notes2}; }
async function rapidOf(user,src){ const out=[];
  if(src.includes("c")) try{ const r=await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/stats`); if(r.ok){ const j=await r.json(); const x=j.chess_rapid&&j.chess_rapid.last; if(x&&x.rating) out.push({s:"c",r:x.rating}); } }catch(e){}
  if(src.includes("l")) try{ const r=await fetch(`https://lichess.org/api/user/${encodeURIComponent(user)}`,{headers:{Accept:"application/json"}}); if(r.ok){ const j=await r.json(); const x=j.perfs&&j.perfs.rapid; if(x&&x.rating&&x.games) out.push({s:"l",r:x.rating}); } }catch(e){}
  return out; }
/* Charts: the player's OWN saved accounts only (never a typed-in name). Study and the style bot keep the hidden-name block. */
function fetchOwn(src){ const A=window.CRAcct, n=A?(src==="c"?A.cc():A.li()):""; if(!n) return Promise.resolve({games:[],notes:[]}); return fetchAll(n,src,null,true); }
/* ---------- plain English ---------- */
function say(san,color){ const side=color==="w"?"White":"Black"; if(/^O-O-O/.test(san)) return `${side} castles queen's side`; if(/^O-O/.test(san)) return `${side} castles king's side`;
  const p=/^[KQRBN]/.test(san)?NM[san[0].toLowerCase()]:"pawn", sq=(san.match(/[a-h][1-8](?=[=+#]*$|=)/)||san.match(/[a-h][1-8]/g)||[""]).slice(-1)[0];
  return `${side} ${p} ${san.includes("x")?"takes on":"to"} ${sq}`; }
function notation(m){ return m.map((s,i)=>(i%2?"":((i/2+1)+". "))+s).join(" "); }
const score=gs=>gs.length?gs.reduce((s,g)=>s+g.r,0)/gs.length:0;
function mode(arr){ const c={}; arr.forEach(x=>{ if(x) c[x]=(c[x]||0)+1; }); return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; }
/* most common continuation (greedy) among games sharing a start */
function common(gs,from,plies){ let seq=gs[0].m.slice(0,from), cur=gs;
  for(let i=from;i<plies;i++){ const t=mode(cur.map(g=>g.m[i])); if(!t) break; seq.push(t[0]); cur=cur.filter(g=>g.m[i]===t[0]); if(cur.length<2) break; }
  return seq; }
function fenAfter(seq){ const C=U().CH(), ch=new C(); seq.forEach(s=>ch.move(s)); return ch.fen(); }
function group(gs,ply){ const G={}; gs.forEach(g=>{ const k=g.m[ply]; if(k) (G[k]=G[k]||[]).push(g); }); return Object.entries(G).sort((a,b)=>b[1].length-a[1].length); }
/* ---------- report (v54) ----------
   Layer 1: counted straight from the game scores (always there, instant).
   Layer 2: the app's Stockfish worker checks the NEWEST games (up to LIM), newest first, at depth 8, in the background.
   A "blunder" = a move that loses 3 or more pawns (300 centipawns).
   Phases: opening = the first 10 moves by each side (ply < 20); after that, endgame = queens, rooks, bishops and knights
   left on the board add up to 26 points or less (queen 9, rook 5, bishop/knight 3); middlegame = everything else. */
const LIM=40, MINL=4, LPLY=6, PHN={o:"opening",m:"middlegame",e:"endgame"};
const PHDEF="Opening = the first 10 moves by each side. Endgame = after that, once the queens, rooks, bishops and knights left add up to 26 points or less (queen 9, rook 5, bishop or knight 3). Middlegame = everything in between.";
const side=c=>c==="w"?"White":"Black";
const ofN=(k,n)=>n?`${pct(k/n)} <small class="mute">(${k} of ${n})</small>`:`<span class="mute">no games</span>`;
function lineArrows(seq){ const C=U().CH(), ch=new C(), mv=[]; seq.forEach(s=>{ try{ const m=ch.move(s); if(m) mv.push(m); }catch(e){} });
  return mv.slice(-2).map((m,i,a)=>({u:m.from+m.to,c:m.color==="w"?"#1e88e5":"#e53935",dash:i<a.length-1})); }
const lineName=seq=>{ try{ return window.CRECO?CRECO.label(CRECO.lookup(seq))||"":""; }catch(e){ return ""; } };
function board(seq,orient,w){ return `<div style="width:${w||112}px;flex:none">${U().mini(fenAfter(seq),orient,{arrows:lineArrows(seq)})}</div>`; }
function lineCard(seq,gs,total,orient,label,col){ const sc=score(gs), nm=lineName(seq);
  return `<div class="card" style="display:flex;gap:10px;align-items:center${col?";border-left:5px solid "+col:""}">${board(seq,orient)}
   <div style="min-width:0"><b>${E_(label)}</b>${total?`<div style="font-size:20px;font-weight:800">${pct(gs.length/total)} <small class="mute" style="font-size:13px;font-weight:400">of their ${side(orient)} games (${gs.length} of ${total})</small></div>`:""}
   <div>They score <b style="color:${sc>=.55?"#c62828":sc<=.45?"#2e7d32":"inherit"}">${pct(sc)} in ${gs.length} game${gs.length>1?"s":""}</b></div>${nm?`<div class="mute">${E_(nm)}</div>`:""}<div class="mute" style="font-family:monospace;font-size:12px">${E_(notation(seq))}</div></div></div>`; }
function counts(gs,mine){ let mv=0,chk=0,cap=0; gs.forEach(g=>g.m.forEach((s,i)=>{ if(((i%2?"b":"w")===g.c)!==mine) return; mv++; if(/[+#]/.test(s)) chk++; if(s.includes("x")) cap++; }));
  const won=gs.filter(g=>mine?g.r===1:g.r===0), lost=gs.filter(g=>mine?g.r===0:g.r===1);
  return {mv,chk,cap,wins:won.length,mates:won.filter(g=>g.how==="mate").length,ab:lost.filter(g=>g.how==="abandon").length,time:lost.filter(g=>g.how==="time").length,n:gs.length}; }
function newest(d){ return d.games.slice().sort((a,b)=>b.t-a.t).slice(0,LIM); }
function layer2(d){ const set=newest(d), done=set.filter(g=>d.an[g.id]); const P={o:{n:0,b:0},m:{n:0,b:0},e:{n:0,b:0}};
  if(done.length<set.length) return {ready:false,k:done.length,N:set.length};
  done.forEach(g=>d.an[g.id].forEach(([ply,ph,loss])=>{ const x=P[ph]; if(!x) return; x.n++; if(loss>=300) x.b++; }));
  const worst=["o","m","e"].filter(k=>P[k].n>=15).sort((a,b)=>P[b].b/P[b].n-P[a].b/P[a].n)[0]||null;
  return {ready:true,N:set.length,P,worst}; }
function report(d){ const gs=d.games, W=gs.filter(g=>g.c==="w"), B=gs.filter(g=>g.c==="b"), n=gs.length;
  const w=gs.filter(g=>g.r===1).length, dr=gs.filter(g=>g.r===.5).length, l=n-w-dr;
  const byNew=gs.slice().sort((a,b)=>b.t-a.t), form=byNew.slice(0,10).map(g=>g.r===1?"W":g.r===.5?"D":"L");
  const rg=byNew.find(g=>g.tc==="rapid"&&g.e), rapid=d.rapid&&d.rapid.length?d.rapid:rg?[{s:rg.site,r:rg.e,from:"game"}]:[];
  const R={n,w,dr,l,form,rapid,white:[],vsE4:[],vsD4:[],best:{},worst:null,tips:[],steer:null,me:counts(gs,true),opp:counts(gs,false),L2:layer2(d)};
  group(W,0).slice(0,3).forEach(([mv,g])=>{ if(g.length/W.length<.08) return; R.white.push({seq:common(g,1,6),g,total:W.length,label:"Starts with "+say(mv,"w").replace(/^White /,"the ")}); });
  [["vsE4","e4"],["vsD4","d4"]].forEach(([k,f])=>{ const b=B.filter(g=>g.m[0]===f); if(b.length<2) return; R[k+"N"]=b.length;
    group(b,1).slice(0,2).forEach(([mv,g])=>R[k].push({seq:common(g,2,6),g,total:b.length,label:"Answers with "+say(mv,"b").replace(/^Black /,"the ")})); });
  /* exact lines: their colour + the first LPLY half-moves, every reply the same */
  const op={}; gs.forEach(g=>{ if(g.m.length<LPLY) return; const k=g.c+"|"+g.m.slice(0,LPLY).join(" "); (op[k]=op[k]||[]).push(g); });
  const lines=Object.entries(op).filter(([k,v])=>v.length>=MINL).map(([k,v])=>({c:k[0],seq:k.slice(2).split(" "),g:v,s:score(v)}));
  ["w","b"].forEach(c=>{ R.best[c]=lines.filter(x=>x.c===c).sort((a,b)=>b.s-a.s||b.g.length-a.g.length)[0]||null; });
  R.worst=lines.slice().sort((a,b)=>a.s-b.s||b.g.length-a.g.length)[0]||null;
  const me=R.me, L2=R.L2, losses=l;
  const wl=R.worst; if(wl&&wl.s<=.5){ const you=wl.c==="w"?"b":"w"; R.steer={seq:wl.seq,you,s:wl.s,n:wl.g.length};
    R.tips.push(`<b>Steer into their worst line.</b> Play it as ${side(you)}: ${E_(notation(wl.seq))}. They score only ${pct(wl.s)} in ${wl.g.length} games there.`); }
  [["w"],["b"]].forEach(([c])=>{ const b=R.best[c]; if(b&&b.s>=.65&&!(wl&&wl.seq.join()===b.seq.join())) R.tips.push(`<b>Dodge their favourite weapon as ${side(c)}.</b> After ${E_(notation(b.seq))} they score ${pct(b.s)} in ${b.g.length} games, so choose a different reply earlier.`); });
  if(me.mv&&me.chk/me.mv>=.06) R.tips.push(`<b>Check their checks before every move.</b> About 1 of every ${Math.round(me.mv/me.chk)} of their moves is a check (${me.chk} in ${me.mv} moves).`);
  if(me.mv&&me.cap/me.mv>=.18) R.tips.push(`<b>Count defenders.</b> They grab material: 1 of every ${Math.round(me.mv/me.cap)} moves is a capture (${me.cap} in ${me.mv} moves). Make sure each of your pieces is guarded at least as many times as it is attacked.`);
  if(me.wins>=4&&me.mates/me.wins>=.25) R.tips.push(`<b>Keep your king safe.</b> ${pct(me.mates/me.wins)} of their wins end in checkmate (${me.mates} of ${me.wins}). Castle early and keep pawns in front of your king.`);
  if(losses>=5&&me.time/losses>=.15) R.tips.push(`<b>Make them use their clock.</b> They lost on time in ${me.time} of ${losses} losses. Keep the position complicated and play steady moves.`);
  if(me.ab>=2) R.tips.push(`<b>Never resign early.</b> They have left ${me.ab} games unfinished.`);
  if(L2.ready&&L2.worst) R.tips.push(`<b>Aim for the ${PHN[L2.worst]}.</b> That is where they blunder most (${L2.P[L2.worst].b} big mistakes in ${L2.P[L2.worst].n} moves).`);
  if(!R.tips.length) R.tips.push("<b>Play solid chess.</b> Nothing in their numbers stands out yet: develop your knights and bishops, castle, and guard every piece.");
  return R; }
/* ---------- screens ---------- */
function css(){ if($("st52css")) return; const s=document.createElement("style"); s.id="st52css"; s.textContent=`.st52 .seg{display:flex;gap:6px}.st52 .seg .bt{flex:1}.st52 .wdl{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:6px 0}.st52 .wdl i{display:block;height:100%}.st52 ul{margin:4px 0;padding-left:20px}.st52 li{margin:5px 0;line-height:1.4}.st52 .fm{display:inline-flex;width:24px;height:24px;border-radius:5px;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;margin:2px}.st52 .sh{border-radius:12px;padding:8px 12px;color:#fff;margin:16px 0 6px;font-size:17px}.st52 table{width:100%;border-collapse:collapse;font-size:14px}.st52 td,.st52 th{padding:6px 4px;border-bottom:1px solid rgba(128,128,128,.25);text-align:left;vertical-align:top}.st52 th{font-size:12px}`; document.head.appendChild(s); }
function open(){ css(); const p=U().show("study52"); p.classList.add("st52"); let src=U().LS.get(KR+".src","c");
  const recent=U().LS.get(KR,[]);
  p.innerHTML=`<h2>🔍 Study your opponent</h2><p class="mute">Type a username. You get a report from their public games: what they play, what to watch out for, and how to beat them.</p>
   <div class="card"><input type="text" id="st52u" placeholder="Their username" autocapitalize="off" autocorrect="off" spellcheck="false">
   <div class="seg" style="margin-top:8px">${[["c","Chess.com"],["l","Lichess"],["cl","Both"]].map(([k,t])=>`<button class="bt ${k===src?"go":""}" data-src="${k}">${t}</button>`).join("")}</div>
   <div class="row"><button class="bt go" id="st52go" style="flex:1">Fetch</button></div><div class="msg no" id="st52m"></div></div>
   ${recent.length?`<h3>Recent</h3>${recent.map(r=>`<button class="lt" data-r="${E_(r.u)}|${r.s}"><span class="i">🔍</span><span><b>${E_(r.u)}</b><small>${r.s.split("").map(x=>SITE[x]).join(" + ")}</small></span></button>`).join("")}`:""}`;
  p.querySelectorAll("[data-src]").forEach(b=>b.onclick=()=>{ src=b.dataset.src; U().LS.set(KR+".src",src); p.querySelectorAll("[data-src]").forEach(x=>x.classList.toggle("go",x===b)); });
  p.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ const [u,s]=b.dataset.r.split("|"); study(u,s); });
  $("st52go").onclick=()=>{ const u=$("st52u").value.trim().replace(/^@/,""); if(!/^[A-Za-z0-9_-]{2,30}$/.test(u)){ $("st52m").textContent="Please type a username (letters, numbers, - or _)."; return; } study(u,src); }; }
async function study(user,src,force){ css(); const p=U().show("study52"); p.classList.add("st52"); let d=load(user,src);
  if(!d||force){ p.innerHTML=`<h2>🔍 ${E_(user)}</h2><div class="card"><b id="st52t">Reading public games…</b><div style="height:10px;background:#eee;border-radius:5px;margin-top:6px;overflow:hidden"><i id="st52f" style="display:block;height:100%;width:5%;background:#d4af37"></i></div></div><div class="row"><button class="bt" id="st52b">‹ Back</button></div>`;
    $("st52b").onclick=open;
    const r=await fetchAll(user,src,(t,f)=>{ $("st52t")&&($("st52t").textContent=t); $("st52f")&&($("st52f").style.width=Math.round(f*100)+"%"); });
    if(!r.games.length){ if($("st52t")) $("st52t").textContent=(r.notes.join(" ")||"No public games found for this player."); return; }
    const old=d; d={user,src,games:r.games,an:{},fetched:Date.now(),notes:r.notes,rapid:await rapidOf(user,src)}; if(old) d.games.forEach(g=>{ if(old.an[g.id]) d.an[g.id]=old.an[g.id]; });
    save(d); }
  remember(user,src); paint(d); analyse(d); }
let running=null;
async function analyse(d){ if(running) return; running=d; const todo=newest(d).filter(g=>!d.an[g.id]); let k=0;
  try{ for(const g of todo){ if(!$("st52rep")||$("st52rep").dataset.u!==d.user+d.src) break; try{ d.an[g.id]=await CRStyle.analyseGame(g); }catch(e){ break; } k++;
    const pr=$("st52pr"); if(pr) pr.innerHTML=progBar(d); if(k===todo.length){ save(d); paint(d); } else if(k%5===0) save(d); } } finally { save(d); running=null; } }
function progBar(d){ const L=layer2(d); return L.ready?"":`<div class="mute">Checking the ${L.N} newest games for big mistakes in the background (newest first): ${L.k} of ${L.N}</div><div style="height:8px;background:#eee;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(100*L.k/L.N)}%;background:#d4af37"></i></div>`; }
const H=(t,c)=>`<div class="sh" style="background:${c}">${t}</div>`;
function paint(d){ const p=U().show("study52"), R=report(d); R.scen=scenarios(d,R); const y=window.scrollY, me=R.me, op=R.opp, L2=R.L2;
  const wdl=`<div class="wdl"><i style="width:${100*R.w/R.n}%;background:#2e7d32"></i><i style="width:${100*R.dr/R.n}%;background:#9e9e9e"></i><i style="width:${100*R.l/R.n}%;background:#c62828"></i></div>`;
  const fm=R.form.map(x=>`<span class="fm" style="background:${x==="W"?"#2e7d32":x==="D"?"#757575":"#c62828"}">${x}</span>`).join("");
  const rap=R.rapid.length?R.rapid.map(x=>`<span class="elo" style="font-size:15px">Rapid ${x.r} <small>${SITE[x.s]}${x.from==="game"?", latest rapid game":""}</small></span>`).join(" "):`<span class="mute">No rapid rating</span>`;
  const sec=(t,arr,orient)=>arr.length?`<h3>${t}</h3>`+arr.map(x=>lineCard(x.seq,x.g,x.total,orient,x.label)).join(""):"";
  const bestCard=c=>{ const b=R.best[c]; return b?lineCard(b.seq,b.g,0,c,`Best line as ${side(c)}`,"#2e7d32"):`<div class="card mute">As ${side(c)}: no exact line played ${MINL} or more times yet.</div>`; };
  const row=(t,a,b)=>`<tr><td>${t}</td><td>${a}</td><td>${b}</td></tr>`, per=(k,n)=>n?`1 in ${k?Math.round(n/k):"–"} <small class="mute">(${k} of ${n} moves)</small>`:"–";
  const wl=R.worst, ph=L2.ready?`<p>Big mistakes = moves that give away 3 or more pawns, checked by the app's engine in their ${L2.N} newest games.</p><table><tr><th>Phase</th><th>Big mistakes</th></tr>${["o","m","e"].map(k=>`<tr${k===L2.worst?' style="background:rgba(198,40,40,.12)"':""}><td>${PHN[k]}${k===L2.worst?" ⚠️":""}</td><td>${L2.P[k].n?`${L2.P[k].b} in ${L2.P[k].n} moves (${(100*L2.P[k].b/L2.P[k].n).toFixed(1)}%)`:"no moves"}</td></tr>`).join("")}</table>${L2.worst?`<p>Shakiest phase: <b>the ${PHN[L2.worst]}</b>.</p>`:`<p class="mute">Not enough moves in any phase to pick a shakiest one (needs 15).</p>`}`:`<p><b>Not analysed yet.</b> ${L2.k} of ${L2.N} games checked so far; this part fills in when all are done.</p>`;
  p.innerHTML=`<div id="st52rep" data-u="${E_(d.user+d.src)}"><h2>🔍 ${E_(d.user)}</h2>
   <div class="card" style="border-top:5px solid #d4af37"><div style="display:flex;flex-wrap:wrap;gap:6px">${rap}</div>
    <div style="margin-top:8px"><b>${R.n} games</b>: <b style="color:#2e7d32">${R.w} won</b> · <b style="color:#757575">${R.dr} drawn</b> · <b style="color:#c62828">${R.l} lost</b></div>${wdl}
    <div>Last ${R.form.length} games, newest first: ${fm}</div>
    <div class="mute" style="margin-top:6px">From public games on ${d.src.split("").map(x=>SITE[x]).join(" and ")}. Last updated ${new Date(d.fetched).toLocaleDateString()}.${window.CRECO?" "+CRECO.credit:""}</div>${(d.notes||[]).length?`<div class="no" style="font-size:13px">${E_(d.notes.join(" "))}</div>`:""}<div id="st52pr">${progBar(d)}</div></div>
   ${H("📖 Openings","#1565c0")}
   <p class="mute">A "line" means the first ${LPLY/2} moves by each side, exactly the same. "Best" only counts lines played at least ${MINL} times.</p>
   ${bestCard("w")}${bestCard("b")}
   ${sec("♔ Most played as White",R.white,"w")}
   ${R.vsE4.length?sec(`♚ Most played as Black against 1.e4 <small class="mute">${R.vsE4N} games</small>`,R.vsE4,"b"):""}
   ${R.vsD4.length?sec(`♚ Most played as Black against 1.d4 <small class="mute">${R.vsD4N} games</small>`,R.vsD4,"b"):""}
   ${H("📊 Style numbers","#6a1b9a")}
   <div class="card"><table><tr><th></th><th>${E_(d.user)}</th><th>Their opponents</th></tr>
    ${row("Checks per move",per(me.chk,me.mv),per(op.chk,op.mv))}${row("Captures per move",per(me.cap,me.mv),per(op.cap,op.mv))}
    ${row("Wins by checkmate",ofN(me.mates,me.wins),ofN(op.mates,op.wins))}${row("Lost on time",ofN(me.time,R.n),ofN(op.time,R.n))}${row("Abandoned (left the game)",ofN(me.ab,R.n),ofN(op.ab,R.n))}</table>
    <div class="mute" style="font-size:12px;margin-top:4px">Counted from every move in all ${R.n} games.</div></div>
   ${H("🎯 Weak spots","#c62828")}
   ${wl?lineCard(wl.seq,wl.g,0,wl.c,`Worst line: as ${side(wl.c)}`,"#c62828"):`<div class="card mute">No exact line played ${MINL} or more times yet.</div>`}
   <div class="card"><b>Shakiest phase</b>${ph}<div class="mute" style="font-size:12px">${PHDEF}</div></div>
   ${H("🏆 How to beat them","#2e7d32")}
   <div class="card"><ol style="margin:4px 0;padding-left:20px">${R.tips.map(x=>`<li style="margin:8px 0">${x}</li>`).join("")}</ol>
</div>
   ${scHtml(R.scen)}
   <div class="row"><button class="bt go" id="st52ps" style="flex:1">🤖 Play their style</button></div>
   <div class="row"><button class="bt" id="st52rf">🔄 Refresh games</button><button class="bt" id="st52bk">‹ Study someone else</button></div></div>`;
  window.scrollTo(0,y);
  $("st52rf").onclick=()=>study(d.user,d.src,true); $("st52bk").onclick=open;
  try{ scMount(d,R.scen); }catch(e){ console.warn("scenarios",e); }
  $("st52ps").onclick=()=>practice(d,R); }
/* a generic practice bot: their openings + mistake rates, never their name */

/* ---------- v55: "How to beat them" scenario boards, built only from their real games + the app's engine ---------- */
function scenarios(d,R){ const S=[], L2=R.L2;
  if(R.steer) S.push({k:"steer",icon:"🎯",title:"Steer into their worst line",you:R.steer.you,seq:R.steer.seq,n:R.steer.n,
    s:R.steer.s,sample:`${R.steer.n} games in this exact line · they score ${pct(R.steer.s)}`,their:R.steer.you==="w"?"b":"w"});
  /* their most repeated engine-found mistake in the opening */
  if(!L2.ready) S.push({k:"mist",icon:"⚠️",title:"Their repeated mistake",na:true});
  else { const C={}; newest(d).forEach(g=>{ const a=d.an[g.id]; if(!a) return; a.forEach(([ply,ph,loss])=>{ if(loss<200||ply>24) return; const k=g.c+"|"+g.m.slice(0,ply+1).join(" "); const x=C[k]||(C[k]={c:g.c,seq:g.m.slice(0,ply+1),n:0,loss:0}); x.n++; x.loss+=loss; }); });
    const best=Object.values(C).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n||b.loss/b.n-a.loss/a.n)[0];
    if(best){ const pre=best.seq.slice(0,-1).join(" "), reach=d.games.filter(g=>g.c===best.c&&g.m.slice(0,best.seq.length-1).join(" ")===pre).length;
      S.push({k:"mist",icon:"⚠️",title:"Punish their repeated mistake",you:best.c==="w"?"b":"w",their:best.c,seq:best.seq,mistake:true,n:best.n,
        sample:`They played this ${best.n} times in ${reach} games that reached this position (engine-checked, ${L2.N} newest games)`}); }
    else S.push({k:"mist",icon:"⚠️",title:"Their repeated mistake",none:true,sample:`Engine checked their ${L2.N} newest games: no early mistake repeated twice or more.`}); }
  /* how they defend against 1.e4 / 1.d4 (or how they start as White) */
  const df=(R.vsE4[0]&&{x:R.vsE4[0],t:"How they defend against 1.e4"})||(R.vsD4[0]&&{x:R.vsD4[0],t:"How they defend against 1.d4"})||(R.white[0]&&{x:R.white[0],t:"How they start as White"});
  if(df&&!(R.steer&&R.steer.seq.join()===df.x.seq.join())){ const their=df.x.g[0].c; S.push({k:"def",icon:"🛡",title:df.t,you:their==="w"?"b":"w",their,seq:df.x.seq,n:df.x.g.length,
    sample:`${df.x.g.length} of their games follow these moves · they score ${pct(score(df.x.g))}`}); }
  S.forEach(sc=>{ if(sc.seq&&sc.seq.length&&(sc.seq.length%2===0)!==(sc.you==="w")) sc.seq=sc.seq.slice(0,-1); });
  return S.slice(0,3); }
function scSteps(sc){ const C=U().CH(), ch=new C(), st=[{fen:ch.fen(),arrows:[],note:`Start position. You are ${side(sc.you)}. Tap Next to follow their real games.`}];
  sc.seq.forEach((san,i)=>{ const before=ch.fen(); let m=null; try{ m=ch.move(san); }catch(e){} if(!m) return; const theirs=m.color===sc.their, last=i===sc.seq.length-1;
    let why=""; try{ why=window.CROpenings?CROpenings._explain(m,before,ch.fen(),i):""; }catch(e){} why=String(why||"").replace(/<[^>]+>/g,"");
    const note=theirs?(last&&sc.mistake?`They usually play ${san} here. The app's engine says this is a mistake.`:`They usually play ${san} here.`)+(why?" "+why:""):`You play ${san}.`+(why?" "+why:"");
    st.push({fen:ch.fen(),arrows:[{u:m.from+m.to,c:theirs?(last&&sc.mistake?"#e53935":"#ef6c00"):"#1e88e5"}],note,san}); });
  return st; }
async function scReply(fen){ await CRBotEngine.boot(); const l=await CRBotEngine.candidates(fen,1,1200); const x=l&&l[0]; if(!x||!x.uci) return null;
  const C=U().CH(), ch=new C(fen), before=ch.fen(); let m=null; try{ m=ch.move({from:x.uci.slice(0,2),to:x.uci.slice(2,4),promotion:x.uci[4]||"q"}); }catch(e){} if(!m) return null;
  let why=""; try{ why=window.CROpenings?String(CROpenings._explain(m,before,ch.fen(),20)||"").replace(/<[^>]+>/g,""):""; }catch(e){} return {m,fen:ch.fen(),why}; }
function scHtml(S){ if(!S.length) return ""; return `<style>.sc55 .scbw svg,.sc55 .scbw>div{width:100%!important;height:auto!important;max-width:100%}.sc55 .scr{align-items:center;justify-content:space-between}</style><h3 style="margin:12px 0 4px">♟ Scenario boards</h3><p class="mute" style="margin:0 0 6px">Built from their real games. Tap Next and Back; arrows show each move. Blue = you, orange = them, red = their mistake, green = your best reply (from the app's engine).</p>`+
  S.map((sc,i)=>`<div class="card sc55" id="sc55-${i}" data-k="${sc.k}"><b>${sc.icon} ${E_(sc.title)}</b>${sc.na?`<p class="mute">Not analysed yet. The app's engine is still checking their games; this board appears when it's done.</p>`:sc.none?`<p class="mute">${E_(sc.sample)}</p>`:
   `<div class="mute" style="font-size:12.5px">${E_(sc.sample)}</div><div class="scb"></div><div class="scn"></div><div class="row scr"><button class="bt scP">‹ Back</button><span class="scc"></span><button class="bt go scN">Next ›</button></div><div class="row"><button class="bt scD" style="flex:1">🎯 Drill this</button></div>`}</div>`).join(""); }
function scMount(d,S){ S.forEach((sc,i)=>{ const el=$("sc55-"+i); if(!el||sc.na||sc.none) return; const st=scSteps(sc); let k=0, reply=null, rq=false;
  const draw=()=>{ const s=st[k]; el.querySelector(".scb").innerHTML=`<div class="scbw" style="max-width:340px;margin:6px auto">${U().mini(s.fen,sc.you,{arrows:s.arrows})}</div>`; el.querySelector(".scn").textContent=s.note; el.querySelector(".scc").textContent=`${k+1} / ${st.length}`;
    el.querySelector(".scP").disabled=k===0; el.querySelector(".scN").disabled=k===st.length-1&&!!reply&&reply!=="wait"; };
  const addReply=()=>{ if(rq) return; rq=true; reply="wait"; const end=st[st.length-1]; st.push({fen:end.fen,arrows:[],note:"Working out your best reply with the app's engine…"}); draw();
    scReply(end.fen).then(r=>{ const s=st[st.length-1]; if(!r){ s.note="The engine couldn't find a reply right now. Try again later."; reply=null; rq=false; st.pop(); draw(); return; }
      reply=r; s.fen=end.fen; s.arrows=[{u:r.m.from+r.m.to,c:"#2e7d32"}]; s.san=r.m.san; s.note=`Hit back with ${r.m.san}`+(r.why?` because ${r.why.charAt(0).toLowerCase()+r.why.slice(1)}`:".")+" (The app's engine's choice.)"; draw(); })
    .catch(()=>{ st.pop(); reply=null; rq=false; draw(); }); };
  el.querySelector(".scP").onclick=()=>{ if(k>0){ k--; draw(); } };
  el.querySelector(".scN").onclick=()=>{ if(k<st.length-1){ k++; draw(); if(k===st.length-1&&!rq) addReply(); } else if(!rq){ addReply(); k=st.length-1; draw(); } };
  el.querySelector(".scD").onclick=()=>{ const seq=sc.seq.slice(); if(reply&&reply.m) seq.push(reply.m.san); drillLine(d,{seq,you:sc.you,s:sc.s!=null?sc.s:0,n:sc.n,k:sc.k,title:sc.title}); };
  draw(); }); }
function practice(d,R){ if(!window.CRStyle||!window.CRBots) return; const src={user:"practice",games:d.games,an:d.an};
  const rs=d.games.filter(g=>g.e).slice(-30), elo=rs.length?Math.round(rs.reduce((s,g)=>s+g.e,0)/rs.length/10)*10:0;
  const av=`<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#37474f"/><text x="32" y="43" font-size="30" text-anchor="middle">🤖</text></svg>`;
  CRBots._startBot({id:"practice-partner",name:"Practice partner",elo,style:"Plays the openings and habits from the report",avatar:av,chat:{start:["Let's play."],capture:["Got one."],check:["Check."],lost:["Good game, you won."],won:["Good game."],draw:["A draw."]},pick:CRStyle.makePicker(src,0)},R.steer?R.steer.you:"w"); }
function drillLine(d,st){ const C=U().CH(), ch=new C(), moves=[]; st.seq.forEach((s,i)=>{ const before=ch.fen(), m=ch.move(s); moves.push([m.san,CROpenings._explain(m,before,ch.fen(),i)]); });
  const id="study-"+d.src+"-"+d.user.toLowerCase()+(st.k&&st.k!=="steer"?"-"+st.k:""), line={id,name:`Beat ${d.user}`+(st.title&&st.k!=="steer"?`: ${st.title.toLowerCase()}`:""),icon:"🔍",side:st.you,sub:st.k&&st.k!=="steer"?`${st.title} (${st.n} games)`:`Their weakest line (they score ${pct(st.s)} in ${st.n} games)`,tags:"study "+d.user,moves};
  const K="chessReview.v52.myLines", L=U().LS.get(K,[]).filter(x=>x.id!==id); L.push(line); U().LS.set(K,L); CROpenings._drill(id); }
window.CRStudy={open,study,report,parsePgn,fromLichess,fromChessCom,load,fetchOwn};
})();
