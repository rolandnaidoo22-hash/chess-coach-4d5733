/* Loads the app's inline chess library + analyzer into Node so they can be tested without a browser. */
const fs=require("fs"), vm=require("vm"), path=require("path");
module.exports=function load(){
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const lib=scripts.find(s=>s.startsWith("var exports={},module={exports:exports};"));
  const an=scripts.find(s=>s.startsWith("/* In-browser game analyzer"));
  const book=(html.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)||[])[1];
  const win={}; win.window=win; win.document={getElementById:id=>id==="book-data"&&book?{textContent:book}:null};
  const ctx=vm.createContext(Object.assign(win,{console,Math,JSON,Set,Map,Uint32Array,atob:s=>Buffer.from(s,"base64").toString("binary"),performance:{now:()=>Date.now()},setTimeout,localStorage:{getItem(){return null},setItem(){}}}));
  vm.runInContext(lib,ctx); vm.runInContext(an,ctx);
  return ctx.window;
};
