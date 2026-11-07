/* Deterministic checks for the Quick review busy-lock. No network, no engine binary, no saved games. */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");
const path=require("path");
const vm=require("vm");

function loadGate(){
  const ctx={console, setTimeout, clearTimeout, Date, Promise, WeakMap};
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"gate82.js"),"utf8"), ctx, {filename:"gate82.js"});
  return ctx.CRGate82;
}
function fakeTimers(){
  let now=0, id=1; const jobs=[];
  return {
    now:()=>now,
    set(fn,ms){ const j={id:id++, at:now+ms, fn}; jobs.push(j); return j.id; },
    clear(i){ const k=jobs.findIndex(j=>j.id===i); if(k>=0) jobs.splice(k,1); },
    advance(ms){
      now+=ms;
      for(;;){
        jobs.sort((a,b)=>a.at-b.at);
        const n=jobs.find(j=>j.at<=now);
        if(!n) break;
        jobs.splice(jobs.indexOf(n),1);
        n.fn();
      }
    }
  };
}
const G=loadGate();
const flush=()=>Promise.resolve().then(()=>Promise.resolve());

test("a second search cannot start until the first search finishes", async()=>{
  const eng={send(){}, waiters:[], w:{terminate(){}}};
  const q=G.createSearchQueue(eng, fakeTimers());
  let started=0, release;
  const p1=q.enqueue(()=>{ started++; return new Promise(r=>{ release=r; }); }, 8000);
  const p2=q.enqueue(()=>{ started++; return Promise.resolve("b"); }, 8000);
  await flush();
  assert.equal(started, 1);
  release("a");
  assert.equal(await p1, "a");
  assert.equal(await p2, "b");
  assert.equal(started, 2);
});

test("a search that never answers is given up well before 10 minutes and the engine is released", async()=>{
  const eng={sent:[], waiters:[{rej(e){ this.err=e; }}], w:{terminate(){ this.killed=true; }}};
  eng.send=c=>eng.sent.push(c);
  const timers=fakeTimers();
  const q=G.createSearchQueue(eng, timers);
  let err=null;
  const p=q.enqueue(()=>new Promise(()=>{}), G.searchBudget(400));
  p.catch(e=>{ err=e; });
  await flush();
  timers.advance(G.searchBudget(400));
  assert.equal(eng.sent.includes("stop"), true);
  assert.equal(err, null, "still waiting for bestmove at the soft stop");
  timers.advance(G.GRACE);
  await flush();
  assert.equal(err&&err.message, "engine timeout");
  assert.equal(eng._gateDead, true);
  assert.equal(eng.waiters.length, 0);
  assert.equal(eng.w.killed, true);
  let nextStarted=false;
  await q.enqueue(()=>{ nextStarted=true; return Promise.resolve("no"); }, 8000).catch(e=>e);
  assert.equal(nextStarted, false);
  timers.advance(10*60*1000);
  assert.equal(err.message, "engine timeout");
});

test("commands for two searches are not in flight together", async()=>{
  const eng={live:0, max:0, send(){}, waiters:[], w:{terminate(){}}};
  const q=G.createSearchQueue(eng, fakeTimers());
  let release;
  const p1=q.enqueue(()=>{ eng.live++; eng.max=Math.max(eng.max, eng.live); return new Promise(r=>{ release=()=>{ eng.live--; r("a"); }; }); }, 8000);
  const p2=q.enqueue(()=>{ eng.live++; eng.max=Math.max(eng.max, eng.live); eng.live--; return Promise.resolve("b"); }, 8000);
  await flush();
  assert.equal(eng.max, 1);
  assert.equal(eng.live, 1);
  release();
  assert.equal(await p1, "a");
  assert.equal(await p2, "b");
  assert.equal(eng.max, 1);
});

test("switching Quick review games drops the old result and keeps the new one", ()=>{
  const slot=G.createJobSlot();
  const a=slot.start();
  const b=slot.start();
  assert.equal(a.stop, true);
  assert.equal(slot.active(a), false);
  assert.equal(slot.active(b), true);
  assert.equal(slot.isCurrent(a), false);
  slot.stop();
  assert.equal(slot.active(b), false);
  assert.equal(slot.isCurrent(b), true);
  const c=slot.start();
  assert.equal(slot.active(c), true);
  assert.equal(b.stop, true);
});

test("a finished check does not replace the game the user is looking at", ()=>{
  assert.equal(G.shouldApply("game-a","game-a"), true);
  assert.equal(G.shouldApply("game-a","game-b"), false);
  assert.equal(G.shouldApply("example","example"), true);
});

test("Cancel marks every holder and a stuck flag is cleared", ()=>{
  const world={imp:{cancel:false, running:true}, bg:{cancel:false}, study:{cancel:false, run:true}, batch:{cancel:false}, running:true, busyMine:false};
  let stopped=0;
  world.engineStop=()=>{ stopped++; };
  G.applyCancel(world);
  assert.equal(world.stop, true);
  assert.equal(world.imp.cancel, true);
  assert.equal(world.bg.cancel, true);
  assert.equal(world.study.cancel, true);
  assert.equal(world.batch.cancel, true);
  assert.equal(stopped, 1);
  assert.equal(G.releaseStuck(world, 1000, G.STUCK_MS), false);
  assert.equal(world.running, true);
  assert.equal(G.releaseStuck(world, G.STUCK_MS, G.STUCK_MS), true);
  assert.equal(world.running, false);
  const owned={stop:true, running:true, busyMine:true};
  assert.equal(G.releaseStuck(owned, 99999, G.STUCK_MS), false);
  assert.equal(owned.running, true);
});

test("the review card shows real background progress instead of a frozen 5% bar", ()=>{
  const t0=1_700_000_000_000;
  let m=G.bannerModel({running:true, now:t0, lastKey:"", lastAt:0});
  assert.equal(m.busy, true);
  assert.equal(m.tx, "Busy with another check…");
  assert.equal(m.fw, "5%");
  assert.doesNotMatch(m.note, /taking longer/);
  m=G.bannerModel({running:true, now:t0+91000, lastKey:m.key, lastAt:m.lastAt});
  assert.match(m.note, /taking longer than usual/);
  const moving=G.bannerModel({
    running:true,
    imp:{running:true, txt:"Quick check of new game 2 of 4…", pct:37},
    now:t0, lastKey:"", lastAt:0
  });
  assert.equal(moving.tx, "Quick check of new game 2 of 4…");
  assert.equal(moving.fw, "37%");
  assert.match(moving.note, /Tap Cancel/);
  const later=G.bannerModel({
    running:true,
    imp:{running:true, txt:"Quick check of new game 3 of 4…", pct:62},
    now:t0+120000, lastKey:moving.key, lastAt:moving.lastAt
  });
  assert.equal(later.fw, "62%");
  assert.equal(later.lastAt, t0+120000);
  assert.doesNotMatch(later.note, /taking longer/);
  const idle=G.bannerModel({running:false, now:t0, lastKey:"", lastAt:0});
  assert.equal(idle.busy, false);
});

test("v81 still refuses file and free-piece tips that land on a hanging piece", ()=>{
  const els={};
  function el(id){ return els[id]||null; }
  const document={
    body:{classList:{add(){},remove(){},contains(){return false;}}, style:{setProperty(){}}, insertAdjacentHTML(){}},
    head:{appendChild(){}},
    createElement(){ return {textContent:""}; },
    getElementById:el,
    querySelector(){ return null; },
    addEventListener(){}
  };
  const ctx={
    console, setTimeout, clearTimeout, setInterval(){ return 0; }, clearInterval(){},
    document, window:null, performance:{now(){return 0;}},
    addEventListener(){}, innerWidth:400, innerHeight:800, localStorage:{getItem(){return null;}, setItem(){}}
  };
  ctx.window=ctx; ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"qr81.js"),"utf8"), ctx, {filename:"qr81.js"});
  const Q=ctx.CRQuick81, T=Q._test;
  const safe="4k3/pppp1ppp/8/8/8/8/PPPP1PPP/R5K1 w - - 0 1";
  const hang="4r1k1/pppp1ppp/8/8/8/8/PPPP1PPP/R5K1 w - - 0 1";
  assert.equal(T.landsSafe(T.bd(safe),"w",T.idx("a1"),T.idx("e1")), true);
  assert.equal(T.landsSafe(T.bd(hang),"w",T.idx("a1"),T.idx("e1")), false);
  const look=(fen,reply)=>{
    const mv=[{before:fen, after:fen, uci:"a2a3", color:"w"}];
    const S=[{bm:"a1e1", sc:{cp:120}, pv:["a1e1"]},{bm:reply, sc:{cp:0}, pv:[reply]}];
    return Q.look(mv, S, 0, "w", "mid", {file:{}, outpost:{}});
  };
  const ok=look(safe,"e8e7");
  assert.equal(ok.some(it=>it.type==="file"), true);
  const bad=look(hang,"e8e1");
  assert.equal(bad.some(it=>it.type==="file"), false);
  assert.equal(bad.some(it=>it.type==="free"), false);
  const queen="r3k3/8/8/8/8/q7/8/1N2K3 w - - 0 1";
  assert.equal(T.bd(queen)[T.idx("b1")].t, "n");
  assert.equal(T.bd(queen)[T.idx("a3")].t, "q");
  assert.equal(T.landsSafe(T.bd(queen),"w",T.idx("b1"),T.idx("a3")), false);
});
