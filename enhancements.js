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

/* ============ INSIGHTS DASHBOARD ============ */
const GAMES_KEY = 'chessReview.games.v1';

function getAllGames(){
  try {
    const games = JSON.parse(localStorage.getItem(GAMES_KEY) || '[]');
    return games.filter(g => g.data && g.data.plies);
  } catch(e){ return []; }
}

function analyzeGames(games){
  const stats = {
    total: games.length,
    wins: 0, losses: 0, draws: 0,
    totalAccuracy: 0,
    mistakes: { blunder: 0, mistake: 0, miss: 0, inaccuracy: 0 },
    byOpening: {},
    byPhase: { opening: [], middlegame: [], endgame: [] },
    timeIssues: 0,
    commonBlunderMoves: {},
    resultsByColor: { w: {w:0,l:0,d:0}, b: {w:0,l:0,d:0} }
  };

  games.forEach(g => {
    const d = g.data;
    const uc = d.meta.user_color;
    const result = d.meta.result;

    // Win/loss
    const won = (result === '1-0' && uc === 'w') || (result === '0-1' && uc === 'b');
    const lost = (result === '1-0' && uc === 'b') || (result === '0-1' && uc === 'w');
    if(won) { stats.wins++; stats.resultsByColor[uc].w++; }
    else if(lost) { stats.losses++; stats.resultsByColor[uc].l++; }
    else { stats.draws++; stats.resultsByColor[uc].d++; }

    // Accuracy
    if(d.summary && d.summary.accuracy) stats.totalAccuracy += d.summary.accuracy;

    // Mistakes by user
    const userPlies = d.plies.filter(p => p.color === uc);
    userPlies.forEach(p => {
      if(stats.mistakes[p.cls] !== undefined) stats.mistakes[p.cls]++;

      // Track specific blunder moves
      if(['blunder','mistake'].includes(p.cls)){
        const key = p.san || p.label;
        stats.commonBlunderMoves[key] = (stats.commonBlunderMoves[key] || 0) + 1;
      }

      // Phase analysis (0=opening, 1=middlegame, 2=endgame)
      if(p.phase === 0) stats.byPhase.opening.push(p.acc || 0);
      else if(p.phase === 1) stats.byPhase.middlegame.push(p.acc || 0);
      else if(p.phase === 2) stats.byPhase.endgame.push(p.acc || 0);
    });

    // Opening performance
    const opening = d.meta.opening || 'Unknown';
    if(!stats.byOpening[opening]) stats.byOpening[opening] = {w:0, l:0, d:0, games:0};
    stats.byOpening[opening].games++;
    if(won) stats.byOpening[opening].w++;
    else if(lost) stats.byOpening[opening].l++;
    else stats.byOpening[opening].d++;

    // Time issues
    if(d.summary && d.summary.time && d.summary.time.quick_mistakes){
      stats.timeIssues += d.summary.time.quick_mistakes.length;
    }
  });

  stats.avgAccuracy = stats.total ? Math.round(stats.totalAccuracy / stats.total) : 0;
  stats.winRate = stats.total ? Math.round(stats.wins / stats.total * 100) : 0;

  // Phase averages
  for(const phase of ['opening','middlegame','endgame']){
    const arr = stats.byPhase[phase];
    stats.byPhase[phase] = arr.length ? Math.round(arr.reduce((a,b)=>a+b,0) / arr.length) : null;
  }

  return stats;
}

function generateInsights(stats){
  const insights = [];

  // Win rate insight
  if(stats.total >= 3){
    if(stats.winRate >= 60) insights.push({icon:'🏆', text:`Strong win rate at ${stats.winRate}%! Keep doing what you're doing.`});
    else if(stats.winRate >= 40) insights.push({icon:'📊', text:`Win rate is ${stats.winRate}%. Focus on reducing blunders to push it higher.`});
    else insights.push({icon:'🎯', text:`Win rate is ${stats.winRate}%. Your biggest leak is likely ${getBiggestMistake(stats)}. Drill that first.`});
  }

  // Biggest mistake type
  const biggest = getBiggestMistake(stats);
  if(biggest) insights.push({icon:'⚠️', text:`Your most common issue: <strong>${biggest}</strong> (${stats.mistakes[biggest.toLowerCase().replace(' ','')] || 0} times).`});

  // Phase weakness
  const phases = stats.byPhase;
  const validPhases = Object.entries(phases).filter(([k,v]) => v !== null);
  if(validPhases.length >= 2){
    const weakest = validPhases.sort((a,b) => a[1] - b[1])[0];
    const strongest = validPhases.sort((a,b) => b[1] - a[1])[0];
    if(weakest[1] < strongest[1] - 10){
      insights.push({icon:'📉', text:`Weakest phase: <strong>${weakest[0]}</strong> (${weakest[1]}% accuracy vs ${strongest[1]}% in ${strongest[0]}). Study ${weakest[0]} patterns.`});
    }
  }

  // Time management
  if(stats.timeIssues > 0){
    insights.push({icon:'⏱️', text:`<strong>${stats.timeIssues}</strong> mistakes came from playing too fast. When unsure, use your time!`});
  }

  // Color performance
  const w = stats.resultsByColor.w, b = stats.resultsByColor.b;
  const wRate = (w.w + w.l + w.d) ? Math.round(w.w / (w.w + w.l + w.d) * 100) : null;
  const bRate = (b.w + b.l + b.d) ? Math.round(b.w / (b.w + b.l + b.d) * 100) : null;
  if(wRate !== null && bRate !== null && Math.abs(wRate - bRate) >= 20){
    const weaker = wRate < bRate ? 'White' : 'Black';
    insights.push({icon:'♟️', text:`You score ${Math.max(wRate,bRate)}% as ${wRate > bRate ? 'White' : 'Black'} but only ${Math.min(wRate,bRate)}% as ${weaker}. Work on your ${weaker.toLowerCase()} repertoire.`});
  }

  // Opening struggles
  const badOpenings = Object.entries(stats.byOpening)
    .filter(([k,v]) => v.games >= 2 && v.w / v.games < 0.4)
    .sort((a,b) => a[1].w/a[1].games - b[1].w/b[1].games);
  if(badOpenings.length > 0){
    const [name, rec] = badOpenings[0];
    insights.push({icon:'📖', text:`Struggling in the <strong>${name}</strong> (${rec.w}W/${rec.l}L). Consider reviewing the key ideas or switching lines.`});
  }

  return insights;
}

function getBiggestMistake(stats){
  const m = stats.mistakes;
  const sorted = Object.entries(m).sort((a,b) => b[1] - a[1]);
  if(sorted[0][1] === 0) return null;
  const names = {blunder:'Blunders', mistake:'Mistakes', miss:'Missed wins', inaccuracy:'Inaccuracies'};
  return names[sorted[0][0]] || sorted[0][0];
}

function renderInsightsTab(){
  const games = getAllGames();

  let html = '<div class="card" style="margin:12px 0;">';
  html += '<h3 style="margin:0 0 10px;font-size:16px;">📊 Insights Dashboard</h3>';

  if(games.length === 0){
    html += '<p style="color:var(--mute);">Analyze some games first! Your insights will appear here after you review games.</p>';
    html += '</div>';
    return html;
  }

  const stats = analyzeGames(games);
  const insights = generateInsights(stats);

  // Overview cards
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px;">
    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px;">
      <div style="font-size:28px;font-weight:800;">${stats.total}</div>
      <div style="font-size:12px;color:var(--mute);">Games</div>
    </div>
    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px;">
      <div style="font-size:28px;font-weight:800;color:var(--best);">${stats.winRate}%</div>
      <div style="font-size:12px;color:var(--mute);">Win rate</div>
    </div>
    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px;">
      <div style="font-size:28px;font-weight:800;color:var(--accent);">${stats.avgAccuracy}%</div>
      <div style="font-size:12px;color:var(--mute);">Avg accuracy</div>
    </div>
    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px;">
      <div style="font-size:28px;font-weight:800;color:var(--blunder);">${stats.mistakes.blunder}</div>
      <div style="font-size:12px;color:var(--mute);">Blunders</div>
    </div>
  </div>`;

  // Key insights
  if(insights.length > 0){
    html += '<h4 style="margin:0 0 8px;font-size:14px;">💡 What the data says:</h4>';
    html += '<div style="display:grid;gap:8px;margin-bottom:16px;">';
    insights.forEach(ins => {
      html += `<div style="padding:10px 12px;background:var(--bg);border-radius:8px;font-size:14px;">${ins.icon} ${ins.text}</div>`;
    });
    html += '</div>';
  }

  // Mistake breakdown
  html += '<h4 style="margin:0 0 8px;font-size:14px;">Mistake breakdown:</h4>';
  html += '<div style="display:grid;gap:6px;margin-bottom:16px;">';
  const mNames = {blunder:['Blunders','var(--blunder)'], mistake:['Mistakes','var(--mistake)'], miss:['Missed wins','var(--miss)'], inaccuracy:['Inaccuracies','var(--inaccuracy)']};
  const maxM = Math.max(...Object.values(stats.mistakes), 1);
  for(const [key, [label, color]] of Object.entries(mNames)){
    const count = stats.mistakes[key];
    const pct = Math.round(count / maxM * 100);
    html += `<div style="display:flex;align-items:center;gap:10px;font-size:14px;">
      <div style="min-width:100px;">${label}</div>
      <div style="flex:1;height:10px;background:var(--line);border-radius:5px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};"></div></div>
      <div style="font-weight:700;min-width:30px;text-align:right;">${count}</div>
    </div>`;
  }
  html += '</div>';

  // Phase accuracy
  const phases = stats.byPhase;
  if(Object.values(phases).some(v => v !== null)){
    html += '<h4 style="margin:0 0 8px;font-size:14px;">Accuracy by game phase:</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">';
    [['Opening',phases.opening],['Middlegame',phases.middlegame],['Endgame',phases.endgame]].forEach(([label, val])=>{
      html += `<div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;">
        <div style="font-size:20px;font-weight:800;">${val !== null ? val+'%' : '—'}</div>
        <div style="font-size:12px;color:var(--mute);">${label}</div>
      </div>`;
    });
    html += '</div>';
  }

  // Top openings
  const openings = Object.entries(stats.byOpening).sort((a,b) => b[1].games - a[1].games).slice(0,5);
  if(openings.length > 0){
    html += '<h4 style="margin:0 0 8px;font-size:14px;">Your openings:</h4>';
    html += '<div style="display:grid;gap:6px;font-size:14px;">';
    openings.forEach(([name, rec])=>{
      const wr = rec.games ? Math.round(rec.w / rec.games * 100) : 0;
      html += `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg);border-radius:6px;">
        <span>${name}</span><span><strong>${rec.w}W</strong> / ${rec.l}L / ${rec.d}D (${wr}%)</span>
      </div>`;
    });
    html += '</div>';
  }

  html += `<p style="font-size:12px;color:var(--mute);margin-top:12px;">Based on ${stats.total} analyzed game${stats.total===1?'':'s'}. Analyze more games for deeper insights.</p>`;
  html += '</div>';
  return html;
}

function initInsightsTab(){
  // Find the "My games" section and add an Insights tab
  const gamesSection = document.querySelector('#mygames, .mygames, [id*="games"]');
  // Fallback: look for the games list container
  const glist = document.querySelector('.glist');

  if(glist && !document.getElementById('insights-tab-btn')){
    // Create tab buttons
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
    tabs.innerHTML = `
      <button id="games-tab-btn" class="btn" style="flex:1;padding:10px;font-weight:700;">My Games</button>
      <button id="insights-tab-btn" class="btn" style="flex:1;padding:10px;">📊 Insights</button>
    `;

    const container = glist.parentNode;
    container.insertBefore(tabs, glist);

    // Create insights panel (hidden by default)
    const insightsPanel = document.createElement('div');
    insightsPanel.id = 'insights-panel';
    insightsPanel.style.display = 'none';
    container.insertBefore(insightsPanel, glist);

    const gamesBtn = document.getElementById('games-tab-btn');
    const insightsBtn = document.getElementById('insights-tab-btn');

    function showGames(){
      glist.style.display = '';
      insightsPanel.style.display = 'none';
      gamesBtn.style.fontWeight = '700';
      gamesBtn.style.opacity = '1';
      insightsBtn.style.fontWeight = '400';
      insightsBtn.style.opacity = '0.7';
    }

    function showInsights(){
      glist.style.display = 'none';
      insightsPanel.style.display = '';
      insightsPanel.innerHTML = renderInsightsTab();
      insightsBtn.style.fontWeight = '700';
      insightsBtn.style.opacity = '1';
      gamesBtn.style.fontWeight = '400';
      gamesBtn.style.opacity = '0.7';
    }

    gamesBtn.onclick = showGames;
    insightsBtn.onclick = showInsights;

    // Start on games tab
    showGames();
  }
}

// Initialize when DOM is ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(initInsightsTab, 500));
} else {
  setTimeout(initInsightsTab, 500);
}

// Re-init when games list updates
const _renderGames = window.renderGames;
if(typeof _renderGames === 'function'){
  window.renderGames = function(){
    const r = _renderGames.apply(this, arguments);
    setTimeout(initInsightsTab, 100);
    return r;
  };
}

})();
