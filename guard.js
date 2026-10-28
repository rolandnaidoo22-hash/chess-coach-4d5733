/* v57 guard: rule-based checks on a move. No engine needed. Used by the bot warning, blunder tags and the hung-pieces chart. */
(function(){ "use strict"; if(window.CRGuard) return;
const CH=()=>window.ChessLib&&ChessLib.Chess||window.Chess;
const VAL={p:1,n:3,b:3,r:5,q:9,k:0}, NM={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"}, opp=c=>c==="w"?"b":"w";
const A=s=>({p:"a pawn",n:"a knight",b:"a bishop",r:"a rook",q:"the queen",k:"the king"})[s];
function mv(g,u){ try{ return g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); }catch(e){ return null; } }
/* the best capture for the side to move in g; gain = what they win after one recapture */
function bestCap(g){ const C=CH(), them=g.turn(), me=opp(them); let b=null;
  g.moves({verbose:true}).forEach(x=>{ if(!x.captured||x.captured==="k") return; const h=new C(g.fen()); h.move(x); const def=h.isAttacked(x.to,me);
    const gain=VAL[x.captured]-(def?VAL[x.piece]:0); if(!b||gain>b.gain) b={x,gain,def}; }); return b; }
function mateIn1(g){ const C=CH(); for(const x of g.moves({verbose:true})){ if(!/#/.test(x.san)) continue; return x; } return null; }
function nullMove(fen){ const f=fen.split(" "); f[1]=opp(f[1]); f[3]="-"; try{ return new (CH())(f.join(" ")); }catch(e){ return null; } }
/* bot warning: does my move u (from fen) hang a piece or allow mate in 1? */
function check(fen,u){ const C=CH(), g=new C(fen), me=g.turn(); const m=mv(g,u); if(!m) return null; if(g.isGameOver()) return null;
  const mt=mateIn1(g); if(mt) return {k:"mate",sq:mt.to,msg:`Wait: this lets them checkmate you with ${mt.san}.`};
  const b=bestCap(g); if(!b) return null; const took=m.captured?VAL[m.captured]:0; if(b.gain-took<2) return null;
  const pc=NM[b.x.captured], on=b.x.to;
  return {k:"hang",sq:on,piece:b.x.captured,msg:b.def?`Wait: your ${pc} on ${on} can be taken by ${A(b.x.piece)}.`:`Wait: this leaves your ${pc} on ${on} undefended.`}; }
function hangs(fen,u){ const r=check(fen,u); return !!r; }
/* ray from sq in direction; returns squares in order */
const F="abcdefgh"; function ray(sq,df,dr){ const out=[]; let f=F.indexOf(sq[0])+df, r=+sq[1]+dr; while(f>=0&&f<8&&r>=1&&r<=8){ out.push(F[f]+r); f+=df; r+=dr; } return out; }
function pinBy(g,sq,me){ const p=g.get(sq); if(!p||!"brq".includes(p.type)) return null; const dirs=[];
  if("rq".includes(p.type)) dirs.push([1,0],[-1,0],[0,1],[0,-1]); if("bq".includes(p.type)) dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
  for(const [df,dr] of dirs){ let first=null; for(const s of ray(sq,df,dr)){ const q=g.get(s); if(!q) continue; if(!first){ if(q.color!==me||q.type==="k"||q.type==="p") break; first={s,q}; continue; }
      if(q.color===me&&(q.type==="k"||VAL[q.type]>VAL[first.q.type])&&VAL[p.type]<=(q.type==="k"?99:VAL[q.type])) return {s:first.s,t:first.q.type,behind:q.type}; break; } }
  return null; }
function forkBy(g,sq,me){ const p=g.get(sq); if(!p) return null; const hit=[];
  g.board().flat().forEach(x=>{ if(!x||x.color!==me) return; if(x.type!=="k"&&VAL[x.type]<3) return; if(!g.attackers(x.square,opp(me)).includes(sq)) return;
    if(x.type==="k"||VAL[x.type]>VAL[p.type]||!g.isAttacked(x.square,me)) hit.push(x); });
  return hit.length>=2?{p:p.type,hit}:null; }
/* one-line reason for a big mistake. fen = before my move, u = what I played, best = engine best, reply = engine best answer after u, bestScore */
function tag(fen,u,best,reply,bestScore){ const C=CH();
  try{ const g0=new C(fen), me=g0.turn(); const after=new C(fen); const m=mv(after,u); if(!m) return gen();
    const bg=new C(fen), bm=best?mv(bg,best):null;
    if(bm&&(/#/.test(bm.san)||bestScore>90000)) return {k:"mate",t:"Missed mate",why:/#/.test(bm.san)?`${bm.san} was checkmate.`:`You had a forced checkmate starting with ${bm.san}.`};
    const mt=mateIn1(after); if(mt) return {k:"amate",t:"Walked into mate",why:`After ${m.san} they could checkmate with ${mt.san}.`};
    const took=m.captured?VAL[m.captured]:0, ca=bestCap(after);
    const nb=nullMove(fen), cb=nb&&!g0.inCheck()?bestCap(nb):null;
    if(cb&&cb.gain>=2&&ca&&ca.gain-took>=2&&ca.x.to===cb.x.to) return {k:"threat",t:"Ignored a threat",why:`Your ${NM[ca.x.captured]} on ${ca.x.to} was already under attack, and ${m.san} did not save it.`};
    if(ca&&ca.gain-took>=2) return {k:"hung",t:"Hung a piece",why:ca.def?`After ${m.san} your ${NM[ca.x.captured]} on ${ca.x.to} could be taken by ${A(ca.x.piece)}.`:`After ${m.san} your ${NM[ca.x.captured]} on ${ca.x.to} was left undefended.`};
    if(reply){ const h=new C(after.fen()); const r=mv(h,reply); if(r){ const fk=forkBy(h,r.to,me); if(fk) return {k:"fork",t:"Walked into a fork",why:`After ${m.san} their ${r.san} attacked your ${fk.hit.slice(0,2).map(x=>NM[x.type]).join(" and ")} at once.`};
      const pn=pinBy(h,r.to,me); if(pn) return {k:"pin",t:"Walked into a pin",why:`After ${m.san} their ${r.san} pinned your ${NM[pn.t]} to your ${NM[pn.behind]}.`}; } }
    if(bm&&bm.captured){ const h=new C(fen); h.move(bm); const gain=VAL[bm.captured]-(h.isAttacked(bm.to,opp(me))?VAL[bm.piece]:0); if(gain>=2) return {k:"cap",t:"Missed a capture",why:`${bm.san} won ${A(bm.captured)}${bm.captured==="q"?"":" for free"}.`}; }
    if(bm&&/\+/.test(bm.san)) return {k:"check",t:"Missed a check",why:`${bm.san} was a check, and it was much stronger.`};
    return gen(bm); }catch(e){ return gen(); }
  function gen(bm){ return {k:"big",t:"Big mistake",why:bm?`The engine found a much better move here.`:"The engine found a much better move here."}; } }
window.CRGuard={check,hangs,tag,VAL,NM,_bestCap:bestCap,_fork:forkBy,_pin:pinBy};
})();
