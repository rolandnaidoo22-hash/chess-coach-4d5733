/* Step through: a move-by-move walk of the reviewed game. Starts at the first
   position, slides each piece, and shows a coach card under the board (never over it).
   The summary tabs stay as they are; this mode opens from a "Step through" button. */
(function(){
"use strict"; if(window.CRStep82) return;
const $=id=>document.getElementById(id), B=document.body;
const E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const BAD=c=>c==="inaccuracy"||c==="mistake"||c==="miss"||c==="blunder";
const COL={brilliant:"#1baca6",great:"#5c8bb0",best:"#81b64c",excellent:"#98bc4b",good:"#77915f",book:"#a88865",inaccuracy:"#e8b11b",mistake:"#ef8e2c",miss:"#ee6b55",blunder:"#ca3431"};
const SYM={brilliant:"!!",great:"!",best:"★",excellent:"+",good:"✓",book:"B",inaccuracy:"?!",mistake:"?",miss:"✗",blunder:"??"};
const NAME=()=>(typeof CLS==="object"&&CLS)||{brilliant:{name:"Superb"},great:{name:"Strong"},best:{name:"Best"},excellent:{name:"Excellent"},good:{name:"Good"},book:{name:"Book"},inaccuracy:{name:"Inaccuracy"},mistake:{name:"Mistake"},miss:{name:"Missed chance"},blunder:{name:"Blunder"}};
const CH=()=>window.ChessLib&&ChessLib.Chess||window.Chess;

const css=`
body.cr82step{overflow:hidden;height:100vh;padding-bottom:0!important}
body.cr82step #hs,body.cr82step header,body.cr82step #rv59,body.cr82step #summary,body.cr82step #paste,body.cr82step #pat,body.cr82step #ng16,body.cr82step #homeBtn,body.cr82step #cr66top,body.cr82step #cr66w,body.cr82step #footer,body.cr82step footer,body.cr82step .hint,body.cr82step #trybar,body.cr82step #pbanner,body.cr82step .boardcol .controls,body.cr82step section.main .side,body.cr82step #cr71feel,body.cr82step #cr71menu,body.cr82step #mv63,body.cr82step #gt65r,body.cr82step #gt65g,body.cr82step #v42rq,body.cr82step #v42rp{display:none!important}
body.cr82step section.main,body.cr82step.rv59on section.main,body.cr82step.rv59on:not(.rv59-moves) section.main,body.cr82step.hs-review section.main,body.cr82step.hs-review:not(.hs-game) section.main{display:block!important;margin:0!important;padding:0!important;position:fixed;left:0;right:0;top:var(--cr82top,48px);bottom:calc(var(--cr82dock,180px) + var(--cr82gh,32px));z-index:80;background:var(--bg,#f4f0e8);overflow:hidden;visibility:visible!important}
body.cr82step section.main .boardcol{position:absolute!important;left:0;right:0;top:0;margin:0!important;padding:0 8px;max-width:none;transform:none!important;background:var(--bg,#f4f0e8)}
body.cr82step .boardcol .player{min-height:0!important;height:22px;padding:0 4px!important;margin:0!important;font-size:12.5px}
body.cr82step .boardrow{width:min(var(--cr82b,300px),100%);margin:0 auto}
body.cr82step #rv59g,body.cr82step.rv59on #rv59g,body.cr82step.rv59on:not(.rv59-moves) #rv59g{display:block!important;position:fixed;left:0;right:0;bottom:var(--cr82dock,180px);z-index:81;height:var(--cr82gh,32px);background:var(--bg,#f4f0e8);padding:0 10px;margin:0;overflow:hidden;visibility:visible!important}
body.cr82step #rv59g .graph{height:var(--cr82gh,32px)!important;margin:0!important;padding:0!important;border:0!important;background:none}
body.cr82step #rv59g .graph svg{height:calc(var(--cr82gh,32px) - 2px)!important;width:100%!important}body.cr82step #rv59g .glbl{display:none}
#cr82bar{display:none}body.cr82step #cr82bar{display:flex;align-items:center;gap:8px;position:fixed;top:0;left:0;right:0;height:var(--cr82top,48px);z-index:90;padding:0 8px;background:var(--bg,#f4f0e8);border-bottom:1px solid var(--line,#e4dfd5);box-sizing:border-box}
#cr82back{min-width:64px;min-height:40px;border-radius:10px;border:1px solid var(--line,#ccc);background:#fff;color:inherit;font:inherit;font-weight:700;font-size:15px}
#cr82bar h1{flex:1;margin:0;font-size:16px;font-weight:800;letter-spacing:-.02em;text-align:center}
#cr82n{font-size:12.5px;color:var(--mute,#666);font-weight:700;min-width:52px;text-align:right}
#cr82dock{display:none}body.cr82step #cr82dock{display:flex;flex-direction:column;position:fixed;left:0;right:0;bottom:0;height:var(--cr82dock,180px);z-index:90;background:var(--bg,#f4f0e8);padding:6px 10px 10px;box-sizing:border-box;gap:6px}
#cr82card{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;border-radius:14px;padding:8px 10px;background:var(--card,#fff);border:1px solid var(--line,#ddd)}
#cr82card .hd{display:flex;align-items:center;gap:8px}
#cr82ico{flex:none;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;line-height:1}
#cr82card .hd b{flex:1;font-size:16px;line-height:1.25}
#cr82who{font-size:12px;color:var(--mute,#666);font-weight:600}
#cr82why{margin:6px 0 0;font-size:14.5px;line-height:1.4}
#cr82acts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
#cr82acts button,#cr82nav button{min-height:42px;border-radius:10px;border:1px solid var(--line,#ccc);background:#fff;color:inherit;font:inherit;font-weight:700;font-size:14px;padding:0 12px}
#cr82acts button.primary,#cr82nav button.primary{background:#3b6fb6;color:#fff;border-color:#3b6fb6}
#cr82acts button:disabled,#cr82nav button:disabled{opacity:.4}
#cr82nav{display:flex;gap:6px;flex:none}
#cr82nav button{flex:1;font-size:18px}
#cr82msg{margin:6px 0 0;font-size:14px;line-height:1.35}
#cr82msg.ok{color:#1b6e2a}#cr82msg.no{color:#b3261e}
html.dark-mode #cr82back,html.dark-mode #cr82acts button,html.dark-mode #cr82nav button{background:#262626;color:#eee;border-color:#444}
html.dark-mode #cr82card{background:#1c1f26;border-color:#333}
html.dark-mode #cr82bar,html.dark-mode #cr82dock,html.dark-mode body.cr82step section.main,html.dark-mode body.cr82step section.main .boardcol,html.dark-mode body.cr82step #rv59g{background:var(--bg,#0f1115)}
@media (min-width:700px){body.cr82step section.main{max-width:520px;left:50%;right:auto;transform:translateX(-50%)}body.cr82step #cr82bar,body.cr82step #cr82dock,body.cr82step #rv59g{max-width:520px;left:50%;right:auto;width:100%;transform:translateX(-50%)}}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

let on=false, showBest=false, trying=false, tryFrom=null, badgeT=0, swipeX=0, swipeY=0, lastKey="";

function clsOf(p){ return p&&p.cls&&NAME()[p.cls]?p.cls:""; }
function labelName(k){ const d=NAME()[k]; return d&&d.name?d.name:(k||""); }
function plain(s){ try{ return window.plainChess?plainChess(s):s; }catch(e){ return s; } }
function ply(){ return typeof cur==="number"?cur:0; }
function plies(){ return (typeof P!=="undefined"&&P)||[]; }
function curP(){ const i=ply(), L=plies(); return i>0?L[i-1]:null; }

function hangs(fen,u){
  try{ if(window.CRGuard&&typeof CRGuard.hangs==="function") return !!CRGuard.hangs(fen,u); }catch(e){}
  return false;
}
function safeBest(p){
  if(!p||!p.best_uci||p.best_uci.slice(0,4)===(p.uci||"").slice(0,4)) return null;
  const fen=p.fen_before||"";
  if(hangs(fen,p.best_uci)) return null;
  return {uci:p.best_uci,san:p.best_san||""};
}

function reason(p){
  if(!p) return "This is the starting position. Tap Next to play the first move. I'll tell you what each one was.";
  let e=""; try{ e=p.expl?String(plain(p.expl)).trim():""; }catch(x){}
  if(e) return e;
  const who=p.user?"You":(p.color==="w"?"White":"Black");
  const n=labelName(p.cls).toLowerCase();
  if(p.cls==="book") return (p.user?"A standard opening move.":"A standard opening move by your opponent.");
  if(BAD(p.cls)) return `${who} played ${p.san}. This was ${n==="missed chance"?"a missed chance":(/^aeiou/.test(n)?"an ":"a ")+n}. Look at the board, then you can ask to see a better idea.`;
  return `${who} played ${p.san}. This was ${n==="best"?"the best move":(/^aeiou/.test(n)?"an ":"a ")+n}.`;
}

function build(){
  if($("cr82bar")) return true;
  B.insertAdjacentHTML("beforeend",
    `<div id="cr82bar"><button type="button" id="cr82back">‹ Back</button><h1>Step through</h1><span id="cr82n"></span></div>
     <div id="cr82dock" role="region" aria-label="Coach notes for this move">
      <div id="cr82card" aria-live="polite"></div>
      <div id="cr82nav">
        <button type="button" id="cr82first" aria-label="First move">⏮</button>
        <button type="button" id="cr82prev" aria-label="Previous move">◀</button>
        <button type="button" id="cr82next" class="primary" aria-label="Next move">▶</button>
        <button type="button" id="cr82last" aria-label="Last move">⏭</button>
      </div>
     </div>`);
  $("cr82back").onclick=()=>close();
  $("cr82first").onclick=()=>stepTo(0);
  $("cr82prev").onclick=()=>stepTo(ply()-1);
  $("cr82next").onclick=()=>stepTo(ply()+1);
  $("cr82last").onclick=()=>stepTo(plies().length);
  wireSwipe();
  return true;
}

function wireSwipe(){
  const area=()=>document.querySelector("body.cr82step .boardrow")||$("board");
  let sx=0,sy=0,ok=false;
  const down=ev=>{ const t=ev.touches?ev.touches[0]:ev; sx=t.clientX; sy=t.clientY; ok=true; };
  const up=ev=>{ if(!ok||!on||trying){ ok=false; return; } ok=false;
    const t=(ev.changedTouches&&ev.changedTouches[0])||ev; const dx=t.clientX-sx, dy=t.clientY-sy;
    if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.2) return;
    if(dx<0) stepTo(ply()+1); else stepTo(ply()-1); };
  document.addEventListener("touchstart",ev=>{ if(!on) return; if(area()&&area().contains(ev.target)) down(ev); },{passive:true});
  document.addEventListener("touchend",ev=>{ if(!on) return; up(ev); },{passive:true});
}

function stepTo(i){
  if(trying) endTry(false);
  showBest=false;
  const n=plies().length;
  i=Math.max(0,Math.min(n,i));
  if(typeof window.go==="function") window.go(i,false);
  else { try{ cur=i; show(); }catch(e){} }
}

function fit(){
  if(!on) return;
  const vh=innerHeight||800, vw=innerWidth||390;
  const top=Math.max(44, Math.min(52, Math.round(vh*0.06)));
  const gh=vw<600?30:Math.min(48,Math.max(30,Math.round(vw/22)));
  const dockMin=150;
  // board is width-limited on a phone; leave at least dockMin under the graph
  const bsz=Math.max(200, Math.min(vw-36, vh-top-gh-dockMin-52));
  B.style.setProperty("--cr82top",top+"px");
  B.style.setProperty("--cr82gh",gh+"px");
  B.style.setProperty("--cr82b",bsz+"px");
  // place the graph just under the board and let the coach card fill the rest
  const bc=document.querySelector("body.cr82step .boardcol");
  const bottom=bc&&bc.getBoundingClientRect().height?Math.round(bc.getBoundingClientRect().bottom):Math.round(top+bsz+52);
  const dock=Math.max(dockMin, vh-bottom-gh-6);
  B.style.setProperty("--cr82dock",dock+"px");
  if(!fit._again){ fit._again=1; requestAnimationFrame(()=>{ fit._again=0; if(on) fit(); }); }
}

function badge(p){
  const g=$("board"); if(!g||!p||!p.uci) return;
  g.querySelectorAll(".cr82badge").forEach(x=>x.remove());
  const k=clsOf(p); if(!k) return;
  const to=p.uci.slice(2,4);
  if(typeof xy!=="function") return;
  const [x,y]=xy(to), col=COL[k]||"#555", sym=SYM[k]||"";
  const cx=x+36, cy=y+10;
  const ns="http://www.w3.org/2000/svg";
  const G=document.createElementNS(ns,"g"); G.setAttribute("class","cr82badge"); G.setAttribute("pointer-events","none");
  const c=document.createElementNS(ns,"circle"); c.setAttribute("cx",cx); c.setAttribute("cy",cy); c.setAttribute("r","9.2");
  c.setAttribute("fill",col); c.setAttribute("stroke","#fff"); c.setAttribute("stroke-width","1.3");
  const t=document.createElementNS(ns,"text"); t.setAttribute("x",cx); t.setAttribute("y",cy+3.4);
  t.setAttribute("text-anchor","middle"); t.setAttribute("font-size",sym.length>1?"8":"10");
  t.setAttribute("font-weight","800"); t.setAttribute("fill","#fff"); t.setAttribute("font-family","system-ui,sans-serif");
  t.textContent=sym;
  G.appendChild(c); G.appendChild(t); g.appendChild(G);
}
function scheduleBadge(p,anim){
  if(badgeT){ clearTimeout(badgeT); badgeT=0; }
  const go=()=>{ badgeT=0; if(on&&!trying&&curP()===p) badge(p); };
  if(anim) badgeT=setTimeout(go,400); else go();
}

function paintCard(){
  const c=$("cr82card"), n=$("cr82n"); if(!c) return;
  const L=plies(), i=ply(), p=curP();
  if(n) n.textContent=L.length?(i+" / "+L.length):"";
  $("cr82first").disabled=$("cr82prev").disabled=i===0||trying;
  $("cr82next").disabled=$("cr82last").disabled=i===L.length||trying;
  $("cr82next").textContent=i===L.length?"✓":"▶";
  $("cr82next").classList.toggle("primary",i!==L.length);

  if(trying) return; // try UI owns the card

  if(i===0){
    const opp=(typeof M!=="undefined"&&M)?( (typeof UC!=="undefined"&&UC==="b")?M.white:M.black ):"your opponent";
    c.innerHTML=`<div class="hd"><b>Start of the game</b></div>
      <p id="cr82why">This is the starting position against <b>${E_(opp)}</b>. Tap Next to play each move. I'll show the grade and a short note under the board.</p>`;
    return;
  }
  const k=clsOf(p), nm=labelName(k), col=COL[k]||"#555", sym=SYM[k]||"";
  const who=p.user?"Your move":(p.color==="w"?"White":"Black")+"'s move";
  const best=BAD(k)?safeBest(p):null;
  const end=i===L.length;
  let res="";
  try{
    if(end&&typeof M!=="undefined"&&M&&M.result){
      const me=(typeof UC!=="undefined"?UC:"w");
      res=M.result==="1/2-1/2"?"The game ended in a draw.":M.result==="*"?"The game is unfinished.":((M.result==="1-0")===(me==="w")?"You won this game.":"You lost this game.");
    }
  }catch(e){}
  c.innerHTML=`<div class="hd">${k?`<span id="cr82ico" style="background:${col}">${E_(sym)}</span>`:""}<b>${E_(p.label||p.san||"")} · ${E_(nm||"Move")}</b><span class="cr82who">${E_(who)}</span></div>
    <p id="cr82why">${E_(reason(p))}${res?" "+res:""}</p>
    ${best?`<div id="cr82acts"><button type="button" class="primary" id="cr82best">Show best</button><button type="button" id="cr82try">Try again</button></div>`:""}
    <div id="cr82msg"></div>`;
  const b=$("cr82best"); if(b) b.onclick=()=>revealBest();
  const t=$("cr82try"); if(t) t.onclick=()=>startTry();
  if(showBest&&best) markBestShown(best);
}

function markBestShown(best){
  const b=$("cr82best"), m=$("cr82msg");
  if(b){ b.disabled=true; b.textContent="Best shown"; }
  if(m) m.innerHTML=`A better idea was <b>${E_(best.san||"that move")}</b>. The green arrow shows it.`;
}

function revealBest(){
  const p=curP(); if(!p) return;
  const best=safeBest(p);
  if(!best){ const m=$("cr82msg"); if(m){ m.className="cr82msg"; m.textContent="I don't have a safe better move to show here."; } return; }
  showBest=true;
  try{ lastShown=-9; }catch(e){}
  if(typeof window.show==="function") window.show();
  else paintCard();
}

function startTry(){
  const p=curP(); if(!p||!p.fen_before) return;
  const best=safeBest(p); if(!best) return;
  trying=true; tryFrom=null; showBest=false;
  const me=(typeof UC!=="undefined"?UC:p.color);
  $("cr82first").disabled=$("cr82prev").disabled=$("cr82next").disabled=$("cr82last").disabled=true;
  $("cr82card").innerHTML=`<div class="hd"><b>Try again</b><span class="cr82who">Before ${E_(p.label||p.san)}</span></div>
    <p id="cr82why">In the game you played <b>${E_(p.san)}</b>. Find a better move. Tap a piece, then the square it should go to.</p>
    <div id="cr82acts"><button type="button" id="cr82show">Show best</button><button type="button" id="cr82done">Back to the game</button></div>
    <div id="cr82msg"></div>`;
  $("cr82show").onclick=()=>tryReveal(best);
  $("cr82done").onclick=()=>endTry(true);
  drawTry(p.fen_before, []);
}

function drawTry(fen, hl, arrows){
  try{ if(typeof drawBoard==="function") drawBoard(fen, hl||[], arrows||[], null, null); }catch(e){}
  try{ const p=curP(); if(p&&p.eval_before&&typeof drawEval==="function") drawEval(p.eval_before); }catch(e){}
}

function tryUci(from,to){
  const p=curP(); if(!p) return;
  const C=CH(); if(!C) return;
  let m=null, u="";
  try{ const g=new C(p.fen_before); m=g.move({from,to,promotion:"q"}); if(m) u=(m.from+m.to+(m.promotion||"")); }catch(e){ m=null; }
  const box=$("cr82msg");
  const say=(t,c)=>{ if(box){ box.className="cr82msg "+(c||""); box.innerHTML=t; } };
  if(!m){ say("That isn't a legal move. Try again.","no"); tryFrom=null; drawTry(p.fen_before,[]); return; }
  if(u.slice(0,4)===(p.uci||"").slice(0,4)){ say("That's the move from the game. Try something else.","no"); tryFrom=null; drawTry(p.fen_before,[]); return; }
  if(hangs(p.fen_before,u)){ say("That move leaves a piece in danger. Have another look.","no"); tryFrom=null; drawTry(p.fen_before,[]); return; }
  const best=safeBest(p);
  if(best&&u.slice(0,4)===best.uci.slice(0,4)){
    say(`Yes — <b>${E_(best.san)}</b> is the better move.`,"ok");
    showBest=true; tryFrom=null;
    drawTry(m.after||p.fen, [from,to], [{from,to,color:"green"}]);
    badge(Object.assign({},p,{uci:best.uci,cls:"best"}));
    return;
  }
  say("Not quite. Look at checks, captures and threats, or tap Show best.","no");
  tryFrom=null; drawTry(p.fen_before,[]);
}

function tryReveal(best){
  const p=curP(); if(!p||!best) return;
  if(hangs(p.fen_before,best.uci)) return;
  showBest=true;
  const from=best.uci.slice(0,2), to=best.uci.slice(2,4);
  drawTry(p.fen, [p.uci.slice(0,2),p.uci.slice(2,4)], [{from,to,color:"green"}]);
  badge(p);
  const box=$("cr82msg"); if(box){ box.className="cr82msg"; box.innerHTML=`A better idea was <b>${E_(best.san)}</b>. The green arrow shows it.`; }
}

function endTry(redraw){
  trying=false; tryFrom=null; showBest=false;
  if(redraw&&typeof window.show==="function"){ try{ lastShown=-9; }catch(e){} window.show(); }
  else paintCard();
}

function boardSq(ev){
  try{ if(typeof window.boardSq==="function") return window.boardSq(ev); }catch(e){}
  const g=$("board"); if(!g) return null;
  const r=g.getBoundingClientRect();
  const t=ev.changedTouches?ev.changedTouches[0]:ev;
  const x=(t.clientX-r.left)/r.width, y=(t.clientY-r.top)/r.height;
  if(x<0||x>1||y<0||y>1) return null;
  const f=Math.floor(8*x), rk=Math.floor(8*y);
  const me=(typeof UC!=="undefined"?UC:"w");
  return me==="w"?"abcdefgh"[f]+(8-rk):"abcdefgh"[7-f]+(rk+1);
}

function onBoardTap(ev){
  if(!on) return;
  ev.stopPropagation();
  if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
  if(!trying) return;
  const sq=boardSq(ev); if(!sq) return;
  const p=curP(); if(!p) return;
  if(!tryFrom){
    // must pick one of our pieces
    try{
      const C=CH(); if(C){ const g=new C(p.fen_before); const piece=g.get(sq); if(!piece||piece.color!==g.turn()) return; }
    }catch(e){}
    tryFrom=sq; drawTry(p.fen_before,[sq]); return;
  }
  if(sq===tryFrom){ tryFrom=null; drawTry(p.fen_before,[]); return; }
  const from=tryFrom; tryFrom=null; tryUci(from,sq);
}

function hookBoard(){
  const g=$("board"); if(!g||g.dataset.cr82) return;
  g.dataset.cr82="1";
  g.addEventListener("click",onBoardTap,true);
}

function afterShow(anim){
  if(!on) return;
  paintCard();
  const p=curP();
  if(!trying) scheduleBadge(p,anim);
  fit();
}

function open(){
  const L=plies();
  if(!L.length) return;
  build(); hookBoard();
  on=true; showBest=false; trying=false; tryFrom=null; lastKey="";
  B.classList.add("cr82step","hs-review","hs-game","hs-on");
  B.classList.remove("cr67m","cr66walking","nogame");
  try{ if(window.CRRev66&&CRRev66.stop) CRRev66.stop(); }catch(e){}
  fit();
  stepTo(0);
  try{ window.scrollTo(0,0); }catch(e){}
}

function close(){
  if(!on) return;
  if(trying) endTry(false);
  on=false; showBest=false;
  if(badgeT){ clearTimeout(badgeT); badgeT=0; }
  B.classList.remove("cr82step");
  const g=$("board"); if(g) g.querySelectorAll(".cr82badge").forEach(x=>x.remove());
  try{ if(window.CRRev59&&CRRev59.setTab) CRRev59.setTab("sum"); }catch(e){}
  try{ window.scrollTo({top:0}); }catch(e){}
}

function addButton(){
  const s=$("rv59sum"); if(!s||!plies().length) return;
  if($("cr82go")) return;
  const btn=document.createElement("button");
  btn.type="button"; btn.id="cr82go"; btn.className="rv59big";
  btn.textContent="▶ Step through";
  btn.style.margin="0 0 10px";
  const acc=s.querySelector(".rv59acc");
  if(acc&&acc.nextSibling) s.insertBefore(btn, acc.nextSibling);
  else s.insertBefore(btn, s.firstChild);
  btn.onclick=()=>open();
}

/* Keep the existing summary markup, just add our button after each rebuild. */
function hookSummary(){
  const s=$("rv59sum"); if(!s||s.dataset.cr82mo) return;
  s.dataset.cr82mo="1";
  const mo=new MutationObserver(()=>{ if(!$("cr82go")) addButton(); });
  mo.observe(s,{childList:true});
  addButton();
}

function hookFns(){
  if(typeof window.drawBoard==="function"&&!window.drawBoard.__cr82){
    const od=window.drawBoard;
    const w=function(fen,hl,arrows,checkSq,anim){
      let a=arrows, an=anim;
      if(on){
        if(trying) an=null;
        if(!showBest) a=(arrows||[]).filter(x=>x&&x.color!=="green");
        else if(curP()){
          const best=safeBest(curP());
          if(best){
            const from=best.uci.slice(0,2), to=best.uci.slice(2,4);
            const has=(arrows||[]).some(x=>x&&x.from===from&&x.to===to);
            a=has?(arrows||[]):(arrows||[]).concat([{from,to,color:"green"}]);
          }
        }
      }
      const r=od.call(this,fen,hl,a,checkSq,an);
      try{ if(on&&!trying) scheduleBadge(curP(),!!an); }catch(e){}
      return r;
    };
    w.__cr82=1; window.drawBoard=w; try{ drawBoard=w; }catch(e){}
  }
  if(typeof window.show==="function"&&!window.show.__cr82){
    const os=window.show;
    const w=function(){ const r=os.apply(this,arguments); try{ if(on) afterShow(); }catch(e){} return r; };
    w.__cr82=1; window.show=w; try{ show=w; }catch(e){}
  }
  if(typeof window.go==="function"&&!window.go.__cr82){
    const og=window.go;
    const w=function(i,scroll){ if(on) return og.call(this,i,false); return og.apply(this,arguments); };
    w.__cr82=1; window.go=w; try{ go=w; }catch(e){}
  }
  if(typeof window.loadData==="function"&&!window.loadData.__cr82){
    const ol=window.loadData;
    const w=function(){ if(on) close(); const r=ol.apply(this,arguments); try{ hookSummary(); addButton(); }catch(e){} return r; };
    w.__cr82=1; window.loadData=w; try{ loadData=w; }catch(e){}
  }
}

document.addEventListener("keydown",e=>{
  if(!on) return;
  if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")) return;
  if(e.key==="Escape"){ e.preventDefault(); if(trying) endTry(true); else close(); }
});

function tick(){ hookFns(); hookSummary(); hookBoard(); if(on){ fit(); if(!$("cr82go")) addButton(); } }
const boot=()=>{ hookFns(); hookSummary(); addButton(); };
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
setInterval(tick,400);
addEventListener("resize",()=>{ if(on) fit(); });

window.CRStep82={open,close,on:()=>on};
})();
