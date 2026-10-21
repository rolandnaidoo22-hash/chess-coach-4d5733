/* v19: real 3D board (three.js WebGL). Mirrors any <svg class="b3d"> board: reads its pieces/highlights/arrows,
   draws a wooden board with Staunton pieces on top, and maps taps back to the SVG squares.
   Flat 2D stays available via the "3D pieces" toggle (localStorage cr.pieces3d); falls back to flat if WebGL fails. */
(function(){
"use strict";
if(window.B3D) return;
const B3D=window.B3D={views:new Map(),ready:false,failed:false,active:svg=>{const v=B3D.views.get(svg);return !!(v&&v.on);}};
let T=null, R=null, loading=null, ENV=null;
const css=document.createElement("style");
css.textContent=`body.p3d svg.b3d.gl3d{transform:none!important;opacity:0!important;margin-top:0!important;touch-action:none}
.gl3dc{position:absolute;pointer-events:none;z-index:1}
.gl3dt{position:absolute;z-index:2;display:flex;gap:4px;pointer-events:auto}
.gl3dt button{width:34px;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,.5);background:rgba(30,22,16,.6);color:#fff;font-size:17px;line-height:1;padding:0;cursor:pointer}`;
document.head.appendChild(css);
function want(svg){ return document.body.classList.contains("p3d")&&!B3D.failed&&svg.isConnected&&svg.classList.contains("b3d")&&!svg.classList.contains("flat3d"); }
function load(){ if(loading) return loading; const base=(document.currentScript&&document.currentScript.src)||location.href;
  loading=import(new URL("three.module.min.js",SRC).href).then(m=>{ T=m; init(); B3D.ready=true; }).catch(e=>{ console.warn("3D board off:",e); fail(); }); return loading; }
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
  G.ivory=new T.MeshPhysicalMaterial({color:0xe2cc9f,roughness:.3,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.85});
  G.ebony=new T.MeshPhysicalMaterial({color:0x221a16,roughness:.3,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.1});
  G.geo={}; "PNBRQK".split("").forEach(t=>G.geo[t]=pieceParts(t));
  G.blob=new T.CanvasTexture(blobCanvas()); G.blob.colorSpace=T.SRGBColorSpace;
  G.glow=new T.CanvasTexture(blobCanvas("230,40,30")); 
  G.woodSq=woodSquares(); G.frameTex=new T.CanvasTexture(woodCanvas(512,512,[78,46,26],[52,29,15],9,true));
  G.frameTex.colorSpace=T.SRGBColorSpace; G.frameTex.wrapS=G.frameTex.wrapT=T.RepeatWrapping; G.frameTex.repeat.set(1/9.4,1/9.4); G.frameTex.offset.set(.5,.5);
}
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
function base(r){ return [[0,0],[r,0],[r,.035],[r*.97,.055],[r*.99,.075],[r*.9,.1],[r*.84,.115],[r*.86,.13],[r*.76,.15]]; }
const PROF={
 P:base(.33).concat([[.2,.17],[.15,.22],[.115,.3],[.1,.38],[.165,.405],[.17,.43],[.1,.45],[0,.455]]),
 R:base(.36).concat([[.27,.17],[.235,.24],[.215,.4],[.22,.5],[.27,.54],[.285,.58],[.285,.66],[.2,.66],[.2,.62],[0,.62]]),
 N:base(.35).concat([[.27,.17],[.25,.2],[.26,.235],[0,.24]]),
 B:base(.34).concat([[.22,.17],[.155,.24],[.11,.36],[.095,.48],[.18,.51],[.185,.54],[.1,.56],[.125,.6],[.15,.67],[.14,.74],[.1,.8],[.05,.85],[0,.865]]),
 Q:base(.37).concat([[.255,.17],[.175,.26],[.125,.42],[.11,.6],[.2,.64],[.205,.67],[.12,.69],[.14,.73],[.2,.84],[.215,.875],[.17,.88],[.13,.9],[0,.91]]),
 K:base(.38).concat([[.265,.17],[.185,.27],[.135,.45],[.12,.66],[.215,.7],[.22,.73],[.13,.75],[.15,.8],[.205,.92],[.16,.94],[.1,.96],[.06,.99],[0,1.0]])};
function lathe(pr){ return new T.LatheGeometry(pr.map(p=>new T.Vector2(p[0],p[1])),40); }
function pieceParts(t){ const parts=[lathe(PROF[t])]; const sph=(r,y,x=0,z=0)=>{ const g=new T.SphereGeometry(r,24,16); g.translate(x,y,z); return g; };
  if(t==="P") parts.push(sph(.14,.56));
  if(t==="B"){ parts.push(sph(.045,.9)); }
  if(t==="Q"){ for(let i=0;i<9;i++){ const a=i/9*Math.PI*2; parts.push(sph(.04,.9,Math.cos(a)*.18,Math.sin(a)*.18)); } parts.push(sph(.07,.97)); }
  if(t==="K"){ const v=new T.BoxGeometry(.06,.24,.06); v.translate(0,1.1,0); const h=new T.BoxGeometry(.18,.06,.06); h.translate(0,1.13,0); parts.push(v,h); }
  if(t==="R"){ for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, b=new T.BoxGeometry(.075,.08,.1); b.rotateY(-a); b.translate(Math.cos(a)*.245,.70,Math.sin(a)*.245); parts.push(b); } }
  if(t==="N"){ const s=new T.Shape(); const P=[[-.2,.22],[-.215,.42],[-.19,.6],[-.13,.75],[-.085,.86],[-.05,.97],[.0,.88],[.055,.84],[.15,.77],[.26,.66],[.32,.57],[.315,.5],[.25,.475],[.16,.5],[.08,.48],[.1,.4],[.17,.31],[.18,.22]];
    s.moveTo(P[0][0],P[0][1]); P.slice(1).forEach(p=>s.lineTo(p[0],p[1])); s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:.15,bevelEnabled:true,bevelThickness:.06,bevelSize:.045,bevelSegments:4,curveSegments:8}); g.translate(0,0,-.075);
    parts.push(g); const eye=sph(.03,.74,.11,.12); const eye2=sph(.03,.74,.11,-.12); parts.push(eye,eye2); }
  return parts; }
function makePiece(code,orient){ const t=code[1], white=code[0]==="w"; const g=new T.Group(); const mat=white?G.ivory:G.ebony;
  G.geo[t].forEach(geo=>{ const m=new T.Mesh(geo,mat); m.castShadow=true; m.receiveShadow=true; g.add(m); });
  if(t==="N"){ const faceUp=(white===(orient==="w")); g.rotation.y=faceUp?Math.PI/2:-Math.PI/2; }
  if(t==="B") g.rotation.y=Math.PI/4;
  const s=1.22; g.scale.set(s,s,s); g.userData={code,mat}; return g; }

/* ---------- a view per SVG board ---------- */
const TOP=.361;
function attach(svg){
  const v={svg,on:false,az:0,pol:32*Math.PI/180,P:new Map(),anims:[],orient:"w",key:""};
  B3D.views.set(svg,v);
  load().then(()=>{ if(B3D.failed||!want(svg)) return; try{ build(v); }catch(e){ console.warn(e); fail(); } });
  return v; }
function build(v){
  const sc=v.scene=new T.Scene(); sc.environment=ENV;
  v.cam=new T.PerspectiveCamera(34,1,.1,100);
  sc.add(new T.HemisphereLight(0xfff4e0,0x3a2a1c,.35));
  const L=v.light=new T.DirectionalLight(0xfff2dc,2.3); L.position.set(-4,10,5); L.castShadow=true; L.shadow.mapSize.set(1024,1024);
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
  v.tb=document.createElement("div"); v.tb.className="gl3dt"; v.tb.innerHTML=`<button type="button" data-r="-1" aria-label="Rotate left">⟲</button><button type="button" data-r="1" aria-label="Rotate right">⟳</button><button type="button" data-r="0" aria-label="Reset view">⌂</button>`;
  v.tb.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; e.stopPropagation(); const d=+b.dataset.r; turnTo(v,d?v.az+d*Math.PI/4:0,d?v.pol:32*Math.PI/180); });
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
  const pts=[]; for(const x of [-4.75,4.75]) for(const z of [-4.75,4.75]){ pts.push(new T.Vector3(x,0,z),new T.Vector3(x,.4,z)); pts.push(new T.Vector3(x*.84,1.25,z*.84)); }
  const place=d=>{ const s=Math.sin(v.pol); c.position.set(tg.x+d*s*Math.sin(v.az),tg.y+d*Math.cos(v.pol),tg.z+d*s*Math.cos(v.az)); c.up.set(0,1,0); c.lookAt(tg); c.updateProjectionMatrix(); c.updateMatrixWorld(); };
  let lo=5,hi=60; for(let i=0;i<22;i++){ const d=(lo+hi)/2; place(d); let m=0; pts.forEach(p=>{ const q=p.clone().project(c); m=Math.max(m,Math.abs(q.x),Math.abs(q.y)); }); if(m>.96) lo=d; else hi=d; } place(hi); }
function turnTo(v,az,pol){ const a0=v.az,p0=v.pol; anim(v,300,k=>{ v.az=a0+(az-a0)*k; v.pol=p0+(pol-p0)*k; fit(v); }); }
function wireOrbit(v){ const s=v.svg; let o=null, blockClick=0;
  const dn=e=>{ if(!v.on) return; const f=frac(v,e,true); const off=!f||f[0]<0||f[0]>=1||f[1]<0||f[1]>=1; if(!off&&!e.ctrlKey&&e.button!==2) return;
    e.stopImmediatePropagation(); e.preventDefault(); o={x:e.clientX,y:e.clientY,az:v.az,pol:v.pol,id:e.pointerId,moved:0}; try{ s.setPointerCapture(e.pointerId); }catch(_){} };
  const mv=e=>{ if(!o||e.pointerId!==o.id) return; e.stopImmediatePropagation(); const dx=e.clientX-o.x, dy=e.clientY-o.y; o.moved=Math.max(o.moved,Math.abs(dx)+Math.abs(dy));
    v.az=o.az-dx/v.w*Math.PI*1.4; v.pol=Math.max(0,Math.min(58*Math.PI/180,o.pol-dy/v.h*Math.PI*.8)); fit(v); req(v); };
  const up=e=>{ if(!o||e.pointerId!==o.id) return; e.stopImmediatePropagation(); o=null; blockClick=Date.now(); };
  const ck=e=>{ if(Date.now()-blockClick<400){ e.stopImmediatePropagation(); e.preventDefault(); } };
  s.addEventListener("pointerdown",dn,true); s.addEventListener("pointermove",mv,true); s.addEventListener("pointerup",up,true); s.addEventListener("pointercancel",up,true); s.addEventListener("click",ck,true);
  v.unOrbit=()=>{ s.removeEventListener("pointerdown",dn,true); s.removeEventListener("pointermove",mv,true); s.removeEventListener("pointerup",up,true); s.removeEventListener("pointercancel",up,true); s.removeEventListener("click",ck,true); }; }
// event -> [u,v] fraction in the SVG's own square space (same as flat boards)
function frac(v,ev,planeOnly){ const r=v.cv.getBoundingClientRect(); if(!r.width) return null;
  const nd=new T.Vector2((ev.clientX-r.left)/r.width*2-1,-((ev.clientY-r.top)/r.height*2-1)); const rc=new T.Raycaster(); rc.setFromCamera(nd,v.cam);
  if(!planeOnly){ const hits=rc.intersectObjects(v.pg.children,true); for(const h of hits){ let o=h.object; while(o&&o.parent!==v.pg) o=o.parent; if(o&&o.userData.sq&&!o.userData.dying&&!(o.position.y>TOP+.1)){ const [i,j]=o.userData.sq; return [(i+.5)/8,(j+.5)/8]; } } }
  const p=new T.Vector3(); if(!rc.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-TOP),p)) return null; return [(p.x+4)/8,(p.z+4)/8]; }

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
function setGlow(ob,on){ ob.children.forEach(m=>{ if(m.userData.blob) return; if(on){ if(!m.userData.gm){ m.userData.gm=m.material.clone(); m.userData.gm.emissive=new T.Color(0xd01c10); m.userData.gm.emissiveIntensity=.55; } m.material=m.userData.gm; } else if(m.userData.gm) m.material=ob.userData.mat; }); }
function fade(v,ob,a,b,ms,done){ const mats=[]; ob.children.forEach(m=>{ m.material=m.material.clone(); m.material.transparent=true; mats.push([m.material,m.material.opacity]); });
  const y0=ob.position.y; anim(v,ms,t=>{ const o=a+(b-a)*t; mats.forEach(([m,o0])=>m.opacity=o0*o); if(b<a){ ob.position.y=y0-.15*t; ob.scale.setScalar(1.22*(1-.15*t)); } },()=>{ if(b>a) ob.children.forEach(m=>{ m.material=m.userData.blob?m.material:ob.userData.mat; if(m.userData.blob){ m.material.opacity=.8; } }); done&&done(); }); }
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
function flush(){ sched=0; scan(); pend.forEach(v=>{ try{ update(v); layout(v); }catch(e){ console.warn(e); } }); pend.clear(); }
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
  view:svg=>B3D.views.get(svg)};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan); else scan();
})();
