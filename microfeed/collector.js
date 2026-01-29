const Parser = require('rss-parser');
const https = require('https');
const http = require('http');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'MicroFeed/1.0 (Barnaby AI Assistant)' }
});

const DATA_FILE = path.join(__dirname, 'data.json');

// Load/save data
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { items: [], lastFetch: null, stats: { totalCollected: 0, totalDelivered: 0 } };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Calculate relevance score
function scoreRelevance(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;
  
  config.keywords.high.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 10;
  });
  config.keywords.medium.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 5;
  });
  config.keywords.low.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 2;
  });
  
  return score;
}

// ============================================================
// Post Suggestion Engine
// Generates personable, executive-friendly LinkedIn post ideas
// that create conversation without being forceful
// ============================================================

// Post archetypes — each produces a different tone and structure
const POST_ARCHETYPES = [
  {
    name: 'curious-observer',
    build: (item) => {
      const openers = [
        `Something caught my attention this week.`,
        `I've been thinking about this one.`,
        `This stopped me mid-scroll.`,
        `A quiet shift is happening that most leaders haven't noticed yet.`,
        `Read something that crystallized a thought I've been circling for a while.`
      ];
      const bridges = [
        `What struck me isn't the technology itself — it's what it signals about how work is changing.`,
        `The headline doesn't tell the full story. The real implication is about how enterprises operate.`,
        `On the surface, this is a tech story. But look closer and it's really about people and how we work.`,
        `We tend to look at AI news through a tech lens. But this one is really a business strategy story.`
      ];
      const closes = [
        `What patterns are you noticing in your industry?`,
        `I'd love to hear how others are thinking about this.`,
        `Anyone else connecting these same dots?`,
        `The leaders I respect most are asking good questions right now, not claiming to have answers.`
      ];
      return {
        opener: pick(openers),
        bridge: pick(bridges),
        close: pick(closes)
      };
    }
  },
  {
    name: 'experience-sharer',
    build: (item) => {
      const openers = [
        `Coming from an enterprise operations background, I see this differently than most.`,
        `Having spent years navigating enterprise decision-making, here's what I notice:`,
        `When I look at developments like this, I think about what it actually means on the ground.`,
        `There's a gap between what the tech world is excited about and what enterprise leaders need to understand.`
      ];
      const bridges = [
        `The real challenge isn't the technology. It's the organizational readiness.`,
        `Most enterprises won't fail because they chose the wrong AI tool. They'll fall behind because they waited too long to start learning.`,
        `In my experience, the companies that win aren't the ones with the biggest budgets — they're the ones willing to experiment and learn.`,
        `What I've learned: the biggest risk in enterprise AI isn't moving too fast. It's the cost of standing still while the world shifts.`
      ];
      const closes = [
        `What's been your experience navigating this in your organization?`,
        `Curious — what's the conversation like at your leadership table?`,
        `For those in traditional industries: how are you thinking about this?`,
        `The best insights come from people doing the actual work. What are you seeing?`
      ];
      return {
        opener: pick(openers),
        bridge: pick(bridges),
        close: pick(closes)
      };
    }
  },
  {
    name: 'myth-buster',
    build: (item) => {
      const openers = [
        `There's a common misconception about enterprise AI that I keep running into.`,
        `I hear the same concern from enterprise leaders every week. Let me offer a different perspective.`,
        `We need to talk about the elephant in the room with AI adoption.`,
        `Unpopular opinion: Most enterprise AI strategies are solving the wrong problem.`
      ];
      const bridges = [
        `AI isn't replacing leaders. But leaders who understand AI will replace those who don't.`,
        `The conversation shouldn't be "AI vs humans." It should be "what becomes possible when humans work with AI?"`,
        `Risk-averse doesn't mean change-averse. Thoughtful adoption is still adoption.`,
        `The enterprises that get this right aren't the ones being reckless. They're the ones being deliberately curious.`
      ];
      const closes = [
        `Agree? Disagree? I want to hear the pushback.`,
        `What's the biggest myth you've encountered about AI in your industry?`,
        `Sometimes shifting the question changes everything. What question should we be asking?`,
        `I think the leaders who'll thrive are the ones having honest conversations about this right now.`
      ];
      return {
        opener: pick(openers),
        bridge: pick(bridges),
        close: pick(closes)
      };
    }
  },
  {
    name: 'connector',
    build: (item) => {
      const openers = [
        `Two things converging that people aren't connecting yet:`,
        `This article reminded me of a pattern I keep seeing across industries.`,
        `If you zoom out on the AI news cycle, a bigger picture emerges.`,
        `Connecting the dots between what's happening in AI and what it means for the enterprise workforce.`
      ];
      const bridges = [
        `The workers of the near future look different. Not replaced — augmented, redirected, empowered differently.`,
        `We're in a transition phase. The enterprises that recognize this now will define how their industries evolve.`,
        `This isn't about one company or one tool. It's about a fundamental shift in how knowledge work gets done.`,
        `The future doesn't arrive all at once. It shows up in small signals like this — if you know where to look.`
      ];
      const closes = [
        `What signals are you picking up in your world?`,
        `I think we're all figuring this out together. That's what makes this moment so interesting.`,
        `The conversation between industries matters here. What does this look like in your sector?`,
        `Follow along — I'm documenting this transition as I learn and build through it myself.`
      ];
      return {
        opener: pick(openers),
        bridge: pick(bridges),
        close: pick(closes)
      };
    }
  },
  {
    name: 'practical-translator',
    build: (item) => {
      const openers = [
        `Let me translate this from tech-speak to business impact.`,
        `Here's what this actually means for enterprise leaders (without the jargon):`,
        `Behind the buzzwords, something practical is happening here.`,
        `For the business leaders who tune out AI headlines — this one's worth 2 minutes of your time.`
      ];
      const bridges = [
        `In plain terms: the barrier to entry just got lower. Which means your competitors are closer to adopting this than you think.`,
        `What matters isn't the feature list. It's that the gap between "experimental" and "production-ready" is shrinking fast.`,
        `The practical question for any enterprise leader: does this change our timeline? And the honest answer is probably yes.`,
        `Strip away the hype and ask: does this make it easier for a team of 5 to do what used to take 50? That's the real question.`
      ];
      const closes = [
        `What would you do with that kind of capability in your business?`,
        `Sometimes the simplest question is the most powerful: "What if we could?"`,
        `The best time to understand this was a year ago. The second best time is now.`,
        `I'd rather ask the naive questions now than realize I should have asked them later.`
      ];
      return {
        opener: pick(openers),
        bridge: pick(bridges),
        close: pick(closes)
      };
    }
  }
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a thoughtful post suggestion
function generatePostSuggestion(item) {
  const archetype = pick(POST_ARCHETYPES);
  const parts = archetype.build(item);
  
  const titleSnippet = item.title.length > 60 ? item.title.substring(0, 57) + '...' : item.title;
  
  // Build draft with natural flow
  const draft = [
    parts.opener,
    '',
    `"${titleSnippet}" (${item.source})`,
    '',
    parts.bridge,
    '',
    parts.close,
    '',
    `🔗 ${item.link}`,
    '',
    '#AgenticEconomy #FutureOfWork #AILeadership'
  ].join('\n');
  
  return {
    archetype: archetype.name,
    hook: parts.opener,
    bridge: parts.bridge,
    cta: parts.close,
    draft
  };
}

// Fetch RSS feeds
async function fetchRSS() {
  const items = [];
  
  for (const source of config.sources.rss) {
    try {
      console.log(`Fetching ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      
      for (const entry of feed.items.slice(0, 10)) {
        const score = scoreRelevance(entry.title || '', entry.contentSnippet || entry.content || '');
        
        if (score >= 5) { // Minimum relevance threshold
          items.push({
            id: Buffer.from(entry.link || entry.guid || entry.title).toString('base64').substring(0, 20),
            title: entry.title,
            link: entry.link,
            summary: (entry.contentSnippet || entry.content || '').substring(0, 300),
            source: source.name,
            tier: source.tier,
            pubDate: entry.pubDate || entry.isoDate || new Date().toISOString(),
            score,
            fetchedAt: new Date().toISOString(),
            postSuggestion: null, // Generated on demand
            status: 'new'
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching ${source.name}:`, err.message);
    }
  }
  
  return items;
}

// Fetch Hacker News
async function fetchHackerNews() {
  return new Promise((resolve) => {
    const items = [];
    
    https.get('https://hacker-news.firebaseio.com/v0/topstories.json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const ids = JSON.parse(data).slice(0, 30);
          
          for (const id of ids.slice(0, 15)) { // Limit to avoid too many requests
            try {
              const story = await fetchHNStory(id);
              if (story && story.score >= config.sources.hackerNews.minScore) {
                const titleLower = (story.title || '').toLowerCase();
                const hasKeyword = config.sources.hackerNews.keywords.some(kw => titleLower.includes(kw));
                
                if (hasKeyword) {
                  const score = scoreRelevance(story.title, '');
                  items.push({
                    id: `hn-${id}`,
                    title: story.title,
                    link: story.url || `https://news.ycombinator.com/item?id=${id}`,
                    summary: `${story.score} points | ${story.descendants || 0} comments on Hacker News`,
                    source: 'Hacker News',
                    tier: 1,
                    pubDate: new Date(story.time * 1000).toISOString(),
                    score: score + Math.floor(story.score / 20), // Boost by HN score
                    hnScore: story.score,
                    fetchedAt: new Date().toISOString(),
                    status: 'new'
                  });
                }
              }
            } catch (e) { /* skip */ }
          }
        } catch (e) {
          console.error('HN parse error:', e.message);
        }
        resolve(items);
      });
    }).on('error', () => resolve([]));
  });
}

function fetchHNStory(id) {
  return new Promise((resolve) => {
    https.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Fetch X/Twitter posts via web scraping
async function fetchTwitter() {
  const items = [];
  if (!config.sources.twitter || !config.sources.twitter.enabled) return items;
  
  const keywords = config.sources.twitter.keywords || [];
  const maxItems = config.sources.twitter.maxPerCollection || 10;
  
  // Use web-friendly search approach via RSS bridge services
  const nitterInstances = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.cz'
  ];
  
  for (const account of (config.sources.twitter.accounts || [])) {
    for (const nitterBase of nitterInstances) {
      try {
        console.log(`Fetching X/@${account} via ${nitterBase}...`);
        const feed = await parser.parseURL(`${nitterBase}/${account}/rss`);
        
        for (const entry of (feed.items || []).slice(0, 5)) {
          const text = (entry.title || entry.contentSnippet || '').toLowerCase();
          const score = scoreRelevance(entry.title || '', entry.contentSnippet || '');
          
          // Only include if it matches our themes
          if (score >= 3) {
            items.push({
              id: `x-${account}-${Buffer.from(entry.link || entry.guid || '').toString('base64').substring(0, 15)}`,
              title: (entry.title || entry.contentSnippet || '').substring(0, 200),
              link: entry.link ? entry.link.replace(nitterBase, 'https://x.com') : `https://x.com/${account}`,
              summary: (entry.contentSnippet || '').substring(0, 300),
              source: `X/@${account}`,
              tier: 1,
              pubDate: entry.pubDate || entry.isoDate || new Date().toISOString(),
              score,
              fetchedAt: new Date().toISOString(),
              status: 'new'
            });
          }
        }
        break; // Success — skip remaining nitter instances
      } catch (err) {
        console.log(`  ↳ ${nitterBase} failed for @${account}: ${err.message}`);
        continue; // Try next instance
      }
    }
    
    if (items.length >= maxItems) break;
  }
  
  console.log(`  ↳ Collected ${items.length} X/Twitter items`);
  return items;
}

// Main collect function
async function collect() {
  console.log(`\n🔄 Starting collection at ${new Date().toISOString()}`);
  
  const data = loadData();
  const existingIds = new Set(data.items.map(i => i.id));
  
  // Fetch all sources
  const [rssItems, hnItems, twitterItems] = await Promise.all([
    fetchRSS(),
    config.sources.hackerNews.enabled ? fetchHackerNews() : Promise.resolve([]),
    fetchTwitter()
  ]);
  
  const allNew = [...rssItems, ...hnItems, ...twitterItems].filter(item => !existingIds.has(item.id));
  
  // Add post suggestions
  allNew.forEach(item => {
    item.postSuggestion = generatePostSuggestion(item);
  });
  
  // Add to data
  data.items = [...allNew, ...data.items].slice(0, 500); // Keep last 500
  data.lastFetch = new Date().toISOString();
  data.stats.totalCollected += allNew.length;
  
  saveData(data);
  
  const xCount = twitterItems.filter(i => !existingIds.has(i.id)).length;
  console.log(`✅ Collected ${allNew.length} new items (${rssItems.length} RSS, ${hnItems.length} HN, ${xCount} X)`);
  
  return allNew;
}

// Get items for digest
function getDigestItems(limit = 5) {
  const data = loadData();
  const now = new Date();
  const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);
  
  return data.items
    .filter(item => new Date(item.fetchedAt) > sixHoursAgo && item.status === 'new')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============================================================
// Article Submission
// Allows manually submitting URLs to include in the feed
// ============================================================

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'MicroFeed/1.0' }, timeout: 10000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function submitArticle(url, submittedBy = 'Finneigan') {
  try {
    console.log(`📎 Fetching submitted article: ${url}`);
    const html = await fetchUrl(url);
    
    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : url;
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const summary = descMatch ? descMatch[1].substring(0, 300) : '';
    
    const score = scoreRelevance(title, summary) + 5; // Boost manually submitted articles
    
    const item = {
      id: 'sub-' + Date.now(),
      title,
      link: url,
      summary,
      source: 'Submitted by ' + submittedBy,
      tier: 1, // Always top tier for manual submissions
      pubDate: new Date().toISOString(),
      score: Math.max(score, 10), // Minimum score of 10 for submissions
      fetchedAt: new Date().toISOString(),
      status: 'new',
      submitted: true,
      submittedBy,
      submittedAt: new Date().toISOString()
    };
    
    // Generate post suggestion
    item.postSuggestion = generatePostSuggestion(item);
    
    // Add to data
    const data = loadData();
    data.items.unshift(item); // Add to top
    data.stats.totalCollected++;
    saveData(data);
    
    console.log(`✅ Article submitted: "${title}"`);
    return item;
    
  } catch (err) {
    console.error('Failed to submit article:', err.message);
    return { error: err.message };
  }
}

module.exports = { collect, loadData, saveData, getDigestItems, generatePostSuggestion, submitArticle };
