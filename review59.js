/* v59: Review my game in tabs: Summary (default), Moves, Phases, Practise. Phone-first. */
(function(){ "use strict"; if(window.CRRev59) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const TABS=[["sum","Summary"],["moves","Moves"],["phases","Phases"],["prac","Practise"]];
let TAB="sum", PR={i:0,tries:0,done:{}};
function ensure(){ if($("rv59")) return; const s=$("summary"); if(!s) return; const d=document.createElement("div"); d.id="rv59";
  d.innerHTML=`<nav class="rv59bar" role="tablist">${TABS.map(([k,n])=>`<button type="button" role="tab" data-t="${k}">${n}</button>`).join("")}</nav><section class="card rv59p" id="rv59sum"></section><section class="card rv59p" id="rv59pr"></section><div id="rv59g"></div>`;
  s.parentNode.insertBefore(d,s); d.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{ setTab(b.dataset.t); window.scrollTo({top:Math.max(0,d.getBoundingClientRect().top+scrollY-8)}); });
  /* move the eval graph into the Moves tab, just above the board */
  const g=$("rv59g"), main=document.querySelector("section.main"); if(main) main.parentNode.insertBefore(g,main); }
function setTab(t){ TAB=t; ensure(); const B=document.body; TABS.forEach(([k])=>B.classList.toggle("rv59-"+k,k===t)); B.classList.add("rv59on");
  document.querySelectorAll("#rv59 [data-t]").forEach(b=>{ b.classList.toggle("on",b.dataset.t===t); b.setAttribute("aria-selected",b.dataset.t===t); });
  if(t==="prac") practise(); }
const mine=()=>(P||[]).map((p,i)=>({p,i})).filter(x=>x.p.user&&["blunder","mistake","miss"].includes(x.p.cls));
function summary(){ ensure(); const el=$("rv59sum"); if(!el||!M) return; const me=UC||"w", opp=me==="w"?M.black:M.white;
  const res=M.result==="1/2-1/2"?"Draw":M.result==="*"?"Unfinished":(M.result==="1-0")===(me==="w")?"You won":"You lost";
  let acc=S.accuracy, oacc=S.opp_accuracy; try{ if(S.v7){ acc=S.v7[me].accuracy; oacc=S.v7[me==="w"?"b":"w"].accuracy; } }catch(e){}
  const top=(()=>{ const m=mine(), own=new Set(m.map(x=>x.i+1)), t=(S.top||[]).filter(t=>own.has(t.ply)); if(t.length) return t.slice(0,3);
    return m.map(x=>({ply:x.i+1,cls:x.p.cls,label:x.p.label||x.p.san,l:+(x.p.cp_loss||x.p.loss||0)})).sort((a,b)=>b.l-a.l||(a.cls==="blunder"?-1:1)).slice(0,3).sort((a,b)=>a.ply-b.ply); })(), work=(S.work_on||[])[0], n=mine().length;
  el.innerHTML=`<div class="rv59res"><b>${E_(res)}</b> vs ${E_(opp)}${M.termination?`<small>${E_(M.termination)}</small>`:""}</div>
   <div class="rv59acc"><div><b>${acc!=null&&acc!==""?Math.round(acc)+"%":"–"}</b><span>your accuracy</span></div><div><b>${oacc!=null&&oacc!==""?Math.round(oacc)+"%":"–"}</b><span>opponent</span></div></div>
   <h3>Biggest mistakes</h3>${top.length?`<ol class="rv59top">${top.map(t=>`<li><span class="badge b-${t.cls}">${({blunder:"??",mistake:"?",miss:"✖",inaccuracy:"?!"})[t.cls]||"!"}</span><span class="rv59l">${E_(t.label)}</span><button type="button" class="rv59show" data-ply="${t.ply}">Show me ›</button></li>`).join("")}</ol>`:`<p>No real mistakes. Great game!</p>`}
   <h3>One thing to practise</h3><p class="rv59work">${work?E_(work):"Keep doing a quick safety check before every move."}</p>
   ${n?`<button type="button" class="rv59big" id="rv59goP">🎯 Retry my ${n} mistake${n>1?"s":""}</button>`:""}`;
  el.querySelectorAll(".rv59show").forEach(b=>b.onclick=()=>go(+b.dataset.ply,true));
  const gp=$("rv59goP"); if(gp) gp.onclick=()=>setTab("prac"); }
function moveGraph(){ const g=document.querySelector("#summary .graph"), h=$("rv59g"); if(g&&h){ h.innerHTML=""; h.appendChild(g); } }
function practise(){ const el=$("rv59pr"); if(!el) return; const L=mine(); if(!L.length){ el.innerHTML=`<h3>Practise</h3><p>No mistakes to retry in this game. 🎉</p>`; return; }
  PR.i=Math.max(0,Math.min(L.length-1,PR.i)); const x=L[PR.i], p=x.p, me=UC||"w", C=(window.ChessLib&&ChessLib.Chess)||window.Chess, done=Object.keys(PR.done).length;
  const mv=`${Math.floor(x.i/2)+1}${p.color==="w"?".":"…"}`;
  el.innerHTML=`<h3>Practise: retry your mistakes</h3><p class="rv59sm">Mistake ${PR.i+1} of ${L.length} · solved ${done}</p>
   <p class="rv59q">Move ${mv} In the game you played <b>${E_(p.san)}</b>. Find a better move.</p><div class="rv59bd" id="rv59bd"></div><div class="rv59msg" id="rv59msg"></div>
   <div class="rv59row"><button type="button" id="rv59prev" ${PR.i?"":"disabled"}>‹ Back</button><button type="button" id="rv59ans">Show answer</button><button type="button" id="rv59next" ${PR.i<L.length-1?"":"disabled"}>Next ›</button></div>`;
  let G; try{ G=new C(p.fen_before); }catch(e){ return; } let arrows=[];
  const msg=(t,c)=>{ const m=$("rv59msg"); m.className="rv59msg "+(c||""); m.innerHTML=t; };
  const draw=Coach17._tapBoard($("rv59bd"),G,me,(f,q,ms)=>{ const u=f+q, best=(p.best_uci||"").slice(0,4);
    if(u===best){ PR.done[x.i]=1; arrows=[{u:p.best_uci,c:"#2f7d32"}]; msg(`✅ Yes: <b>${E_(p.best_san||"")}</b> is the engine's choice.${p.label?" "+E_(p.label):""}`,"ok"); }
    else if(u===(p.uci||"").slice(0,4)){ msg("That's the move you played in the game. Try something else.","no"); }
    else { PR.tries++; msg(PR.tries>=2?"Not quite. Tap <b>Show answer</b> if you're stuck.":"Not quite. Look again: checks, captures, threats.","no"); }
    draw(); },()=>({arrows}));
  $("rv59ans").onclick=()=>{ arrows=[{u:p.best_uci,c:"#2f7d32"}]; draw(); msg(`The better move was <b>${E_(p.best_san||"?")}</b>.`,""); };
  $("rv59prev").onclick=()=>{ PR.i--; PR.tries=0; practise(); }; $("rv59next").onclick=()=>{ PR.i++; PR.tries=0; practise(); }; }
/* hooks */
const ob=window.buildSummary; if(typeof ob==="function") window.buildSummary=buildSummary=function(){ const r=ob.apply(this,arguments); try{ ensure(); moveGraph(); summary(); if(!document.body.classList.contains("rv59on")) setTab("sum"); }catch(e){ console.warn(e); } return r; };
const ol=window.loadData; if(typeof ol==="function") window.loadData=loadData=function(){ PR={i:0,tries:0,done:{}}; const r=ol.apply(this,arguments); try{ setTab("sum"); }catch(e){} return r; };
const og=window.go; if(typeof og==="function") window.go=go=function(i,scroll){ if(scroll&&TAB!=="moves") setTab("moves"); return og.apply(this,arguments); };
const H="body.nogame #rv59,body.hs-on:not(.hs-review) #rv59,body.hs-review:not(.hs-game) #rv59";
const st=document.createElement("style"); st.textContent=`${H}{display:none!important}
.rv59bar{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:var(--bg,#f7f4ee);padding:6px 0;margin:4px 0 8px}
.rv59bar button{min-height:44px;border-radius:10px;border:1px solid var(--line,#ddd);background:#fff;font:inherit;font-weight:700;font-size:14px;color:inherit;padding:0 2px}.rv59bar button.on{background:#3b6fb6;color:#fff;border-color:#3b6fb6}
.rv59p{display:none}body.rv59-sum #rv59sum,body.rv59-prac #rv59pr{display:block}
body.rv59on:not(.rv59-phases) #summary{display:none!important}body.rv59on:not(.rv59-moves) section.main,body.rv59on:not(.rv59-moves) #rv59g{display:none!important}
.rv59res{font-size:18px}.rv59res small{display:block;font-size:13px;color:var(--mute,#666)}.rv59acc{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.rv59acc div{border:1px solid var(--line,#ddd);border-radius:12px;padding:8px;text-align:center}.rv59acc b{display:block;font-size:26px}.rv59acc span{font-size:12.5px;color:var(--mute,#666)}
.rv59top{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}.rv59top li{display:flex;align-items:center;gap:8px;border:1px solid var(--line,#ddd);border-radius:10px;padding:6px 8px}.rv59l{flex:1;font-weight:600;font-size:14px}
.rv59show{min-height:40px;border-radius:9px;border:1px solid #3b6fb6;background:#fff;color:#3b6fb6;font:inherit;font-weight:700;white-space:nowrap}
.rv59big{width:100%;min-height:48px;border-radius:12px;border:0;background:#3b6fb6;color:#fff;font:inherit;font-weight:800;margin-top:6px}
.rv59bd{max-width:420px;margin:6px auto}.rv59bd svg{width:100%;height:auto}.rv59msg{min-height:22px;margin:6px 0;font-size:14.5px}.rv59msg.ok{color:#1b6e2a}.rv59msg.no{color:#b3261e}
.rv59row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.rv59row button{min-height:44px;border-radius:10px;border:1px solid var(--line,#ccc);background:#fff;font:inherit;font-weight:700}.rv59sm{font-size:12.5px;color:var(--mute,#666);margin:0}
#rv59g .graph{margin:0 0 8px}html.dark-mode .rv59bar{background:#1b1b1b}html.dark-mode .rv59bar button:not(.on),html.dark-mode .rv59row button,html.dark-mode .rv59show{background:#262626;color:#eee}`;
document.head.appendChild(st);
try{ if(typeof M!=="undefined"&&M&&P&&P.length){ ensure(); moveGraph(); summary(); setTab("sum"); } }catch(e){}
window.CRRev59={setTab,tab:()=>TAB,practise,summary};
})();
