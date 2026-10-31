/* v58: coach report extras: snapshot, strengths, since last time, next check-in + reminder. Rule-based, from the app's own data. */
(function(){ "use strict"; if(window.CR58) return;
const E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const LG=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, LSv=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const KC="chessReview.v58.coach", KG="chessReview.v56.charts.games", KA="chessReview.v56.charts.an", NEED=5;
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
function games(){ const c=LG(KG,null); return c&&c.games||[]; }
function goal(){ try{ if(window.CRGoal) return CRGoal.get(); }catch(e){} return 0; }
/* 5. snapshot */
function snap(G){ const m=G.d.meta, me=G.me, gr=+(me==="w"?m.white_elo:m.black_elo)||0, gs=games(), last=gs.slice(-10), g0=gs.slice().reverse().find(g=>g.e);
  const W=last.filter(g=>g.r===1).length, D=last.filter(g=>g.r===.5).length, L=last.length-W-D, gl=goal(), RN=window.CRRating&&CRRating.now(), now=RN&&RN.r?RN.r:null; /* v69: never show a game's rating as "rating now" */
  const dots=last.map(g=>`<i class="${g.r===1?"w":g.r===.5?"d":"l"}" title="${g.r===1?"Win":g.r===.5?"Draw":"Loss"}">${g.r===1?"W":g.r===.5?"D":"L"}</i>`).join("");
  return `<div class="co17mis cr58snap" id="cr58snap"><h3 style="margin:0 0 6px">📸 Snapshot</h3><div class="cr58g">
   <div>${window.CRRating?CRRating.html(now||""):`<b>${now||"–"}</b>`}<span>rating now</span>${window.CRRating?CRRating.meta():""}</div><div><b>${gl||"–"}</b><span>${gl?"your goal":"no goal set"}</span></div><div><b>${last.length?`${W}-${D}-${L}`:"–"}</b><span>${last.length?`last ${last.length} games (W-D-L)`:"recent results"}</span></div></div>
   ${dots?`<div class="cr58dots">${dots}</div><p class="co17sm">Oldest on the left.</p>`:`<p class="co17sm">${window.CRUser&&((CRUser.info()||{}).cc)?"Getting your recent results from Chess.com…":"Add your Chess.com or Lichess username to see recent results."}</p>`}
   ${gl&&now?`<p>${now>=gl?`You have reached your goal of <b>${gl}</b>. Time to set a new one.`:`<b class="cr68go">${gl-now}</b> points to go to your goal of ${gl}.`}</p>`:""}</div>`; }
/* 6. strengths: 1-2 real things from this game */
function strengths(G){ const S=[], mine=G.P.filter(p=>p.user), phN=["opening","middlegame","endgame"];
  const top=mine.filter(p=>["best","excellent","great","brilliant"].includes(p.cls)).length;
  if(G.counts.b===0&&mine.length>=10) S.push(`No blunders in ${mine.length} moves. You kept your pieces safe.`);
  G.ph.forEach((x,j)=>{ if(x&&x.n>=6&&x.bad===0) S.push(`A clean ${phN[j]}: ${x.n} moves with no big mistake.`); });
  if(G.acc!=null&&G.acc>=80) S.push(`Accuracy of ${Math.round(G.acc)}%: most of your moves were close to the engine's choice.`);
  if(top>=5) S.push(`${top} of your moves matched the engine's top choices.`);
  const res=G.d.meta.result, me=G.me; if((res==="1-0")===(me==="w")&&res!=="1/2-1/2"&&res!=="*") S.push("You finished the job and won the game.");
  const out=S.slice(0,2);
  return `<h3>💪 What you did well</h3><div class="co17good">${out.length?`<ul class="co17list">${out.map(x=>`<li>${E_(x)}</li>`).join("")}</ul>`:"<p>This one was hard: no clear strength stood out. The fixes below matter more.</p>"}</div>`; }
/* 7. since last time, from the Charts data (engine-checked games) */
function metrics(){ const gs=games(), A=LG(KA,{}), done=gs.filter(g=>A[g.id]).slice(-10); if(done.length<3) return null;
  let hung=null; try{ if(window.CRBlunders){ const ids=new Set(done.map(g=>g.id)); const h=CRBlunders.hungSeries(done).filter(x=>x.src==="g"); hung=mean(h.map(x=>x.n)); } }catch(e){}
  let acc=null; try{ acc=window.CRCharts&&CRCharts._accOf?mean(done.map(g=>CRCharts._accOf(A[g.id])).filter(x=>x!=null)):null; }catch(e){}
  const ph={o:0,m:0,e:0}; done.forEach(g=>A[g.id].forEach(([p,f,l])=>{ if(l>=300&&ph[f]!=null) ph[f]++; }));
  return {t:Date.now(),n:done.length,last:done[done.length-1].id,hung,acc,ph:{o:ph.o/done.length,m:ph.m/done.length,e:ph.e/done.length}}; }
function since(){ const now=metrics(), C=LG(KC,{});
  if(!now) return `<h3>📈 Since last time</h3><div class="co17mis"><p class="co17sm">Not analysed yet. Open <b>My charts</b> and tap <b>Analyse my newest games</b> (at least 3 games) to see your progress here.</p></div>`;
  if(!C.cur||C.cur.last!==now.last){ C.prev=C.cur||null; C.cur=now; LSv(KC,C); }
  const P=C.prev, f1=x=>x==null?"–":(Math.round(x*10)/10).toString(), f0=x=>x==null?"–":Math.round(x)+"%";
  const row=(l,a,b,fmt,lower)=>{ let tr=""; if(a!=null&&b!=null){ const d=b-a; tr=Math.abs(d)<(fmt===f0?2:.15)?"➖ same":(d<0)===lower?"✅ better":"⚠️ worse"; } return `<tr><td>${l}</td><td>${a==null?"–":fmt(a)}</td><td><b>${fmt(b)}</b></td><td>${tr}</td></tr>`; };
  const tb=`<table class="co17tab cr58t"><tr><th></th><th>${P?"Last time":""}</th><th>Now</th><th></th></tr>
   ${row("Hung pieces a game",P&&P.hung,now.hung,f1,true)}${row("Accuracy (estimate)",P&&P.acc,now.acc,f0,false)}
   ${row("Big mistakes a game: opening",P&&P.ph.o,now.ph.o,f1,true)}${row("· middlegame",P&&P.ph.m,now.ph.m,f1,true)}${row("· endgame",P&&P.ph.e,now.ph.e,f1,true)}</table>`;
  return `<h3>📈 Since last time</h3><div class="co17mis">${tb}<p class="co17sm">${P?`From your ${now.n} newest engine-checked games, compared with your last report (${new Date(P.t).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}).`:`Your first report with these numbers: this is your starting point. Next time you will see what changed.`}</p></div>`; }
/* 8. next check-in + in-app reminder */
function checkin(){ const C=LG(KC,{}), n=games().length; C.chk={t:Date.now(),need:NEED,n}; LSv(KC,C);
  return `<div class="co17mis cr58chk" id="cr58chk"><p>🗓 <b>Next check-in:</b> review again after <b>${NEED} more games</b>. The app will remind you on the home screen.</p></div>`; }
function due(){ const C=LG(KC,{}); if(!C.chk) return 0; const after=games().filter(g=>g.t>C.chk.t).length; return after>=C.chk.need?after:0; }
function banner(){ const hs=document.getElementById("hs"); if(!hs||document.getElementById("cr58rem")) return; const n=due(); if(!n) return;
  const d=document.createElement("div"); d.id="cr58rem"; d.className="cr58rem"; d.innerHTML=`<b>🎓 Coach check-in due</b><span>You have played ${n} games since your last coach report.</span><button type="button" class="cr58go">Open my coach report</button><button type="button" class="cr58x" aria-label="Later">Later</button>`;
  hs.insertBefore(d,hs.firstChild.nextSibling);
  d.querySelector(".cr58go").onclick=()=>{ try{ CRHome.setMode("app",true); }catch(e){} try{ Coach17.open("gm"); }catch(e){ console.warn(e); } d.remove(); };
  d.querySelector(".cr58x").onclick=()=>{ const C=LG(KC,{}); if(C.chk){ C.chk.t=Date.now(); C.chk.need=2; LSv(KC,C); } d.remove(); }; }
const CSS=`.cr58g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.cr58g div{border:1px solid var(--line,#ddd);border-radius:10px;padding:6px;text-align:center;background:#fff}.cr58g b{display:block;font-size:20px}.cr58g span{font-size:11.5px;color:var(--mute,#777)}
.cr58dots{display:flex;gap:4px;margin:8px 0 0;flex-wrap:wrap}.cr58dots i{font-style:normal;font-weight:800;font-size:12px;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff}.cr58dots .w{background:#2e7d32}.cr58dots .d{background:#8a8a8a}.cr58dots .l{background:#c62828}
.cr58t{width:100%;font-size:13.5px}.cr58t td,.cr58t th{padding:4px 3px;text-align:center}.cr58t td:first-child{text-align:left}
.cr58rem{display:flex;flex-direction:column;gap:6px;border:2px solid #3b6fb6;background:#eef4ff;color:#1b2b44;border-radius:14px;padding:10px 12px;margin:8px 0}.cr58rem button{min-height:44px;border-radius:10px;border:1px solid #3b6fb6;font:inherit;font-weight:700}.cr58go{background:#3b6fb6;color:#fff}.cr58x{background:#fff;color:#3b6fb6}
.cr58link{display:block;width:100%;min-height:44px;margin-top:8px;border-radius:10px;border:1px solid #3b6fb6;background:#fff;color:#3b6fb6;font:inherit;font-weight:700}
html.dark-mode .cr58g div{background:#262626}html.dark-mode .cr58rem{background:#1d2633;color:#eee}`;
{ const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
setTimeout(banner,1500); setInterval(banner,20000);
window.CR58={snap,strengths,since,checkin,due,banner,metrics,NEED};
})();
