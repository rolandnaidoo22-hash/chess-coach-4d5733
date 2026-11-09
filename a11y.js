/* a11y.js: gives screen readers a name for icon-only buttons (emoji/arrow glyphs) and keeps doing so as the UI re-renders.
   Uses the button's title, then a glyph lookup. It never overrides an existing aria-label or real text. */
(function(){
"use strict";
const GLYPH={"◀":"Previous","▶":"Next","⏮":"First move","⏭":"Last move","⏪":"Back","⏩":"Forward","←":"Back","→":"Forward","↩":"Undo","↻":"Retry","⟳":"Refresh","🗑":"Delete","🗑️":"Delete","✕":"Close","✖":"Close","×":"Close","✓":"Confirm","✔":"Confirm","⚙":"Settings","⚙️":"Settings","☰":"Menu","🔊":"Sound","🔇":"Sound off","💡":"Hint","🏠":"Home","📤":"Share","📋":"Copy","⭐":"Favourite","★":"Favourite","☆":"Favourite","🔄":"Flip board","⇅":"Flip board","⏸":"Pause","▮▮":"Pause","⏹":"Stop"};
function label(el){
  if(el.hasAttribute("aria-label")||el.hasAttribute("aria-labelledby")) return;
  const raw=(el.textContent||"").trim();
  if(/[A-Za-z]{2}/.test(raw)) return;                 // has real words already
  const t=el.getAttribute("title"); if(t){ el.setAttribute("aria-label",t); return; }
  if(GLYPH[raw]){ el.setAttribute("aria-label",GLYPH[raw]); return; }
  for(const k in GLYPH){ if(raw.indexOf(k)>=0){ el.setAttribute("aria-label",GLYPH[k]); return; } }
}
function scan(root){
  if(!root||!root.querySelectorAll) return;
  if(root.matches&&root.matches("button,[role=button]")) label(root);
  root.querySelectorAll("button,[role=button]").forEach(label);
}
function start(){ scan(document.body);
  let q=null; const mo=new MutationObserver(ms=>{ if(q) return; q=setTimeout(()=>{ q=null; scan(document.body); },200); });
  mo.observe(document.body,{childList:true,subtree:true}); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
