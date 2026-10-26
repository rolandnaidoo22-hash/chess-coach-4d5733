/* style-model.js (v52): scores every legal move by how likely THIS player is to choose it.
   Features mix the engine's view (rank, how much a move gives away) with plain habits (captures, checks, retreats...).
   Weights are learned on the box from the player's own analysed games and stored as JSON. */
(function(){
"use strict";
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const NAMES=["inTop","rank1","rank2","rank3","rank4plus","loss","nearBest","notTopOpen","notTopMid","notTopEnd","notTopFast",
 "capture","capValue","check","mate","pawn","knight","bishop","rook","queen","kingWalk","castle","pawnPush","promote",
 "forward","backward","sideways","recapture","samePieceAgain","distance","landsHanging","capture_notTop","check_notTop","escapeCheck","pieceAttackedMoves",
 "threat","capFree","capUp","develop","activity","center","loss0_50","loss50_150","loss150p","rank1_capture","rank1_check","rank1_open","rank1_end","nearEnemyKing","queenEarly","pawnStorm","defends"];
const FL="abcdefgh";
/* squares a piece on sq attacks (board = chess.js board() array, row 0 = rank 8) */
function attacksFrom(bd,sq,p){ const f=FL.indexOf(sq[0]), r=+sq[1]-1, out=[], at=(F,R)=>F>=0&&F<8&&R>=0&&R<8, occ=(F,R)=>bd[7-R][F], add=(F,R)=>out.push(FL[F]+(R+1));
  const ray=dirs=>dirs.forEach(([a,b])=>{ let F=f+a,R=r+b; while(at(F,R)){ add(F,R); if(occ(F,R)) break; F+=a; R+=b; } });
  const step=dirs=>dirs.forEach(([a,b])=>{ if(at(f+a,r+b)) add(f+a,r+b); });
  if(p.type==="p"){ const d=p.color==="w"?1:-1; step([[-1,d],[1,d]]); }
  else if(p.type==="n") step([[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]);
  else if(p.type==="k") step([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  else { if(p.type!=="b") ray([[1,0],[-1,0],[0,1],[0,-1]]); if(p.type!=="r") ray([[1,1],[1,-1],[-1,1],[-1,-1]]); }
  return out; }
const pieceAt=(bd,sq)=>bd[8-+sq[1]][FL.indexOf(sq[0])];

function feats(C,fen,legal,cand,ctx){ // cand: {uci:{rank,loss}}; ctx: {phase:'o'|'m'|'e', fast:bool, oppLastTo, myLastTo}
  const g=new C(fen), me=g.turn(), op=me==="w"?"b":"w", inChk=g.inCheck(), ph=ctx.phase, fast=ctx.fast?1:0;
  return legal.map(m=>{ const uci=m.from+m.to+(m.promotion||""), c=cand[uci], top=c?1:0, rk=c?c.rank:9, loss=c?Math.min(c.loss,600):0;
    const cap=m.captured?1:0, pc=m.piece, cs=/[kq]/.test(m.flags)&&pc==="k"&&Math.abs(m.from.charCodeAt(0)-m.to.charCodeAt(0))>1?1:0;
    const dr=(+m.to[1]-+m.from[1])*(me==="w"?1:-1), df=Math.abs(m.to.charCodeAt(0)-m.from.charCodeAt(0));
    let fa=0; try{ fa=g.isAttacked(m.from,op)?1:0; }catch(e){}
    let capFree=0,capUp=0; if(cap){ const cv=VAL[m.captured]; capFree=g.isAttacked(m.to,op)?0:1; capUp=cv>=VAL[pc]?1:0; }
    g.move(m); let hang=0; try{ hang=pc!=="k"&&g.isAttacked(m.to,op)&&!g.isAttacked(m.to,me)?1:0; }catch(e){}
    const bd=g.board(), att=attacksFrom(bd,m.to,{type:m.promotion||pc,color:me}); let thr=0,dfd=0;
    att.forEach(s=>{ const q=pieceAt(bd,s); if(!q) return; if(q.color===op&&q.type!=="k"&&(VAL[q.type]>VAL[m.promotion||pc]||!g.isAttacked(s,op))) thr=1; if(q.color===me&&g.isAttacked(s,op)) dfd=1; });
    let near=0; for(let R=0;R<8;R++) for(let F=0;F<8;F++){ const q=bd[R][F]; if(q&&q.type==="k"&&q.color===op) near=Math.max(Math.abs(F-FL.indexOf(m.to[0])),Math.abs(7-R-(+m.to[1]-1)))<=2?1:0; }
    g.undo();
    const chk=/\+|#/.test(m.san)?1:0, nt=1-top, L=loss, r1=rk===1?1:0, ply=ctx.ply||0;
    return [top,rk===1?1:0,rk===2?1:0,rk===3?1:0,top&&rk>=4?1:0,loss/100,top&&loss<=20?1:0,nt*(ph==="o"),nt*(ph==="m"),nt*(ph==="e"),nt*fast,
      cap,cap?VAL[m.captured]/9:0,chk,m.san.includes("#")?1:0,+(pc==="p"),+(pc==="n"),+(pc==="b"),+(pc==="r"),+(pc==="q"),+(pc==="k"&&!cs),cs,+(pc==="p"&&!cap),m.promotion?1:0,
      +(dr>0),+(dr<0),+(dr===0&&pc!=="k"),+(cap&&m.to===ctx.oppLastTo),+(m.from===ctx.myLastTo),Math.max(Math.abs(dr),df)/7,hang*VAL[pc]/9,cap*nt,chk*nt,+inChk,fa,
      thr,capFree,capUp,+((pc==="n"||pc==="b")&&+m.from[1]===(me==="w"?1:8)&&ply<20),att.length/14,+(FL.indexOf(m.to[0])>=2&&FL.indexOf(m.to[0])<=5&&+m.to[1]>=3&&+m.to[1]<=6),
      top*(L<50),top*(L>=50&&L<150),top*(L>=150),r1*cap,r1*chk,r1*(ply<20),r1*(ph==="e"),near,+(pc==="q"&&ply<16),+(pc==="p"&&"abcfgh".includes(m.to[0])&&ply>=10),dfd]; }); }
const ENGINE=new Set(["inTop","rank1","rank2","rank3","rank4plus","loss","nearBest","notTopOpen","notTopMid","notTopEnd","notTopFast","capture_notTop","check_notTop"]);
/* strength k>=1 pushes the engine features harder (more like the engine, less like the player) */
function scores(W,X,k){ k=k||1; return X.map(x=>x.reduce((s,v,i)=>s+v*(W[i]||0)*(ENGINE.has(NAMES[i])?k:1),0)); }
function softmax(s,T){ T=T||1; const mx=Math.max(...s), e=s.map(v=>Math.exp((v-mx)/T)), z=e.reduce((a,b)=>a+b,0); return e.map(v=>v/z); }
window.CRStyleModel={NAMES,feats,scores,softmax};
})();
