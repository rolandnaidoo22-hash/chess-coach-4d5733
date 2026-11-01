/* v73: Quick review, full version. One short engine pass over the game finds every mistake, slip and missed chance in
   your moves, plus open-board chances you didn't use (open files, free pieces, strong squares). Grouped into
   Opening / Middlegame / Endgame, filled in as the check runs, saved per game. All text comes from local templates. */
(function(){ "use strict"; if(window.CRQuick74) return; window.CRQuick72=window.CRQuick73=window.CRQuick74={}; /* v72's file is not loaded any more */
const $=id=>document.getElementById(id), B=document.body, E_=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let wyOpen=false; const BUDGET=36000, CK="chessReview.v74.quick";
const NAME={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"}, VAL={p:1,n:3,b:3,r:5,q:9,k:0}, FI="abcdefgh";
const TY={blunder:["??","Blunder","#ca3431"],mistake:["?","Mistake","#e2852a"],inacc:["?!","Inaccuracy","#d6b52a"],miss:["✖","Missed win","#8e44ad"],
  free:["🎁","Free piece missed","#2f6fd6"],file:["📂","Open file not used","#2f6fd6"],outpost:["🏰","Strong square not used","#2f6fd6"]};
const PH=[["open","Opening"],["mid","Middlegame"],["end","Endgame"]];
const css=`
#cr66seg button.on72{background:var(--card,#1c1f26);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.3)}
body.cr72q #cr66seg button.on:not([data-t=quick]){background:none;font-weight:400;box-shadow:none}
#cr66seg button{font-size:13.5px}
#cr72{display:none}body.cr72q #cr72{display:flex;flex-direction:column;position:fixed;left:0;right:0;bottom:0;top:var(--cr72t,150px);z-index:58;background:var(--bg,#f5f3ee);padding:6px 8px 8px;overflow:auto}
#cr72 .gl{display:flex;flex-direction:column;gap:6px}
#cr72 .g{display:flex;align-items:center;gap:10px;width:100%;text-align:left;min-height:54px;border-radius:12px;border:1px solid var(--line,rgba(127,127,127,.35));background:var(--card,#fff);color:inherit;font:inherit;padding:6px 10px}
#cr72 .g.L{border:2px solid #ca3431;background:rgba(202,52,49,.08)}
#cr72 .g .r{min-width:52px;text-align:center;font-weight:800;font-size:13px;border-radius:8px;padding:4px 0;background:rgba(127,127,127,.18)}
#cr72 .g.L .r{background:#ca3431;color:#fff}#cr72 .g.W .r{background:#81b64c;color:#fff}
#cr72 .g .t{flex:1;line-height:1.25}#cr72 .g .t small{display:block;opacity:.7;font-size:12.5px}#cr72 .g .go{font-weight:700;color:var(--accent,#2f6fd6);white-space:nowrap}
#cr72 .hint{margin:2px 0 8px;font-size:14px;opacity:.85}
#cr72 .pb{height:8px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden;margin:4px 0 8px}#cr72 .pb i{display:block;height:100%;width:0;background:var(--accent,#2f6fd6);transition:width .2s}
#cr72 .hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}#cr72 .hd b{flex:1;font-size:15px}
#cr72 .bd{align-self:center;line-height:0}#cr72 .bd svg{width:100%;height:100%;border-radius:6px}
#cr72 .wy{font-size:14px;line-height:1.35;margin:0 0 6px;padding:7px 10px;border-radius:12px;background:#eef6f0;border-left:5px solid #2e9b4f}#cr72 .wyb{margin-left:6px;padding:2px 10px;border-radius:10px;border:1px solid #2e9b4f;background:none;color:#2e9b4f;font-weight:700;font-size:13px}html.dark-mode #cr72 .wy{background:#1f2e24;color:#eee}
#cr72 .tx{font-size:15px;line-height:1.35;margin:6px 0;padding:8px 10px;border-radius:12px;background:var(--card,#fff);border-left:5px solid #ca3431}
#cr72 .lg{display:flex;gap:10px;font-size:12px;opacity:.85;flex-wrap:wrap}#cr72 .lg i{display:inline-block;width:14px;height:4px;border-radius:2px;vertical-align:middle;margin-right:3px}
#cr72 .rw{display:flex;gap:8px;margin-top:6px}#cr72 .rw button{flex:1;min-height:44px}
#cr72 .sec{margin:8px 0 2px;border-radius:12px;background:var(--card,#fff);border:1px solid var(--line,rgba(127,127,127,.3));padding:4px 8px}
#cr72 .sec h3{display:flex;align-items:center;margin:4px 0;font-size:15.5px}#cr72 .sec h3 span{flex:1}#cr72 .sec h3 em{font-style:normal;font-size:13px;font-weight:800;border-radius:10px;padding:1px 9px;background:rgba(127,127,127,.18)}
#cr72 .sec .emp{font-size:14px;opacity:.75;margin:2px 0 6px}
#cr72 .it{display:flex;align-items:center;gap:8px;width:100%;text-align:left;min-height:46px;border:0;border-top:1px solid var(--line,rgba(127,127,127,.2));background:none;color:inherit;font:inherit;padding:4px 2px}
#cr72 .it .ic{min-width:34px;height:26px;border-radius:8px;color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
#cr72 .it .l{flex:1;font-size:13.5px;line-height:1.25}#cr72 .it .l b{display:block;font-size:14px}#cr72 .it .ch{opacity:.5}
#cr72 .worst{border:2px solid #ca3431}
html.dark-mode #cr72 .g,html.dark-mode #cr72 .tx,html.dark-mode #cr72 .sec{background:#262626;color:#eee}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
let on=false, job=null, view={k:"list"};
const cache=()=>{ try{ return JSON.parse(localStorage.getItem(CK)||"{}"); }catch(e){ return {}; } };
const save=(id,v)=>{ try{ const c=cache(); c[id]=v; const ks=Object.keys(c); while(ks.length>15) delete c[ks.shift()]; localStorage.setItem(CK,JSON.stringify(c)); }catch(e){} };
function games(){ try{ return window.CRSync?CRSync.list():[]; }catch(e){ return []; } }
function build(){ const seg=$("cr66seg"); if(!seg) return false;
  if(!seg.querySelector("[data-t=quick]")){ seg.insertAdjacentHTML("beforeend",`<button type="button" data-t="quick">⚡ Quick review</button>`);
    seg.querySelector("[data-t=quick]").onclick=e=>{ e.stopPropagation(); open(); };
    seg.querySelectorAll("button:not([data-t=quick])").forEach(b=>b.addEventListener("click",()=>close(),true));
    const nw=$("cr66new"); if(nw) nw.addEventListener("click",()=>close(),true); }
  if(!$("cr72")) B.insertAdjacentHTML("beforeend",`<div id="cr72" role="tabpanel" aria-label="Quick review"></div>`);
  return true; }
function place(){ const s=$("cr66seg"); if(s){ const r=s.getBoundingClientRect(); B.style.setProperty("--cr72t",Math.max(0,Math.round(r.bottom+4))+"px"); } }
function open(){ if(!build()) return; on=true; B.classList.add("cr72q"); window.scrollTo(0,0); place(); paint(); const q=$("cr66seg").querySelector("[data-t=quick]"); q.classList.add("on72"); q.setAttribute("aria-selected","true");
  try{ if(window.CRSync&&!games().length) CRSync.pull(false).then(()=>{ if(view.k==="list") paint(); }); }catch(e){} }
function close(){ if(!on) return; on=false; B.classList.remove("cr72q"); const q=document.querySelector("#cr66seg [data-t=quick]"); if(q){ q.classList.remove("on72"); q.setAttribute("aria-selected","false"); } }
const mvNo=ply=>Math.ceil(ply/2);
function itemRow(it,k,cls){ const t=TY[it.type]; return `<button type="button" class="it ${cls||""}" data-k="${k}"><span class="ic" style="background:${t[2]}">${t[0]}</span><span class="l"><b>Move ${mvNo(it.ply)} · ${t[1]}</b>${E_(it.short)}</span><span class="ch">›</span></button>`; }
function paint(){ const p=$("cr72"); if(!p) return; place();
  if(view.k==="list"){ const L=games(), C=cache();
    p.innerHTML=`<p class="hint">Pick a game. You'll see every mistake, missed chance and unused open space, split into opening, middlegame and endgame.</p>`+(L.length?`<div class="gl">`+L.map(x=>{ const c=x.res==="Lost"?"L":x.res==="Won"?"W":"D", cc=C[x.url];
      return `<button type="button" class="g ${c}" data-u="${E_(x.url)}"><span class="r">${x.res==="Lost"?"Lost":x.res==="Won"?"Won":"Draw"}</span><span class="t"><b>vs ${E_(x.op)}${x.or?` (${E_(x.or)})`:""}</b><small>${new Date(x.t*1000).toLocaleDateString()} · ${E_(x.tc||"")} · you were ${x.me==="w"?"White":"Black"}</small></span><span class="go">${cc&&cc.done?"See it ›":"Check ›"}</span></button>`; }).join("")+`</div>`
      :`<p class="hint">No games yet. Add your Chess.com username, then tap below.</p>${window.CRSync?CRSync.bar():""}`);
    p.querySelectorAll(".g").forEach(b=>b.onclick=()=>run(b.dataset.u)); return; }
  if(view.k==="rev"){ const r=view.r, g=view.g, I=r.items, sc=p.scrollTop;
    const worst=r.done?I.map((it,k)=>[it,k]).filter(([it])=>it.d>0).sort((a,b)=>b[0].d-a[0].d).slice(0,3):[];
    let h=`<div class="hd"><b>vs ${E_(g.op)} · ${g.res}</b><button type="button" class="btn" id="cr72l">‹ Games</button></div>`;
    if(!r.done) h+=`<p class="hint" id="cr72pt" style="margin:0">Checking move ${mvNo(r.at||1)} of ${mvNo(r.n||1)}… sections fill in as it goes.</p><div class="pb"><i id="cr72pf" style="width:${Math.round(100*(r.at||0)/((r.n||1)+1))}%"></i></div>`;
    else h+=`<div class="sec worst" id="cr72worst"><h3><span>🔻 Worst 3 moments</span></h3>${worst.length?worst.map(([it,k])=>itemRow(it,k)).join(""):`<p class="emp">No big mistakes in this game 👍</p>`}</div>`;
    PH.forEach(([ph,lab])=>{ const L=I.map((it,k)=>[it,k]).filter(([it])=>it.ph===ph);
      h+=`<div class="sec" data-ph="${ph}"><h3><span>${lab}</span><em>${L.length}</em></h3>${L.length?L.map(([it,k])=>itemRow(it,k)).join(""):`<p class="emp">${r.done||(r.ph&&PH.findIndex(x=>x[0]===r.ph)>PH.findIndex(x=>x[0]===ph))?(r.reached&&r.reached[ph]?"No mistakes here 👍":"This game didn't reach this stage."):"Checking…"}</p>`}</div>`; });
    if(r.done) h+=`<div class="rw"><button type="button" class="btn" id="cr72f">📋 Open full review</button></div>`;
    else h+=`<div class="rw"><button type="button" class="btn" id="cr72c">Cancel</button></div>`;
    p.innerHTML=h; p.scrollTop=sc;
    $("cr72l").onclick=()=>{ if(job&&!r.done) job.stop=true; view={k:"list"}; paint(); };
    if($("cr72c")) $("cr72c").onclick=()=>{ if(job) job.stop=true; view={k:"list"}; paint(); }; if($("cr72f")) $("cr72f").onclick=()=>full(g);
    p.querySelectorAll(".it").forEach(b=>b.onclick=()=>{ view={k:"show",g,r,i:+b.dataset.k,back:p.scrollTop}; paint(); }); return; }
  if(view.k==="show"){ const I=view.r.items, i=view.i, m=I[i], g=view.g, t=TY[m.type];
    const top=$("cr72").getBoundingClientRect().top, room=innerHeight-top-12-236, sz=Math.max(220,Math.min(innerWidth-16,room,560));
    p.innerHTML=`<div class="hd"><b>${i+1} of ${I.length} · Move ${mvNo(m.ply)} · ${t[1]}</b><button type="button" class="btn" id="cr72l">‹ List</button></div>
      <div class="bd" style="width:${sz}px;height:${sz}px">${board(m.fen,g.me,m)}</div>
      <div class="lg"><span><i style="background:#d23c3c"></i>your move</span>${m.best&&m.best!==m.uci&&m.best!==m.sug?`<span><i style="background:#2e9b4f"></i>better move</span>`:""}${m.th?`<span><i style="background:#e8a11b"></i>their threat</span>`:""}${m.sug||m.hl?`<span><i style="background:#2f6fd6"></i>missed space</span>`:""}</div>
      <div class="tx" id="cr72tx" style="border-left-color:${t[2]}">${E_(m.text)}${m.why?`<button type="button" class="wyb" id="cr74wb" aria-expanded="${wyOpen}">Why?</button>`:""}</div>${m.why&&wyOpen?`<div class="wy" id="cr74why"><b>Why it's better:</b> ${E_(m.why)}</div>`:""}
      <div class="rw"><button type="button" class="btn" id="cr72b" ${i===0?"disabled":""}>‹ Back</button><button type="button" class="btn primary" id="cr72n">${i===I.length-1?"Done ✓":"Next ›"}</button></div>`;
    if($("cr74wb")) $("cr74wb").onclick=()=>{ wyOpen=!wyOpen; paint(); };
    const back=()=>{ const b=view.back; view={k:"rev",g,r:view.r}; paint(); $("cr72").scrollTop=b||0; };
    $("cr72l").onclick=back; $("cr72b").onclick=()=>{ view.i--; paint(); }; $("cr72n").onclick=()=>{ if(view.i<I.length-1){ view.i++; paint(); } else back(); }; }
}
function full(g){ close(); try{ CRRev66.tab("game"); }catch(e){} try{ const pi=$("pgnIn"); if(pi) pi.value=g.pgn; if(window.CRSync) CRSync.seen(g.url); ReviewApp.analyze(g.pgn); }catch(e){ console.error(e); } }
function board(fen,me,m){ const XY=sq=>{ const f=FI.indexOf(sq[0]), r=+sq[1]-1; return me==="w"?[f*45,(7-r)*45]:[(7-f)*45,r*45]; };
  let s=`<svg viewBox="0 0 360 360" role="img" aria-label="Board at this moment">`;
  for(let f=0;f<8;f++)for(let r=0;r<8;r++){ const [x,y]=XY(FI[f]+(r+1)); s+=`<rect x="${x}" y="${y}" width="45" height="45" fill="${(f+r)%2?"#ebecd0":"#779556"}"/>`; }
  (m.hl||[]).forEach(q=>{ const [x,y]=XY(q); s+=`<rect class="hlb" x="${x}" y="${y}" width="45" height="45" fill="#2f6fd6" opacity=".38"/>`; });
  [m.uci.slice(0,2),m.uci.slice(2,4)].forEach(q=>{ const [x,y]=XY(q); s+=`<rect x="${x}" y="${y}" width="45" height="45" fill="#f6eb72" opacity=".5"/>`; });
  for(let i=0;i<8;i++){ const fl=me==="w"?FI[i]:"hgfedcba"[i], rk=me==="w"?8-i:i+1; s+=`<text x="${i*45+43}" y="358" font-size="9" text-anchor="end" fill="#333" font-weight="700">${fl}</text><text x="2" y="${i*45+10}" font-size="9" fill="#333" font-weight="700">${rk}</text>`; }
  fen.split(" ")[0].split("/").forEach((row,ri)=>{ let f=0; for(const ch of row){ if(/\d/.test(ch)){ f+=+ch; continue; } const [x,y]=XY(FI[f]+(8-ri)); s+=`<use href="#pc-${ch===ch.toUpperCase()?"w":"b"}${ch.toUpperCase()}" x="${x}" y="${y}" width="45" height="45"/>`; f++; } });
  const ar=(u,c,dash)=>{ const [x1,y1]=XY(u.slice(0,2)).map(v=>v+22.5), [x2,y2]=XY(u.slice(2,4)).map(v=>v+22.5), dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, ex=x2-ux*14, ey=y2-uy*14;
    return `<g class="ar" data-c="${c}"><line x1="${x1+ux*8}" y1="${y1+uy*8}" x2="${ex}" y2="${ey}" stroke="${c}" stroke-width="${dash?6:8}" stroke-linecap="round" ${dash?'stroke-dasharray="9 6"':""} opacity=".85"/><polygon points="${x2},${y2} ${ex-uy*11},${ey+ux*11} ${ex+uy*11},${ey-ux*11}" fill="${c}" opacity=".92"/></g>`; };
  if(m.th) s+=ar(m.th,"#e8a11b",true); if(m.sug) s+=ar(m.sug,"#2f6fd6"); if(m.best&&m.best!==m.uci&&m.best!==m.sug) s+=ar(m.best,"#2e9b4f"); s+=ar(m.uci,"#d23c3c");
  return s+`</svg>`; }
/* ---- board facts from a FEN (index = file + 8*rank, a1 = 0) ---- */
function bd(fen){ const b=new Array(64).fill(null); fen.split(" ")[0].split("/").forEach((row,ri)=>{ let f=0; const r=7-ri; for(const ch of row){ if(/\d/.test(ch)) f+=+ch; else { b[f+8*r]={t:ch.toLowerCase(),c:ch===ch.toUpperCase()?"w":"b"}; f++; } } }); return b; }
const sqn=i=>FI[i%8]+(1+(i>>3)), idx=s=>FI.indexOf(s[0])+8*(+s[1]-1);
function atk(b,i){ const p=b[i]; if(!p) return []; const f=i%8, r=i>>3, o=[]; const add=(a,c)=>{ const nf=f+a, nr=r+c; if(nf>=0&&nf<8&&nr>=0&&nr<8) o.push(nf+8*nr); };
  const sl=D=>D.forEach(([a,c])=>{ let nf=f+a, nr=r+c; while(nf>=0&&nf<8&&nr>=0&&nr<8){ const s=nf+8*nr; o.push(s); if(b[s]) break; nf+=a; nr+=c; } });
  if(p.t==="p"){ const d=p.c==="w"?1:-1; add(-1,d); add(1,d); } else if(p.t==="n") [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]].forEach(([a,c])=>add(a,c));
  else if(p.t==="k"){ for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++) if(a||c) add(a,c); }
  if(p.t==="b"||p.t==="q") sl([[1,1],[1,-1],[-1,1],[-1,-1]]); if(p.t==="r"||p.t==="q") sl([[1,0],[-1,0],[0,1],[0,-1]]); return o; }
const by=(b,c,s)=>{ const o=[]; for(let i=0;i<64;i++) if(b[i]&&b[i].c===c&&atk(b,i).includes(s)) o.push(i); return o; };
function phase(fen,ply){ const b=bd(fen); let mm=0; b.forEach(p=>{ if(p&&p.t!=="p"&&p.t!=="k") mm++; }); if(mm<=6) return "end";
  let wb=0,bb=0; for(let s=0;s<8;s++) if(b[s]&&b[s].c==="w") wb++; for(let s=56;s<64;s++) if(b[s]&&b[s].c==="b") bb++;
  if(ply>24||mm<=10||wb<4||bb<4) return "mid"; return "open"; }
const isFree=(b,me,s)=>{ const p=b[s]; if(!p||p.c===me||p.t==="k"||VAL[p.t]<3) return false; const a=by(b,me,s); if(!a.length) return false; const d=by(b,p.c,s); return !d.length||Math.min(...a.map(i=>VAL[b[i].t]))<VAL[p.t]; };
/* ---- v74: why the better move is better (facts checked on the board only) ---- */
const CEN=["d4","e4","d5","e5"].map(x=>FI.indexOf(x[0])+8*(+x[1]-1));
function play(b,u){ const n=b.slice(), f=idx(u), t=idx(u.slice(2,4)), p=n[f]; if(!p) return n;
  if(p.t==="p"&&(f%8)!==(t%8)&&!n[t]) n[t-(p.c==="w"?8:-8)]=null;
  if(p.t==="k"&&Math.abs((f%8)-(t%8))===2){ const r=t>f?f+3:f-4, rt=t>f?f+1:f-1; n[rt]=n[r]; n[r]=null; }
  n[t]=u.length>4?{t:u[4],c:p.c}:p; n[f]=null; return n; }
const opp=c=>c==="w"?"b":"w";
// my pieces (value>=3) that the opponent can win: undefended, or attacked by something cheaper
function hanging(b,me){ const o=[]; for(let s=0;s<64;s++){ const p=b[s]; if(!p||p.c!==me||p.t==="k"||VAL[p.t]<3) continue; const a=by(b,opp(me),s); if(!a.length) continue;
  if(!by(b,me,s).length||Math.min(...a.map(i=>VAL[b[i].t]))<VAL[p.t]) o.push(s); } return o; }
const inChk=(b,c)=>{ const k=b.findIndex(p=>p&&p.t==="k"&&p.c===c); return k>=0&&by(b,opp(c),k).length>0; };
const ord=["pawn","knight","bishop","rook","queen","king"];
function explain(b,me,uci,best,pvB,pvA,mv,i,ph,d,scA){
  const good=[], bad=[]; const nm=s=>NAME[(b[s]||{t:"p"}).t];
  if(best&&best!==uci){ const f=idx(best), t=idx(best.slice(2,4)), p=b[f], ba=play(b,best), tg=b[t], home=me==="w"?0:7;
    if(p){ const pn=NAME[p.t];
      if(p.t==="k"&&Math.abs((f%8)-(t%8))===2) good.push("it castles, tucking your king away safely and bringing a rook into the game");
      if(tg&&tg.c!==me){ if(!by(b,opp(me),t).length) good.push(`it wins their ${NAME[tg.t]} for free`); else if(VAL[tg.t]>VAL[p.t]) good.push(`it wins material: your ${pn} takes their ${NAME[tg.t]}`); else good.push(`it takes their ${NAME[tg.t]}`); }
      const hb=hanging(b,me), ha=hanging(ba,me);
      const saved=hb.filter(s=>!ha.includes(s===f?t:s)&&!(tg&&s===f&&false));
      if(saved.length&&!(tg&&tg.c!==me)){ const s=saved[0], who=by(b,opp(me),s)[0]; good.push(`it ${s===f?"moves":"protects"} your ${nm(s)} on ${sqn(s)}${s===f?" out of danger":""}, which their ${nm(who)} on ${sqn(who)} was attacking`); }
      if((p.t==="n"||p.t==="b")&&(f>>3)===home&&ph!=="end") good.push(`it brings a new piece (your ${pn}) into play`);
      if(ph==="open"&&p.t!=="k"&&p.t!=="q"&&(CEN.includes(t)||atk(ba,t).filter(x=>CEN.includes(x)).length>=1)) good.push(`it helps control the centre`);
      if(inChk(ba,opp(me))) good.push("it gives check");
      else { const hit=atk(ba,t).filter(s=>ba[s]&&ba[s].c!==me&&ba[s].t!=="p"&&ba[s].t!=="k"&&(VAL[ba[s].t]>VAL[p.t]||!by(ba,opp(me),s).length)); if(hit.length&&!(tg&&tg.c!==me)) good.push(`it attacks their ${NAME[ba[hit[0]].t]} on ${sqn(hit[0])}`); }
    } }
  // what was wrong with your move
  const f=idx(uci), t=idx(uci.slice(2,4)), p=b[f], ab=play(b,uci);
  if(p){ const pn=NAME[p.t], rep=pvA&&pvA[0];
    if(scA&&scA.mate!=null&&scA.mate>0&&rep){ const rp0=ab[idx(rep)]; if(rp0) bad.push(`it allowed a forced checkmate, starting with their ${NAME[rp0.t]} to ${rep.slice(2,4)}`); }
    const ra=rep&&rep.length>=4?play(ab,rep):null, rp=rep?ab[idx(rep)]:null;
    if(ra&&rp&&rp.c!==me&&!(ab[idx(rep.slice(2,4))])&&atk(ra,idx(rep.slice(2,4))).includes(t)&&VAL[p.t]>VAL[rp.t]&&p.t!=="p")
      bad.push(`after your ${pn} move they can play ${rp.t==="p"?"a pawn":"their "+NAME[rp.t]} to ${rep.slice(2,4)}, hitting your ${pn}${p.t==="q"&&ph==="open"?", so they gain time and your queen has to move again":" so it has to move again"}`);
    const hb=hanging(b,me).filter(s=>s!==f), ha=hanging(ab,me);
    const ign=hb.filter(s=>ha.includes(s));
    if(ign.length){ const s=ign[0], who=by(ab,opp(me),s)[0]; bad.push(`it ignored the threat to your ${nm(s)} on ${sqn(s)} from their ${NAME[ab[who].t]}`); }
    else if(ha.includes(t)&&!(b[t]&&b[t].c!==me)) bad.push(`it left your ${pn} on ${uci.slice(2,4)} where they can win it`);
    if(ph==="open"&&!bad.length&&p.t!=="p"&&p.t!=="k"&&i>=2&&mv[i-2]&&mv[i-2].uci.slice(2,4)===uci.slice(0,2)) bad.push(`it moved the same ${pn} twice while other pieces were still at home`);
    if(!bad.length&&p.t==="q"&&ph==="open"&&i<20) { const kids=b.filter((q,s)=>q&&q.c===me&&(q.t==="n"||q.t==="b")&&(s>>3)===(me==="w"?0:7)).length; if(kids>=2) bad.push(`it brought your queen out early while ${kids} of your knights and bishops were still at home`); }
  }
  const cap=x=>x[0].toUpperCase()+x.slice(1);
  const g=good.slice(0,2), out=[];
  if(!g.length&&best&&best!==uci&&d>=5) g.push(`a deeper check of the position shows it keeps about ${Math.round(d)}% more of your winning chances than your move`);
  if(g.length) out.push(cap(g.join(", and "))+".");
  if(bad.length) out.push("Your move: "+bad[0]+".");
  return out.join(" ");
}
/* ---- the engine pass ---- */
const wp=sc=>{ const cp=sc.mate!=null?(sc.mate>0?10000:-10000):sc.cp; return 50+50*(2/(1+Math.exp(-0.00368208*Math.max(-10000,Math.min(10000,cp))))-1); };
let ENG=null; async function eng(){ if(ENG) return ENG; ENG=new Analyzer.Engine(()=>new Worker("stockfish.js")); await ENG.init(); return ENG; }
async function run(url){ const g=games().find(x=>x.url===url); if(!g) return; const C=cache()[url]; if(C&&C.done){ view={k:"rev",g,r:C}; paint(); return; }
  if(job) job.stop=true; const J=job={stop:false};
  try{ const pg=Analyzer.parsePgn(g.pgn), mv=pg.moves, N=mv.length; const t0=performance.now(); const per=Math.max(60,Math.min(400,Math.round(BUDGET/(N+1))));
    const r={items:[],n:N,at:0,done:false,reached:{},ph:"open"}; view={k:"rev",g,r}; if(on) paint();
    const e=await eng(); const S=[], used={file:{},outpost:{}}; let last=0;
    for(let i=0;i<=N;i++){ if(J.stop) return; const fen=i<N?mv[i].before:mv[N-1].after; const a=await e.analyse(fen,14,per,1); S.push({sc:a.score,bm:(a.pv&&a.pv[0])||a.bm,pv:(a.pv||[]).slice(0,3)});
      if(i>0){ const k=i-1, m=mv[k]; const ph=phase(m.before,k+1); r.reached[ph]=1; r.ph=ph; if(m.color===g.me) look(mv,S,k,g.me,ph,used).forEach(it=>r.items.push(it)); }
      r.at=i; if(view.k==="rev"&&view.r===r&&on&&(performance.now()-last>700||i===N)){ last=performance.now(); paint(); } }
    r.items.sort((a,b)=>a.ply-b.ply); r.done=true; r.ms=Math.round(performance.now()-t0); window.CRQuick74.last=r; save(url,r); if(J.stop) return; job=null; if(view.k==="rev"&&view.r===r&&on) paint();
  }catch(err){ console.error(err); job=null; view={k:"list"}; paint(); const p=$("cr72"); if(p) p.insertAdjacentHTML("afterbegin",`<div class="tx">Sorry, that game couldn't be checked. Try the full review instead.</div>`); } }
function look(mv,S,i,me,ph,used){ const m=mv[i], fen=m.before, b=bd(fen), best=S[i].bm, rep=S[i+1].bm, out=[];
  const bw=wp(S[i].sc), aw=100-wp(S[i+1].sc), d=Math.max(0,bw-aw), pc=NAME[(b[idx(m.uci)]||{t:"p"}).t], to=m.uci.slice(2,4), you=`your ${pc} to ${to}`;
  const P=s=>NAME[(b[idx(s)]||{t:"p"}).t];
  const base={ply:i+1,ph,fen,uci:m.uci,d:Math.round(d)};
  // their reply after your move (threat)
  let th=null, why=""; const ab=bd(m.after);
  if(rep&&rep.length>=4){ const vic=ab[idx(rep.slice(2,4))], att=NAME[(ab[idx(rep)]||{t:"p"}).t]; const rs=S[i+1].sc;
    if(rs&&rs.mate!=null&&rs.mate>0){ why=" It let them force checkmate."; th=rep; } else if(vic&&vic.c===me){ why=` It let their ${att} take your ${NAME[vic.t]} on ${rep.slice(2,4)}.`; th=rep; } else if(d>=10){ why=` It gave them a strong reply: ${att} to ${rep.slice(2,4)}.`; th=rep; } }
  const bestTxt=best?`your ${P(best)} to ${best.slice(2,4)}`:"";
  let main=null;
  if(best&&best!==m.uci&&d>=5){ const s0=S[i].sc, tgt=b[idx(best.slice(2,4))];
    if(s0.mate!=null&&s0.mate>0&&!(S[i+1].sc.mate!=null&&S[i+1].sc.mate<0)) main={type:"miss",short:`You had checkmate and missed it`,text:`Missed checkmate: ${bestTxt} started a forced mate. You played ${you} instead.`+why,best,th};
    else if(tgt&&tgt.c!==me&&isFree(b,me,idx(best.slice(2,4)))) main={type:"free",short:`Their ${NAME[tgt.t]} on ${best.slice(2,4)} was free to take`,text:`Free piece missed: their ${NAME[tgt.t]} on ${best.slice(2,4)} wasn't protected. Your ${P(best)} on ${best.slice(0,2)} could have taken it. You played ${you} instead.`+why,best,th,hl:[best.slice(2,4)]};
    else if(tgt&&tgt.c!==me&&VAL[tgt.t]>=3&&bw>=aw+8) main={type:"miss",short:`Missed the chance to win their ${NAME[tgt.t]}`,text:`Missed chance: ${bestTxt}, taking their ${NAME[tgt.t]}, would have won material. You played ${you} instead.`+why,best,th};
    else { const ty=d>=20?"blunder":d>=10?"mistake":"inacc", w={blunder:"Blunder",mistake:"Mistake",inacc:"Small slip"}[ty];
      const lead=bw>=70&&aw<55?`You let a win slip: moving ${you} threw away your lead.`:`${w}: you moved ${you}.`;
      main={type:ty,short:why?why.trim().replace(/^It /,"This "):`${w} with ${you}`,text:lead+why+(best?` Better was ${bestTxt}${tgt&&tgt.c!==me?`, taking their ${NAME[tgt.t]}`:""}.`:""),best,th}; } }
  if(main){ try{ main.why=explain(b,me,m.uci,main.best,S[i].pv,S[i+1].pv,mv,i,ph,d,S[i+1].sc); }catch(e){} out.push(Object.assign({},base,main)); }
  // open space you didn't use (only when your move wasn't the engine's choice)
  if(best&&best!==m.uci&&d>=2){
    // open / half-open file for a rook
    const pawns=(c,f)=>{ for(let r=0;r<8;r++){ const p=b[f+8*r]; if(p&&p.t==="p"&&p.c===c) return true; } return false; };
    const mine=b[idx(m.uci)]; const movedRookToFile=mine&&mine.t==="r";
    for(let f=0;f<8&&!movedRookToFile;f++){ if(pawns(me,f)||used.file[f]) continue; const open=!pawns(me==="w"?"b":"w",f);
      let rookOn=false; for(let r=0;r<8;r++){ const p=b[f+8*r]; if(p&&p.c===me&&(p.t==="r"||p.t==="q")) rookOn=true; } if(rookOn) continue;
      let pick=null; for(let s=0;s<64&&!pick;s++){ const p=b[s]; if(p&&p.c===me&&p.t==="r"&&s%8!==f){ const t=atk(b,s).find(q=>q%8===f&&!b[q]); if(t!=null) pick=[s,t]; } }
      if(pick&&(open||ph!=="open")){ used.file[f]=1; const sug=sqn(pick[0])+sqn(pick[1]); const hl=[]; for(let r=0;r<8;r++) hl.push(FI[f]+(r+1));
        out.push(Object.assign({},base,{type:"file",d:0,short:`The ${FI[f]}-file was ${open?"open":"half-open"} and no rook used it`,text:`${open?"Open":"Half-open"} file not used: the ${FI[f]}-file ${open?"had no pawns on it":"had none of your pawns on it"}. Your rook on ${sqn(pick[0])} could have moved to ${sqn(pick[1])} to take control of it. You played ${you} instead.`,why:`A rook on ${open?"an open":"a half-open"} file can travel straight down it towards their side.`,sug,hl,best:null})); break; } }
    // strong square (outpost) for a knight
    const opp=me==="w"?"b":"w";
    for(let s=0;s<64;s++){ const p=b[s]; if(!p||p.c!==me||p.t!=="n") continue;
      for(const t of atk(b,s)){ const r=t>>3, f=t%8, rel=me==="w"?r:7-r; if(b[t]||rel<3||rel>5||used.outpost[t]) continue;
        if(!by(b,me,t).some(q=>b[q].t==="p")) continue; let safe=true;
        for(const ff of [f-1,f+1]){ if(ff<0||ff>7) continue; for(let rr=0;rr<8;rr++){ const q=b[ff+8*rr]; if(q&&q.t==="p"&&q.c===opp&&(me==="w"?rr>r:rr<r)) safe=false; } }
        if(!safe||m.uci.slice(2,4)===sqn(t)) continue; used.outpost[t]=1;
        out.push(Object.assign({},base,{type:"outpost",d:0,short:`${sqn(t)} was a strong square for your knight`,text:`Strong square not used: ${sqn(t)} was backed by your pawn and none of their pawns could ever chase a piece away from it. Your knight on ${sqn(s)} could have jumped there. You played ${you} instead.`,why:`A knight on ${sqn(t)} is protected by your pawn and can't be chased away by their pawns, so it can stay there for the rest of the game.`,sug:sqn(s)+sqn(t),hl:[sqn(t)],best:null}));
        s=64; break; } } }
  return out; }
function tick(){ build(); if(on&&!B.classList.contains("hs-review")) close(); if(on) place(); }
Object.assign(window.CRQuick74,{open,close,run,state:()=>view,last:null,phase});
setInterval(tick,400); addEventListener("resize",()=>{ if(on&&view.k==="show") paint(); });
})();
