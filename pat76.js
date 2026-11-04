/* v76: more patterns. Where you lose, tilt and rushing, and your winning pattern. Pure functions first (tested in node), then the HTML. */
(function(W){
const CLS=["brilliant","great","best","excellent","good","book","inaccuracy","mistake","miss","blunder"];
const BAD=c=>c==="mistake"||c==="blunder"||c==="miss";
const PH=["opening","middlegame","endgame"];
const r1=x=>x==null||isNaN(x)?null:Math.round(x*10)/10;
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const mvs=r=>(r.mv||[]).map(m=>({ply:m[0],cls:typeof m[1]==="number"?CLS[m[1]]:m[1],spent:m[2],clock:m[3],phase:m[4],loss:(m[7]||0)/1000,ev:m[8]==null?null:m[8]}));
const gid=r=>{ const m=/(\d+)\/?$/.exec(r.link||r.id||""); return m?+m[1]:0; };
function order(recs){ return recs.slice().sort((a,b)=>(a.date||"").localeCompare(b.date||"")||gid(a)-gid(b)); }
/* the decisive mistake: first of your moves that throws away a lot (from "still OK" when we know the eval) */
function decisive(r){ const M=mvs(r); if(!M.length) return null;
  let d=M.find(m=>m.loss>=0.15&&(m.ev==null||m.ev>-200));
  if(!d){ d=M.slice().sort((a,b)=>b.loss-a.loss)[0]; if(!d||d.loss<0.08) return null; }
  const ph=d.phase>=0&&d.phase<=2?d.phase:(d.ply<=20?0:1); return {ply:d.ply,phase:ph,loss:d.loss}; }
function whereLose(recs){ const L=recs.filter(r=>r.res==="L"), c=[0,0,0]; let n=0, ex=[null,null,null];
  L.forEach(r=>{ const d=decisive(r); if(!d) return; c[d.phase]++; n++; if(!ex[d.phase]) ex[d.phase]={r,ply:d.ply}; });
  const pct=c.map(x=>n?Math.round(100*x/n):0); const top=n?[0,1,2].sort((a,b)=>c[b]-c[a])[0]:null;
  return {losses:L.length,n,counts:c,pct,top,ex}; }
function gStats(r){ const M=mvs(r), t=M.filter(m=>m.spent!=null); return {n:M.length,avg:t.length?mean(t.map(m=>m.spent)):null,bad:M.filter(m=>BAD(m.cls)).length,timed:t.length}; }
/* (a) the game right after a loss vs the rest */
function afterLoss(recs){ const O=order(recs), A=[], B=[];
  O.forEach((r,i)=>{ if(i===0) return; const prev=O[i-1]; (prev.res==="L"?A:B).push(gStats(r)); });
  const sum=G=>{ const t=G.filter(g=>g.avg!=null); return {games:G.length,avg:r1(mean(t.map(g=>g.avg))),bad:r1(mean(G.map(g=>g.bad))),timed:t.length}; };
  const a=sum(A), b=sum(B); const ok=a.games>=3&&b.games>=3;
  const faster=ok&&a.avg!=null&&b.avg!=null&&a.avg<=b.avg*0.85, worse=ok&&a.bad!=null&&b.bad!=null&&a.bad>=b.bad+0.5;
  return {ok,after:a,rest:b,faster,worse}; }
/* (b) rushing when you're clearly winning (eval +3 or better for you) */
function whenWinning(recs){ const all=[]; recs.forEach(r=>mvs(r).forEach(m=>{ if(m.ev!=null) all.push(m); }));
  const up=all.filter(m=>m.ev>=300), rest=all.filter(m=>m.ev<300);
  const s=G=>{ const t=G.filter(m=>m.spent!=null); return {moves:G.length,avg:r1(mean(t.map(m=>m.spent))),badPct:G.length?Math.round(100*G.filter(m=>BAD(m.cls)).length/G.length):null,timed:t.length}; };
  const a=s(up), b=s(rest); const ok=a.moves>=10&&b.moves>=10;
  return {ok,hasEval:all.length>0,up:a,rest:b,faster:ok&&a.avg!=null&&b.avg!=null&&a.avg<=b.avg*0.8,worse:ok&&a.badPct!=null&&b.badPct!=null&&a.badPct>=b.badPct+3}; }
/* 3x3 jobs (and habits) that show up in your wins */
const JOBS=["Develop","Control the centre","Castle","Attack weaknesses","Improve your pieces","Stop their plans","Activate your king","Attack weak pawns","Passed pawn"];
const KEEP={"Develop":"get your knights and bishops out early","Control the centre":"aim pawns and pieces at the middle squares","Castle":"castle early to keep your king safe","Attack weaknesses":"go after loose pieces and an unsafe king","Improve your pieces":"wake up your worst piece","Stop their plans":"ask what their last move wants","Activate your king":"bring your king to the middle in the endgame","Attack weak pawns":"win pawns nobody protects","Passed pawn":"make a passed pawn and push it"};
function winPattern(tt3, recs){ const res={}; (recs||[]).forEach(r=>{ const k=(r.link||r.id||"").replace(/\/$/,""); if(k) res[k]=r.res; });
  const W=(tt3||[]).filter(g=>(g.r||res[(g.l||"").replace(/\/$/,"")])==="W");
  const jobs=JOBS.map((nm,k)=>{ const v=W.map(g=>g.s&&g.s[k]).filter(x=>x!=null); const p=v.filter(x=>x===1).length; return {k,nm,n:v.length,pct:v.length?Math.round(100*p/v.length):null}; })
    .filter(j=>j.n>=2&&j.pct>=60).sort((a,b)=>b.pct-a.pct||b.n-a.n).slice(0,3);
  const RW=(recs||[]).filter(r=>r.res==="W"), habits=[];
  if(RW.length>=2){ const c=RW.filter(r=>r.castled!=null).length; if(c/RW.length>=0.6) habits.push({t:`You castled in ${c} of ${RW.length} wins`,keep:"keep castling early"});
    const nh=RW.filter(r=>!(r.ev||[]).some(e=>e.k==="hang")).length; if(nh/RW.length>=0.5) habits.push({t:`You left no piece hanging in ${nh} of ${RW.length} wins`,keep:"keep checking what they can take"});
    const eq=RW.filter(r=>!r.earlyQ).length; if(eq/RW.length>=0.7) habits.push({t:`Queen stayed home early in ${eq} of ${RW.length} wins`,keep:"keep bringing pieces out before the queen"}); }
  return {wins:W.length,recWins:RW.length,jobs:jobs.map(j=>Object.assign(j,{keep:KEEP[j.nm]})),habits:habits.slice(0,2)}; }
/* ---------- HTML (short, plain) ---------- */
const bar=(l,v,t,c)=>`<div class="p76r"><span>${l}</span><i><b style="width:${v}%;background:${c}"></b></i><em>${t}</em></div>`;
function html(recs,tt3){ const w=whereLose(recs), a=afterLoss(recs), s=whenWinning(recs), p=winPattern(tt3,recs); let h="";
  h+=`<div class="pbox p76" id="p76where"><h3 class="ph3">💥 Where you lose</h3>`;
  if(w.n){ h+=[0,1,2].map(i=>bar(["♟ Opening","⚔ Middlegame","♚ Endgame"][i],w.pct[i],`${w.counts[i]} <small>(${w.pct[i]}%)</small>`,i===w.top?"#ca3431":"#e9a09e")).join("");
    h+=`<p class="pm">In <b>${w.pct[w.top]}%</b> of your lost games, the move that lost it came in the <b>${PH[w.top]}</b>. Train that stage first.</p>`; }
  else h+=`<p class="pm">${w.losses?"No clear losing move found yet.":"No lost games analyzed yet. 🎉"}</p>`;
  h+=`</div><div class="pbox p76" id="p76tilt"><h3 class="ph3">😤 Tilt and rushing</h3><ul class="pul">`;
  const L=[];
  if(a.ok){ if(a.faster||a.worse) L.push(`After a loss you ${a.faster?`play faster (${a.after.avg}s a move vs ${a.rest.avg}s)`:""}${a.faster&&a.worse?" and ":""}${a.worse?`make more mistakes (${a.after.bad} a game vs ${a.rest.bad})`:""}. Take a short break before the next game.`);
    else L.push(`After a loss you play about the same as usual (${a.after.bad??"–"} vs ${a.rest.bad??"–"} mistakes a game). 👍`); }
  else L.push(`Need 3+ games played right after a loss to check tilt.`);
  if(s.ok){ if(s.faster||s.worse) L.push(`When you're winning you ${s.faster?`speed up (${s.up.avg}s a move vs ${s.rest.avg}s)`:""}${s.faster&&s.worse?" and ":""}${s.worse?`slip more (${s.up.badPct}% mistakes vs ${s.rest.badPct}%)`:""}. Slow down and finish calmly.`);
    else L.push(`When you're winning you stay careful (${s.up.badPct}% mistakes vs ${s.rest.badPct}%). 👍`); }
  else L.push(s.hasEval?`Need more winning positions to check rushing.`:`Rushing check starts with games you analyze from now on.`);
  h+=L.map(x=>`<li>${x}</li>`).join("")+`</ul><a href="#" class="p76link" id="p76diary">📓 Open my Tilt Diary</a></div>`;
  h+=`<div class="pbox p76 p76win" id="p76win"><h3 class="ph3">🏆 Your winning pattern</h3>`;
  const items=p.jobs.map(j=>`<li><b>${j.nm}</b> (${j.pct}% of wins): ${j.keep}.</li>`).concat(p.habits.map(x=>`<li>${x.t}: ${x.keep}.</li>`)).slice(0,4);
  h+=items.length?`<p class="pm">In your wins you do this. Keep doing it:</p><ul class="pul">${items.join("")}</ul>`:`<p class="pm">Win a few more analyzed games (or tap “Score my last 50 Chess.com games” above) to see it.</p>`;
  return h+`</div>`; }
function wire(root){ const d=root.querySelector("#p76diary"); if(d) d.onclick=e=>{ e.preventDefault(); try{ W.CRMind64&&CRMind64.diary(); }catch(x){ console.error(x); } }; }
W.CRPat76={decisive,whereLose,afterLoss,whenWinning,winPattern,html,wire,order};
})(typeof window!=="undefined"?window:globalThis);
