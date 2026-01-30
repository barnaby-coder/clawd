// Microfeed Configuration
module.exports = {
  // Telegram delivery
  telegram: {
    chatId: '6823696367', // Finneigan
    botToken: process.env.TELEGRAM_BOT_TOKEN || '8505736648:AAH9ElG72Cgri4iabw819Usu3wNi_ljKFH4'
  },
  
  // Beehiiv publishing
  beehiiv: {
    enabled: true,
    apiKey: 'a9ec2cf3-3b45-4659-9655-a3e6b3d25371',
    newsletterId: 'finneigan-barnaby-gmail-com',
    verifyEmail: 'finneigan.barnaby@gmail.com' // Email to verify ownership
  },
  
  // Schedule (MST = UTC-7)
  schedule: {
    morning: '30 14 * * *',  // 7:30am MST = 14:30 UTC
    afternoon: '0 22 * * *'  // 3:00pm MST = 22:00 UTC
  },
  
  // RSS Sources (Expanded with General News)
  sources: {
    rss: [
      // ============ AI & Technology (Tier 1) ============
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
      
      // ============ Leadership, Strategy & Future of Work (Tier 2) ============
      { name: 'One Useful Thing (Ethan Mollick)', url: 'https://www.oneusefulthing.org/feed', tier: 2 },
      { name: 'Benedict Evans', url: 'https://www.ben-evans.com/benedictevans?format=rss', tier: 2 },
      { name: 'Strategery', url: 'https://strategery.com/feed/', tier: 2 },
      { name: 'McKinsey Insights', url: 'https://www.mckinsey.com/insights/rss', tier: 2 },
      { name: 'Platformer', url: 'https://www.platformer.news/rss/', tier: 2 },
      
      // ============ General Business News (Tier 3) ============
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
    ],
    hackerNews: {
      enabled: true,
      minScore: 50,
      keywords: ['ai', 'agent', 'llm', 'gpt', 'claude', 'enterprise', 'automation', 'leadership', 'future of work', 'workforce', 'productivity']
    },
    twitter: {
      enabled: false,
      accounts: [
        'AndrewYNg',
        'emoborito',
        'satyager',
        'sama',
        'karpathy',
        'dkarpathy',
        'ilyasutybayev',
        'hardmaru',
        'jerryliu',
        'yannlecun',
        'lexzhou',
        'natfriedman',
        'drfeifei'
      ],
      keywords: ['agentic', 'ai agent', 'future of work', 'ai leadership', 'workforce', 'ai adoption', 'ai transition'],
      maxPerCollection: 10
    },
    github: {
      enabled: true,
      repos: [
        'barnaby-coder/clawd'
      ],
      keywords: ['microfeed', 'taskboard', 'clawdbot', 'daily reflection']
    },
    youtube: {
      enabled: false,
      channels: [
        'AlexandrWang'
      ],
      keywords: ['ai', 'agents', 'automation', 'autonomous', 'llm', 'gpt']
    }
  },
  
  // Relevance keywords (weighted)
  keywords: {
    high: ['agentic', 'agent', 'autonomous', 'enterprise ai', 'workflow automation', 'ai deployment', 'production ai', 'ai leadership', 'leading through change', 'workforce transformation', 'agentic economy'],
    medium: ['llm', 'large language model', 'gpt', 'claude', 'copilot', 'assistant', 'rag', 'retrieval', 'upskilling', 'reskilling', 'ai adoption', 'change management', 'digital transformation'],
    low: ['artificial intelligence', 'machine learning', 'automation', 'productivity', 'future of work', 'leadership', 'management', 'career development', 'employee engagement']
  },
  
  // Post generation templates
  postTemplates: [
    { type: 'contrarian', hook: "Most {industry} leaders think {common_belief}. Here's why that's changing:" },
    { type: 'insight', hook: "What {company}'s latest move tells us about the future of enterprise AI:" },
    { type: 'question', hook: "If {premise}, what does that mean for {audience}?" },
    { type: 'observation', hook: "I've been watching AI space closely. Here's what most people are missing:" }
  ],
  
  // Server
  server: {
    port: 3457
  }
};
