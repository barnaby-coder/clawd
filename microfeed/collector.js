const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = require('./config');

// All 25 RSS sources (13 AI/Leadership + 12 General News)
const sources = [
  // ============ AI & Technology (Tier 1) ============
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    tier: 1
  },
  {
    name: 'LangChain Blog',
    url: 'https://blog.langchain.dev/rss/',
    tier: 1
  },
  {
    name: 'MIT Tech Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    tier: 2
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    tier: 1
  },
  {
    name: 'Wired AI',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    tier: 1
  },
  {
    name: 'Ars Technica AI',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    tier: 2
  },
  {
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    tier: 1
  },
  {
    name: 'Lenny Newsletter',
    url: 'https://www.lennysnewsletter.com/feed',
    tier: 2
  },
  {
    name: 'Benedict Evans',
    url: 'https://www.ben-evans.com/benedictevans?format=rss',
    tier: 2
  },
  {
    name: 'Strategery',
    url: 'https://strategery.com/feed/',
    tier: 1
  },
  {
    name: 'McKinsey Insights',
    url: 'https://www.mckinsey.com/insights/rss',
    tier: 2
  },
  {
    name: 'Platformer',
    url: 'https://www.platformer.news/rss/',
    tier: 2
  },

  // ============ Leadership, Strategy & Future of Work (Tier 2) ============
  {
    name: 'One Useful Thing (Ethan Mollick)',
    url: 'https://www.oneusefulthing.org/feed',
    tier: 2
  },
  {
    name: 'Benedict Evans',
    url: 'https://www.ben-evans.com/benedictevans?format=rss',
    tier: 2
  },
  {
    name: 'Strategery',
    url: 'https://strategery.com/feed/',
    tier: 2
  },
  {
    name: 'McKinsey Insights',
    url: 'https://www.mckinsey.com/insights/rss',
    tier: 2
  },
  {
    name: 'Platformer',
    url: 'https://www.platformer.news/rss/',
    tier: 2
  },

  // ============ General Business News (Tier 3) ============
  {
    name: 'Reuters Technology',
    url: 'https://www.reuters.com/rssFeed/technologyRss',
    tier: 3
  },
  {
    name: 'Reuters Business',
    url: 'https://www.reuters.com/rssFeed/businessNews',
    tier: 3
  },
  {
    name: 'Reuters AI',
    url: 'https://www.reuters.com/rssFeed/technologyNews',
    tier: 3
  },
  {
    name: 'Bloomberg Technology',
    url: 'https://www.bloomberg.com/feeds/news/tech',
    tier: 3
  },
  {
    name: 'Bloomberg Business',
    url: 'https://www.bloomberg.com/feeds/markets/news',
    tier: 3
  },
  {
    name: 'Financial Times',
    url: 'http://www.ft.com/rss/world/uk',
    tier: 3
  },
  {
    name: 'The Economist',
    url: 'https://www.economist.com/rss/full',
    tier: 4
  },
  {
    name: 'CNN Technology',
    url: 'http://rss.cnn.com/rss/edition_technology.rss',
    tier: 4
  },
  {
    name: 'CNN Business',
    url: 'http://rss.cnn.com/rss/edition_business.rss',
    tier: 4
  },
  {
    name: 'BBC Technology',
    url: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
    tier: 4
  },
  {
    name: 'BBC Business',
    url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
    tier: 4
  },
  {
    name: 'Associated Press Tech',
    url: 'https://apnews.com/rss/technology',
    tier: 4
  },
  {
    name: 'Associated Press Business',
    url: 'https://apnews.com/rss/business',
    tier: 4
  },
  {
    name: 'Associated Press World',
    url: 'https://apnews.com/rss/world',
    tier: 4
  }
];

// AI Leadership Keywords for prioritization
const aiLeadershipKeywords = [
  'artificial intelligence', 'machine learning', 'ai ethics', 'leadership', 'management',
  'automation', 'ceo', 'c-suite', 'digital transformation', 'industry', 'strategy',
  'innovation', 'autonomous agents', 'generative ai', 'neural networks', 'deep learning',
  'transform', 'future of work', 'workforce', 'talent', 'culture'
];

// March Score Calculation (same algorithm tested earlier)
function calculateMarchScore(item) {
  let score = 50; // Baseline score

  // Check source tier and apply boost
  const sourceTier = item.tier || 3; // Default to Tier 3 (General News)
  if (sourceTier === 1) {
    score += 15; // AI Leadership sources
  } else if (sourceTier === 2) {
    score += 10; // High Priority Technology sources
  }

  // Check for AI/Leadership keywords
  const title = (item.title || '').toLowerCase();
  const hasAiKeyword = aiLeadershipKeywords.some(keyword => title.includes(keyword));

  if (hasAiKeyword) {
    score += 20; // Major AI leadership boost
  }

  // Check for AI Leadership specifically (Leadership + Strategy sources)
  if (sourceTier === 2) {
    const leadershipTerms = ['leadership', 'ai', 'management', 'strategy'];
    const hasLeadershipTerm = leadershipTerms.some(term => title.includes(term));
    if (hasLeadershipTerm) {
      score += 10; // Additional boost for Tier 2 Leadership content
    }
  }

  return Math.min(score, 100); // Cap at 100
}

// Priority Level Calculation
function calculatePriorityLevel(item) {
  const marchScore = calculateMarchScore(item);
  
  if (marchScore >= 80) {
    return 3; // Critical Priority (AI Leadership)
  } else if (marchScore >= 70) {
    return 2; // High Priority Technology
  } else if (marchScore >= 60) {
    return 1; // Medium Priority
  } else {
    return 0; // Low Priority
  }
}

// Determine if item is AI Leadership content
function isAiLeadership(item) {
  const marchScore = calculateMarchScore(item);
  return marchScore >= 80; // Critical Priority = AI Leadership
}

// Post suggestion generation (prioritized by March Score)
function generatePostSuggestion(item) {
  const marchScore = calculateMarchScore(item);
  const priority = calculatePriorityLevel(item);
  
  let suggestion = '';
  let archetype = 'classic';
  
  if (priority === 3) {
    archetype = 'urgent';
    suggestion = '🔴 HIGH PRIORITY: This is a critical AI leadership article. Publish immediately.';
  } else if (priority === 2) {
    archetype = 'insight';
    suggestion = '🟠 HIGH PRIORITY: This is a major technology trend. Publish this week.';
  } else if (priority === 1) {
    archetype = 'informative';
    suggestion = '🟡 MEDIUM PRIORITY: This article has moderate relevance. Consider publishing this week.';
  } else {
    archetype = 'summary';
    suggestion = '📰 GENERAL INTEREST: Standard news update. Lower priority.';
  }

  return {
    draft: suggestion,
    archetype: archetype,
    priorityLevel: priority,
    marchScore: marchScore
  };
}

// Main collection function
async function collect() {
  console.log('🧪 Starting collection from 25 sources...');
  const items = [];
  let totalCollected = 0;
  let aiLeadershipCount = 0;

  for (const source of sources) {
    try {
      console.log(`📰 Fetching from: ${source.name} (Tier ${source.tier})`);
      
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'MicroFeed/1.0 (+https://github.com/barnaby-coder/clawd)'
        }
      });

      const itemsXml = response.data;
      const itemsCount = itemsXml.length || 0;

      if (itemsCount > 0) {
        console.log(`✅ Fetched ${itemsCount} items from ${source.name}`);
        
        for (let i = 0; i < Math.min(itemsCount, 50); i++) {
          try {
            const itemXml = itemsXml[i];
            
            const title = itemXml.querySelector('title')?.textContent || itemXml.querySelector('description')?.textContent || 'No title';
            const link = itemXml.querySelector('link')?.textContent || itemXml.querySelector('guid')?.textContent || '';
            const pubDate = itemXml.querySelector('pubDate')?.textContent || new Date().toISOString();
            
            if (title && link) {
              const marchScore = calculateMarchScore({
                title,
                link,
                pubDate,
                tier: source.tier,
                source: source.name
              });

              const priorityLevel = calculatePriorityLevel({ marchScore });
              const aiLeadershipFlag = isAiLeadership({ marchScore });
              const postSuggestion = generatePostSuggestion({ marchScore, priorityLevel });
              
              items.push({
                id: `hn-${Date.now()}-${source.name}-${i}`,
                title,
                link,
                source: source.name,
                tier: source.tier,
                pubDate,
                status: 'unprocessed',
                marchScore,
                priorityLevel,
                aiLeadership: aiLeadershipFlag,
                postSuggestion,
                createdAt: new Date().toISOString()
              });

              totalCollected++;
              if (aiLeadershipFlag) aiLeadershipCount++;
            }
          } catch (err) {
            console.error(`❌ Error parsing item ${i} from ${source.name}:`, err.message);
          }
        }
      } else {
        console.log(`⚠️ No items found in ${source.name} feed`);
      }
      
    } catch (err) {
      console.error(`❌ Error fetching from ${source.name}:`, err.message);
    }
  }

  // Load existing data
  const dataPath = path.join(__dirname, 'data.json');
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    data = { items: [], stats: {} };
  }

  // Merge new items with existing items (deduplicate by link)
  const existingLinks = new Set(data.items.map(item => item.link));
  const newItems = items.filter(item => !existingLinks.has(item.link));
  data.items = [...newItems, ...data.items];

  // Update statistics
  data.stats = {
    totalCollected: totalCollected,
    lastFetch: new Date().toISOString(),
    bySource: sources.reduce((acc, source) => {
      acc[source.name] = (acc[source.name] || 0) + items.filter(item => item.source === source.name).length;
      return acc;
    }, {}),
    byStatus: {
      unprocessed: data.items.filter(item => item.status === 'unprocessed').length,
      posted: data.items.filter(item => item.status === 'posted').length,
      archived: data.items.filter(item => item.status === 'archived').length
    },
    byPriority: {
      critical: data.items.filter(item => item.priorityLevel === 3).length,
      high: data.items.filter(item => item.priorityLevel === 2).length,
      medium: data.items.filter(item => item.priorityLevel === 1).length,
      low: data.items.filter(item => item.priorityLevel === 0).length
    },
    byAiLeadership: {
      aiLeadership: data.items.filter(item => item.aiLeadership === true).length,
      nonAi: data.items.filter(item => item.aiLeadership !== true).length
    },
    aiLeadershipCount: aiLeadershipCount,
    totalItems: data.items.length
  };

  // Save updated data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  console.log(`\n🎉 Collection Complete!`);
  console.log(`📊 Total items collected: ${totalCollected}`);
  console.log(`🤖 AI Leadership articles: ${aiLeadershipCount}`);
  console.log(`📊 Total items in database: ${data.items.length}`);
  console.log(`⏰ Last fetch: ${new Date().toISOString()}`);
  
  return totalCollected;
}

// Additional helper functions
function loadData() {
  const dataPath = path.join(__dirname, 'data.json');
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    return { items: [], stats: {} };
  }
}

function saveData(data) {
  const dataPath = path.join(__dirname, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function generatePostSuggestion(item) {
  const marchScore = item.marchScore || 50;
  const priority = item.priorityLevel || 0;
  
  let suggestion = '';
  let archetype = 'classic';
  
  if (priority >= 3) {
    archetype = 'urgent';
    suggestion = '🔴 HIGH PRIORITY: This is a critical AI leadership article. Publish immediately.';
  } else if (priority >= 2) {
    archetype = 'insight';
    suggestion = '🟠 HIGH PRIORITY: This is a major technology trend. Publish this week.';
  } else if (priority >= 1) {
    archetype = 'informative';
    suggestion = '🟡 MEDIUM PRIORITY: This article has moderate relevance. Consider publishing this week.';
  } else {
    archetype = 'summary';
    suggestion = '📰 GENERAL INTEREST: Standard news update. Lower priority.';
  }

  return {
    draft: suggestion,
    archetype: archetype,
    priorityLevel: priority,
    marchScore: marchScore
  };
}

module.exports = { collect, loadData, saveData, generatePostSuggestion, calculateMarchScore, calculatePriorityLevel, isAiLeadership };
