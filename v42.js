/* v42: bot levels + clock, XP/levels/badges, board colours, puzzle of the day, charts, auto-replay, coach questions. Own file; no servers. */
(function(){
"use strict"; if(window.V42) return;
const $=id=>document.getElementById(id), B=document.body;
const LS={get:(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } },set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CH=()=>window.ChessLib.Chess;
const K={lv:"chessReview.v42.botLevel",clk:"chessReview.v42.botClock",wins:"chessReview.v42.botWins",theme:"chessReview.v42.theme",pod:"chessReview.v42.pod",spd:"chessReview.v42.replaySpeed"};
const today=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
function toast(t){ let e=$("v42toast"); if(!e){ e=document.createElement("div"); e.id="v42toast"; B.appendChild(e); } e.textContent=t; e.classList.add("on"); clearTimeout(e._t); e._t=setTimeout(()=>e.classList.remove("on"),2200); }

/* ---------- CSS ---------- */
const CSS=`
body.hs-app #hs{display:none!important}
#v42{display:none;padding:4px 0 90px}#v42.on{display:block}
body.hs-home #v42{display:none!important}
#v42 h2{font-size:22px;margin:6px 0 4px}#v42 .sub{color:var(--mute);font-size:14px;margin:0 0 12px;line-height:1.4}
#v42 .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;margin:0 0 12px}
#v42 .top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.v42b{min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;font:inherit;font-weight:700;padding:0 14px;cursor:pointer;color:var(--ink)}
.v42b.pri{background:#2f7d32;color:#fff;border:none}.v42b.full{width:100%;margin:6px 0}
.v42lvl{display:flex;align-items:center;gap:12px}.v42lvl .big{font-size:44px}.v42bar{height:14px;border-radius:8px;background:#eee;overflow:hidden;margin:8px 0 4px}.v42bar i{display:block;height:100%;background:linear-gradient(90deg,#2f7d32,#3b6fb6)}
.v42badges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v42badges div{border:1px solid var(--line);border-radius:12px;padding:8px 4px;text-align:center;font-size:12px;line-height:1.25}.v42badges div b{display:block;font-size:26px}.v42badges div.off{opacity:.35;filter:grayscale(1)}
.v42th{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v42th button{border:2px solid var(--line);border-radius:12px;background:#fff;padding:6px;font:inherit;font-size:12px;cursor:pointer;color:var(--ink)}.v42th button.on{border-color:#2f7d32;box-shadow:0 0 0 2px #2f7d3255}.v42th button[disabled]{opacity:.45}
.v42th svg{width:100%;display:block;border-radius:6px;margin-bottom:4px}
.v42chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.v42chips button{min-height:40px;border-radius:20px;border:1px solid var(--line);background:#fff;font:inherit;font-size:13.5px;padding:0 12px;cursor:pointer;color:var(--ink)}.v42chips button.on{background:#262421;color:#fff;border-color:#262421}
.v42opt{border:1px solid var(--line);border-radius:14px;padding:8px 10px;margin:8px 0;background:#fff}.v42opt h5{margin:2px 0;font-size:13.5px}
.v42clock{display:flex;gap:8px;margin:8px 0}.v42clock div{flex:1;border-radius:12px;background:#eee;padding:8px;text-align:center;font-size:13px}.v42clock div b{display:block;font-size:24px;font-variant-numeric:tabular-nums}.v42clock div.run{background:#2f7d32;color:#fff}.v42clock div.low b{color:#c62828}.v42clock div.run.low b{color:#fff}
.v42q{border:1px solid var(--line);border-radius:14px;padding:8px 10px;margin:8px 0;background:#fffbe9}.v42q h5{margin:2px 0 4px;font-size:14px}.v42q .v42chips button{background:#fff}.v42ans{font-size:14px;line-height:1.45}.v42ans p{margin:6px 0}
#v42rp{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0}#v42rp button{min-height:40px;border-radius:20px;border:1px solid var(--line);background:#fff;font:inherit;font-size:13.5px;padding:0 12px;cursor:pointer}#v42rp button.on{background:#262421;color:#fff}
#v42rq{margin:6px 0}
.v42chart svg{width:100%;height:auto;display:block}.v42chart .lg{font-size:12px;color:var(--mute)}
#v42toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#262421;color:#fff;padding:10px 16px;border-radius:20px;font-size:14px;opacity:0;transition:opacity .2s;z-index:99;pointer-events:none}#v42toast.on{opacity:1}
html.dark-mode #v42 .card,html.dark-mode .v42b,html.dark-mode .v42th button,html.dark-mode .v42chips button,html.dark-mode .v42opt{background:#262626;color:#eee;border-color:#3a3a3a}html.dark-mode .v42q{background:#2b2a22}`;

/* ---------- 3. board colours ---------- */
const THEMES=[["classic","Classic","#f0d9b5","#b58863",1],["green","Green","#eeeed2","#769656",1],["blue","Ocean","#dee3e6","#8ca2ad",2],["purple","Purple","#e8e0f0","#9a7fb8",3],
 ["walnut","Walnut","#e6c9a0","#7d5236",4],["coral","Coral","#f4e3d7","#d18b70",5],["ice","Ice","#eaf3f8","#7fa6c1",6],["night","Night","#c9c9c9","#4b5563",7],["gold","Gold","#f6e7b0","#b8892b",8]];
function applyTheme(){ const id=LS.get(K.theme,"classic"), t=THEMES.find(x=>x[0]===id)||THEMES[0]; let st=$("v42theme"); if(!st){ st=document.createElement("style"); st.id="v42theme"; document.head.appendChild(st); }
  st.textContent=t[0]==="classic"?"":`[fill="#f0d9b5" i]{fill:${t[2]}!important}[fill="#b58863" i]{fill:${t[3]}!important}:root{--light:${t[2]};--dark:${t[3]}}`; }
const miniSvg=(l,d)=>{ let r=""; for(let y=0;y<4;y++) for(let x=0;x<4;x++) r+=`<rect x="${x*10}" y="${y*10}" width="10" height="10" style="fill:${(x+y)%2?d:l}"/>`; return `<svg viewBox="0 0 40 40">${r}</svg>`; };

/* ---------- 2. XP, levels, badges ---------- */
const LVL=[[0,"Pawn","♙"],[100,"Knight","♘"],[250,"Bishop","♗"],[450,"Rook","♖"],[700,"Queen","♕"],[1000,"King","♔"],[1400,"Club player","🏅"],[1900,"Expert","🎖"],[2500,"Master","🏆"],[3200,"Grandmaster","👑"]];
function stats(){ const D=LS.get("chessReview.daily.v1",{days:{}}).days||{}; let acts=0, puz=0; const act=[];
  Object.keys(D).forEach(d=>{ let n=0; Object.entries(D[d]||{}).forEach(([k,v])=>{ v=+v||0; n+=v; if(k==="puz") puz+=v; }); acts+=n; if(n>0) act.push(d); });
  const lrn=LS.get("chessReview.learn.v1",{}); const learn=Object.values(lrn).filter(x=>x&&x.quiz).length;
  let games=0; try{ games=Object.keys(window.PatternStore?PatternStore.all():{}).length; }catch(e){} try{ games=Math.max(games,ReviewApp.loadGames().length); }catch(e){}
  const lp=LS.get("chessReview.lpz.v1",{r:800,th:{},seen:{}}); puz=Math.max(puz,Object.keys(lp.seen||{}).length);
  const wins=LS.get(K.wins,[]); const pod=LS.get(K.pod,{});
  act.sort(); let best=0, run=0, prev=null; act.forEach(d=>{ const t=new Date(d+"T12:00:00"); run=prev&&(t-prev)<36*3600e3?run+1:1; prev=t; best=Math.max(best,run); });
  const xp=10*acts+50*learn+25*games+15*act.length+40*wins.reduce((a,w)=>a+(w.lv||1),0)+30*Object.keys(pod).length;
  let li=0; LVL.forEach((l,i)=>{ if(xp>=l[0]) li=i; });
  return {xp,acts,puz,learn,games,days:act.length,best,wins,lp,pod,lvl:li+1,cur:LVL[li],next:LVL[li+1]||null}; }
const BADGES=[["🧩","First puzzle",s=>s.puz>=1],["🧠","50 puzzles",s=>s.puz>=50],["🔥","3-day streak",s=>s.best>=3],["☄️","7-day streak",s=>s.best>=7],
 ["📘","Rules master",s=>s.learn>=8],["📋","First review",s=>s.games>=1],["📚","10 games reviewed",s=>s.games>=10],["🤖","Beat the bot",s=>s.wins.length>=1],
 ["🦾","Beat bot level 4",s=>s.wins.some(w=>w.lv>=4)],["♛","Mate in 3 solved",s=>!!(s.lp.th&&s.lp.th.mateIn3&&s.lp.th.mateIn3.ok)],["📅","3 daily puzzles",s=>Object.keys(s.pod).length>=3],["🎯","Puzzle rating 1000",s=>(s.lp.r||0)>=1000]];

/* ---------- panel ---------- */
function panel(html){ let d=$("v42"); if(!d){ d=document.createElement("div"); d.id="v42"; const w=document.querySelector(".wrap"); w.appendChild(d); }
  try{ window.Trainer&&Trainer.close(); }catch(e){} try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.Coach17&&Coach17.hide&&Coach17.hide(); }catch(e){}
  if(window.CRHome) CRHome.setMode("app",true); d.innerHTML=`<div class="top"><button class="v42b" data-v42home>🏠 Home</button></div>`+html; d.classList.add("on");
  d.querySelector("[data-v42home]").onclick=()=>{ closePanel(); window.CRHome&&CRHome.goHome(); }; window.scrollTo(0,0); return d; }
function closePanel(){ const d=$("v42"); if(d) d.classList.remove("on"); }

function openXP(){ const s=stats(), cur=s.cur, nx=s.next, pct=nx?Math.round(100*(s.xp-cur[0])/(nx[0]-cur[0])):100;
  const d=panel(`<h2>🏅 My level & badges</h2><p class="sub">You earn XP for everything you do in the app: puzzles, drills, lessons, reviews and wins against the bot.</p>
   <div class="card"><div class="v42lvl"><span class="big">${cur[2]}</span><div style="flex:1"><b style="font-size:19px">Level ${s.lvl}: ${cur[1]}</b><div class="v42bar"><i style="width:${pct}%"></i></div><small>${s.xp} XP${nx?` · ${nx[0]-s.xp} XP to level ${s.lvl+1} (${nx[1]})`:" · top level!"}</small></div></div></div>
   <div class="card"><h3 style="margin:0 0 8px">Badges (${BADGES.filter(b=>b[2](s)).length} of ${BADGES.length})</h3><div class="v42badges">${BADGES.map(b=>`<div class="${b[2](s)?"":"off"}"><b>${b[0]}</b>${b[1]}</div>`).join("")}</div></div>
   <div class="card"><h3 style="margin:0 0 4px">🎨 Board colours</h3><p class="sub" style="margin-bottom:8px">Reach a new level to unlock more colours. Colours show on the Flat and Standing board styles (Settings). Real 3D keeps its wooden board.</p><div class="v42th" id="v42th"></div></div>
   <div class="card"><h3 style="margin:0 0 6px">How to earn XP</h3><p class="sub" style="margin:0">• 10 XP for each puzzle, drill or check you do<br>• 50 XP for each Learn the basics topic<br>• 25 XP for each game you review<br>• 15 XP for each day you train<br>• 30 XP for each puzzle of the day<br>• 40 XP × bot level when you beat the bot</p></div>`);
  const paintTh=()=>{ const sel=LS.get(K.theme,"classic"); $("v42th").innerHTML=THEMES.map(t=>{ const ok=s.lvl>=t[4]; return `<button data-t="${t[0]}" class="${t[0]===sel?"on":""}" ${ok?"":"disabled"}>${miniSvg(t[2],t[3])}${ok?E_(t[1]):"🔒 Level "+t[4]}</button>`; }).join("");
    $("v42th").querySelectorAll("button:not([disabled])").forEach(b=>b.onclick=()=>{ LS.set(K.theme,b.dataset.t); applyTheme(); paintTh(); toast("Board colours changed."); }); };
  paintTh(); }

/* ---------- 4. puzzle of the day + mate sets ---------- */
let _PZ=null; function pz(){ if(!_PZ) _PZ=(window.LPUZ||"").split("\n").filter(Boolean).map(l=>{ const [id,fen,mv,r,b]=l.split(","); return {id,fen,mv:mv.split(" "),r:+r,b:+b}; }); return _PZ; }
function hash(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function podPuzzle(){ const pool=pz().filter(p=>p.r>=500&&p.r<=1300); return pool.length?pool[hash("pod"+today())%pool.length]:null; }
const themeOf=p=>{ for(let k=0;k<13;k++) if(p.b&(1<<k)) return k; return 0; };
function podState(){ const p=podPuzzle(); if(!p) return null; const lp=LS.get("chessReview.lpz.v1",{seen:{}}); const v=(lp.seen||{})[p.id]; if(v===1){ const P=LS.get(K.pod,{}); if(!P[today()]){ P[today()]=p.id; LS.set(K.pod,P); } } return {p,v}; }
function openPuzzles(){ const s=podState(); const m2=pz().filter(p=>p.b&(1<<5)).length, m3=pz().filter(p=>p.b&(1<<12)).length;
  const d=panel(`<h2>📅 Puzzle of the day</h2><p class="sub">One new puzzle every day, the same for everyone using the app. Puzzles come from real games on Lichess (rated 500–1300).</p>
   <div class="card"><b>Today (${today()})</b><p class="sub" style="margin:4px 0 8px">${s?(s.v===1?"✅ You solved today's puzzle. Come back tomorrow for a new one!":s.v===-1?"You tried today's puzzle. Try it again!":"Not done yet. You get 30 XP for solving it."):"No puzzle found."}</p>${s?`<button class="v42b pri full" id="v42pod">🧩 ${s.v===1?"Play it again":"Solve today's puzzle"}</button>`:""}<p class="sub" style="margin:6px 0 0">Days solved: <b>${Object.keys(LS.get(K.pod,{})).length}</b></p></div>
   <div class="card"><h3 style="margin:0 0 6px">♛ Checkmate sets</h3><p class="sub" style="margin:0 0 6px">Practise finding mate. Each set gives you puzzles near your puzzle rating.</p>
   <button class="v42b full" data-k="4">♛ Mate in 1</button><button class="v42b full" data-k="5">♛♛ Mate in 2 (${m2} puzzles)</button><button class="v42b full" data-k="12">♛♛♛ Mate in 3 (${m3} puzzles)</button></div>
   <p class="sub">Lichess puzzle database (CC0), database.lichess.org.</p>`);
  const go=(k,p)=>{ closePanel(); if(window.CRHome) CRHome.setMode("app",true); Trainer.open("lthemes",p?{k,p}:{k}); };
  if(s) $("v42pod").onclick=()=>go(themeOf(s.p),s.p); d.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>go(+b.dataset.k)); }

/* ---------- 5. charts ---------- */
const tcClass=tc=>{ tc=String(tc||""); if(tc.includes("/")) return "daily"; const b=+tc.split("+")[0]; if(!b) return "other"; return b<180?"bullet":b<600?"blitz":"rapid"; };
const TCN={rapid:"⏱ Rapid",blitz:"⚡ Blitz",bullet:"🔫 Bullet",daily:"📅 Daily",other:"Other"};
function lineChart(vals,o){ const W=340,H=150,pl=34,pr=8,pt=10,pb=18; const ok=vals.filter(v=>v!=null); if(ok.length<2) return `<p class="sub">Not enough games yet (need 2 or more).</p>`;
  let mn=Math.min(...ok), mx=Math.max(...ok); if(o.min!=null) mn=Math.min(mn,o.min); if(o.max!=null) mx=Math.max(mx,o.max); if(mx-mn<10){ mn-=5; mx+=5; }
  const X=i=>pl+(W-pl-pr)*(vals.length<2?0:i/(vals.length-1)), Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  const path=a=>a.map((v,i)=>v==null?null:`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).filter(Boolean).join(" ");
  const grid=[mn,(mn+mx)/2,mx].map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ddd"/><text x="${pl-4}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="#888">${Math.round(v)}</text>`).join("");
  const dots=vals.map((v,i)=>v==null?"":`<circle cx="${X(i)}" cy="${Y(v)}" r="2.6" fill="${o.c}"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}">${grid}<polyline points="${path(vals)}" fill="none" stroke="${o.c}" stroke-width="${o.avg?1.2:2.2}" opacity="${o.avg?.55:1}"/>${o.avg?`<polyline points="${path(o.avg)}" fill="none" stroke="#2f7d32" stroke-width="2.6"/>`:""}${dots}<text x="${pl}" y="${H-4}" font-size="10" fill="#888">older</text><text x="${W-pr}" y="${H-4}" font-size="10" fill="#888" text-anchor="end">newest</text></svg>`; }
function games(){ let m={}; try{ m=PatternStore.all(); }catch(e){} return Object.values(m).filter(r=>r&&r.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))); }
function openCharts(sel){ const G=games(); const cls={}; G.forEach(g=>{ const c=tcClass(g.tc); cls[c]=(cls[c]||0)+1; });
  const order=Object.keys(cls).sort((a,b)=>cls[b]-cls[a]); sel=sel&&cls[sel]?sel:order[0]; const L=G.filter(g=>tcClass(g.tc)===sel);
  const el=L.map(g=>g.myElo||null), ac=L.map(g=>g.acc==null?null:Math.round(g.acc)); const avg=ac.map((v,i)=>{ const w=ac.slice(Math.max(0,i-4),i+1).filter(x=>x!=null); return w.length?w.reduce((a,b)=>a+b,0)/w.length:null; });
  const eF=el.filter(Boolean), aF=ac.filter(x=>x!=null); const mean=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):null;
  const eTxt=eF.length>=2?`From <b>${eF[0]}</b> to <b>${eF[eF.length-1]}</b> (${eF[eF.length-1]-eF[0]>=0?"+":""}${eF[eF.length-1]-eF[0]}) over ${eF.length} games.`:"";
  const r5=mean(aF.slice(-5)), e5=mean(aF.slice(0,-5)); const aTxt=aF.length>=2?`Your last 5 games: <b>${r5}%</b>${e5!=null?` · the games before: <b>${e5}%</b> ${r5>e5?"📈 getting better!":r5<e5?"📉 a bit lower lately.":""}`:""}`:"";
  const d=panel(`<h2>📈 My charts</h2><p class="sub">Made from the games you've reviewed (${G.length}). Review more games to fill them in.</p>
   ${G.length?`<div class="v42chips" id="v42tc">${order.map(c=>`<button data-c="${c}" class="${c===sel?"on":""}">${TCN[c]} (${cls[c]})</button>`).join("")}</div>
   <div class="card v42chart"><h3 style="margin:0 0 4px">Rating history</h3><p class="sub" style="margin:0 0 6px">${eTxt||"Your rating from each game."}</p>${lineChart(el,{c:"#3b6fb6"})}</div>
   <div class="card v42chart"><h3 style="margin:0 0 4px">Accuracy trend</h3><p class="sub" style="margin:0 0 6px">${aTxt||"How accurate your moves were in each game."}</p>${lineChart(ac,{c:"#999",avg,min:0,max:100})}<p class="lg">Grey: each game · Green: average of your last 5 games</p></div>`
   :`<div class="card"><p>No reviewed games yet.</p><p class="sub">Go to <b>My Coach</b> or <b>Review a game</b> and review a few games. Then come back to see your charts.</p></div>`}`);
  d.querySelectorAll("#v42tc [data-c]").forEach(b=>b.onclick=()=>openCharts(b.dataset.c)); }

/* ---------- 8. coach questions (built-in engine) ---------- */
async function engine(){ if(!window.ReviewApp) throw new Error("no engine"); if(window.CRBusy) return CRBusy.engine(); if(ReviewApp.isRunning&&ReviewApp.isRunning()) throw new Error("busy"); return ReviewApp.getEngine(); }
const sv=sc=>!sc?0:sc.mate!=null?(sc.mate>0?10000-sc.mate*10:-10000-sc.mate*10):sc.cp;
const PNm={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
function sanOf(fen,u){ try{ const c=new (CH())(fen); return c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}).san; }catch(e){ return u; } }
function moveObj(fen,u){ try{ const c=new (CH())(fen); return c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); }catch(e){ return null; } }
function pawnsTxt(cp){ const n=Math.round(cp/100); return n<=1?"about 1 pawn":n>=9?"about a queen":n>=5?`about ${n} pawns (like a rook)`:n>=3?`about ${n} pawns (like a knight or bishop)`:`about ${n} pawns`; }
function scoreWords(sc){ if(sc&&sc.mate!=null) return sc.mate>0?`It leads to checkmate in ${sc.mate}!`:`Careful: the other side can mate in ${-sc.mate}.`; const v=sv(sc);
  return v>300?"The side to move is winning.":v>120?"The side to move is clearly better.":v>40?"The side to move is a little better.":v>-40?"The game is about equal.":v>-120?"The side to move is a little worse.":"The side to move is in trouble."; }
const capTxt=(mo,mine)=>mo&&mo.captured?` It takes ${mine?"your":"their"} ${PNm[mo.captured]} on ${mo.to}.`:mo&&/#/.test(mo.san)?" That's checkmate.":mo&&/\+/.test(mo.san)?" It gives check.":"";
async function qBest(fen){ const E=await engine(); const i=await E.analyse(fen,12,900,1); const u=i.bm||i.pv[0]; if(!u) return {html:"<p>There are no legal moves here: the game is over.</p>"};
  return {html:`<p>💡 Best move: <b>${E_(sanOf(fen,u))}</b> (green arrow).</p><p>${scoreWords(i.score)}</p>`,fen,arrows:[{u:u.slice(0,4),c:"green"}]}; }
async function qWhy(fenBefore,u,mine){ const E=await engine(); const a=await E.analyse(fenBefore,12,900,1); const best=a.bm||a.pv[0]; const mo=moveObj(fenBefore,u); if(!mo) return {html:"<p>I couldn't read that move.</p>"};
  const c=new (CH())(fenBefore); c.move(mo); if(c.isCheckmate()) return {html:`<p>✅ <b>${E_(mo.san)}</b> is checkmate. Perfect!</p>`};
  const b=await E.analyse(c.fen(),12,900,1); const loss=sv(a.score)-(-sv(b.score)); const rep=b.bm||b.pv[0]; const rmo=rep?moveObj(c.fen(),rep):null; const who=mine?"You":"They";
  if(best&&best.slice(0,4)===u.slice(0,4)||loss<60) return {html:`<p>✅ <b>${E_(mo.san)}</b> was a good move. Nothing wrong with it.</p>${best&&best.slice(0,4)!==u.slice(0,4)?`<p>Another good idea was <b>${E_(sanOf(fenBefore,best))}</b>.</p>`:""}`,fen:fenBefore,arrows:[{u:u.slice(0,4),c:"green"}]};
  const mateTxt=b.score&&b.score.mate!=null&&b.score.mate>0?`it lets the other side checkmate in ${b.score.mate}`:`it lost ${pawnsTxt(Math.min(loss,2000))}`;
  return {html:`<p>❌ <b>${E_(mo.san)}</b> was a mistake: ${mateTxt}.</p><p>After it, the other side can play <b>${E_(rmo?rmo.san:rep)}</b>.${capTxt(rmo,mine)}</p><p>Better was <b>${E_(sanOf(fenBefore,best))}</b> (green arrow). Red arrow: the move ${who.toLowerCase()==="you"?"you":"they"} played.</p>`,
    fen:fenBefore,arrows:[{u:u.slice(0,4),c:"red"},{u:best.slice(0,4),c:"green"}]}; }
async function qThreat(fen){ const c=new (CH())(fen); if(c.isGameOver()) return {html:"<p>The game is over.</p>"}; if(c.inCheck()) return {html:"<p>⚠ You're in check right now! The threat is on your king: first get out of check.</p>"};
  const f=fen.split(" "); f[1]=f[1]==="w"?"b":"w"; f[3]="-"; const nf=f.join(" "); let n; try{ n=new (CH())(nf); }catch(e){ return {html:"<p>I can't check threats in this position.</p>"}; } if(!n.moves().length) return {html:"<p>👍 No threat: the other side has no moves at all.</p>"};
  const E=await engine(); const now=await E.analyse(fen,11,700,1), th=await E.analyse(nf,11,700,1); const u=th.bm||th.pv[0]; const mo=moveObj(nf,u); const big=(th.score&&th.score.mate!=null&&th.score.mate>0)?"mate":(sv(th.score)+sv(now.score));
  if(big==="mate") return {html:`<p>🚨 They threaten <b>checkmate</b>, starting with <b>${E_(mo?mo.san:u)}</b> (red arrow)! Stop it now.</p>`,fen,arrows:[{u:u.slice(0,4),c:"red"}]};
  if(big>=150) return {html:`<p>⚠ Threat: if you don't do anything, they play <b>${E_(mo?mo.san:u)}</b> (red arrow).${capTxt(mo,true)}</p><p>That would cost you ${pawnsTxt(big)}. Protect, move away, or make a bigger threat.</p>`,fen,arrows:[{u:u.slice(0,4),c:"red"}]};
  return {html:`<p>👍 No big threat right now. Their best idea would be <b>${E_(mo?mo.san:u)}</b> (red arrow), but it isn't dangerous.</p><p>So you're free to make your own plan.</p>`,fen,arrows:[{u:u.slice(0,4),c:"red"}]}; }
function qBox(id){ return `<div class="v42q" id="${id}"><h5>🙋 Ask the coach</h5><div class="v42chips"><button data-q="best">💡 Best move?</button><button data-q="why">❓ Why is this bad?</button><button data-q="threat">⚠ Show the threat</button></div><div class="v42ans"></div></div>`; }
async function runQ(box,fn){ const a=box.querySelector(".v42ans"); a.innerHTML="<p>🤔 Thinking…</p>"; try{ const r=await fn(); a.innerHTML=r.html; return r; }catch(e){ a.innerHTML=`<p>${/busy/.test(e.message)?"The engine is busy reviewing games. Try again when that's done.":"Sorry, the coach couldn't answer that. Try again."}</p>`; return null; } }

/* ---------- 1 + 6 + 2 + 8 inside "Play the computer" ---------- */
const LEVELS=[{n:"Starter",e:"about 200",sk:0,d:1,ms:50,rnd:.45},null,{n:"Improver",e:"about 700",sk:3,d:5,ms:250,rnd:.06},{n:"Club",e:"about 1000",sk:8,d:8,ms:400,rnd:0},{n:"Strong",e:"about 1400",sk:15,d:12,ms:700,rnd:0}];
const LVN=["Starter","Beginner","Improver","Club","Strong"], LVE=["about 200","about 400","about 700","about 1000","about 1400"];
function level(){ const l=LS.get(K.lv,2); return LEVELS[l-1]||null; }
const fmt=s=>{ s=Math.max(0,s); const m=Math.floor(s/60), r=s-m*60; return s<20?`${m}:${r.toFixed(1).padStart(4,"0")}`:`${m}:${String(Math.floor(r)).padStart(2,"0")}`; };
function attachPlay(o){ const {g,me,st,arg}=o; const box=$("v42clk"); if(!box) return;
  const showLv=!arg.strong, showClk=!arg.castle; const t0=st.tap; st.tap=sq=>{ if(st.flag) return; t0&&t0(sq); };
  let ck=null;
  const resetClock=()=>{ const m=LS.get(K.clk,0); ck=m?{w:m*60,b:m*60,last:performance.now()}:null; };
  const paint=()=>{ const lv=LS.get(K.lv,2), m=LS.get(K.clk,0);
    box.innerHTML=`<div class="v42opt">${showLv?`<h5>🤖 Bot level: ${LVN[lv-1]} (${LVE[lv-1]})</h5><div class="v42chips" id="v42lv">${LVN.map((n,i)=>`<button data-l="${i+1}" class="${i+1===lv?"on":""}">${i+1}. ${n}</button>`).join("")}</div>`:""}
     ${showClk?`<h5>⏱ Clock</h5><div class="v42chips" id="v42ck">${[0,5,10,15].map(x=>`<button data-m="${x}" class="${x===m?"on":""}">${x?x+" min":"No clock"}</button>`).join("")}</div><div class="v42clock" id="v42cd" ${m?"":"hidden"}></div>`:""}</div>`;
    box.querySelectorAll("#v42lv [data-l]").forEach(b=>b.onclick=()=>{ LS.set(K.lv,+b.dataset.l); paint(); toast(`Bot level ${b.dataset.l}: ${LVN[+b.dataset.l-1]}`); });
    box.querySelectorAll("#v42ck [data-m]").forEach(b=>b.onclick=()=>{ LS.set(K.clk,+b.dataset.m); st.flag=null; resetClock(); paint(); });
    const sb=document.querySelector("#trBody .trsub"); if(sb&&/^You vs/.test(sb.textContent)) sb.textContent=sb.textContent.replace(/^You vs [^.]*\./,`You vs the bot, level ${lv}: ${LVN[lv-1]} (${LVE[lv-1]}).`);
    tick(true); };
  const tick=force=>{ const cd=$("v42cd"); if(!cd||!ck){ return; } const now=performance.now(), dt=(now-ck.last)/1000; ck.last=now;
    const run=g.history().length>0&&!g.isGameOver()&&!st.flag; if(run){ const t=g.turn(); ck[t]-=dt; if(ck[t]<=0){ ck[t]=0; st.flag=t; const msg=t===me?"⏱ Time's up! The bot wins on time. Tap Reset to play again.":"⏱ The bot ran out of time. You win! 🏆"; const m=$("trMsg"); if(m) m.innerHTML=msg; toast(msg); if(t!==me) win(); } }
    const opp=me==="w"?"b":"w"; const cell=(c,lab)=>`<div class="${run&&g.turn()===c?"run":""} ${ck[c]<30?"low":""}">${lab}<b>${fmt(ck[c])}</b></div>`;
    cd.innerHTML=cell(opp,"🤖 Bot")+cell(me,"🙂 You"); };
  let won=false; const win=()=>{ if(won) return; won=true; const lv=arg.strong?5:LS.get(K.lv,2); const W=LS.get(K.wins,[]); W.push({lv,d:today()}); LS.set(K.wins,W.slice(-200)); toast(`🏆 You beat bot level ${lv}! +${40*lv} XP`); };
  resetClock(); paint();
  const iv=setInterval(()=>{ if(!document.body.contains(box)){ clearInterval(iv); return; } tick(); if(!won&&g.isCheckmate()&&g.turn()!==me) win(); },200);
  // coach questions
  const pm=$("plMoves"); if(pm&&!$("v42pq")){ pm.insertAdjacentHTML("afterend",qBox("v42pq"));
    const q=$("v42pq"); q.querySelectorAll("[data-q]").forEach(b=>b.onclick=async()=>{ if(st.thinking){ toast("Wait for the bot to move."); return; } const k=b.dataset.q; let fn;
      if(k==="best") fn=()=>qBest(g.fen());
      else if(k==="threat") fn=()=>qThreat(g.fen());
      else { const h=g.history({verbose:true}); let i=h.length-1; while(i>=0&&h[i].color!==me) i--; if(i<0){ q.querySelector(".v42ans").innerHTML="<p>You haven't made a move yet.</p>"; return; }
        const c=new (CH())(st.start); for(let j=0;j<i;j++) c.move(h[j]); const fb=c.fen(), u=h[i].from+h[i].to+(h[i].promotion||""); fn=()=>qWhy(fb,u,true); }
      const r=await runQ(q,fn); if(r&&r.fen&&r.arrows){ o.board.draw(r.fen,{arrows:r.arrows}); if(r.fen!==g.fen()) q.querySelector(".v42ans").insertAdjacentHTML("beforeend",`<p><button class="v42b" id="v42back">↩ Back to the game</button></p>`); const bk=$("v42back"); if(bk) bk.onclick=()=>{ o.draw(); bk.remove(); }; } }); }
}

/* ---------- 7. review: auto-replay + questions ---------- */
let RP=null;
function plies(){ try{ return DATA.plies; }catch(e){ return []; } }
function curIdx(){ try{ return cur; }catch(e){ return 0; } }
function stopRP(){ if(RP){ clearInterval(RP); RP=null; } const b=$("v42play"); if(b){ b.textContent="▶ Auto-play"; b.classList.remove("on"); } }
function startRP(){ stopRP(); const sp=LS.get(K.spd,1200); if(curIdx()>=plies().length) go(0); RP=setInterval(()=>{ if(curIdx()>=plies().length){ stopRP(); return; } go(curIdx()+1); },sp); const b=$("v42play"); b.textContent="⏸ Pause"; b.classList.add("on"); }
function reviewBits(){ const c=document.querySelector("section.main .controls"); if(!c||$("v42rp")) return;
  const SP=[[2200,"🐢 Slow"],[1200,"Normal"],[600,"🐇 Fast"]];
  c.insertAdjacentHTML("afterend",`<div id="v42rp"><button id="v42play">▶ Auto-play</button>${SP.map(s=>`<button data-sp="${s[0]}" class="${LS.get(K.spd,1200)===s[0]?"on":""}">${s[1]}</button>`).join("")}</div>${qBox("v42rq")}`);
  $("v42play").onclick=()=>RP?stopRP():startRP();
  $("v42rp").querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>{ LS.set(K.spd,+b.dataset.sp); $("v42rp").querySelectorAll("[data-sp]").forEach(x=>x.classList.toggle("on",x===b)); if(RP) startRP(); });
  ["bFirst","bPrev","bNext","bLast"].forEach(id=>{ const e=$(id); if(e) e.addEventListener("click",()=>{ if(RP) stopRP(); }); });
  const q=$("v42rq"); q.querySelectorAll("[data-q]").forEach(b=>b.onclick=async()=>{ stopRP(); const P=plies(), i=curIdx(); const fen=i===0?DATA.start_fen:P[i-1].fen; const k=b.dataset.q;
    if(k==="why"&&i===0){ q.querySelector(".v42ans").innerHTML="<p>Go to a move first (tap ▶), then ask.</p>"; return; }
    const r=await runQ(q,k==="best"?()=>qBest(fen):k==="threat"?()=>qThreat(fen):()=>qWhy(P[i-1].fen_before,P[i-1].uci,P[i-1].color===(DATA.meta.user_color||"w")));
    if(r) q.querySelector(".v42ans").insertAdjacentHTML("afterbegin",`<p class="sub" style="margin:0;color:var(--mute);font-size:12.5px">${k==="why"?"About the move "+E_(P[i-1].label):"Position "+(i===0?"at the start":"after "+E_(P[i-1].label))}</p>`); });
  const mo=new MutationObserver(()=>{ const a=q.querySelector(".v42ans"); if(a&&a.innerHTML&&a.dataset.at!=String(curIdx())){ } }); }

/* ---------- home tiles ---------- */
const TILES=[["v42pod","📅","Puzzle of the day",()=>{ const s=podState(); return s&&s.v===1?"✅ Solved today":"Plus mate in 2 and 3"; },openPuzzles],
 ["v42xp","🏅","Level & badges",()=>{ const s=stats(); return `Level ${s.lvl} ${s.cur[1]} · ${s.xp} XP`; },openXP],
 ["v42ch","📊","My charts",()=>"Rating and accuracy",()=>openCharts()]];
function tiles(){ const g=$("hsG"); if(!g||g.querySelector("[data-v42t]")) return; const ref=g.querySelector('[data-hs="goal"]')||null;
  TILES.forEach(([id,i,t,sub,fn])=>{ const b=document.createElement("button"); b.type="button"; b.dataset.v42t=id; b.innerHTML=`<span class="i">${i}</span><span><b>${t}</b><br><small>${E_(sub())}</small></span>`; b.onclick=()=>{ try{ fn(); }catch(e){ console.error(e); } }; g.insertBefore(b,ref); }); }
function boot(){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); applyTheme();
  const g=$("hsG"); if(g) new MutationObserver(tiles).observe(g,{childList:true}); tiles();
  new MutationObserver(()=>{ if(B.classList.contains("hs-home")||!B.classList.contains("hs-app")) closePanel(); if(!B.classList.contains("hs-review")) stopRP(); }).observe(B,{attributes:true,attributeFilter:["class"]});
  ["tr","lrn"].forEach(id=>{ const e=$(id); if(e) new MutationObserver(()=>{ if(e.classList.contains("on")) closePanel(); }).observe(e,{attributes:true,attributeFilter:["class"]}); });
  reviewBits(); }
window.V42={level,attachPlay,toast,stats,openXP,openPuzzles,openCharts,podPuzzle,applyTheme,_q:{qBest,qWhy,qThreat}};
try{ boot(); }catch(e){ console.error(e); }
})();

/* v43: reorder "Review a new game": username/side, online fetch, Lichess, then PGN paste */
(function(){
  function reorder(){
    const pb=document.getElementById("pbody"), li=document.getElementById("li16"), fe=document.getElementById("bFetch");
    if(!pb||!li||!fe) return false; if(pb.dataset.v43) return true;
    const howto=pb.querySelector("ol.howto"), ta=document.getElementById("pgnIn"),
      who=document.getElementById("uname").closest(".prow"), modes=pb.querySelector(".prow.modes"),
      arow=document.getElementById("bAnalyze").closest(".prow"), fl=document.getElementById("fetchList");
    const frow=document.createElement("div"); frow.className="prow"; frow.appendChild(fe);
    const pgn=document.createElement("div"); pgn.className="v43pgn"; pgn.innerHTML='<b>📋 Paste a game (PGN)</b>';
    [howto,ta,modes,arow].forEach(e=>e&&pgn.appendChild(e));
    const first=pb.firstChild;
    [who,frow,li,fl,pgn].forEach(e=>e&&pb.insertBefore(e,first));
    pb.dataset.v43="1"; return true;
  }
  const st=document.createElement("style"); st.textContent=".v43pgn{margin-top:14px;padding-top:10px;border-top:1px solid rgba(0,0,0,.12)}.v43pgn>b{display:block;margin-bottom:6px}";
  document.head.appendChild(st);
  let n=0; (function tryIt(){ if(!reorder()&&n++<100) setTimeout(tryIt,100); })();
})();

/* v43: no empty strip under the screen title on any non-home screen */
(function(){const s=document.createElement("style");s.textContent="body.hs-on:not(.hs-home) #hs{padding-bottom:4px!important}";document.head.appendChild(s);})();

/* v44: analysis progress bar pinned to the top while it runs, and scroll up to it */
(function(){
  const s=document.createElement("style");
  s.textContent="#prog.progress.on{position:fixed;top:0;left:50%;transform:translateX(-50%);width:min(100%,760px);box-sizing:border-box;z-index:9000;margin:0;padding:10px 14px calc(10px);padding-top:calc(10px + env(safe-area-inset-top));background:var(--card,#fff);border-bottom:1px solid rgba(0,0,0,.15);box-shadow:0 4px 14px rgba(0,0,0,.18);border-radius:0 0 12px 12px}"+
    "body.v44an #hs{margin-top:var(--v44h,64px)}";
  document.head.appendChild(s);
  function hook(){
    const p=document.getElementById("prog"); if(!p) return setTimeout(hook,200);
    if(p.parentElement!==document.body) document.body.appendChild(p);
    let was=false;
    new MutationObserver(()=>{ const on=p.classList.contains("on");
      document.body.classList.toggle("v44an",on);
      if(on){ document.documentElement.style.setProperty("--v44h",(p.offsetHeight+4)+"px"); if(!was) window.scrollTo({top:0,behavior:"smooth"}); }
      was=on; }).observe(p,{attributes:true,attributeFilter:["class"]});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",hook); else hook();
})();
