const express = require('express');
const cron = require('node-cron');
const config = require('./config');
const { collect, loadData, saveData, generatePostSuggestion, submitArticle } = require('./collector');
const { sendDigest } = require('./telegram');
const { collectTest, calculateMarchScore } = require('./collector-test');

const app = express();
app.use(express.json());

// ============ Test API Routes ============
app.get('/api/test/items', (req, res) => {
  const dataPath = './data-test.json';
  const data = JSON.parse(require('fs').readFileSync(dataPath, 'utf8'));
  
  let items = data.items;
  const { sort, priority, minScore, limit = 50, aiLeadership } = req.query;
  
  if (sort === 'priority') {
    items.sort((a, b) => (b.marchScore || 50) - (a.marchScore || 50));
  } else if (sort === 'asc') {
    items.sort((a, b) => (a.marchScore || 50) - (b.marchScore || 50));
  }
  
  if (aiLeadership === 'true') {
    items = items.filter(i => i.aiLeadership === true);
  }
  
  if (minScore) {
    const min = parseInt(minScore);
    items = items.filter(i => (i.marchScore || 0) >= min);
  }
  
  if (limit) {
    items = items.slice(0, parseInt(limit));
  }
  
  res.json(items);
});

app.get('/api/test/stats', (req, res) => {
  const dataPath = './data-test.json';
  const data = JSON.parse(require('fs').readFileSync(dataPath, 'utf8'));
  const items = data.items;

  const stats = {
    total: items.length,
    byPriority: {
      '3 (Critical)': items.filter(i => i.priorityLevel === 3).length,
      '2 (High)': items.filter(i => i.priorityLevel === 2).length,
      '1 (Moderate)': items.filter(i => i.priorityLevel === 1).length,
      '0 (Low)': items.filter(i => i.priorityLevel === 0).length
    },
    bySource: {
      'Reuters': items.filter(i => i.source === 'Reuters').length,
      'Bloomberg': items.filter(i => i.source === 'Bloomberg').length,
      'Financial Times': items.filter(i => i.source === 'Financial Times').length,
      'General': items.filter(i => !['Reuters', 'Bloomberg', 'Financial Times'].includes(i.source)).length
    },
    byAiLeadership: {
      'AI Leadership': items.filter(i => i.aiLeadership === true).length,
      'Non-AI': items.filter(i => i.aiLeadership !== true).length
    },
    avgMarchScore: items.reduce((sum, i) => sum + (i.marchScore || 50), 0) / items.length
  };

  res.json(stats);
});

app.post('/api/test/collect', async (req, res) => {
  const count = await collectTest();
  res.json({ collected: count, message: 'Test data processed with March scores' });
});

// ============ Production API Routes ============

app.get('/api/items', (req, res) => {
  const data = loadData();
  const { status, limit = 50, source } = req.query;
  
  let items = data.items;
  if (status) items = items.filter(i => i.status === status);
  if (source) items = items.filter(i => i.source.toLowerCase().includes(source.toLowerCase()));
  
  res.json({
    items: items.slice(0, parseInt(limit)),
    stats: data.stats,
    lastFetch: data.lastFetch
  });
});

app.get('/api/item/:id', (req, res) => {
  const data = loadData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  
  if (!item.postSuggestion) {
    item.postSuggestion = generatePostSuggestion(item);
    saveData(data);
  }
  
  res.json(item);
});

app.post('/api/item/:id/status', (req, res) => {
  const data = loadData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  
  item.status = req.body.status;
  if (req.body.status === 'posted') {
    item.postedAt = new Date().toISOString();
  }
  saveData(data);
  res.json(item);
});

app.post('/api/item/:id/regenerate', (req, res) => {
  const data = loadData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  
  item.postSuggestion = generatePostSuggestion(item);
  saveData(data);
  res.json(item);
});

app.post('/api/collect', async (req, res) => {
  const items = await collect();
  res.json({ collected: items.length });
});

app.post('/api/submit', async (req, res) => {
  const { url, submittedBy } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  
  const item = await submitArticle(url, submittedBy || 'Finneigan');
  if (item.error) return res.status(500).json(item);
  res.json({ ok: true, item });
});

app.post('/api/digest/:period', async (req, res) => {
  await sendDigest(req.params.period);
  res.json({ ok: true });
});

app.get('/api/stats', (req, res) => {
  const data = loadData();
  res.json({
    totalItems: data.items.length,
    ...data.stats,
    lastFetch: data.lastFetch,
    bySource: data.items.reduce((acc, i) => {
      acc[i.source] = (acc[i.source] || 0) + 1;
      return acc;
    }, {}),
    byStatus: data.items.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {})
  });
});

// ============ Web Interface ============

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agency | MicroFeed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      color: #e2e8f0;
    }
    .header {
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .header h1 { font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem; }
    .header h1 span { font-size: 0.9rem; color: #94a3b8; }
    .stats { font-size: 0.8rem; color: #cbd5e1; }
    .controls {
      padding: 1rem 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .controls button, .controls select {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      cursor: pointer;
    }
    .controls button:hover { background: #3b82f6; }
    .controls button.primary { background: #3b82f6; }
    .controls button.test { background: #10b981; }
    .container { padding: 1rem 2rem; }
    .item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      border-left: 4px solid #3b82f6;
    }
    .item.tier-1 { border-left-color: #f59e0b; }
    .item.tier-2 { border-left-color: #fbbf24; }
    .item.tier-3 { border-left-color: #fcd34d; }
    .item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .item-title { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .item-title a { color: #60a5fa; text-decoration: none; }
    .item-title a:hover { text-decoration: underline; }
    .item-meta { font-size: 0.85rem; color: #a5d6f7; margin-bottom: 0.75rem; }
    .item-meta span { margin-right: 1rem; }
    .item-summary { color: #4ade80; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem; }
    .score { background: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .post-builder {
      background: rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }
    .post-builder h4 { color: #60a5fa; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .post-builder h4 span { color: #60a5fa; }
    .post-builder h4 span.march { color: #f59e0b; }
    .post-builder h4 span.ai { color: #10b981; }
    .post-draft {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      line-height: 1.6;
      white-space: pre-wrap;
      margin-bottom: 0.75rem;
    }
    .post-actions { display: flex; gap: 0.5rem; }
    .post-actions button {
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }
    .btn-copy { background: #3b82f6; color: white; }
    .btn-posted { background: #10b981; color: white; }
    .btn-save { background: #10b981; color: white; }
    .btn-save:hover { background: #059669; }
    .empty { text-align: center; padding: 3rem; color: #6b7280; }
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #3b82f6;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: none;
    }
    .toast.show { display: block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📡 Agency <span style="color:#3b82f6">| MicroFeed</span> <span style="color:#10b981">| March Score Prioritization</span></h1>
    <div class="stats">
      Total: <span id="totalItems">0</span> | AI Leadership: <span id="aiLeadership">0</span> | Avg Score: <span id="avgScore">0</span>
    </div>
  </div>
  <div class="controls">
    <button class="test" onclick="triggerTestCollection()">🧪 Test Collection</button>
    <button class="primary" onclick="triggerProductionCollection()">🔄 Collect Production</button>
    <button class="test" onclick="loadTestItems()">📋 Load Test Items</button>
    <button class="primary" onclick="loadProductionItems()">📋 Load Production Items</button>
    <button onclick="triggerTestDigest()">🧪 Test Digest</button>
  </div>
  <div class="container" id="items"><div class="empty">Loading...</div></div>
  <div class="toast" id="toast">Copied!</div>
  <script>
    const API_BASE = window.location.origin + '/api';
    const CURRENT_MODE = 'production'; // 'production' or 'test'

    async function loadItems(mode) {
      const endpoint = mode === 'test' ? '/api/test/items' : '/api/items';
      const res = await fetch(endpoint);
      const data = await res.json();
      displayItems(data.items);
      updateStats(data.items);
    }

    async function triggerCollection(mode) {
      const endpoint = mode === 'test' ? '/api/test/collect' : '/api/collect';
      const res = await fetch(endpoint, {method: 'POST'});
      const data = await res.json();
      alert(data.message || 'Collection triggered');
    }

    async function triggerTestDigest() {
      const res = await fetch('/api/digest/afternoon', {method: 'POST'});
      const data = await res.json();
      alert(data.message || 'Test digest triggered');
    }

    function displayItems(items) {
      const container = document.getElementById('items');
      container.innerHTML = items.map(item => \`
        <div class="item tier-\${item.priorityLevel}">
          <div class="item-header">
            <div class="item-title"><a href="\${item.url}" target="_blank">\${esc(item.title)}</a></div>
            <div class="item-meta">
              <span>📰 \${item.source}</span>
              <span>📅 \${new Date(item.postedAt || item.publishedAt).toLocaleDateString()}</span>
              \${item.aiLeadership ? '<span class="ai">🤖 AI Leadership</span>' : ''}
              \${item.marchScore ? '<span class="march">Score: ' + item.marchScore + '</span>' : ''}
              \${item.status === 'posted' ? '<span class="status-posted">✅ Posted</span>' : ''}
            </div>
          </div>
          <div class="item-summary">\${esc(item.summary || '')}</div>
          <div class="post-builder">
            \${item.postSuggestion ? \`
            <h4>💡 Post Idea</h4>
            <div class="post-draft" id="draft-\${item.id}">\${esc(item.postSuggestion.draft)}</div>
            <div class="post-actions">
              <button class="btn-copy" onclick="copyToClipboard('draft-\${item.id}')">📋 Copy</button>
              <button class="btn-posted" onclick="markPosted('\${item.id}')">✅ Posted</button>
            </div>
            \` : ''}
          </div>
        </div>
      \`).join('');
    }

    function updateStats(items) {
      document.getElementById('totalItems').textContent = items.length;
      const aiCount = items.filter(i => i.aiLeadership).length;
      document.getElementById('aiLeadership').textContent = aiCount;
      const avgScore = items.reduce((sum, i) => sum + (i.marchScore || 0), 0) / items.length;
      document.getElementById('avgScore').textContent = avgScore.toFixed(1);
    }

    function esc(s) { return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    async function copyToClipboard(id) {
      const el = document.getElementById(id);
      const text = el.textContent;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch (err) {
        showToast('Failed to copy');
      }
    }
    async function markPosted(id) {
      const res = await fetch('/api/item/' + id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'posted' })
      });
      if (res.ok) {
        showToast('Marked as posted');
        loadItems(CURRENT_MODE);
      }
    }
    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
    async function loadTestItems() {
      await loadItems('test');
    }
    async function loadProductionItems() {
      await loadItems('production');
    }
    function triggerTestCollection() {
      triggerCollection('test');
    }
    function triggerProductionCollection() {
      triggerCollection('production');
    }
    loadItems('production');
  </script>
</body>
</html>`);
});

// ============ Cron Jobs ============

cron.schedule(config.schedule.morning, async () => {
  console.log('⏰ Running morning collection + digest');
  await collect();
  await sendDigest('morning');
});

cron.schedule(config.schedule.afternoon, async () => {
  console.log('⏰ Running afternoon collection + digest');
  await collect();
  await sendDigest('afternoon');
});

cron.schedule('0 */3 * * *', async () => {
  console.log('⏰ Running scheduled collection');
  await collect();
});

// ============ Start Server ============

app.listen(config.server.port, '0.0.0.0', () => {
  console.log('📡 Agency | MicroFeed Running!');
  console.log('   Web UI: http://localhost:' + config.server.port);
  console.log('   Test API: http://localhost:' + config.server.port + '/api/test');
  console.log('   Production API: http://localhost:' + config.server.port + '/api');
  console.log('   March Score: Implemented');
  console.log('   Prioritization: AI Leadership > Technology > General');
  console.log('   Ready to serve!');
});
