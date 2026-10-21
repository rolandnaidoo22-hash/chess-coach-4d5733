/* Wishlist v31+ (own file wish.js). Adds features only; uses CRImp helpers from imp.js. */
(function(){
"use strict";
if(window.CRWish||!window.CRImp) return;
const I=window.CRImp, $=id=>document.getElementById(id), E=I.E, LSg=I.LSg, LSs=I.LSs;
const W={};
/* ================= Rating goal ================= */
const GK="chessReview.wish.goal.v1", TCS=[["rapid","chess_rapid","⏱ Rapid"],["blitz","chess_blitz","⚡ Blitz"],["bullet","chess_bullet","🔫 Bullet"],["daily","chess_daily","📅 Daily"]];
const GCSS=`.wgoal{border-radius:16px;border:2px solid #3b6fb6;background:#f2f6fd;padding:12px 14px;margin:10px 0;color:#222;font-size:15px;line-height:1.45}
.wgoal h3{margin:0 0 6px;font-size:18px}.wgoal .in{display:flex;gap:8px;margin:6px 0}.wgoal input{flex:1;min-height:46px;font-size:18px;border-radius:10px;border:1px solid #aab;padding:0 12px;min-width:0}
.wgoal button{min-height:46px;border-radius:10px;border:none;background:#3b6fb6;color:#fff;font-weight:800;font-size:16px;padding:0 14px;cursor:pointer}
.wgoal .tc{background:#fff;border:1px solid #dde;border-radius:12px;padding:8px 10px;margin:6px 0}.wgoal .tc b.n{font-size:20px}
.wgoal small{color:#556}.wgoal .est{font-size:11px;font-weight:800;color:#a0610a;background:#fff3e0;border-radius:6px;padding:1px 6px;margin-left:4px}
.wgoal .ms{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.wgoal .ms span{font-size:12px;border-radius:10px;padding:3px 8px;background:#e3e8ef}.wgoal .ms span.on{background:#2f7d32;color:#fff}.wgoal .ms span.nx{background:#ffe08a}
html.dark-mode .wgoal{background:#1f2633;color:#eee}html.dark-mode .wgoal .tc{background:#262626;border-color:#3a3a3a}`;
let GS={data:null,loading:false,err:""};
function user(){ return ((window.CRUser&&CRUser.info())||{}).cc||""; }
async function gj(u){ const r=await fetch(u); if(!r.ok) throw new Error("http "+r.status); return r.json(); }
async function loadRatings(){ const u=user(); if(!u){ GS.err="Add your Chess.com username first."; return; } GS.loading=true; paintGoal();
  try{ const st=await gj(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}/stats`); const out={};
    TCS.forEach(([tc,k])=>{ const x=st[k]; if(x&&x.last) out[tc]={r:x.last.rating,rec:x.record||{}}; });
    // recent history: last 2-3 monthly archives, rating change per game per time class
    const a=await gj(`https://api.chess.com/pub/player/${encodeURIComponent(u.toLowerCase())}/games/archives`); let G=[];
    for(const url of (a.archives||[]).slice(-3).reverse()){ const j=await gj(url); G=G.concat((j.games||[]).filter(g=>g.rules==="chess"&&g.rated!==false)); if(G.length>=300) break; }
    G.sort((x,y)=>x.end_time-y.end_time); const last={};
    G.forEach(g=>{ const me=g.white.username.toLowerCase()===u.toLowerCase()?g.white:g.black, tc=g.time_class; if(!out[tc]) return; const o=out[tc];
      o.h=o.h||{w:[],l:[],d:0,n:0}; const prev=last[tc]; last[tc]=me.rating; o.h.n++;
      const res=me.result==="win"?"w":/agreed|repetition|stalemate|insufficient|50move|timevsinsufficient/.test(me.result)?"d":"l";
      if(res==="d"){ o.h.d++; } if(prev==null) { o.h[res==="w"?"wn":"ln"]=(o.h[res==="w"?"wn":"ln"]||0); } else { const ch=me.rating-prev; if(res==="w"&&ch>0&&ch<60) o.h.w.push(ch); if(res==="l"&&ch<0&&ch>-60) o.h.l.push(-ch); }
      o.h.res=(o.h.res||[]).concat(res).slice(-50); });
    GS.data=out; GS.at=Date.now(); GS.err=""; }
  catch(e){ GS.err=navigator.onLine===false?"You're offline.":"Couldn't reach Chess.com right now."; }
  GS.loading=false; paintGoal(); }
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
function estimate(tc,o,target){ const h=o.h||{w:[],l:[],res:[]}; const gw=avg(h.w.slice(-30))||8, gl=avg(h.l.slice(-30))||8, own=h.w.length>=3&&h.l.length>=3;
  const res=h.res||[], wins=res.filter(r=>r==="w").length, losses=res.filter(r=>r==="l").length, p=res.length?wins/res.length:null, q=res.length?losses/res.length:null;
  const gap=target-o.r; const perNet=(gw+gl)/2, net=Math.ceil(gap/perNet);
  const perGame=p!=null?p*gw-q*gl:null; const games=perGame&&perGame>0.2?Math.ceil(gap/perGame):null;
  const needP=Math.round(100*gl/(gw+gl));
  return {gap,gw,gl,own,net,p,games,needP,n:res.length}; }
function milestones(r){ const M=[400,600,800,1000,1200,1500,1800,2000,2200,2500]; return `<div class="ms">${M.map(m=>`<span class="${r>=m?"on":(M.find(x=>x>r)===m?"nx":"")}">${m===2500?"GM 2500":m}</span>`).join("")}</div>`; }
function paintGoal(){ document.querySelectorAll(".wgoal").forEach(box=>{
  const t=LSg(GK,null), help=box.dataset.help==="1";
  let h=`<h3>🎯 Rating goal</h3><div class="in"><input inputmode="numeric" placeholder="Type a goal, e.g. 500" value="${t?t:""}" aria-label="Rating goal"><button type="button">Go</button></div>`;
  if(help) h+=`<div class="tc"><b>How this works:</b> I read your ratings from Chess.com and your last games. For each win you usually gain about the same points as you lose for a loss (against players near your level). So the gap ÷ points per game ≈ how many <b>more wins than losses</b> you need. It's only an <b>estimate</b>: your opponents and luck change it.</div>`;
  if(t) h+=`<div class="wsaved" style="font-weight:800;color:#2f7d32;margin:2px 0 6px">✅ Your goal is saved: ${t}${box.dataset.saved==="1"?" — Road to "+t+" updated everywhere":""}</div>`;
  if(!t) h+=`<small>Type the rating you want (you can also type “500 help”).</small>`;
  else if(GS.loading&&!GS.data) h+=`<small>Getting your ratings from Chess.com…</small>`;
  else if(GS.err) h+=`<small>${E(GS.err)}</small>`;
  else if(GS.data){ let any=false;
    TCS.forEach(([tc,,lbl])=>{ const o=GS.data[tc]; if(!o) return; any=true; const e=estimate(tc,o,t);
      h+=`<div class="tc"><b>${lbl}</b>: <b class="n">${o.r}</b> `;
      if(e.gap<=0) h+=`🎉 You're already above ${t}!`;
      else { h+=`→ ${t} (${e.gap} to go)<br>You're ${o.r} in ${tc}. About <b>${e.net} more wins than losses</b> gets you to ${t}.<span class="est">ESTIMATE</span>
        <br><small>You gain about ${Math.round(e.gw)} per win and lose about ${Math.round(e.gl)} per loss${e.own?" (from your recent games)":" (typical value; not enough games yet)"}.`;
        if(e.p!=null) h+=` Recent win rate: <b>${Math.round(100*e.p)}%</b> (last ${e.n} games). `+(e.games?`At that rate it takes about <b>${e.games} games</b>.`:`At that rate your rating stays about flat: win more than ${e.needP}% to climb.`);
        h+=`</small>`; }
      h+=`</div>`; });
    if(!any) h+=`<small>No rated games found on Chess.com.</small>`;
    const mt=Object.keys(GS.data).sort((a,b)=>((GS.data[b].h||{}).n||0)-((GS.data[a].h||{}).n||0))[0], mr=GS.data[mt].r; h+=`<small>Path to GM (your ${mt} rating ${mr}; green = done, yellow = next):</small>${milestones(mr)}`; }
  box.innerHTML=h; const inp=box.querySelector("input"), go=()=>{ const v=inp.value||"", m=v.match(/\d{3,4}/); box.dataset.help=/help|\?/i.test(v)?"1":"0";
      if(m){ const n=Math.max(100,Math.min(3300,+m[0])); LSs(GK,n); box.dataset.saved="1"; goalSync(); } if(!GS.data&&!GS.loading) loadRatings(); else paintGoal(); };
  box.querySelector("button").onclick=go; inp.onkeydown=e=>{ if(e.key==="Enter") go(); }; }); }
function goalSync(){ const g=LSg(GK,null)||800;
  document.querySelectorAll("[data-goal]").forEach(e=>{ if(e.textContent!==String(g)) e.textContent=g; });
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let x; while((x=w.nextNode())){ if(/Road to \d{3,4}\b/.test(x.nodeValue)) x.nodeValue=x.nodeValue.replace(/Road to \d{3,4}\b/g,"Road to "+g); }
  window.dispatchEvent(new CustomEvent("crgoal",{detail:g})); }
window.addEventListener("storage",e=>{ if(e.key&&e.key.indexOf("wish.goal")>=0){ paintGoal(); goalSync(); } });
function injectGoal(){ const home=$("home"); if(!home||home.querySelector(".wgoal")) return; if(!document.getElementById("wgcss")){ const s=document.createElement("style"); s.id="wgcss"; s.textContent=GCSS; document.head.appendChild(s); }
  const d=document.createElement("div"); d.className="wgoal"; const anchor=$("co17go")||home.firstElementChild; home.insertBefore(d,anchor?anchor.nextSibling:null);
  paintGoal(); if(LSg(GK,null)&&!GS.data&&!GS.loading&&Date.now()-(GS.at||0)>60000) loadRatings(); }
W.goal={sync:goalSync,load:loadRatings,est:estimate,state:GS};

/* ================= Why I lose (loss causes + plan) ================= */
const CAUSE={opening:{ic:"📖",t:"Early mistake (opening)",d:"Your biggest mistake came in the first 12 moves."},tactic:{ic:"💥",t:"Tactical blunder",d:"A piece or mate was missed in the middle of the game."},
  endgame:{ic:"👑",t:"Endgame",d:"The game was still OK until the endgame."},time:{ic:"⏱",t:"Time trouble",d:"You ran out of time, or the big mistake came with under 1 minute left."}};
function lossCause(r){ const mv=r.mv||[]; if(!mv.length) return null; let w=mv[0]; mv.forEach(m=>{ if((m[7]||0)>(w[7]||0)) w=m; });
  if(r.how==="time"||(w[3]!=null&&w[3]<60)) return {c:"time",m:w};
  const mvno=Math.ceil(w[0]/2); if(mvno<=12&&w[4]!==2) return {c:"opening",m:w};
  if(w[4]===2) return {c:"endgame",m:w}; return {c:"tactic",m:w}; }
const PLAN={opening:[["🗺 My opening plan",()=>I.openPage("plan")],["🛠 Drill my top leak",()=>I.openPage("drill")],["🪤 Trap Radar",()=>window.TrapRadar&&TrapRadar.open()]],
  tactic:[["🛠 Drill my top leak",()=>I.openPage("drill")],["🎯 Coach puzzles",()=>Coach17.open("puz")]],
  endgame:[["👑 Pawn endgames",()=>Coach17.open("pawn")],["♜ Rook endgames",()=>I.openPage("rookend"),"rookend"]],
  time:[["🧼 Am I getting cleaner?",()=>I.openPage("clean")]]};
const planOf=k=>PLAN[k].filter(p=>!p[2]||I._tiles.some(t=>t.id===p[2]));
const TIP={opening:"Most early losses at your level are a piece left hanging in the first 12 moves. Follow your opening plan, and check every capture before you move.",tactic:"Before every move: look at all checks, captures and threats (yours AND theirs).",
  endgame:"Learn 2 endgame positions a week. Kings are strong in the endgame: bring yours to the middle.",time:"Use your clock evenly: about 1/40 of your time per move. Play fast only when the move is forced."};
function whyPage(s){ const recs=I.recsSorted().slice(0,40), L=recs.filter(r=>r.res==="L"), C={opening:[],tactic:[],endgame:[],time:[]};
  L.forEach(r=>{ const x=lossCause(r); if(x) C[x.c].push({r,m:x.m}); });
  const order=Object.keys(C).sort((a,b)=>C[b].length-C[a].length);
  let h=I.pageHead("🔍 Why I lose")+`<p class="co17sm">Each lost game gets <b>one main reason</b>: where your biggest mistake happened. Based on your ${recs.length} most recent studied games (${L.length} losses).</p>`;
  if(!L.length){ h+=`<div class="box">No lost games studied yet. Tap <b>📚 Study last 20 games</b> first.</div>`; s.innerHTML=h; I.wireBack(s); return; }
  order.forEach(k=>{ const n=C[k].length, pct=Math.round(100*n/L.length); h+=`<div class="box ${k===order[0]&&n?"bad":""}"><div class="row"><div><b>${CAUSE[k].ic} ${CAUSE[k].t}</b><br><small>${CAUSE[k].d}</small></div><div class="cnt">${n}</div></div>
     <div style="height:10px;border-radius:5px;background:#e3e8ef;margin:6px 0;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${k===order[0]?"#c62828":"#3b6fb6"}"></i></div>
     <small>${C[k].slice(0,6).map(x=>`vs ${E(x.r.me==="w"?x.r.black:x.r.white)} (move ${Math.ceil(x.m[0]/2)})`).join(" · ")}</small></div>`; });
  const top=order.filter(k=>C[k].length).slice(0,2);
  h+=`<h3>📅 Your training plan this week</h3><div class="box good">`+top.map((k,i)=>`<div style="margin:4px 0"><b>${i===0?"Main focus":"Also"}: ${CAUSE[k].t}</b> (${C[k].length} of ${L.length} losses)<br><small>${E(TIP[k])}</small><div class="chips">${planOf(k).map((p,j)=>`<button class="chip" data-pl="${k}|${j}">${p[0]}</button>`).join("")}</div></div>`).join("")+
     `<div style="margin-top:6px"><small>Suggested: ${top[0]?`4 days on ${CAUSE[top[0]].t.toLowerCase()}`:""}${top[1]?`, 2 days on ${CAUSE[top[1]].t.toLowerCase()}`:""}, 1 day off. Keep doing your daily 30 minutes in My Coach.</small></div></div>`;
  s.innerHTML=h; I.wireBack(s); s.querySelectorAll("[data-pl]").forEach(b=>b.onclick=()=>{ const [k,j]=b.dataset.pl.split("|"); I._setCur(null); s.classList.remove("impP"); planOf(k)[+j][1](); }); }
I.addTile("why","🔍","Why I lose","Losses by cause + this week's plan",whyPage);
W.why={lossCause};

/* ================= Rook endgames: Lucena + Philidor (guided, you play the key moves) ================= */
const RK="chessReview.wish.rookend.v1";
const LESSONS=[
 {id:"lucena",t:"Lucena: build a bridge (to WIN)",side:"w",fen:"1K6/1P1k4/8/8/8/8/r7/7R w - - 0 1",
  intro:"You have a rook and a pawn on the 7th rank, but your own king is stuck in front of it. Plan: push their king away with a check, put your rook on the 4th rank, walk your king out, and block the checks with your rook (the 'bridge').",
  steps:[{u:["Rd1+"],h:"Give a check on the d-file to push their king one more file away.",say:"Their king has to step away from your pawn.",r:"Ke7"},
   {u:["Rd4"],h:"Rook to the 4th rank. This is the key move!",say:"The rook on the 4th rank will later block the checks.",r:"Ra1"},
   {u:["Kc7"],h:"Now walk your king out, next to the pawn.",say:"They start checking your king.",r:"Rc1+"},
   {u:["Kb6"],h:"Step towards your rook.",say:"Another check…",r:"Rb1+"},
   {u:["Kc6","Ka6"],h:"Keep stepping, staying close to the pawn.",say:"Still checking…",r:"Rc1+"},
   {u:["Kb5"],h:"Walk towards your rook on the 4th rank.",say:"One last check:",r:"Rb1+"},
   {u:["Rb4"],h:"Block the check with your rook: the bridge!",say:"🎉 The bridge is built. No more checks, and the pawn will become a queen. That's the Lucena method."}]},
 {id:"philidor",t:"Philidor: 3rd-rank defence (to DRAW)",side:"b",fen:"4k3/7R/8/3KP3/8/8/8/1r6 b - - 0 1",
  intro:"You only have a rook against rook + pawn. Your king is in front of the pawn (good!). Plan: keep your rook on your 3rd rank (the 6th rank) so their king can't come forward. When the pawn steps onto that rank, drop your rook to the back and check from behind.",
  steps:[{u:["Rb6","Ra6","Rc6"],h:"Put your rook on the 6th rank (your 3rd rank).",say:"Their king can't go to the 6th rank now. So they push the pawn…",r:"e6"},
   {u:["Rb1","Ra1","Rc1","Rd1","Rf1","Rg1"],h:"The pawn is on your 3rd rank now, so their king has no shelter. Drop your rook to the 1st rank to check from behind.",say:"Now their king has nowhere to hide from your checks.",r:"Kd6"},
   {u:["Rd1+"],h:"Check the king from behind!",say:"Keep checking…",r:"Ke5"},
   {u:["Re1+"],h:"Check again from behind.",say:"…and again.",r:"Kd6"},
   {u:["Rd1+"],h:"Keep checking. There's no escape for their king.",say:"🎉 They can't escape the checks: it's a draw. That's the Philidor defence."}]}];
let RS=null;
function rookPage(s,arg){ const done=LSg(RK,{});
  if(!RS||arg==="menu"){ let h=I.pageHead("♜ Rook endgames")+`<p class="co17sm">The two most important rook endgames. You play the key moves; I play the other side. (Pawn endgames and opposition are in <b>👑 Pawn endgames</b>.)</p>`;
    LESSONS.forEach((L,i)=>{ const d=done[L.id]; h+=`<div class="box ${d?"good":""}"><b>${E(L.t)}</b><br><small>${d?`✅ Done ${d.n}× · last ${new Date(d.at).toLocaleDateString()}`:"Not done yet"}</small><button class="cbtn full pri" data-les="${i}" style="text-align:center;margin-top:8px">▶ ${d?"Practise again":"Start"}</button></div>`; });
    s.innerHTML=h; I.wireBack(s); s.querySelectorAll("[data-les]").forEach(b=>b.onclick=()=>{ RS={L:LESSONS[+b.dataset.les],k:0,miss:0}; rookPage(s); }); return; }
  const L=RS.L, G=new ChessLib.Chess(L.fen); let k=0, hint=false, last=null, fin=false;
  let h=I.pageHead("♜ "+E(L.t.split(":")[0]))+`<div class="box"><small>${E(L.intro)}</small></div><div class="co17msg" id="wrM">You play <b>${L.side==="w"?"White":"Black"}</b>. Your move!</div><div class="co17board" id="wrB"></div>
    <div class="co17pz"><button class="cbtn" id="wrH">💡 Hint</button><button class="cbtn" id="wrL">‹ Lessons</button></div>`;
  s.innerHTML=h; I.wireBack(s); const msg=t=>{ $("wrM").innerHTML=t; };
  const extra=()=>({hl:(last?[{sq:last.from,c:"#cdd26a",o:.55},{sq:last.to,c:"#cdd26a",o:.55}]:[]).concat(hint&&!fin?[{sq:(()=>{ const c=new ChessLib.Chess(G.fen()); const m=c.move(L.steps[k].u[0]); return m.from; })(),c:"#3b6fb6",o:.55}]:[])});
  const redraw=Coach17._tapBoard($("wrB"),G,L.side,(f,t)=>{ if(fin) return; const st=L.steps[k]; const c=new ChessLib.Chess(G.fen()); let m=null; try{ m=c.move({from:f,to:t,promotion:"q"}); }catch(e){} if(!m) return;
      if(!st.u.some(u=>u.replace(/[+#]/g,"")===m.san.replace(/[+#]/g,""))){ RS.miss++; msg(`❌ ${E(m.san)} isn't the plan here. ${E(st.h)}`); return; }
      G.move(m); last=m; hint=false; k++;
      if(!st.r){ fin=true; redraw(); msg(`✅ ${E(st.say)}`); const D=LSg(RK,{}); const x=D[L.id]||{n:0}; x.n++; x.at=Date.now(); x.miss=RS.miss; D[L.id]=x; LSs(RK,D); $("wrH").style.display="none"; return; }
      msg(`✅ ${E(st.say)}`); redraw(); setTimeout(()=>{ const rm=G.move(st.r); last=rm; redraw(); msg(`They play <b>${E(rm.san)}</b>. Your move!`); },700); },extra);
  $("wrH").onclick=()=>{ hint=true; redraw(); msg(`💡 ${E(L.steps[k].h)}`); };
  $("wrL").onclick=()=>rookPage(s,"menu"); }
I.addTile("rookend","♜","Rook endgames","Lucena (win) + Philidor (draw)",s=>{ RS=null; rookPage(s,"menu"); });

/* ================= Blindfold: "where is the piece?" (text-only moves) ================= */
const BK="chessReview.wish.blind.v1", PNM={n:"knight",b:"bishop",r:"rook",q:"queen",k:"king",p:"pawn"};
function blindQ(n){ const C=ChessLib.Chess; let sans=null; const recs=I.recsSorted().filter(r=>r.pgn);
  for(let t=0;t<6&&!sans;t++){ const r=recs[Math.floor(Math.random()*recs.length)]; const s=r&&I.sansOf(r); if(s&&s.length>=n) sans=s.slice(0,n); }
  if(!sans){ const c=new C(); sans=[]; for(let i=0;i<n;i++){ const ms=c.moves(); if(!ms.length) break; const m=ms[Math.floor(Math.random()*ms.length)]; c.move(m); sans.push(m); } }
  const c=new C(); const track={}; ["a","b","c","d","e","f","g","h"].forEach(f=>[1,2,7,8].forEach(r=>track[f+r]=f+r)); const moved={};
  sans.forEach(sn=>{ const m=c.move(sn); const id=track[m.from]; delete track[m.from]; delete track[m.to];
    if(m.flags.includes("e")) delete track[m.to[0]+m.from[1]]; track[m.to]=id; moved[id]=(moved[id]||0)+1;
    if(m.flags.includes("k")||m.flags.includes("q")){ const rk=m.color==="w"?"1":"8", rf=m.flags.includes("k")?["h","f"]:["a","d"]; const rid=track[rf[0]+rk]; delete track[rf[0]+rk]; track[rf[1]+rk]=rid; moved[rid]=(moved[rid]||0)+1; } });
  const cands=Object.keys(track).filter(sq=>moved[track[sq]]&&c.get(sq)&&c.get(sq).type!=="k").sort((a,b)=>(moved[track[b]]-moved[track[a]])||((c.get(b).type!=="p")-(c.get(a).type!=="p")));
  const pick=cands.slice(0,3)[Math.floor(Math.random()*Math.min(3,cands.length))]; if(!pick) return null; const pc=c.get(pick);
  return {sans,ans:pick,start:track[pick],piece:pc.type,color:pc.color,fen:c.fen()}; }
function emptyBoard(hl){ let h=`<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%">`; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const sq="abcdefgh"[c]+(8-r); h+=`<rect data-sq="${sq}" x="${c}" y="${r}" width="1" height="1" fill="${hl&&hl[sq]?hl[sq]:((r+c)%2?"#b58863":"#f0d9b5")}"/>`; }
  for(let i=0;i<8;i++) h+=`<text x="${i+.04}" y="7.97" font-size=".22" fill="#444" pointer-events="none">${"abcdefgh"[i]}</text><text x=".03" y="${i+.24}" font-size=".22" fill="#444" pointer-events="none">${8-i}</text>`; return h+"</svg>"; }
let BQ=null;
function blindPage(s){ const st=LSg(BK,{lvl:3,ok:0,n:0,streak:0,best:0}); if(!BQ) BQ=blindQ(st.lvl===3?4:st.lvl===5?6:10);
  if(!BQ){ s.innerHTML=I.pageHead("🙈 Blindfold")+`<div class="box">Couldn't make a question. Try again.</div>`; I.wireBack(s); return; }
  const q=BQ, mv=q.sans.map((m,i)=>(i%2?"":`<b>${i/2+1}.</b> `)+E(m)).join(" ");
  let h=I.pageHead("🙈 Blindfold")+`<p class="co17sm">No pieces on the board! Read the moves, picture them in your head, then tap the square.</p>
   <div class="seg">${[3,5,8].map(l=>`<button data-lv="${l}" class="${st.lvl===l?"on":""}">${l===3?"Easy":l===5?"Medium":"Hard"}</button>`).join("")}</div>
   <div class="box" style="font-size:18px;line-height:1.8">${mv}</div>
   <div class="co17msg" id="blM">Where is the <b>${q.color==="w"?"white":"black"} ${PNM[q.piece]}</b> that started on <b>${q.start}</b>?</div>
   <div class="co17board" id="blB">${emptyBoard()}</div><div id="blX"></div>
   <div class="co17sm" style="text-align:center">Score ${st.ok}/${st.n} · streak 🔥 ${st.streak} · best ${st.best}</div>`;
  s.innerHTML=h; I.wireBack(s); let done=false;
  s.querySelectorAll("[data-lv]").forEach(b=>b.onclick=()=>{ const S=LSg(BK,st); S.lvl=+b.dataset.lv; LSs(BK,S); BQ=null; blindPage(s); });
  $("blB").onclick=e=>{ const sq=e.target.getAttribute&&e.target.getAttribute("data-sq"); if(!sq||done) return; done=true; const ok=sq===q.ans; const S=LSg(BK,st);
    S.n++; if(ok){ S.ok++; S.streak++; S.best=Math.max(S.best,S.streak); } else S.streak=0; LSs(BK,S);
    $("blM").innerHTML=ok?`✅ Yes! It's on <b>${q.ans}</b>.`:`❌ You tapped ${sq}. It's on <b>${q.ans}</b>.`;
    $("blB").innerHTML=emptyBoard({[q.ans]:"#7cc47f",[sq]:ok?"#7cc47f":"#ef9a9a"});
    $("blX").innerHTML=`<div class="box"><small>Here is the real position:</small><div class="bd">${I.miniBoard(q.fen,false,[])}</div><button class="cbtn full pri" id="blN" style="text-align:center">Next ▶</button></div>`;
    $("blN").onclick=()=>{ BQ=null; blindPage(s); }; }; }
I.addTile("blind","🙈","Blindfold","Text-only moves: where is the piece?",s=>{ BQ=null; blindPage(s); });
W.blind={q:()=>BQ};

/* ================= Clock burners (in each review) ================= */
const fmtS=x=>x>=60?`${Math.floor(x/60)}:${String(Math.round(x%60)).padStart(2,"0")} min`:`${Math.round(x)} s`;
function burners(D){ if(String(D.meta.time_control||"").includes("/")) return null; const P=D.plies.filter(p=>p.user&&p.spent_s!=null); if(P.length<5) return null; const avgS=P.reduce((a,p)=>a+p.spent_s,0)/P.length, lim=Math.max(30,3*avgS);
  const out=[]; P.forEach(p=>{ if(p.spent_s<lim) return; let why=null; const legal=(()=>{ try{ return new ChessLib.Chess(p.fen_before).moves().length; }catch(e){ return 9; } })();
    if(legal<=2) why=`there ${legal===1?"was only 1 legal move":"were only 2 legal moves"}`;
    else if(/mistake|blunder|miss/.test(p.cls)) why=`and it was still a ${p.cls}`;
    else if(p.cls==="inaccuracy") why="and it was still an inaccuracy";
    else if(p.cls==="book") why="on a normal opening move you could play quickly";
    else if(/x/.test(p.san)&&/x/.test((D.plies[p.ply-2]||{}).san||"")&&p.uci&&(D.plies[p.ply-2]||{}).uci&&p.uci.slice(2,4)===(D.plies[p.ply-2]||{}).uci.slice(2,4)) why="on a simple take-back";
    if(why) out.push({p,why}); });
  return {list:out.sort((a,b)=>b.p.spent_s-a.p.spent_s).slice(0,3),avgS,lim,burnt:out.reduce((a,x)=>a+x.p.spent_s,0)}; }
function injectBurn(){ const s=$("summary"); if(!s||typeof DATA==="undefined"||!DATA||!DATA.plies||s.querySelector(".wburn")) return; const B=burners(DATA); if(!B) return;
  const d=document.createElement("div"); d.className="wburn imp1"+(B.list.length?"":" ok"); d.style.borderColor=B.list.length?"#90a4d4":""; d.style.background=B.list.length?"#f2f6fd":"";
  d.innerHTML=`<b class="t" style="color:#3b6fb6">⏳ Clock burners</b>`+(B.list.length?`You used a lot of clock for little gain ${B.list.length===1?"once":B.list.length+" times"} (${fmtS(B.burnt)} in total; your normal move takes ${fmtS(B.avgS)}):`+
     B.list.map(x=>`<div style="margin-top:4px">• <b>${E(x.p.label)}</b>: ${fmtS(x.p.spent_s)} ${E(x.why)}. <button type="button" data-bp="${D_idx(x.p)}" style="min-height:34px;margin:0 0 0 4px;padding:2px 8px">See</button></div>`).join("")+`<div style="margin-top:6px"><small>Tip: think long only when there's a capture, a check or a threat. Play forced and simple moves fast.</small></div>`
     :`No long thinks wasted in this game. 👍 Your normal move took ${fmtS(B.avgS)}.`);
  d.querySelectorAll("[data-bp]").forEach(b=>b.onclick=()=>{ try{ go(+b.dataset.bp+1,true); }catch(e){} });
  const after=s.querySelector(".imp1"); s.insertBefore(d,after?after.nextSibling:s.firstChild); }
function D_idx(p){ return DATA.plies.indexOf(p); }
W._inits=(W._inits||[]).concat(()=>{ const s=$("summary"); if(!s) return; new MutationObserver(()=>setTimeout(injectBurn,0)).observe(s,{childList:true}); setTimeout(injectBurn,600); });
W.burn=burners;

/* ================= Opening drill: your book-exit branches, with "you keep getting this wrong" ================= */
const OK7="chessReview.wish.odrill.v1", OIV=[1,3,7];
let OBK=null; function ob(){ if(!OBK){ try{ OBK=JSON.parse(($("obook-data")||{}).textContent||"{}").p||{}; }catch(e){ OBK={}; } } return OBK; }
function branches(){ const B=ob(), m={}; I.recsSorted().slice(0,60).forEach(r=>{ const s=I.sansOf(r); if(!s) return; const c=new ChessLib.Chess();
    for(let i=0;i<Math.min(s.length,24);i++){ const fen=c.fen(), key=fen.split(" ").slice(0,3).join(" "), L=B[key], mine=(i%2===0)===(r.me==="w"); let mv=null; try{ mv=c.move(s[i]); }catch(e){} if(!mv||!L) break;
      if(L.some(x=>x[0]===mv.from+mv.to+(mv.promotion||""))) continue; if(!mine) break;
      const tot=L.reduce((a,x)=>a+x[1],0), good=L.filter(x=>x[1]/tot>=0.1).map(x=>x[0]);
      (m[key]=m[key]||{key,fen,me:r.me,ply:i,good,top:L[0][0],pct:Math.round(100*L[0][1]/tot),played:{},games:[]}); m[key].played[mv.san]=(m[key].played[mv.san]||0)+1; m[key].games.push(r); break; } });
  return Object.values(m).sort((a,b)=>b.games.length-a.games.length||a.ply-b.ply); }
function odStore(){ return LSg(OK7,{}); }
let OD=null;
function odPage(s,arg){ const all=branches(), S=odStore(), now=Date.now();
  if(!OD||arg==="menu"){ const due=all.filter(b=>{ const x=S[b.key]; return !x||(!x.grad&&x.due<=now); });
    let h=I.pageHead("📖 Opening drill")+`<p class="co17sm">These are the spots in <b>your own games</b> where you left the normal opening moves. Practise the move most players choose.</p>`;
    if(!all.length){ h+=`<div class="box">No opening branches yet. Tap <b>📚 Study last 20 games</b> first.</div>`; s.innerHTML=h; I.wireBack(s); return; }
    h+=`<button class="cbtn full pri" id="odGo" style="text-align:center;font-size:18px" ${due.length?"":"disabled"}>▶ Drill ${Math.min(6,due.length)} position${due.length===1?"":"s"}${due.length?"":" (none due today)"}</button>`;
    all.slice(0,12).forEach(b=>{ const rep=b.games.length>=2, x=S[b.key], mv=Math.floor(b.ply/2)+1;
      h+=`<div class="box ${rep?"bad":""}"><div class="row"><div><b>${rep?"🔁 You keep getting this position wrong":"Left the book here"}</b><br><small>${b.me==="w"?"White":"Black"}, move ${mv}${b.ply%2?"...":"."} · ${b.games.length} game${b.games.length>1?"s":""} · you played ${Object.keys(b.played).map(E).join(", ")}</small></div><div class="cnt">${b.games.length}×</div></div>
        <small>${x?(x.grad?"✅ learned":`next review ${new Date(x.due).toLocaleDateString()}`):"not drilled yet"}</small></div>`; });
    s.innerHTML=h; I.wireBack(s); const g=$("odGo"); if(g) g.onclick=()=>{ OD={q:due.slice(0,6),i:0,ok:0}; odPage(s); }; return; }
  if(OD.i>=OD.q.length){ s.innerHTML=I.pageHead("📖 Opening drill")+`<div class="box good"><b>Done: ${OD.ok} of ${OD.q.length} right.</b><br>Missed ones come back tomorrow; right ones in 3, then 7 days.</div><button class="cbtn full" id="odM" style="text-align:center">‹ Back to the list</button>`; I.wireBack(s); $("odM").onclick=()=>{ OD=null; odPage(s,"menu"); }; return; }
  const b=OD.q[OD.i], G=new ChessLib.Chess(b.fen), mv=Math.floor(b.ply/2)+1; let done=false;
  s.innerHTML=I.pageHead("📖 Opening drill")+`<div class="co17msg" id="odMsg">${OD.i+1} of ${OD.q.length}: you're ${b.me==="w"?"White":"Black"}, move ${mv}. What's the normal move here?${b.games.length>=2?"<br><small style='color:#c62828'>🔁 You went wrong here in "+b.games.length+" games</small>":""}</div><div class="co17board" id="odB"></div><div id="odX"></div>`;
  I.wireBack(s); let arrows=[];
  const fin=(ok,san)=>{ done=true; const S2=odStore(), x=S2[b.key]||{box:-1}; if(ok){ x.box=x.box<0?1:x.box+1; if(x.box>=OIV.length){ x.grad=true; x.due=Infinity; } else x.due=Date.now()+OIV[x.box]*864e5; OD.ok++; } else { x.box=0; x.due=Date.now()+864e5; x.grad=false; } S2[b.key]=x; LSs(OK7,S2);
    const best=I.sanOf(b.fen,b.top); arrows=[{u:b.top,c:"#2f7d32"}];
    $("odX").innerHTML=`<div class="box ${ok?"good":"bad"}">${ok?`✅ Yes, ${E(san)} is a normal move here.`:`❌ ${E(san)} isn't what most players play.`} Most common: <b>${E(best)}</b> (${b.pct}% of games). In your game${b.games.length>1?"s":""} you played ${Object.keys(b.played).map(E).join(", ")}.</div><button class="cbtn full pri" id="odN" style="text-align:center">Next ▶</button>`;
    $("odN").onclick=()=>{ OD.i++; odPage(s); }; redraw(); };
  const redraw=Coach17._tapBoard($("odB"),G,b.me,(f,t)=>{ if(done) return; const c=new ChessLib.Chess(G.fen()); let m=null; try{ m=c.move({from:f,to:t,promotion:"q"}); }catch(e){} if(!m) return; G.move(m); fin(b.good.includes(m.from+m.to+(m.promotion||"")),m.san); },()=>({arrows}));
}
I.addTile("odrill","📖","Opening drill",()=>{ try{ const n=branches().filter(b=>b.games.length>=2).length; return n?`<b style="color:#c62828">${n} spot${n>1?"s":""} you keep getting wrong</b>`:"Practise where you leave the book"; }catch(e){ return "Practise where you leave the book"; } },s=>{ OD=null; odPage(s,"menu"); });
W.odrill={branches};

/* ================= boot ================= */
window.CRWish=W;
function init(){ injectGoal(); const h=$("home"); if(h) new MutationObserver(()=>injectGoal()).observe(h,{childList:true}); (W._inits||[]).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,500)); else setTimeout(init,500);
})();
