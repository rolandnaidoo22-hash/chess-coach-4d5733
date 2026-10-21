/* Improvements v25+ (own file imp.js). Adds features; never changes existing ones. */
(function(){
"use strict";
if(window.CRImp) return;
const $=id=>document.getElementById(id);
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LSg=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
const LSs=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } };
const PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const CSS=`.imp1{border-radius:14px;padding:12px 14px;margin:0 0 12px;background:#fff7e6;border:2px solid #f0b44a;color:#222;font-size:16px;line-height:1.45}
.imp1 b.t{display:block;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#a0610a;margin-bottom:4px}
.imp1.ok{background:#eef8ee;border-color:#7cc47f}.imp1.ok b.t{color:#2f7d32}
.imp1 button{margin-top:8px;min-height:44px;border-radius:10px;border:1px solid #d9a441;background:#fff;font-size:15px;font-weight:700;padding:8px 12px;cursor:pointer;color:#7a4a00}
html.dark-mode .imp1{background:#3a2f1c;color:#eee}html.dark-mode .imp1.ok{background:#1f3320}`;
function css(){ if($("impcss")) return; const s=document.createElement("style"); s.id="impcss"; s.textContent=CSS; document.head.appendChild(s); }
const sideName=c=>c==="w"?"White":"Black";
function boardOf(fen){ return window.Patterns&&Patterns._board?Patterns._board(fen):null; }
function sqIdx(s){ return (s.charCodeAt(0)-97)+8*(+s[1]-1); }

/* ================= 1. turning-point headline ================= */
function turningPoint(D){ const P=D.plies, me=D.meta.user_color, opp=me==="w"?"b":"w", C=window.ChessLib&&ChessLib.Chess;
  let wi=-1, wl=0; P.forEach((p,i)=>{ if(p.user&&(p.ep_loss||0)>wl&&/mistake|blunder|miss/.test(p.cls)){ wl=p.ep_loss; wi=i; } });
  if(wi<0||wl<0.08) return null;
  const p=P[wi], q=P[wi+1], best=p.best_san, mvTxt=p.label;
  const pc=(()=>{ const s=p.san[0]; return "NBRQK".includes(s)?PN[s.toLowerCase()]:(p.san.startsWith("O-O")?"king":"pawn"); })();
  let why="";
  try{ const reply=(q&&q.best_uci)||(p.reply_uci&&p.reply_uci[0])||""; const c=new C(p.fen);
    let rm=null; if(reply) rm=c.move({from:reply.slice(0,2),to:reply.slice(2,4),promotion:reply[4]||"q"});
    if(rm&&c.isCheckmate()) why=`it allowed checkmate: ${sideName(opp)} plays ${rm.san}.`;
    else if(rm&&rm.captured&&rm.captured!=="p"){ const B=boardOf(p.fen); const def=B&&Patterns._attackers?Patterns._attackers(B,me,sqIdx(rm.to)).length:0;
      const nm=PN[rm.captured];
      why=def&&VAL[rm.piece]<VAL[rm.captured]?`your ${nm} on ${rm.to} could be taken by a cheaper piece (${rm.san}).`:`your ${nm} on ${rm.to} had no defender, so ${sideName(opp)} could just take it with ${rm.san}.`; }
    else if(p.bad&&p.bad.B&&p.bad.B.state==="missed"&&p.threat&&p.threat.san) why=`you didn't answer ${sideName(opp)}'s threat ${p.threat.san}.`;
    else if(rm&&window.Patterns&&Patterns.tacticAfter){ const t=Patterns.tacticAfter(p.fen,reply); if(t) why=`it walked into a ${t.kind} (${rm.san}).`; }
    if(!why&&rm&&rm.captured==="p") why=`it gave away a pawn (${rm.san}) and your position got worse.`;
    if(!why&&rm) why=`it let ${sideName(opp)} play ${rm.san}, a strong reply.`;
  }catch(e){}
  if(!why) why="it made your position much worse.";
  let gain=""; try{ if(best){ const c=new C(p.fen_before); const bm=c.move(best); if(c.isCheckmate()) gain=" (it's checkmate!)"; else if(bm&&bm.captured&&bm.captured!=="p") gain=` (it wins the ${PN[bm.captured]})`; } }catch(e){}
  return {i:wi,txt:`On move ${mvTxt} you moved your ${pc}, but ${why} Play <b>${E(best||"a safer move")}</b> instead${gain}.`,label:mvTxt,best};
}
function headline(){ const s=$("summary"); if(!s||typeof DATA==="undefined"||!DATA||!DATA.plies) return; if(s.querySelector(".imp1")) return; css();
  let tp=null; try{ tp=turningPoint(DATA); }catch(e){ console.error(e); }
  const d=document.createElement("div"); d.className="imp1"+(tp?"":" ok");
  d.innerHTML=tp?`<b class="t">🔑 Turning point</b>${tp.txt.replace(/^(On move )(\S+)/,"$1<b>$2</b>")}<br><button type="button">▶ Show me this move</button>`:`<b class="t">🔑 Turning point</b>No big mistake in this game. Clean play!`;
  if(tp) d.querySelector("button").onclick=()=>{ try{ go(tp.i+1,true); }catch(e){} };
  s.insertBefore(d,s.firstChild); }
function initHeadline(){ const s=$("summary"); if(!s) return; new MutationObserver(()=>headline()).observe(s,{childList:true}); headline(); }

/* ================= boot ================= */
const API={_tp:turningPoint};
window.CRImp=API;
function init(){ initHeadline(); (API._inits||[]).forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,350)); else setTimeout(init,350);
})();
