/* Opponent Brain background worker: fetch and parse a rival's public monthly
   archive off the main thread so the screen stays responsive. */
(function(root){
"use strict";
function parsePgn(pgn){
  const H={}; String(pgn||"").replace(/\[(\w+)\s+"([^"]*)"\]/g,(_,k,v)=>{ H[k]=v; });
  const body=String(pgn||"").replace(/^\[.*\]\s*$/gm,"");
  const sans=[]; const re=/\{([^}]*)\}|\(|\)|(\d+\.(?:\.\.)?)|(\$\d+)|([^\s{}()]+)/g;
  let m, depth=0;
  while((m=re.exec(body))){
    if(m[0]==="("){ depth++; continue; }
    if(m[0]===")"){ depth--; continue; }
    if(depth) continue;
    if(m[1]!=null) continue;
    if(m[4]&&!/^(1-0|0-1|1\/2-1\/2|\*)$/.test(m[4])) sans.push(m[4].replace(/[!?]+$/,""));
  }
  return {H:H, sans:sans};
}
function parseGames(games){
  return (games||[]).map(function(g){
    if(!g||!g.pgn||(g.rules&&g.rules!=="chess")) return null;
    const P=parsePgn(g.pgn);
    return {
      url:g.url, pgn:g.pgn, rules:g.rules||"chess",
      end_time:g.end_time, time_class:g.time_class,
      white:g.white, black:g.black,
      sans:P.sans, opening:(P.H&&P.H.Opening)||""
    };
  }).filter(Boolean);
}
async function fetchUrl(url){
  const r=await fetch(url,{cache:"no-store"});
  if(r.status===404||r.status===429) return {ok:true, status:r.status, data:null};
  if(!r.ok) return {ok:false, status:r.status, error:"http "+r.status};
  return {ok:true, status:r.status, data:await r.json()};
}
const api={parsePgn:parsePgn, parseGames:parseGames, fetchUrl:fetchUrl};
root.CRBrainWorker=api;
const isWorker=typeof WorkerGlobalScope!=="undefined" && typeof self==="object" && self instanceof WorkerGlobalScope;
if(isWorker){
  self.onmessage=async function(e){
    const msg=e.data||{}, id=msg.id;
    try{
      if(msg.type==="parse"){
        self.postMessage({id:id, ok:true, games:parseGames(msg.games)});
        return;
      }
      if(msg.type==="fetch"){
        const got=await fetchUrl(msg.url);
        self.postMessage(Object.assign({id:id}, got));
        return;
      }
      self.postMessage({id:id, ok:false, error:"unknown"});
    }catch(err){
      const text=String(err&&err.message||err);
      self.postMessage({id:id, ok:false, error:text==="network"?text:"network"});
    }
  };
}
})(typeof self!=="undefined"?self:typeof globalThis!=="undefined"?globalThis:this);
