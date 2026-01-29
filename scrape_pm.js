const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Try PM's official X/Twitter
  console.log('\n=== Checking PM Official X Account ===\n');
  try {
    await page.goto('https://x.com/CanadianPM', { timeout: 15000 });
    await page.waitForTimeout(3000); // Let tweets load
    
    const tweets = await page.evaluate(() => {
      const articles = document.querySelectorAll('article');
      return Array.from(articles).slice(0, 3).map(article => {
        const text = article.querySelector('[data-testid="tweetText"]');
        const time = article.querySelector('time');
        return {
          text: text ? text.innerText : 'No text',
          time: time ? time.getAttribute('datetime') : 'Unknown'
        };
      });
    });
    
    if (tweets.length > 0) {
      tweets.forEach((t, i) => {
        console.log(`Tweet ${i + 1} (${t.time}):`);
        console.log(t.text);
        console.log('---');
      });
    } else {
      console.log('Could not extract tweets (may need login or different approach)');
    }
  } catch (e) {
    console.log('X.com access issue:', e.message);
  }
  
  // Try official PM website
  console.log('\n=== Checking pm.gc.ca (Official PM Site) ===\n');
  try {
    await page.goto('https://pm.gc.ca/en/news', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const news = await page.evaluate(() => {
      const items = document.querySelectorAll('.views-row, .news-item, article');
      return Array.from(items).slice(0, 5).map(item => {
        const title = item.querySelector('h2, h3, .title, a');
        const date = item.querySelector('.date, time, .field-date');
        return {
          title: title ? title.innerText.trim() : 'No title',
          date: date ? date.innerText.trim() : ''
        };
      });
    });
    
    news.forEach((n, i) => {
      console.log(`${i + 1}. ${n.title}`);
      if (n.date) console.log(`   Date: ${n.date}`);
    });
  } catch (e) {
    console.log('pm.gc.ca access issue:', e.message);
  }
  
  await browser.close();
  console.log('\nDone!');
})();
