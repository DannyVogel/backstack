import type { H3Event } from 'nitro/h3'
import { getCookie, setCookie } from 'h3'
import { defineHandler } from 'nitro/h3'
import { loggerConfig } from '~/server/config/logger'
import { verifyViewerApiKey } from '~/server/logger/utils/viewer-auth'
import { secureCompare } from '~/server/utils/secure-compare'

export default defineHandler(async (event: H3Event) => {
  // Check if user has a valid viewer session cookie
  const sessionCookie = getCookie(event, 'log_viewer_session')
  const hasValidSession = secureCompare(sessionCookie, loggerConfig.viewerKey)

  // If no valid session, require API key and set session cookie
  if (!hasValidSession) {
    verifyViewerApiKey(event)

    // Set HTTP-only session cookie for subsequent requests
    setCookie(event, 'log_viewer_session', loggerConfig.viewerKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/logs',
    })
  }

  // The HTML log viewer
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log Viewer - BackStack</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(59, 130, 246, 0.3); }
    h1 { font-size: 2rem; font-weight: 300; letter-spacing: 0.3rem; color: #e0e0e0; margin-bottom: 8px; }
    .last-updated { font-size: 0.875rem; color: #888; }
    .controls { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
    .control-group { display: flex; gap: 8px; align-items: center; }
    label { font-size: 0.875rem; color: #aaa; white-space: nowrap; }
    select, input, button {
      background: rgba(30, 30, 30, 0.8);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 6px;
      padding: 8px 12px;
      color: #e0e0e0;
      font-size: 0.875rem;
      font-family: inherit;
    }
    button { cursor: pointer; transition: all 0.2s; }
    button:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); }
    .logs-container {
      background: rgba(20, 20, 20, 0.6);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 8px;
      overflow: hidden;
      max-height: calc(100vh - 250px);
      display: flex;
      flex-direction: column;
    }
    .logs-header {
      padding: 12px 16px;
      background: rgba(15, 15, 15, 0.8);
      border-bottom: 1px solid rgba(59, 130, 246, 0.2);
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #aaa;
    }
    .logs-list { overflow-y: auto; flex: 1; }
    .log-entry { padding: 12px 16px; border-bottom: 1px solid rgba(59, 130, 246, 0.1); }
    .log-entry:hover { background: rgba(59, 130, 246, 0.05); }
    .log-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
    .log-level { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .log-level.debug { background: #6b7280; }
    .log-level.info { background: #3b82f6; }
    .log-level.warn { background: #f59e0b; }
    .log-level.error { background: #ef4444; }
    .log-level.critical { background: #991b1b; }
    .log-timestamp { font-size: 0.75rem; color: #888; font-family: monospace; }
    .log-source { font-size: 0.75rem; color: #aaa; background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 3px; }
    .log-message { color: #e0e0e0; font-size: 0.875rem; line-height: 1.5; }
    .empty-state { padding: 40px; text-align: center; color: #666; }
    .pagination { display: flex; gap: 8px; align-items: center; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>LOG VIEWER</h1>
      <div class="last-updated" id="lastUpdated"></div>
    </header>
    <div class="controls">
      <div class="control-group">
        <label>Level:</label>
        <select id="levelFilter">
          <option value="">All</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div class="control-group">
        <label>Hours:</label>
        <select id="hoursFilter">
          <option value="1">1</option>
          <option value="6">6</option>
          <option value="24" selected>24</option>
          <option value="72">72</option>
        </select>
      </div>
      <div class="control-group">
        <label>Search:</label>
        <input type="text" id="searchInput" placeholder="Search...">
      </div>
      <button id="refreshBtn">Refresh</button>
    </div>
    <div class="logs-container">
      <div class="logs-header">
        <span id="logCount">0 logs</span>
        <div class="pagination">
          <button id="prevPage" disabled>&larr;</button>
          <span id="pageInfo">Page 1</span>
          <button id="nextPage" disabled>&rarr;</button>
        </div>
      </div>
      <div class="logs-list" id="logsList">
        <div class="empty-state">Loading...</div>
      </div>
    </div>
  </div>
  <script>
    const PER_PAGE = 50;
    let page = 1, logs = [], filtered = [];
    const $ = id => document.getElementById(id);

    function render() {
      const start = (page - 1) * PER_PAGE;
      const items = filtered.slice(start, start + PER_PAGE);
      if (!items.length) { $('logsList').innerHTML = '<div class="empty-state">No logs</div>'; return; }
      $('logsList').innerHTML = items.map(l => \`
        <div class="log-entry">
          <div class="log-header">
            <span class="log-level \${l.level}">\${l.level}</span>
            <span class="log-timestamp">\${new Date(l.timestamp).toLocaleString()}</span>
            <span class="log-source">\${l.source}</span>
          </div>
          <div class="log-message">\${l.message}</div>
        </div>
      \`).join('');
      const pages = Math.ceil(filtered.length / PER_PAGE);
      $('pageInfo').textContent = 'Page ' + page + ' of ' + (pages || 1);
      $('prevPage').disabled = page <= 1;
      $('nextPage').disabled = page >= pages;
      $('logCount').textContent = filtered.length + ' logs';
    }

    function filter() {
      const level = $('levelFilter').value;
      const search = $('searchInput').value.toLowerCase();
      filtered = logs.filter(l =>
        (!level || l.level === level) &&
        (!search || l.message.toLowerCase().includes(search))
      );
      page = 1;
      render();
    }

    async function load() {
      const hours = $('hoursFilter').value;
      const res = await fetch('/logs/data?hours=' + hours, { credentials: 'include' });
      const data = await res.json();
      logs = data.logs || [];
      $('lastUpdated').textContent = 'Updated: ' + new Date().toLocaleString();
      filter();
    }

    $('levelFilter').onchange = filter;
    $('searchInput').oninput = filter;
    $('hoursFilter').onchange = load;
    $('refreshBtn').onclick = load;
    $('prevPage').onclick = () => { page--; render(); };
    $('nextPage').onclick = () => { page++; render(); };
    load();
  </script>
</body>
</html>`

  event.res.headers.set('Content-Type', 'text/html; charset=utf-8')
  return html
})
