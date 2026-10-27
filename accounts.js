/* accounts.js — Chess.com + Lichess accounts. Merges Lichess games into the
   Chess.com-shaped data every feature already reads. Not affiliated with either site. */
(function(){
const OF=window.fetch.bind(window), LS=localStorage;
const low=s=>String(s||"").trim().toLowerCase();
function cc(){ return (LS.getItem("chessReview.username")||"").trim(); }
function li(){ try{ const v=JSON.parse(LS.getItem("chessReview.liUser")||'""'); return String(v||"").trim(); }catch(e){ return (LS.getItem("chessReview.liUser")||"").replace(/"/g,"").trim(); } }
function realCC(){ const i=(window.CRUser&&CRUser.info&&CRUser.info())||{}; if(i.cc!==undefined) return String(i.cc||"").trim(); return LS.getItem("chessReview.ccOnly")==="0"?"":cc(); }
function primary(){ return realCC()||li(); }
const pad=n=>String(n).padStart(2,"0");
const ym=t=>{ const d=new Date(t*1000); return d.getUTCFullYear()+"/"+pad(d.getUTCMonth()+1); };
const TC={bullet:"bullet",ultraBullet:"bullet",blitz:"blitz",rapid:"rapid",classical:"rapid",correspondence:"daily"};
function conv(g,me){
  if(g.variant&&g.variant!=="standard"||g.initialFen) return null;
  const P=g.players||{}, nm=p=>(p&&p.user&&p.user.name)||(p&&p.aiLevel?"Stockfish level "+p.aiLevel:"Anonymous");
  const L=low(li()), side=c=>{ const p=P[c]||{}; const mine=low(nm(p))===L;
    let r; if(g.winner===c) r="win"; else if(g.winner) r=g.status==="mate"?"checkmated":g.status==="outoftime"?"timeout":g.status==="resign"?"resigned":"abandoned";
    else r=g.status==="stalemate"?"stalemate":g.status==="outoftime"?"timevsinsufficient":"agreed";
    return {username:mine?me:nm(p),rating:p.rating||0,result:r,_li:mine}; };
  const w=side("white"), b=side("black"); if(!w._li&&!b._li) return null;
  const url="https://lichess.org/"+g.id, end=Math.floor((g.lastMoveAt||g.createdAt||0)/1000);
  let pgn=String(g.pgn||"").replace(/\[(White|Black) "([^"]*)"\]/g,(m,k,v)=>low(v)===L?`[${k} "${me}"]`:m);
  if(!/\[Link /.test(pgn)) pgn=pgn.replace(/(\[Site [^\n]*\n)/,`$1[Link "${url}"]\n`);
  const op=(g.opening&&g.opening.name)||"", slug=op.replace(/['’]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const c=g.clock, tc=g.speed==="correspondence"?"1/"+((g.daysPerTurn||1)*86400):c?(c.increment?c.initial+"+"+c.increment:String(c.initial)):"-";
  return {url,uuid:"li-"+g.id,pgn,end_time:end,rated:!!g.rated,time_class:TC[g.speed]||"rapid",time_control:tc,rules:"chess",
    eco:slug?"lichess/"+slug:"",white:w,black:b,_src:"lichess"};
}
let CACHE=null;
function liGames(){ const u=li(), me=primary(); if(!u) return Promise.resolve([]);
  if(CACHE&&CACHE.u===u&&CACHE.me===me&&Date.now()-CACHE.t<15*60e3) return CACHE.p;
  const since=Date.now()-365*864e5;
  const p=OF(`https://lichess.org/api/games/user/${encodeURIComponent(u)}?max=150&since=${since}&pgnInJson=true&opening=true&clocks=true`,{headers:{Accept:"application/x-ndjson"}})
    .then(r=>{ if(!r.ok) throw new Error("lichess "+r.status); return r.text(); })
    .then(t=>t.split("\n").filter(Boolean).map(l=>{ try{return conv(JSON.parse(l),me);}catch(e){return null;} }).filter(Boolean))
    .catch(e=>{ console.warn("Lichess games failed",e.message); CACHE=null; return []; });
  CACHE={u,me,t:Date.now(),p}; return p; }
const J=o=>new Response(JSON.stringify(o),{status:200,headers:{"Content-Type":"application/json"}});
async function liProfile(){ const r=await OF("https://lichess.org/api/user/"+encodeURIComponent(li())); if(!r.ok) return null; return r.json(); }
window.fetch=async function(input,init){
  const url=typeof input==="string"?input:(input&&input.url)||"";
  const m=url.match(/^https:\/\/api\.chess\.com\/pub\/player\/([^\/?#]+)(\/[^?#]*)?/i);
  if(!m||!li()||low(decodeURIComponent(m[1]))!==low(primary())) return OF(input,init);
  const rest=(m[2]||"").replace(/\/$/,""), hasCC=!!realCC(), base=`https://api.chess.com/pub/player/${m[1]}`;
  if(rest==="/games/archives"){
    let arc=[]; if(hasCC){ try{ const r=await OF(input,init); if(r.ok) arc=(await r.json()).archives||[]; }catch(e){ if(!(await liGames()).length) throw e; } }
    const set=new Set(arc.map(a=>a.replace(/\/$/,"").split("/").slice(-2).join("/")));
    (await liGames()).forEach(g=>set.add(ym(g.end_time)));
    return J({archives:[...set].sort().map(k=>`${base}/games/${k}`)}); }
  const mm=rest.match(/^\/games\/(\d{4})\/(\d{2})$/);
  if(mm){ let games=[]; if(hasCC){ try{ const r=await OF(input,init); if(r.ok) games=(await r.json()).games||[]; }catch(e){} }
    const k=mm[1]+"/"+mm[2]; games=games.concat((await liGames()).filter(g=>ym(g.end_time)===k)).sort((a,b)=>(a.end_time||0)-(b.end_time||0));
    return J({games}); }
  if(hasCC) return OF(input,init);
  const pr=await liProfile(); if(!pr) return new Response('{"message":"not found"}',{status:404});
  if(rest==="") return J({username:li(),url:"https://lichess.org/@/"+li(),joined:Math.floor((pr.createdAt||0)/1000),last_online:Math.floor((pr.seenAt||0)/1000),status:"basic",_src:"lichess"});
  if(rest==="/stats"){ const o={}, pf=pr.perfs||{};
    [["bullet","bullet"],["blitz","blitz"],["rapid","rapid"],["daily","correspondence"]].forEach(([k,l])=>{ const p=pf[l]; if(p&&p.games) o["chess_"+k]={last:{rating:p.rating,date:Math.floor(Date.now()/1000)},best:{rating:p.rating},record:{win:0,loss:0,draw:0}}; });
    return J(o); }
  return OF(input,init);
};
async function check(site,name){ name=String(name||"").trim(); if(!name) return {ok:true,empty:true};
  if(!/^[A-Za-z0-9_-]{2,30}$/.test(name)) return {ok:false,msg:"User not found"};
  try{ if(site==="cc"){ const r=await OF("https://api.chess.com/pub/player/"+encodeURIComponent(name.toLowerCase())); if(r.status===404||r.status===410) return {ok:false,msg:"User not found"}; if(!r.ok) return {ok:false,net:true,msg:"Couldn't check right now"}; const j=await r.json(); return {ok:true,name:j.username||name}; }
    const r=await OF("https://lichess.org/api/user/"+encodeURIComponent(name)); if(r.status===404) return {ok:false,msg:"User not found"}; if(!r.ok) return {ok:false,net:true,msg:"Couldn't check right now"};
    const j=await r.json(); if(j.disabled||j.closed||j.tosViolation&&!j.id) return {ok:false,msg:"User not found"}; return {ok:true,name:j.username||name};
  }catch(e){ return {ok:false,net:true,msg:navigator.onLine===false?"You're offline":"Couldn't check right now"}; } }
function save(c,l){ c=String(c||"").trim(); l=String(l||"").trim();
  let users=[]; try{ users=JSON.parse(LS.getItem("chessReview.users")||"[]"); }catch(e){}
  const cur=LS.getItem("chessReview.currentUser"); const rec=users.find(u=>u.id===cur);
  if(rec){ rec.cc=c; rec.li=l; LS.setItem("chessReview.users",JSON.stringify(users)); }
  else if(window.CRUser&&CRUser.set){ CRUser.set(c,l); }
  LS.setItem("chessReview.ccOnly",c?"1":"0");
  LS.setItem("chessReview.username",c||l); LS.setItem("chessReview.liUser",JSON.stringify(l));
  const u=document.getElementById("uname"); if(u) u.value=c||l; CACHE=null;
  try{ for(const k of Object.keys(LS)) if(/v46|games\.cache|gamesCache/i.test(k)) LS.removeItem(k); }catch(e){}
  document.dispatchEvent(new CustomEvent("cr-accounts")); }
const src=u=>/lichess\.org/i.test(String(u||""))?"lichess":"chesscom";
function tag(u){ const s=src(u); return `<span class="srcT ${s==="lichess"?"li":"cc"}">${s==="lichess"?"Lichess":"Chess.com"}</span>`; }
const NOTE=`<small class="acNote">Uses each site's public game data. Not affiliated with or endorsed by Chess.com or Lichess.</small>`;
function form(id,title){ const E=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return `<div class="acForm" id="${id}">${title?`<h3 style="margin:0 0 6px">${title}</h3>`:""}
  <label>Chess.com username<input class="acCC" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. magnus" value="${E(realCC())}"></label><div class="acErr acCCe"></div>
  <label>Lichess username<input class="acLI" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="optional" value="${E(li())}"></label><div class="acErr acLIe"></div>
  <button class="acSave btn primary v46b pri">Save</button> <span class="acMsg"></span>${NOTE}</div>`; }
function wire(root,done){ const q=s=>root.querySelector(s); q(".acSave").onclick=async()=>{
  const c=q(".acCC").value.trim(), l=q(".acLI").value.trim(); q(".acCCe").textContent=q(".acLIe").textContent="";
  if(!c&&!l){ q(".acMsg").textContent="Add at least one username."; return; }
  q(".acMsg").textContent="Checking…"; q(".acSave").disabled=true;
  const [a,b]=await Promise.all([check("cc",c),check("li",l)]); q(".acSave").disabled=false;
  if(!a.ok) q(".acCCe").textContent=a.msg; if(!b.ok) q(".acLIe").textContent=b.msg;
  if(!a.ok||!b.ok){ q(".acMsg").textContent=""; return; }
  save(a.empty?"":a.name,b.empty?"":b.name); q(".acMsg").textContent="Saved ✓"; done&&done(); }; }
function css(){ if(document.getElementById("acCss")) return; const s=document.createElement("style"); s.id="acCss";
  s.textContent=`.acForm label{display:block;font-size:14px;margin-top:6px}.acForm input{display:block;width:100%;box-sizing:border-box;padding:10px;font-size:16px;margin-top:3px;border-radius:8px;border:1px solid #8886;background:transparent;color:inherit}
.acErr{color:#e05252;font-size:13px;min-height:2px}.acSave{margin-top:10px}.acNote{display:block;opacity:.7;margin-top:8px;font-size:12px}
#acSetWrap{display:none}body.hs-set #home>#acSetWrap{display:block!important}
.srcT{display:inline-block;font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:8px;margin-left:6px;vertical-align:middle;line-height:1.5}
.srcT.cc{background:#7fa65033;color:#6f9a3c}.srcT.li{background:#8884;color:inherit}`; document.head.appendChild(s); }
function settings(){ const set=document.querySelector(".set3d"); if(!set||document.getElementById("acSet")) return;
  const d=document.createElement("div"); d.className="card"; d.id="acSetWrap"; d.innerHTML=form("acSet","Your accounts"); set.parentNode.insertBefore(d,set); wire(d); }
function boot(){ css(); const u=document.getElementById("uname"); if(u&&!u.value&&primary()) u.value=primary();
  settings(); new MutationObserver(()=>settings()).observe(document.body,{childList:true,subtree:true}); }
function sync(){ const p=primary(); if(p&&cc()!==p) LS.setItem("chessReview.username",p); }
if(window.CRUser&&CRUser.set){ const S=CRUser.set; CRUser.set=function(a,b){ const r=S.apply(this,arguments); try{ sync(); }catch(e){} return r; }; }
try{ sync(); }catch(e){}
/* v54ux: the "Who are you online?" card as a sheet, opened from locked features' "Add your username" buttons */
function ask(after){ css(); const old=document.getElementById("acAsk"); if(old) old.remove();
  const d=document.createElement("div"); d.id="acAsk"; d.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center";
  d.innerHTML=`<div class="card" style="background:var(--card,#fff);color:inherit;width:100%;max-width:520px;max-height:90vh;overflow:auto;border-radius:16px 16px 0 0;padding:16px;margin:0"><button class="btn" id="acAskX" style="float:right" aria-label="Close">✕</button>${form("acAskF","Who are you online?")}</div>`;
  document.body.appendChild(d); d.onclick=e=>{ if(e.target===d) d.remove(); }; document.getElementById("acAskX").onclick=()=>d.remove();
  wire(d,()=>setTimeout(()=>{ d.remove(); if(after) after(); else if(window.CRHome) CRHome.goHome(); },500)); }
window.CRAcct={ask,cc:realCC,li,primary,check,save,src,tag,form,wire,NOTE,liGames};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
