const axios = require('axios');
const config = require('./config');
const fs = require('fs');

// Load configuration
const sources = [
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', tier: 1 },
  { name: 'LangChain Blog', url: 'https://blog.langchain.dev/rss/', tier: 1 },
  { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', tier: 2 },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', tier: 1 },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss', tier: 1 },
  { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', tier: 2 },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', tier: 1 },
  { name: 'Lenny Newsletter', url: 'https://www.lennysnewsletter.com/feed', tier: 2 },
  { name: 'Benedict Evans', url: 'https://www.ben-evans.com/benedictevans?format=rss', tier: 2 },
  { name: 'Strategery', url: 'https://strategery.com/feed/', tier: 1 },
  { name: 'McKinsey Insights', url: 'https://www.mckinsey.com/insights/rss', tier: 2 },
  { name: 'Platformer', url: 'https://www.platformer.news/rss/', tier: 2 },
  { name: 'One Useful Thing (Ethan Mollick)', url: 'https://www.oneusefulthing.org/feed', tier: 2 },
  { name: 'Reuters Technology', url: 'https://www.reuters.com/rssFeed/technologyRss', tier: 3 },
  { name: 'Reuters Business', url: 'https://www.reuters.com/rssFeed/businessNews', tier: 3 },
  { name: 'Reuters AI', url: 'https://www.reuters.com/rssFeed/technologyNews', tier: 3 },
  { name: 'Bloomberg Technology', url: 'https://www.bloomberg.com/feeds/news/tech', tier: 3 },
  { name: 'Bloomberg Business', url: 'https://www.bloomberg.com/feeds/markets/news', tier: 3 },
  { name: 'Financial Times', url: 'http://www.ft.com/rss/world/uk', tier: 3 },
  { name: 'The Economist', url: 'https://www.economist.com/rss/full', tier: 4 },
  { name: 'CNN Technology', url: 'http://rss.cnn.com/rss/edition_technology.rss', tier: 4 },
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/edition_business.rss', tier: 4 },
  { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', tier: 4 },
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', tier: 4 },
  { name: 'Associated Press Tech', url: 'https://apnews.com/rss/technology', tier: 4 },
  { name: 'Associated Press Business', url: 'https://apnews.com/rss/business', tier: 4 },
  { name: 'Associated Press World', url: 'https://apnews.com/rss/world', tier: 4 }
];

// AI Leadership Keywords for prioritization
const aiLeadershipKeywords = [
  'artificial intelligence', 'machine learning', 'ai ethics', 'leadership', 'management',
  'automation', 'ceo', 'c-suite', 'digital transformation', 'industry', 'strategy',
  'innovation', 'autonomous agents', 'generative ai', 'neural networks', 'deep learning',
  'transform', 'future of work', 'workforce', 'talent', 'culture'
];

// March Score Calculation
function calculateMarchScore(item) {
  let score = 50;
  const sourceTier = item.tier || 3;
  if (sourceTier === 1) score += 15;
  else if (sourceTier === 2) score += 10;
  else if (sourceTier === 3) score += 5;
  
  const title = (item.title || '').toLowerCase();
  const hasAiKeyword = aiLeadershipKeywords.some(keyword => title.includes(keyword));
  if (hasAiKeyword) score += 20;
  
  return Math.min(score, 100);
}

// Priority Level Calculation
function calculatePriorityLevel(item) {
  const marchScore = calculateMarchScore(item);
  if (marchScore >= 80) return 3;
  else if (marchScore >= 70) return 2;
  else if (marchScore >= 60) return 1;
  else if (marchScore >= 50) return 0;
  return 0;
}

// AI Leadership Detection
function isAiLeadership(item) {
  return calculateMarchScore(item) >= 80;
}

// Post Suggestion
function generatePostSuggestion(item) {
  const marchScore = calculateMarchScore(item);
  const priority = calculatePriorityLevel(item);
  
  let suggestion = '';
  if (priority >= 3) suggestion = '🔴 HIGH PRIORITY: This is a critical AI leadership article. Publish immediately.';
  else if (priority >= 2) suggestion = '🟠 HIGH PRIORITY: This is a major technology trend. Publish this week.';
  else if (priority >= 1) suggestion = '🟡 MEDIUM PRIORITY: This article has moderate relevance. Consider publishing this week.';
  else suggestion = '📰 GENERAL INTEREST: Standard news update. Lower priority.';
  
  return suggestion;
}

// Main collection function
async function fetchBriefings() {
  console.log('🧪 Fetching briefings from 25 RSS sources...');
  const items = [];
  let totalCollected = 0;
  let aiLeadershipCount = 0;

  for (const source of sources) {
    try {
      console.log(`📰 Fetching from: ${source.name} (Tier ${source.tier})`);
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'MicroFeed/1.0-Clickable (+https://github.com/barnaby-coder/clawd)'
        }
      });

      const cheerio = require('cheerio');
      const itemsXml = cheerio.load(response.data);
      const rssItems = itemsXml('item');
      const itemsCount = rssItems.length || 0;

      if (itemsCount > 0) {
        console.log(`✅ Fetched ${itemsCount} items from ${source.name}`);

        for (let i = 0; i < Math.min(itemsCount, 50); i++) {
          try {
            const itemXml = rssItems[i];
            const title = itemXml('title').text().trim();
            const link = itemXml('link').text().trim();
            const guid = itemXml('guid').text().trim();
            const pubDate = itemXml('pubDate').text().trim();
            const description = itemXml('description').text().trim();
            
            if (title && (link || guid)) {
              const marchScore = calculateMarchScore({
                title, link, pubDate, tier: source.tier, source: source.name
              });
              const priorityLevel = calculatePriorityLevel({ marchScore });
              const aiLeadershipFlag = isAiLeadership({ marchScore });
              const postSuggestion = generatePostSuggestion({ marchScore, priorityLevel });

              items.push({
                id: `hn-${Date.now()}-${source.name}-${i}`,
                title, link, source: source.name, tier: source.tier,
                pubDate, description,
                status: 'unprocessed',
                marchScore, priorityLevel, aiLeadership: aiLeadershipFlag,
                postSuggestion,
                createdAt: new Date().toISOString(),
                date: new Date().toISOString()
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

  console.log(`\n🎉 Briefing Collection Complete!`);
  console.log(`📊 Total items collected: ${totalCollected}`);
  console.log(`🤖 AI Leadership articles: ${aiLeadershipCount}`);
  console.log(`⏰ Collection time: ${new Date().toISOString()}`);

  return totalCollected;
}

module.exports = { fetchBriefings };
