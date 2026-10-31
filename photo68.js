/* v68: My photo board. The player picks a photo for the board and photos for the pieces. Pictures are shrunk and kept only on this phone. */
(function(){ "use strict"; if(window.CRPhoto) return;
const K="chessReview.v68.photo", $=id=>document.getElementById(id);
const PN={K:"King",Q:"Queen",R:"Rook",B:"Bishop",N:"Knight",P:"Pawn"}, KEYS=["wK","wQ","wR","wB","wN","wP","bK","bQ","bR","bB","bN","bP"];
const LG=()=>{ try{ return Object.assign({board:"",pieces:{}},JSON.parse(localStorage.getItem(K)||"{}")); }catch(e){ return {board:"",pieces:{}}; } };
function SV(s){ try{ localStorage.setItem(K,JSON.stringify(s)); return true; }catch(e){ return false; } }
const ORIG={};
function apply(){ const s=LG();
  let st=$("ph68css"); if(!st){ st=document.createElement("style"); st.id="ph68css"; document.head.appendChild(st); }
  st.textContent=s.board?`svg.b3d:not(.gl3d),svg.hwb,svg.ph68pv{background:url(${s.board}) center/cover}
   svg.b3d [fill="#f0d9b5" i],svg.hwb [fill="#f0d9b5" i],svg.ph68pv [fill="#f0d9b5" i]{fill:#fff!important;fill-opacity:.18}
   svg.b3d [fill="#b58863" i],svg.hwb [fill="#b58863" i],svg.ph68pv [fill="#b58863" i]{fill:#000!important;fill-opacity:.38}`:"";
  KEYS.forEach(k=>{ const sy=$("pc-"+k); if(!sy) return; if(!(k in ORIG)) ORIG[k]=sy.innerHTML;
    sy.innerHTML=s.pieces[k]?`<image href="${s.pieces[k]}" x="0.5" y="0.5" width="44" height="44"/>`:ORIG[k]; }); }
/* shrink a photo: board -> square JPEG, piece -> square picture with a thin white or dark edge so both sides stay clear */
function shrink(file,kind,col){ return new Promise((ok,no)=>{ const fr=new FileReader(); fr.onerror=no; fr.onload=()=>{ const im=new Image(); im.onerror=()=>no(new Error("not a picture")); im.onload=()=>{
  const S=kind==="board"?720:128, c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d"), m=Math.min(im.width,im.height), sx=(im.width-m)/2, sy=(im.height-m)/2;
  if(kind==="board"){ x.drawImage(im,sx,sy,m,m,0,0,S,S); return ok(c.toDataURL("image/jpeg",.8)); }
  /* v70: the photo fills the whole square (cover), with a thin white or dark edge to show the side */
  const R=14; x.save(); x.beginPath(); x.roundRect(1,1,S-2,S-2,R); x.clip(); x.drawImage(im,sx,sy,m,m,0,0,S,S); x.restore();
  x.lineWidth=6; x.strokeStyle=col==="w"?"#ffffff":"#1a1a1a"; x.beginPath(); x.roundRect(3,3,S-6,S-6,R-2); x.stroke(); x.lineWidth=1.5; x.strokeStyle=col==="w"?"#444":"#eee"; x.beginPath(); x.roundRect(.75,.75,S-1.5,S-1.5,R); x.stroke();
  ok(c.toDataURL("image/png")); }; im.src=fr.result; }; fr.readAsDataURL(file); }); }
const START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
function preview(){ let h=""; try{ h=Trainer.boardSvg(START,"w",{loose:false,nocoord:true},true); }catch(e){} return `<svg viewBox="0 0 360 360" class="ph68pv" style="width:100%;max-width:340px;display:block;margin:0 auto;border-radius:12px">${h}</svg>`; }
const CSS=`#photo68 .ph68g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}#photo68 .ph68g label{border:1px solid #dde;border-radius:14px;padding:8px 4px;text-align:center;font-size:13px;font-weight:700;cursor:pointer;min-height:96px;background:#fff;color:#222}
#photo68 .ph68g svg{width:48px;height:48px;display:block;margin:0 auto 4px}#photo68 input[type=file]{display:none}#photo68 .ph68b{display:block;width:100%;min-height:52px;border-radius:14px;border:none;font:inherit;font-weight:800;font-size:17px;margin:8px 0;cursor:pointer;background:#3b6fb6;color:#fff;text-align:center;line-height:52px}
#photo68 .ph68b.gray{background:#e6e8ee;color:#223}#photo68 .ph68m{min-height:22px;font-weight:700}html.dark-mode #photo68 .ph68g label{background:#262626;color:#eee}`;
let styled=false;
function open(){ if(!styled){ const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st); styled=true; } try{ CRHome.setMode("app",true); }catch(e){} const p=CR52.show("photo68"); paint(p); }
function paint(p){ p=p||$("photo68"); if(!p) return; const s=LG();
  p.innerHTML=`<h2>🖼 My photo board</h2><div id="ph68pv">${preview()}</div><p class="ph68m" id="ph68m">${s.board||Object.keys(s.pieces).length?"This is how your board looks now.":"This is the normal board. Add your own photos below."}</p>
   <label class="ph68b">📷 Pick a board photo<input type="file" accept="image/*" id="ph68bf"></label>
   <h3 style="margin:14px 0 2px">Piece photos</h3><p class="co17sm" style="margin:0">Tap a piece to use a photo for it. Each photo fills its square, with a thin white edge (White pieces) or a dark edge (Black).</p>
   <div class="ph68g">${KEYS.map(k=>`<label>${`<svg viewBox="0 0 45 45"><use href="#pc-${k}"/></svg>`}${k[0]==="w"?"White":"Black"} ${PN[k[1]].toLowerCase()}${s.pieces[k]?" ✓":""}<input type="file" accept="image/*" data-k="${k}"></label>`).join("")}</div>
   <button class="ph68b gray" id="ph68rb">Reset board photo</button><button class="ph68b gray" id="ph68rp">Reset piece photos</button><button class="ph68b gray" id="ph68ra">↩ Reset everything to the normal board</button>
   <p class="co17sm">Your photos stay on this phone only. They show on the flat board (not the 3D one).</p>`;
  const msg=t=>{ const m=$("ph68m"); if(m) m.textContent=t; };
  $("ph68bf").onchange=async e=>{ const f=e.target.files[0]; if(!f) return; msg("Getting your photo ready…"); try{ const d=await shrink(f,"board"); const s2=LG(); s2.board=d; if(!SV(s2)) return msg("Not enough space on this phone for that photo."); apply(); paint(); msg("Board photo added. ✓"); }catch(x){ msg("That file is not a picture we can use."); } };
  p.querySelectorAll("input[data-k]").forEach(inp=>inp.onchange=async e=>{ const f=e.target.files[0], k=inp.dataset.k; if(!f) return; msg("Getting your photo ready…"); try{ const d=await shrink(f,"piece",k[0]); const s2=LG(); s2.pieces[k]=d; if(!SV(s2)) return msg("Not enough space on this phone for that photo."); apply(); paint(); msg(`${k[0]==="w"?"White":"Black"} ${PN[k[1]].toLowerCase()} photo added. ✓`); }catch(x){ msg("That file is not a picture we can use."); } });
  $("ph68rb").onclick=()=>{ const s2=LG(); s2.board=""; SV(s2); apply(); paint(); msg("Board photo removed."); };
  $("ph68rp").onclick=()=>{ const s2=LG(); s2.pieces={}; SV(s2); apply(); paint(); msg("Piece photos removed."); };
  $("ph68ra").onclick=()=>{ try{ localStorage.removeItem(K); }catch(e){} apply(); paint(); msg("Back to the normal board."); }; }
window.CRPhoto={open,apply,_set:(o)=>{ SV(Object.assign(LG(),o)); apply(); }};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",apply); else apply();
})();
