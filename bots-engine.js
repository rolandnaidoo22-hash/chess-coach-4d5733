/* v52: bot move picker. Separate from drawing: CRBotEngine.move(fen, bot) -> Promise<{from,to,promotion,san,blunder}>.
   Stockfish runs as its own Web Worker file (stockfish.js + stockfish.wasm, bundled locally, GPLv3, see STOCKFISH-LICENSE.txt). */
(function(){
"use strict"; if(window.CRBotEngine) return;
const CH=()=>window.ChessLib&&window.ChessLib.Chess||window.Chess;
const VAL={p:100,n:300,b:310,r:500,q:900,k:0};
let W=null, ready=null, busy=Promise.resolve(), listener=null;
function boot(){ if(ready) return ready;
  ready=new Promise((res,rej)=>{ try{ W=new Worker("stockfish.js"); }catch(e){ rej(e); return; }
    W.onmessage=e=>{ const l=String(e.data||""); if(listener) listener(l); };
    W.onerror=e=>rej(e);
    listener=l=>{ if(l==="uciok"){ W.postMessage("setoption name Threads value 1"); W.postMessage("isready"); } else if(l==="readyok"){ listener=null; res(); } };
    W.postMessage("uci"); setTimeout(()=>rej(new Error("engine timeout")),20000); });
  return ready; }
/* ask Stockfish for its top `mpv` moves with scores (from the side to move), thinking at most `ms`. Resets MultiPV to 1 after. */
function candidates(fen,mpv,ms){ const run=busy.then(()=>new Promise((res,rej)=>{ const got={};
  const to=setTimeout(()=>{ listener=null; W.postMessage("stop"); },ms+3000);
  listener=l=>{ if(l.startsWith("info")&&l.includes(" pv ")){ const k=+(/multipv (\d+)/.exec(l)||[0,1])[1], cp=/score cp (-?\d+)/.exec(l), mt=/score mate (-?\d+)/.exec(l), pv=/ pv (\S+)/.exec(l);
      if(pv) got[k]={uci:pv[1],score:mt?(+mt[1]>0?100000-+mt[1]:-100000-+mt[1]):+cp[1]}; }
    else if(l.startsWith("bestmove")){ clearTimeout(to); listener=null; W.postMessage("setoption name MultiPV value 1"); const b=l.split(" ")[1];
      const list=Object.keys(got).sort((a,b)=>a-b).map(k=>got[k]); if(!list.length&&b&&b!=="(none)") list.push({uci:b,score:0}); res(list); } };
  W.postMessage("setoption name MultiPV value "+mpv); W.postMessage("position fen "+fen); W.postMessage("go movetime "+ms); }));
  busy=run.catch(()=>{}); return run; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function uciOf(m){ return m.from+m.to+(m.promotion||""); }
/* moves that leave one of our pieces (knight or bigger) attacked and not defended */
function hangingMoves(fen){ const C=CH(), g=new C(fen), me=g.turn(), op=me==="w"?"b":"w", out=[];
  g.moves({verbose:true}).forEach(m=>{ if(m.captured) return; const h=new C(fen); h.move(m); if(h.inCheck()||h.isGameOver()) return;
    let hang=null; h.board().forEach(r=>r.forEach(x=>{ if(!x||x.color!==me||x.type==="p"||x.type==="k") return;
      const at=h.attackers?h.attackers(x.square,op):[]; const df=h.attackers?h.attackers(x.square,me):[]; if(at.length&&!df.length&&(!hang||VAL[x.type]>VAL[hang.type])) hang=x; }));
    if(hang&&!new C(fen).board().some(r=>r.some(x=>x&&x.square===hang.square&&x.color===me&&new C(fen).attackers(x.square,op).length))) out.push(m); });
  return out; }
async function move(fen,bot,opt){ opt=opt||{}; const C=CH(), g=new C(fen), legal=g.moves({verbose:true}); if(!legal.length) return null;
  const t0=Date.now(), me=g.turn(), hist=opt.history||[];
  const done=async m=>{ const wait=Math.max(0,(opt.delay!=null?opt.delay:500+Math.random()*700)-(Date.now()-t0)); if(wait) await sleep(wait); return m; };
  // 1. opening book from the bot's own list
  const book=bot.openings&&bot.openings[me==="w"?0:1]; const myPly=Math.floor(hist.length/2);
  if(book&&myPly<book.length&&Math.random()<0.85){ const m=legal.find(x=>x.san===book[myPly]); if(m) return done(Object.assign({book:true},m)); }
  // 2. blunder: deliberately leave a piece hanging
  if(Math.random()<(bot.blunderRate||0)){ const h=hangingMoves(fen); if(h.length) return done(Object.assign({blunder:true},pick(h))); }
  // 3. randomness: any legal move
  if(Math.random()<(bot.randomness||0)) return done(Object.assign({random:true},pick(legal)));
  // 4. Stockfish candidates + style layer
  let list=[]; try{ await boot(); list=await candidates(fen,bot.mpv||3,bot.movetime||500); }catch(e){ console.warn("bot engine",e); }
  if(!list.length) return done(pick(legal));
  const best=list[0].score, T=Math.max(1,bot.temp||30);
  const scored=list.map(c=>{ const m=legal.find(x=>uciOf(x)===c.uci)||legal.find(x=>x.from+x.to===c.uci.slice(0,4)); if(!m) return null;
    let s=c.score; if(Math.abs(best)<90000||Math.abs(s)<90000){ if(m.captured) s+=(bot.aggression||0)*(1+VAL[m.captured]/900); if(/\+|#/.test(m.san)) s+=(bot.aggression||0)/2; }
    return {m,s}; }).filter(Boolean);
  if(best>=90000) return done(scored[0].m); // never miss a forced mate
  const top=Math.max(...scored.map(x=>x.s)); const w=scored.map(x=>Math.exp((x.s-top)/T)); let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<scored.length;i++){ r-=w[i]; if(r<=0) return done(scored[i].m); }
  return done(scored[0].m); }
window.CRBotEngine={move,boot,candidates,hangingMoves};
})();
