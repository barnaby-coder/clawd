const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load test data
const dataPath = path.join(__dirname, 'data-test.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// March Score Calculation (same as production)
function calculateMarchScore(item) {
  let score = 50; // Baseline score

  // Check source and apply boost
  if (item.source.toLowerCase().includes('bloomberg') ||
      item.source.toLowerCase().includes('financial times') ||
      item.source.toLowerCase().includes('economist')) {
    score += 10;
  } else if (item.source.toLowerCase().includes('reuters') ||
                item.source.toLowerCase().includes('associated press')) {
    score += 5;
  }

  // Check for AI/Leadership keywords
  const aiLeadershipKeywords = [
    'artificial intelligence', 'machine learning', 'ai ethics', 'leadership', 'management',
    'automation', 'ceo', 'c-suite', 'digital transformation', 'industry', 'strategy',
    'innovation', 'autonomous agents', 'generative ai', 'neural networks', 'deep learning',
    'transform', 'future of work', 'workforce', 'talent', 'culture'
  ];

  const title = item.title.toLowerCase();
  const hasAiKeyword = aiLeadershipKeywords.some(keyword => title.includes(keyword));

  if (hasAiKeyword) {
    score += 20; // Major AI leadership boost
  }

  // Check for AI Leadership specifically
  if (title.includes('leadership') || title.includes('ai') ||
      title.includes('management') || title.includes('strategy')) {
    score += 10;
  }

  return Math.min(score, 100); // Cap at 100
}

// Collector function (matches production collector interface)
async function collectTest() {
  const items = data.items;

  for (const item of items) {
    if (item.status === 'unprocessed') {
      // Calculate march score
      item.marchScore = calculateMarchScore(item);

      // Post suggestion generation (prioritized by march score)
      let suggestion = '';
      let category = 'general';
      let priorityLevel = 0;

      if (item.marchScore >= 80) {
        category = 'AI Leadership - Critical';
        priorityLevel = 3;
        suggestion = 'HIGH PRIORITY: This is a critical AI leadership article. Publish immediately.';
      } else if (item.marchScore >= 70) {
        category = 'High Priority Technology';
        priorityLevel = 2;
        suggestion = 'HIGH PRIORITY: This is a major technology trend. Publish this week.';
      } else if (item.marchScore >= 60) {
        category = 'Moderate Priority';
        priorityLevel = 1;
        suggestion = 'PRIORITY: This article has moderate relevance. Consider publishing this week.';
      }

      item.postSuggestion = suggestion;
      item.category = category;
      item.priorityLevel = priorityLevel;
    }
  }

  // Save updated data
  data.stats.byPriority = {
    '3 (Critical)': items.filter(i => i.priorityLevel === 3).length,
    '2 (High)': items.filter(i => i.priorityLevel === 2).length,
    '1 (Moderate)': items.filter(i => i.priorityLevel === 1).length,
    '0 (Low)': items.filter(i => i.priorityLevel === 0).length
  };

  data.lastFetch = new Date().toISOString();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`✅ Test collection complete. Processed ${items.length} items.`);

  return items.length;
}

// Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// API Routes
app.get('/api/test/items', (req, res) => {
  const dataPath = path.join(__dirname, 'data-test.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Sort by march score (descending)
  let items = data.items;
  const { sort, priority, minScore } = req.query;
  
  if (sort === 'priority') {
    items.sort((a, b) => (b.marchScore || 50) - (a.marchScore || 50));
  } else if (sort === 'asc') {
    items.sort((a, b) => (a.marchScore || 50) - (b.marchScore || 50));
  }

  // Filter by AI Leadership
  if (req.query.aiLeadership === 'true') {
    items = items.filter(i => i.aiLeadership === true);
  }

  // Filter by minimum march score
  if (minScore) {
    const min = parseInt(minScore);
    items = items.filter(i => (i.marchScore || 50) >= min);
  }

  // Limit results
  if (req.query.limit) {
    items = items.slice(0, parseInt(req.query.limit));
  }

  res.json(items);
});

app.get('/api/test/stats', (req, res) => {
  const dataPath = path.join(__dirname, 'data-test.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const items = data.items;

  const stats = {
    total: items.length,
    bySource: {
      'Reuters': items.filter(i => i.source === 'Reuters').length,
      'Bloomberg': items.filter(i => i.source === 'Bloomberg').length,
      'Financial Times': items.filter(i => i.source === 'Financial Times').length
    },
    byStatus: {
      'unprocessed': items.filter(i => i.status === 'unprocessed').length,
      'processed': items.filter(i => i.status === 'posted').length,
      'archived': items.filter(i => i.status === 'archived').length
    },
    byPriority: data.stats.byPriority,
    byAiLeadership: {
      'true': items.filter(i => i.aiLeadership === true).length,
      'false': items.filter(i => !i.aiLeadership).length
    },
    avgMarchScore: items.reduce((sum, i) => sum + (i.marchScore || 50), 0) / items.length
  };

  res.json(stats);
});

app.post('/api/test/collect', async (req, res) => {
  const count = await collectTest();
  res.json({ collected: count });
});

// Start server only if run directly
if (require.main === module) {
  const PORT = process.env.TEST_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log(`📋 Test endpoints:`);
    console.log(`   GET  /api/test/items - List test data`);
    console.log(`   GET  /api/test/stats - Show statistics`);
    console.log(`   GET  /api/test/items?sort=priority - Sort by march score`);
    console.log(`   GET  /api/test/items?aiLeadership=true - Filter AI Leadership`);
    console.log(`   POST /api/test/collect - Trigger collection`);
  });
}

module.exports = { app, collectTest, calculateMarchScore };
