/* Chess Review Enhancements v1: Dark Mode, Key Moments, Blunder Patterns */
(function(){
"use strict";

/* ============ DARK MODE ============ */
const DARK_KEY = 'chessReview.darkMode';
const darkCSS = `
html.dark-mode { --bg:#1a1a1a; --card:#262626; --ink:#e8e8e8; --mute:#a0a0a0; --line:#3a3a3a; }
html.dark-mode body { background:var(--bg); color:var(--ink); }
html.dark-mode .card { background:var(--card); border-color:var(--line); }
html.dark-mode .coach .bubble { background:var(--card); border-color:var(--line); color:var(--ink); }
html.dark-mode input, html.dark-mode textarea, html.dark-mode select { background:#333; color:#e8e8e8; border-color:#555; }
html.dark-mode .btn { background:#3a3a3a; color:#e8e8e8; border-color:#555; }
html.dark-mode .gitem { background:var(--card); border-color:var(--line); }
`;

function initDarkMode(){
  const style = document.createElement('style');
  style.id = 'dark-mode-css';
  style.textContent = darkCSS;
  document.head.appendChild(style);

  const isDark = localStorage.getItem(DARK_KEY) === '1';
  if(isDark) document.documentElement.classList.add('dark-mode');

  // Add toggle button to header
  const header = document.querySelector('header');
  if(header){
    const btn = document.createElement('button');
    btn.id = 'dark-toggle';
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = 'Toggle dark mode';
    btn.style.cssText = 'position:absolute;top:14px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;padding:4px;';
    btn.onclick = ()=>{
      const dark = document.documentElement.classList.toggle('dark-mode');
      localStorage.setItem(DARK_KEY, dark ? '1' : '0');
      btn.textContent = dark ? '☀️' : '🌙';
    };
    header.style.position = 'relative';
    header.appendChild(btn);
  }
}

/* ============ KEY MOMENTS ============ */
function getKeyMoments(){
  // Access the global DATA
  const data = window.DATA;
  if(!data || !data.plies) return [];

  const userColor = data.meta.user_color;
  const userMoves = data.plies.filter(p => p.color === userColor && p.cpl != null);

  // Sort by CPL descending, take top 3
  const sorted = [...userMoves].sort((a,b) => (b.cpl||0) - (a.cpl||0));
  return sorted.slice(0, 3).filter(p => (p.cpl||0) > 50); // Only significant moments
}

function renderKeyMoments(){
  const moments = getKeyMoments();
  if(moments.length === 0) return '';

  let html = '<div class="card" style="margin:12px 0;"><h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)">🔑 Key Moments</h3>';
  html += '<p style="font-size:13px;color:var(--mute);margin:0 0 10px">The 3 moves that swung the game most:</p>';
  html += '<div style="display:grid;gap:8px;">';

  moments.forEach((p, i)=>{
    const clsColor = {
      'blunder': 'var(--blunder)', 'mistake': 'var(--mistake)',
      'miss': 'var(--miss)', 'inaccuracy': 'var(--inaccuracy)'
    }[p.cls] || 'var(--mute)';

    html += `<div class="jump" data-ply="${p.ply}" style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:8px;cursor:pointer;">
      <div style="font-size:24px;font-weight:800;color:${clsColor};min-width:36px;text-align:center;">${i+1}</div>
      <div style="flex:1;">
        <div style="font-weight:700;">${p.label} <span style="font-size:12px;color:var(--mute);text-transform:capitalize;">(${p.cls})</span></div>
        <div style="font-size:13px;color:var(--mute);">Lost ${Math.round(p.cpl)} centipawns · Best was ${p.best_san || '?'}</div>
      </div>
      <div style="font-size:20px;">→</div>
    </div>`;
  });

  html += '</div></div>';
  return html;
}

/* ============ BLUNDER PATTERNS ============ */
const PATTERNS_KEY = 'chessReview.patterns.v1';

function classifyBlunderType(ply){
  // Categorize based on available data
  const expl = (ply.expl || '').toLowerCase();
  const cls = ply.cls;

  if(expl.includes('hang') || expl.includes('undefended') || expl.includes('en prise'))
    return 'Hanging pieces';
  if(expl.includes('mate') || expl.includes('checkmate'))
    return 'Missed mate';
  if(expl.includes('tactic') || expl.includes('fork') || expl.includes('pin') || expl.includes('skewer'))
    return 'Missed tactics';
  if(expl.includes('king') && expl.includes('safe'))
    return 'King safety';
  if(cls === 'blunder')
    return 'Blunders';
  if(cls === 'mistake')
    return 'Mistakes';
  if(cls === 'miss')
    return 'Missed wins';
  return 'Inaccuracies';
}

function trackPatterns(){
  const data = window.DATA;
  if(!data || !data.plies || !data.meta) return;

  const userColor = data.meta.user_color;
  const badMoves = data.plies.filter(p =>
    p.color === userColor && ['blunder','mistake','miss','inaccuracy'].includes(p.cls)
  );

  if(badMoves.length === 0) return;

  try {
    let patterns = JSON.parse(localStorage.getItem(PATTERNS_KEY) || '{}');
    const gameId = (data.meta.link || '') + '|' + data.meta.date;

    // Don't double-count the same game
    if(patterns._games && patterns._games.includes(gameId)) return;
    if(!patterns._games) patterns._games = [];
    patterns._games.push(gameId);
    // Keep only last 20 games
    if(patterns._games.length > 20) patterns._games = patterns._games.slice(-20);

    badMoves.forEach(p => {
      const type = classifyBlunderType(p);
      patterns[type] = (patterns[type] || 0) + 1;
    });

    localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  } catch(e){ console.error('Pattern tracking failed:', e); }
}

function renderPatterns(){
  try {
    const patterns = JSON.parse(localStorage.getItem(PATTERNS_KEY) || '{}');
    const types = Object.keys(patterns).filter(k => k !== '_games');
    if(types.length === 0) return '';

    const sorted = types.sort((a,b) => patterns[b] - patterns[a]);
    const total = sorted.reduce((s,t) => s + patterns[t], 0);
    const gameCount = (patterns._games || []).length;

    let html = '<div class="card" style="margin:12px 0;"><h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)">📊 Your Blunder Patterns</h3>';
    html += `<p style="font-size:13px;color:var(--mute);margin:0 0 10px">Across your last ${gameCount} game${gameCount===1?'':'s'}:</p>`;
    html += '<div style="display:grid;gap:6px;">';

    sorted.slice(0, 5).forEach(type => {
      const count = patterns[type];
      const pct = Math.round(count / total * 100);
      html += `<div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;font-size:14px;">${type}</div>
        <div style="width:120px;height:8px;background:var(--line);border-radius:4px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:var(--blunder);"></div>
        </div>
        <div style="font-weight:700;min-width:30px;text-align:right;">${count}</div>
      </div>`;
    });

    html += '</div>';
    if(sorted[0]){
      html += `<p style="font-size:13px;margin:10px 0 0;padding:10px;background:var(--bg);border-radius:8px;">💡 <strong>Focus area:</strong> ${sorted[0]} (${patterns[sorted[0]]} times). Work on this first!</p>`;
    }
    html += '</div>';
    return html;
  } catch(e){ return ''; }
}

/* ============ INTEGRATION ============ */
function injectEnhancements(){
  // Find the summary section and add our cards after it
  const summary = document.getElementById('summary');
  if(!summary) return;

  // Remove old enhancement cards if re-rendering
  document.querySelectorAll('.enhancement-card').forEach(el => el.remove());

  const keyMomentsHTML = renderKeyMoments();
  const patternsHTML = renderPatterns();

  if(keyMomentsHTML || patternsHTML){
    const container = document.createElement('div');
    container.className = 'enhancement-card';
    container.innerHTML = keyMomentsHTML + patternsHTML;
    summary.parentNode.insertBefore(container, summary.nextSibling);

    // Wire up key moment clicks to jump to moves
    container.querySelectorAll('[data-ply]').forEach(el => {
      el.addEventListener('click', ()=>{
        const ply = parseInt(el.getAttribute('data-ply'));
        // Try to find and click the corresponding move in the move list
        const moveEls = document.querySelectorAll('[data-ply], .move');
        // Fallback: dispatch custom event
        window.dispatchEvent(new CustomEvent('jumpToPly', {detail: {ply}}));
        // Try clicking move list items
        document.querySelectorAll('.toplist .jump').forEach(j => {
          if(j.textContent.includes(el.querySelector('div').textContent.split(' ')[0]))
            j.click();
        });
      });
    });
  }
}

// Track patterns after analysis
const originalSetData = window.setData;
if(typeof window.setData === 'function'){
  window.setData = function(d){
    const result = originalSetData.apply(this, arguments);
    setTimeout(()=>{
      trackPatterns();
      injectEnhancements();
    }, 100);
    return result;
  };
}

// Also hook into the analyze completion
document.addEventListener('DOMContentLoaded', ()=>{
  initDarkMode();

  // Watch for summary updates
  const observer = new MutationObserver((mutations)=>{
    for(const m of mutations){
      if(m.target.id === 'summary' || m.target.querySelector('#summary')){
        setTimeout(()=>{ trackPatterns(); injectEnhancements(); }, 200);
        break;
      }
    }
  });

  const summaryEl = document.getElementById('summary');
  if(summaryEl){
    observer.observe(summaryEl, {childList: true, subtree: true});
    // Initial render for example game
    setTimeout(()=>{ trackPatterns(); injectEnhancements(); }, 1000);
  }
});

// Expose for debugging
window.ChessEnhancements = { getKeyMoments, renderKeyMoments, renderPatterns, trackPatterns };

})();
