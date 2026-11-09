/* ui82.js (v82): dark theme switch (Auto / Light / Dark) and Backup & restore. Own file; adds a block to Settings.
   The dark colours hang off the existing html.dark-mode class that the other files already style. */
(function(){
"use strict"; if(window.CRUi82) return;
const $=id=>document.getElementById(id), H=document.documentElement;
/* The theme is one setting for the whole phone (not per player), so read/write it with the original Storage methods. */
const raw={ get(k){ try{ return Storage.prototype.getItem.call(localStorage,k); }catch(e){ return null; } }, set(k,v){ try{ Storage.prototype.setItem.call(localStorage,k,v); return true; }catch(e){ return false; } } };
const GK="crTheme"; /* not a chessReview.* key, so the per-player mapping leaves it alone */
const mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
const pref=()=>{ const v=raw.get(GK); return v==="dark"||v==="light"?v:"auto"; };
function apply(){ const p=pref(), dark=p==="dark"||(p==="auto"&&!!(mq&&mq.matches)); H.classList.toggle("dark-mode",dark);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute("content",dark?"#161514":"#262421"); paintSet(); }
const CSS=`html.dark-mode{color-scheme:dark;--bg:#161514;--card:#24221f;--ink:#ecebe8;--mute:#a8a39b;--line:#3b3833;--accent:#6ea0e6}
html.dark-mode body{background:var(--bg);color:var(--ink)}
html.dark-mode .card,html.dark-mode .gitem,html.dark-mode .bubble{background:var(--card);border-color:var(--line);color:var(--ink)}
html.dark-mode input,html.dark-mode textarea,html.dark-mode select{background:#1d1b19;color:var(--ink);border-color:#4a463f}
html.dark-mode .btn:not(.primary){background:#2f2c28;color:var(--ink);border-color:#4a463f}
html.dark-mode a{color:#8ab4f8}
html.dark-mode .hsG button.lk55{background:#2b2926!important;opacity:.7}html.dark-mode .hsG button.lk55 small{color:#c9c4bb!important}
html.dark-mode .hsSteps button{background:rgba(255,255,255,.16)!important;color:#fff!important;border-color:rgba(255,255,255,.4)!important}
html.dark-mode #cr66set label.mode,html.dark-mode #trMenu button.secit,html.dark-mode #trMenu button.tile,html.dark-mode #trMenu label.safetog,html.dark-mode #v45 div.card,html.dark-mode #v45 button.v45b,html.dark-mode #home .ub16,html.dark-mode #home .set3d{background:var(--card)!important;color:var(--ink)!important;border-color:var(--line)!important}
html.dark-mode #home .set3d button{background:#2f2c28;color:var(--ink);border-color:#4a463f}
html.dark-mode #trMenu button.secit small,html.dark-mode #trMenu button.tile small,html.dark-mode #cr66set label.mode small{color:var(--mute)!important}
html.dark-mode .co17sm,html.dark-mode .tr19sub,html.dark-mode small.cr69at{color:var(--mute)!important}
html.dark-mode #co17,html.dark-mode #co17 .tr19c{color:var(--ink)}
html.dark-mode #co17 span.mis.yours,html.dark-mode #co17 span.pun{color:#262421}
html.dark-mode #hsNav{box-shadow:0 -2px 10px rgba(0,0,0,.4)}
html.dark-mode #hs h1 small{background:#ecebe8;color:#161514}
.set82{border:1px solid var(--line);background:var(--card,#fff);color:var(--ink);border-radius:14px;padding:12px 14px;margin:10px 0;font-size:15px;line-height:1.45}
.set82 h3{margin:0 0 6px;font-size:17px}.set82 p{margin:4px 0 8px;color:var(--mute);font-size:13.5px}
.set82 .seg{display:flex;gap:6px}.set82 .seg button,.set82 .row button{flex:1;min-height:44px;border-radius:10px;border:1px solid var(--line);background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer}
.set82 .seg button.on{background:var(--accent,#3b6fb6);border-color:var(--accent,#3b6fb6);color:#fff}
.set82 .row{display:flex;gap:8px;flex-wrap:wrap}.set82 .msg{min-height:1.2em;font-size:13.5px;margin-top:6px}
body:not(.hs-set) #home>.set82{display:none!important}`;
function paintSet(){ document.querySelectorAll(".set82 [data-th]").forEach(b=>{ const on=b.dataset.th===pref(); b.classList.toggle("on",on); b.setAttribute("aria-pressed",on?"true":"false"); }); }
/* ---------- backup & restore: every chessReview.* key on this phone (all players), as one file ---------- */
function collect(){ const out={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&(k.startsWith("chessReview.")||k===GK)) out[k]=raw.get(k); } return out; }
function backup(){ const data=collect(), n=Object.keys(data).length; const d=new Date(), pad=x=>String(x).padStart(2,"0");
  const blob=new Blob([JSON.stringify({app:"ultimate-chess-app",format:1,saved:d.toISOString(),keys:data})],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`chess-app-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); return n; }
function parse(text){ let j; try{ j=JSON.parse(text); }catch(e){ throw new Error("That file isn't a backup from this app."); }
  if(!j||j.app!=="ultimate-chess-app"||!j.keys||typeof j.keys!=="object") throw new Error("That file isn't a backup from this app.");
  const keys=Object.keys(j.keys).filter(k=>(k.startsWith("chessReview.")||k===GK)&&typeof j.keys[k]==="string"); if(!keys.length) throw new Error("That backup is empty.");
  return {saved:j.saved||"",keys,data:j.keys}; }
function restore(b){ /* keep a copy so a failed write (storage full) can be undone */
  const before=collect();
  try{ Object.keys(before).forEach(k=>{ if(k!==GK) Storage.prototype.removeItem.call(localStorage,k); });
    b.keys.forEach(k=>{ Storage.prototype.setItem.call(localStorage,k,b.data[k]); }); return true; }
  catch(e){ try{ for(let i=localStorage.length-1;i>=0;i--){ const k=localStorage.key(i); if(k&&k.startsWith("chessReview.")) Storage.prototype.removeItem.call(localStorage,k); }
      Object.keys(before).forEach(k=>Storage.prototype.setItem.call(localStorage,k,before[k])); }catch(x){} return false; } }
function block(){ const h=$("home"); if(!h||h.querySelector(".set82")) return;
  const d=document.createElement("div"); d.className="set82";
  d.innerHTML=`<h3>Appearance</h3><p>Auto follows your phone's light or dark setting.</p><div class="seg" role="group" aria-label="Theme"><button type="button" data-th="auto">Auto</button><button type="button" data-th="light">Light</button><button type="button" data-th="dark">Dark</button></div>`;
  const e=document.createElement("div"); e.className="set82";
  e.innerHTML=`<h3>Backup &amp; restore</h3><p>Everything is kept only on this phone. Save a backup file so clearing the browser or changing phones doesn't lose your games, patterns and progress.</p><div class="row"><button type="button" data-bk="save">Save a backup</button><button type="button" data-bk="load">Restore from a backup</button></div><input type="file" accept="application/json,.json" hidden><div class="msg" role="status"></div>`;
  h.appendChild(d); h.appendChild(e); paintSet();
  d.addEventListener("click",ev=>{ const b=ev.target.closest("[data-th]"); if(!b) return; raw.set(GK,b.dataset.th); apply(); });
  const msg=e.querySelector(".msg"), file=e.querySelector("input");
  e.addEventListener("click",ev=>{ const b=ev.target.closest("[data-bk]"); if(!b) return;
    if(b.dataset.bk==="save"){ const n=backup(); msg.textContent=`Backup saved (${n} items). Keep the file somewhere safe.`; } else { file.value=""; file.click(); } });
  file.addEventListener("change",()=>{ const f=file.files&&file.files[0]; if(!f) return; const fr=new FileReader();
    fr.onerror=()=>{ msg.textContent="Couldn't read that file."; };
    fr.onload=()=>{ let b; try{ b=parse(String(fr.result)); }catch(err){ msg.textContent=err.message; return; }
      const when=b.saved?new Date(b.saved).toLocaleString():"an unknown date";
      if(!confirm(`Restore the backup from ${when}?\n\nThis replaces everything saved in the app on this phone.`)) return;
      if(restore(b)){ msg.textContent="Restored. Reloading…"; setTimeout(()=>location.reload(),600); } else msg.textContent="Not enough storage space to restore. Nothing was changed."; };
    fr.readAsText(f); }); }
function boot(){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); apply(); block();
  const h=$("home"); if(h) new MutationObserver(()=>block()).observe(h,{childList:true});
  if(mq){ if(mq.addEventListener) mq.addEventListener("change",apply); else if(mq.addListener) mq.addListener(apply); } }
window.CRUi82={apply,pref,set(v){ raw.set(GK,v); apply(); },_parse:parse,_collect:collect,_restore:restore};
/* set the class as early as possible (before first paint of deferred UI), finish once the page is ready */
try{ const p=pref(); if(p==="dark"||(p==="auto"&&mq&&mq.matches)) H.classList.add("dark-mode"); }catch(e){}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
