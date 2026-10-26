/* v52: "Read" — short illustrated reading guides (our own words and drawings; boards use the app's board drawing). */
(function(){
"use strict"; if(window.CRRead) return;
const $=id=>document.getElementById(id), U=()=>window.CR52;
const CSS=`#read52 .paper{background:#fbf5e6;border:1px solid #eadfc4;border-radius:18px;padding:12px;color:#2b2418;box-shadow:0 1px 4px rgba(0,0,0,.06)}
#read52 .gt{font-family:Georgia,'Times New Roman',serif;font-size:24px;margin:2px 0 4px;text-align:center}#read52 .gs{text-align:center;color:#7a6a4a;font-size:14px;margin:0 0 10px}
#read52 .nc{border-radius:14px;padding:10px 12px;margin:10px 0;border:2px solid;background:#fff}
#read52 .nc h4{margin:0 0 4px;font-size:16.5px;display:flex;align-items:center;gap:8px}#read52 .nc h4 .n{width:28px;height:28px;border-radius:14px;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:none}
#read52 .nc p,#read52 .nc li{font-size:14.5px;line-height:1.4;margin:3px 0}#read52 .nc ul{margin:4px 0;padding-left:20px}
#read52 .two{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:start}#read52 .two svg{width:100%;height:auto;border-radius:6px;display:block}
#read52 .pcs{display:grid;grid-template-columns:1fr 1fr;gap:8px}#read52 .pcs>div{background:#fff;border:1px solid #eadfc4;border-radius:12px;padding:6px}#read52 .pcs svg{width:100%;height:auto;border-radius:5px;display:block}#read52 .pcs b{font-size:14px}#read52 .pcs small{display:block;font-size:12.5px;line-height:1.3;color:#5a4d33}
#read52 .tip{background:#fff6d6;border:2px dashed #d4af37;border-radius:14px;padding:10px 12px;margin:12px 0;font-size:14.5px}
#read52 table{width:100%;border-collapse:collapse;font-size:12.5px;background:#fff;border-radius:10px;overflow:hidden}#read52 th,#read52 td{border:1px solid #eadfc4;padding:5px 4px;text-align:left}#read52 th{background:#1b1712;color:#d4af37}
#read52 .kv{font-size:13.5px;margin:2px 0}#read52 .kv b{color:#5a4d33}
#read52 .lnk{display:inline-block;margin-top:6px;font-weight:700;color:#2f7d32;cursor:pointer;background:none;border:none;font:inherit;padding:0;text-decoration:underline}`;
const COL=["#3b6fb6","#2f7d32","#e07b00","#8a4fd1","#d23c3c","#0f8a8a","#b8860b"];
const stars=n=>`<span class="stars">${"★".repeat(n)}${"☆".repeat(5-n)}</span>`;
function fenOf(sans){ const C=U().CH(), g=new C(); sans.split(" ").forEach(s=>g.move(s)); return g.fen(); }
const B=(fen,orient,o)=>U().mini(fen,orient||"w",Object.assign({nocoord:true},o||{}));
const card=(i,icon,title,body)=>`<div class="nc" style="border-color:${COL[i%COL.length]}"><h4><span class="n" style="background:${COL[i%COL.length]}">${i+1}</span>${icon} ${title}</h4>${body}</div>`;
const link=(t,f)=>`<button class="lnk" data-go="${f}">${t} ›</button>`;
const E="8/8/8/8/8/8/8/8 w - - 0 1";
const dots=(fen,sq)=>{ const C=U().CH(), g=new C(fen); return g.moves({square:sq,verbose:true}).map(m=>m.to); };
function pieceBox(name,fen,sq,txt){ return `<div><b>${name}</b>${B(fen,"w",{dots:dots(fen,sq),hl:[{sq,c:"#f5c518",o:.5}]})}<small>${txt}</small></div>`; }

/* ---------- guides ---------- */
const GUIDES=[
{id:"how",icon:"♟",title:"How to play chess",sub:"The whole game on one page",html:()=>{
 const start="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
 return card(0,"🎯","The goal",`<p>Trap the other king so it can't escape. That's <b>checkmate</b>, and it wins the game. You never actually take the king.</p>`)+
 card(1,"🏁","The board and set-up",`<div class="two">${B(start)}<div><p>8 by 8 squares. A <b>light square</b> goes in each player's bottom-right corner.</p><p>Back row: rook, knight, bishop, queen, king, bishop, knight, rook. The queen starts on her own colour. Pawns fill the row in front.</p><p><b>White moves first.</b></p></div></div>`)+
 card(2,"🧭","How each piece moves",`<p>The dots show where each piece can go.</p><div class="pcs">
  ${pieceBox("King","7k/8/8/8/3K4/8/8/8 w - - 0 1","d4","One square in any direction.")}
  ${pieceBox("Queen","7k/8/8/8/3Q4/8/8/K7 w - - 0 1","d4","Any distance: straight or diagonal.")}
  ${pieceBox("Rook","7k/8/8/8/3R4/8/8/K7 w - - 0 1","d4","Any distance, straight lines only.")}
  ${pieceBox("Bishop","7k/8/8/8/3B4/8/8/K7 w - - 0 1","d4","Any distance, diagonals only.")}
  ${pieceBox("Knight","7k/8/8/8/3N4/8/8/K7 w - - 0 1","d4","An L-shape: two one way, one to the side. It can jump over pieces.")}
  ${pieceBox("Pawn","7k/8/8/8/8/8/3P4/K7 w - - 0 1","d2","Forward one square (two on its first move). It takes one square diagonally forward.")}</div>`)+
 card(3,"📜","Special rules",`<div class="two">${B("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1","w",{arrows:[{u:"e1g1",c:"green"},{u:"h1f1",c:"blue"}]})}<div><p><b>Castling:</b> the king moves two squares toward a rook, and the rook jumps over to the king's other side. Only if neither has moved, nothing is in between, and the king isn't in check or passing through an attack.</p></div></div>
  <div class="two">${B("k7/4P3/8/8/8/8/8/K7 w - - 0 1","w",{arrows:[{u:"e7e8",c:"green"}]})}<div><p><b>Promotion:</b> a pawn that reaches the far row turns into a queen, rook, bishop or knight. Almost always pick the queen.</p><p><b>En passant:</b> a rare pawn capture. ${link("Learn it in Learn the basics","basics")}</p></div></div>`)+
 card(4,"⚔️","Check vs checkmate",`<div class="two">${B("6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1","w",{arrows:[{u:"e1e8",c:"red"}]})}<div><p><b>Check:</b> the king is attacked. You must fix it right away: move the king, block, or take the attacker.</p><p><b>Checkmate:</b> check with no way out. Here the rook goes to the back row and the king's own pawns trap him.</p></div></div>`)+
 card(5,"🌟","Beginner tips",`<ul><li>Fight for the middle with pawns and pieces.</li><li>Bring out knights and bishops early.</li><li>Castle soon to keep your king safe.</li><li>Before each move, ask: what is my opponent threatening?</li><li>Don't leave pieces where they can be taken for free.</li></ul>`)+
 `<div class="tip">⭐ <b>Golden tip:</b> after every move your opponent makes, ask “why did they play that?” This one habit saves more games than anything else.</div><p>${link("Try it yourself in Learn the basics","basics")}</p>`; }},
{id:"white",icon:"♔",title:"5 popular openings for White",sub:"Ideas, plans and how hard they are",html:()=>openingsGuide("w",[
 ["Italian Game","e4 e5 Nf3 Nc6 Bc4","Bishop aims at the weak pawn next to Black's king.",["Quick development","Castle early","Push the d-pawn later to take the middle"],2,"Beginners","Watch out for the knight jump Ng5 ideas, for both sides.","fried-liver"],
 ["Ruy Lopez","e4 e5 Nf3 Nc6 Bb5","Bishop puts pressure on the knight that guards Black's middle pawn.",["Slow squeeze","Castle, then build with c3 and d4","Long-term pressure"],4,"Patient players","It's a slow plan: the pressure builds over many moves.",""],
 ["Queen's Gambit","d4 d5 c4","White offers a side pawn to pull Black's middle pawn away.",["Win the middle","If Black takes, get the pawn back","Pressure on the queen's side"],3,"Players who like control","It's not a real gift: Black usually can't keep that pawn.",""],
 ["King's Indian Attack","Nf3 d5 g3 Nf6 Bg2 e6 O-O","The same safe set-up almost every game, then attack the king.",["Knight, small pawn, bishop, castle","Push the e-pawn","Attack on the king's side"],2,"People who don't want to learn lots of lines","Simple to learn, but you must still watch Black's threats.",""],
 ["London System","d4 d5 Bf4 Nf6 e3 e6 Nf3","Bishop out first, then a strong pawn triangle.",["Same set-up every time","Castle short","Knight to the e5 square later"],1,"Beginners","Get the bishop out before the small pawn move.","london"]])},
{id:"black",icon:"♚",title:"5 popular openings for Black",sub:"Fight back from the very first move",html:()=>openingsGuide("b",[
 ["Sicilian Defence","e4 c5","Fight for the middle from the side, making the game unbalanced.",["Swap a side pawn for White's middle pawn","Attack on the queen's side","Counter-punch"],4,"Fighters who want to win","Very sharp: White often attacks your king fast.",""],
 ["French Defence","e4 e6 d4 d5","Build a solid pawn wall, then hit White's centre.",["Solid pawn chain","Push the c-pawn to attack the centre","Calm, strategic games"],3,"Solid players","Your light-squared bishop can get stuck behind the pawns.",""],
 ["Caro-Kann Defence","e4 c6 d4 d5","Like the French, but the light-squared bishop gets out first.",["Very solid structure","Bishop out before the small pawn move","Good endgames"],2,"Careful players","It can be a bit passive, so look for chances to strike.",""],
 ["King's Indian Defence","d4 Nf6 c4 g6 Nc3 Bg7 e4 d6","Let White take the middle, then attack it and White's king.",["Bishop on the long diagonal","Castle fast","Pawn storm on the king's side"],4,"Attacking players","White gets lots of space early, so stay patient.","kid-trap"],
 ["Queen's Gambit Declined","d4 d5 c4 e6","Say no to the pawn offer and keep a strong middle pawn.",["Keep the middle solid","Develop and castle","Free your game later with c5 or e5"],2,"Beginners and solid players","Your light-squared bishop needs a plan to get out.",""]])},
{id:"why",icon:"🧠",title:"Why chess is good for you",sub:"For kids and grown-ups",html:()=>{
 const L=[["🎯","Focus","A game asks you to pay attention for a long time. That gets easier with practice."],
  ["🧩","Problem solving","Every move is a little puzzle: look, think of a few ideas, pick the best one."],
  ["🔮","Planning ahead","You learn to think “if I do this, then they do that”. That helps outside the board too."],
  ["🧠","Memory","Remembering patterns and openings exercises your memory."],
  ["😌","Patience and calm","Rushing loses games. Chess teaches you to slow down before you decide."],
  ["🤝","Good sportsmanship","Shake hands, win kindly, lose well, and learn from every game."],
  ["💪","Confidence","Getting better step by step shows you that practice really works."]];
 return `<div class="two" style="grid-template-columns:110px 1fr">${B("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1","w",{arrows:[{u:"e2e4",c:"green"}]})}<p>Chess is a game for every age. You can start at 5 or at 75. Here is what it trains, in plain words.</p></div>`+
  L.map((x,i)=>card(i,x[0],x[1],`<p>${x[2]}</p>`)).join("")+
  `<div class="nc" style="border-color:#b8860b"><h4>👨‍👩‍👧 For kids</h4><ul><li>Short games of 10 to 15 minutes are perfect.</li><li>Praise good thinking, not just winning.</li><li>Play together: kids love beating a grown-up!</li></ul></div>
  <div class="tip">⭐ <b>Golden tip:</b> a little every day beats a lot once a week. Ten minutes of puzzles a day adds up fast.</div>`; }}];
function openingsGuide(side,L){ const tbl=`<table><tr><th>Opening</th><th>Difficulty</th><th>Best for</th></tr>${L.map(x=>`<tr><td>${x[0]}</td><td>${stars(x[4])}</td><td>${x[5]}</td></tr>`).join("")}</table>`;
  return L.map((x,i)=>{ const fen=fenOf(x[1]), sans=x[1].split(" "), C=U().CH(), g=new C(); let last; sans.forEach(s=>last=g.move(s));
    return card(i,side==="w"?"♔":"♚",x[0],`<div class="two">${B(fen,side,{arrows:[{u:last.from+last.to,c:"green"}]})}<div><p class="kv"><b>Idea:</b> ${x[2]}</p><p class="kv"><b>Difficulty:</b> ${stars(x[4])}</p><p class="kv"><b>Best for:</b> ${x[5]}</p></div></div>
     <p class="kv"><b>Main plans:</b></p><ul>${x[3].map(t=>`<li>${t}</li>`).join("")}</ul><p class="kv">🔑 <b>Key point:</b> ${x[6]}</p>${x[7]?link("Step through a line and drill it","open:"+x[7]):""}`); }).join("")+
   `<h3>📊 Quick comparison</h3>${tbl}<div class="tip">⭐ <b>Golden tip:</b> pick ONE opening and play it for a month. Knowing one well beats knowing five a little.</div><p>${link("Learn openings step by step","open")}</p>`; }
function list(){ const p=U().show("read52"); ensureCss();
  p.innerHTML=`<h2>📖 Read</h2><p class="mute">Short illustrated guides. Scroll and read at your own pace.</p>`+
   GUIDES.map(g=>`<button class="lt" data-g="${g.id}"><span class="i">${g.icon}</span><span><b>${g.title}</b><small>${g.sub}</small></span></button>`).join("");
  p.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>guide(b.dataset.g)); }
function guide(id){ const p=U().show("read52"); ensureCss(); const g=GUIDES.find(x=>x.id===id);
  p.innerHTML=`<div class="paper"><h2 class="gt">${g.icon} ${g.title}</h2><p class="gs">${g.sub}</p>${g.html()}</div><div class="row"><button class="bt" id="r52b">‹ All guides</button></div>`;
  $("r52b").onclick=list;
  p.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{ const t=b.dataset.go; if(t==="basics"){ U().closeAll(); window.CRLearn&&CRLearn.open(); } else if(t==="open") CROpenings.open(); else CROpenings._view(t.slice(5)); }); }
let css=false; function ensureCss(){ if(css) return; css=true; const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
window.CRRead={open:list,_guide:guide,_guides:GUIDES};
})();
