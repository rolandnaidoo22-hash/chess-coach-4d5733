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
      if(m){ const n=Math.max(100,Math.min(3300,+m[0])); LSs(GK,n); } if(!GS.data&&!GS.loading) loadRatings(); else paintGoal(); };
  box.querySelector("button").onclick=go; inp.onkeydown=e=>{ if(e.key==="Enter") go(); }; }); }
function injectGoal(){ const home=$("home"); if(!home||home.querySelector(".wgoal")) return; if(!document.getElementById("wgcss")){ const s=document.createElement("style"); s.id="wgcss"; s.textContent=GCSS; document.head.appendChild(s); }
  const d=document.createElement("div"); d.className="wgoal"; const anchor=$("co17go")||home.firstElementChild; home.insertBefore(d,anchor?anchor.nextSibling:null);
  paintGoal(); if(LSg(GK,null)&&!GS.data&&!GS.loading&&Date.now()-(GS.at||0)>60000) loadRatings(); }
W.goal={load:loadRatings,est:estimate,state:GS};

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

/* ================= boot ================= */
window.CRWish=W;
function init(){ injectGoal(); const h=$("home"); if(h) new MutationObserver(()=>injectGoal()).observe(h,{childList:true}); (W._inits||[]).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,500)); else setTimeout(init,500);
})();
