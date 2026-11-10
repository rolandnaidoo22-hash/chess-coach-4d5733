/* Champion: a strong, quiet practice bot with a position opening book.
   The bundled book is lazy-loaded. If it is older than 3 days and the phone
   is online, a background worker may fetch the latest 1–2 public monthly
   archives and merge them on this phone. Nothing here is shown as a person. */
(function(){
"use strict"; if(window.CRChampion) return;
const DAY=24*3600*1000, THREE=3*DAY, GAP=1100, DEPTH=14, MONTHS=2;
const KM="chessReview.champion.meta", KX="chessReview.champion.extra";
const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chess=()=>window.ChessLib&&ChessLib.Chess||window.Chess;
function lsGet(k,d){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }
function meta(){ if(!meta._) meta._=lsGet(KM,{}); return meta._; }
function saveMeta(){ lsSet(KM,meta()); }
function srcId(){ return atob("bWFnbnVzY2FybHNlbg=="); }
function monthUrl(y,m){ return "https://api.chess.com/pub/player/"+srcId()+"/games/"+y+"/"+String(m).padStart(2,"0"); }
function archivesUrl(){ return "https://api.chess.com/pub/player/"+srcId()+"/games/archives"; }
function fenKey(fen){ const p=String(fen||"").trim().split(/\s+/); if(p.length>=4) p[3]="-"; return p.slice(0,4).join(" "); }
function fenKeys(fen){ const p=String(fen||"").trim().split(/\s+/); const raw=p.slice(0,4).join(" "); const stripped=fenKey(fen); return raw===stripped?[raw]:[raw,stripped]; }
function ageWeight(t,now){ const sec=x=>{ x=+x||0; return x>1e12?Math.round(x/1000):Math.round(x); }; const days=Math.max(0,(sec(now||Date.now())-sec(t))/86400); return 1/(1+days/30); }
function connectionKind(){ try{ if(window.CRBrain&&CRBrain.connectionKind) return CRBrain.connectionKind(); const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection; if(!c) return "unknown";
    if(c.saveData) return "cellular"; if(c.type==="cellular") return "cellular";
    if(c.type==="wifi"||c.type==="ethernet"||c.type==="wimax") return "wifi"; return "unknown"; }catch(e){ return "unknown"; } }
function mayDownload(manual){ if(meta().dataOk) return "yes"; try{ if(window.CRBrain&&CRBrain.mayDownload){ const g=CRBrain.mayDownload(!!manual); if(g==="yes") return "yes"; } }catch(e){}
  const kind=connectionKind(); if(kind==="wifi") return "yes"; if(kind==="cellular") return "ask"; return manual?"ask":"no"; }
function askCopy(){ return connectionKind()==="cellular"
  ?"You're on mobile data. Champion can download a public opening-book update (recent games) and keep it on this phone. Download now?"
  :"Champion can download a public opening-book update (recent games) and keep it on this phone. Is that OK?"; }
function rememberDataOk(ok){ const m=meta(); m.dataOk=!!ok; m.dataAsked=true; m.dataOkAt=Date.now(); saveMeta(); }

let BOOK=null, EXTRA=null, loading=null, refreshing=false, nextAt=0;
function useBook(obj){ BOOK=obj||{book:{},builtAt:0}; }
function extra(){ if(!EXTRA){ try{ EXTRA=lsGet(KX,{}); }catch(e){ EXTRA={}; } if(!EXTRA||typeof EXTRA!=="object") EXTRA={}; } return EXTRA; }
function saveExtra(){ lsSet(KX,extra()); }
function loadBook(){ if(BOOK) return Promise.resolve(BOOK);
  if(loading) return loading;
  loading=fetch("champion-book.json").then(r=>{ if(!r.ok) throw new Error("nobook"); return r.json(); })
    .then(j=>{ BOOK=j||{book:{},builtAt:0}; extra(); loading=null; return BOOK; })
    .catch(()=>{ BOOK=BOOK||{book:{},builtAt:0}; loading=null; return BOOK; });
  return loading; }
function newestBuilt(){ return Math.max((BOOK&&BOOK.builtAt)||0, meta().mergedAt||0); }
function stale(){ const t=newestBuilt(); return !t || Date.now()-t>THREE; }
function weightsAt(fen){ const out={};
  fenKeys(fen).forEach(key=>{
    const a=(BOOK&&BOOK.book&&BOOK.book[key])||{};
    const b=extra()[key]||{};
    Object.keys(a).forEach(k=>{ out[k]=(out[k]||0)+a[k]; });
    Object.keys(b).forEach(k=>{ out[k]=(out[k]||0)+b[k]; });
  });
  return out; }
function pick(fen,legal){ if(!legal||!legal.length) return null;
  const W=weightsAt(fen); const opts=legal.filter(m=>W[m.san]>0); if(!opts.length) return null;
  const total=opts.reduce((s,m)=>s+W[m.san],0)||1;
  const top=Math.max.apply(null,opts.map(m=>W[m.san]));
  const pool=opts.filter(m=>W[m.san]===top||W[m.san]/total>=0.08);
  const use=pool.length?pool:opts;
  let r=Math.random()*use.reduce((s,m)=>s+W[m.san],0);
  for(let i=0;i<use.length;i++){ r-=W[use[i].san]; if(r<=0) return use[i]; }
  return use[0]; }
async function bookMove(fen,legal){ if(!legal||!legal.length) return null; await loadBook(); return pick(fen,legal); }

let W=undefined, Wseq=0, Wpend={};
function worker(){ if(W===null) return null; if(W) return W; if(typeof Worker!=="function"){ W=null; return null; }
  try{ W=new Worker("brain81-worker.js"); W.onmessage=e=>{ const m=e.data||{}, fn=Wpend[m.id]; if(fn){ delete Wpend[m.id]; fn(m); } }; W.onerror=()=>{ W=null; }; return W; }catch(e){ W=null; return null; } }
function callWorker(payload,ms){ const w=worker(); if(!w) return Promise.reject(new Error("noworker"));
  const id=++Wseq; payload=Object.assign({id:id},payload);
  return new Promise((resolve,reject)=>{ const to=setTimeout(()=>{ delete Wpend[id]; reject(new Error("timeout")); },ms||25000);
    Wpend[id]=m=>{ clearTimeout(to); resolve(m); }; try{ w.postMessage(payload); }catch(e){ clearTimeout(to); delete Wpend[id]; reject(e); } }); }
async function fetchRaw(url){ const w=worker();
  if(w){ try{ const m=await callWorker({type:"fetch",url:url},25000);
      if(m&&m.error!=="network"&&(m.ok||m.status===404||m.status===429)){
        if(m.status===404||m.status===429) return {status:m.status,data:null};
        if(!m.ok) throw new Error("http "+(m.status||"")); return {status:m.status||200,data:m.data}; }
    }catch(e){} }
  let r; try{ r=await fetch(url,{cache:"no-store"}); }catch(e){ throw new Error("network"); }
  if(r.status===404||r.status===429) return {status:r.status,data:null}; if(!r.ok) throw new Error("http "+r.status); return {status:r.status,data:await r.json()}; }
async function getJson(url){ const wait=Math.max(0,nextAt-Date.now()); if(wait) await sleep(wait);
  nextAt=Date.now()+GAP; let got=await fetchRaw(url);
  if(got.status===429){ nextAt=Date.now()+8000; await sleep(8000); got=await fetchRaw(url); nextAt=Date.now()+GAP; }
  if(got.status===404) return null; return got.data; }
async function recentMonthUrls(){ try{ const j=await getJson(archivesUrl()); if(j&&j.archives&&j.archives.length) return j.archives.slice(-MONTHS); }catch(e){}
  const d=new Date(), out=[];
  for(let i=0;i<MONTHS;i++){ const x=new Date(d.getFullYear(),d.getMonth()-i,1); out.push(monthUrl(x.getFullYear(),x.getMonth()+1)); }
  return out.reverse(); }
function mergeGame(sans,side,endTime){ const C=chess(); if(!C||!sans||!sans.length||!side) return 0;
  const g=new C(); const wt=ageWeight(endTime); let n=0; const bag=extra();
  for(let i=0;i<sans.length&&i<DEPTH;i++){
    const key=fenKey(g.fen()); const turn=g.turn(); let m=null;
    try{ m=g.move(sans[i]); }catch(e){ break; } if(!m) break;
    if(turn===side){ const cell=bag[key]||(bag[key]={}); cell[m.san]=(cell[m.san]||0)+wt; n++; }
  }
  return n; }
async function parseGames(games){ if(!games||!games.length) return games||[];
  if(worker()){ try{ const m=await callWorker({type:"parse",games:games},20000); if(m&&m.games) return m.games; }catch(e){} }
  return games; }
async function refresh(){ if(refreshing||navigator.onLine===false) return; refreshing=true;
  try{ const urls=await recentMonthUrls(); const who=srcId(); let added=0;
    for(let i=0;i<urls.length;i++){ const jsn=await getJson(urls[i]); let games=(jsn&&jsn.games)||[];
      try{ games=await parseGames(games); }catch(e){}
      for(let k=0;k<games.length;k++){ const g=games[k]; if(!g||(g.rules&&g.rules!=="chess")) continue;
        const wu=((g.white&&g.white.username)||"").toLowerCase(), bu=((g.black&&g.black.username)||"").toLowerCase();
        const side=wu===who?"w":bu===who?"b":null; if(!side) continue;
        const sans=g.sans&&g.sans.length?g.sans:null; if(!sans) continue;
        added+=mergeGame(sans,side,g.end_time); } }
    if(added){ saveExtra(); const m=meta(); m.mergedAt=Date.now(); saveMeta(); }
  }catch(e){} finally{ refreshing=false; } }
function acceptData(){ rememberDataOk(true); const el=document.getElementById("ch81ask"); if(el) el.remove(); refresh(); }
function declineData(){ rememberDataOk(false); const el=document.getElementById("ch81ask"); if(el) el.remove(); }
function showAsk(root){ if(!root||root.querySelector("#ch81ask")) return;
  const card=document.createElement("div"); card.id="ch81ask"; card.className="card"; card.setAttribute("role","dialog");
  card.innerHTML=`<b>Before we download</b><p class="mute" style="margin:6px 0">${E(askCopy())}</p><div class="row"><button type="button" class="bt go" id="ch81yes">Download</button><button type="button" class="bt" id="ch81no">Not now</button></div>`;
  const play=root.querySelector("#b69play"); if(play) play.before(card); else root.appendChild(card);
  const y=card.querySelector("#ch81yes"), n=card.querySelector("#ch81no");
  if(y) y.onclick=()=>acceptData(); if(n) n.onclick=()=>declineData(); }
async function prepare(root){ await loadBook();
  if(navigator.onLine===false) return;
  if(!stale()) return;
  const gate=mayDownload(true);
  if(gate==="ask"){ showAsk(root); return; }
  if(gate==="yes") refresh(); }

window.CRChampion={bookMove,prepare,loadBook,useBook,fenKey,stale,mayDownload,askCopy,refresh,pick,START};
})();
