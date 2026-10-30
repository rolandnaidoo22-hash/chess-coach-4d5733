/* v64: Your Game, Your Lesson + community lessons (preview feed). Our own words. */
(function(){ "use strict"; if(window.CRLesson64) return;
const $=id=>document.getElementById(id), E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const LG=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, LS=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const CH=()=>(window.ChessLib&&ChessLib.Chess)||window.Chess, PN={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const API=()=>window.CR64_LESSONS_URL||"https://lessons-preview.chess-review.workers.dev", KM="chessReview.v64.myLessons", KF="chessReview.v64.feed", KL="chessReview.v64.learned";
const isMine=p=>p&&p.user&&["blunder","mistake","miss"].includes(p.cls);
function biggest(Pl){ let b=null; (Pl||[]).forEach((p,i)=>{ if(!isMine(p)||!p.best_uci||!p.uci||p.best_uci===p.uci||!p.fen_before) return; const l=+(p.cpl||0)+(p.cls==="blunder"?1e4:p.cls==="miss"?5e3:0); if(!b||l>b.l) b={l,i,p}; }); return b; }
function mv(fen,u){ try{ const g=new (CH())(fen), m=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"}); return m?{g,m}:null; }catch(e){ return null; } }
const cap=s=>s[0].toUpperCase()+s.slice(1);
/* plain sentences, piece names only: no squares, no notation, no numbers */
function build(d){ const Pl=d&&d.plies, b=biggest(Pl); if(!b) return null; const p=b.p, M=d.meta||{}, me=p.color, side=me==="w"?"White":"Black";
  if(!/^(1-0|0-1|1\/2-1\/2)$/.test(M.result||"")) return null;
  let ty="threat"; try{ ty=CRLearn60.typeOf(p); }catch(e){}
  const A=mv(p.fen_before,p.uci), B=mv(p.fen_before,p.best_uci); if(!A||!B) return null; const pc=PN[A.m.piece];
  let s2=`You moved your ${pc}, but that let your opponent make a strong threat.`; const r=(p.reply_uci||[])[0];
  if(ty==="miss") s2=`You moved your ${pc}, but your opponent had just left a chance open, and it slipped by.`;
  else if(r){ const g=new (CH())(A.g.fen()), tk=g.get(r.slice(2,4)), rp=g.get(r.slice(0,2)), R=mv(A.g.fen(),r);
    if(rp&&R){ const their=PN[rp.type];
      if(/#/.test(R.m.san)) s2=`You moved your ${pc}, and that let their ${their} give checkmate.`;
      else if(tk&&r.slice(2,4)===p.uci.slice(2,4)) s2=`You moved your ${pc} to a square where their ${their} could simply take it.`;
      else if(tk) s2=`You moved your ${pc}. That left your ${PN[tk.type]} without enough protection, and their ${their} could take it${/\+/.test(R.m.san)?" with check":""}.`;
      else if(/\+/.test(R.m.san)) s2=`You moved your ${pc}, and their ${their} could then attack your king with check and win something.`; } }
  const bp=PN[B.m.piece], s3=B.m.captured?`Take their ${PN[B.m.captured]} with your ${bp}.`:/#/.test(B.m.san)?`Your ${bp} gives checkmate here.`:/\+/.test(B.m.san)?`Your ${bp} gives a strong check here.`:B.m.piece===A.m.piece?`Move your ${bp} here instead; it keeps everything safe.`:`Move your ${bp} here instead; it keeps everything safe.`;
  const L={fen:p.fen_before,played:p.uci.slice(0,5),better:p.best_uci.slice(0,5),side:me,type:ty,s1:`You are playing ${side}. This is the move that cost the most in this game.`,s2,s3,
    white:M.white||"",black:M.black||"",gid:String(M.link||[M.white,M.black,M.date].join("|")),date:M.date||"",at:Date.now(),id:"m"+Date.now(),mine:true,shared:false};
  return L; }
function saveMine(L){ const A=LG(KM,[]).filter(x=>x.gid!==L.gid||x.fen!==L.fen); A.unshift(L); LS(KM,A.slice(0,30)); }
function fromReview(){ let d=null; try{ d=DATA; }catch(e){} const L=build(d); if(!L){ alert("This game needs a finished result and one clear mistake to make a lesson."); return; } saveMine(L); try{ CRHome.setMode("app",true); }catch(e){} view(L); }
/* ---- the silent 3-step lesson ---- */
function view(L,step){ const p=CR52.show("ls64"); let s=step||1;
  const draw=()=>{ const ar=s>=2?[{u:L.played,c:"#d32f2f"}]:[]; if(s===3) ar.push({u:L.better,c:"#2f7d32"});
    p.innerHTML=`<div class="ls64pin"><div class="ls64bd" id="ls64bd" role="button" tabindex="0" aria-label="Board, tap for the next step">${CR52.mini(L.fen,L.side,{arrows:ar})}</div>
     <div class="ls64dots">${[1,2,3].map(i=>`<span class="${i<=s?"on":""}"></span>`).join("")}</div></div>
     <div class="ls64txt" id="ls64txt">${s===1?`<b>${E_(L.s1)}</b>`:s===2?`<b>🔴 What you played</b><p>${E_(L.s2)}</p>`:`<b>🟢 Do this instead.</b><p>${E_(L.s3)}</p>`}</div>
     <div class="bs64row"><button type="button" id="ls64b" ${s===1?"disabled":""}>‹ Back</button><button type="button" id="ls64n">${s<3?"Next ›":"Done"}</button></div>
     ${s===3&&L.mine?share(L):""}${s===3?`<button type="button" class="bs64sec" id="ls64fd">📚 Community lessons</button>`:""}`;
    $("ls64b").onclick=()=>{ if(s>1){ s--; draw(); } }; const nx=()=>{ if(s<3){ s++; draw(); } else feed(); }; $("ls64n").onclick=nx; $("ls64bd").onclick=()=>{ if(s<3){ s++; draw(); } };
    const f=$("ls64fd"); if(f) f.onclick=feed; if(s===3&&L.mine) wireShare(L); };
  draw(); }
function share(L){ const names=L.white&&L.black; return `<div class="card ls64sh"><b>Share this lesson?</b><p class="mute">Off unless you choose it. Only the position, the two moves and these three sentences are shared.</p>
  ${L.shared?`<p>✅ Shared${L.anon?" anonymously":""}. Thanks!</p>`:`<label class="ls64ck"><input type="checkbox" id="ls64on"> Share this lesson with other players</label>
  <label class="ls64ck"><input type="checkbox" id="ls64an" checked ${names?"":"disabled"}> Anonymous (hide both usernames)</label>
  <button type="button" class="bs64go" id="ls64go" disabled>Share this lesson</button><div id="ls64m" class="bs64msg"></div>`}</div>`; }
function wireShare(L){ const on=$("ls64on"), go=$("ls64go"); if(!on) return; on.onchange=()=>go.disabled=!on.checked;
  go.onclick=async()=>{ if(!on.checked) return; const anon=$("ls64an").checked||!(L.white&&L.black), body={fen:L.fen,played:L.played,better:L.better,side:L.side,type:L.type,s1:L.s1,s2:L.s2,s3:L.s3,anon};
    if(!anon){ body.white=String(L.white).replace(/[^A-Za-z0-9_-]/g,"").slice(0,30); body.black=String(L.black).replace(/[^A-Za-z0-9_-]/g,"").slice(0,30); }
    go.disabled=true; $("ls64m").textContent="Sharing…";
    try{ const r=await fetch(API()+"/lessons",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}), j=await r.json(); if(!r.ok) throw new Error(j.error||"failed");
      L.shared=true; L.anon=anon; L.rid=j.id; saveMine(L); view(L,3); }catch(e){ go.disabled=false; $("ls64m").textContent=navigator.onLine?"Couldn't share right now: "+e.message:"You're offline. Try sharing when you're back online."; } }; }
/* ---- community feed ---- */
async function feed(){ try{ CRHome.setMode("app",true); }catch(e){} const p=CR52.show("ls64"), mine=LG(KM,[]);
  p.innerHTML=`<h2>🎓 Community lessons</h2><p class="mute">Short lessons from real games, newest first. Each one is a "find the better move" puzzle. Saved on this phone, so they work offline too.</p>
   <button type="button" class="bs64go" id="ls64new">➕ Make a lesson from my latest game</button>
   ${mine.length?`<h3>My lessons</h3><div class="ls64list">${mine.map((L,i)=>card(L,"m"+i)).join("")}</div>`:""}<h3>From other players</h3><div id="ls64feed" class="ls64list"><p class="mute">Loading…</p></div>`;
  $("ls64new").onclick=()=>{ let G=[]; try{ G=Coach17._all(); }catch(e){} let L=null; for(const g of G){ L=build(g.d); if(L) break; } if(!L){ alert("Check a finished game first (Review a game or My Coach) and a lesson will be made from your biggest mistake."); return; } saveMine(L); view(L); };
  wire(p,mine); let F=LG(KF,{at:0,lessons:[]}), off=false;
  try{ const r=await fetch(API()+"/lessons?limit=30",{cache:"no-store"}); const j=await r.json(); if(r.ok&&Array.isArray(j.lessons)){ F={at:Date.now(),lessons:j.lessons.filter(ok).slice(0,30)}; LS(KF,F); } else off=true; }catch(e){ off=true; }
  const el=$("ls64feed"); if(!el) return; const mineIds=new Set(mine.map(x=>x.rid).filter(Boolean)), list=F.lessons.filter(x=>!mineIds.has(x.id));
  el.innerHTML=(off?`<p class="mute">📴 Offline: showing lessons saved on this phone${F.at?` (from ${new Date(F.at).toLocaleDateString()})`:""}.</p>`:"")+(list.length?list.map((L,i)=>card(L,"f"+i)).join(""):`<p class="mute">No shared lessons yet.</p>`);
  wire(el,list); return F; }
const ok=L=>L&&typeof L.fen==="string"&&/^[a-h][1-8][a-h][1-8]/.test(L.played||"")&&/^[a-h][1-8][a-h][1-8]/.test(L.better||"");
function who(L){ if(L.mine) return "Your game"; return L.anon===false&&L.white&&L.black?`${E_(L.white)} vs ${E_(L.black)}`:"Anonymous game"; }
function card(L,k){ const lr=LG(KL,[]).includes(L.id||L.rid); return `<div class="ls64c" data-k="${k}"><div class="ls64mini">${CR52.mini(L.fen,L.side,{})}</div><div><b>Find the better move</b><small>${who(L)} · ${L.side==="w"?"White":"Black"} to move${lr?" · ✅ learned":""}</small>
  <div class="ls64cb"><button type="button" data-a="pz">🧩 Solve</button>${L.mine?`<button type="button" data-a="ls">▶ Lesson</button>`:""}</div></div></div>`; }
function wire(root,list){ root.querySelectorAll(".ls64c").forEach(c=>{ const L=list[+c.dataset.k.slice(1)]; if(!L||(c.dataset.k[0]==="m")!==!!L.mine&&!L.mine) return;
  c.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>b.dataset.a==="pz"?puzzle(L):view(L)); }); }
function puzzle(L){ const p=CR52.show("ls64"), G=new (CH())(L.fen), me=L.side; let hint=0, ar=[], hl=[], done=false; const pc=mv(L.fen,L.better), pn=pc?PN[pc.m.piece]:"piece";
  p.innerHTML=`<h2>🧩 Find the better move</h2><p class="mute">${who(L)} · You play ${me==="w"?"White":"Black"}.</p><div class="ls64pin"><div class="ls64bd" id="ls64pb"></div></div>
   <div id="ls64pm" class="bs64msg">In the game, a move here cost a lot. Find a better one.</div>
   <div class="bs64row"><button type="button" id="ls64h">💡 Hint</button><button type="button" id="ls64s">Show solution</button></div>
   <button type="button" class="bs64go" id="ls64ln" hidden>✅ I learned this</button><button type="button" class="bs64sec" id="ls64bk">‹ Community lessons</button>`;
  const msg=t=>$("ls64pm").innerHTML=t, sq=s=>({sq:s,c:"#f5c518",o:.65});
  const solved=t=>{ done=true; ar=[{u:L.better,c:"#2f7d32"}]; msg(t+`<p>${E_(L.s3)}</p>`); $("ls64ln").hidden=false; dr(); };
  const dr=Coach17._tapBoard($("ls64pb"),G,me,(f,q)=>{ if(done) return; if((f+q)===L.better.slice(0,4)) solved("✅ That's the better move."); else msg("Not that one. Try again, or take a hint."); dr(); },()=>({arrows:ar,hl}));
  $("ls64h").onclick=()=>{ if(done) return; hint=Math.min(3,hint+1);
    if(hint===1){ hl=[sq(L.better.slice(0,2))]; msg(`💡 Hint 1 of 3: use your ${pn}.`); } else if(hint===2){ hl=[sq(L.better.slice(0,2)),sq(L.better.slice(2,4))]; msg(`💡 Hint 2 of 3: your ${pn} goes to the other yellow square.`); }
    else { ar=[{u:L.better,c:"#f5a623",dash:1}]; msg(`💡 Hint 3 of 3: follow the arrow, then make the move.`); } dr(); };
  $("ls64s").onclick=()=>solved("Here is the better move.");
  $("ls64bk").onclick=feed;
  $("ls64ln").onclick=async()=>{ const id=L.id||L.rid||L.fen, A=LG(KL,[]); if(!A.includes(id)){ A.push(id); LS(KL,A.slice(-300)); }
    $("ls64ln").disabled=true; $("ls64ln").textContent="✅ Saved as learned"; if(L.id&&!L.mine) try{ await fetch(API()+"/lessons/"+L.id+"/learned",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}); }catch(e){} }; }
/* Review summary button, next to "Learn from this loss" */
function button(){ const host=$("rv59sum")||$("summary"); if(!host) return; const o=$("ls64go1"); if(o) o.remove(); let d=null; try{ d=DATA; }catch(e){} if(!d||!biggest(d.plies)||!/^(1-0|0-1|1\/2-1\/2)$/.test((d.meta||{}).result||"")) return;
  host.insertAdjacentHTML("beforeend",`<button type="button" class="ln60go" id="ls64go1">🎓 Your game, your lesson<small>Three quick steps on your costliest move. Share it only if you want to.</small></button>`); $("ls64go1").onclick=fromReview; }
(function hook(){ if(typeof buildSummary!=="function") return setTimeout(hook,300); const o=buildSummary; buildSummary=function(){ const r=o.apply(this,arguments); setTimeout(button,20); return r; }; })();
const st=document.createElement("style"); st.textContent=`
.ls64pin{position:sticky;top:0;z-index:5;background:var(--bg,#fff);padding-bottom:4px}.ls64bd{max-width:min(420px,52vh);margin:0 auto}.ls64bd svg{width:100%;height:auto;display:block}
.ls64dots{display:flex;gap:6px;justify-content:center;margin:6px 0}.ls64dots span{width:28px;height:6px;border-radius:3px;background:#ccd}.ls64dots span.on{background:#3b6fb6}
.ls64txt{font-size:17px;line-height:1.4;min-height:84px;padding:4px 2px}.ls64txt p{margin:4px 0}.bs64row button:disabled{opacity:.45}
.ls64ck{display:flex;gap:8px;align-items:center;min-height:44px;font-size:15.5px}.ls64ck input{width:22px;height:22px}.bs64go:disabled{opacity:.45}
.ls64list{display:flex;flex-direction:column;gap:8px}.ls64c{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;border:1px solid var(--line,#ddd);border-radius:12px;padding:8px;background:#fff}.ls64mini svg{width:96px;height:96px;display:block}.ls64c small{display:block;color:var(--mute,#666);font-size:13px}
.ls64cb{display:flex;gap:6px;margin-top:6px}.ls64cb button{min-height:42px;flex:1;border-radius:10px;border:1px solid #3b6fb6;background:#fff;color:#1e4f91;font:inherit;font-weight:700}
html.dark-mode .ls64c,html.dark-mode .ls64pin{background:#1e1e1e;color:#eee}`; document.head.appendChild(st);
window.CRLesson64={build,view,feed,puzzle,fromReview,_mine:()=>LG(KM,[]),_feed:()=>LG(KF,null)};
})();
