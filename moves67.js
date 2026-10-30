/* Move-by-move view for phones: the board stays fixed at the top, a thin eval strip under it, one "this move" card,
   and everything else in small tabs that scroll on their own. The page itself never gets long. */
(function(){
"use strict"; if(window.CRMoves67) return;
const $=id=>document.getElementById(id), B=document.body, ON=()=>B.classList.contains("rv59-moves")&&B.classList.contains("hs-review")&&!B.classList.contains("nogame");
const css=`
body.cr67m{overflow:hidden;height:100vh}
body.cr67m #hs,body.cr67m header,body.cr67m footer,body.cr67m #paste,body.cr67m #pat,body.cr67m #ng16,body.cr67m #homeBtn{display:none!important}
body.cr67m #rv59{position:fixed;top:0;left:0;right:0;z-index:62;background:var(--bg,#f4f0e8);padding:2px 6px 0}
body.cr67m .rv59bar{margin:0!important}body.cr67m .rv59bar button{min-height:36px!important;padding:4px 6px!important;font-size:14px}
body.cr67m section.main{display:block!important;margin:0;padding:0;height:1px;min-height:1px}
body.cr67m section.main .boardcol{position:fixed!important;left:0;right:0;top:var(--cr67a,42px);z-index:61;background:var(--bg,#f4f0e8);padding:0 6px;margin:0!important;max-width:none;transform:none!important}
body.cr67m .boardcol .player{min-height:0!important;height:22px;padding:0 4px!important;margin:0!important;font-size:12.5px}
body.cr67m .boardcol .player .clock{font-size:12px;padding:0 6px!important;min-height:0}
body.cr67m .boardrow{width:min(var(--cr67b,286px),100%);margin:0 auto}
body.cr67m #mv63,body.cr67m .boardcol .controls,body.cr67m #gt65r:not(.cr67in){display:none!important}
body.cr67m #rv59g{position:fixed;left:0;right:0;top:var(--cr67g,400px);z-index:61;background:var(--bg,#f4f0e8);height:30px;overflow:hidden;padding:0 6px;margin:0}
body.cr67m #rv59g .graph{height:30px!important;margin:0!important;padding:0!important;border:0!important;background:none}
body.cr67m #rv59g .graph svg{height:28px!important;width:100%!important}body.cr67m #rv59g .glbl{display:none}
body.cr67m section.main .side{position:fixed!important;left:0;right:0;bottom:0;top:var(--cr67s,432px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 8px 24px;margin:0;z-index:55;background:var(--bg,#f4f0e8);overscroll-behavior:contain}
#cr67card{display:none}body.cr67m #cr67card{display:block;border-radius:14px;padding:8px 10px;margin:0 0 6px;background:var(--card,#fff);border:1px solid var(--line,#ddd)}
#cr67card .hd{display:flex;align-items:center;gap:6px}#cr67card .hd b{flex:1;font-size:15.5px;line-height:1.3}
#cr67card .hd button{min-width:44px;min-height:40px;border-radius:10px;border:1px solid var(--line,#ccc);background:none;font-size:18px;color:inherit}
#cr67card .ex{margin:4px 0 2px;font-size:14px;line-height:1.4}
#cr67card .v42q{margin:4px 0 0;padding:0;border:0;background:none}#cr67card .v42q h5{display:none}#cr67card .v42chips{margin:4px 0;flex-wrap:nowrap;overflow-x:auto}#cr67card .v42chips button{min-height:38px;white-space:nowrap}
#cr67card #gt65r{margin:4px 0 0;overflow-x:auto;white-space:nowrap}
#cr67tabs{display:none}body.cr67m #cr67tabs{display:flex;gap:4px;position:sticky;top:-6px;z-index:3;background:var(--bg,#f4f0e8);padding:4px 0}
#cr67tabs button{flex:1;min-height:38px;border-radius:10px;border:1px solid var(--line,#ccc);background:none;font:inherit;font-size:13.5px;color:inherit}
#cr67tabs button.on{background:var(--accent,#2f7d32);color:#fff;border-color:transparent;font-weight:700}
body.cr67m .side>[data-cr67p]{display:none!important}
body.cr67m[data-cr67t=coach] .side>[data-cr67p=coach],body.cr67m[data-cr67t=moves] .side>[data-cr67p=moves],body.cr67m[data-cr67t=feel] .side>[data-cr67p=feel],body.cr67m[data-cr67t=tools] .side>[data-cr67p=tools]{display:block!important}
body.cr67m[data-cr67t=tools] .side>#tools16[data-cr67p]{display:flex!important;flex-wrap:wrap}
body.cr67m #movecard>.top,body.cr67m #movecard>.expl{display:none}
#cr67feel,#cr67set{display:none}
body:not(.hs-review) #rv59g,body.nogame #rv59g{display:none!important}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
const TABS=[["coach","Coach"],["moves","Moves"],["feel","Feelings"],["tools","Tools"]];
function pane(e){ if(!e||!e.id&&!e.className) return "coach"; const id=e.id||"", c=String(e.className||"");
  if(/movelist/.test(c)||id==="v42rp") return "moves";
  if(id==="cr67feel") return "feel";
  if(["tools16","eng16","ex16","share16","heat16p","voice16","cr67set"].includes(id)) return "tools";
  return "coach"; }
const PN={K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight"};
const GR={brilliant:"brilliant",great:"great move",best:"best move",excellent:"excellent",good:"good",book:"opening theory",inaccuracy:"small slip",mistake:"mistake",miss:"missed chance",blunder:"big mistake"};
function words(p){ if(!p) return "Start position"; const s=p.san||"", who=p.color==="w"?"White":"Black", mv=Math.ceil(p.ply/2);
  let w; if(/^O-O-O/.test(s)) w="castles long"; else if(/^O-O/.test(s)) w="castles short"; else { const piece=PN[s[0]]||"pawn", to=(s.match(/[a-h][1-8](?=[=+#]|$|=)/)||s.match(/[a-h][1-8]/g)||[""]).slice(-1)[0]||"";
    w=`${piece} ${/x/.test(s)?"takes on":"to"} ${to}`; if(/=([QRBN])/.test(s)) w+=`, becomes a ${PN[s.match(/=([QRBN])/)[1]]}`; }
  if(/#/.test(s)) w+=", checkmate"; else if(/\+/.test(s)) w+=", check";
  return `Move ${mv}: ${p.user?"you":who} — ${w}`; }
function build(){ const side=document.querySelector("section.main .side"); if(!side) return false;
  if(!$("cr67card")){ side.insertAdjacentHTML("afterbegin",`<div id="cr67card" aria-live="polite"><div class="hd"><button type="button" id="cr67prev" aria-label="Previous move">‹</button><b id="cr67h"></b><button type="button" id="cr67next" aria-label="Next move">›</button></div><div class="ex" id="cr67ex"></div></div><div id="cr67tabs" role="tablist">${TABS.map(([k,t])=>`<button type="button" data-t="${k}">${t}</button>`).join("")}</div>`);
    $("cr67prev").onclick=()=>{ const b=$("bPrev"); if(b) b.click(); }; $("cr67next").onclick=()=>{ const b=$("bNext"); if(b) b.click(); };
    $("cr67tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>setT(b.dataset.t));
    side.insertAdjacentHTML("beforeend",`<div id="cr67feel" class="card"><h3>How did each move feel?</h3><p>Tag a move with how you felt when you played it, using the row on the move card. After a few games the Gut Check shows how often each feeling was right.</p><button type="button" class="btn primary" id="cr67gut">Open my Gut Check</button></div><div id="cr67set" class="card"><h3>Settings</h3><p>Change how long the computer thinks about each position.</p><button type="button" class="btn" id="cr67str">⚙ Analysis strength</button></div>`);
    $("cr67gut").onclick=()=>{ try{ CRGut65.open(); }catch(e){} }; $("cr67str").onclick=()=>{ try{ CRHome.setMode("set",true); }catch(e){} };
    setT("coach"); }
  return true; }
function setT(t){ B.dataset.cr67t=t; const tb=$("cr67tabs"); if(tb) tb.querySelectorAll("button").forEach(b=>{ b.classList.toggle("on",b.dataset.t===t); b.setAttribute("aria-selected",b.dataset.t===t); }); const s=document.querySelector("section.main .side"); if(s) s.scrollTop=0; }
let last="";
function tick(){ const on=ON(); B.classList.toggle("cr67m",on); if(!on||!build()) return;
  const side=document.querySelector("section.main .side");
  // the card holds the move, the coach's words, the Best move / Why / Threat buttons and the feelings row
  const card=$("cr67card"), q=$("v42rq"), g=$("gt65r");
  if(q&&q.parentNode!==card) card.appendChild(q); if(g&&g.parentNode!==card){ g.classList.add("cr67in"); card.appendChild(g); }
  [...side.children].forEach(e=>{ if(e.id==="cr67card"||e.id==="cr67tabs") return; const p=pane(e); if(e.dataset.cr67p!==p) e.dataset.cr67p=p; });
  // fit: bar, board (about half the screen), eval strip, then the scrolling part
  const vh=innerHeight, bar=$("rv59").getBoundingClientRect().height||42; const bsz=Math.max(220,Math.min(innerWidth-30,Math.round(vh*0.42)-40));
  B.style.setProperty("--cr67b",bsz+"px"); B.style.setProperty("--cr67a",Math.round(bar)+"px");
  const bc=document.querySelector("section.main .boardcol"), bh=bc?bc.getBoundingClientRect().height:bsz+50;
  B.style.setProperty("--cr67g",Math.round(bar+bh)+"px"); B.style.setProperty("--cr67s",Math.round(bar+bh+30)+"px");
  const an=card.querySelector(".v42ans"); if(an&&window.plainChess&&an.dataset.cr67!==an.textContent){ const w=document.createTreeWalker(an,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ const t=plainChess(n.nodeValue); if(t!==n.nodeValue) n.nodeValue=t; } an.dataset.cr67=an.textContent; }
  const i=typeof cur!=="undefined"?cur:0, p=i>0&&typeof P!=="undefined"?P[i-1]:null, key=i+"|"+(p&&p.cls);
  if(key!==last){ last=key; $("cr67h").textContent=words(p)+(p&&p.cls&&GR[p.cls]?` · ${GR[p.cls]}`:"");
    let ex=""; try{ ex=p&&p.expl?(window.plainChess?plainChess(p.expl):p.expl):"Tap › to step through the game."; }catch(e){}
    $("cr67ex").textContent=ex; $("cr67prev").disabled=i<=0; $("cr67next").disabled=typeof P!=="undefined"&&i>=P.length; } }
window.CRMoves67={tick,setT,words};
setInterval(tick,250); addEventListener("resize",tick);
})();
