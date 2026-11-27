/* v84: Practice board. You move the pieces for both sides (no bot, no clock): undo/redo, flip, move list you can jump through,
   set up any position, copy/paste FEN. The board is saved, so it is still there next time. Pure functions first (tested in node), then the screen.
   Nothing here opens over the board: promotion and setup choices appear in a row under it. */
(function(W){ "use strict"; if(W.CRFree84) return;
const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const KEY="chessReview.v84.freeboard";
const CH=()=>W.ChessLib&&W.ChessLib.Chess||W.Chess;
const UCI=/^[a-h][1-8][a-h][1-8][qrbn]?$/;
const SIDE=c=>c==="w"?"White":"Black";
const toU=m=>m.from+m.to+(m.promotion||"");
/* ---------- positions ---------- */
function mapOf(fen){ const map={}; String(fen||"").split(" ")[0].split("/").forEach((row,ri)=>{ let f=0; for(const ch of row){ if(/\d/.test(ch)){ f+=+ch; continue; } if(f<8) map["abcdefgh"[f]+(8-ri)]=(ch===ch.toUpperCase()?"w":"b")+ch.toUpperCase(); f++; } }); return map; }
function placement(map){ const rows=[]; for(let r=8;r>=1;r--){ let s="", e=0; for(let f=0;f<8;f++){ const p=map["abcdefgh"[f]+r]; if(!p){ e++; continue; } if(e){ s+=e; e=0; } s+=p[0]==="w"?p[1]:p[1].toLowerCase(); } if(e) s+=e; rows.push(s); } return rows.join("/"); }
/* castling is only possible when the king and that rook are still on their home squares */
function castleRights(map){ let s=""; if(map.e1==="wK"){ if(map.h1==="wR") s+="K"; if(map.a1==="wR") s+="Q"; } if(map.e8==="bK"){ if(map.h8==="bR") s+="k"; if(map.a8==="bR") s+="q"; } return s; }
function setupFen(map,turn){ return `${placement(map)} ${turn==="b"?"b":"w"} ${castleRights(map)||"-"} - 0 1`; }
/* a position you can actually play from: one king each, no pawns on the end rows, the side that just moved is not in check */
function checkFen(fen){ const C=CH(), vf=W.ChessLib&&W.ChessLib.validateFen;
  const parts=String(fen||"").split(" "); const pl=parts[0]||"";
  const n=c=>(pl.match(new RegExp(c,"g"))||[]).length;
  if(n("K")!==1||n("k")!==1) return {ok:false,error:"Each side needs exactly one king."};
  const rows=pl.split("/"); if(rows.length===8&&/[pP]/.test(rows[0]+rows[7])) return {ok:false,error:"Pawns can't stand on the first or last row."};
  if(vf){ const v=vf(fen); if(!v.ok) return {ok:false,error:"That position doesn't look right ("+String(v.error||"").replace(/^Invalid FEN:\s*/i,"")+")."}; }
  try{ const h=new C(); h.load([pl,parts[1]==="w"?"b":"w","-","-","0","1"].join(" "),{skipValidation:true}); if(h.inCheck()) return {ok:false,error:`${SIDE(parts[1]==="w"?"b":"w")} is in check but it's ${SIDE(parts[1])}'s move. Change who moves next.`}; }catch(e){}
  try{ new C(fen); }catch(e){ return {ok:false,error:"That position doesn't look right."}; }
  return {ok:true}; }
/* pasted FEN: tolerate extra spaces and missing tail fields; drop castling rights the pieces don't allow */
function parseFen(text){ const s=String(text||"").trim().replace(/\s+/g," "); if(!s) return {ok:false,error:"Paste a FEN first."};
  const p=s.split(" "); if(!/^[1-8pnbrqkPNBRQK]+(\/[1-8pnbrqkPNBRQK]+){7}$/.test(p[0])) return {ok:false,error:"That doesn't look like a FEN. It should start like rnbqkbnr/pppppppp/…"};
  const turn=(p[1]||"w").toLowerCase()==="b"?"b":"w", allow=castleRights(mapOf(p[0]));
  const cr=(p[2]&&p[2]!=="-"?p[2]:"").split("").filter(c=>allow.includes(c)).join("")||"-";
  const ep=/^[a-h][36]$/.test(p[3]||"")?p[3]:"-", hm=/^\d+$/.test(p[4]||"")?p[4]:"0", fm=/^[1-9]\d*$/.test(p[5]||"")?p[5]:"1";
  let fen=[p[0],turn,cr,ep,hm,fm].join(" "); let chk=checkFen(fen);
  if(!chk.ok&&ep!=="-"){ const f2=[p[0],turn,cr,"-",hm,fm].join(" "); if(checkFen(f2).ok){ fen=f2; chk={ok:true}; } }
  return chk.ok?{ok:true,fen}:{ok:false,error:chk.error}; }
/* ---------- game state: {start, moves:[uci], idx (ply shown), orient} ---------- */
function blank(orient){ return {v:1,start:START,moves:[],idx:0,orient:orient==="b"?"b":"w"}; }
function line(st){ const g=new (CH())(st.start), out=[]; for(const u of st.moves){ let r=null; try{ r=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined}); }catch(e){} if(!r) break; out.push(r); } return out; }
function gameAt(st,idx){ const g=new (CH())(st.start); const L=st.moves.slice(0,idx==null?st.idx:idx); for(const u of L){ try{ g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||undefined}); }catch(e){ break; } } return g; }
function clean(raw){ if(!raw||raw.v!==1) return blank();
  const st={v:1,start:typeof raw.start==="string"&&checkFen(raw.start).ok?raw.start:START,moves:Array.isArray(raw.moves)?raw.moves.filter(u=>typeof u==="string"&&UCI.test(u)):[],idx:0,orient:raw.orient==="b"?"b":"w"};
  st.moves=line(st).map(toU); st.idx=Math.max(0,Math.min(st.moves.length,+raw.idx|0)); return st; }
/* play a move at the shown ply: same as the next stored move keeps the rest (like Redo), otherwise the old future is replaced */
function play(st,uci){ const g=gameAt(st); let r=null; try{ r=g.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||undefined}); }catch(e){} if(!r) return null;
  const u=toU(r); const moves=st.moves[st.idx]===u?st.moves.slice():st.moves.slice(0,st.idx).concat(u);
  return Object.assign({},st,{moves,idx:st.idx+1,last:r}); }
function status(g){ const t=g.turn();
  if(g.isCheckmate()) return {t:`Checkmate. ${SIDE(t==="w"?"b":"w")} wins.`,end:true};
  if(g.isStalemate()) return {t:`Stalemate. ${SIDE(t)} has no legal move, so it's a draw.`,end:true};
  if(g.isInsufficientMaterial()) return {t:"Draw: neither side has enough pieces to checkmate.",end:true};
  if(g.isThreefoldRepetition()) return {t:`Same position three times. That's a draw if a player claims it. ${SIDE(t)} to move.`};
  if(g.isDrawByFiftyMoves()) return {t:`50 moves with no capture or pawn move. That's a draw if a player claims it. ${SIDE(t)} to move.`};
  if(g.inCheck()) return {t:`${SIDE(t)} is in check.`,check:true};
  return {t:`${SIDE(t)} to move.`}; }
/* move numbers when a set-up position starts with Black to move or later in a game */
function numbering(start){ const p=String(start).split(" "); return {off:p[1]==="b"?1:0,no:Math.max(1,+p[5]||1)}; }
const api={START,KEY,mapOf,placement,castleRights,setupFen,checkFen,parseFen,blank,line,gameAt,clean,play,status,numbering};
if(typeof document==="undefined"){ W.CRFree84=api; return; }
/* ---------- screen ---------- */
const $=id=>document.getElementById(id), U=()=>W.CR52, E_=s=>U().E_(s);
const CSS=`#fb84 .fb84lay{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:12px;align-items:start}
#fb84 .fb84side{min-width:0}
#fb84 .bd{width:min(100%,calc(100dvh - 240px));max-width:720px;margin:4px auto}
#fb84 .fb84msg{min-height:24px;font-weight:700;text-align:center;margin:2px 0;font-size:15px}#fb84 .fb84msg.end{color:#c62828}#fb84 .fb84msg.chk{color:#b45309}
#fb84 .fb84note{min-height:0;text-align:center;font-size:13.5px;color:var(--mute);margin:0 0 4px}#fb84 .fb84note:empty{display:none}
#fb84 .fb84ctl{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
#fb84 .fb84ctl button{min-height:52px;padding:4px 2px;border:1px solid var(--line,#ccd);border-radius:10px;background:#fff;color:var(--ink,#222);font:inherit;font-size:12.5px;font-weight:700;line-height:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer}
#fb84 .fb84ctl button span{font-size:20px;line-height:1}#fb84 .fb84ctl button:disabled{opacity:.4}
#fb84 .fb84pr{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;background:#fff3c4;color:#222;border-radius:12px;padding:6px;margin:6px 0;font-weight:700}
#fb84 .fb84pc{width:52px;height:52px;border:1px solid #ccc;border-radius:10px;background:#fff;padding:3px;cursor:pointer}#fb84 .fb84pc svg{width:100%;height:100%;display:block}
#fb84 .fb84pc.sel{outline:3px solid #2e7d32;outline-offset:1px;background:#e8f5e9}
#fb84 .fb84pal{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:6px auto;max-width:440px}#fb84 .fb84set{max-width:560px;margin:0 auto}#fb84 .fb84pal .fb84pc{width:100%;height:auto;aspect-ratio:1}
#fb84 .fb84set .row .bt{flex:1 1 auto}#fb84 .fb84err{color:#c62828;font-weight:700;min-height:0;margin:4px 0}#fb84 .fb84err:empty{display:none}
#fb84 .fb84ml{max-height:min(50vh,480px);overflow:auto;line-height:1.9;font-size:15px;background:#f7f5f0;border:1px solid var(--line);border-radius:8px;padding:6px}
#fb84 .fb84ml button{border:0;background:none;font:inherit;color:inherit;padding:2px 6px;border-radius:6px;min-height:34px;cursor:pointer}
#fb84 .fb84ml button.now{background:#fff3cd;font-weight:800;box-shadow:inset 0 0 0 1px #e0c060}#fb84 .fb84ml .n{color:var(--mute);font-weight:700;margin-left:4px}
#fb84 .fb84fen{font-family:ui-monospace,Menlo,Consolas,monospace!important;font-size:13px!important}
#fb84 textarea.fb84fen{min-height:64px}
#fb84 [hidden]{display:none!important}
@media(max-width:800px){#fb84 .fb84lay{grid-template-columns:1fr}#fb84 .bd{width:min(100%,calc(100dvh - 270px),calc(100vw - 24px));max-width:none}#fb84 .fb84ml{max-height:168px}}
html.dark-mode #fb84 .fb84ctl button{background:#262626;color:#eee;border-color:#3a3a3a}html.dark-mode #fb84 .fb84pc{background:#d9cfbd;border-color:#3a3a3a}html.dark-mode #fb84 .fb84pc.sel{background:#b9dcbc}
html.dark-mode #fb84 .fb84ml{background:#262626;color:#eee;border-color:#3a3a3a}html.dark-mode #fb84 .fb84ml button.now{background:#3a3420}`;
function css(){ if($("fb84css")) return; const s=document.createElement("style"); s.id="fb84css"; s.textContent=CSS; document.head.appendChild(s); }
const pcSvg=p=>`<svg viewBox="0 0 45 45" aria-hidden="true"><use href="#pc-${p}"/></svg>`;
const PNAME={K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight",P:"pawn"};
let G=null;
function load(){ try{ return clean(JSON.parse(localStorage.getItem(KEY))); }catch(e){ return blank(); } }
function save(){ if(!G) return; try{ localStorage.setItem(KEY,JSON.stringify({v:1,start:G.st.start,moves:G.st.moves,idx:G.st.idx,orient:G.st.orient})); }catch(e){} }
function rebuild(){ G.line=line(G.st); G.g=gameAt(G.st); }
function open(){ css(); const p=U().show("fb84");
  p.innerHTML=`<h2>♜ Practice board</h2><p class="mute">Move the pieces for both sides. Tap a piece, then a square, or drag it.</p>
   <div class="fb84lay"><div>
    <div class="fb84msg" id="fb84msg" aria-live="polite"></div><div class="fb84note" id="fb84note"></div>
    <div class="bd" id="fb84bd"></div>
    <div class="fb84pr" id="fb84pr" hidden></div>
    <div class="fb84ctl" id="fb84ctl"><button type="button" id="fb84undo" aria-label="Undo"><span>↶</span>Undo</button><button type="button" id="fb84redo" aria-label="Redo"><span>↷</span>Redo</button><button type="button" id="fb84flip" aria-label="Flip board"><span>⇅</span>Flip</button><button type="button" id="fb84reset" aria-label="Reset"><span>⟲</span>Reset</button></div>
    <div class="fb84set" id="fb84set" hidden></div>
   </div><div class="fb84side" id="fb84side">
    <div class="card"><b>Moves</b><div class="fb84ml" id="fb84ml"></div></div>
    <div class="row"><button type="button" class="bt" id="fb84setup">✏️ Set up position</button></div>
    <div class="card"><b>FEN</b><p class="mute">The position as text. Copy it to share, or paste one to load it.</p>
     <input type="text" class="fb84fen" id="fb84fen" readonly aria-label="Current FEN">
     <div class="row"><button type="button" class="bt" id="fb84copy">📋 Copy FEN</button></div>
     <textarea class="fb84fen" id="fb84paste" placeholder="Paste a FEN here" aria-label="Paste a FEN" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea>
     <div class="fb84err" id="fb84ferr"></div>
     <div class="row"><button type="button" class="bt" id="fb84pbtn">📥 Paste</button><button type="button" class="bt go" id="fb84load">Load FEN</button></div></div>
   </div></div>`;
  G={st:load(),sel:null,promo:null,setup:null,prev:null,note:""}; rebuild();
  G.B=U().board($("fb84bd"),tap); G.B.orient=G.st.orient;
  $("fb84undo").onclick=undo; $("fb84redo").onclick=redo; $("fb84flip").onclick=flip; $("fb84reset").onclick=reset;
  $("fb84setup").onclick=startSetup; $("fb84copy").onclick=copyFen; $("fb84load").onclick=loadFen; $("fb84pbtn").onclick=pasteFen;
  $("fb84ml").onclick=e=>{ const b=e.target.closest("[data-i]"); if(b) jump(+b.dataset.i); };
  draw(); }
function live(){ return G&&$("fb84")&&$("fb84").classList.contains("on")&&$("fb84bd"); }
function draw(anim){ if(!live()) return; const g=G.g, hl=[];
  if(G.setup){ G.B.orient=G.st.orient; G.B.draw(setupFen(G.setup.map,G.setup.turn),{hl:[]}); paintSetup(); return; }
  const last=G.st.idx?G.line[G.st.idx-1]:null;
  if(last) hl.push({sq:last.from,c:"#f6f669",o:.55},{sq:last.to,c:"#f6f669",o:.7});
  if(G.promo) hl.push({sq:G.promo.from,c:"#3b6fb6",o:.5},{sq:G.promo.to,c:"#3b6fb6",o:.5});
  if(G.sel) hl.push({sq:G.sel,c:"#3b6fb6",o:.5});
  if(g.inCheck()) g.board().forEach(r=>r.forEach(x=>{ if(x&&x.type==="k"&&x.color===g.turn()) hl.push({sq:x.square,c:"#d23c3c",o:.6}); }));
  const dots=G.sel?[...new Set(g.moves({square:G.sel,verbose:true}).map(m=>m.to))]:[];
  G.B.orient=G.st.orient; G.B.draw(g.fen(),{hl,dots,anim:anim?{from:anim.from,to:anim.to,cap:!!anim.captured}:null});
  const s=status(g), m=$("fb84msg"); m.textContent=s.t; m.className="fb84msg"+(s.end?" end":s.check?" chk":"");
  $("fb84note").textContent=G.note||"";
  const pr=$("fb84pr"); if(G.promo){ const c=g.turn(); pr.hidden=false; pr.innerHTML=`<span>Promote to:</span>${["Q","R","B","N"].map(t=>`<button type="button" class="fb84pc" data-t="${t.toLowerCase()}" aria-label="${PNAME[t]}">${pcSvg(c+t)}</button>`).join("")}<button type="button" class="bt" data-t="">Cancel</button>`;
    pr.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{ const t=b.dataset.t, P=G.promo; G.promo=null; if(t&&P) move(P.from+P.to+t); else draw(); }); }
  else { pr.hidden=true; pr.innerHTML=""; }
  $("fb84ctl").hidden=false; $("fb84set").hidden=true; $("fb84side").hidden=false;
  $("fb84undo").disabled=!(G.st.idx>0||G.prev); $("fb84redo").disabled=G.st.idx>=G.st.moves.length;
  $("fb84reset").disabled=G.st.start===START&&!G.st.moves.length;
  $("fb84fen").value=g.fen(); paintMoves(); }
function paintMoves(){ const ml=$("fb84ml"); if(!ml) return; const {off,no}=numbering(G.st.start), i0=G.st.idx;
  let s=`<button type="button" data-i="0" class="${i0===0?"now":""}">Start</button>`;
  G.line.forEach((m,i)=>{ const k=i+off, n=no+Math.floor(k/2); if(k%2===0) s+=`<span class="n">${n}.</span>`; else if(i===0) s+=`<span class="n">${n}…</span>`;
    s+=`<button type="button" data-i="${i+1}" class="${i0===i+1?"now":""}">${E_(m.san)}</button>`; });
  ml.innerHTML=s; const cur=ml.querySelector(".now"); if(cur){ const top=cur.offsetTop-ml.offsetTop; if(top<ml.scrollTop||top>ml.scrollTop+ml.clientHeight-30) ml.scrollTop=Math.max(0,top-ml.clientHeight/2); } }
function tap(sq){ if(!live()) return; if(G.setup){ setupTap(sq); return; } if(G.promo) return;
  const g=G.g, pc=g.get(sq);
  if(G.sel){ const c=g.moves({square:G.sel,verbose:true}).filter(m=>m.to===sq);
    if(c.length){ G.sel=null; if(c[0].promotion){ G.promo={from:c[0].from,to:c[0].to}; draw(); return; } move(c[0].from+c[0].to); return; } }
  if(pc&&pc.color===g.turn()){ G.sel=sq; draw(); return; }
  if(G.sel){ G.sel=null; draw(); } }
function move(u){ const st=play(G.st,u); if(!st){ draw(); return; } const r=st.last; delete st.last; G.st=st; G.sel=null; G.promo=null; G.prev=null; G.note=""; rebuild(); save(); draw(r); }
function undo(){ if(G.promo){ G.promo=null; } G.sel=null;
  if(G.st.idx>0){ G.st.idx--; G.note=""; rebuild(); save(); draw(); return; }
  if(G.prev){ G.st=G.prev; G.prev=null; G.note="Brought the board back."; rebuild(); save(); draw(); } }
function redo(){ if(G.st.idx>=G.st.moves.length) return; G.promo=null; G.sel=null; G.note=""; const m=G.line[G.st.idx]; G.st.idx++; rebuild(); save(); draw(m); }
function jump(i){ if(G.setup) return; i=Math.max(0,Math.min(G.st.moves.length,i)); G.promo=null; G.sel=null; G.note=""; G.st.idx=i; rebuild(); save(); draw(); }
function flip(){ G.st.orient=G.st.orient==="w"?"b":"w"; save(); draw(); }
/* replacing the whole board (reset, load, setup) can be undone once, so there's no "are you sure?" box over the board */
function replace(st,note){ G.prev=JSON.parse(JSON.stringify(G.st)); G.st=st; G.sel=null; G.promo=null; G.note=note; rebuild(); save(); draw(); }
function reset(){ if(G.st.start===START&&!G.st.moves.length) return; replace(blank(G.st.orient),"Board reset. Tap Undo to bring the old one back."); }
/* ---------- FEN ---------- */
function copyFen(){ const f=G.g.fen(), b=$("fb84copy"); const done=ok=>{ if(!b) return; b.textContent=ok?"✅ Copied":"Select the text above and copy it"; setTimeout(()=>{ if(b.isConnected) b.textContent="📋 Copy FEN"; },1800); };
  const fallback=()=>{ const i=$("fb84fen"); try{ i.focus(); i.select(); i.setSelectionRange(0,f.length); done(document.execCommand("copy")); }catch(e){ done(false); } };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(f).then(()=>done(true),fallback); else fallback(); }catch(e){ fallback(); } }
function pasteFen(){ const t=$("fb84paste"); try{ if(navigator.clipboard&&navigator.clipboard.readText){ navigator.clipboard.readText().then(x=>{ t.value=String(x||"").trim(); if(t.value) loadFen(); else t.focus(); },()=>t.focus()); return; } }catch(e){} t.focus(); }
function loadFen(){ const t=$("fb84paste"), er=$("fb84ferr"), r=parseFen(t.value); if(!r.ok){ er.textContent=r.error; return; } er.textContent=""; t.value="";
  replace({v:1,start:r.fen,moves:[],idx:0,orient:G.st.orient},"Position loaded. Tap Undo to go back to the old board."); showBoard(); }
function showBoard(){ try{ const m=$("fb84msg"); m&&m.scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){} }
/* ---------- set up position ---------- */
function startSetup(){ G.sel=null; G.promo=null; G.note=""; const f=G.g.fen(); G.setup={map:mapOf(f),turn:G.g.turn(),tool:"wP",err:""}; draw(); showBoard(); }
function setupTap(sq){ if(G.B.dragged) return; const S=G.setup; S.err="";
  if(S.tool==="x"||S.map[sq]===S.tool) delete S.map[sq];
  else { if(S.tool[1]==="K") Object.keys(S.map).forEach(k=>{ if(S.map[k]===S.tool) delete S.map[k]; }); S.map[sq]=S.tool; }
  draw(); }
function paintSetup(){ const S=G.setup, box=$("fb84set");
  $("fb84ctl").hidden=true; $("fb84pr").hidden=true; $("fb84side").hidden=true; box.hidden=false;
  $("fb84msg").className="fb84msg"; $("fb84msg").textContent="Set up position"; $("fb84note").textContent="Pick a piece, then tap squares. Tap the same piece again to remove it.";
  const pc=p=>`<button type="button" class="fb84pc${S.tool===p?" sel":""}" data-tool="${p}" aria-label="${p[0]==="w"?"White":"Black"} ${PNAME[p[1]]}">${pcSvg(p)}</button>`;
  box.innerHTML=`<div class="fb84pal">${["K","Q","R","B","N","P"].map(t=>pc("w"+t)).join("")}${["K","Q","R","B","N","P"].map(t=>pc("b"+t)).join("")}</div>
   <div class="row"><button type="button" class="bt${S.tool==="x"?" go":""}" data-tool="x">🧽 Remove pieces</button><button type="button" class="bt" id="fb84turn">${S.turn==="w"?"⚪ White moves next":"⚫ Black moves next"}</button></div>
   <div class="row"><button type="button" class="bt" id="fb84clr">Clear board</button><button type="button" class="bt" id="fb84std">Start position</button></div>
   <div class="fb84err">${E_(S.err)}</div>
   <div class="row"><button type="button" class="bt" id="fb84cancel">Cancel</button><button type="button" class="bt go" id="fb84done">✅ Done</button></div>`;
  box.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{ S.tool=b.dataset.tool; S.err=""; draw(); });
  $("fb84turn").onclick=()=>{ S.turn=S.turn==="w"?"b":"w"; S.err=""; draw(); };
  $("fb84clr").onclick=()=>{ S.map={}; S.err=""; draw(); };
  $("fb84std").onclick=()=>{ S.map=mapOf(START); S.turn="w"; S.err=""; draw(); };
  $("fb84cancel").onclick=()=>{ G.setup=null; draw(); };
  $("fb84done").onclick=()=>{ const f=setupFen(S.map,S.turn), c=checkFen(f); if(!c.ok){ S.err=c.error; draw(); return; }
    G.setup=null; replace({v:1,start:f,moves:[],idx:0,orient:G.st.orient},"New position ready. Tap Undo to go back to the old board."); showBoard(); }; }
document.addEventListener("keydown",e=>{ if(!live()||G.setup||e.altKey||e.ctrlKey||e.metaKey) return; const t=e.target; if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)) return;
  if(e.key==="ArrowLeft"){ e.preventDefault(); undo(); } else if(e.key==="ArrowRight"){ e.preventDefault(); redo(); } });
W.CRFree84=Object.assign(api,{open,_g:()=>G});
})(typeof window!=="undefined"?window:globalThis);
