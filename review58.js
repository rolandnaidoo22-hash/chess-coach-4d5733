/* v58: material counter on each move, and "left the opening" note in Review my game. Original opening list. */
(function(){ "use strict"; if(window.CRRev58) return;
const OPEN58=[
["Italian Game","e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6"],["Italian Game","e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 c3 d6"],["Two Knights","e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7"],["Two Knights","e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5"],
["Ruy Lopez","e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6"],["Ruy Lopez, Berlin","e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6"],["Scotch Game","e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6"],["Petrov Defence","e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5"],
["Philidor Defence","e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7"],["Vienna Game","e4 e5 Nc3 Nf6 f4 d5"],["King's Gambit","e4 e5 f4 exf4 Nf3 g5"],["Four Knights","e4 e5 Nf3 Nc6 Nc3 Nf6 d4 exd4"],
["Sicilian, Open","e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6"],["Sicilian, Open","e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5"],["Sicilian, Open","e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6"],["Sicilian, Alapin","e4 c5 c3 Nf6 e5 Nd5 d4 cxd4"],["Sicilian, Closed","e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7"],
["French Defence","e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7"],["French, Advance","e4 e6 d4 d5 e5 c5 c3 Nc6"],["French, Exchange","e4 e6 d4 d5 exd5 exd5"],["Caro-Kann","e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5"],["Caro-Kann, Advance","e4 c6 d4 d5 e5 Bf5"],
["Scandinavian","e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6"],["Scandinavian","e4 d5 exd5 Nf6 d4 Nxd5"],["Pirc Defence","e4 d6 d4 Nf6 Nc3 g6"],["Alekhine Defence","e4 Nf6 e5 Nd5 d4 d6"],["Modern Defence","e4 g6 d4 Bg7 Nc3 d6"],
["Queen's Gambit Declined","d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7"],["Queen's Gambit Accepted","d4 d5 c4 dxc4 Nf3 Nf6 e3 e6"],["Slav Defence","d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4"],["London System","d4 d5 Bf4 Nf6 e3 e6 Nf3 c5"],["London System","d4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O"],
["King's Indian","d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O"],["Nimzo-Indian","d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O"],["Queen's Indian","d4 Nf6 c4 e6 Nf3 b6 g3 Bb7"],["Grünfeld","d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5"],["Dutch Defence","d4 f5 g3 Nf6 Bg2 e6"],
["English Opening","c4 e5 Nc3 Nf6 g3 d5"],["English Opening","c4 Nf6 Nc3 e6 e4 d5"],["Réti Opening","Nf3 d5 g3 Nf6 Bg2 c6"],["Queen's Pawn","d4 d5 Nf3 Nf6 e3 e6"],["King's Pawn","e4 e5 Nf3 Nc6 Nc3 Nf6"]
].map(([n,m])=>({n,m:m.split(" ")}));
const clean=s=>String(s||"").replace(/[+#!?]/g,"");
/* returns {j, by:"w"/"b", usual:[san], name} or null; j = 0-based ply that left book */
function leftBook(sans){ const g=sans.map(clean); let live=OPEN58, name="";
  for(let j=0;j<g.length;j++){ const nx=live.filter(o=>o.m.length>j&&o.m[j]===g[j]);
    if(!nx.length){ const can=live.filter(o=>o.m.length>j); if(!can.length) return null; /* past end of all lines: still in book */
      const cnt={}; can.forEach(o=>cnt[o.m[j]]=(cnt[o.m[j]]||0)+1); const usual=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);
      return {j,by:j%2?"b":"w",usual,name}; }
    live=nx; name=nx[0].n; } return null; }
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
function matSeries(fen0,sans,uc){ const C=(window.ChessLib&&ChessLib.Chess)||window.Chess; if(!C) return []; let ch; try{ ch=fen0?new C(fen0):new C(); }catch(e){ return []; }
  const out=[]; for(const s of sans){ try{ ch.move(s); }catch(e){ break; } let w=0,b=0; ch.board().forEach(r=>r.forEach(q=>{ if(q){ if(q.color==="w") w+=VAL[q.type]; else b+=VAL[q.type]; } })); out.push(uc==="b"?b-w:w-b); } return out; }
let MAT=[], LB=null, KEY="";
function calc(){ try{ const k=P.length+":"+(P[0]&&P[0].fen_before)+":"+(P[P.length-1]&&P[P.length-1].san); if(k===KEY) return; KEY=k;
  const sans=P.map(p=>p.san); MAT=matSeries(P[0]&&P[0].fen_before,sans,UC||"w");
  const std=!P[0]||!P[0].fen_before||/^rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w/.test(P[0].fen_before); LB=std?leftBook(sans):null; }catch(e){ MAT=[]; LB=null; } }
const ob=window.buildList;
if(typeof ob==="function") window.buildList=buildList=function(){ const r=ob.apply(this,arguments); try{ calc(); document.querySelectorAll(".mcell[data-i]").forEach(b=>{ const i=+b.dataset.i-1, v=MAT[i]; if(b.querySelector(".mat58")) return;
  const s=document.createElement("small"); s.className="mat58"+(v>0?" up":v<0?" dn":" ev"); s.textContent=v>0?"+"+v:v<0?String(v):"="; s.title="Material: "+(v>0?"you are "+v+" up":v<0?"you are "+(-v)+" down":"level");
  if(v||(i>0&&MAT[i-1])) b.insertBefore(s,b.querySelector(".t")); if(LB&&i===LB.j) b.classList.add("left58"); }); }catch(e){ console.warn(e); } return r; };
const os=window.buildSummary;
if(typeof os==="function") window.buildSummary=buildSummary=function(){ const r=os.apply(this,arguments); try{ calc(); card(); }catch(e){ console.warn(e); } return r; };
function mvn(j){ return Math.floor(j/2)+1+(j%2?"...":"."); }
function card(){ document.querySelectorAll(".op58").forEach(x=>x.remove()); if(!LB||!P[LB.j]) return; const host=document.getElementById("summary")||document.querySelector("#sum,.summary"); if(!host) return;
  const me=LB.by===(UC||"w"), mv=mvn(LB.j)+" "+P[LB.j].san, us=LB.usual.slice(0,2).map(x=>"<b>"+x+"</b>").join(" or ");
  const d=document.createElement("div"); d.className="op58"; d.innerHTML=`<div><b>📖 Left the opening:</b> ${me?"you":"your opponent"} played <b>${mv}</b>${LB.name?` in the ${LB.name}`:""}. The usual move here is ${us}.</div><div class="op58s">${me?"Not always wrong, but from here you are on your own. Check the move card to see if it cost anything.":"From here they were off the usual path. Look for a way to punish it."}</div><button type="button" class="op58b">Show this move ›</button>`;
  d.querySelector(".op58b").onclick=()=>{ try{ go(LB.j+1,true); }catch(e){} }; host.insertBefore(d,host.firstChild); }
const oc=window.drawCard;
if(typeof oc==="function") window.drawCard=drawCard=function(){ const r=oc.apply(this,arguments); try{ calc(); const c=document.getElementById("movecard"); if(c&&LB&&cur===LB.j+1&&!c.querySelector(".op58n")){ const n=document.createElement("div"); n.className="op58n"; n.innerHTML=`📖 This move left the usual opening path. The usual move here is ${LB.usual.slice(0,2).map(x=>"<b>"+x+"</b>").join(" or ")}.`; c.appendChild(n); }
  const v=MAT[cur-1]; if(c&&cur>0&&v!=null&&!c.querySelector(".mat58c")){ const n=document.createElement("div"); n.className="mat58c"; n.textContent="Material: "+(v>0?"you are "+v+" point"+(v>1?"s":"")+" up":v<0?"you are "+(-v)+" point"+(v<-1?"s":"")+" down":"level")+" (pawn 1, knight/bishop 3, rook 5, queen 9)."; c.appendChild(n); } }catch(e){} return r; };
const st=document.createElement("style"); st.textContent=`.mat58{font-size:11px;font-weight:800;padding:0 4px;border-radius:5px}.mat58.up{color:#1b6e2a;background:#e3f3e5}.mat58.dn{color:#b3261e;background:#fbe6e4}.mat58.ev{color:#777}
.mcell.left58{box-shadow:inset 0 -2px 0 #b88a1c}.op58{border:1px solid #e3c77a;background:#fff8e6;color:#3b2f10;border-radius:12px;padding:10px;margin:8px 0;font-size:14.5px}.op58s{font-size:13px;color:#6b5a2c;margin-top:4px}.op58b{margin-top:8px;min-height:44px;width:100%;border-radius:10px;border:1px solid #b88a1c;background:#fff;color:#7a5a10;font:inherit;font-weight:700}
.op58n,.mat58c{font-size:13px;margin-top:6px;color:var(--mute,#666)}html.dark-mode .op58{background:#2d2614;color:#eee}`; document.head.appendChild(st);
window.CRRev58={leftBook,matSeries,OPEN58,_st:()=>({MAT,LB})};
})();
