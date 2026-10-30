/* v63: Review a game - board pinned at the top; moves, eval and notes scroll underneath. */
(function(){ "use strict"; if(window.CRPin63) return;
const $=id=>document.getElementById(id);
const css=document.createElement("style"); css.textContent=`
body.rv59-moves section.main .boardcol,body:not(.rv59on) section.main .boardcol{position:sticky;top:0;z-index:25;background:var(--bg,#f7f4ee);padding:4px 0 6px;box-shadow:0 6px 10px -8px rgba(0,0,0,.35)}
section.main .boardrow{justify-content:center}
section.main .boardbox{flex:0 1 auto;width:min(100%,52vh);max-width:560px}
@media (max-width:900px){section.main .boardbox{width:min(calc(100vw - 58px),50vh)}section.main .boardcol .hint{display:none}
 section.main .boardcol{gap:4px}section.main .player{padding:3px 10px;font-size:14px;min-height:0}
 section.main .controls button{min-height:44px;padding:6px 0;flex:1;max-width:84px}}
@media (max-height:700px) and (max-width:900px){section.main .boardbox{width:min(calc(100vw - 58px),46vh)}section.main .player{font-size:13px;padding:2px 8px}}
#mv63{font-size:16px;font-weight:800;text-align:center;color:var(--ink,#222);min-height:22px;line-height:1.35}
#mv63 small{font-weight:600;color:var(--mute,#666);font-size:13px;margin-left:4px}
.mcell.cur{background:#f5c518!important;color:#2b2100!important;outline:2px solid #b38b00!important;font-weight:800;border-radius:6px}
html.dark-mode body section.main .boardcol{background:#1b1b1b}html.dark-mode #mv63{color:#eee}`;
document.head.appendChild(css);
const GRADE={best:"best move",brilliant:"brilliant",great:"great move",excellent:"excellent",good:"good",book:"book move",inaccuracy:"inaccuracy",mistake:"mistake",miss:"missed chance",blunder:"blunder"};
function label(){ const el=$("mv63"); if(!el||typeof P==="undefined"||!P) return; const i=cur;
  if(!i){ el.innerHTML=`Start position <small>· tap ▶ to step through</small>`; return; }
  const p=P[i-1], n=Math.floor((i-1)/2)+1, side=p.color==="w"?"White":"Black", g=GRADE[p.cls];
  el.innerHTML=`Move ${n}: ${side} ${String(p.san).replace(/[<>&]/g,"")}${g?` <small>· ${g}</small>`:""}`; }
function pinBottom(){ const b=document.querySelector("section.main .boardcol"); if(!b) return 0; const r=b.getBoundingClientRect(); return getComputedStyle(b).position==="sticky"?Math.max(0,r.bottom):0; }
/* keep the current move visible in the space under the pinned board */
function keepMove(){ const c=document.querySelector(".mcell.cur"); if(!c||!c.offsetParent) return; const r=c.getBoundingClientRect(), top=pinBottom()+8, bot=innerHeight-12;
  if(r.top<top) scrollBy(0,r.top-top-24); else if(r.bottom>bot) scrollBy(0,r.bottom-bot+24); }
function tidy(){ const bc=document.querySelector("section.main .boardcol"), sd=document.querySelector("section.main .side"); if(!bc||!sd) return;
  /* extra panels belong with the notes that scroll, not in the pinned board area */
  ["v42rq","v42rp"].forEach(id=>{ const e=$(id); if(e&&bc.contains(e)) sd.insertBefore(e,sd.firstChild); }); }
function ensure(){ tidy(); if($("mv63")) return; const c=document.querySelector("section.main .controls"); if(!c) return; const d=document.createElement("div"); d.id="mv63"; d.setAttribute("aria-live","polite"); c.parentNode.insertBefore(d,c); }
const os=window.show; if(typeof os==="function") window.show=show=function(){ const r=os.apply(this,arguments); try{ ensure(); label(); requestAnimationFrame(keepMove); clearTimeout(window.__km63); window.__km63=setTimeout(keepMove,180); }catch(e){ console.warn(e); } return r; };
/* the old "jump to board" scroll is not needed: the board is always on screen; just bring the moves area into view once */
const sb=window.scrollToBoard; if(typeof sb==="function") window.scrollToBoard=scrollToBoard=function(){ const m=document.querySelector("section.main"); if(!m) return sb(); const t=m.getBoundingClientRect().top; if(t>innerHeight*.5||t<-m.offsetHeight) scrollTo({top:t+scrollY-4}); };
ensure();
window.CRPin63={label,keepMove,pinBottom};
})();
