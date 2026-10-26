/* v52: "Ultimo", the bot that adapts to you. Everything stays on this phone (localStorage). No server, no notifications.
   After each game: stores it, steps its strength up when you win (and remembers the line it lost in, to avoid it next time),
   eases a little when it wins, and prepares replies to the openings you play most (Stockfish's best reply, worked out on the phone). */
(function(){
"use strict"; if(window.CRUltimate) return;
const K="chessReview.v52.ultimo", HOUR=36e5, PLIES=10;
const LS={get:(d)=>{ try{ return JSON.parse(localStorage.getItem(K))||d; }catch(e){ return d; } },set:v=>{ try{ localStorage.setItem(K,JSON.stringify(v)); }catch(e){} }};
const S=()=>LS.get({level:3,games:[],avoid:[],prep:{},seen:{},learned:"",invite:null,won:0,lost:0,drawn:0});
const key=fen=>fen.split(" ").slice(0,4).join(" ");
const NM={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
function knobs(lv){ const t=(lv-1)/9; return {elo:Math.round(600+t*1600),movetime:Math.round(200+t*1300),mpv:t<.5?4:3,temp:Math.round(120-t*110),randomness:+(0.05*(1-t)).toFixed(3),blunderRate:+(0.08*(1-t)).toFixed(3),aggression:30}; }
const G="#d4af37", D="#1b1712", L="#f3e3b0";
const BOT={id:"ultimo",name:"Ultimo",adaptive:true,style:"Adapts to you",tag:"Learns from your games",
 story:"A wandering chess tinkerer who keeps a notebook of every game. Beat Ultimo and it studies the line and comes back stronger.",
 openings:null,
 chat:{start:["My notebook is open. Let's play.","I've been studying. Ready?"],capture:["Noted.","That one goes in the notebook."],check:["Check! Did you see that coming?"],lost:["You win. I'm writing this one down."],won:["My homework paid off!"],draw:["A draw. We're well matched."]},
 avatar:`<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="${D}" stroke="${G}" stroke-width="2"/><rect x="18" y="38" width="28" height="18" rx="2" fill="${L}"/><path d="M32 38v18" stroke="${D}" stroke-width="1.5"/><circle cx="32" cy="25" r="10" fill="${G}"/><path d="M21 21q11-14 22 0" fill="${G}" stroke="${L}" stroke-width="2"/><circle cx="28" cy="25" r="2.6" fill="none" stroke="${D}" stroke-width="1.4"/><circle cx="36" cy="25" r="2.6" fill="none" stroke="${D}" stroke-width="1.4"/><path d="M29 30q3 2 6 0" stroke="${D}" stroke-width="1.5" fill="none"/><path d="M48 14l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="${G}"/></svg>`};
function profile(){ const s=S(); return Object.assign({},BOT,knobs(s.level),{level:s.level}); }
Object.defineProperty(BOT,"elo",{get:()=>knobs(S().level).elo,enumerable:true});
/* plain English for a move, without notation */
function say(m){ return `${m.color==="w"?"White":"Black"} ${NM[m.piece]} ${m.captured?"takes the "+NM[m.captured]:"move"} on move ${m.n}`; }
/* the move picker: prepared reply > avoid the losing line > normal engine choice */
async function move(fen,history){ const C=window.ChessLib&&ChessLib.Chess||window.Chess, s=S(), k=key(fen), p=profile();
  const g=new C(fen), legal=g.moves({verbose:true}); const avoid=s.avoid.filter(a=>a.ply===history.length&&history.join(" ")===a.line.slice(0,a.ply).join(" ")).map(a=>a.line[a.ply]);
  const prep=s.prep[k]; if(prep&&!avoid.includes(prep.san)){ const m=legal.find(x=>x.san===prep.san); if(m){ await new Promise(r=>setTimeout(r,600)); return Object.assign({prepared:true},m); } }
  for(let t=0;t<4;t++){ const m=await CRBotEngine.move(fen,p,{history}); if(!m||!avoid.includes(m.san)) return m; if(t===3) return m; }
}
/* after a game: game = {moves:[san], me:'w'|'b', result:'win'|'loss'|'draw'} from the player's side */
async function learn(game){ const s=S(), before=s.level, C=window.ChessLib&&ChessLib.Chess||window.Chess, bc=game.me==="w"?"b":"w";
  s.games.push({d:Date.now(),me:game.me,r:game.result,m:game.moves.slice(0,40)}); if(s.games.length>30) s.games.shift();
  let note="";
  if(game.result==="win"){ s.lost++; s.level=Math.min(10,s.level+1);
    // the bot's first move in the opening part that it will avoid next time: its last own move inside the first PLIES
    const own=[]; for(let i=0;i<Math.min(PLIES,game.moves.length);i++) if((i%2===0?"w":"b")===bc) own.push(i);
    const ply=own[own.length-1]; if(ply!=null){ s.avoid.push({line:game.moves.slice(0,ply+1),ply}); if(s.avoid.length>20) s.avoid.shift();
      const g=new C(); game.moves.slice(0,ply).forEach(x=>g.move(x)); const m=g.move(game.moves[ply]); m.n=Math.floor(ply/2)+1;
      note=`Last game I lost after my ${NM[m.piece]} move on move ${m.n} of the opening. Next time I'll try something else there, and I've gone up to level ${s.level}.`; }
    s.invite={at:Date.now()+HOUR,seen:false}; }
  else if(game.result==="loss"){ s.won++; s.level=Math.max(1,s.level-(s.level>3?0.5:0)); note=`I won last time, so I eased off a little to keep it fair. I'm at level ${Math.round(s.level*2)/2}.`; }
  else { s.drawn++; note="Last game was a draw. I'm staying at the same level."; }
  // count the player's openings (positions where the bot must reply) and prepare engine replies for the most common ones
  const g=new C(); for(let i=0;i<Math.min(PLIES,game.moves.length);i++){ if(g.turn()===bc){ const k=key(g.fen()); s.seen[k]=(s.seen[k]||0)+1; } g.move(game.moves[i]); }
  const top=Object.entries(s.seen).sort((a,b)=>b[1]-a[1]).filter(([k,n])=>n>=2&&!s.prep[k]).slice(0,3);
  for(const [k] of top){ try{ await CRBotEngine.boot(); const fen=k+" 0 1", list=await CRBotEngine.candidates(fen,1,1500); if(list[0]){ const h=new C(fen); const m=h.move({from:list[0].uci.slice(0,2),to:list[0].uci.slice(2,4),promotion:list[0].uci[4]}); s.prep[k]={san:m.san}; } }catch(e){} }
  if(top.length&&game.result!=="win") note+=` I've also prepared for the opening you play most.`;
  s.learned=note; LS.set(s); paintHome(); return {before,after:s.level,note}; }
function status(){ const s=S(); return {level:s.level,games:s.games.length,learned:s.learned,invite:s.invite,record:{you:s.lost,me:s.won,draw:s.drawn}}; }
function inviteDue(){ const i=S().invite; return !!(i&&!i.seen&&Date.now()>=i.at); }
function clearInvite(){ const s=S(); if(s.invite) s.invite.seen=true; LS.set(s); paintHome(); }
/* home: a small inbox bubble from Ultimo, only inside the app */
function paintHome(){ const hs=document.getElementById("hs"); if(!hs) return; let b=document.getElementById("ult52msg");
  if(!inviteDue()){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement("button"); b.id="ult52msg"; b.type="button";
    b.style.cssText="display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:2px solid #d4af37;border-radius:16px;background:#1b1712;color:#f3e3b0;font:inherit;padding:10px 12px;margin:0 0 10px;cursor:pointer;position:relative";
    b.innerHTML=`<span style="width:46px;height:46px;flex:none">${BOT.avatar}</span><span><b style="color:#d4af37">📬 1 new message from Ultimo</b><br><small>“I've studied the game you beat me in. Rematch?”</small></span><span style="position:absolute;top:-8px;right:-6px;background:#d23c3c;color:#fff;border-radius:11px;min-width:22px;height:22px;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">1</span>`;
    b.onclick=()=>{ window.CRHome&&CRHome.setMode("app",true); CRBots._rematch(); };
    const g=document.getElementById("hsG"); if(g) g.parentNode.insertBefore(b,g); }
}
setInterval(paintHome,30000); document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") paintHome(); }); setTimeout(paintHome,1600);
(window.CRBotsData=window.CRBotsData||[]).push(BOT);
window.CRUltimate={bot:BOT,profile,move,learn,status,inviteDue,clearInvite,paintHome,_state:S,_set:LS.set,knobs};
})();
