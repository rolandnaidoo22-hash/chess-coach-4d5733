/* Chess Review Enhancements: dark mode, key moments, patterns, insights, review tools */
(function(){
"use strict";
if(window.__chessEnhancements) return;
window.__chessEnhancements = true;

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

    html += `<button type="button" class="jump" data-ply="${p.ply}" style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:8px;cursor:pointer;text-align:left;">
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
        const ply = parseInt(el.getAttribute('data-ply'), 10);
        if(typeof window.go === 'function') window.go(ply, true);
      });
    });
  }
}

// Track patterns after analysis
if(!window.DATA && window.EXAMPLE_DATA) window.DATA = window.EXAMPLE_DATA;
const originalSetData = window.setData;
if(typeof window.setData === 'function'){
  window.setData = function(d){
    window.DATA = d;
    const result = originalSetData.apply(this, arguments);
    setTimeout(()=>{
      trackPatterns();
      injectEnhancements();
      if(typeof window.ChessEnhancements.refreshGame === 'function') window.ChessEnhancements.refreshGame();
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
window.ChessEnhancements = { getKeyMoments, renderKeyMoments, renderPatterns, trackPatterns, refreshGame: function(){} };

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
    else {
      const leak = getBiggestMistake(stats);
      insights.push({icon:'🎯', text:`Win rate is ${stats.winRate}%. Your biggest leak is likely ${leak ? leak.label.toLowerCase() : 'blunders'}. Drill that first.`});
    }
  }

  // Biggest mistake type
  const biggest = getBiggestMistake(stats);
  if(biggest) insights.push({icon:'⚠️', text:`Your most common issue: <strong>${biggest.label}</strong> (${biggest.count} times).`});

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
  if(!sorted.length || sorted[0][1] === 0) return null;
  const names = {blunder:'Blunders', mistake:'Mistakes', miss:'Missed wins', inaccuracy:'Inaccuracies'};
  return {key:sorted[0][0], label:names[sorted[0][0]] || sorted[0][0], count:sorted[0][1]};
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

  if(games.length >= 2){
    const recent = games.slice(0, 8).slice().reverse();
    html += '<h4 style="margin:16px 0 8px;font-size:14px;">Recent form:</h4>';
    html += '<div style="display:flex;gap:6px;align-items:flex-end;height:72px;margin-bottom:6px;">';
    recent.forEach(g => {
      const meta = g.data && g.data.meta ? g.data.meta : {};
      const acc = (g.data && g.data.summary && g.data.summary.accuracy != null) ? g.data.summary.accuracy : (g.acc || 0);
      const uc = meta.user_color || g.user;
      const result = meta.result || g.result;
      const won = (result === '1-0' && uc === 'w') || (result === '0-1' && uc === 'b');
      const lost = (result === '1-0' && uc === 'b') || (result === '0-1' && uc === 'w');
      const color = won ? 'var(--best)' : lost ? 'var(--blunder)' : 'var(--great)';
      const h = Math.max(8, Math.round((acc || 0) * 0.64));
      const title = (g.title || 'Game') + ' · ' + acc + '%';
      html += `<div title="${title.replace(/"/g,'')}" style="flex:1;height:${h}px;background:${color};border-radius:4px 4px 0 0;"></div>`;
    });
    html += '</div>';
    html += '<p style="font-size:12px;color:var(--mute);margin:0 0 8px;">Oldest of your last games is on the left. Green is a win, red a loss, blue a draw. Taller means higher accuracy.</p>';
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

/* ============ REVIEW TOOLS ============ */
const FLIP_KEY = 'chessReview.flipBoard';
const NOTES_KEY = 'chessReview.notes.v1';
const MARKS_KEY = 'chessReview.bookmarks.v1';
const SPEED_KEY = 'chessReview.playMs';
const BAD_CLS = ['blunder','mistake','miss','inaccuracy'];

let boardFlipped = false;
let plyIndex = 0;
let playTimer = null;
let playMs = 800;

function currentData(){
  return window.DATA || window.EXAMPLE_DATA || null;
}
function gameKey(d){
  if(!d || !d.meta) return 'unknown';
  const m = d.meta;
  return [m.link || '', m.white || '', m.black || '', m.date || ''].join('|');
}
function readJson(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  } catch(e){ return fallback; }
}
function escHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function materialText(fen){
  const board = String(fen || '').split(' ')[0];
  const val = {p:1, n:3, b:3, r:5, q:9};
  let w = 0, b = 0;
  for(const ch of board){
    const p = ch.toLowerCase();
    if(!val[p]) continue;
    if(ch === ch.toUpperCase()) w += val[p];
    else b += val[p];
  }
  const diff = w - b;
  if(!board) return 'Material –';
  if(diff === 0) return 'Material is level';
  return (diff > 0 ? 'White' : 'Black') + ' is ahead by ' + Math.abs(diff);
}
function fenAt(d, i){
  if(!d) return '';
  if(!i) return d.start_fen || '';
  const p = d.plies && d.plies[i - 1];
  return p ? (p.fen || '') : (d.start_fen || '');
}
function userLeaks(d){
  if(!d || !d.plies || !d.meta) return [];
  const uc = d.meta.user_color;
  return d.plies.filter(p => p.color === uc && BAD_CLS.indexOf(p.cls) >= 0);
}
function toast(msg){
  let t = document.getElementById('enh-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'enh-toast';
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#262421;color:#fff;padding:8px 14px;border-radius:999px;font-size:14px;z-index:80;box-shadow:0 4px 16px rgba(0,0,0,.25);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.display = 'none'; }, 1400);
}
function copyText(text, okMsg){
  const done = () => toast(okMsg || 'Copied');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); }
  catch(e){ toast('Could not copy'); }
  ta.remove();
}
function buildPgn(d){
  const m = d.meta || {};
  const headers = [
    ['Event', 'Chess Review'],
    ['Site', m.link || 'local'],
    ['Date', (m.date || '????.??.??').replace(/-/g, '.')],
    ['White', m.white || '?'],
    ['Black', m.black || '?'],
    ['Result', m.result || '*'],
    ['WhiteElo', m.white_elo || ''],
    ['BlackElo', m.black_elo || ''],
    ['ECO', m.eco || ''],
    ['Opening', m.opening || ''],
    ['TimeControl', m.time_control || '']
  ].filter((pair) => pair[1]).map((pair) => '[' + pair[0] + ' "' + String(pair[1]).replace(/"/g, '') + '"]').join('\n');
  let moves = '';
  let num = 0;
  (d.plies || []).forEach(p => {
    if(p.color === 'w'){
      num += 1;
      moves += (moves ? ' ' : '') + num + '. ' + p.san;
    } else {
      moves += ' ' + p.san;
    }
  });
  return headers + '\n\n' + moves.trim() + ' ' + (m.result || '*') + '\n';
}
function reviewText(d){
  const m = d.meta || {};
  const s = d.summary || {};
  const lines = [
    (m.white || '?') + ' vs ' + (m.black || '?'),
    [m.date, m.opening ? (m.opening + (m.eco ? ' (' + m.eco + ')' : '')) : '', 'Result ' + (m.result || '?')].filter(Boolean).join(' · '),
    'Your accuracy: ' + (s.accuracy != null ? s.accuracy + '%' : '–') + ' · Opponent: ' + (s.opp_accuracy != null ? s.opp_accuracy + '%' : '–'),
    ''
  ];
  if(s.top && s.top.length){
    lines.push('Biggest mistakes:');
    s.top.forEach(t => lines.push('- ' + t.label + ' (' + t.cls + '), better: ' + t.best));
    lines.push('');
  }
  if(s.work_on && s.work_on.length){
    lines.push('Work on next:');
    s.work_on.forEach(w => lines.push('- ' + w));
  }
  return lines.join('\n').trim() + '\n';
}
function relabelFlipped(){
  const board = document.getElementById('board');
  if(!board) return;
  const texts = board.querySelectorAll('text');
  if(texts.length < 16) return;
  const files = Array.prototype.slice.call(texts, 0, 8);
  const ranks = Array.prototype.slice.call(texts, 8, 16);
  const fileLabels = files.map(t => t.textContent).reverse();
  const rankLabels = ranks.map(t => t.textContent).reverse();
  fileLabels.forEach((lab, i) => { files[i].textContent = lab; });
  rankLabels.forEach((lab, i) => { ranks[i].textContent = lab; });
}
function installBoardHooks(){
  if(typeof window.xy === 'function' && !window.xy.__enh){
    const orig = window.xy;
    const wrapped = function(sq){
      const pt = orig(sq);
      if(!boardFlipped) return pt;
      return [315 - pt[0], 315 - pt[1]];
    };
    wrapped.__enh = true;
    window.xy = wrapped;
  }
  if(typeof window.drawBoard === 'function' && !window.drawBoard.__enh){
    const orig = window.drawBoard;
    const wrapped = function(){
      const r = orig.apply(this, arguments);
      if(boardFlipped) relabelFlipped();
      return r;
    };
    wrapped.__enh = true;
    window.drawBoard = wrapped;
  }
  if(typeof window.go === 'function' && !window.go.__enh){
    const orig = window.go;
    const wrapped = function(i){
      const d = currentData();
      const n = d && d.plies ? d.plies.length : i;
      plyIndex = Math.max(0, Math.min(n, i));
      return orig.apply(this, arguments);
    };
    wrapped.__enh = true;
    window.go = wrapped;
  }
  if(typeof window.show === 'function' && !window.show.__enh){
    const orig = window.show;
    const wrapped = function(){
      const r = orig.apply(this, arguments);
      refreshPosition();
      return r;
    };
    wrapped.__enh = true;
    window.show = wrapped;
  }
  if(typeof window.loadData === 'function' && !window.loadData.__enh){
    const orig = window.loadData;
    const wrapped = function(){
      plyIndex = 0;
      stopPlay();
      const r = orig.apply(this, arguments);
      refreshGamePanels();
      return r;
    };
    wrapped.__enh = true;
    window.loadData = wrapped;
  }
}
function setFlip(on, redraw){
  boardFlipped = !!on;
  try { localStorage.setItem(FLIP_KEY, boardFlipped ? '1' : '0'); } catch(e){}
  const btn = document.getElementById('enh-flip');
  if(btn){
    btn.textContent = boardFlipped ? 'Flip board (on)' : 'Flip board';
    btn.setAttribute('aria-pressed', boardFlipped ? 'true' : 'false');
  }
  if(redraw && typeof window.show === 'function') window.show();
}
function stopPlay(){
  if(playTimer){ clearInterval(playTimer); playTimer = null; }
  const btn = document.getElementById('enh-play');
  if(btn){ btn.textContent = 'Play'; btn.setAttribute('aria-pressed', 'false'); }
}
function playStep(){
  const d = currentData();
  if(!d || !d.plies || plyIndex >= d.plies.length){ stopPlay(); return; }
  if(typeof window.go === 'function') window.go(plyIndex + 1);
}
function startPlay(){
  stopPlay();
  const btn = document.getElementById('enh-play');
  if(btn){ btn.textContent = 'Pause'; btn.setAttribute('aria-pressed', 'true'); }
  playStep();
  playTimer = setInterval(playStep, playMs);
}
function togglePlay(){
  if(playTimer) stopPlay();
  else startPlay();
}
function jumpLeak(dir){
  const leaks = userLeaks(currentData());
  if(!leaks.length || typeof window.go !== 'function'){
    toast('No mistakes to jump to');
    return;
  }
  stopPlay();
  let target = null;
  if(dir > 0) target = leaks.find(p => p.ply > plyIndex) || leaks[0];
  else {
    for(let i = leaks.length - 1; i >= 0; i--){
      if(leaks[i].ply < plyIndex){ target = leaks[i]; break; }
    }
    if(!target) target = leaks[leaks.length - 1];
  }
  window.go(target.ply, true);
}
function refreshPosition(){
  const el = document.getElementById('enh-pos');
  const d = currentData();
  if(!el || !d) return;
  const fen = fenAt(d, plyIndex);
  const move = plyIndex === 0 ? 'Starting position' : ((d.plies[plyIndex - 1] && d.plies[plyIndex - 1].label) || ('Move ' + plyIndex));
  el.textContent = move + ' · ' + materialText(fen);
  el.dataset.fen = fen;
}
function refreshGamePanels(){
  const d = currentData();
  const notes = document.getElementById('enh-notes');
  if(notes && d){
    const all = readJson(NOTES_KEY, {}) || {};
    notes.value = all[gameKey(d)] || '';
  }
  const focus = document.getElementById('enh-focus');
  if(focus){
    const leaks = userLeaks(d);
    if(!leaks.length){
      focus.innerHTML = '<p class="enh-meta">No inaccuracies or mistakes on your moves in this game.</p>';
    } else {
      focus.innerHTML = leaks.map(p => {
        const color = {blunder:'var(--blunder)', mistake:'var(--mistake)', miss:'var(--miss)', inaccuracy:'var(--inaccuracy)'}[p.cls] || 'var(--mute)';
        return '<button type="button" class="jump" data-ply="' + p.ply + '" style="border-left:4px solid ' + color + '"><b>' +
          escHtml(p.label) + '</b> <small>' + escHtml(p.cls) + ' · best ' + escHtml(p.best_san || '?') + '</small></button>';
      }).join('');
      focus.querySelectorAll('[data-ply]').forEach(btn => {
        btn.addEventListener('click', () => {
          stopPlay();
          const n = parseInt(btn.getAttribute('data-ply'), 10);
          if(typeof window.go === 'function') window.go(n, true);
        });
      });
    }
  }
  renderBookmarks();
  refreshPosition();
}
function renderBookmarks(){
  const box = document.getElementById('enh-marks');
  if(!box) return;
  const key = gameKey(currentData());
  const marks = (readJson(MARKS_KEY, []) || []).filter(m => m && m.game === key);
  if(!marks.length){
    box.innerHTML = '<p class="enh-meta">Save a position to come back to it on this game.</p>';
    return;
  }
  box.innerHTML = marks.map(m => '<div class="enh-mark"><button type="button" class="jump" data-id="' + escHtml(m.id) + '"><b>' +
    escHtml(m.label) + '</b></button><button type="button" class="btn" data-del="' + escHtml(m.id) + '" title="Remove">✕</button></div>').join('');
  box.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const m = (readJson(MARKS_KEY, []) || []).find(x => x.id === id);
      if(m && typeof window.go === 'function'){ stopPlay(); window.go(m.ply, true); }
    });
  });
  box.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      const next = (readJson(MARKS_KEY, []) || []).filter(x => x.id !== id);
      try { localStorage.setItem(MARKS_KEY, JSON.stringify(next)); } catch(e){}
      renderBookmarks();
    });
  });
}
function saveBookmark(){
  const d = currentData();
  if(!d) return;
  const label = plyIndex === 0 ? 'Start' : ((d.plies[plyIndex - 1] && d.plies[plyIndex - 1].label) || ('Ply ' + plyIndex));
  const marks = readJson(MARKS_KEY, []) || [];
  const id = gameKey(d) + '#' + plyIndex;
  if(marks.some(m => m.id === id)){ toast('Already saved'); return; }
  marks.unshift({id:id, game:gameKey(d), ply:plyIndex, label:label, saved:Date.now()});
  try { localStorage.setItem(MARKS_KEY, JSON.stringify(marks.slice(0, 40))); }
  catch(e){ toast('Could not save'); return; }
  renderBookmarks();
  toast('Position saved');
}
function saveNotes(){
  const d = currentData();
  const notes = document.getElementById('enh-notes');
  if(!d || !notes) return;
  const all = readJson(NOTES_KEY, {}) || {};
  const key = gameKey(d);
  if(notes.value.trim()) all[key] = notes.value.slice(0, 2000);
  else delete all[key];
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(all)); } catch(e){}
}
function initReviewTools(){
  if(document.getElementById('enh-tools')) return;
  if(!document.querySelector('.side')) return;
  installBoardHooks();
  try { boardFlipped = localStorage.getItem(FLIP_KEY) === '1'; } catch(e){}
  try {
    const s = parseInt(localStorage.getItem(SPEED_KEY) || '', 10);
    if(s === 400 || s === 800 || s === 1400) playMs = s;
  } catch(e){}
  const hm = location.hash.match(/ply=(\d+)/);
  if(hm) plyIndex = +hm[1];

  const style = document.createElement('style');
  style.id = 'enh-tools-css';
  style.textContent = [
    '.enh-tools h3{margin:12px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}',
    '.enh-tools h3:first-child{margin-top:0}',
    '.enh-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}',
    '.enh-tools .btn{font-size:13px;padding:7px 10px}',
    '.enh-meta{font-size:13px;color:var(--mute);margin:0 0 8px}',
    '.enh-focus{display:grid;gap:4px}',
    '.enh-focus .jump small{margin-left:auto}',
    '.enh-note{width:100%;min-height:68px;font:inherit;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--card);color:var(--ink)}',
    '.enh-mark{display:flex;gap:6px;align-items:center;margin-bottom:4px}',
    '.enh-mark .jump{flex:1}',
    '.enh-speed{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}',
    'html.dark-mode .enh-note, html.dark-mode .enh-speed{background:#333;color:#e8e8e8;border-color:#555}'
  ].join('');
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'card enh-tools';
  card.id = 'enh-tools';
  card.innerHTML = [
    '<h3>Review tools</h3>',
    '<p class="enh-meta" id="enh-pos"></p>',
    '<div class="enh-row">',
    '<button type="button" class="btn" id="enh-flip" aria-pressed="false">Flip board</button>',
    '<button type="button" class="btn" id="enh-play" aria-pressed="false">Play</button>',
    '<select id="enh-speed" class="enh-speed" aria-label="Autoplay speed">',
    '<option value="1400">Slow</option><option value="800">Normal</option><option value="400">Fast</option>',
    '</select>',
    '<button type="button" class="btn" id="enh-prev">Previous mistake</button>',
    '<button type="button" class="btn" id="enh-next">Next mistake</button>',
    '</div>',
    '<div class="enh-row">',
    '<button type="button" class="btn" id="enh-fen">Copy FEN</button>',
    '<button type="button" class="btn" id="enh-share">Copy summary</button>',
    '<button type="button" class="btn" id="enh-pgn">Download PGN</button>',
    '<button type="button" class="btn" id="enh-save">Save position</button>',
    '</div>',
    '<p class="enh-meta">Keys: F flip, space play or pause, J next mistake, K previous mistake.</p>',
    '<h3>Your mistakes</h3><div id="enh-focus"></div>',
    '<h3>Saved positions</h3><div id="enh-marks"></div>',
    '<h3>Notes for this game</h3>',
    '<textarea id="enh-notes" class="enh-note" maxlength="2000" placeholder="What do you want to remember about this game?"></textarea>'
  ].join('');
  const side = document.querySelector('.side');
  const movecard = document.getElementById('movecard');
  if(movecard) side.insertBefore(card, movecard);
  else side.prepend(card);

  document.getElementById('enh-flip').onclick = () => setFlip(!boardFlipped, true);
  document.getElementById('enh-play').onclick = togglePlay;
  document.getElementById('enh-prev').onclick = () => jumpLeak(-1);
  document.getElementById('enh-next').onclick = () => jumpLeak(1);
  document.getElementById('enh-fen').onclick = () => {
    const fen = (document.getElementById('enh-pos') || {}).dataset && document.getElementById('enh-pos').dataset.fen || fenAt(currentData(), plyIndex);
    if(fen) copyText(fen, 'FEN copied');
  };
  document.getElementById('enh-share').onclick = () => {
    const d = currentData();
    if(d) copyText(reviewText(d), 'Summary copied');
  };
  document.getElementById('enh-pgn').onclick = () => {
    const d = currentData();
    if(!d) return;
    const blob = new Blob([buildPgn(d)], {type:'application/x-chess-pgn'});
    const a = document.createElement('a');
    const m = d.meta || {};
    a.href = URL.createObjectURL(blob);
    a.download = ((m.white || 'white') + ' vs ' + (m.black || 'black') + '.pgn').replace(/\s+/g, '-');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast('PGN downloaded');
  };
  document.getElementById('enh-save').onclick = saveBookmark;
  const speed = document.getElementById('enh-speed');
  speed.value = String(playMs);
  speed.onchange = () => {
    playMs = parseInt(speed.value, 10) || 800;
    try { localStorage.setItem(SPEED_KEY, String(playMs)); } catch(e){}
    if(playTimer){
      clearInterval(playTimer);
      playTimer = setInterval(playStep, playMs);
    }
  };
  document.getElementById('enh-notes').addEventListener('input', saveNotes);
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || (e.target && e.target.isContentEditable)) return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    if(e.key === 'f' || e.key === 'F'){ e.preventDefault(); setFlip(!boardFlipped, true); }
    else if(e.key === ' '){ e.preventDefault(); togglePlay(); }
    else if(e.key === 'j' || e.key === 'J'){ e.preventDefault(); jumpLeak(1); }
    else if(e.key === 'k' || e.key === 'K'){ e.preventDefault(); jumpLeak(-1); }
  });
  document.addEventListener('click', e => {
    if(e.target.closest && e.target.closest('.mcell, #bNext, #bPrev, #bFirst, #bLast, #evgraph')) stopPlay();
  }, true);

  if(!window.DATA && window.EXAMPLE_DATA) window.DATA = window.EXAMPLE_DATA;
  window.ChessEnhancements.refreshGame = refreshGamePanels;
  setFlip(boardFlipped, boardFlipped);
  refreshGamePanels();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initReviewTools);
} else {
  initReviewTools();
}
setTimeout(() => { if(!document.getElementById('enh-tools')) initReviewTools(); }, 0);

})();
