/* v19: real 3D board (three.js WebGL). Mirrors any <svg class="b3d"> board: reads its pieces/highlights/arrows,
   draws a wooden board with Staunton pieces on top, and maps taps back to the SVG squares.
   Flat 2D stays available via the "3D pieces" toggle (localStorage cr.pieces3d); falls back to flat if WebGL fails. */
(function(){
"use strict";
if(window.B3D) return;
const MK="cr.board";
function mode(){ let m=null; try{ if(localStorage.getItem("cr.board69")!=="1"){ if(localStorage.getItem(MK)==="toon") localStorage.setItem(MK,"flat"); localStorage.setItem("cr.board69","1"); } if(localStorage.getItem("cr.board51")!=="1"){ localStorage.setItem(MK,"flat"); localStorage.setItem("cr.pieces3d","0"); localStorage.setItem("cr.board51","1"); } m=localStorage.getItem(MK); }catch(e){}
  if(m!=="flat"&&m!=="stand"&&m!=="gl"&&m!=="toon"){ let o=null; try{ o=localStorage.getItem("cr.pieces3d"); }catch(e){} m="flat"; try{ localStorage.setItem(MK,m); }catch(e){} }
  return m; }
const B3D=window.B3D={mode,views:new Map(),ready:false,failed:false,active:svg=>{const v=B3D.views.get(svg);return !!(v&&v.on);}};
let T=null, R=null, loading=null, ENV=null;
const css=document.createElement("style");
css.textContent=`body.p3d svg.b3d.gl3d{transform:none!important;opacity:0!important;margin-top:0!important;touch-action:none}
.gl3dc{position:absolute;pointer-events:none;z-index:1}
.gl3dt{position:absolute;z-index:2;display:flex;gap:4px;pointer-events:auto}
.gl3dt button{width:34px;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,.5);background:rgba(30,22,16,.6);color:#fff;font-size:17px;line-height:1;padding:0;cursor:pointer}`;
css.textContent+=`.bs21{display:flex!important;flex-direction:column;align-items:stretch!important;gap:6px!important}.bs21 b{font-size:15px}.bs21r{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.bs21r button{font:inherit;min-height:56px;border-radius:10px;border:2px solid var(--line,#ddd);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:700;font-size:14px;color:#222;cursor:pointer}
.bs21r button small{font-weight:400;font-size:11px;color:#777}.bs21r button.on{border-color:#3b6fb6;background:#e8f1fb}`;

css.textContent+=`body.toon svg.b3d{background:var(--wcbg,#fbf3e6) center/100% 100%;border-radius:6px;box-shadow:0 1px 6px rgba(60,40,20,.25)}
body.toon svg.b3d rect[fill="#f0d9b5"],body.toon svg.b3d rect[fill="#b58863"]{fill-opacity:0}
body.toon svg.b3d text{fill:#5a4a3a!important;opacity:.8}
body.toon svg.b3d use[href^="#pc-"]{filter:none!important}
.bs21r{grid-template-columns:1fr 1fr 1fr 1fr!important}.bs21r button{font-size:13px!important}`;
document.head.appendChild(css);
function setMode(m){ try{ localStorage.setItem(MK,m); }catch(e){} const d3=m==="gl"||m==="stand"; applyToon(m==="toon"); if(window.P3D) P3D.set(d3); else document.body.classList.toggle("p3d",d3); scan(); B3D.views.forEach(v=>v.on&&update(v,true)); picker(); }
B3D.setMode=setMode;
// v51: Watercolour board style (internal id "toon") - original storybook ink pieces drawn here, swapped into the shared #pc-* symbols
const WCP=(t,w)=>{ const F=w?"url(#wcW)":"url(#wcB)", S="#2a2420", A=w?"#7a5a3a":"#f4f1ea";
  const K=`fill="${F}" stroke="${S}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"`;
  const base=`<path d="M10.5 39.5h24v-2.6q0-2.2-2.2-2.2H12.7q-2.2 0-2.2 2.2z" ${K}/><path d="M13 34.7q9.5-2.4 19 0" fill="none" stroke="${S}" stroke-width="1"/>`;
  let b="";
  if(t==="P") b=`<path d="M17 34.5Q19 27 20.2 21.5h4.6Q26 27 28 34.5z" ${K}/><ellipse cx="22.5" cy="21" rx="5.8" ry="1.7" ${K}/><circle cx="22.5" cy="14.5" r="5" ${K}/>`;
  if(t==="R") b=`<path d="M15 34.5L16.6 16h11.8L30 34.5z" ${K}/><path d="M14 16V8.5h3.4v2.8h2.9V8.5h4.4v2.8h2.9V8.5H31V16z" ${K}/><path d="M16 21h13M15.6 27h13.8" stroke="${S}" stroke-width=".7" opacity=".55"/>`;
  if(t==="B") b=`<path d="M19.2 24Q20 30 16.5 34.5h12Q25 30 25.8 24z" ${K}/><ellipse cx="22.5" cy="23.5" rx="5.8" ry="1.7" ${K}/><path d="M22.5 7.5C29.5 11.5 29 19 26 22h-7C16 19 15.5 11.5 22.5 7.5z" ${K}/><circle cx="22.5" cy="5.8" r="1.9" ${K}/><path d="M22.5 12.5v5.5M20 15h5" stroke="${A}" stroke-width="1.3" stroke-linecap="round"/>`;
  if(t==="N") b=`<path d="M14.5 34.5Q14 27 17.5 22Q12.5 21.5 10.5 24Q8.5 22 10 18.5L16.5 10L17.5 5.8L20.8 9Q30 9.5 32.5 19Q34.5 27 31 34.5z" ${K}/><path d="M21 11Q27.5 13 29.5 21M23.5 10.5Q30 13.5 31 22" fill="none" stroke="${S}" stroke-width=".7" opacity=".6"/><circle cx="18.2" cy="13.8" r="1.1" fill="${S}"/><path d="M11.6 21.4l1.2-.4" stroke="${S}" stroke-width="1"/>`+(w?"":`<path d="M24 28l1.6-2.2 1.6 2.2-1.6 2.2z" fill="${A}"/>`);
  if(t==="Q") b=`<path d="M16 34.5Q19.5 27 18 19h9Q25.5 27 29 34.5z" ${K}/><path d="M13.5 10.5L17 19h11l3.5-8.5-4.8 3.8L22.5 8l-4.2 6.3z" ${K}/><circle cx="13.5" cy="10" r="1.7" ${K}/><circle cx="22.5" cy="7" r="1.7" ${K}/><circle cx="31.5" cy="10" r="1.7" ${K}/><path d="M20.5 16.8l2-1.8 2 1.8-2 1.8z" fill="${A}"/>`;
  if(t==="K") b=`<path d="M16 34.5Q19.5 27 18 19.5h9Q25.5 27 29 34.5z" ${K}/><path d="M16.5 19.5Q15 11.5 22.5 10.5Q30 11.5 28.5 19.5z" ${K}/><path d="M17 17h11" stroke="${S}" stroke-width=".8"/><path d="M22.5 3v6.5M20 5.6h5" stroke="${S}" stroke-width="2.6" stroke-linecap="round"/><path d="M22.5 3.6v5.4M20.6 5.6h3.8" stroke="${w?"#e9d3ae":"#f4f1ea"}" stroke-width="1" stroke-linecap="round"/>`;
  // second, slightly offset faint ink pass for a hand-drawn look
  const sk=b.replace(/fill="url\(#wc[WB]\)"/g,'fill="none"').replace(/stroke-width="1.3"/g,'stroke-width=".6"');
  return base+b+`<g transform="translate(.35 .25)" opacity=".35">${sk}</g>`; };
function wcBoard(){ const S=90, c=document.createElement("canvas"); c.width=c.height=S*8; const x=c.getContext("2d"); let sd=7; const r=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  x.fillStyle="#fbf3e6"; x.fillRect(0,0,S*8,S*8);
  for(let j=0;j<8;j++) for(let i=0;i<8;i++){ const dark=(i+j)%2===1, X=i*S, Y=j*S;
    x.save(); x.beginPath(); x.rect(X+1,Y+1,S-2,S-2); x.clip();
    x.fillStyle=dark?"#9cc2e6":"#fbe9d4"; x.fillRect(X,Y,S,S);
    const cols=dark?["#7fa9dc","#a99ad8","#6f9ad0","#b8d4ee"]:["#f6cfa8","#f8dcae","#f3c4b4","#fff4e2"];
    x.filter="blur(6px)"; for(let k=0;k<7;k++){ x.globalAlpha=.25+r()*.3; x.fillStyle=cols[k%4]; x.beginPath(); x.ellipse(X+r()*S,Y+r()*S,10+r()*30,8+r()*24,r()*3,0,7); x.fill(); }
    x.filter="blur(1.5px)"; x.globalAlpha=.35; x.strokeStyle=dark?"#5f88c0":"#e8b98e"; x.lineWidth=2; for(let k=0;k<5;k++){ x.globalAlpha=.12+r()*.12; x.fillStyle=cols[(k+1)%4]; x.beginPath(); x.ellipse(X+r()*S,Y+r()*S,4+r()*10,3+r()*8,r()*3,0,7); x.fill(); }
    x.restore(); }
  x.filter="none"; x.globalAlpha=1; return c.toDataURL("image/jpeg",.8); }
let WCURL=null; const TOONORIG={};
function applyToon(on){ document.body.classList.toggle("toon",on);
  if(on&&!WCURL){ try{ WCURL=wcBoard(); document.body.style.setProperty("--wcbg",`url(${WCURL})`); }catch(e){} }
  if(on&&!document.getElementById("wcDefs")){ const d=document.createElementNS("http://www.w3.org/2000/svg","svg"); d.id="wcDefs"; d.setAttribute("width","0"); d.setAttribute("height","0"); d.style.position="absolute";
    d.innerHTML=`<defs><linearGradient id="wcW" x1="0" x2="1" y1="0" y2=".3"><stop offset="0" stop-color="#fff7e6"/><stop offset=".55" stop-color="#f1d9b0"/><stop offset="1" stop-color="#d9b07c"/></linearGradient><linearGradient id="wcB" x1="0" x2="1" y1="0" y2=".3"><stop offset="0" stop-color="#6b6a70"/><stop offset=".5" stop-color="#3f3e44"/><stop offset="1" stop-color="#26252a"/></linearGradient></defs>`; document.body.appendChild(d); }
  "PNBRQK".split("").forEach(t=>["w","b"].forEach(c=>{ const s=document.getElementById("pc-"+c+t); if(!s) return;
    if(!(s.id in TOONORIG)) TOONORIG[s.id]=s.innerHTML;
    const want=on?`<g class="wcpc">${WCP(t,c==="w")}</g>`:TOONORIG[s.id]; if(s.innerHTML!==want) s.innerHTML=want; })); }
B3D.applyToon=applyToon;

// "Board style" picker replaces the old 3D checkbox on the home screen
function picker(){ document.querySelectorAll(".set3d").forEach(d=>{ const m=mode();
  if(!d.classList.contains("bs21")){ d.classList.add("bs21"); d.innerHTML=`<b>♟ Board style</b><div class="bs21r" role="radiogroup" aria-label="Board style">
   <button type="button" data-bs="flat" role="radio">▦ Flat<small>classic 2D</small></button><button type="button" data-bs="stand" role="radio">♞ Standing<small>tilted pieces</small></button><button type="button" data-bs="gl" role="radio">♛ 3D<small>wooden board</small></button><button type="button" data-bs="toon" role="radio">🎨 Watercolour<small>storybook</small></button></div>`;
   d.addEventListener("click",e=>{ const b=e.target.closest("[data-bs]"); if(b){ e.stopPropagation(); setMode(b.dataset.bs); } }); }
  d.querySelectorAll("[data-bs]").forEach(b=>{ const on=b.dataset.bs===m; b.classList.toggle("on",on); b.setAttribute("aria-checked",on); }); }); }
function want(svg){ return mode()==="gl"&&document.body.classList.contains("p3d")&&!B3D.failed&&svg.isConnected&&svg.classList.contains("b3d")&&!svg.classList.contains("flat3d"); }
function load(){ if(loading) return loading; const base=(document.currentScript&&document.currentScript.src)||location.href;
  loading=import(new URL("three.module.min.js",SRC).href).then(m=>{ T=m; init(); return loadModels(); }).then(()=>{ B3D.ready=true; }).catch(e=>{ console.warn("3D board off:",e); fail(); }); return loading; }
const SRC=(document.currentScript&&document.currentScript.src)||location.href;
function fail(){ B3D.failed=true; B3D.views.forEach(v=>detach(v)); document.body.classList.remove("p3d"); }

/* ---------- shared resources ---------- */
let G={};
function init(){
  const c=document.createElement("canvas");
  R=new T.WebGLRenderer({canvas:c,antialias:true,alpha:true,powerPreference:"low-power"});
  if(!R.getContext()) throw new Error("no webgl");
  R.outputColorSpace=T.SRGBColorSpace; R.toneMapping=T.ACESFilmicToneMapping; R.toneMappingExposure=.9;
  R.shadowMap.enabled=true; R.shadowMap.type=T.PCFSoftShadowMap;
  const pm=new T.PMREMGenerator(R); ENV=pm.fromScene(roomEnv(),0.04).texture; pm.dispose();
  const wt=(c1,c2,sd)=>{ const t=new T.CanvasTexture(woodCanvas(256,256,c1,c2,sd,false)); t.colorSpace=T.SRGBColorSpace; t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=4; return t; }; const wb=sd=>{ const t=new T.CanvasTexture(woodCanvas(256,256,[200,200,200],[40,40,40],sd,false)); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }; G.ivory=new T.MeshPhysicalMaterial({map:wt([205,152,88],[120,72,30],3),bumpMap:wb(3),bumpScale:.8,roughness:.55,clearcoat:.6,clearcoatRoughness:.2,envMapIntensity:.35,sheen:.2,sheenColor:0xffe2b0});
  G.ebony=new T.MeshPhysicalMaterial({map:wt([92,48,26],[38,16,8],11),bumpMap:wb(11),bumpScale:.6,roughness:.45,metalness:0,clearcoat:.85,clearcoatRoughness:.1,envMapIntensity:.8,specularIntensity:.8});
  G.groove=new T.MeshStandardMaterial({color:0x140c08,roughness:.6}); G.geo={}; "PNBRQK".split("").forEach(t=>G.geo[t]=pieceParts(t)); G.model=false;
  G.blob=new T.CanvasTexture(blobCanvas()); G.blob.colorSpace=T.SRGBColorSpace;
  G.glow=new T.CanvasTexture(blobCanvas("230,40,30")); 
  G.woodSq=woodSquares(); G.frameTex=new T.CanvasTexture(woodCanvas(512,512,[78,46,26],[52,29,15],9,true));
  G.frameTex.colorSpace=T.SRGBColorSpace; G.frameTex.wrapS=G.frameTex.wrapT=T.RepeatWrapping; G.frameTex.repeat.set(1/9.4,1/9.4); G.frameTex.offset.set(.5,.5);
}
// Staunton models: Poly Haven "Chess Set" by Riley Queen, CC0 (polyhaven.com/a/chess_set). Packed as int16 positions + int8 normals.
const PH={R:[2016,8928,0],P:[1028,4920,36000],B:[1838,8772,55092],Q:[1827,8820,89180],K:[2643,12516,123268],N:[1705,7986,172092]}, MS=.8;
function loadModels(){ return fetch(new URL("pieces.bin",SRC).href).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(buf=>{
  for(const t in PH){ const [nv,ni,o]=PH[t]; const q=new Int16Array(buf,o,nv*3), n=new Int8Array(buf,o+nv*6,nv*3); const io=o+nv*6+nv*3+((-nv*3)%4+4)%4; const ix=new Uint16Array(buf,io,ni);
    const pos=new Float32Array(nv*3), nor=new Float32Array(nv*3); for(let i=0;i<nv*3;i++){ pos[i]=q[i]/32767*2*MS; nor[i]=n[i]/127; }
    const uv=new Float32Array(nv*2); for(let i=0;i<nv;i++){ uv[2*i]=pos[3*i+1]*1.6; uv[2*i+1]=(Math.atan2(pos[3*i+2],pos[3*i])/(2*Math.PI)+.5)*1.5; } const g=new T.BufferGeometry(); g.setAttribute("uv",new T.BufferAttribute(uv,2)); g.setAttribute("position",new T.BufferAttribute(pos,3)); g.setAttribute("normal",new T.BufferAttribute(nor,3)); g.setIndex(new T.BufferAttribute(new Uint16Array(ix),1)); g.computeBoundingSphere();
    G.geo[t]=[g]; } G.model=true; }).catch(e=>console.warn("3D models unavailable, using built-in pieces",e)); }
function roomEnv(){ const s=new T.Scene(), g=new T.BoxGeometry(); g.deleteAttribute("uv");
  const room=new T.Mesh(g,new T.MeshStandardMaterial({side:T.BackSide,color:0x4a4038})); room.position.set(0,13,0); room.scale.set(32,28,28); s.add(room);
  const L=(x,y,z,sx,sy,sz,i)=>{ const m=new T.MeshBasicMaterial(); m.color.setScalar(i); const b=new T.Mesh(g,m); b.position.set(x,y,z); b.scale.set(sx,sy,sz); s.add(b); };
  L(-16,14,8,.1,2.4,2.7,40); L(-16,18,-8,.1,2.4,2.7,30); L(15,12,-2,.15,4.3,6.3,14); L(0,9,14.5,4.4,5.4,.1,30); L(3,11.5,-12.5,2.5,2,.1,14); L(0,20,0,1,.1,1,80);
  s.add(new T.PointLight(0xffffff,600,28,2)); return s; }
function blobCanvas(rgb){ const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
  const g=x.createRadialGradient(64,64,4,64,64,64); const k=rgb||"0,0,0"; g.addColorStop(0,`rgba(${k},${rgb?.9:.75})`); g.addColorStop(.45,`rgba(${k},${rgb?.45:.4})`); g.addColorStop(1,`rgba(${k},0)`);
  x.fillStyle=g; x.fillRect(0,0,128,128); return c; }
function rnd(s){ return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
function woodCanvas(w,h,c1,c2,seed,swirl){ const c=document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d"), r=rnd(seed*7919+1);
  x.fillStyle=`rgb(${c1})`; x.fillRect(0,0,w,h);
  for(let i=0;i<w*0.9;i++){ const y0=r()*h, a=.05+r()*.13, amp=2+r()*(swirl?14:6), f=.004+r()*.01, ph=r()*6;
    x.strokeStyle=`rgba(${c2},${a})`; x.lineWidth=.6+r()*2.2; x.beginPath();
    for(let px=0;px<=w;px+=8){ const py=y0+Math.sin(px*f+ph)*amp+Math.sin(px*f*3.1+ph*2)*amp*.3; px?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }
  const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,"rgba(255,240,210,.06)"); g.addColorStop(1,"rgba(0,0,0,.08)"); x.fillStyle=g; x.fillRect(0,0,w,h); return c; }
function woodSquares(){ const S=128, c=document.createElement("canvas"); c.width=c.height=S*8; const x=c.getContext("2d");
  for(let j=0;j<8;j++) for(let i=0;i<8;i++){ const light=(i+j)%2===0;
    const w=light?woodCanvas(S,S,[226,190,138],[176,128,74],i*8+j+3,false):woodCanvas(S,S,[132,86,50],[78,46,24],i*8+j+77,false);
    x.save(); x.translate(i*S+S/2,j*S+S/2); if((i+j)%4<2) x.rotate(Math.PI/2); x.drawImage(w,-S/2,-S/2); x.restore();
    x.strokeStyle="rgba(40,20,8,.35)"; x.lineWidth=1; x.strokeRect(i*S+.5,j*S+.5,S-1,S-1); }
  return c; }

/* ---------- Staunton pieces (lathe profiles + sculpted knight) ---------- */
function base(r){ return [[0,0],[r,0],[r,.028],[r*.95,.042],[r*.975,.058],[r*.9,.075],[r*.8,.088],[r*.83,.1],[r*.83,.112],[r*.7,.13]]; }
const PROF={
 P:base(.29).concat([[.165,.16],[.12,.205],[.09,.28],[.078,.35],[.145,.372],[.15,.392],[.09,.405],[.075,.42],[0,.425]]),
 R:base(.32).concat([[.2,.16],[.165,.215],[.148,.3],[.145,.43],[.152,.48],[.2,.515],[.21,.54],[.185,.555],[.2,.575],[.205,.6],[.2,.715],[.15,.715],[.15,.67],[0,.67]]),
 N:base(.31).concat([[.2,.16],[.175,.19],[.2,.215],[.2,.24],[.17,.25],[0,.25]]),
 B:base(.3).concat([[.17,.16],[.12,.215],[.088,.32],[.07,.47],[.14,.497],[.146,.517],[.08,.53],[.15,.548],[.155,.568],[.085,.583],[.098,.61],[.13,.67],[.14,.72],[.125,.79],[.085,.85],[.04,.885],[0,.895]]),
 Q:base(.33).concat([[.2,.16],[.14,.225],[.098,.36],[.08,.6],[.16,.632],[.166,.656],[.092,.672],[.152,.69],[.158,.71],[.09,.725],[.1,.755],[.14,.83],[.19,.935],[.175,.948],[.13,.952],[.1,.96],[0,.965]]),
 K:base(.34).concat([[.21,.16],[.15,.23],[.108,.38],[.088,.68],[.17,.712],[.177,.737],[.1,.752],[.162,.768],[.168,.79],[.1,.805],[.108,.835],[.15,.905],[.178,.99],[.16,1.002],[.13,1.015],[.07,1.04],[.068,1.07],[.1,1.08],[.1,1.098],[0,1.1]])};
function lathe(pr){ return new T.LatheGeometry(pr.map(p=>new T.Vector2(p[0],p[1])),44); }
function pieceParts(t){ const parts=[lathe(PROF[t])]; const sph=(r,y,x=0,z=0)=>{ const g=new T.SphereGeometry(r,22,14); g.translate(x,y,z); return g; };
  const ring=(n,rad,y,f)=>{ for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; parts.push(f(a,Math.cos(a)*rad,y,Math.sin(a)*rad)); } };
  if(t==="P") parts.push(sph(.122,.53));
  if(t==="B"){ parts.push(sph(.038,.925)); const g2=new T.CylinderGeometry(.148,.148,.022,32); g2.rotateZ(-.62); g2.translate(.025,.75,0); g2.__groove=1; parts.push(g2); }
  if(t==="Q"){ ring(9,.168,.985,(a,x,y,z)=>{ const c=new T.ConeGeometry(.03,.09,10); c.translate(x,y,z); return c; }); ring(9,.168,1.035,(a,x,y,z)=>sph(.022,y,x,z)); parts.push(sph(.052,1.0)); }
  if(t==="K"){ const v=new T.BoxGeometry(.045,.24,.045); v.translate(0,1.2,0); const h=new T.BoxGeometry(.16,.045,.045); h.translate(0,1.24,0); parts.push(v,h); }
  if(t==="R"){ ring(5,.176,.745,(a,x,y,z)=>{ const b=new T.BoxGeometry(.1,.06,.05); b.rotateY(-a+Math.PI/2); b.translate(x,y,z); return b; }); }
  if(t==="N"){ const s=new T.Shape(); const P=[[-.165,.24],[-.185,.4],[-.17,.55],[-.13,.68],[-.095,.78],[-.072,.87],[-.05,.97],[-.02,.89],[.015,.935],[.035,.86],[.095,.81],[.18,.73],[.26,.635],[.3,.565],[.292,.51],[.25,.488],[.18,.505],[.115,.47],[.092,.41],[.125,.33],[.155,.24]];
    s.moveTo(P[0][0],P[0][1]); P.slice(1).forEach(p=>s.lineTo(p[0],p[1])); s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:.11,bevelEnabled:true,bevelThickness:.05,bevelSize:.04,bevelSegments:4,curveSegments:8}); g.translate(0,0,-.055); parts.push(g);
    for(let k=0;k<7;k++){ const u=k/6; parts.push(sph(.034,.42+u*.42,-.19+u*.11,0)); } // mane
    parts.push(sph(.024,.73,.115,.085),sph(.024,.73,.115,-.085),sph(.018,.53,.28,.05),sph(.018,.53,.28,-.05)); } // eyes, nostrils
  return parts; }
function makePiece(code,orient){ const t=code[1], white=code[0]==="w"; const g=new T.Group(); const mat=white?G.ivory:G.ebony;
  G.geo[t].forEach(geo=>{ const m=new T.Mesh(geo,geo.__groove?G.groove:mat); m.userData.base=m.material; m.castShadow=true; m.receiveShadow=true; g.add(m); });
  const faceUp=(white===(orient==="w")); if(t==="N") g.rotation.y=G.model?(faceUp?Math.PI:0):(faceUp?Math.PI/2:-Math.PI/2);
  if(t==="B"&&!G.model) g.rotation.y=Math.PI/4;
  const s=G.model?1.3:1.5; g.scale.set(s,s,s); g.userData={code,mat}; return g; }

/* ---------- a view per SVG board ---------- */
const ZMAX=3.5, TOP=.361, PDEF=36*Math.PI/180;
function attach(svg){
  const v={svg,on:false,az:0,pol:PDEF,P:new Map(),anims:[],orient:"w",key:""};
  B3D.views.set(svg,v);
  load().then(()=>{ if(B3D.failed||!want(svg)) return; try{ build(v); }catch(e){ console.warn(e); fail(); } });
  return v; }
function build(v){
  const sc=v.scene=new T.Scene(); sc.environment=ENV;
  v.cam=new T.PerspectiveCamera(34,1,.1,100);
  sc.add(new T.HemisphereLight(0xfff4e0,0x3a2a1c,.45)); { const F=new T.DirectionalLight(0xffe6c8,.6); F.position.set(5,4,6); sc.add(F); }
  const L=v.light=new T.DirectionalLight(0xfff2dc,1.9); L.position.set(-4,10,5); L.castShadow=true; L.shadow.mapSize.set(1024,1024);
  Object.assign(L.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:30}); L.shadow.radius=4; L.shadow.bias=-.0006; L.shadow.normalBias=.02; sc.add(L);
  // frame with bevel
  const W=9.4, sh=new T.Shape(), h=W/2, rr=.25; sh.moveTo(-h+rr,-h); sh.lineTo(h-rr,-h); sh.quadraticCurveTo(h,-h,h,-h+rr); sh.lineTo(h,h-rr); sh.quadraticCurveTo(h,h,h-rr,h); sh.lineTo(-h+rr,h); sh.quadraticCurveTo(-h,h,-h,h-rr); sh.lineTo(-h,-h+rr); sh.quadraticCurveTo(-h,-h,-h+rr,-h);
  const fg=new T.ExtrudeGeometry(sh,{depth:.24,bevelEnabled:true,bevelThickness:.06,bevelSize:.07,bevelSegments:3}); fg.rotateX(-Math.PI/2); fg.translate(0,.06,0);
  const fm=new T.MeshPhysicalMaterial({map:G.frameTex,roughness:.45,clearcoat:.6,clearcoatRoughness:.25}); const frame=new T.Mesh(fg,fm); frame.receiveShadow=true; sc.add(frame);
  // inlay line + playing surface
  v.tc=document.createElement("canvas"); v.tc.width=v.tc.height=1024; v.tex=new T.CanvasTexture(v.tc); v.tex.colorSpace=T.SRGBColorSpace; v.tex.anisotropy=4;
  const top=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshPhysicalMaterial({map:v.tex,roughness:.42,clearcoat:.35,clearcoatRoughness:.3})); top.rotation.x=-Math.PI/2; top.position.y=TOP; top.receiveShadow=true; sc.add(top); v.top=top;
  v.lc=document.createElement("canvas"); v.lc.width=v.lc.height=1024; v.ltex=new T.CanvasTexture(v.lc); v.ltex.colorSpace=T.SRGBColorSpace;
  const lab=new T.Mesh(new T.PlaneGeometry(W,W),new T.MeshBasicMaterial({map:v.ltex,transparent:true,depthWrite:false})); lab.rotation.x=-Math.PI/2; lab.position.y=TOP-.0005; sc.add(lab);
  v.pg=new T.Group(); sc.add(v.pg);
  v.glow=new T.Mesh(new T.PlaneGeometry(1.5,1.5),new T.MeshBasicMaterial({map:G.glow,transparent:true,depthWrite:false,blending:T.AdditiveBlending})); v.glow.rotation.x=-Math.PI/2; v.glow.position.y=TOP+.004; v.glow.visible=false; sc.add(v.glow);
  // 2D output canvas over the svg + rotate buttons
  const par=v.svg.parentNode; if(getComputedStyle(par).position==="static") par.style.position="relative";
  v.cv=document.createElement("canvas"); v.cv.className="gl3dc"; v.ctx=v.cv.getContext("2d"); par.insertBefore(v.cv,v.svg.nextSibling);
  v.tb=document.createElement("div"); v.tb.className="gl3dt"; v.tb.innerHTML=`<button type="button" data-z="-1" aria-label="Zoom out">−</button><button type="button" data-z="1" aria-label="Zoom in">+</button><button type="button" data-r="0" aria-label="Reset view">⌂</button>`;
  v.tb.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; e.stopPropagation(); if(b.dataset.z){ const z0=v.zoom||1, z1=Math.max(1,Math.min(ZMAX,z0*(+b.dataset.z>0?1.4:1/1.4))); if(z1===1){v.panX=0;v.panY=0;} else if(z0===1) v.panY=.25; anim(v,200,k=>{ v.zoom=z0+(z1-z0)*k; fit(v); }); return; } const d=+b.dataset.r; if(!d){ v.zoom=1; v.panX=0; v.panY=0; } turnTo(v,d?v.az+d*Math.PI/4:0,d?v.pol:PDEF); });
  par.insertBefore(v.tb,v.cv.nextSibling);
  v.ro=new ResizeObserver(()=>layout(v)); v.ro.observe(v.svg); v.ro.observe(par);
  wireOrbit(v);
  v.on=true; v.svg.classList.add("gl3d"); layout(v); update(v,true);
}
function detach(v){ if(!v) return; B3D.views.delete(v.svg); v.on=false; v.svg.classList.remove("gl3d");
  if(v.ro) v.ro.disconnect(); if(v.cv) v.cv.remove(); if(v.tb) v.tb.remove(); if(v.unOrbit) v.unOrbit();
  if(v.scene) v.scene.traverse(o=>{ if(o.isMesh&&!o.geometry.__shared){ /* frame/planes */ } }); if(v.tex) v.tex.dispose(); if(v.ltex) v.ltex.dispose(); }
function layout(v){ if(!v.on) return; const par=v.svg.parentNode, r=v.svg.getBoundingClientRect(), pr=par.getBoundingClientRect(); if(!r.width) return;
  const L=r.left-pr.left-par.clientLeft+par.scrollLeft, Tp=r.top-pr.top-par.clientTop+par.scrollTop;
  Object.assign(v.cv.style,{left:L+"px",top:Tp+"px",width:r.width+"px",height:r.height+"px"});
  Object.assign(v.tb.style,{left:(L+r.width-112)+"px",top:(Tp+4)+"px"});
  const dpr=Math.min(window.devicePixelRatio||1,2); const W=Math.round(r.width*dpr), H=Math.round(r.height*dpr);
  if(v.cv.width!==W||v.cv.height!==H){ v.cv.width=W; v.cv.height=H; }
  v.w=r.width; v.h=r.height; fit(v); req(v); }
function fit(v){ const c=v.cam; c.aspect=v.w/v.h; c.fov=34; const tg=new T.Vector3(0,.35,0);
  const pts=[]; for(const x of [-4.3,4.3]) for(const z of [-4.3,4.3]){ pts.push(new T.Vector3(x,.36,z)); }
  const place=d=>{ const s=Math.sin(v.pol); c.position.set(tg.x+d*s*Math.sin(v.az),tg.y+d*Math.cos(v.pol),tg.z+d*s*Math.cos(v.az)); c.up.set(0,1,0); c.lookAt(tg); c.updateProjectionMatrix(); c.updateMatrixWorld(); };
  c.clearViewOffset(); place(16); let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; const fw=1000*c.aspect, fh=1000;
  pts.forEach(p=>{ const q=p.clone().project(c); const px=(q.x+1)/2*fw, py=(1-q.y)/2*fh; x0=Math.min(x0,px); x1=Math.max(x1,px); y0=Math.min(y0,py); y1=Math.max(y1,py); });
  let w=(x1-x0)*1.0, h=(y1-y0)*1.0; if(w/h<c.aspect) w=h*c.aspect; else h=w/c.aspect;
  const Z=v.zoom=Math.max(1,Math.min(ZMAX,v.zoom||1)), mp=(1-1/Z)/2; v.panX=Math.max(-mp,Math.min(mp,v.panX||0)); v.panY=Math.max(-mp,Math.min(mp,v.panY||0));
  const cx=(x0+x1)/2+v.panX*w, cy=(y0+y1)/2+v.panY*h; w/=Z; h/=Z;
  c.setViewOffset(fw,fh,cx-w/2,cy-h/2,w,h); c.updateProjectionMatrix(); }
function turnTo(v,az,pol){ const a0=v.az,p0=v.pol; anim(v,300,k=>{ v.az=a0+(az-a0)*k; v.pol=p0+(pol-p0)*k; fit(v); }); }
function wireOrbit(v){ const s=v.svg; let o=null, blockClick=0;
  const dn=e=>{ if(!v.on) return; const f=frac(v,e,true); const off=!f||f[0]<0||f[0]>=1||f[1]<0||f[1]>=1; if(!off&&!e.ctrlKey&&e.button!==2) return;
    e.stopImmediatePropagation(); e.preventDefault(); o={x:e.clientX,y:e.clientY,az:v.az,pol:v.pol,id:e.pointerId,moved:0}; try{ s.setPointerCapture(e.pointerId); }catch(_){} };
  const mv=e=>{ if(!o||e.pointerId!==o.id) return; e.stopImmediatePropagation(); const dx=e.clientX-o.x, dy=e.clientY-o.y; o.moved=Math.max(o.moved,Math.abs(dx)+Math.abs(dy));
    v.az=0; v.pol=Math.max(15*Math.PI/180,Math.min(55*Math.PI/180,o.pol-dy/v.h*Math.PI*.8)); fit(v); req(v); };
  const up=e=>{ if(!o||e.pointerId!==o.id) return; e.stopImmediatePropagation(); o=null; blockClick=Date.now(); };
  const ck=e=>{ if(Date.now()-blockClick<400){ e.stopImmediatePropagation(); e.preventDefault(); } };
  let pz=null; const tl=e=>[...e.touches].slice(0,2), dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  const ts=e=>{ if(!v.on||e.touches.length<2) return; e.preventDefault(); e.stopImmediatePropagation(); o=null; const t=tl(e); pz={d:dist(t),z:v.zoom||1,mx:(t[0].clientX+t[1].clientX)/2,my:(t[0].clientY+t[1].clientY)/2,px:v.panX||0,py:v.panY||0}; };
  const tm=e=>{ if(!pz||e.touches.length<2) return; e.preventDefault(); e.stopImmediatePropagation(); const t=tl(e); v.zoom=Math.max(1,Math.min(ZMAX,pz.z*dist(t)/pz.d));
    const mx=(t[0].clientX+t[1].clientX)/2, my=(t[0].clientY+t[1].clientY)/2; v.panX=pz.px-(mx-pz.mx)/v.w/v.zoom; v.panY=pz.py-(my-pz.my)/v.h/v.zoom; if(v.zoom===1){v.panX=0;v.panY=0;} fit(v); req(v); };
  const te=e=>{ if(!pz) return; e.stopImmediatePropagation(); if(e.touches.length<2){ pz=null; blockClick=Date.now(); } };
  s.addEventListener("touchstart",ts,{capture:true,passive:false}); s.addEventListener("touchmove",tm,{capture:true,passive:false}); s.addEventListener("touchend",te,true); s.addEventListener("touchcancel",te,true);
  s.addEventListener("pointerdown",dn,true); s.addEventListener("pointermove",mv,true); s.addEventListener("pointerup",up,true); s.addEventListener("pointercancel",up,true); s.addEventListener("click",ck,true);
  v.unOrbit=()=>{ s.removeEventListener("touchstart",ts,true); s.removeEventListener("touchmove",tm,true); s.removeEventListener("touchend",te,true); s.removeEventListener("touchcancel",te,true); s.removeEventListener("pointerdown",dn,true); s.removeEventListener("pointermove",mv,true); s.removeEventListener("pointerup",up,true); s.removeEventListener("pointercancel",up,true); s.removeEventListener("click",ck,true); }; }
// event -> [u,v] fraction in the SVG's own square space (same as flat boards)
function frac(v,ev,planeOnly){ const r=v.cv.getBoundingClientRect(); if(!r.width) return null;
  const nd=new T.Vector2((ev.clientX-r.left)/r.width*2-1,-((ev.clientY-r.top)/r.height*2-1)); const rc=new T.Raycaster(); rc.setFromCamera(nd,v.cam);
  const p=new T.Vector3(); const onPlane=rc.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-TOP),p); const pf=onPlane?[(p.x+4)/8,(p.z+4)/8]:null;
  if(planeOnly) return pf;
  // what's at the board point: a piece base there wins (pieces in front can overlap squares behind them)
  let psq=null, sel=false; if(pf&&pf[0]>=0&&pf[0]<1&&pf[1]>=0&&pf[1]<1) psq=Math.floor(pf[0]*8)+","+Math.floor(pf[1]*8);
  v.P.forEach(e=>{ if(e.obj.position.y>TOP+.1) sel=true; });
  if(psq&&v.P.has(psq)) return pf;
  if(psq&&sel) return pf; // a piece is lifted: an empty square is a move target
  const hits=rc.intersectObjects(v.pg.children,true); for(const h of hits){ let o=h.object; while(o&&o.parent!==v.pg) o=o.parent; if(o&&o.userData.sq&&!o.userData.dying&&!(o.position.y>TOP+.1)){ const [i,j]=o.userData.sq; return [(i+.5)/8,(j+.5)/8]; } }
  return pf; }

/* ---------- reading the SVG ---------- */
const BASE=new Set(["#f0d9b5","#b58863"]);
function readSvg(v){ const s=v.svg, P=new Map();
  s.querySelectorAll('use[href^="#pc-"],use[*|href^="#pc-"]').forEach(u=>{ const c=(u.getAttribute("href")||u.getAttribute("xlink:href")).slice(4); const i=Math.round((+u.getAttribute("x")||0)/45), j=Math.round((+u.getAttribute("y")||0)/45); if(i>=0&&i<8&&j>=0&&j<8) P.set(i+","+j,c); });
  // orientation from coordinate labels, else from the kings
  let o=null; s.querySelectorAll("text").forEach(t=>{ const x=+t.getAttribute("x"), y=+t.getAttribute("y"), c=t.textContent.trim(); if(y>340&&x<46&&/^[a-h]$/.test(c)) o=c==="a"?"w":"b"; });
  if(!o){ let wk=null; P.forEach((c,k)=>{ if(c==="wK") wk=+k.split(",")[1]; }); o=wk==null?v.orient:(wk>=4?"w":"b"); }
  // selected piece: legal-move dots are shown + a highlight under a piece
  let sel=null; const dots=s.querySelector('circle[r="8"]');
  if(dots) s.querySelectorAll('rect[opacity]').forEach(r=>{ const f=(r.getAttribute("fill")||"").toLowerCase(); if(f!=="#f5c518"&&f!=="#3b6fb6") return; const k=Math.round(+r.getAttribute("x")/45)+","+Math.round(+r.getAttribute("y")/45); if(P.has(k)) sel=k; });
  // overlay = everything except base squares, labels and pieces
  const cl=s.cloneNode(true); cl.querySelectorAll('use[href^="#pc-"],text').forEach(n=>n.remove());
  cl.querySelectorAll("rect").forEach(r=>{ if(!r.hasAttribute("opacity")&&BASE.has((r.getAttribute("fill")||"").toLowerCase())&&+r.getAttribute("width")===45) r.remove(); });
  // the check circle is drawn by us as a glow instead
  cl.querySelectorAll('circle[fill="#e53935"]').forEach(n=>n.remove());
  const body=cl.innerHTML.trim(); return {P,orient:o,sel,ov:body}; }
function ovSvg(body){ const used=new Set((body.match(/url\(#([\w-]+)\)/g)||[]).map(m=>m.slice(5,-1))); let defs="";
  used.forEach(id=>{ const n=document.getElementById(id); if(n) defs+=n.outerHTML; });
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 360 360" width="1024" height="1024"><defs>${defs}</defs>${body}</svg>`; }

function sqPos(k){ const [i,j]=k.split(",").map(Number); return [i-3.5,j-3.5]; }
function update(v,first){ if(!v.on) return; const st=readSvg(v); const orientChanged=st.orient!==v.orient; v.orient=st.orient;
  // pieces: diff old -> new, animate moves, fade captures
  const old=v.P, nw=st.P, gone=[], added=[];
  if(orientChanged||first){ old.forEach(e=>v.pg.remove(e.obj)); old.clear(); }
  old.forEach((e,k)=>{ if(nw.get(k)!==e.code) gone.push(k); }); nw.forEach((c,k)=>{ const e=old.get(k); if(!e||e.code!==c) added.push(k); });
  const NP=new Map(); old.forEach((e,k)=>{ if(!gone.includes(k)) NP.set(k,e); });
  const quiet=first||orientChanged||added.length>6||REDUCED;
  added.forEach(k=>{ const c=nw.get(k); let bi=-1,bd=1e9; gone.forEach((g,ix)=>{ if(g&&old.get(g).code===c){ const a=sqPos(g),b=sqPos(k), d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(d<bd){bd=d;bi=ix;} } });
    const [x,z]=sqPos(k);
    if(bi>=0&&!quiet){ const e=old.get(gone[bi]); gone[bi]=null; const ob=e.obj, sx=ob.position.x, sz=ob.position.z, sy=ob.position.y; ob.userData.sq=k.split(",").map(Number);
      const hop=e.code[1]==="N"?.45:.12; anim(v,250,t=>{ ob.position.set(sx+(x-sx)*t,TOP+(sy-TOP)*(1-t)+Math.sin(t*Math.PI)*hop,sz+(z-sz)*t); }); NP.set(k,e); }
    else { const ob=makePiece(c,v.orient); ob.position.set(x,TOP,z); ob.userData.sq=k.split(",").map(Number); addBlob(ob); v.pg.add(ob); NP.set(k,{code:c,obj:ob});
      if(!quiet) fade(v,ob,0,1,200); } });
  gone.forEach(g=>{ if(!g) return; const e=old.get(g); if(quiet){ v.pg.remove(e.obj); return; } e.obj.userData.dying=1; fade(v,e.obj,1,0,260,()=>v.pg.remove(e.obj)); });
  v.P=NP;
  // selected piece lifts
  NP.forEach((e,k)=>{ const want=k===st.sel?TOP+.35:TOP; const ob=e.obj; if(Math.abs(ob.position.y-want)>.001&&!ob.userData.dying){ const y0=ob.position.y; anim(v,150,t=>{ ob.position.y=y0+(want-y0)*t; }); } });
  // check glow
  const chk=inCheck(NP,v.orient); NP.forEach(e=>{ if(e.code[1]==="K") setGlow(e.obj,false); });
  if(chk){ const e=NP.get(chk); setGlow(e.obj,true); const [x,z]=sqPos(chk); v.glow.position.x=x; v.glow.position.z=z; v.glow.visible=true; } else v.glow.visible=false;
  // board surface + labels
  if(orientChanged||first) labels(v);
  if(st.ov!==v.key||first){ v.key=st.ov; paintTop(v,st.ov); }
  req(v); }
function addBlob(ob){ const m=new T.Mesh(new T.PlaneGeometry(.95,.95),new T.MeshBasicMaterial({map:G.blob,transparent:true,depthWrite:false,opacity:.8})); m.rotation.x=-Math.PI/2; m.position.y=.004; m.renderOrder=1; m.userData.blob=1; ob.add(m); }
function setGlow(ob,on){ ob.children.forEach(m=>{ if(m.userData.blob) return; if(on){ if(!m.userData.gm){ m.userData.gm=m.material.clone(); m.userData.gm.emissive=new T.Color(0xd01c10); m.userData.gm.emissiveIntensity=.55; } m.material=m.userData.gm; } else if(m.userData.gm) m.material=m.userData.base; }); }
function fade(v,ob,a,b,ms,done){ const mats=[]; ob.children.forEach(m=>{ m.material=m.material.clone(); m.material.transparent=true; mats.push([m.material,m.material.opacity]); });
  const y0=ob.position.y; anim(v,ms,t=>{ const o=a+(b-a)*t; mats.forEach(([m,o0])=>m.opacity=o0*o); if(b<a){ ob.position.y=y0-.15*t; ob.scale.setScalar((G.model?1.3:1.5)*(1-.15*t)); } },()=>{ if(b>a) ob.children.forEach(m=>{ m.material=m.userData.blob?m.material:m.userData.base; if(m.userData.blob){ m.material.opacity=.8; } }); done&&done(); }); }
function inCheck(P,orient){ const at=(i,j)=>{ const e=P.get(i+","+j); return e?e.code:null; }; const up=orient==="w"?-1:1;
  let res=null; P.forEach((e,k)=>{ if(e.code[1]!=="K") return; const col=e.code[0], [ki,kj]=k.split(",").map(Number), en=col==="w"?"b":"w";
    const hit=(c,types)=>c&&c[0]===en&&types.includes(c[1]);
    const pd=en==="w"?up:-up; if(hit(at(ki-1,kj-pd),"P")||hit(at(ki+1,kj-pd),"P")) res=k;
    [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,b])=>{ if(hit(at(ki+a,kj+b),"N")) res=k; });
    [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b],ix)=>{ for(let s=1;s<8;s++){ const i=ki+a*s,j=kj+b*s; if(i<0||i>7||j<0||j>7) break; const c=at(i,j); if(!c) continue;
      if(c[0]===en&&((ix<4?"RQ":"BQ").includes(c[1])||(s===1&&c[1]==="K"))) res=k; break; } }); });
  return res; }
function labels(v){ const c=v.lc, x=c.getContext("2d"), S=1024, sq=S*8/9.4/8, m=(S-sq*8)/2; x.clearRect(0,0,S,S);
  x.fillStyle="rgba(236,214,170,.92)"; x.font=`700 ${Math.round(m*.5)}px Georgia,serif`; x.textAlign="center"; x.textBaseline="middle";
  for(let i=0;i<8;i++){ const f=v.orient==="w"?"abcdefgh"[i]:"hgfedcba"[i], r=v.orient==="w"?8-i:i+1;
    x.fillText(f,m+sq*(i+.5),S-m/2); x.fillText(String(r),m/2,m+sq*(i+.5)); }
  x.strokeStyle="rgba(20,10,4,.7)"; x.lineWidth=4; x.strokeRect(m-3,m-3,sq*8+6,sq*8+6); x.strokeStyle="rgba(230,200,150,.35)"; x.lineWidth=2; x.strokeRect(m-8,m-8,sq*8+16,sq*8+16);
  v.ltex.needsUpdate=true; }
function paintTop(v,body){ const x=v.tc.getContext("2d"); const draw=img=>{ x.drawImage(G.woodSq,0,0,1024,1024); if(img){ x.save(); x.filter="blur(7px)"; x.globalAlpha=.7; x.drawImage(img,0,0,1024,1024); x.restore(); x.drawImage(img,0,0,1024,1024); } v.tex.needsUpdate=true; req(v); };
  if(!body){ draw(null); return; } draw(null); const img=new Image(); const tok=v.ptok=(v.ptok||0)+1;
  img.onload=()=>{ if(tok===v.ptok) draw(img); }; img.onerror=()=>{}; img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(ovSvg(body)); }

/* ---------- animation + on-demand rendering ---------- */
const REDUCED=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function anim(v,ms,f,done){ if(REDUCED) ms=1; v.anims.push({t0:performance.now(),ms,f,done}); req(v); }
function req(v){ if(v.raf) return; v.raf=requestAnimationFrame(()=>{ v.raf=0; frame(v); }); }
function frame(v){ if(!v.on||!v.w) return; const now=performance.now(); v.anims=v.anims.filter(a=>{ let k=Math.min(1,(now-a.t0)/a.ms); const e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2; a.f(e); if(k>=1){ a.done&&a.done(); return false; } return true; });
  const dpr=v.cv.width/v.w; R.setPixelRatio(1); R.setSize(v.cv.width,v.cv.height,false); R.render(v.scene,v.cam);
  v.ctx.clearRect(0,0,v.cv.width,v.cv.height); v.ctx.drawImage(R.domElement,0,0); if(v.anims.length) req(v); }

/* ---------- keep views in sync with the page ---------- */
let pend=new Set(), sched=0;
function scan(){ document.querySelectorAll("svg.b3d").forEach(s=>{ const v=B3D.views.get(s); if(want(s)){ if(!v) attach(s); else if(v.on) pend.add(v); } else if(v) detach(v); });
  B3D.views.forEach(v=>{ if(!v.svg.isConnected) detach(v); }); }
function flush(){ sched=0; picker(); scan(); pend.forEach(v=>{ try{ update(v); layout(v); }catch(e){ console.warn(e); } }); pend.clear(); }
function soon(){ if(!sched){ sched=1; Promise.resolve().then(flush); } }
new MutationObserver(ms=>{ for(const m of ms){ if(m.type==="attributes"){ soon(); continue; } const t=m.target; if(t.closest&&t.closest("svg.b3d")){ const v=B3D.views.get(t.closest("svg.b3d")); if(v&&v.on) pend.add(v); soon(); } else if(m.addedNodes.length||m.removedNodes.length) soon(); } })
  .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
window.addEventListener("resize",()=>B3D.views.forEach(v=>v.on&&layout(v)));
window.addEventListener("scroll",()=>{},{passive:true});
// taps: map through the 3D camera when a board is shown in 3D
const of=window.boardFrac; window.boardFrac=function(el,ev){ const v=B3D.views.get(el); if(v&&v.on) return frac(v,ev); return of?of(el,ev):null; };
// the flat board's own slide animation is replaced by the 3D one
const oa=window.animatePiece; if(typeof oa==="function") window.animatePiece=function(u){ const b=document.getElementById("board"); if(b&&B3D.active(b)) return; return oa.apply(this,arguments); };
B3D.test={frac:(svg,x,y)=>{ const v=B3D.views.get(svg); return v&&v.on?frac(v,{clientX:x,clientY:y}):null; },
  screenOf:(svg,sq)=>{ const v=B3D.views.get(svg); if(!v||!v.on) return null; const [i,j]=sq; const p=new T.Vector3(i-3.5,TOP+.02,j-3.5).project(v.cam); const r=v.cv.getBoundingClientRect(); return [r.left+(p.x+1)/2*r.width,r.top+(1-p.y)/2*r.height]; },
  view:svg=>B3D.views.get(svg),cam:(svg,pos,tg)=>{ const v=B3D.views.get(svg); v.cam.position.set(...pos); v.cam.lookAt(new T.Vector3(...tg)); v.cam.updateMatrixWorld(); frame(v); }};
{ const m=mode(), d3=m==="gl"||m==="stand"; try{ localStorage.setItem("cr.pieces3d",d3?"1":"0"); }catch(e){} document.body.classList.toggle("p3d",d3); applyToon(m==="toon"); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",flush); else flush();
})();
