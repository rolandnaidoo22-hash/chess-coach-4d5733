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
/* v62 loader: a compact board playing a real opening (1.e4 e5 2.Nf3 Nc6 3.Bc4), looping */
const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", SEQ=[["e2","e4","1.e4"],["e7","e5","1…e5"],["g1","f3","2.Nf3"],["b8","c6","2…Nc6"],["f1","c4","3.Bc4"]];
const GL={k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"}, RM=()=>{ try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const xy=sq=>[sq.charCodeAt(0)-97,8-(+sq[1])], pos=sq=>{ const [x,y]=xy(sq); return `transform:translate(${x*100}%,${y*100}%)`; };
function pieces(){ let h="", r=0; START.split("/").forEach((row,ri)=>{ let f=0; for(const c of row){ if(/\d/.test(c)){ f+=+c; continue; } const sq=String.fromCharCode(97+f)+(8-ri); h+=`<b class="ld62p ${c===c.toUpperCase()?"w":"k"}" data-sq="${sq}" style="${pos(sq)}">${GL[c.toLowerCase()]}</b>`; f++; } }); return h; }
function sqs(){ let h=""; for(let y=0;y<8;y++) for(let x=0;x<8;x++) h+=`<i class="${(x+y)%2?"d":"l"}"></i>`; return h; }
function loader(text){ return `<div class="ld61 ld62" role="status" aria-live="polite" data-st="0"><div class="ld62b" aria-hidden="true"><div class="ld62g">${sqs()}</div><span class="ld62h f"></span><span class="ld62h t"></span><div class="ld62ps">${pieces()}</div></div><div class="ld62x"><span class="ld61t">${E_(text||"Coach is thinking…")}</span><span class="ld62m" aria-hidden="true">Italian Game</span></div></div>`; }
function step(el){ const ps=el.querySelector(".ld62ps"), F=el.querySelector(".ld62h.f"), T=el.querySelector(".ld62h.t"), m=el.querySelector(".ld62m"); if(!ps) return;
  let st=+el.dataset.st||0;
  if(RM()){ if(el.dataset.rm) return; el.dataset.rm="1"; SEQ.forEach(([f,t])=>{ const p=ps.querySelector(`[data-sq="${f}"]`); if(p){ p.dataset.sq=t; p.style.cssText=pos(t); } }); F.style.cssText=pos("f1")+";opacity:1"; T.style.cssText=pos("c4")+";opacity:1"; if(m) m.textContent="1.e4 e5 2.Nf3 Nc6 3.Bc4"; return; }
  if(el.dataset.rm){ delete el.dataset.rm; st=SEQ.length+2; }
  if(st<SEQ.length){ const [f,t,lab]=SEQ[st], p=ps.querySelector(`[data-sq="${f}"]`); if(p){ p.dataset.sq=t; p.style.cssText=pos(t); p.classList.add("mv"); setTimeout(()=>p.classList.remove("mv"),500); }
    F.style.cssText=pos(f)+";opacity:.55"; T.style.cssText=pos(t)+";opacity:1"; T.classList.remove("fl"); void T.offsetWidth; T.classList.add("fl"); if(m) m.textContent=lab; }
  else if(st===SEQ.length+1){ ps.classList.add("out"); F.style.opacity=T.style.opacity=0; }
  else if(st>=SEQ.length+2){ ps.innerHTML=pieces(); ps.classList.remove("out"); if(m) m.textContent="Italian Game"; st=-1; }
  el.dataset.st=st+1; }
setInterval(()=>document.querySelectorAll(".ld62").forEach(step),800);
const CSS=`.ld62{display:flex;align-items:center;gap:12px;padding:8px 2px}
.ld62b{position:relative;width:112px;height:112px;flex:none;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.08)}
.ld62g{display:grid;grid-template-columns:repeat(8,1fr);width:100%;height:100%}.ld62g i{display:block}.ld62g .l{background:var(--light,#f0d9b5)}.ld62g .d{background:var(--dark,#b58863)}
.ld62h{position:absolute;left:0;top:0;width:12.5%;height:12.5%;background:rgba(255,214,64,.75);opacity:0;transition:transform .45s cubic-bezier(.4,.1,.2,1),opacity .3s}.ld62h.f{background:rgba(255,214,64,.45)}
.ld62h.fl{animation:ld62fl .7s ease-out}@keyframes ld62fl{0%{box-shadow:inset 0 0 0 7px rgba(255,190,0,.95)}100%{box-shadow:inset 0 0 0 0 rgba(255,190,0,0)}}
.ld62ps{position:absolute;inset:0;transition:opacity .45s}.ld62ps.out{opacity:0}
.ld62p{position:absolute;left:0;top:0;width:12.5%;height:12.5%;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;font-weight:400;transition:transform .5s cubic-bezier(.4,.1,.2,1);will-change:transform;user-select:none}
.ld62p.w{color:#fff;text-shadow:0 0 1px #000,0 0 1px #000,0 1px 1px rgba(0,0,0,.6)}.ld62p.k{color:#1d1d1d;text-shadow:0 0 1px rgba(255,255,255,.5)}.ld62p.mv{z-index:2;filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}
.ld62x{display:flex;flex-direction:column;gap:3px;min-width:0}.ld62 .ld61t{font-size:15px;color:var(--fg,#222);font-weight:700}
.ld62m{font:600 12.5px/1.2 ui-monospace,Menlo,monospace;color:var(--accent,#3b6fb6);min-height:15px}
@media (prefers-reduced-motion:reduce){.ld62p,.ld62h,.ld62ps{transition:none}.ld62h.fl{animation:none}.ld62b{animation:ld62fade 2.6s ease-in-out infinite alternate}@keyframes ld62fade{from{opacity:1}to{opacity:.7}}}
html.dark-mode .ld62 .ld61t{color:#eee}
.ld61{display:flex;align-items:center;gap:10px;padding:6px 2px}.ld61b{position:relative;display:grid;grid-template-columns:repeat(4,18px);height:18px;border-radius:4px;overflow:hidden;flex:none}
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
