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
async function getJ(u,site){ const r=await fetch(u,{cache:"no-store"}); if(r.status===404) throw new Error(`No ${site} player with that name.`); if(r.status===429) throw new Error(`${site} is busy right now. Try again in a minute.`); if(!r.ok) throw new Error(`Couldn't reach ${site} (${r.status}).`); return r.json(); }
async function fetchChessCom(user,onP){ if(window.CRHidden&&CRHidden(user)) throw new Error("No Chess.com player with that name."); const a=((await getJ(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`,"Chess.com")).archives||[]).slice().reverse(), out=[];
  for(let i=0;i<a.length&&out.length<MAXG;i++){ onP&&onP(`Chess.com: reading month ${i+1}`,Math.min(.95,out.length/MAXG)); let j; try{ j=await getJ(a[i],"Chess.com"); }catch(e){ if(/busy/.test(e.message)) throw e; continue; }
    (j.games||[]).slice().reverse().forEach(g=>{ if(out.length<MAXG){ const x=fromChessCom(g,user); if(x) out.push(x); } }); }
  return out; }
async function fetchLichess(user,onP){ if(window.CRHidden&&CRHidden(user)) throw new Error("No Lichess player with that name."); onP&&onP("Lichess: downloading games",.3);
  const r=await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=${MAXG}&clocks=true&opening=true&pgnInJson=false`,{headers:{Accept:"application/x-chess-pgn"},cache:"no-store"});
  if(r.status===404) throw new Error("No Lichess player with that name."); if(r.status===429) throw new Error("Lichess is busy right now. Try again in a minute."); if(!r.ok) throw new Error(`Couldn't reach Lichess (${r.status}).`);
  return splitPgn(await r.text()).map(p=>fromLichess(p,user)).filter(Boolean); }
/* ---------- cache ---------- */
const kOf=(user,src)=>PFX+src+"."+user.toLowerCase();
function load(user,src){ if(window.CRHidden&&CRHidden(user)) return null; return U().LS.get(kOf(user,src),null); }
function save(d){ for(let t=0;t<4;t++){ try{ localStorage.setItem(kOf(d.user,d.src),JSON.stringify(d)); return; }catch(e){ if(d.games.length<40) return; d.games.splice(0,Math.ceil(d.games.length/4)); } } }
function remember(user,src){ const r=U().LS.get(KR,[]).filter(x=>!(x.u.toLowerCase()===user.toLowerCase()&&x.s===src)); r.unshift({u:user,s:src}); U().LS.set(KR,r.slice(0,6)); }
async function fetchAll(user,src,onP){ const games=[], notes=[];
  if(src.includes("c")) try{ games.push(...await fetchChessCom(user,onP)); }catch(e){ notes.push(e.message); }
  if(src.includes("l")) try{ games.push(...await fetchLichess(user,onP)); }catch(e){ notes.push(e.message); }
  games.sort((a,b)=>a.t-b.t); return {games,notes}; }
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
function lineCard(seq,gs,total,orient,label){ const nm=mode(gs.map(g=>g.name)), sc=score(gs);
  return `<div class="card" style="display:flex;gap:10px;align-items:center"><div style="width:112px;flex:none">${U().mini(fenAfter(seq),orient)}</div>
   <div style="min-width:0"><b>${E_(label)}</b><div style="font-size:22px;font-weight:800">${pct(gs.length/total)} <small class="mute" style="font-size:13px;font-weight:400">of games (${gs.length})</small></div>
   <div>They score <b style="color:${sc>=.55?"#c62828":sc<=.4?"#2e7d32":"inherit"}">${pct(sc)}</b> here</div>${nm?`<div class="mute">${E_(nm[0])}</div>`:""}<div class="mute" style="font-family:monospace;font-size:12px">${E_(notation(seq))}</div></div></div>`; }
/* ---------- report ---------- */
function report(d){ const gs=d.games, W=gs.filter(g=>g.c==="w"), B=gs.filter(g=>g.c==="b"), n=gs.length;
  const w=gs.filter(g=>g.r===1).length, dr=gs.filter(g=>g.r===.5).length, l=n-w-dr;
  const rat={}; gs.forEach(g=>{ if(g.e) rat[SITE[g.site]+" "+g.tc]=g.e; });
  const R={n,w,dr,l,rat,white:[],vsE4:[],vsD4:[],watch:[],weak:[],tips:[],steer:null};
  group(W,0).slice(0,3).forEach(([mv,g])=>{ if(g.length/W.length<.08) return; const seq=common(g,1,6); R.white.push({seq,g,label:say(mv,"w")}); });
  [["vsE4","e4"],["vsD4","d4"]].forEach(([k,f])=>{ const b=B.filter(g=>g.m[0]===f); if(b.length<2) return; R[k+"N"]=b.length;
    group(b,1).slice(0,2).forEach(([mv,g])=>{ const seq=common(g,2,6); R[k].push({seq,g,total:b.length,label:say(mv,"b")}); }); });
  /* openings by name-ish key: his colour + first 4 plies */
  const op={}; gs.forEach(g=>{ if(g.m.length<4) return; const k=g.c+"|"+g.m.slice(0,4).join(" "); (op[k]=op[k]||[]).push(g); });
  const lines=Object.entries(op).filter(([k,v])=>v.length>=4).map(([k,v])=>({c:k[0],seq:k.slice(2).split(" "),g:v,s:score(v)}));
  const best=lines.slice().sort((a,b)=>b.s-a.s)[0], worst=lines.slice().sort((a,b)=>a.s-b.s)[0];
  if(best&&best.s>=.55){ const nm=mode(best.g.map(g=>g.name)); R.watch.push(`Their best opening: as ${best.c==="w"?"White":"Black"}${nm?" in the "+E_(nm[0]):""} (${E_(notation(best.seq))}). They score <b>${pct(best.s)}</b> in ${best.g.length} games.`); }
  let my=0,chk=0,cap=0; gs.forEach(g=>g.m.forEach((s,i)=>{ if((i%2?"b":"w")!==g.c) return; my++; if(/[+#]/.test(s)) chk++; if(s.includes("x")) cap++; }));
  const mates=gs.filter(g=>g.r===1&&g.how==="mate").length;
  if(my){ if(chk/my>=.07) R.watch.push(`Loves giving check: about 1 move in ${Math.round(my/chk)} is a check.`); if(cap/my>=.2) R.watch.push(`Loves captures: about 1 move in ${Math.round(my/cap)} takes a piece. Count your defenders.`); }
  if(w&&mates/w>=.25) R.watch.push(`Finishes with checkmate in ${pct(mates/w)} of their wins. Keep your king safe.`);
  const tcs=group(gs.map(g=>Object.assign({},g,{m:[g.tc]})),0).filter(([k,v])=>v.length>=5).map(([k,v])=>[k,score(v),v.length]).sort((a,b)=>b[1]-a[1]);
  if(tcs.length>1) R.watch.push(`Strongest at <b>${tcs[0][0]}</b> (${pct(tcs[0][1])} score); weakest at <b>${tcs[tcs.length-1][0]}</b> (${pct(tcs[tcs.length-1][1])}).`);
  /* weak spots */
  const analysed=gs.filter(g=>d.an[g.id]).length; let P=null, worstPh=null;
  if(analysed>=10&&window.CRStyle){ P=CRStyle.profile(d); worstPh=["open","mid","end"].filter(k=>P[k].n>=20).sort((a,b)=>P[b].blun-P[a].blun)[0];
    if(worstPh) R.weak.push(`Blunders most in the <b>${{open:"opening",mid:"middlegame",end:"endgame"}[worstPh]}</b>: about ${pct(P[worstPh].blun)} of their moves there give away 3+ pawns.`); }
  else R.weak.push(`Checking their games for blunders (${analysed} of ${n} done). This part fills in as it goes.`);
  if(worst&&worst.s<=.4) R.weak.push(`Struggles as ${worst.c==="w"?"White":"Black"} after ${E_(notation(worst.seq))}: only <b>${pct(worst.s)}</b> in ${worst.g.length} games.`);
  const losses=gs.filter(g=>g.r===0), tl=losses.filter(g=>g.how==="time").length, rs=losses.filter(g=>g.how==="resign"), ab=losses.filter(g=>g.how==="abandon").length;
  if(losses.length>=5&&tl/losses.length>=.2) R.weak.push(`Runs out of time a lot: ${pct(tl/losses.length)} of their losses are on the clock.`);
  const rl=rs.length?rs.reduce((s,g)=>s+g.m.length/2,0)/rs.length:0;
  if(rs.length>=4&&rl<28) R.weak.push(`Gives up early: when they resign it is after about ${Math.round(rl)} moves on average.`);
  if(ab>=2) R.weak.push(`Sometimes leaves games without finishing (${ab} times).`);
  let tm={m:[0,0],e:[0,0]}; gs.forEach(g=>{ if(g.clk.length<10||g.tc==="daily") return; const C=U().CH(), ch=new C(); let k=0;
    g.m.forEach((s,i)=>{ const mine=(i%2?"b":"w")===g.c; if(mine){ if(k>0&&g.clk[k-1]!=null&&g.clk[k]!=null&&i>=20){ const used=Math.max(0,g.clk[k-1]-g.clk[k]), ph=CRStyle._phase(ch.fen(),i)==="e"?"e":"m"; tm[ph][0]+=used; tm[ph][1]++; } k++; } try{ ch.move(s); }catch(e){} }); });
  const sm=tm.m[1]?tm.m[0]/tm.m[1]:0, se=tm.e[1]?tm.e[0]/tm.e[1]:0;
  if(tm.e[1]>=30&&se>sm*1.3) R.weak.push(`Slows down in endgames: about ${se.toFixed(1)} s a move there, against ${sm.toFixed(1)} s in the middlegame.`);
  /* how to beat them: steer into their worst line, from YOUR side */
  const steer=lines.filter(x=>x.s<=.5).sort((a,b)=>a.s-b.s||b.g.length-a.g.length)[0];
  if(steer){ const seq=common(steer.g,4,10), you=steer.c==="w"?"b":"w"; R.steer={seq,you,s:steer.s,n:steer.g.length};
    R.tips.push(`Steer into their worst line. Play it as ${you==="w"?"White":"Black"}: ${E_(notation(seq.slice(0,6)))}… They score only ${pct(steer.s)} there.`); }
  if(worstPh) R.tips.push({open:"Ask hard questions early: they slip up most in the opening.",mid:"Keep pieces on the board and make threats: their middlegame is shakiest.",end:"Trade pieces and head for an endgame: that's where they go wrong most."}[worstPh]);
  if(losses.length>=5&&tl/losses.length>=.2) R.tips.push("Keep it complicated and use your clock wisely: they often lose on time.");
  else if(rs.length>=4&&rl<28) R.tips.push("Win a pawn or two early and stay solid: they tend to give up.");
  if(R.tips.length<3&&my&&chk/my>=.07) R.tips.push("Before every move, check which checks they have. They love giving check.");
  if(R.tips.length<3) R.tips.push("Develop your knights and bishops, castle early, and don't leave pieces unprotected.");
  R.tips=R.tips.slice(0,3); return R; }
/* ---------- screens ---------- */
function css(){ if($("st52css")) return; const s=document.createElement("style"); s.id="st52css"; s.textContent=`.st52 .seg{display:flex;gap:6px}.st52 .seg .bt{flex:1}.st52 .wdl{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:6px 0}.st52 .wdl i{display:block;height:100%}.st52 ul{margin:4px 0;padding-left:20px}.st52 li{margin:5px 0;line-height:1.4}`; document.head.appendChild(s); }
function open(){ css(); const p=U().show("study52"); p.classList.add("st52"); let src=U().LS.get(KR+".src","c");
  const recent=U().LS.get(KR,[]);
  p.innerHTML=`<h2>🔍 Study your opponent</h2><p class="mute">Type a username. You get a report from their public games: what they play, what to watch out for, and how to beat them.</p>
   <div class="card"><input type="text" id="st52u" placeholder="Their username" autocapitalize="off" autocorrect="off" spellcheck="false">
   <div class="seg" style="margin-top:8px">${[["c","Chess.com"],["l","Lichess"],["cl","Both"]].map(([k,t])=>`<button class="bt ${k===src?"go":""}" data-src="${k}">${t}</button>`).join("")}</div>
   <div class="row"><button class="bt go" id="st52go" style="flex:1">Make the report</button></div><div class="msg no" id="st52m"></div></div>
   ${recent.length?`<h3>Recent</h3>${recent.map(r=>`<button class="lt" data-r="${E_(r.u)}|${r.s}"><span class="i">🔍</span><span><b>${E_(r.u)}</b><small>${r.s.split("").map(x=>SITE[x]).join(" + ")}</small></span></button>`).join("")}`:""}`;
  p.querySelectorAll("[data-src]").forEach(b=>b.onclick=()=>{ src=b.dataset.src; U().LS.set(KR+".src",src); p.querySelectorAll("[data-src]").forEach(x=>x.classList.toggle("go",x===b)); });
  p.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ const [u,s]=b.dataset.r.split("|"); study(u,s); });
  $("st52go").onclick=()=>{ const u=$("st52u").value.trim().replace(/^@/,""); if(!/^[A-Za-z0-9_-]{2,30}$/.test(u)){ $("st52m").textContent="Please type a username (letters, numbers, - or _)."; return; } study(u,src); }; }
async function study(user,src,force){ css(); const p=U().show("study52"); p.classList.add("st52"); let d=load(user,src);
  if(!d||force){ p.innerHTML=`<h2>🔍 ${E_(user)}</h2><div class="card"><b id="st52t">Reading public games…</b><div style="height:10px;background:#eee;border-radius:5px;margin-top:6px;overflow:hidden"><i id="st52f" style="display:block;height:100%;width:5%;background:#d4af37"></i></div></div><div class="row"><button class="bt" id="st52b">‹ Back</button></div>`;
    $("st52b").onclick=open;
    const r=await fetchAll(user,src,(t,f)=>{ $("st52t")&&($("st52t").textContent=t); $("st52f")&&($("st52f").style.width=Math.round(f*100)+"%"); });
    if(!r.games.length){ if($("st52t")) $("st52t").textContent=(r.notes.join(" ")||"No public games found for this player."); return; }
    const old=d; d={user,src,games:r.games,an:{},fetched:Date.now(),notes:r.notes}; if(old) d.games.forEach(g=>{ if(old.an[g.id]) d.an[g.id]=old.an[g.id]; });
    save(d); }
  remember(user,src); paint(d); analyse(d); }
let running=null;
async function analyse(d){ if(running) return; running=d; const todo=d.games.slice().reverse().filter(g=>!d.an[g.id]); let k=0;
  try{ for(const g of todo){ if(!$("st52rep")||$("st52rep").dataset.u!==d.user+d.src) break; try{ d.an[g.id]=await CRStyle.analyseGame(g); }catch(e){ break; } k++;
    const pr=$("st52pr"); if(pr) pr.innerHTML=progBar(d); if(k%10===0||k===todo.length){ save(d); paint(d); } } } finally { save(d); running=null; } }
function progBar(d){ const a=d.games.filter(g=>d.an[g.id]).length, n=d.games.length; return a>=n?"":`<div class="mute">Checking games for mistakes in the background: ${a} of ${n}</div><div style="height:8px;background:#eee;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(100*a/n)}%;background:#d4af37"></i></div>`; }
function paint(d){ const p=U().show("study52"), R=report(d), y=window.scrollY;
  const wdl=`<div class="wdl"><i style="width:${100*R.w/R.n}%;background:#2e7d32"></i><i style="width:${100*R.dr/R.n}%;background:#9e9e9e"></i><i style="width:${100*R.l/R.n}%;background:#c62828"></i></div>`;
  const sec=(t,arr,orient)=>arr.length?`<h3>${t}</h3>`+arr.map(x=>lineCard(x.seq,x.g,x.total||(orient==="w"?d.games.filter(g=>g.c==="w").length:x.total),orient,x.label)).join(""):"";
  p.innerHTML=`<div id="st52rep" data-u="${E_(d.user+d.src)}"><h2>🔍 ${E_(d.user)}</h2>
   <div class="card"><div style="display:flex;flex-wrap:wrap;gap:6px">${Object.entries(R.rat).map(([k,v])=>`<span class="elo" style="font-size:13px">${E_(k)} ${v}</span>`).join("")}</div>
    <div style="margin-top:6px"><b>${R.n} games</b> · won ${pct(R.w/R.n)} · drew ${pct(R.dr/R.n)} · lost ${pct(R.l/R.n)}</div>${wdl}
    <div class="mute">From public games on ${d.src.split("").map(x=>SITE[x]).join(" and ")}. Last updated ${new Date(d.fetched).toLocaleDateString()}.${window.CRECO?" "+CRECO.credit:""}</div>${(d.notes||[]).length?`<div class="no" style="font-size:13px">${E_(d.notes.join(" "))}</div>`:""}<div id="st52pr">${progBar(d)}</div></div>
   ${sec("♔ As White they usually play",R.white,"w")}
   ${R.vsE4.length?sec(`♚ As Black against the king's pawn (1.e4) <small class="mute">${R.vsE4N} games</small>`,R.vsE4,"b"):""}
   ${R.vsD4.length?sec(`♚ As Black against the queen's pawn (1.d4) <small class="mute">${R.vsD4N} games</small>`,R.vsD4,"b"):""}
   ${R.watch.length?`<h3>⚠️ Watch out for</h3><div class="card"><ul>${R.watch.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}
   ${R.weak.length?`<h3>🎯 Their weak spots</h3><div class="card"><ul>${R.weak.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}
   <h3>🏆 How to beat them</h3><div class="card"><ol style="margin:4px 0;padding-left:20px">${R.tips.map(x=>`<li style="margin:6px 0">${x}</li>`).join("")}</ol>
    ${R.steer?`<div style="width:150px;margin:6px auto">${U().mini(fenAfter(R.steer.seq),R.steer.you)}</div><div class="row"><button class="bt go" id="st52dr" style="flex:1">🎯 Drill this line</button></div>`:""}</div>
   <div class="row"><button class="bt" id="st52rf">🔄 Refresh games</button><button class="bt" id="st52bk">‹ Study someone else</button></div>
   ${d.src.includes("c")&&window.CRStyle?`<p style="text-align:center;margin-top:14px"><a href="#" id="st52ps" class="mute" style="font-size:13px">Play their style (optional)</a></p>`:""}</div>`;
  window.scrollTo(0,y);
  $("st52rf").onclick=()=>study(d.user,d.src,true); $("st52bk").onclick=open;
  if($("st52dr")) $("st52dr").onclick=()=>drillLine(d,R.steer);
  if($("st52ps")) $("st52ps").onclick=e=>{ e.preventDefault(); if(CRStyle.load(d.user)) CRStyle.open(d.user); else CRStyle.addUser(d.user); }; }
function drillLine(d,st){ const C=U().CH(), ch=new C(), moves=[]; st.seq.forEach((s,i)=>{ const before=ch.fen(), m=ch.move(s); moves.push([m.san,CROpenings._explain(m,before,ch.fen(),i)]); });
  const id="study-"+d.src+"-"+d.user.toLowerCase(), line={id,name:`Beat ${d.user}`,icon:"🔍",side:st.you,sub:`Their weakest line (they score ${pct(st.s)})`,tags:"study "+d.user,moves};
  const K="chessReview.v52.myLines", L=U().LS.get(K,[]).filter(x=>x.id!==id); L.push(line); U().LS.set(K,L); CROpenings._drill(id); }
window.CRStudy={open,study,report,parsePgn,fromLichess,fromChessCom,load};
})();
