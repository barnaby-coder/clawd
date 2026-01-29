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
  
  // RSS Sources
  sources: {
    rss: [
      // AI & Technology
      { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', tier: 1 },
      { name: 'LangChain Blog', url: 'https://blog.langchain.dev/rss/', tier: 1 },
      { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', tier: 2 },
      { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', tier: 2 },
      { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss', tier: 1 },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', tier: 2 },
      { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', tier: 1 },
      // Leadership, Strategy & Future of Work
      { name: 'One Useful Thing (Ethan Mollick)', url: 'https://www.oneusefulthing.org/feed', tier: 1 },
      { name: 'Lenny Newsletter', url: 'https://www.lennysnewsletter.com/feed', tier: 2 },
      { name: 'Benedict Evans', url: 'https://www.ben-evans.com/benedictevans?format=rss', tier: 1 },
      { name: 'Stratechery', url: 'https://stratechery.com/feed/', tier: 1 },
      { name: 'McKinsey Insights', url: 'https://www.mckinsey.com/insights/rss', tier: 2 },
      { name: 'Platformer', url: 'https://www.platformer.news/rss/', tier: 2 },
    ],
    hackerNews: {
      enabled: true,
      minScore: 50,
      keywords: ['ai', 'agent', 'llm', 'gpt', 'claude', 'enterprise', 'automation', 'leadership', 'future of work', 'workforce', 'productivity']
    },
    twitter: {
      enabled: false,  // Nitter instances unreliable — X content sourced via web search during newsletter curation
      accounts: [
        'AndrewYNg',        // AI education, The Batch
        'emaborrito',       // Ethan Mollick, AI + education
        'satikiyer',        // Anthropic CEO
        'sama',             // OpenAI CEO
        'katecrawford',     // AI & society
        'hardmaru',         // AI research, accessible
      ],
      keywords: ['agentic', 'ai agent', 'future of work', 'ai leadership', 'workforce', 'ai adoption', 'ai transition'],
      maxPerCollection: 10
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
    { type: 'observation', hook: "I've been watching the AI space closely. Here's what most people are missing:" }
  ],
  
  // Server
  server: {
    port: 3457
  }
};
