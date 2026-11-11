/* dialog.js: the app's own pop-up box, used instead of the browser's confirm()/alert(),
   which always show the website address and the browser's own style.
   CRDialog.confirm({title,text,ok,cancel,danger}) -> Promise<boolean>
   CRDialog.alert({title,text,ok})                  -> Promise<void>
   Esc, the back gesture's Escape key and tapping outside all count as Cancel. */
(function(){
"use strict"; if(window.CRDialog) return;
const CSS=`.crdlg{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,18,16,.55);animation:crdlgF .14s ease-out}
.crdlg>div{width:100%;max-width:360px;background:var(--card,#fff);color:var(--ink,#262421);border-radius:18px;padding:20px 18px 14px;box-shadow:0 12px 40px rgba(0,0,0,.3);animation:crdlgP .16s ease-out}
.crdlg h3{margin:0 0 6px;font-size:19px;line-height:1.3}.crdlg p{margin:0 0 16px;color:var(--mute,#6f6a62);font-size:15.5px;line-height:1.45}
.crdlg .crdlgB{display:flex;gap:10px}.crdlg button{flex:1;min-height:48px;border-radius:12px;font:inherit;font-weight:700;font-size:16px;cursor:pointer;border:1px solid var(--line,#e4dfd5);background:none;color:inherit}
.crdlg button.ok{background:var(--accent,#3b6fb6);border-color:var(--accent,#3b6fb6);color:#fff}.crdlg button.ok.danger{background:#c62828;border-color:#c62828}
.crdlg button:focus-visible{outline:3px solid var(--accent,#3b6fb6);outline-offset:2px}
@keyframes crdlgF{from{opacity:0}}@keyframes crdlgP{from{transform:scale(.96);opacity:0}}
@media (prefers-reduced-motion:reduce){.crdlg,.crdlg>div{animation:none}}`;
let styled=false;
function css(){ if(styled) return; styled=true; const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }
function open(o,withCancel){ css(); return new Promise(res=>{
  const back=document.activeElement, d=document.createElement("div"); d.className="crdlg";
  d.innerHTML=`<div role="${withCancel?"alertdialog":"dialog"}" aria-modal="true" aria-labelledby="crdlgT" aria-describedby="crdlgX"><h3 id="crdlgT"></h3><p id="crdlgX"></p><div class="crdlgB">${withCancel?'<button type="button" class="no"></button>':""}<button type="button" class="ok"></button></div></div>`;
  d.querySelector("h3").textContent=o.title||""; const p=d.querySelector("p"); if(o.text) p.textContent=o.text; else p.remove();
  const ok=d.querySelector(".ok"); ok.textContent=o.ok||"OK"; if(o.danger) ok.classList.add("danger");
  const no=d.querySelector(".no"); if(no) no.textContent=o.cancel||"Cancel";
  const done=v=>{ document.removeEventListener("keydown",key,true); d.remove(); try{ back&&back.focus&&back.focus({preventScroll:true}); }catch(e){} res(v); };
  const key=e=>{ if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); done(false); }
    else if(e.key==="Tab"){ const b=[...d.querySelectorAll("button")], i=b.indexOf(document.activeElement); e.preventDefault(); b[(i+(e.shiftKey?-1:1)+b.length)%b.length].focus(); } };
  ok.onclick=()=>done(true); if(no) no.onclick=()=>done(false);
  d.addEventListener("click",e=>{ if(e.target===d) done(false); });
  document.addEventListener("keydown",key,true); document.body.appendChild(d);
  (o.danger&&no?no:ok).focus({preventScroll:true}); }); }
window.CRDialog={ confirm:o=>open(typeof o==="string"?{title:o}:o,true), alert:o=>open(typeof o==="string"?{title:o}:o,false).then(()=>{}) };
})();
