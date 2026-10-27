/* ideas.js — "Why this move?" Turns a short Stockfish look into 2-4 plain-English ideas,
   each with its own arrows. Tap an idea to see it on the board; tap again to clear. Works offline. */
(function(){
"use strict";
const CH=()=>window.ChessLib&&window.ChessLib.Chess||window.Chess;
const NM={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"}, VAL={p:1,n:3,b:3,r:5,q:9,k:100};
const COL={threat:"#e07b24",plan:"#2f6fdb",attack:"#8e44ad",defend:"#14917f",stop:"#d23c3c",allow:"#a3342b",take:"#7a5c00",check:"#c2185b"};
const LABEL={threat:"Threat",plan:"Plan",attack:"Attack",defend:"Defence",stop:"Stops",allow:"Careful",take:"Wins",check:"Check"};
const MS=260, DEPTH=12;
function mv(g,u){ try{ return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); }catch(e){ return null; } }
function nullFen(fen){ const f=fen.split(" "); f[1]=f[1]==="w"?"b":"w"; f[3]="-"; return f.join(" "); }
function inCheck(fen){ try{ return new (CH())(fen).inCheck(); }catch(e){ return true; } }
const F="abcdefgh", sq=(x,y)=>x>=0&&x<8&&y>=0&&y<8?F[x]+(y+1):null;
/* squares the piece on s attacks (ignores pins) */
function hits(g,s){ const p=g.get(s); if(!p) return []; const x=F.indexOf(s[0]), y=+s[1]-1, out=[];
  const ray=(dx,dy,once)=>{ let i=x+dx, j=y+dy; while(sq(i,j)){ const t=sq(i,j); out.push(t); if(once||g.get(t)) break; i+=dx; j+=dy; } };
  if(p.type==="p"){ const d=p.color==="w"?1:-1; [sq(x-1,y+d),sq(x+1,y+d)].forEach(t=>t&&out.push(t)); }
  else if(p.type==="n") [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,b])=>ray(a,b,true));
  else { const D=p.type==="b"?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.type==="r"?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]; D.forEach(([a,b])=>ray(a,b,p.type==="k")); }
  return out; }
function attackedBy(g,t,color){ const L=[]; g.board().forEach(r=>r.forEach(c=>{ if(c&&c.color===color&&hits(g,c.square).includes(t)) L.push(c.square); })); return L; }
const pc=(g,s)=>{ const p=g.get(s); return p?NM[p.type]:"piece"; };
function words(fen,u){ const g=new (CH())(fen), m=mv(g,u); if(!m) return null; return {m,name:NM[m.piece],cap:m.captured?NM[m.captured]:"",check:g.inCheck(),mate:g.isCheckmate(),castle:/O-O/.test(m.san)}; }
function list(arr){ return arr.length<2?arr[0]:arr.slice(0,-1).join(", ")+" and "+arr[arr.length-1]; }
const cut=s=>{ const w=s.split(/\s+/); return w.length<=15?s:w.slice(0,15).join(" ").replace(/[,.]?$/,"."); };
const cache={};
async function compute(fen,u){ const key=fen+"|"+u; if(cache[key]) return cache[key];
  const E=window.CRBotEngine, C=CH(); await E.boot();
  const g=new C(fen), me=g.turn(), op=me==="w"?"b":"w", m=mv(g,u); if(!m) return [];
  const after=g.fen(), out=[], myName=NM[m.piece];
  if(g.isCheckmate()){ out.push({k:"take",t:"Checkmate! Their king has no way out.",a:[{u,c:COL.take}]}); return cache[key]=out; }
  if(m.captured) out.push({k:"take",t:cut(`Takes the ${NM[m.captured]} on ${m.to}.`),a:[{u,c:COL.take}]});
  // the opponent's best reply + our plan
  const L1=g.isGameOver()?{pv:[]}:await E.line(after,MS,DEPTH);
  // what it threatens (we pretend they pass)
  if(!g.inCheck()){ const nf=nullFen(after); try{ const L2=await E.line(nf,MS,DEPTH); const t=L2.pv[0]; if(t){ const h=new C(nf), w=mv(h,t);
      if(w){ const base=-(L1.score||0), gain=(L2.score||0)-base; let s="";
        if(L2.mate>0&&L2.mate<=3) s=`Threatens checkmate with the ${NM[w.piece]} on ${w.to}.`;
        else if(w.captured&&(VAL[w.captured]>=3||gain>=80)) s=`Threatens to take the ${NM[w.captured]} on ${w.to}.`;
        else if(h.inCheck()&&gain>=60) s=`Threatens a strong check with the ${NM[w.piece]} on ${w.to}.`;
        else if(gain>=90) s=w.piece==="p"?`Threatens to push the pawn to ${w.to}.`:`Threatens to bring the ${NM[w.piece]} to ${w.to}.`;
        if(s) out.push({k:"threat",t:cut(s),a:[{u:t,c:COL.threat}]}); } } }catch(e){} }
  else out.push({k:"check",t:cut(`Gives check, so the king must deal with it first.`),a:[{u,c:COL.threat}]});
  // what it allows (their best reply wins something)
  const rep=L1.pv[0]; if(rep){ const h=new C(after), w=mv(h,rep); if(w&&w.captured&&VAL[w.captured]>=3&&(L1.score||0)>=150) out.push({k:"allow",t:cut(`But it lets their ${NM[w.piece]} take your ${NM[w.captured]} on ${w.to}.`),a:[{u:rep,c:COL.allow}]});
    else if(L1.mate>0&&L1.mate<=3) out.push({k:"allow",t:"But it allows them a quick checkmate.",a:[{u:rep,c:COL.allow}]}); }
  // the plan: our next one or two moves in the main line
  if(L1.pv.length>=2){ const h=new C(after); const steps=[], arrows=[]; for(let i=0;i<L1.pv.length&&steps.length<2&&i<4;i++){ const w=mv(h,L1.pv[i]); if(!w) break;
      if(w.color===me){ steps.push(/O-O/.test(w.san)?"castle":w.captured?`take the ${NM[w.captured]} on ${w.to}`:w.piece==="p"?`push the pawn to ${w.to}`:`the ${NM[w.piece]} on ${w.to}`); arrows.push({u:L1.pv[i],c:COL.plan,dash:steps.length>1}); } }
    if(steps.length){ const v=s=>/^(castle|take|push)/.test(s)?"to "+s:s; out.push({k:"plan",t:cut(`Next wants ${v(steps[0])}${steps[1]?", then "+v(steps[1]).replace(/^to /,""):""}.`),a:arrows}); } }
  // what it newly attacks / defends
  { const nowHit=hits(g,m.to), pre=new C(fen); const beforeHit=hits(pre,m.from);
    const att=nowHit.filter(s=>{ const p=g.get(s); return p&&p.color===op&&p.type!=="p"&&s!==m.to&&!beforeHit.includes(s); }).filter(s=>{ const p=g.get(s); return VAL[p.type]>VAL[m.piece]||!attackedBy(g,s,op).length||p.type==="k"; }).slice(0,2);
    if(att.length) out.push({k:"attack",t:cut(att.some(s=>g.get(s).type==="k")&&att.length===1?`Puts pressure on their king.`:`Attacks the ${list(att.map(s=>pc(g,s)+" on "+s))}.`),a:att.map(s=>({u:m.to+s,c:COL.attack}))});
    const def=nowHit.filter(s=>{ const p=g.get(s); return p&&p.color===me&&p.type!=="k"&&!beforeHit.includes(s)&&attackedBy(g,s,op).length>0; }).slice(0,2);
    if(def.length) out.push({k:"defend",t:cut(`Now guards your ${list(def.map(s=>pc(g,s)+" on "+s))}.`),a:def.map(s=>({u:m.to+s,c:COL.defend}))}); }
  // what it stops: their threat before the move
  if(!inCheck(fen)){ try{ const nb=nullFen(fen); const L3=await E.line(nb,MS,DEPTH); const t=L3.pv[0]; if(t){ const h=new C(nb), w=mv(h,t);
      if(w){ const big=(L3.mate>0&&L3.mate<=3)||(w.captured&&VAL[w.captured]>=3&&(VAL[w.piece]<VAL[w.captured]||!attackedBy(new C(nb),w.to,me).length)); 
        if(big){ const na=nullFen(after); const h2=new C(na); const target=w.captured?h2.get(w.to):null; const legal=!inCheck(na)&&mv(new C(na),t);
          const gone=w.captured&&(!target||target.color!==me||target.type!==w.captured);
          const guarded=w.captured&&target&&attackedBy(new C(after),w.to,me).length>0&&VAL[w.piece]>=VAL[w.captured];
          if(!legal||gone||guarded){ const s=L3.mate>0?`Stops their checkmate threat on ${w.to}.`:gone&&m.from===w.to?`Saves your ${NM[w.captured]} from their ${NM[w.piece]}.`:`Stops their ${NM[w.piece]} from taking your ${NM[w.captured]} on ${w.to}.`;
            out.push({k:"stop",t:cut(s),a:[{u:t,c:COL.stop,dash:true}]}); } } } } }catch(e){} }
  // order: take, stop, threat, attack, defend, plan, allow; keep 2-4
  const ord=["take","check","stop","threat","attack","defend","plan","allow"]; out.sort((a,b)=>ord.indexOf(a.k)-ord.indexOf(b.k));
  let res=out.slice(0,4); if(out.find(x=>x.k==="allow")&&!res.find(x=>x.k==="allow")) res[3]=out.find(x=>x.k==="allow");
  if(res.length<2){ const back=me==="w"?"1":"8"; if(m.piece!=="p"&&m.piece!=="k"&&m.from[1]===back) res.push({k:"plan",t:`Brings the ${myName} into the game.`,a:[{u,c:COL.plan}]});
    else if(/[de][45]/.test(m.to)&&m.piece==="p") res.push({k:"plan",t:"Claims space in the centre.",a:[{u,c:COL.plan}]});
    else if(!res.length) res.push({k:"plan",t:`A quiet move: the ${myName} goes to ${m.to}.`,a:[{u,c:COL.plan}]}); }
  res.forEach(x=>{ x.c=COL[x.k]; x.lab=LABEL[x.k]; });
  return cache[key]=res; }
function css(){ if(document.getElementById("idCss")) return; const s=document.createElement("style"); s.id="idCss";
  s.textContent=`.idw{margin:10px 0 4px}.idg{margin:0 0 10px}.idh{font-weight:700;font-size:15px;margin:0 0 6px;display:flex;gap:6px;align-items:center}
.idh small{font-weight:400;opacity:.7}.idb{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;text-align:left;padding:10px 12px;margin:0 0 6px;border-radius:12px;border:1.5px solid #8884;background:transparent;color:inherit;font:inherit;font-size:15px;line-height:1.3;cursor:pointer;-webkit-tap-highlight-color:transparent}
.idb i{flex:0 0 auto;width:30px;height:8px;border-radius:4px;background:var(--c)}.idb em{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--c);min-width:58px}
.idb.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}
.idld{display:flex;align-items:center;gap:8px;opacity:.75;font-size:14px;min-height:40px}.idld:before{content:"";width:16px;height:16px;border-radius:50%;border:2.5px solid #8886;border-top-color:#2f6fdb;animation:idsp .8s linear infinite}
@keyframes idsp{to{transform:rotate(360deg)}}.idtip{font-size:12px;opacity:.65;margin:2px 0 0}`; document.head.appendChild(s); }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* mount(el, groups:[{fen,uci,title,sub}], show(fenAfter, idea, group) / show(null) to clear) */
function mount(el,groups,show){ css(); el.classList.add("idw"); const tok=Symbol(); el._idTok=tok; let pin=null;
  el.innerHTML=groups.map((G,gi)=>`<div class="idg" data-g="${gi}"><div class="idh">${esc(G.title)}${G.sub?` <small>${esc(G.sub)}</small>`:""}</div><div class="idld">Working out the ideas…</div></div>`).join("")+`<p class="idtip">Tap an idea to see its arrows. Tap again to clear.</p>`;
  const hover=window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches;
  groups.forEach((G,gi)=>{ compute(G.fen,G.uci).then(L=>{ if(el._idTok!==tok) return; const box=el.querySelector(`[data-g="${gi}"]`); G.after=(()=>{ const g=new (CH())(G.fen); mv(g,G.uci); return g.fen(); })(); G.L=L;
      box.innerHTML=`<div class="idh">${esc(G.title)}${G.sub?` <small>${esc(G.sub)}</small>`:""}</div>`+(L.length?L.map((x,i)=>`<button class="idb" style="--c:${x.c}" data-i="${i}" aria-pressed="false"><i></i><em>${x.lab}</em><span>${esc(x.t)}</span></button>`).join(""):`<p class="mute">No clear ideas found.</p>`);
      box.querySelectorAll(".idb").forEach(b=>{ const x=L[+b.dataset.i];
        const set=(on)=>{ el.querySelectorAll(".idb.on").forEach(o=>{ o.classList.remove("on"); o.setAttribute("aria-pressed","false"); }); if(on){ b.classList.add("on"); b.setAttribute("aria-pressed","true"); show(G.after,x,G); } else show(null); };
        b.onclick=()=>{ if(pin===b){ pin=null; set(false); } else { pin=b; set(true); } };
        if(hover){ b.onmouseenter=()=>{ if(!pin) { b.classList.add("on"); show(G.after,x,G); } }; b.onmouseleave=()=>{ if(!pin){ b.classList.remove("on"); show(null); } }; } }); })
    .catch(e=>{ console.warn("ideas",e); const box=el.querySelector(`[data-g="${gi}"] .idld`); if(box) box.outerHTML=`<p class="mute">Couldn't work out the ideas right now.</p>`; }); }); }
/* arrows as SVG for any board using a square->centre function */
function svg(arrows,center){ return (arrows||[]).map(a=>{ const [x1,y1]=center(a.u.slice(0,2)), [x2,y2]=center(a.u.slice(2,4)); const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, ex=x2-ux*14, ey=y2-uy*14;
  return `<line x1="${x1+ux*8}" y1="${y1+uy*8}" x2="${ex}" y2="${ey}" stroke="${a.c}" stroke-width="${a.dash?6:8}" stroke-linecap="${a.dash?"butt":"round"}" ${a.dash?'stroke-dasharray="9 6"':""} opacity=".88"/><polygon points="${x2-ux*3},${y2-uy*3} ${ex-uy*11},${ey+ux*11} ${ex+uy*11},${ey-ux*11}" fill="${a.c}" opacity=".95"/>`; }).join(""); }
window.CRIdeas={compute,mount,svg,COL};
})();
