const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('=== Checking CBC News for Canada-Trump Trade Updates ===\n');
  try {
    await page.goto('https://www.cbc.ca/news/politics', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    const headlines = await page.evaluate(() => {
      const cards = document.querySelectorAll('a.card, .headline a, h3 a, .contentWrapper a');
      const results = [];
      const seen = new Set();
      
      for (const card of cards) {
        const text = card.innerText?.trim();
        if (text && text.length > 20 && !seen.has(text)) {
          seen.add(text);
          results.push({
            title: text.substring(0, 150),
            url: card.href
          });
        }
        if (results.length >= 8) break;
      }
      return results;
    });
    
    console.log('Latest CBC Politics Headlines:\n');
    headlines.forEach((h, i) => {
      console.log(`${i + 1}. ${h.title}`);
    });
  } catch (e) {
    console.log('CBC issue:', e.message);
  }
  
  console.log('\n=== Checking Global News for Trump/Tariff Coverage ===\n');
  try {
    await page.goto('https://globalnews.ca/tag/trump-tariffs/', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    const articles = await page.evaluate(() => {
      const items = document.querySelectorAll('.c-posts__item, article, .story-card');
      return Array.from(items).slice(0, 5).map(item => {
        const title = item.querySelector('h3, h2, .c-posts__headlineText, a');
        const date = item.querySelector('time, .c-posts__date');
        return {
          title: title ? title.innerText.trim().substring(0, 120) : '',
          date: date ? date.innerText.trim() : ''
        };
      }).filter(a => a.title);
    });
    
    console.log('Latest Trump Tariff News:\n');
    articles.forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
      if (a.date) console.log(`   (${a.date})`);
    });
  } catch (e) {
    console.log('Global News issue:', e.message);
  }
  
  await browser.close();
})();
