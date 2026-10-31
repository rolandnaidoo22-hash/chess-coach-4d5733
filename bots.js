/* v52: "Play the bots" page + a small shared page/board helper (CR52) used by the v52 pages.
   Uses the app's own board drawing (Trainer.boardSvg) on an <svg class="b3d">, so every board style (flat, standing, 3D, watercolour) still works. */
(function(){
"use strict"; if(window.CR52) return;
const $=id=>document.getElementById(id);
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CH=()=>window.ChessLib&&window.ChessLib.Chess||window.Chess;
const LS={get:(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } },set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const NAME={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
const CSS=`.b57ask{font-size:14px;text-align:center;margin:4px 0;background:#fff3c4;color:#222;border-radius:8px;padding:5px}.b57ask:empty{display:none}.b57w{border:2px solid #d23c3c!important;background:#fff4f4!important;color:#222}.p52{display:none;padding:4px 0 80px}.p52.on{display:block}
.p52 h2{font-size:21px;margin:6px 0 4px}.p52 h3{font-size:17px;margin:14px 0 6px}.p52 p{line-height:1.45;margin:6px 0}.p52 .mute{color:var(--mute);font-size:13.5px}
.p52 .card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:10px 12px;margin:8px 0}
.p52 .lt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;min-height:62px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--ink);font:inherit;padding:10px 12px;margin:0 0 8px;cursor:pointer}
.p52 .lt .i{font-size:26px;width:34px;text-align:center;flex:none}.p52 .lt b{font-size:16px}.p52 .lt small{display:block;color:var(--mute);font-size:12.5px;line-height:1.3}.p52 .lt .tk{margin-left:auto;font-size:13px;font-weight:700;white-space:nowrap}
.p52 .bd{width:100%;max-width:440px;margin:8px auto;position:relative;touch-action:none;user-select:none}.p52 .bd svg{width:100%;height:auto;display:block;border-radius:6px}
.p52 .row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.p52 .bt{min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-weight:700;padding:0 14px;cursor:pointer}.p52 .bt.go{background:#2f7d32;color:#fff;border-color:#2f7d32}.p52 .bt:disabled{opacity:.45}
.p52 .msg{min-height:22px;font-weight:700;margin:6px 0}.p52 .ok{color:#2e7d32}.p52 .no{color:#c62828}
.p52 .av{width:52px;height:52px;flex:none}.p52 .av.sm{width:40px;height:40px}
.p52 .say{display:flex;gap:8px;align-items:center;margin:6px 0}.p52 .say .bub{background:#1b1712;color:#f3e3b0;border:1px solid #d4af37;border-radius:14px 14px 14px 4px;padding:8px 12px;font-size:14.5px;line-height:1.35}
.p52 .stars{color:#d4af37;letter-spacing:1px}.p52 .elo{display:inline-block;background:#1b1712;color:#d4af37;border-radius:8px;padding:1px 7px;font-size:12px;font-weight:800;margin-left:4px}
.p52 input[type=text],.p52 input[type=url],.p52 textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fff;color:var(--ink)}
.p52 textarea{min-height:84px}
html.dark-mode .p52 .card,html.dark-mode .p52 .lt,html.dark-mode .p52 .bt:not(.go),html.dark-mode .p52 input,html.dark-mode .p52 textarea{background:#262626;color:#eee;border-color:#3a3a3a}
#open52{max-width:560px;margin-left:auto;margin-right:auto}#open52 .bd{max-width:none;width:100%}
#bots52 .playlay{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,280px);gap:12px;align-items:start}
#bots52 .bd{width:min(100%,calc(100dvh - 220px));max-width:720px}
#bots52 .b52side{min-width:0}#bots52 .b52side b{display:block;margin-bottom:6px}
#bots52 .b52ml{font-family:inherit;font-size:15px;background:#f7f5f0;border:1px solid var(--line);border-radius:8px;padding:8px;max-height:min(70vh,640px);overflow:auto;line-height:1.65}
#bots52 .b52ml .now{background:#fff3cd;border-radius:6px;font-weight:700;padding:0 4px}
#bots52 .pb69{display:flex;align-items:center;gap:8px;min-height:40px;padding:2px 2px;font-size:15px}#bots52 .pb69 .av{width:32px;height:32px;font-size:20px;display:inline-flex;align-items:center;justify-content:center}#bots52 .pb69 small{color:#667;font-size:13px}
#bots52 .pb69 .th69{margin-left:auto;font-size:13px;color:#555;min-height:18px}
#bots52 .ctl69{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:6px 0 4px}#bots52 .ctl69 button{min-height:50px;padding:4px 2px;border:1px solid #ccd;border-radius:10px;background:#fff;font-size:12px;line-height:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}#bots52 .ctl69 button span{font-size:20px}#bots52 .ctl69 button:disabled{opacity:.45}
#bots52 .play69{display:block;width:100%;min-height:60px;font-size:20px;font-weight:700;border-radius:14px;margin:14px 0 8px;background:#2e7d32;color:#fff;border:0}#bots52 .bt.sel69{outline:3px solid #2e7d32;outline-offset:1px}
#bots52 .pro69{padding-bottom:110px}
@media(max-width:800px){#bots52 .playlay{grid-template-columns:1fr}#bots52 .bd{width:min(100%,calc(100dvh - 250px),calc(100vw - 24px));max-width:none;margin:0 auto}#bots52 .b52ml{max-height:168px}}
html.dark-mode #bots52 .b52ml{background:#262626;color:#eee}html.dark-mode #bots52 .b52ml .now{background:#3a3420}`;
let pages={}, styled=false;
function page(id){ if(!styled){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); styled=true; }
  if(pages[id]) return pages[id]; const d=document.createElement("div"); d.id=id; d.className="p52";
  const w=document.querySelector(".wrap")||document.body, hs=$("hs"); if(hs&&hs.parentNode===w) hs.after(d); else w.insertBefore(d,w.firstChild); pages[id]=d; return d; }
function show(id){ try{ window.CRLearn&&CRLearn.close(); }catch(e){} try{ window.Trainer&&Trainer.close(); }catch(e){} closeAll(); const p=page(id); p.classList.add("on"); window.scrollTo(0,0); return p; }
const closers=[]; function onClose(f){ closers.push(f); }
function closeAll(){ Object.values(pages).forEach(p=>{ p.classList.remove("on"); p.innerHTML=""; }); closers.forEach(f=>{ try{ f(); }catch(e){} }); }
/* board: el gets an svg.b3d; draw(fen,{hl,dots,arrows}); onTap(square) */
function board(el,onTap){ const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("viewBox","0 0 360 360"); svg.classList.add("b3d"); el.appendChild(svg);
  const B={orient:"w",svg,fen:null,o:{}};
  const sqAt=ev=>{ let fr=window.boardFrac?window.boardFrac(svg,ev):null; if(!fr){ const r=svg.getBoundingClientRect(); if(!r.width) return null; fr=[(ev.clientX-r.left)/r.width,(ev.clientY-r.top)/r.height]; }
    const x=Math.floor(8*fr[0]), y=Math.floor(8*fr[1]); if(x<0||x>7||y<0||y>7) return null; return B.orient==="w"?"abcdefgh"[x]+(8-y):"abcdefgh"[7-x]+(y+1); };
  let down=null; if(onTap){ svg.addEventListener("pointerdown",ev=>{ if(ev.button>0) return; const s=sqAt(ev); if(!s) return; down=s; try{ svg.setPointerCapture(ev.pointerId); }catch(e){} onTap(s); });
    svg.addEventListener("pointerup",ev=>{ if(!down) return; const s=sqAt(ev), d=down; down=null; if(s&&s!==d) onTap(s); }); }
  B.draw=(fen,o)=>{ B.fen=fen||B.fen; B.o=o||{}; svg.innerHTML=Trainer.boardSvg(B.fen,B.orient,Object.assign({loose:false},B.o),true); };
  return B; }
/* small static picture of a position (for memory hooks / guides) */
function mini(fen,orient,o){ try{ return Trainer.boardSvg(fen,orient||"w",Object.assign({loose:false},o||{}),false); }catch(e){ return ""; } }
function promo(color,cb){ const d=document.createElement("div"); d.className="promo"; d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99;display:flex;align-items:center;justify-content:center";
  d.innerHTML=`<div style="background:#fff;border-radius:14px;padding:12px;display:flex;gap:8px">${["q","r","b","n"].map(t=>`<button data-t="${t}" style="width:56px;height:60px;border:1px solid #ccc;border-radius:10px;background:#fff"><svg viewBox="0 0 45 45" width="44" height="44"><use href="#pc-${color}${t.toUpperCase()}"/></svg></button>`).join("")}</div>`;
  d.onclick=e=>{ const b=e.target.closest("[data-t]"); d.remove(); cb(b?b.dataset.t:null); }; document.body.appendChild(d); }
window.CR52={page,show,board,mini,promo,closeAll,onClose,E_,LS,CH,NAME};

/* ================= Play the bots ================= */
const BOTS=()=>window.CRBotsData||[], KR="chessReview.v52.botResults";
let G=null; // current game
function list(){ const p=show("bots52"), R=LS.get(KR,{});
  p.innerHTML=`<h2>🤖 Play the bots</h2><p class="mute">Pick an opponent. Each bot has its own rating and style.</p>`+
   BOTS().map(b=>`<button class="lt" data-b="${b.id}"><span class="av">${b.avatar}</span><span><b>${E_(b.name)}</b><span class="elo">${b.elo}</span><small>${E_(b.style)}${b.adaptive&&window.CRUltimate?` · level ${CRUltimate.status().level} · ${CRUltimate.status().games} games learned`:""}</small><small>${E_(b.story)}</small></span>${R[b.id]?`<span class="tk">🏆 ${R[b.id]}</span>`:""}</button>`).join("");
  p.querySelectorAll("[data-b]").forEach(x=>x.onclick=()=>{ const b=BOTS().find(b=>b.id===x.dataset.b); if(b.open) b.open(); else pickSide(b); });
  window.CRMind64&&CRMind64.gate(p);
  if(window.CRStyle) CRStyle.listExtra(p); }
function pickSide(bot){ const p=show("bots52");
  p.innerHTML=`<h2>${E_(bot.name)} <span class="elo">${bot.elo}</span></h2><div class="say"><span class="av">${bot.avatar}</span><span class="bub">${E_(bot.adaptive&&window.CRUltimate&&CRUltimate.inviteDue()?"I've studied the game you beat me in. Rematch?":bot.adaptive&&window.CRUltimate&&CRUltimate.status().learned?"📓 What I learned: "+CRUltimate.status().learned:bot.chat.start[0])}</span></div>${bot.adaptive&&window.CRUltimate?`<p class="mute">Level ${CRUltimate.status().level} of 10 · ${CRUltimate.status().games} games learned · You ${CRUltimate.status().record.you} – ${CRUltimate.status().record.me} Ultimo. It adapts to your games, all on this phone.</p>`:""}
   <p class="mute">${E_(bot.story)}</p><h3>Play as</h3><div class="row"><button class="bt sel69" data-c="w" aria-pressed="true">♔ White</button><button class="bt" data-c="b" aria-pressed="false">♚ Black</button><button class="bt" data-c="r" aria-pressed="false">🎲 Random</button></div>
   <button class="play69" id="b69play">▶ Play ${E_(bot.name)}</button><div class="row"><button class="bt" id="b52back">‹ All bots</button></div>`;
  p.classList.add("pro69"); let side="w";
  p.querySelectorAll("[data-c]").forEach(x=>x.onclick=()=>{ side=x.dataset.c; p.querySelectorAll("[data-c]").forEach(y=>{ const on=y===x; y.classList.toggle("sel69",on); y.setAttribute("aria-pressed",String(on)); }); });
  $("b69play").onclick=()=>{ let c=side; if(c==="r") c=Math.random()<.5?"w":"b"; start(bot,c); }; $("b52back").onclick=list; }
function say(kind){ if(!G) return; const l=G.bot.chat[kind]; if(!l||!l.length) return; const el=$("b52say"); if(el) el.textContent=l[Math.floor(Math.random()*l.length)]; }
function start(bot,me){ const p=show("bots52"), C=CH(); if(bot.adaptive&&window.CRUltimate){ CRUltimate.clearInvite(); bot=CRUltimate.profile(); }
  p.classList.remove("pro69"); const RN=window.CRRating&&CRRating.now(), myN=(((window.CRUser&&CRUser.info())||{}).cc)||"You";
  p.innerHTML=`<div class="playlay"><div>
   <div class="pb69" id="b69top"><span class="av sm">${bot.avatar}</span><b>${E_(bot.name)}</b><small>${bot.adaptive?"Level "+bot.level:bot.elo}</small><span class="th69" id="b69th" aria-live="polite"></span></div>
   <div class="bd" id="b52bd"></div>
   <div class="pb69" id="b69me"><span class="av sm">🙂</span><b>${E_(myN)}</b><small>${RN&&RN.r?RN.r:""}</small><span class="th69" id="b69turn"></span></div>
   <div class="ctl69"><button id="b69res"><span>🏳</span>Resign</button><button id="b52undo"><span>↶</span>Undo</button><button id="b52flip"><span>⇅</span>Flip</button><button id="b69hint"><span>💡</span>Hint</button><button id="b52new"><span>⟲</span>New</button></div>
   <div class="msg" id="b52msg"></div><div id="b52warn"></div><div id="b52ask" class="b57ask"></div>
   <div class="say"><span class="av sm">${bot.avatar}</span><span class="bub" id="b52say"></span></div></div>
   <div class="b52side card"><b>Moves</b><div class="b52ml" id="b52ml"></div></div></div>
   <div class="row"><button class="bt" id="b52list">‹ All bots</button></div><div class="row"><button class="bt" id="b52grd" aria-pressed="false"></button></div>`;
  G={bot,me,g:new C(),sel:null,last:null,thinking:false,token:0,over:false,gid:Date.now(),guard:!!(window.CRBlunders&&CRBlunders.guardOn())};
  const gb=()=>{ const b=$("b52grd"); if(!b) return; b.textContent=G.guard?"🛡 Blunder check: On":"🛡 Blunder check: Off"; b.setAttribute("aria-pressed",String(G.guard)); b.classList.toggle("go",G.guard); };
  G.B=board($("b52bd"),tap); G.B.orient=me; say("start"); if(bot.adaptive&&window.CRUltimate&&CRUltimate.status().learned) $("b52say").textContent="📓 "+CRUltimate.status().learned; draw();
  gb(); $("b52grd").onclick=()=>{ G.guard=!G.guard; window.CRBlunders&&CRBlunders.setGuard(G.guard); gb(); draw(); }; window.CRMind64&&CRMind64.attach(G); $("b52undo").onclick=undo; $("b52flip").onclick=()=>{ G.B.orient=G.B.orient==="w"?"b":"w"; draw(); };
  $("b52new").onclick=()=>bot.open?bot.open():pickSide(bot);
  $("b69res").onclick=()=>{ if(!G||G.over||G.g.isGameOver()) return; if(!confirm("Resign this game?")) return; G.token++; G.thinking=false; G.over=true; G.resigned=true; say("won"); if(G.bot.adaptive&&window.CRUltimate) CRUltimate.learn({moves:G.g.history(),me:G.me,result:"loss"}).catch(()=>{}); draw(); };
  $("b69hint").onclick=hint; $("b52list").onclick=()=>{ G=null; list(); };
  try{ window.CRBotEngine&&CRBotEngine.boot().catch(()=>{}); }catch(e){}
  if(me==="b") botMove(); }
function movesHtml(h){ if(!h.length) return `<span class="mute">No moves yet.</span>`; const last=Math.floor((h.length-1)/2); let s="";
  for(let i=0;i<h.length;i+=2) s+=`<div class="${i/2===last?"now":""}"><b>${i/2+1}.</b> ${E_(h[i])}${h[i+1]?" "+E_(h[i+1]):""}</div>`; return s; }
function draw(){ if(!G) return; const g=G.g, hl=[];
  if(G.last) hl.push({sq:G.last.from,c:"#f6f669",o:.55},{sq:G.last.to,c:"#f6f669",o:.7}); if(G.hint) hl.push({sq:G.hint.from,c:"#2e7d32",o:.5},{sq:G.hint.to,c:"#2e7d32",o:.5});
  if(G.sel) hl.push({sq:G.sel,c:"#3b6fb6",o:.5});
  if(g.inCheck()) g.board().forEach(r=>r.forEach(x=>{ if(x&&x.type==="k"&&x.color===g.turn()) hl.push({sq:x.square,c:"#d23c3c",o:.6}); }));
  G.B.draw(g.fen(),{hl,dots:G.sel?g.moves({square:G.sel,verbose:true}).map(m=>m.to):[]});
  const th=$("b69th"); if(th) th.textContent=G.thinking?`${G.bot.name} is thinking…`:""; const tu=$("b69turn"); if(tu) tu.textContent=!G.over&&!g.isGameOver()&&!G.thinking&&g.turn()===G.me?"Your move":"";
  ["b69res","b69hint"].forEach(id=>{ const b=$(id); if(b) b.disabled=G.over||g.isGameOver()||(id==="b69hint"&&(G.thinking||g.turn()!==G.me)); });
  let msg=""; if(G.resigned) msg="You resigned. "+G.bot.name+" wins. Tap New for another game."; else if(g.isCheckmate()) msg=g.turn()===G.me?"Checkmate. "+G.bot.name+" wins. Tap Undo to try again.":"🏆 Checkmate! You win!";
  else if(g.isDraw()||g.isStalemate()) msg="It's a draw."; else if(G.thinking) msg="🤔 "+G.bot.name+" is thinking…"; else if(g.turn()===G.me) msg=g.inCheck()?"You're in check! Your move.":"Your move.";
  $("b52msg").textContent=msg; const h=g.history(); const ml=$("b52ml"); if(ml){ ml.innerHTML=movesHtml(h); ml.scrollTop=ml.scrollHeight; }
  $("b52undo").disabled=G.thinking||!h.length;
  const ask=$("b52ask"); if(ask) ask.innerHTML=G.guard&&!G.thinking&&!g.isGameOver()&&g.turn()===G.me&&!G.warn?`Before you move: <b>Checks?</b> <b>Captures?</b> <b>Threats?</b>`:""; window.CRMind64&&CRMind64.draw(G); window.CRGut65&&CRGut65.draw(G); }
function finish(){ const g=G.g; if(!g.isGameOver()||G.over) return; G.over=true; window.CRMind64&&CRMind64.finish(G); window.CRGut65&&CRGut65.finish(G);
  if(g.isCheckmate()){ if(g.turn()===G.me) say("won"); else { say("lost"); const R=LS.get(KR,{}); R[G.bot.id]=(R[G.bot.id]||0)+1; LS.set(KR,R); } } else say("draw");
  if(G.bot.adaptive&&window.CRUltimate){ const res=g.isCheckmate()?(g.turn()===G.me?"loss":"win"):"draw"; CRUltimate.learn({moves:g.history(),me:G.me,result:res}).catch(e=>console.error(e)); } }
function tap(sq){ if(G&&G.warn) return; if(!G||G.over||G.thinking||G.g.isGameOver()||G.g.turn()!==G.me) return; const g=G.g, pc=g.get(sq);
  if(pc&&pc.color===G.me){ G.sel=sq; draw(); return; } if(!G.sel) return;
  const c=g.moves({square:G.sel,verbose:true}).filter(m=>m.to===sq); G.sel=null; if(!c.length){ draw(); return; }
  const go=(m,sure)=>{ const u=m.from+m.to+(m.promotion||""), w=window.CRGuard?CRGuard.check(g.fen(),u):null;
    if(w&&G.guard&&!sure){ warn(w,m,go); return; } G.warn=null; $("b52warn").innerHTML="";
    window.CRBlunders&&CRBlunders.logBot(G.gid,{n:1,hung:w&&w.k==="hang"?1:0,bot:G.bot.name});
    window.CRMind64&&CRMind64.before(G,m); G.hint=null; const r=g.move({from:m.from,to:m.to,promotion:m.promotion}); G.last=r; draw(); if(g.isGameOver()) finish(); else botMove(); };
  if(c[0].promotion) promo(G.me,t=>{ if(t) go(c.find(m=>m.promotion===t)); else draw(); }); else go(c[0]); }
function warn(w,m,go){ G.warn=w; const el=$("b52warn"); draw(); G.B.draw(G.g.fen(),{hl:[{sq:w.sq,c:"#d23c3c",o:.65},{sq:m.from,c:"#3b6fb6",o:.5}],arrows:[{u:m.from+m.to,c:"orange"}]});
  el.innerHTML=`<div class="card b57w" role="alert"><b>${E_(w.msg)}</b><div class="row"><button class="bt go" id="b57tb">↶ Take back</button><button class="bt" id="b57pa">Play anyway</button></div></div>`;
  $("b57tb").onclick=()=>{ window.CRBlunders&&CRBlunders.logBot(G.gid,{heed:1}); G.warn=null; el.innerHTML=""; draw(); };
  $("b57pa").onclick=()=>{ window.CRBlunders&&CRBlunders.logBot(G.gid,{ign:1}); G.warn=null; el.innerHTML=""; go(m,true); }; }
function quick(fen){ const g=new (CH())(fen), L=g.moves({verbose:true}); if(!L.length) return null; const V={p:1,n:3,b:3,r:5,q:9,k:0};
  let best=null, bs=-1e9; L.forEach(m=>{ g.move(m); let s=(m.captured?V[m.captured]*10:0)+(g.isCheckmate()?1e5:0)+(g.inCheck()?2:0)+Math.random();
    const R=g.moves({verbose:true}); const worst=R.reduce((w,r)=>Math.max(w,r.captured?V[r.captured]*10:0),0); s-=worst*0.9; g.undo(); if(s>bs){ bs=s; best=m; } }); return best; }
const CAP=4700, MIN=700;
async function botMove(){ const tok=++G.token, game=G; G.thinking=true; draw(); const t0=Date.now(), fen=G.g.fen(), hist=G.g.history();
  const think=(async()=>{ try{ return G.bot.pick?await G.bot.pick(fen,hist):G.bot.adaptive&&window.CRUltimate?await CRUltimate.move(fen,hist):await CRBotEngine.move(fen,G.bot,{history:hist,delay:0}); }catch(e){ console.error(e); return null; } })();
  let m=await Promise.race([think,new Promise(r=>setTimeout(()=>r("cap"),CAP))]);
  if(m==="cap"||!m) m=quick(fen); /* always move within 5 seconds */
  const w=MIN+Math.random()*600-(Date.now()-t0); if(w>0) await new Promise(r=>setTimeout(r,w)); game.lastMs=Date.now()-t0;
  if(G!==game||tok!==G.token) return; G.thinking=false; if(!m){ draw(); return; }
  const r=G.g.move({from:m.from,to:m.to,promotion:m.promotion||"q"}); G.last=r;
  if(G.g.isGameOver()) finish(); else if(m.blunder&&G.bot.chat.blunder&&Math.random()<.5) say("blunder"); else if(G.g.inCheck()) say("check"); else if(r.captured) say("capture");
  draw(); }
async function hint(){ if(!G||G.thinking||G.over||G.g.turn()!==G.me) return; const b=$("b69hint"); if(b) b.disabled=true; const fen=G.g.fen(); let m=null;
  try{ if(window.CRBotEngine){ await CRBotEngine.boot(); const c=await Promise.race([CRBotEngine.candidates(fen,1,400),new Promise(r=>setTimeout(()=>r(null),3000))]); if(c&&c[0]) m={from:c[0].uci.slice(0,2),to:c[0].uci.slice(2,4)}; } }catch(e){}
  if(!m){ const q=quick(fen); if(q) m={from:q.from,to:q.to}; } if(G&&G.g.fen()===fen){ G.hint=m; draw(); const el=$("b52msg"); if(el&&m) el.textContent="💡 Hint: try the piece and square shown in green."; } }
function undo(){ if(!G||G.thinking) return; G.hint=null; G.resigned=false; if(G.warn){ G.warn=null; const w=$("b52warn"); if(w) w.innerHTML=""; draw(); return; } const g=G.g; G.token++; G.over=false;
  if(g.turn()===G.me){ g.undo(); g.undo(); } else g.undo(); // take back the bot's reply and your move
  if(g.history().length===0&&G.me==="b"){ /* bot moves first as White */ G.last=null; G.sel=null; draw(); botMove(); return; }
  const h=g.history({verbose:true}); G.last=h[h.length-1]||null; G.sel=null; draw(); }
onClose(()=>{ if(G){ G.token++; G=null; } });
window.CRBots={open:list,_startBot:start,_rematch:()=>pickSide(BOTS().find(b=>b.adaptive)),_start:(id,c)=>start(BOTS().find(b=>b.id===id),c||"w"),_game:()=>G,_tap:sq=>tap(sq)};
})();
