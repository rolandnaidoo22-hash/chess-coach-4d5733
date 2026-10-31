/* v71: Review > Moves without the second tab row. Board on the left, the "how did it feel" buttons in a thin column
   on its right, and the BAD check and the "Why" cards as small tap-to-open cards just under the board. */
(function(){
"use strict"; if(window.CRMoves71) return;
const $=id=>document.getElementById(id), B=document.body, COL=()=>innerWidth<420?58:96;
const css=`
body.cr67m #cr67tabs{display:none!important}
body.cr67m .boardrow{margin:0 0 0 var(--cr71l,0px)!important}
#cr71feel{display:none}body.cr67m #cr71feel{display:flex;position:fixed;z-index:63;flex-direction:column;gap:6px;width:var(--cr71c,70px);top:var(--cr71t,60px);left:var(--cr71x,320px)}
body.cr67m #cr71feel.off{display:none}
#cr71feel .h{font-size:11.5px;font-weight:700;text-align:center;line-height:1.2;opacity:.8}
#cr71feel #gt65r{margin:0!important;white-space:normal!important;overflow:visible!important}
#cr71feel .gt65{display:block;margin:0;padding:0;border:0;background:none}#cr71feel .gt65>span{display:none}
#cr71feel .gt65c{display:flex!important;flex-direction:column;gap:6px;margin:0}
#cr71feel .gt65c button{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;min-height:58px;padding:4px 1px!important;font-size:11px!important;line-height:1.15;border-radius:12px;white-space:normal}
#cr71feel .gt65c button .e{font-size:22px;line-height:1}
#cr71chips{display:none}body.cr67m #cr71chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 0}body.cr67m #cr71chips:empty{display:none}
#cr71chips button{min-height:38px;border-radius:19px;border:1px solid var(--line,#ccc);background:var(--card,#fff);color:inherit;font:inherit;font-size:13.5px;font-weight:700;padding:0 12px}
#cr71chips button.flag{border-color:#c62828;color:#c62828}#cr71chips button.on{background:var(--accent,#2f6fd6);color:#fff;border-color:transparent}
#cr71pop{position:fixed;z-index:64;left:6px;right:6px;top:var(--cr67s,432px);max-height:calc(100vh - var(--cr67s,432px) - 8px);overflow:auto;background:var(--card,#fff);border:2px solid var(--accent,#2f6fd6);border-radius:14px;padding:8px 10px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#cr71pop .ph{display:flex;align-items:center;gap:8px;margin-bottom:4px}#cr71pop .ph b{flex:1;font-size:15px}
#cr71pop .ph button{min-width:44px;min-height:40px;border-radius:10px;border:1px solid var(--line,#ccc);background:none;color:inherit;font-size:18px;font-weight:800}
#cr71pop .badbox{margin:0}
#cr71hold{display:none}
#cr71back{display:none}body.cr67m:not([data-cr67t=coach]) #cr71back{display:block;margin:6px 0 0;min-height:40px;width:100%}
#cr71menu{position:fixed;z-index:65;right:8px;top:calc(var(--cr67s,432px) + 4px);background:var(--card,#fff);border:1px solid var(--line,#ccc);border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.25);padding:6px;display:flex;flex-direction:column;min-width:200px}
#cr71menu button{min-height:44px;text-align:left;border:0;background:none;color:inherit;font:inherit;font-size:15px;padding:0 12px;border-radius:10px}#cr71menu button:hover{background:rgba(0,0,0,.06)}
html.dark-mode #cr71chips button,html.dark-mode #cr71pop,html.dark-mode #cr71menu{background:#262626;color:#eee}
@media (min-width:900px){body.cr67m #cr71pop{left:var(--cr71l,6px);right:auto;width:min(620px,calc(100vw - 24px))}}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
let open=null, lastKey="";
function flagged(bb){ return !!(bb&&bb.querySelector(".p-bad,.p-warn,.verdict.bad,li.bad,li.warn")); }
function build(){ const card=$("cr67card"), side=document.querySelector("section.main .side"); if(!card||!side) return false;
  if(!$("cr71chips")){ card.insertAdjacentHTML("beforeend",`<div id="cr71chips"></div><button type="button" class="btn" id="cr71back">‹ Back to the coach</button>`);
    document.body.insertAdjacentHTML("beforeend",`<div id="cr71hold"></div><div id="cr71feel" class="off" aria-label="How did this move feel?"><div class="h">How did it feel?</div></div>`);
    $("cr71back").onclick=()=>{ CRMoves67.setT("coach"); };
    const hd=card.querySelector(".hd"), nx=$("cr67next"); if(hd&&nx) nx.insertAdjacentHTML("beforebegin",`<button type="button" id="cr71more" aria-label="More: move list, feelings, tools" title="More">⋯</button>`);
    $("cr71more").onclick=e=>{ e.stopPropagation(); menu(); }; }
  return true; }
function menu(){ let m=$("cr71menu"); if(m){ m.remove(); return; }
  document.body.insertAdjacentHTML("beforeend",`<div id="cr71menu" role="menu"><button type="button" data-t="moves">📜 Move list and auto-play</button><button type="button" data-t="feel">🙂 My feelings (Gut Check)</button><button type="button" data-t="tools">🧰 Tools: engine, openings, share</button><button type="button" data-t="coach">🧑‍🏫 Coach notes for this move</button></div>`);
  m=$("cr71menu"); const mb=$("cr71more").getBoundingClientRect(); m.style.top=Math.round(mb.bottom+4)+"px"; m.querySelectorAll("button").forEach(b=>b.onclick=()=>{ m.remove(); close(); CRMoves67.setT(b.dataset.t); });
  setTimeout(()=>document.addEventListener("click",function f(ev){ if(!m.contains(ev.target)){ m.remove(); document.removeEventListener("click",f); } }),0); }
function close(){ const p=$("cr71pop"); if(p){ const h=$("cr71hold"); [...p.querySelectorAll(".badbox,#rvIdeas")].forEach(n=>h.appendChild(n)); p.remove(); } open=null; chips(); }
function pop(kind){ if(open===kind){ close(); return; } close(); const h=$("cr71hold"), n=kind==="bad"?h.querySelector(".badbox"):h.querySelector("#rvIdeas"); if(!n) return;
  document.body.insertAdjacentHTML("beforeend",`<div id="cr71pop" role="dialog" aria-label="${kind==="bad"?"BAD check":"Why these moves"}"><div class="ph"><b>${kind==="bad"?"⚠ BAD check for this move":"💡 Why the moves work"}</b><button type="button" id="cr71x" aria-label="Close">✕</button></div></div>`);
  $("cr71pop").appendChild(n); $("cr71x").onclick=close; open=kind; chips(); }
function chips(){ const c=$("cr71chips"), h=$("cr71hold"); if(!c) return; const bb=(open==="bad"?$("cr71pop"):h).querySelector(".badbox"), id=(open==="why"?$("cr71pop"):h).querySelector("#rvIdeas");
  let s=""; if(bb&&flagged(bb)) s+=`<button type="button" data-k="bad" class="flag ${open==="bad"?"on":""}">⚠ BAD check</button>`;
  if(id&&id.textContent.trim()) s+=`<button type="button" data-k="why" class="${open==="why"?"on":""}">💡 Why these moves</button>`;
  if(c.dataset.s!==s){ c.dataset.s=s; c.innerHTML=s; c.querySelectorAll("button").forEach(b=>b.onclick=()=>pop(b.dataset.k)); } }
function tick(){ const on=B.classList.contains("cr67m"); const fe=$("cr71feel"); if(!on){ if(fe) fe.classList.add("off"); if(open) close(); const m=$("cr71menu"); if(m) m.remove(); return; }
  if(!build()) return; const fe2=$("cr71feel");
  const mc=$("movecard"), h=$("cr71hold"), i=typeof cur!=="undefined"?cur:0;
  if(String(i)!==lastKey){ lastKey=String(i); if(open) close(); [...h.children].forEach(x=>x.remove()); }
  if(mc){ const nb=mc.querySelector(".badbox"), ni=mc.querySelector("#rvIdeas");
    if(nb||ni){ if(open) close(); if(nb){ h.querySelectorAll(".badbox").forEach(x=>x.remove()); h.appendChild(nb); } if(ni){ h.querySelectorAll("#rvIdeas").forEach(x=>x.remove()); h.appendChild(ni); } } }
  chips();
  // board on the left, feelings column on its right
  const g=$("gt65r"); if(g&&g.parentNode!==fe2){ fe2.appendChild(g); }
  if(g){ g.querySelectorAll(".gt65c button").forEach(b=>{ if(!b.querySelector(".e")){ const t=b.textContent.trim(), m=t.match(/^(\S+)\s+(.*)$/); if(m) b.innerHTML=`<span class="e">${m[1]}</span><span>${m[2]}</span>`; } }); }
  const has=!!(g&&g.querySelector(".gt65c button")); fe2.classList.toggle("off",!has);
  const colW=COL(), vh=innerHeight, bar=$("rv59").getBoundingClientRect().height||42;
  B.style.setProperty("--cr71c",colW+"px");
  const br=document.querySelector("body.cr67m .boardrow"); if(br){ const w=br.getBoundingClientRect().width, left=Math.max(0,Math.round((innerWidth-12-(w+colW+8))/2)); B.style.setProperty("--cr71l",(innerWidth<600?0:left)+"px");
    const r=br.getBoundingClientRect(); B.style.setProperty("--cr71t",Math.round(r.top+2)+"px"); B.style.setProperty("--cr71x",Math.round(r.right+6)+"px"); } }
window.CRMoves71={tick,pop,close,menu,col:COL};
setInterval(tick,250); addEventListener("resize",tick);
})();
