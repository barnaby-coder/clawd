const express = require('express');
const cron = require('node-cron');
const config = require('./config');
const { collect, loadData, saveData, generatePostSuggestion, submitArticle } = require('./collector');
const { sendDigest } = require('./telegram');

const app = express();
app.use(express.json());

// ============ API Routes ============

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
      background: rgba(0,0,0,0.3);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .header h1 { font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem; }
    .stats { font-size: 0.8rem; color: #94a3b8; }
    .controls {
      padding: 1rem 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .controls button, .controls select {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      color: #fff;
      cursor: pointer;
    }
    .controls button:hover { background: #3b82f6; }
    .controls button.primary { background: #3b82f6; }
    .container { padding: 1rem 2rem; }
    .item {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      border-left: 4px solid #3b82f6;
    }
    .item.tier-1 { border-left-color: #f59e0b; }
    .item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .item-title { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .item-title a { color: #93c5fd; text-decoration: none; }
    .item-title a:hover { text-decoration: underline; }
    .item-meta { font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem; }
    .item-meta span { margin-right: 1rem; }
    .item-summary { color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem; }
    .score { background: #1e40af; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .post-builder {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }
    .post-builder h4 { color: #10b981; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .post-draft {
      background: rgba(0,0,0,0.3);
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
    .btn-save { background: #6b7280; color: white; }
    .empty { text-align: center; padding: 3rem; color: #64748b; }
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #10b981;
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
    <h1>📡 Agency | MicroFeed</h1>
    <div class="stats" id="stats">Loading...</div>
  </div>
  <div class="controls">
    <button class="primary" onclick="collectNow()">🔄 Collect Now</button>
    <button onclick="sendDigestNow('morning')">📬 Morning Digest</button>
    <button onclick="sendDigestNow('afternoon')">📬 Afternoon Digest</button>
    <select id="filter" onchange="loadItems()">
      <option value="">All Items</option>
      <option value="new">New Only</option>
      <option value="delivered">Delivered</option>
      <option value="posted">Posted</option>
      <option value="saved">Saved</option>
    </select>
    <div style="display:flex; gap:0.5rem; flex:1; max-width:500px;">
      <input type="text" id="submitUrl" placeholder="Paste article URL to add..." style="flex:1; padding:0.5rem 1rem; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.1); color:#fff;">
      <button onclick="submitArticle()" style="background:#10b981;">📎 Add</button>
    </div>
  </div>
  <div class="container" id="items"><div class="empty">Loading...</div></div>
  <div class="toast" id="toast">Copied!</div>
  <script>
    async function loadItems() {
      const filter = document.getElementById('filter').value;
      const url = '/api/items?limit=30' + (filter ? '&status=' + filter : '');
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('stats').textContent =
        'Total: ' + data.stats.totalCollected + ' | Last fetch: ' +
        (data.lastFetch ? new Date(data.lastFetch).toLocaleString() : 'Never');
      if (data.items.length === 0) {
        document.getElementById('items').innerHTML = '<div class="empty">No items found.</div>';
        return;
      }
      document.getElementById('items').innerHTML = data.items.map(item => \`
        <div class="item \${item.tier === 1 ? 'tier-1' : ''}">
          <div class="item-header"><div>
            <div class="item-title"><a href="\${item.link}" target="_blank">\${esc(item.title)}</a></div>
            <div class="item-meta">
              <span>📰 \${item.source}</span>
              <span>📅 \${new Date(item.pubDate).toLocaleDateString()}</span>
              <span class="score">Score: \${item.score}</span>
              <span>\${item.status === 'posted' ? '✅ Posted' : item.status === 'saved' ? '💾 Saved' : ''}</span>
            </div>
          </div></div>
          <div class="item-summary">\${esc(item.summary || '')}</div>
          \${item.postSuggestion ? \`
          <div class="post-builder">
            <h4>💡 Post Idea <span style="font-weight:normal;font-size:0.75rem;color:#6b7280;">(\${item.postSuggestion.archetype || 'classic'})</span></h4>
            <div class="post-draft" id="draft-\${item.id}">\${esc(item.postSuggestion.draft)}</div>
            <div class="post-actions">
              <button class="btn-copy" onclick="copyDraft('\${item.id}')">📋 Copy</button>
              <button class="btn-posted" onclick="markStatus('\${item.id}', 'posted')">✅ Posted</button>
              <button class="btn-save" onclick="markStatus('\${item.id}', 'saved')">💾 Save</button>
              <button style="background:#6366f1;color:white;" onclick="regeneratePost('\${item.id}')">🔄 New Angle</button>
            </div>
          </div>\` : ''}
        </div>
      \`).join('');
    }
    function esc(s) { return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    async function regeneratePost(id) { await fetch('/api/item/'+id+'/regenerate',{method:'POST'}); showToast('New angle generated'); loadItems(); }
    async function submitArticle() {
      const url = document.getElementById('submitUrl').value.trim();
      if (!url) return alert('Please paste a URL');
      const res = await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,submittedBy:'Finneigan'})});
      const data = await res.json();
      if (data.ok) { document.getElementById('submitUrl').value=''; showToast('Article added'); loadItems(); }
      else { showToast('Error: '+(data.error||'Failed')); }
    }
    async function collectNow() { const res = await fetch('/api/collect',{method:'POST'}); const data = await res.json(); showToast('Collected '+data.collected+' items'); loadItems(); }
    async function sendDigestNow(period) { await fetch('/api/digest/'+period,{method:'POST'}); showToast('Digest sent!'); }
    function copyDraft(id) { navigator.clipboard.writeText(document.getElementById('draft-'+id).textContent); showToast('Copied!'); }
    async function markStatus(id, status) { await fetch('/api/item/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}); showToast('Marked '+status); loadItems(); }
    function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }
    loadItems();
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
  console.log('📡 Agency MicroFeed Running!');
  console.log('   Web UI: http://localhost:' + config.server.port);
  console.log('   Schedule: 7:30am & 3:00pm MST');
  console.log('   Ready to serve!');
});
