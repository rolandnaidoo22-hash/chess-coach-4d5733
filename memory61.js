/* v61: coach memory (past chats and reviews, kept on this device) and the thinking loader. */
(function(){ "use strict"; if(window.CRMem) return;
const K="chessReview.v61.memory", MAX=80, E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
function all(){ try{ const v=JSON.parse(localStorage.getItem(K)||"[]"); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
function put(L){ for(let n=L.length;n>=0;n-=5){ try{ localStorage.setItem(K,JSON.stringify(L.slice(0,n))); return true; }catch(e){} } return false; }
const plain=t=>String(t||"").replace(/[*_#`>]/g,"").replace(/\[(.*?)\]\(.*?\)/g,"$1");
/* the key advice: the first line under a plan/try/practise heading, else the last sentence that tells them to do something */
function advice(t){ const L=String(t||"").split(/\n+/).map(x=>x.trim()).filter(Boolean); let i=L.findIndex(x=>/^#+.*(plan|work on|practi|try|next|habit|fix)/i.test(x));
  let a=""; if(i>=0){ const n=L.slice(i+1).find(x=>!/^#/.test(x)); if(n) a=n; }
  if(!a){ const s=plain(t).split(/(?<=[.!?])\s+/).filter(x=>/\b(try|practi[cs]e|before (every|each|you)|work on|focus on|next game|habit|always|make sure|check)\b/i.test(x)); a=s[s.length-1]||""; }
  a=plain(a).replace(/^[-•\d.)\s]+/,"").trim(); const c=a.match(/^[^:]{0,60}:\s+(.+)$/s); if(c) a=c[1].trim(); return a.replace(/\s+/g," ").slice(0,180); }
function add(e){ const L=all(); const r={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),kind:e.kind||"chat",q:String(e.q||"").slice(0,500),a:String(e.a||"").slice(0,2500),gids:(e.gids||[]).slice(0,5).map(String),game:e.game?String(e.game).slice(0,80):"",advice:(e.advice||advice(e.a)).slice(0,180)};
  L.unshift(r); put(L.slice(0,MAX)); return r; }
function del(id){ put(all().filter(x=>x.id!==id)); }
function clear(){ try{ localStorage.removeItem(K); }catch(e){} }
const day=t=>new Date(t).toISOString().slice(0,10);
/* compact summary sent with each request: only what is really in the history */
function summary(n){ const out=[]; let len=0; for(const r of all()){ if(!r.advice) continue; const x={date:day(r.at),type:r.kind==="game"?"game review":r.kind==="all"?"all-games report":"chat",game:r.game||undefined,asked:r.kind==="chat"?r.q.slice(0,120):undefined,advice:r.advice};
  const s=JSON.stringify(x).length; if(len+s>2600||out.length>=(n||10)) break; out.push(x); len+=s; } return out; }
/* loader: a knight hopping across a small board */
function loader(text){ return `<div class="ld61" role="status" aria-live="polite"><div class="ld61b" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="ld61n">♞</span></div><span class="ld61t">${E_(text||"Coach is thinking…")}</span></div>`; }
const CSS=`.ld61{display:flex;align-items:center;gap:10px;padding:6px 2px}.ld61b{position:relative;display:grid;grid-template-columns:repeat(4,18px);height:18px;border-radius:4px;overflow:hidden;flex:none}
.ld61b i{display:block;height:18px;background:#eed9b5}.ld61b i:nth-child(even){background:#b58863}.ld61n{position:absolute;top:-9px;left:0;width:18px;text-align:center;font-size:20px;line-height:22px;color:#222;text-shadow:0 1px 0 #fff;animation:ld61hop 2.4s ease-in-out infinite}
@keyframes ld61hop{0%{transform:translate(0,0)}10%{transform:translate(9px,-10px)}20%,25%{transform:translate(18px,0)}35%{transform:translate(27px,-10px)}45%,50%{transform:translate(36px,0)}60%{transform:translate(45px,-10px)}70%,75%{transform:translate(54px,0)}87%{transform:translate(27px,-12px)}100%{transform:translate(0,0)}}
.ld61t{font-size:14.5px;color:var(--mute,#555);font-weight:600}
@media (prefers-reduced-motion:reduce){.ld61n{animation:none;left:27px}.ld61t::after{content:""}}
html.dark-mode .ld61n{color:#fff;text-shadow:0 1px 0 #000}html.dark-mode .ld61t{color:#ccc}
.mh61 .mh61i{border:1px solid var(--line,#ddd);border-radius:12px;background:#fff;margin:6px 0;padding:0}.mh61 summary{padding:10px;list-style:none;cursor:pointer}.mh61 summary small{display:block;color:var(--mute,#666);font-size:12.5px}.mh61 .mh61a{padding:0 10px 8px;font-size:14.5px}.mh61 .mh61adv{background:#f3effa;border-radius:8px;padding:6px 8px;margin:6px 10px;font-size:14px}
html.dark-mode .mh61 .mh61i{background:#262626;color:#eee}html.dark-mode .mh61 .mh61adv{background:#2b2540}`;
{ const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
window.CRMem={all,add,del,clear,summary,advice,loader};
})();
