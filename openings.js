/* v52: "Learn openings": pick or search a line, step through it with arrows and one plain-English sentence per move,
   a memory hook, a drill until you know it, and your own lines from a pasted move list (a YouTube link is kept only as a reference link). */
(function(){
"use strict"; if(window.CROpenings) return;
const $=id=>document.getElementById(id), U=()=>window.CR52;
const KP="chessReview.v52.drill", KU="chessReview.v52.myLines", NEED=3, GAPS=[1,3,7,14];
const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SIDE=c=>c==="w"?"White":"Black";
const NM={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
function seeds(){ return (window.CROpeningsData||[]).map(x=>Object.assign({seed:true},x)); }
function mine(){ return U().LS.get(KU,[]); }
function all(){ return seeds().concat(mine()); }
function prog(id){ return U().LS.get(KP,{})[id]||{clean:0,runs:0,due:0}; }
function setProg(id,p){ const a=U().LS.get(KP,{}); a[id]=p; U().LS.set(KP,a); }
function badge(id){ const p=prog(id); if(p.clean>=NEED) return Date.now()>=p.due?"🔁 Review":"⭐ Known"; return p.runs?`${p.clean}/${NEED}`:""; }
/* play out a line -> positions + verbose moves */
function build(line){ const C=U().CH(), g=new C(), pos=[g.fen()], mv=[];
  for(const [san] of line.moves){ const m=g.move(san); mv.push(m); pos.push(g.fen()); } return {pos,mv}; }

/* ---------- auto explanations for user lines (our own rules) ---------- */
const CENTRE=["d4","e4","d5","e5"], NEAR=["c3","c4","c5","c6","f3","f4","f5","f6","d3","e3","d6","e6"];
function explain(m,before,after,ply){ const C=U().CH(), side=SIDE(m.color), them=SIDE(m.color==="w"?"b":"w"), pc=NM[m.piece];
  const ga=new C(after); let s;
  if(m.flags.includes("k")) s=`${side} castles on the king's side: the king hides in the corner and the rook joins the game.`;
  else if(m.flags.includes("q")) s=`${side} castles on the queen's side: the king steps to safety and the rook comes to the middle.`;
  else if(m.captured){ s=`${side}'s ${pc} takes ${them}'s ${NM[m.captured]}${m.flags.includes("e")?" in passing (en passant)":""}.`; }
  else if(m.promotion) s=`${side}'s pawn reaches the last row and becomes a ${NM[m.promotion]}.`;
  else if(m.piece==="p"&&CENTRE.includes(m.to)) s=`${side} pushes a pawn into the middle of the board to grab space.`;
  else if(m.piece==="p"&&"fg".includes(m.to[0])&&ply<20) s=`${side} pushes a pawn in front of the king. Careful: this can weaken the king.`;
  else if(m.piece==="p") s=`${side} moves a pawn${NEAR.includes(m.to)?" to support the middle":""}.`;
  else if((m.piece==="n"||m.piece==="b")&&(m.from[1]==="1"||m.from[1]==="8")) s=`${side} brings the ${pc} out${CENTRE.concat(NEAR).includes(m.to)?" toward the centre":""}, getting ready to castle.`;
  else if(m.piece==="q"&&ply<12) s=`${side}'s queen comes out early. She is strong, but she can get chased around.`;
  else if(m.piece==="k") s=`${side}'s king steps to a new square.`;
  else s=`${side} moves the ${pc} to a better square.`;
  if(ga.isCheckmate()) return s.replace(/\.$/,"")+". Checkmate!";
  if(ga.inCheck()) return s.replace(/\.$/,"")+", and it's check!";
  // threat: what does the moved piece attack now?
  try{ const f=after.split(" "); f[1]=m.color; f[3]="-"; const t=new C(f.join(" ")); const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
    const hits=t.moves({square:m.to,verbose:true}).filter(x=>x.captured&&x.captured!=="k"&&(VAL[x.captured]>VAL[m.piece]||!ga.attackers(x.to,m.color==="w"?"b":"w").length)).sort((a,b)=>VAL[b.captured]-VAL[a.captured]);
    if(hits.length&&!m.captured) s=s.replace(/\.$/,"")+` and now attacks the ${NM[hits[0].captured]}.`; }catch(e){}
  return s; }
function autoHook(line,b){ const g=new (U().CH())(b.pos[b.pos.length-1]), mv=b.mv, me=line.side;
  const dev=mv.filter(m=>m.color===me&&"nb".includes(m.piece)&&"18".includes(m.from[1])).length, castled=mv.some(m=>m.color===me&&/[kq]/.test(m.flags)), early=mv.some((m,i)=>m.piece==="q"&&i<8&&m.color===me);
  let idea=g.isCheckmate()?"The line ends in checkmate: watch how the pieces team up on the king.":castled?`Get your pieces out (${dev} minor piece${dev===1?"":"s"}) and castle early.`:`Get your pieces out fast and fight for the middle.`;
  let mistake=early?"Don't bring the queen out too early without a clear reason. She gets chased and you lose time.":mv.some(m=>m.piece==="p"&&m.from[0]==="f")?"Be careful pushing the pawn in front of your king. It opens lines toward your king.":"Don't move the same piece twice in the opening when you could bring out a new one.";
  return {idea,mistake}; }

/* ---------- list ---------- */
function list(q){ const p=U().show("open52"), E_=U().E_;
  p.innerHTML=`<h2>♞ Learn openings</h2><p class="mute">Pick a line or search. Then step through it, learn the idea and drill it.</p>
   <input type="text" id="o52q" placeholder="Search, e.g. London or Scholar" value="${E_(q||"")}"><div id="o52l" style="margin-top:8px"></div>
   <button class="lt" id="o52add"><span class="i">🔗</span><span><b>Learn a line from a video</b><small>Paste a YouTube link and the moves</small></span></button>`;
  const paint=()=>{ const s=$("o52q").value.trim().toLowerCase(), L=all().filter(x=>!s||(x.name+" "+(x.tags||"")).toLowerCase().includes(s));
    $("o52l").innerHTML=L.map(x=>`<button class="lt" data-o="${E_(x.id)}"><span class="i">${x.icon||"🎬"}</span><span><b>${E_(x.name)}</b><small>${E_(x.sub||"")} · you play ${SIDE(x.side)}</small></span><span class="tk">${badge(x.id)}</span></button>`).join("")||`<p class="mute">Nothing found. Try another word, or add your own line below.</p>`;
    $("o52l").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>view(all().find(x=>x.id===b.dataset.o),0)); };
  $("o52q").oninput=paint; paint(); $("o52add").onclick=()=>videoForm(); }

/* ---------- step through ---------- */
function view(line,k){ const p=U().show("open52"), E_=U().E_, b=build(line), N=line.moves.length;
  p.innerHTML=`<h2>${line.icon||"🎬"} ${E_(line.name)}</h2>${line.link?`<p><a href="${E_(line.link)}" target="_blank" rel="noopener">▶ Watch the video on YouTube</a></p>`:""}
   <div class="bd" id="o52bd"></div><div class="card" id="o52ex" style="min-height:52px"></div>
   <div class="row"><button class="bt" id="o52b">‹ Back</button><button class="bt go" id="o52n">Next ›</button><span class="mute" id="o52c" style="align-self:center"></span></div>
   <div class="row"><button class="bt" id="o52h">💡 Memory hook</button><button class="bt go" id="o52d">🎯 Drill it</button><button class="bt" id="o52x">‹ All lines</button>${line.seed?"":`<button class="bt" id="o52del">🗑 Delete</button>`}</div>`;
  const B=U().board($("o52bd")); B.orient=line.side;
  const go=i=>{ k=Math.max(0,Math.min(N,i)); const m=b.mv[k-1];
    B.draw(b.pos[k],m?{arrows:[{u:m.from+m.to,c:m.color==="w"?"green":"blue"}],hl:[{sq:m.from,c:"#f5c518",o:.3},{sq:m.to,c:"#f5c518",o:.45}]}:{});
    $("o52ex").innerHTML=m?`<b>${SIDE(m.color)}, move ${Math.ceil(k/2)}:</b> ${E_(line.moves[k-1][1])}`:`<b>Start.</b> Tap Next to see the first move. You play ${SIDE(line.side)}.`;
    $("o52c").textContent=`${k} / ${N}`; $("o52b").disabled=k===0; $("o52n").disabled=k===N; if(k===N) $("o52n").textContent="Done ✓"; else $("o52n").textContent="Next ›"; };
  $("o52b").onclick=()=>go(k-1); $("o52n").onclick=()=>go(k+1); $("o52h").onclick=()=>hook(line); $("o52d").onclick=()=>drill(line); $("o52x").onclick=()=>list();
  if($("o52del")) $("o52del").onclick=()=>{ if(!confirm("Delete this line?")) return; U().LS.set(KU,mine().filter(x=>x.id!==line.id)); list(); };
  go(k||0); }
function hook(line){ const p=U().show("open52"), E_=U().E_, b=build(line), h=line.hook||autoHook(line,b), last=b.mv[b.mv.length-1];
  p.innerHTML=`<h2>💡 Memory hook</h2><p class="mute">${E_(line.name)}</p>
   <div class="card"><b>🧠 Main idea</b><p>${E_(h.idea)}</p></div>
   <div class="card"><b>📸 Picture to remember</b><div class="bd" style="max-width:260px">${U().mini(b.pos[b.pos.length-1],line.side,{nocoord:true,arrows:last?[{u:last.from+last.to,c:"green"}]:[]})}</div><p class="mute" style="text-align:center">The final position. Close your eyes and picture it.</p></div>
   <div class="card"><b>⚠️ The mistake to avoid</b><p>${E_(h.mistake)}</p></div>
   <div class="row"><button class="bt go" id="o52d">🎯 Drill it</button><button class="bt" id="o52v">‹ Back to the line</button></div>`;
  $("o52d").onclick=()=>drill(line); $("o52v").onclick=()=>view(line,0); }

/* ---------- drill: you make your side's moves; wrong answers come back again before the run ends ---------- */
function drill(line){ const p=U().show("open52"), E_=U().E_, C=U().CH(), b=build(line), N=b.mv.length;
  const asks=b.mv.map((m,i)=>i).filter(i=>b.mv[i].color===line.side);
  // start partway: first run from move 1, later runs start further in, but every run checks the rest of the line
  const pr=prog(line.id), startAt=asks.length>2&&pr.runs>0?asks[Math.min(asks.length-1,pr.runs%Math.ceil(asks.length/2))]:asks[0];
  let queue=asks.filter(i=>i>=startAt), retry=[], mistakes=0, cur=null, g=null, sel=null, lock=false;
  p.innerHTML=`<h2>🎯 Drill: ${E_(line.name)}</h2><p class="mute">You play ${SIDE(line.side)}. Make the next move of the line on the board.</p>
   <div class="card" id="o52q" style="font-weight:700"></div><div class="bd" id="o52bd"></div><div class="msg" id="o52m"></div>
   <div class="mute" id="o52p"></div><div class="row"><button class="bt" id="o52v">‹ Back to the line</button></div>`;
  const B=U().board($("o52bd"),tap); B.orient=line.side;
  const status=()=>{ const q=prog(line.id); $("o52p").textContent=`Clean runs: ${Math.min(q.clean,NEED)} of ${NEED} · mistakes this run: ${mistakes}`; };
  function ask(){ sel=null; lock=false; if(!queue.length&&retry.length){ queue=retry; retry=[]; }
    if(!queue.length) return end(); cur=queue.shift(); g=new C(b.pos[cur]); const prev=b.mv[cur-1];
    B.draw(b.pos[cur],prev?{arrows:[{u:prev.from+prev.to,c:"blue"}],hl:[{sq:prev.to,c:"#f5c518",o:.4}]}:{});
    $("o52q").textContent=prev?`${SIDE(prev.color)} just played: ${line.moves[cur-1][1]} What's your move?`:"What's the first move?"; status(); }
  function tap(sq){ if(lock||!g) return; const pc=g.get(sq); if(pc&&pc.color===g.turn()){ sel=sq; B.draw(g.fen(),{hl:[{sq,c:"#3b6fb6",o:.5}],dots:g.moves({square:sq,verbose:true}).map(m=>m.to)}); return; }
    if(!sel) return; const c=g.moves({square:sel,verbose:true}).filter(m=>m.to===sq); sel=null; if(!c.length){ B.draw(g.fen()); return; }
    const want=b.mv[cur], m=c.find(x=>x.promotion===want.promotion)||c[0], ok=m.from===want.from&&m.to===want.to; lock=true;
    if(ok){ $("o52m").className="msg ok"; $("o52m").textContent="✅ Right! "+line.moves[cur][1];
      B.draw(b.pos[cur+1],{arrows:[{u:want.from+want.to,c:"green"}],hl:[{sq:want.to,c:"#2e9b4f",o:.5}]}); setTimeout(ask,1600); }
    else { mistakes++; retry.push(cur); queue.unshift(cur); $("o52m").className="msg no"; $("o52m").textContent=`❌ Not this time. The line plays the ${NM[want.piece]} here (green arrow). Try it now, and we'll ask again at the end.`;
      B.draw(b.pos[cur],{arrows:[{u:m.from+m.to,c:"red"},{u:want.from+want.to,c:"green"}]}); status(); setTimeout(()=>{ $("o52m").textContent=""; ask(); },2600); } }
  function end(){ const q=prog(line.id); q.runs++; if(!mistakes) q.clean++; else q.clean=0;
    if(q.clean>=NEED) q.due=Date.now()+GAPS[Math.min(GAPS.length-1,q.clean-NEED)]*864e5; setProg(line.id,q);
    const known=q.clean>=NEED; $("o52q").textContent=known?"⭐ You know this line!":mistakes?"Run finished. Let's go again until it's clean.":"Clean run! 👏";
    $("o52m").className="msg "+(mistakes?"no":"ok"); $("o52m").textContent=known?`Come back in ${GAPS[Math.min(GAPS.length-1,q.clean-NEED)]} day(s) for a quick review.`:`${NEED-q.clean} more clean run(s) to go.`;
    B.draw(b.pos[N]); status(); const r=document.createElement("div"); r.className="row"; r.innerHTML=`<button class="bt go" id="o52again">🔁 Drill again</button>`; $("o52p").after(r); $("o52again").onclick=()=>drill(line); }
  $("o52v").onclick=()=>view(line,0); ask(); }

/* ---------- learn a line from a video ---------- */
function ytOk(u){ try{ const x=new URL(u.trim()); return /^https?:$/.test(x.protocol)&&/(^|\.)(youtube\.com|youtu\.be)$/i.test(x.hostname); }catch(e){ return false; } }
function tokens(txt){ return txt.replace(/\{[^}]*\}|\([^)]*\)/g," ").replace(/\b(1-0|0-1|1\/2-1\/2|\*)\s*$/,"").split(/[\s,;]+/).map(t=>t.replace(/^\d+\.(\.\.)?/,"").replace(/^\.+/,"")).map(t=>t.replace(/[!?]+$/,"")).filter(t=>t&&!/^\d+\.*$/.test(t)); }
function parseMove(g,t){ let s=t.replace(/0-0-0/,"O-O-O").replace(/0-0/,"O-O").replace(/[+#]$/,"");
  const co=/^([a-h][1-8])-?x?([a-h][1-8])=?([qrbnQRBN])?$/.exec(s); if(co){ const m=g.moves({verbose:true}).find(x=>x.from===co[1]&&x.to===co[2]&&(!x.promotion||x.promotion===(co[3]||"q").toLowerCase())); return m?{m}:{why:"that piece can't move there right now"}; }
  if(/^[nbrqk][a-h]?[1-8]?x?[a-h][1-8]$/.test(s)) s=s[0].toUpperCase()+s.slice(1);
  if(!/^(O-O(-O)?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h](x[a-h])?[1-8](=?[QRBNqrbn])?)$/.test(s)) return {why:"I can't read this as a chess move"};
  s=s.replace(/([a-h][18])=?([qrbnQRBN])$/,(a,b,c)=>b+"="+c.toUpperCase());
  const m=g.moves({verbose:true}).find(x=>x.san.replace(/[+#]$/,"")===s)||g.moves({verbose:true}).find(x=>x.san.replace(/[+#]$/,"").replace(/^([KQRBN])[a-h1-8]/,"$1")===s);
  if(m) return {m};
  const pc={K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight"}[s[0]]||"pawn", to=(s.match(/[a-h][1-8]/g)||[]).pop();
  if(s.startsWith("O-O")) return {why:"castling isn't allowed here (pieces in the way, the king or rook already moved, or the king is in check)"};
  if(g.inCheck()) return {why:`the king is in check, so this move isn't allowed`};
  return {why:`no ${SIDE(g.turn())} ${pc} can move to ${to} here`}; }
function check(txt){ const C=U().CH(), g=new C(), t=tokens(txt), out=[];
  if(!t.length) return {err:"Paste or type the moves first.",at:-1};
  for(let i=0;i<t.length;i++){ const r=parseMove(g,t[i]); if(!r.m) return {err:`Move ${Math.floor(i/2)+1} for ${SIDE(i%2?"b":"w")}: “${t[i]}” — ${r.why}.`,at:i,fen:g.fen(),toks:t}; g.move(r.m); out.push(r.m.san); }
  return {sans:out}; }
function videoForm(pre){ pre=pre||{}; const p=U().show("open52"), E_=U().E_;
  p.innerHTML=`<h2>🔗 Learn a line from a video</h2><p class="mute">We only keep the link so you can open the video on YouTube. The explanations are written by the app.</p>
   <h3>YouTube link</h3><input type="url" id="o52u" placeholder="https://www.youtube.com/watch?v=…" value="${E_(pre.link||"")}">
   <h3>Moves</h3><textarea id="o52t" placeholder="e.g. 1.d4 d5 2.Bf4 Nf6 3.e3">${E_(pre.moves||"")}</textarea>
   <h3>Name (optional)</h3><input type="text" id="o52n" placeholder="e.g. My London line" value="${E_(pre.name||"")}">
   <div class="row"><button class="bt go" data-s="w">I play White</button><button class="bt go" data-s="b">I play Black</button></div>
   <div class="msg no" id="o52e"></div><div id="o52f"></div><div class="row"><button class="bt" id="o52x">‹ All lines</button></div>`;
  $("o52x").onclick=()=>list();
  p.querySelectorAll("[data-s]").forEach(x=>x.onclick=()=>{ const link=$("o52u").value.trim(), txt=$("o52t").value; $("o52f").innerHTML="";
    if(!ytOk(link)){ $("o52e").textContent="Please paste a YouTube link (youtube.com or youtu.be)."; return; }
    const r=check(txt); if(r.err){ $("o52e").textContent="⚠️ "+r.err+(r.at>=0?" Fix it and try again.":"");
      if(r.at>=0){ $("o52f").innerHTML=`<div class="card"><p class="mute" style="margin:0 0 4px">Your moves: ${r.toks.map((t,i)=>i===r.at?`<b style="color:#c62828;text-decoration:underline">${E_(t)}</b>`:E_(t)).join(" ")}</p><p class="mute">The board just before that move:</p><div class="bd" style="max-width:260px">${U().mini(r.fen,"w",{})}</div></div>`; } return; }
    const C=U().CH(), g=new C(), moves=r.sans.map((san,i)=>{ const before=g.fen(); const m=g.move(san); return [san,explain(m,before,g.fen(),i)]; });
    const line={id:"u"+Date.now(),name:$("o52n").value.trim()||("Video line: "+r.sans.slice(0,4).join(" ")),side:x.dataset.s,icon:"🎬",sub:`${r.sans.length} moves from a video`,link,moves,tags:"video my line"};
    line.hook=autoHook(line,build(line)); const L=mine(); L.push(line); U().LS.set(KU,L); view(line,0); }); }
U().onClose(()=>{});
window.CROpenings={open:list,_view:id=>view(all().find(x=>x.id===id),0),_hook:id=>hook(all().find(x=>x.id===id)),_drill:id=>drill(all().find(x=>x.id===id)),_check:check,_explain:explain,_video:videoForm};
})();
