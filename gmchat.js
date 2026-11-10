/* Talk with the GM coach on the GM Coach Report screen.
   Uses the app's existing coach proxy. Keeps the last chat on this phone. */
(function(){ "use strict"; if(window.CRGmChat) return;
const $=id=>document.getElementById(id);
const E_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const URL_=()=>window.CR_GROK_URL||window.CR59_URL||"https://chess-coach-grok.chess-review.workers.dev";
const MAXLEN=500, GAP=8000, PER_SESSION=20, KEEP=8, SK="chessReview.gmTalk.v1";

function load(){ try{ const v=JSON.parse(localStorage.getItem(SK)||"{}"); return {msgs:Array.isArray(v.msgs)?v.msgs:[], sent:Array.isArray(v.sent)?v.sent:[], t:v.t||0}; }catch(e){ return {msgs:[],sent:[],t:0}; } }
function save(x){ try{ localStorage.setItem(SK, JSON.stringify({msgs:(x.msgs||[]).slice(-40), sent:(x.sent||[]).slice(-PER_SESSION), t:Date.now()})); }catch(e){} }
function cut(s,n){ return String(s==null?"":s).replace(/<[^>]+>/g,"").slice(0,n); }
function md(t){ try{ if(window.Coach17&&Coach17._md) return Coach17._md(t); }catch(e){} return E_(t).replace(/\n/g,"<br>"); }
function bubble(m){ return `<div class="gmTalkB ${m.r==="u"?"u":"c"}">${m.r==="u"?E_(m.t).replace(/\n/g,"<br>"):md(m.t)}</div>`; }
function loader(t){ return window.CRMem?CRMem.loader(t):`<p class="co17sm">${E_(t)}</p>`; }

const CSS=`
.gmSel{margin:8px 0 4px}
.gmSelRow{display:flex;gap:8px;align-items:center;margin:0}
.gmSelRow select{flex:1;min-width:0;font:inherit;font-size:16px;min-height:48px;border-radius:10px;border:1px solid var(--line,#ccd);background:#fff;padding:0 10px}
.gmSelBtns{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.gmSelBtns .cbtn{width:100%;text-align:center}
.gmQuick{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}
.gmQuick .cbtn{flex:1;min-width:30%;min-height:44px;text-align:center}
.gmList{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto;margin:0 0 8px;-webkit-overflow-scrolling:touch}
.gmCk{display:flex;align-items:flex-start;gap:10px;min-height:52px;border:1px solid var(--line,#e4dfd5);border-radius:12px;background:#fff;padding:8px 10px;font:inherit}
.gmCk input{width:22px;height:22px;margin-top:4px;flex:none}
.gmCk span{flex:1;min-width:0}
.gmCk b{display:block;font-size:15px}
.gmCk small{display:block;color:var(--mute,#666);font-size:12.5px}
.gmTalk{margin:10px 0 14px;border:1px solid var(--line,#e4dfd5);border-radius:16px;background:#fff;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.gmTalk h3{margin:0 0 4px;font-size:17px}
.gmTalk .gmTalkHint{margin:0 0 8px}
.gmTalkLog{display:flex;flex-direction:column;gap:8px;min-height:140px;max-height:40vh;overflow:auto;margin:8px 0;padding:4px;background:#faf8f3;border-radius:12px}
.gmTalkB{max-width:88%;padding:8px 11px;border-radius:14px;font-size:15px;line-height:1.4}
.gmTalkB.u{align-self:flex-end;background:#3b6fb6;color:#fff;border-bottom-right-radius:4px}
.gmTalkB.c{align-self:flex-start;background:#efece4;color:var(--ink,#262421);border-bottom-left-radius:4px}
.gmTalkB p{margin:4px 0}
.gmTalkForm textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;border-radius:12px;border:1px solid var(--line,#ccc);padding:10px;min-height:52px;resize:vertical}
.gmTalkFr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-right:70px}
.gmTalkNew{min-height:44px;padding:0 12px;border-radius:10px;border:1px solid #3b6fb6;background:#fff;color:#3b6fb6;font:inherit;font-weight:700}
.gmTalkSend{min-height:44px;min-width:96px;border-radius:10px;border:0;background:#3b6fb6;color:#fff;font:inherit;font-weight:800}
.gmTalkErr{color:#b3261e;font-size:14px;margin:4px 0}
.gmTalkLim{font-size:12.5px;color:#556;margin:6px 0 0}
html.dark-mode .gmTalk,html.dark-mode .gmCk,html.dark-mode .gmSelRow select{background:#262626;color:#eee}
html.dark-mode .gmTalkLog{background:#1c1c1c}
html.dark-mode .gmTalkB.c{background:#2a2a2a;color:#eee}
html.dark-mode .gmTalkNew{background:#262626;color:#9cb8e0;border-color:#9cb8e0}
`;
{ const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); }

function about(ctx){
  if(!ctx||ctx.justChat||!(ctx.selected&&ctx.selected.length)) return "Not using a specific game right now — ask anything about your chess.";
  if(ctx.selected.length===1){ const g=ctx.selected[0]; return `Using your game ${g.date||""} vs ${g.opponent||"your opponent"}${g.result?" ("+g.result+")":""}.`; }
  return `Using ${ctx.selected.length} selected games for this chat.`;
}

async function post(body){
  try{ if(window.CRMem){ const m=CRMem.summary(); if(m.length) body.memory=m; } }catch(e){}
  const r=await fetch(URL_(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  let d=null; try{ d=await r.json(); }catch(e){}
  if(!r.ok||!d||!d.report) throw new Error(d&&d.error?d.error:"The coach could not answer right now.");
  return d.report;
}

function failMsg(err){
  const offline=navigator.onLine===false;
  const m=String(err&&err.message||err||"");
  if(offline) return "The coach couldn't answer right now because you're offline. Your report above still works — try the chat again when you're back online.";
  if(/too many|429/i.test(m)) return "The coach is busy right now. Please wait a minute and try again. Your report above still works.";
  if(/origin not allowed/i.test(m)) return "The coach isn't available from this page right now. Your report above still works.";
  return "The coach couldn't answer right now. No problem: your report above still works, and you can try the chat again later.";
}

function mount(host, getCtx){
  if(!host) return;
  const S=load();
  const ctx0=(typeof getCtx==="function"?getCtx():getCtx)||{};
  host.innerHTML=`<div class="gmTalk" id="gmTalk">
    <h3>💬 Talk with the GM coach</h3>
    <p class="co17sm gmTalkHint" id="gmTalkAbout">${E_(about(ctx0))}</p>
    <div class="gmTalkLog" id="gmTalkLog">${S.msgs.length?S.msgs.map(m=>bubble(m)).join(""):`<p class="co17sm gmTalkEmpty">Ask a question. The coach uses the game(s) you picked, the report on this screen, your rating and your goal. You can also talk with no game picked. Try: “What should I practise this week?” or “Why did I lose that game?”</p>`}</div>
    <form class="gmTalkForm" id="gmTalkForm">
      <textarea id="gmTalkIn" maxlength="${MAXLEN}" rows="2" placeholder="Ask the coach…"></textarea>
      <div class="gmTalkFr">
        <button type="button" class="gmTalkNew" id="gmTalkNew">New chat</button>
        <small class="gmTalkLim" id="gmTalkN">0/${MAXLEN}</small>
        <button type="submit" class="gmTalkSend" id="gmTalkSend">Send</button>
      </div>
    </form>
    <p class="gmTalkLim" id="gmTalkLeft">${Math.max(0,PER_SESSION-S.sent.length)} questions left this session.</p>
  </div>`;
  const log=$("gmTalkLog"); if(log) log.scrollTop=log.scrollHeight;
  const ta=$("gmTalkIn"), num=$("gmTalkN"), send=$("gmTalkSend");
  if(ta&&num) ta.oninput=()=>{ num.textContent=ta.value.length+"/"+MAXLEN; };
  const neu=$("gmTalkNew");
  if(neu) neu.onclick=()=>{ save({msgs:[],sent:load().sent}); mount(host, getCtx); };
  const form=$("gmTalkForm");
  if(form) form.onsubmit=async ev=>{
    ev.preventDefault();
    const x=load(), t=(ta.value||"").trim().slice(0,MAXLEN); if(!t) return;
    const now=Date.now(), lastT=x.sent[x.sent.length-1]||0;
    const err=m=>{ const p=document.createElement("p"); p.className="gmTalkErr"; p.textContent=m; log.appendChild(p); log.scrollTop=log.scrollHeight; };
    if(x.sent.length>=PER_SESSION) return err("You've reached this session's limit of "+PER_SESSION+" questions. Come back later.");
    if(now-lastT<GAP) return err("Please wait a few seconds before sending again.");
    x.sent.push(now); x.msgs.push({r:"u",t}); save(x);
    ta.value=""; if(num) num.textContent="0/"+MAXLEN;
    const empty=log.querySelector(".gmTalkEmpty"); if(empty) empty.remove();
    log.insertAdjacentHTML("beforeend", bubble({r:"u",t})+`<div class="gmTalkB c gmTalkLd" id="gmTalkWait">${loader("Coach is thinking…")}</div>`);
    log.scrollTop=log.scrollHeight; if(send) send.disabled=true;
    const wait=$("gmTalkWait");
    try{
      if(navigator.onLine===false) throw new Error("offline");
      const ctx=(typeof getCtx==="function"?getCtx():getCtx)||{justChat:true,selected:[]};
      const a=await post({v:4,mode:"chat",ctx,msgs:x.msgs.slice(-KEEP).map(m=>({r:m.r,t:cut(m.t, m.r==="u"?MAXLEN:2000)}))});
      const y=load(); y.msgs.push({r:"c",t:String(a).slice(0,4000)}); save(y);
      try{ const sel=ctx.selected||[]; window.CRMem&&CRMem.add({kind:"chat",q:t,a,gids:sel.map(g=>g.date+" vs "+g.opponent).slice(0,5),game:sel.length===1?(sel[0].date+" vs "+sel[0].opponent):(sel.length?sel.length+" games":"")}); }catch(e){}
      if(wait&&wait.parentNode) wait.outerHTML=bubble({r:"c",t:a});
    }catch(e){
      if(wait&&wait.parentNode) wait.outerHTML=`<p class="gmTalkErr">${E_(failMsg(e))}</p>`;
    }
    if(send) send.disabled=false;
    if(log) log.scrollTop=log.scrollHeight;
    const left=$("gmTalkLeft"); if(left) left.textContent=`${Math.max(0,PER_SESSION-load().sent.length)} questions left this session.`;
  };
}

window.CRGmChat={mount,load,save,clear:()=>save({msgs:[],sent:[]}),_limits:{MAXLEN,GAP,PER_SESSION,KEEP}};
})();
