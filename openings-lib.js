/* Openings library: searchable list of well-known openings, a step-through board, and a link to the existing drill. */
(function(){ "use strict"; if(window.CROpenLib) return;
const $=id=>document.getElementById(id);
const E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const DATA_SRC="data-openings.js?v=3aee1d";
const U=()=>window.CR52;
const CH=()=> (U()&&U().CH&&U().CH()) || (window.ChessLib&&window.ChessLib.Chess) || window.Chess;

const CSS=`#olib{max-width:560px;margin-left:auto;margin-right:auto;padding-bottom:88px}
#olib .olFind{width:100%;box-sizing:border-box;font:inherit;font-size:16px;min-height:48px;border-radius:12px;border:1px solid var(--line,#ccd);padding:10px 12px;margin:6px 0 10px;background:#fff;color:var(--ink,#222)}
#olib .olSec{margin:16px 0 8px;font-size:16px}
#olib .olBlurb{margin:0 0 8px;color:var(--mute,#666);font-size:13.5px}
#olib .olYou{display:inline-block;margin-left:6px;font-size:11.5px;font-weight:800;background:#eef4ff;color:#1b2b44;border-radius:8px;padding:2px 7px;vertical-align:middle}
#olib .olLv{display:inline-block;font-size:11.5px;font-weight:800;border-radius:8px;padding:2px 7px;margin-left:6px;vertical-align:middle}
#olib .olLv.beg{background:#e8f5e9;color:#1b5e20}
#olib .olLv.int{background:#fff3cd;color:#6b4e00}
#olib .olItem{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;min-height:62px;border:1px solid var(--line,#e4dfd5);border-radius:14px;background:#fff;color:var(--ink,#222);font:inherit;padding:10px 12px;margin:0 0 8px;cursor:pointer}
#olib .olItem b{display:block;font-size:16px}
#olib .olItem small{display:block;color:var(--mute,#666);font-size:12.5px;line-height:1.3;margin-top:2px}
#olib .olEco{flex:none;font-size:12px;font-weight:800;color:#3b6fb6;min-width:2.6em;padding-top:2px}
#olib .olBdWrap{width:100%;max-width:440px;margin:8px auto;aspect-ratio:1/1}
#olib .olBdWrap .bd, #olib #olBd{width:100%;height:100%;max-width:none;margin:0}
#olib .olBdWrap svg{width:100%;height:auto;display:block;border-radius:6px}
#olib .olRow{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;align-items:center}
#olib .olRow .bt{flex:1;min-width:30%;min-height:48px;text-align:center}
#olib .olCount{font-size:13.5px;color:var(--mute,#666);min-width:4.5em;text-align:center}
#olib .olCard{border:1px solid var(--line,#e4dfd5);border-radius:14px;background:#fff;padding:10px 12px;margin:10px 0}
#olib .olCard h3{margin:0 0 6px;font-size:16px}
#olib .olCard p,#olib .olCard li{line-height:1.45;margin:4px 0}
#olib .olCard ul{margin:4px 0 0;padding-left:1.15em}
#olib .olHint{min-height:44px;margin:6px 0}
#olib .olEmpty{color:var(--mute,#666);padding:12px 4px}
html.dark-mode #olib .olFind,html.dark-mode #olib .olItem,html.dark-mode #olib .olCard{background:#262626;color:#eee;border-color:#3a3a3a}
html.dark-mode #olib .olYou{background:#1d2633;color:#cde}
html.dark-mode #olib .olLv.beg{background:#1e3320;color:#a8d5a8}
html.dark-mode #olib .olLv.int{background:#3a3420;color:#f0d48a}`;

let styled=false, data=null, lastQ="", lastId=null, loading=null;
function css(){ if(styled) return; const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); styled=true; }

function load(){
  if(data) return Promise.resolve(data);
  if(window.CROpenLibData){ data=window.CROpenLibData; return Promise.resolve(data); }
  if(loading) return loading;
  loading=new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=DATA_SRC; s.async=true;
    s.onload=()=>{ data=window.CROpenLibData||{groups:[],openings:[]}; resolve(data); };
    s.onerror=()=>reject(new Error("Couldn't load the openings list."));
    document.head.appendChild(s);
  }).finally(()=>{ loading=null; });
  return loading;
}

function norm(s){ return String(s||"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9+']+/g," ").replace(/\b(the|defense|defence|game|opening|attack|system|gambit|declined|accepted)\b/g," ").replace(/\s+/g," ").trim(); }
function toks(s){ return norm(s).split(" ").filter(Boolean); }

/* You play this: name match or move-prefix match, from saved games and the My Openings cache. */
function playedMap(){
  const hits={}; // id -> {w,b,n}
  const mark=(id,side)=>{ if(!id) return; const o=hits[id]||(hits[id]={w:0,b:0,n:0}); o.n++; if(side==="w") o.w++; else if(side==="b") o.b++; };
  const openings=(data&&data.openings)||[];
  function byName(name,side){
    const n=norm(name); if(!n||n.length<3) return;
    let best=null, bestScore=0;
    openings.forEach(o=>{
      const labels=[o.name].concat(o.aka||[]);
      let sc=0;
      labels.forEach(lab=>{
        const L=norm(lab);
        if(!L) return;
        if(n===L||n.includes(L)||L.includes(n)) sc=Math.max(sc, L.length);
        else {
          const a=new Set(toks(L)), b=toks(n).filter(t=>a.has(t)&&t.length>2);
          if(b.length>=2) sc=Math.max(sc, b.join(" ").length);
        }
      });
      if(sc>bestScore){ bestScore=sc; best=o; }
    });
    if(best&&bestScore>=4) mark(best.id,side);
  }
  function byMoves(sans,side){
    if(!sans||sans.length<2) return;
    const key=sans.map(s=>String(s).replace(/[+#]+$/,"").replace(/0-0-0/,"O-O-O").replace(/0-0/,"O-O"));
    openings.forEach(o=>{
      const m=o.moves||[]; if(m.length<2) return;
      let i=0; while(i<m.length&&i<key.length&&m[i]===key[i]) i++;
      const need=Math.min(m.length, 4);
      if(i>=need) mark(o.id,side);
    });
  }
  function fromGame(d,user){
    if(!d||!d.meta) return;
    const side=user||d.meta.user_color||"";
    if(d.meta.opening) byName(String(d.meta.opening).split(/[:,]/)[0], side);
    const sans=(d.plies||[]).map(p=>p.san).filter(Boolean);
    if(sans.length) byMoves(sans, side);
  }
  try{ (window.ReviewApp&&ReviewApp.loadGames()||[]).forEach(g=>fromGame(g.data, g.user|| (g.data&&g.data.meta&&g.data.meta.user_color))); }catch(e){}
  try{
    const LS=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
    const cur=LS("chessReview.coach.game.v1",null); if(cur&&cur.data) fromGame(cur.data);
    (LS("chessReview.coach.games.v1",[])||[]).forEach(x=>x&&x.data&&fromGame(x.data));
    const v46=LS("chessReview.v46.openCache2",null);
    if(v46&&Array.isArray(v46.games)) v46.games.forEach(g=>{ if(g.name) byName(g.name,g.me); if(g.mv) byMoves(g.mv,g.me); });
  }catch(e){}
  return hits;
}
function youLabel(hit){
  if(!hit||!hit.n) return "";
  if(hit.w&&!hit.b) return "You play this as White";
  if(hit.b&&!hit.w) return "You play this as Black";
  return "You play this";
}

function page(){ css(); return U().show("olib"); }

function list(q){
  const p=page(); lastQ=q||""; lastId=null;
  p.innerHTML=`<button type="button" class="btn bk70" id="olBack" aria-label="Go back">‹ Back</button>
    <h2>📚 Openings library</h2>
    <p class="mute">The main openings, grouped by the first moves, and how to play them. Tap one to step through the line.</p>
    <input class="olFind" id="olFind" type="search" placeholder="Search, e.g. Sicilian or London" value="${E_(lastQ)}" aria-label="Search openings">
    <div id="olList"><p class="olEmpty">Loading the openings…</p></div>`;
  $("olBack").onclick=()=>{ try{ window.CRHome.goHome(); }catch(e){} };
  const find=$("olFind"); find.oninput=()=>{ lastQ=find.value; paintList(); };
  load().then(()=>{ paintList(); try{ find.focus(); }catch(e){} }).catch(err=>{
    $("olList").innerHTML=`<div class="olCard"><p>${E_(err.message||"Couldn't load the openings list.")} ${navigator.onLine===false?"You're offline — open this once while online, and it will be kept on the phone.":"Please try again."}</p></div>`;
  });
}
function paintList(){
  const box=$("olList"); if(!box||!data) return;
  const q=norm($("olFind")?$("olFind").value:lastQ);
  const you=playedMap();
  const groups=data.groups||[];
  let html="", shown=0;
  groups.forEach(g=>{
    const items=(data.openings||[]).filter(o=>o.group===g.id && (!q || [o.name,o.eco,o.level,(o.aka||[]).join(" "),(o.moves||[]).join(" ")].join(" ").toLowerCase().includes(q) || norm(o.name+" "+(o.aka||[]).join(" ")).includes(q)));
    if(!items.length) return;
    html+=`<h3 class="olSec">${E_(g.title)}</h3>${g.blurb?`<p class="olBlurb">${E_(g.blurb)}</p>`:""}`;
    items.forEach(o=>{
      shown++;
      const hit=you[o.id], lab=youLabel(hit);
      const lv=o.level==="Intermediate"?"int":"beg";
      html+=`<button type="button" class="olItem" data-ol="${E_(o.id)}"><span class="olEco">${E_(o.eco)}</span><span><b>${E_(o.name)}</b><small>${E_(o.level)} · ${Math.ceil((o.moves||[]).length/2)} moves</small></span></button>`.replace("</small>", (lab?`</small><span class="olYou">${E_(lab)}</span>`:"</small>"));
    });
  });
  box.innerHTML=html||`<p class="olEmpty">Nothing found for “${E_(($("olFind")&&$("olFind").value)||"")}”. Try another name, like Sicilian or London.</p>`;
  box.querySelectorAll("[data-ol]").forEach(b=>b.onclick=()=>showOne(b.dataset.ol));
}

function build(moves){
  const C=CH(), g=new C(), pos=[g.fen()], mv=[];
  for(const san of moves){ const m=g.move(san); if(!m) throw new Error("This line couldn't be played: "+san); mv.push(m); pos.push(g.fen()); }
  return {pos,mv};
}
function moveLabel(m,i){ const n=Math.ceil((i+1)/2); return (m.color==="w"?`${n}. `:`${n}… `)+m.san; }

function showOne(id){
  const o=(data.openings||[]).find(x=>x.id===id); if(!o) return list(lastQ);
  lastId=id;
  const p=page();
  let b; try{ b=build(o.moves); }catch(e){ p.innerHTML=`<button type="button" class="btn bk70" id="olBack">‹ Back</button><h2>${E_(o.name)}</h2><div class="olCard"><p>${E_(e.message)}</p></div>`; $("olBack").onclick=()=>list(lastQ); return; }
  const N=o.moves.length;
  const hit=playedMap()[o.id], lab=youLabel(hit);
  const prefer=hit&&hit.b&&!hit.w?"b":"w";
  const lv=o.level==="Intermediate"?"int":"beg";
  p.innerHTML=`<button type="button" class="btn bk70" id="olBack" aria-label="Go back">‹ Back</button>
    <h2>${E_(o.name)}</h2>
    <p class="mute">${E_(o.eco)} · <span class="olLv ${lv}">${E_(o.level)}</span>${lab?` <span class="olYou">${E_(lab)}</span>`:""}</p>
    <div class="olBdWrap"><div class="bd" id="olBd"></div></div>
    <p class="olHint mute" id="olHint"></p>
    <div class="olRow">
      <button type="button" class="bt" id="olPrev">‹ Prev</button>
      <span class="olCount" id="olCount"></span>
      <button type="button" class="bt go" id="olNext">Next ›</button>
    </div>
    <div class="olRow">
      <button type="button" class="bt" id="olFlip">Flip board</button>
    </div>
    <div class="olCard"><h3>Ideas for White</h3><ul>${(o.white||[]).map(x=>`<li>${E_(x)}</li>`).join("")}</ul></div>
    <div class="olCard"><h3>Ideas for Black</h3><ul>${(o.black||[]).map(x=>`<li>${E_(x)}</li>`).join("")}</ul></div>
    <div class="olCard"><h3>Common traps and mistakes</h3><ul>${(o.traps||[]).map(x=>`<li>${E_(x)}</li>`).join("")}</ul></div>
    <div class="olRow" style="flex-direction:column">
      <button type="button" class="bt go" id="olPrW">Practise it as White</button>
      <button type="button" class="bt go" id="olPrB">Practise it as Black</button>
    </div>`;
  $("olBack").onclick=()=>list(lastQ);
  const B=U().board($("olBd")); B.orient=prefer;
  let k=0;
  const go=i=>{
    k=Math.max(0,Math.min(N,i));
    const m=b.mv[k-1];
    B.draw(b.pos[k], m?{arrows:[{u:m.from+m.to,c:m.color==="w"?"green":"blue"}],hl:[{sq:m.from,c:"#f5c518",o:.3},{sq:m.to,c:"#f5c518",o:.45}]}:{});
    $("olHint").innerHTML=m?`<b>${E_(moveLabel(m,k-1))}</b> — ${m.color==="w"?"White":"Black"} just played.`:"<b>Start position.</b> Tap Next to see the first move.";
    $("olCount").textContent=`${k} / ${N}`;
    $("olPrev").disabled=k===0;
    const nx=$("olNext"); nx.disabled=k===N; nx.textContent=k===N?"Done ✓":"Next ›";
  };
  $("olPrev").onclick=()=>go(k-1);
  $("olNext").onclick=()=>go(k+1);
  $("olFlip").onclick=()=>{ B.orient=B.orient==="w"?"b":"w"; go(k); };
  const practise=side=>{
    const line={id:"olib-"+o.id+"-"+side, name:o.name, side, seed:true,
      moves:o.moves.map((san,i)=>[san, b.mv[i]?((b.mv[i].color==="w"?"White":"Black")+" plays "+b.mv[i].san):san]),
      onBack:()=>showOne(o.id)};
    if(window.CROpenings&&CROpenings.practise) CROpenings.practise(line);
    else if(window.CROpenings&&CROpenings._drill) CROpenings._drill(line);
  };
  $("olPrW").onclick=()=>practise("w");
  $("olPrB").onclick=()=>practise("b");
  if(prefer==="b"){ const w=$("olPrW"), bl=$("olPrB"); if(w&&bl) bl.parentNode.insertBefore(bl,w); }
  go(0);
}

function open(q){ try{ window.CRHome&&CRHome.setMode("app",true); }catch(e){} list(q||""); }

window.CROpenLib={open, _load:load, _data:()=>data, _played:playedMap, _show:showOne};
})();
