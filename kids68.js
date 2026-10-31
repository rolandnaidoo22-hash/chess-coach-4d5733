/* v68: Kids Mode. Big buttons, plain words, no ratings. A grown-up PIN locks the way out. Kept on this phone, separate from the grown-up's games. */
(function(){ "use strict"; if(window.CRKids) return;
const K="chessReview.v68.kids", $=id=>document.getElementById(id);
const LG=()=>{ try{ return Object.assign({on:false,pin:"",stars:0,done:{},asked:false},JSON.parse(localStorage.getItem(K)||"{}")); }catch(e){ return {on:false,pin:"",stars:0,done:{},asked:false}; } };
const SV=s=>{ try{ localStorage.setItem(K,JSON.stringify(s)); }catch(e){} };
const E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const PZ=[{"f": "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", "t": "mate", "a": ["a1a8"]}, {"f": "k7/8/1K6/8/8/8/7Q/8 w - - 0 1", "t": "mate", "a": ["h2h8"]}, {"f": "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", "t": "take", "a": ["d1d5"]}, {"f": "4k3/8/8/8/4n3/8/8/1B2K3 w - - 0 1", "t": "take", "a": ["b1e4"]}, {"f": "6k1/8/8/8/4r3/8/8/4RK2 w - - 0 1", "t": "take", "a": ["e1e4"]}, {"f": "7k/8/8/8/8/1Q6/8/K5R1 w - - 0 1", "t": "mate", "a": ["b3g8", "b3h3"]}, {"f": "4k3/8/8/8/1b6/8/N7/6K1 w - - 0 1", "t": "take", "a": ["a2b4"]}, {"f": "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", "t": "mate", "a": ["d1d8"]}];
const PCS=[
 {k:"R",n:"Rook",i:"🏰",sq:"d4",story:"The rook is a strong castle tower. It zooms in straight lines: up, down, left and right, as far as it likes, until something is in the way.",learn:"how the rook moves in straight lines",say:"Ask: which way can the castle zoom?",praise:"Praise how they followed the straight lines with a finger."},
 {k:"B",n:"Bishop",i:"⛪",sq:"d4",story:"The bishop loves slanted paths. It slides corner to corner, on the diagonal, and always stays on the same colour square.",learn:"the bishop slides on diagonals and keeps its colour",say:"Ask: what colour square does this bishop live on?",praise:"Praise spotting the slanted path."},
 {k:"Q",n:"Queen",i:"👑",sq:"d4",story:"The queen is the superstar. She can move like a rook and like a bishop: straight or slanted, as far as she likes.",learn:"the queen moves straight and slanted",say:"Ask: why is the queen the strongest piece?",praise:"Praise finding a long move across the board."},
 {k:"N",n:"Knight",i:"🐴",sq:"d4",story:"The knight is a jumping horse. It hops in an L shape: two steps one way, then one step to the side. It can jump over other pieces!",learn:"the knight jumps in an L shape",say:"Trace an L in the air together: two, then one.",praise:"Praise trying the tricky L jump."},
 {k:"K",n:"King",i:"🤴",sq:"d4",story:"The king is the most important piece, but he is slow. He walks just one step in any direction. Keep him safe!",learn:"the king walks one step and must be kept safe",say:"Ask: why do we keep the king safe?",praise:"Praise careful one-step thinking."},
 {k:"P",n:"Pawn",i:"🙂",sq:"e2",story:"The pawn is a brave little soldier. It walks forward one step. On its very first move it may take two steps. It can never walk backwards.",learn:"the pawn walks forward, two steps on its first move",say:"Ask: can a pawn go backwards? (No!)",praise:"Praise remembering the first big step."}];
const CSS=`#kids68{font-size:18px;line-height:1.45;padding-bottom:40px}#kids68 h2{font-size:28px;margin:6px 0}
#kids68 .kst{font-size:22px;font-weight:800;background:#fff6d6;border-radius:16px;padding:10px 14px;margin:8px 0;display:flex;justify-content:space-between;align-items:center}
#kids68 .kg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
#kids68 .kb{min-height:140px;border-radius:24px;border:none;font:inherit;font-size:21px;font-weight:800;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 0 rgba(0,0,0,.18)}
#kids68 .kb .i{font-size:46px;line-height:1}#kids68 .c1{background:#ef6c3a}#kids68 .c2{background:#2e9e5b}#kids68 .c3{background:#3b6fb6}#kids68 .c4{background:#8e57c4}
#kids68 .big{width:100%;min-height:60px;border-radius:18px;border:none;font:inherit;font-size:20px;font-weight:800;background:#2e9e5b;color:#fff;margin:8px 0;cursor:pointer}
#kids68 .big.gray{background:#e6e8ee;color:#223}#kids68 .sm{background:none;border:none;color:#556;text-decoration:underline;font:inherit;font-size:14px;margin-top:22px;cursor:pointer;min-height:44px}
#kids68 .kbd{width:min(100%,360px);margin:6px auto;touch-action:none}#kids68 .kbd svg{width:100%;display:block;border-radius:10px}
#kids68 .ksay{background:#eef5ff;border-radius:16px;padding:10px 14px;margin:8px 0}#kids68 .kok{background:#e6f6ea;border-radius:16px;padding:10px 14px;margin:8px 0;font-weight:800}
#kids68 .kpar{border:2px dashed #b7c2d6;border-radius:14px;padding:8px 12px;margin:10px 0;font-size:15px}#kids68 .kpar summary{font-weight:800;min-height:40px;cursor:pointer}
#kids68 .kl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}#kids68 .kl button{min-height:96px;border-radius:18px;border:2px solid #dde;background:#fff;font:inherit;font-weight:800;font-size:16px;cursor:pointer}#kids68 .kl button .i{display:block;font-size:34px}
#kids68 input{font-size:28px;letter-spacing:8px;text-align:center;width:100%;min-height:60px;border-radius:14px;border:2px solid #aab}
html.dark-mode #kids68 .kl button{background:#262626;color:#eee}html.dark-mode #kids68 .kst{background:#3a3420}html.dark-mode #kids68 .ksay{background:#1f2633}html.dark-mode #kids68 .kok{background:#1f3326}`;
let styled=false, B=null;
function pg(){ if(!styled){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); styled=true; } try{ CRHome.setMode("app",true); }catch(e){} return CR52.show("kids68"); }
function star(n,id){ const s=LG(); if(id){ if(s.done[id]) { s.stars+=1; } else { s.done[id]=1; s.stars+=n; } } else s.stars+=n; SV(s); return s.stars; }
function par(p){ return `<details class="kpar"><summary>👨‍👩‍👧 For the grown-up</summary><p><b>What they learned:</b> ${E_(p.learn)}.</p><p><b>What to say next:</b> ${E_(p.say)}</p><p><b>One thing to praise:</b> ${E_(p.praise)}</p></details>`; }
function home(){ const s=LG(); if(!s.on){ s.on=true; SV(s); } document.body.classList.add("kids68on"); if(!s.asked) return pinSetup();
  const p=pg(); p.innerHTML=`<h2>🧒 Kids Chess</h2><div class="kst"><span>⭐ ${s.stars} star${s.stars===1?"":"s"}</span><span>${Object.keys(s.done).length} done</span></div>
   <div class="kg"><button class="kb c1" data-k="pieces"><span class="i">🐴</span>Meet the pieces</button><button class="kb c2" data-k="puz"><span class="i">🧩</span>Find the move</button>
   <button class="kb c3" data-k="pip"><span class="i">🐣</span>Play Pip</button><button class="kb c4" data-k="friend"><span class="i">👨‍👧</span>Play a grown-up</button></div>
   <p class="ksay">You get a star for every try. Have fun!</p><button class="sm" id="k68out">Grown-up: leave Kids Mode</button>`;
  p.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>({pieces,puz:()=>puz(0),pip:()=>{ star(1); try{ CRBots._start("pip","w"); }catch(e){} },friend:()=>{ star(1); try{ CRHome.setMode("app",true); Trainer.open("sec","play"); }catch(e){} }})[b.dataset.k]());
  $("k68out").onclick=leave; }
function pinSetup(){ const p=pg(); p.innerHTML=`<h2>🔒 Grown-up PIN</h2><p>Pick a 4-number PIN. It is needed to leave Kids Mode, so your child stays in the kids' area.</p>
   <input id="k68pin" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="4-number PIN"><button class="big" id="k68ps">Save PIN</button><button class="big gray" id="k68pn">No PIN for now</button><p id="k68pm"></p>`;
  $("k68ps").onclick=()=>{ const v=$("k68pin").value.trim(); if(!/^\d{4}$/.test(v)){ $("k68pm").textContent="Please type 4 numbers."; return; } const s=LG(); s.pin=v; s.asked=true; SV(s); home(); };
  $("k68pn").onclick=()=>{ const s=LG(); s.asked=true; SV(s); home(); }; }
function leave(){ const s=LG(); const done=()=>{ const s2=LG(); s2.on=false; SV(s2); document.body.classList.remove("kids68on"); try{ CR52.closeAll(); CRHome.setMode("home",true); }catch(e){} };
  if(!s.pin) return done(); const p=pg(); p.innerHTML=`<h2>🔒 Grown-ups only</h2><p>Type the PIN to leave Kids Mode.</p><input id="k68pin" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="PIN"><button class="big" id="k68go">Leave Kids Mode</button><button class="big gray" id="k68bk">Back to kids</button><p id="k68pm"></p>`;
  $("k68go").onclick=()=>{ if($("k68pin").value.trim()===LG().pin) done(); else $("k68pm").textContent="That PIN is not right."; }; $("k68bk").onclick=home; }
function pieces(){ const p=pg(), s=LG(); p.innerHTML=`<h2>🐴 Meet the pieces</h2><p>Tap a piece to hear its story.</p><div class="kl">${PCS.map((x,j)=>`<button data-j="${j}"><span class="i">${x.i}</span>${x.n}${s.done["pc"+x.k]?" ⭐":""}</button>`).join("")}</div><button class="big gray" id="k68h">🏠 Kids home</button>`;
  p.querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>lesson(+b.dataset.j)); $("k68h").onclick=home; }
function targets(x){ const fen=x.k==="P"?"8/8/8/8/8/8/4P3/8 w - - 0 1":`8/8/8/8/3${x.k}4/8/8/8 w - - 0 1`; const c=new Chess(fen,{skipValidation:true}); let m=[]; try{ m=c.moves({square:x.sq,verbose:true}).map(v=>v.to); }catch(e){} return {fen,m}; }
function lesson(j){ const x=PCS[j], p=pg(), T=targets(x); let shown=false;
  p.innerHTML=`<h2>${x.i} The ${x.n}</h2><p class="ksay">${E_(x.story)}</p><div class="kbd" id="k68b"></div><p id="k68q"><b>Your turn:</b> tap a square where the ${x.n.toLowerCase()} can go.</p><div id="k68r"></div><button class="big gray" id="k68sh">👀 Show me</button><button class="big gray" id="k68h">⬅ All pieces</button>`;
  B=CR52.board($("k68b"),sq=>{ if(T.m.includes(sq)){ const n=star(2,"pc"+x.k); B.draw(T.fen,{dots:T.m,hl:[{sq,c:"#4caf50",o:.7}]}); $("k68q").innerHTML=""; $("k68r").innerHTML=`<p class="kok">🎉 Yes! The ${x.n.toLowerCase()} can go there. ⭐ You have ${n} stars.</p>${par(x)}<button class="big" id="k68nx">${j<PCS.length-1?"Next piece ▶":"🏠 Kids home"}</button>`; $("k68nx").onclick=()=>j<PCS.length-1?lesson(j+1):home(); }
    else if(sq!==x.sq){ star(0); B.draw(T.fen,{hl:[{sq,c:"#ef6c3a",o:.6}],dots:shown?T.m:[]}); $("k68q").innerHTML="Not that one. Try again! Tap <b>Show me</b> for help."; } });
  B.draw(T.fen,{nocoord:true}); $("k68sh").onclick=()=>{ shown=true; B.draw(T.fen,{dots:T.m,nocoord:true}); }; $("k68h").onclick=pieces; }
function puz(i){ i=i%PZ.length; const z=PZ[i], p=pg(); let pick=null, tries=0; const c=()=>new Chess(z.f,{skipValidation:true});
  p.innerHTML=`<h2>🧩 Find the move</h2><p class="ksay">${z.t==="mate"?"You are White. Find the move that <b>traps the black king</b> (checkmate)!":"You are White. A black piece has <b>no guard</b>. Take it!"}</p><div class="kbd" id="k68b"></div><p id="k68q">Tap your piece, then tap where it goes.</p><div id="k68r"></div><button class="big gray" id="k68h">🏠 Kids home</button>`;
  const draw=o=>B.draw(z.f,Object.assign({nocoord:true},o||{}));
  B=CR52.board($("k68b"),sq=>{ const g=c(); if(!pick){ const pc=g.get(sq); if(pc&&pc.color==="w"){ pick=sq; draw({hl:[{sq,c:"#ffd54f",o:.7}],dots:g.moves({square:sq,verbose:true}).map(v=>v.to)}); } return; }
    const u=pick+sq; pick=null; if(z.a.includes(u)){ const n=star(3,"pz"+i); let f2=z.f; try{ g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:"q"}); f2=g.fen(); }catch(e){} B.draw(f2,{nocoord:true,hl:[{sq,c:"#4caf50",o:.6}]});
      $("k68q").innerHTML=""; $("k68r").innerHTML=`<p class="kok">🎉 Brilliant! ${z.t==="mate"?"The king is trapped. Checkmate!":"You took the free piece."} ⭐ ${n} stars.</p>${par(z.t==="mate"?{learn:"checkmate means the king is attacked and cannot escape",say:"Ask: where could the king try to run?",praise:"Praise looking at the whole board before moving."}:{learn:"a piece with no guard can be taken for free",say:"Ask: is that piece protected by anything?",praise:"Praise checking if the piece was safe to take."})}<button class="big" id="k68nx">Next puzzle ▶</button>`; $("k68nx").onclick=()=>puz(i+1); }
    else { tries++; star(tries===1?1:0); draw(); $("k68q").innerHTML=tries>=2?`Good try! Hint: look at the ${{K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight",P:"pawn"}[(c().get(z.a[0].slice(0,2))||{type:"p"}).type.toUpperCase()]}. ⭐ A star for trying.`:"Not quite. Try again! ⭐ A star for trying."; } });
  draw(); $("k68h").onclick=home; }
/* the grown-up's home is replaced by the kids' home while Kids Mode is on */
function guard(){ if(LG().on&&document.body.classList.contains("hs-home")) setTimeout(()=>{ if(LG().on&&document.body.classList.contains("hs-home")) home(); },30); }
function init(){ new MutationObserver(guard).observe(document.body,{attributes:true,attributeFilter:["class"]}); if(LG().on) setTimeout(home,600); }
window.CRKids={open:home,leave,_state:LG,_puz:PZ};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else setTimeout(init,0);
})();
