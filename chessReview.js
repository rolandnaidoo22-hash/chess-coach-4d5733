/* Game Review summary (Chess.com-style): both players' accuracy and move labels.
   Uses Stockfish evals already stored on the analysed game. Preview feature. */
(function(){
"use strict"; if(window.CRGameReview) return;

const K=0.00368208;
const ORDER=["brilliant","great","best","excellent","good","book","inaccuracy","mistake","miss","blunder"];
const LABEL={brilliant:"Brilliant",great:"Great",best:"Best",excellent:"Excellent",good:"Good",book:"Book",inaccuracy:"Inaccuracy",mistake:"Mistake",miss:"Miss",blunder:"Blunder"};
const ICON={brilliant:"!!",great:"!",best:"★",excellent:"👍",good:"✓",book:"📖",inaccuracy:"?!",mistake:"?",miss:"✕",blunder:"??"};
const COL={brilliant:"#1baaa0",great:"#5b8fbd",best:"#81b64c",excellent:"#96bc4b",good:"#77915f",book:"#a88865",inaccuracy:"#f0c020",mistake:"#e88a2a",miss:"#e56d55",blunder:"#ca3431"};
const NUMCOL={brilliant:"#1baaa0",great:"#5b8fbd",best:"#81b64c",excellent:"#81b64c",good:"#77915f",book:"#a88865",inaccuracy:"#e6b01a",mistake:"#e88a2a",miss:"#e56d55",blunder:"#ca3431"};

function evalToWinPercent(cp){
  if(cp==null||isNaN(+cp)) return 50;
  const x=Math.max(-10000,Math.min(10000,+cp));
  return 50+50*(2/(1+Math.exp(-K*x))-1);
}
function cpOf(ev){
  if(ev==null) return 0;
  if(typeof ev==="number") return ev;
  if(ev.mate!=null){ const m=+ev.mate; if(Math.abs(m)<1) return m>0?10000:-10000; return (10000-Math.abs(m)*10)*(m>0?1:-1); }
  return +ev.cp||0;
}
/* Centipawns from the side that just moved (or is about to move). White-view evals are flipped for Black. */
function sideCp(ev,color){ const c=cpOf(ev); return color==="b"?-c:c; }
function getWinPercentLost(bestEval, playedEval){
  const best=evalToWinPercent(bestEval), played=evalToWinPercent(playedEval);
  return Math.max(0, best-played);
}
function moveAccuracy(winPercentLost){
  if(winPercentLost<=0) return 100;
  const a=103.1668*Math.exp(-0.04354*winPercentLost)-3.1669;
  return Math.max(0,Math.min(100,a));
}
/* Power mean with p=0.5: (mean of sqrt(acc))^2 */
function calculateGameAccuracy(accuracies){
  const xs=(accuracies||[]).map(Number).filter(x=>isFinite(x)&&x>=0);
  if(!xs.length) return null;
  const mean=xs.reduce((s,a)=>s+Math.sqrt(Math.max(0,Math.min(100,a))),0)/xs.length;
  return Math.round(mean*mean*10)/10;
}
function hangingSacrifice(fen,uci){
  try{
    if(!fen||!uci||uci.length<4||typeof ChessLib==="undefined") return false;
    const C=ChessLib.Chess||ChessLib; const g=new C(fen,{skipValidation:true});
    const before=g.fen(), m=g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||undefined});
    if(!m) return false;
    const VAL={p:1,n:3,b:3,r:5,q:9,k:0}; const me=m.color;
    const board=g.board(); let hung=false;
    for(let r=0;r<8;r++) for(let f=0;f<8;f++){ const p=board[r][f]; if(!p||p.color!==me||p.type==="k"||VAL[p.type]<3) continue;
      const sq="abcdefgh"[f]+(8-r); const att=g.attackers?null:null; /* use moves that capture it */
      const attackers=g.moves({verbose:true}).filter(x=>x.to===sq&&x.color!==me);
      /* After our move, opponent to move: check if they can take an undefended high piece we left */
    }
    /* Simpler honest check: we moved a piece onto a square attacked by cheaper/equal and not fully safe, while giving check or capturing less. */
    const g2=new C(before,{skipValidation:true}); const piece=g2.get(uci.slice(0,2)); if(!piece||piece.type==="p"||piece.type==="k") return false;
    const cap=g2.get(uci.slice(2,4)); const capV=cap?VAL[cap.type]:0;
    g2.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||undefined});
    const replies=g2.moves({verbose:true}).filter(x=>x.to===uci.slice(2,4)&&x.captured);
    if(!replies.length) return false;
    const cheap=Math.min(...replies.map(x=>VAL[x.piece]||9));
    return cheap<=VAL[piece.type] && VAL[piece.type]>capV;
  }catch(e){ return false; }
}
function classifyMove(move){
  /* move: {bestEval, playedEval, isBook?, isMiss?, isBrilliant?, isGreat?, playedBest?, forceBook?} in mover's cp */
  const best=+move.bestEval||0, played=+move.playedEval||0;
  const loss=getWinPercentLost(best, played);
  const playedBest=!!move.playedBest || Math.abs(best-played)<1 || loss<0.5;
  let cls;
  if(move.isBook||move.forceBook) cls="book";
  else if(move.isBrilliant) cls="brilliant";
  else if(move.isGreat) cls="great";
  else if(move.isMiss) cls="miss";
  else if(playedBest) cls="best";
  else if(loss<2) cls="excellent";
  else if(loss<5) cls="good";
  else if(loss<10) cls="inaccuracy";
  else if(loss<20) cls="mistake";
  else cls="blunder";
  const acc=playedBest?100:Math.round(moveAccuracy(loss)*10)/10;
  return {classification:cls, cls, accuracy:acc, winPercentLost:Math.round(loss*10)/10};
}
function analyseGame(moves){
  /* moves: [{color,bestEval,playedEval,flags...}] already in mover cp */
  const graded=(moves||[]).map(m=>{ const g=classifyMove(m); return Object.assign({},m,g); });
  const side=c=>{ const mine=graded.filter(x=>x.color===c); const counts={}; ORDER.forEach(k=>counts[k]=mine.filter(x=>x.cls===k).length);
    return {accuracy:calculateGameAccuracy(mine.map(x=>x.accuracy)), counts, n:mine.length, moves:mine}; };
  return {moves:graded, white:side("w"), black:side("b"), w:side("w"), b:side("b")};
}

/* Build from existing Stockfish plies (eval_before / eval / best_uci / alt_eval / cls). */
function fromPlies(plies){
  const out=[];
  (plies||[]).forEach((p,i)=>{
    const c=p.color==="b"?"b":"w";
    const before=sideCp(p.eval_before,c);
    /* Best move keeps before if played best; else use alt/best line estimate: played is after. */
    const after=sideCp(p.eval,c);
    let bestEval=before;
    if(p.alt_eval){ /* alt is second best from White view after the best move would be played — approximate gap */
      const alt=sideCp(p.alt_eval,c);
      /* bestEval ~ before when we don't have direct; if not best, best keeps more of before */
      if(p.uci&&p.best_uci&&p.uci.slice(0,4)===p.best_uci.slice(0,4)) bestEval=after;
      else bestEval=Math.max(after, before); /* best wouldn't lose; use before as ceiling */
    } else if(p.uci&&p.best_uci&&p.uci.slice(0,4)===p.best_uci.slice(0,4)) bestEval=after;
    else bestEval=before;
    const playedBest=!!(p.uci&&p.best_uci&&p.uci.slice(0,4)===p.best_uci.slice(0,4));
    const prev=i>0?plies[i-1]:null;
    const flags={};
    /* Honest Book: keep engine/book label only when the stored cls is book, or early tiny-loss best move. */
    if(p.cls==="book"||(i<16&&playedBest&&(p.ep_loss==null||p.ep_loss<=0.02))) flags.isBook=p.cls==="book";
    /* Miss: only when stored as miss, or opponent just blundered/mistaked and we also lost ≥10% while still better. */
    if(p.cls==="miss") flags.isMiss=true;
    else if(prev&&(prev.cls==="blunder"||prev.cls==="mistake"||(prev.ep_loss||0)>=0.10)){
      const loss=getWinPercentLost(bestEval,after);
      if(!playedBest&&loss>=10&&evalToWinPercent(before)>=55) flags.isMiss=true;
    }
    /* Great: only with a verified gap vs second-best (alt_eval) of ≥10 win% and near-best play. */
    if(p.cls==="great") flags.isGreat=true;
    else if(playedBest&&p.alt_eval){
      const gap=getWinPercentLost(sideCp(p.alt_eval,c), after); /* how much worse alt is than played */
      /* alt_eval is position eval if alt played — lower for us means alt worse */
      const altW=evalToWinPercent(sideCp(p.alt_eval,c)), bestW=evalToWinPercent(after);
      if(bestW-altW>=10&&bestW>=45) flags.isGreat=true;
    }
    /* Brilliant: only if already labelled, or verified hanging sacrifice with strong score. */
    if(p.cls==="brilliant") flags.isBrilliant=true;
    else if((playedBest||getWinPercentLost(bestEval,after)<=2)&&evalToWinPercent(after)>=50&&hangingSacrifice(p.fen_before,p.uci)) flags.isBrilliant=true;

    const g=classifyMove(Object.assign({bestEval, playedEval:after, playedBest, color:c}, flags));
    /* Prefer the engine's stored label when present — it used deeper Chess.com-style rules already. */
    if(p.cls&&ORDER.indexOf(p.cls)>=0){ g.cls=p.cls; g.classification=p.cls; }
    if(p.acc!=null) g.accuracy=+p.acc;
    out.push(Object.assign({ply:p.ply,label:p.label,san:p.san,color:c,bestEval,playedEval:after}, g));
  });
  const side=c=>{ const mine=out.filter(x=>x.color===c); const counts={}; ORDER.forEach(k=>counts[k]=mine.filter(x=>x.cls===k).length);
    const acc=mine.length&&mine.every(x=>x.accuracy!=null)?calculateGameAccuracy(mine.map(x=>x.accuracy)):null;
    return {accuracy:acc, counts, n:mine.length}; };
  return {moves:out, white:side("w"), black:side("b"), w:side("w"), b:side("b")};
}

const CSS=`#gr76{position:fixed;inset:0;z-index:85;background:#1a1a1a;color:#eee;display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
#gr76.on{display:flex}#gr76 *{box-sizing:border-box}
#gr76 .hd{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#262626;border-bottom:1px solid #333;flex:none}
#gr76 .hd b{flex:1;text-align:center;font-size:17px;font-weight:800}
#gr76 .back{min-width:44px;min-height:44px;border:0;background:transparent;color:#fff;font-size:22px;border-radius:10px}
#gr76 .body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:14px 16px 20px}
#gr76 .players{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:6px}
#gr76 .av{width:52px;height:52px;border-radius:8px;background:#3a3a3a;display:flex;align-items:center;justify-content:center;font-size:28px;justify-self:center;border:3px solid transparent}
#gr76 .av.me{border-color:#81b64c}#gr76 .av.opp{border-color:#555}
#gr76 .accrow{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:4px 0 10px}
#gr76 .acc{font-size:28px;font-weight:800;text-align:center;border-radius:10px;padding:6px 10px;min-width:72px;justify-self:center}
#gr76 .acc.w{background:#fff;color:#111}#gr76 .acc.b{background:#333;color:#fff}
#gr76 .alab{font-size:12px;color:#9a9a9a;text-align:center;font-weight:700}
#gr76 .skills{display:flex;align-items:center;gap:10px;margin:4px 0 12px;color:#8ab4f8;font-weight:800;font-size:15px}
#gr76 .skills .star{width:28px;height:28px;border-radius:50%;background:#3b6fb6;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px}
#gr76 .row{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;min-height:36px;gap:6px}
#gr76 .row .n{font-weight:800;font-size:16px;text-align:center}
#gr76 .row .mid{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px}
#gr76 .ic{width:28px;height:28px;border-radius:50%;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex:none}
#gr76 .go{flex:none;margin:8px 16px 18px;min-height:52px;border:0;border-radius:12px;background:#81b64c;color:#fff;font-size:17px;font-weight:800;font:inherit}
#gr76 .mute{color:#8a8a8a;font-size:13px;text-align:center;margin:0 0 8px}`;

let styled=false, last=null, open=false;
function css(){ if(styled) return; styled=true; const s=document.createElement("style"); s.id="gr76css"; s.textContent=CSS; document.head.appendChild(s); }
function $(id){ return document.getElementById(id); }
function showAcc(n){ if(n==null||isNaN(n)) return "–"; const r=Math.round(n*10)/10; return (Math.abs(r-Math.round(r))<0.05?String(Math.round(r)):r.toFixed(1).replace(".",",")); }
function plies(){ try{ return (typeof P!=="undefined"&&P&&P.length)?P:[]; }catch(e){ return []; } }
function meta(){ try{ return (typeof M!=="undefined")?M:null; }catch(e){ return null; } }
function meColor(){ try{ return (typeof UC!=="undefined"&&UC)?UC:"w"; }catch(e){ return "w"; } }

function paintHost(){
  css(); let host=$("gr76");
  if(!host){ host=document.createElement("div"); host.id="gr76"; host.innerHTML=`<div class="hd"><button type="button" class="back" id="gr76back" aria-label="Back">‹</button><b>Game Review</b><span style="width:44px"></span></div><div class="body" id="gr76body"></div><button type="button" class="go" id="gr76go">Continue Review</button>`; document.body.appendChild(host);
    $("gr76back").onclick=close; $("gr76go").onclick=continueReview;
  }
  return host;
}
function render(){
  const host=paintHost(); const Ps=plies(), Md=meta(); if(!Ps.length||!Md){ $("gr76body").innerHTML=`<p class="mute">Analyze a game first, then open Game Review.</p>`; return; }
  /* Prefer stored v7 summary when present (same engine pass); else recompute with our helpers. */
  let wAcc,bAcc,wC,bC;
  try{
    if(typeof S!=="undefined"&&S&&S.v7){ wAcc=S.v7.w.accuracy; bAcc=S.v7.b.accuracy; wC=S.v7.w.counts; bC=S.v7.b.counts; }
  }catch(e){}
  last=fromPlies(Ps);
  if(wAcc==null) wAcc=last.w.accuracy; if(bAcc==null) bAcc=last.b.accuracy;
  if(!wC) wC=last.w.counts; if(!bC) bC=last.b.counts;
  const me=meColor();
  const rows=ORDER.map(k=>{
    const wn=wC[k]||0, bn=bC[k]||0;
    return `<div class="row"><div class="n" style="color:${wn?NUMCOL[k]:"#666"}">${wn}</div><div class="mid"><span class="ic" style="background:${COL[k]}">${ICON[k]}</span><span class="lab">${LABEL[k]}</span></div><div class="n" style="color:${bn?NUMCOL[k]:"#666"}">${bn}</div></div>`;
  }).join("");
  $("gr76body").innerHTML=`
    <div class="players"><div class="av ${me==="w"?"me":"opp"}">♟</div><div></div><div class="av ${me==="b"?"me":"opp"}">♟</div></div>
    <div class="accrow"><div class="acc w">${showAcc(wAcc)}</div><div class="alab">Accuracy</div><div class="acc b">${showAcc(bAcc)}</div></div>
    <div class="skills"><span>Skills</span><span>+1</span><span class="star">★</span></div>
    ${rows}`;
}
function openReview(){ paintHost(); render(); open=true; $("gr76").classList.add("on"); try{ window.scrollTo(0,0); }catch(e){} }
function close(){ open=false; const h=$("gr76"); if(h) h.classList.remove("on"); }
function continueReview(){
  close();
  try{ window.CRHome&&CRHome.setMode("review",true); }catch(e){}
  try{ if(window.CRRev59&&CRRev59.setTab) CRRev59.setTab("moves"); }catch(e){}
  try{ if(window.CRRev66&&CRRev66.tab){ /* keep moves tab; Quick review is available in the bar */ } }catch(e){}
  try{ if(typeof go==="function") go(Math.max(1, typeof cur==="number"&&cur?cur:1), true); }catch(e){}
  try{ window.scrollTo(0,0); }catch(e){}
}
function openLatest(){
  try{ window.CRHome&&CRHome.setMode("review",true); }catch(e){}
  let loaded=false;
  try{ const list=window.ReviewApp&&ReviewApp.loadGames&&ReviewApp.loadGames(); if(list&&list[0]){ const d=ReviewApp.upgrade?ReviewApp.upgrade(list[0].data):list[0].data; if(d&&d.plies&&d.plies.length&&typeof loadData==="function"){ loadData(d); loaded=true; } } }catch(e){}
  if(!loaded){ try{ const raw=localStorage.getItem("chessReview.coach.games.v1"); const L=raw?JSON.parse(raw):[]; const hit=(L||[]).find(x=>x&&x.data&&x.data.plies&&x.data.plies.length); if(hit&&typeof loadData==="function"){ loadData(hit.data); loaded=true; } }catch(e){} }
  setTimeout(()=>{ render(); openReview(); }, loaded?250:100);
}
function afterSummary(){ try{ if(plies().length){ wireEntry(); render(); openReview(); } }catch(e){} }
function wireEntry(){
  const sum=$("rv59sum"); if(!sum) return;
  if(!$("gr76entry")){ const b=document.createElement("button"); b.id="gr76entry"; b.type="button"; b.className="btn primary"; b.textContent="Game Review"; b.style.cssText="width:100%;min-height:48px;margin:8px 0;border-radius:12px;background:#81b64c;color:#fff;font-weight:800;border:0"; b.onclick=()=>{ render(); openReview(); };
    const acc=sum.querySelector(".rv59acc"); if(acc) acc.insertAdjacentElement("afterend",b); else sum.insertAdjacentElement("afterbegin",b); }
  /* Also replace / hide thin accuracy strip when Game Review is available */
}
function hook(){
  if(typeof window.buildSummary==="function"&&!window.buildSummary.__gr76){ const ob=window.buildSummary; const f=function(){ const r=ob.apply(this,arguments); try{ afterSummary(); }catch(e){ console.error(e); } return r; }; f.__gr76=1; window.buildSummary=f; try{ buildSummary=f; }catch(e){} }
  wireEntry();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hook); else hook();
setTimeout(hook, 500);

window.CRGameReview={
  evalToWinPercent, getWinPercentLost, classifyMove, moveAccuracy, calculateGameAccuracy, analyseGame, fromPlies,
  open:openReview, close, continueReview, openLatest, render, ORDER, LABEL
};
window.CRChessReview=window.CRGameReview; /* alias for the pasted helper name */
})();
