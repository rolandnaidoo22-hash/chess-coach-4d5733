/* v62: tap an opening name -> in-app explanation sheet (no external links). Our own words. */
(function(){ "use strict"; if(window.CROpen62) return;
const E_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const IDEAS=[
 [/italian|giuoco|two knights|fried liver|evans/i,["White's bishop on c4 aims at f7, the weakest square near Black's king.","Both sides get knights and bishops out fast and castle early.","Watch for quick tricks on f7 (White) and on f2 (Black)."]],
 [/ruy lopez|spanish/i,["White's bishop on b5 puts pressure on the knight that guards e5.","It is a slow squeeze: build up, castle, then push in the centre.","Black often chases the bishop with a6 and b5 to gain space."]],
 [/scotch/i,["White opens the centre early with d4.","Pieces come out quickly and the game becomes open.","Black should hit back at the centre and get the king safe."]],
 [/sicilian/i,["Black answers e4 with the c-pawn to fight for d4 from the side.","The game becomes unbalanced: both sides attack on different wings.","White usually gets fast development; Black gets counterplay down the c-file."]],
 [/french/i,["Black builds a solid pawn chain with e6 and d5.","Black's light-squared bishop can get stuck behind the pawns; free it or swap it.","Black fights back by hitting White's centre with c5 and f6."]],
 [/caro/i,["Black plays c6 and d5 for a very solid centre.","Unlike the French, Black's light-squared bishop gets out before e6.","Quiet but sturdy: good for players who like safe positions."]],
 [/queen'?s gambit|slav/i,["White offers the c-pawn to pull Black's d-pawn away from the centre.","Taking the pawn is fine, but trying to keep it usually goes wrong.","The fight is over the centre squares d5 and e4."]],
 [/london/i,["White sets up the same calm system almost every game: d4, Bf4, e3, Nf3, c3.","Safe and easy to learn; the plan is to castle and then push in the centre or on the king's side.","Black can try an early c5 or Qb6 to test b2."]],
 [/king'?s indian|grünfeld|grunfeld|pirc|modern/i,["Black lets White take the centre at first, then attacks it later.","The bishop on g7 is Black's key piece: keep it alive.","Black often pushes e5 or c5 to strike at White's centre."]],
 [/king'?s gambit/i,["White gives up the f-pawn to open lines toward Black's king.","Very sharp: development and fast attack matter more than the extra pawn.","Black should not be greedy; give the pawn back if needed to finish developing."]],
 [/scandinavian|center game|centre game/i,["The queen comes out early to take a pawn.","The other side gains time by chasing the queen with its pieces.","If you play it, find a safe square for the queen quickly."]],
 [/english|réti|reti/i,["White controls the centre from the side with c4 or Nf3.","It is flexible: White waits to see Black's setup before choosing a plan.","Games are usually slow and positional."]],
 [/dutch/i,["Black plays f5 to fight for e4 and aim for a king's side attack.","It weakens Black's king a little, so watch for checks on the h5-e8 line.","Black usually castles short and brings the queen to e8 or h5."]],
 [/philidor|petrov|petroff/i,["Black defends e5 solidly and keeps things simple.","It is hard to break down but can be a bit passive.","Black aims to finish developing and then free the position with d5 or f5."]],
 [/scholar|wayward queen|parham/i,["White brings the queen out early hoping for a quick mate on f7.","It only works if Black doesn't defend; good players block with g6 or Qe7 and then chase the queen.","Bringing the queen out early often loses time."]],
];
const GEN=["Control the centre with pawns and pieces.","Get your knights and bishops out before moving the same piece twice.","Castle early to keep your king safe, then connect your rooks."];
let M=null; function data(){ if(M) return M; M=[]; String(window.CROPENDATA||"").split("\n").forEach(l=>{ const [e,n,mv]=l.split("\t"); if(mv) M.push({e,n,mv}); }); return M; }
const base=s=>String(s||"").replace(/\s*\([A-E]\d\d\)\s*$/,"").trim();
function info(name){ const nm=base(name), d=data(), fam=nm.split(":")[0].trim();
  let r=d.find(x=>x.n===nm)||d.filter(x=>x.n.split(":")[0].trim()===fam).sort((a,b)=>a.mv.length-b.mv.length)[0]||null;
  const ideas=(IDEAS.find(([re])=>re.test(nm))||[0,GEN])[1];
  const L=(window.CROpeningsData||[]).find(x=>{ const t=(x.tags+" "+x.name).toLowerCase(); return fam.toLowerCase().split(/[\s']+/).filter(w=>w.length>3&&!/opening|game|defense|defence|attack|variation/.test(w)).some(w=>t.includes(w)); });
  return {name:nm||"Opening",eco:r?r.e:"",moves:r?r.mv:"",ideas,learn:L||null,generic:ideas===GEN}; }
const num=mv=>mv.split(" ").map((m,i)=>(i%2?"":(i/2+1)+".")+m).join(" ");
function css(){ if(document.getElementById("op62css")) return; const s=document.createElement("style"); s.id="op62css"; s.textContent=`
#op62{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
#op62 .s{background:var(--card,#fff);color:inherit;width:100%;max-width:520px;max-height:85vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px 16px 22px;box-shadow:0 -6px 24px rgba(0,0,0,.2)}
#op62 h3{margin:0 34px 4px 0;font-size:19px;line-height:1.25}#op62 .eco{font-size:12.5px;color:var(--mute,#666)}#op62 .mv{font:600 14px/1.5 ui-monospace,Menlo,monospace;background:rgba(59,111,182,.08);border-radius:10px;padding:8px 10px;margin:10px 0;overflow-wrap:anywhere}
#op62 ul{padding-left:20px;margin:6px 0}#op62 li{margin:5px 0;font-size:15px}#op62 .x{position:absolute;right:14px;top:12px;min-width:44px;min-height:44px;border:0;background:none;font-size:22px}#op62 .s{position:relative}
#op62 .b{display:block;width:100%;min-height:46px;margin-top:10px;border-radius:12px;border:0;background:var(--accent,#3b6fb6);color:#fff;font-weight:700;font-size:15px}
html.dark-mode #op62 .s{background:#222;color:#eee}
.op62t{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;background:none;border:0;padding:0;font:inherit;color:inherit}`; document.head.appendChild(s); }
function show(name){ css(); const o=info(name); let d=document.getElementById("op62"); if(d) d.remove(); d=document.createElement("div"); d.id="op62"; d.setAttribute("role","dialog"); d.setAttribute("aria-label",o.name);
  d.innerHTML=`<div class="s"><button class="x" aria-label="Close">✕</button><h3>📖 ${E_(o.name)}</h3>${o.eco?`<div class="eco">Code ${E_(o.eco)}</div>`:""}
   ${o.moves?`<div class="mv">${E_(num(o.moves))}</div>`:""}<b>${o.generic?"Good habits in any opening":"Key ideas"}</b><ul>${o.ideas.map(x=>`<li>${E_(x)}</li>`).join("")}</ul>
   ${o.learn?`<button class="b" data-l="${E_(o.learn.id)}">♞ Learn it step by step: ${E_(o.learn.name)}</button>`:`<button class="b" data-l="">♞ Learn openings</button>`}</div>`;
  document.body.appendChild(d); const close=()=>d.remove();
  d.onclick=e=>{ if(e.target===d||e.target.closest(".x")) close(); const b=e.target.closest("[data-l]"); if(b){ close(); try{ window.CRHome&&CRHome.setMode("app",true); }catch(_){}
    if(window.CROpenings){ b.dataset.l?CROpenings._view(b.dataset.l):CROpenings.open(); } } };
  d.querySelector(".x").focus(); }
/* any opening name marked data-op62, and any stray external-repo link, opens the sheet instead */
document.addEventListener("click",e=>{ const t=e.target.closest("[data-op62]"); if(t){ e.preventDefault(); show(t.dataset.op62||t.textContent); return; }
  const a=e.target.closest("a[href]"); if(a&&/github\.com|githubusercontent|gitlab\.com|bitbucket\.org/i.test(a.href)){ e.preventDefault(); e.stopPropagation(); show((a.closest("[data-opname]")||{}).dataset?.opname||a.textContent); } },true);
window.CROpen62={show,info,tag:(name,txt)=>`<button type="button" class="op62t" data-op62="${E_(name)}">${E_(txt||name)}</button>`};
})();
