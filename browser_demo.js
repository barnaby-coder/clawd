const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to Hacker News...');
  await page.goto('https://news.ycombinator.com');
  
  console.log('Getting top stories...');
  const stories = await page.evaluate(() => {
    const items = document.querySelectorAll('.titleline > a');
    return Array.from(items).slice(0, 5).map((el, i) => ({
      rank: i + 1,
      title: el.textContent,
      url: el.href
    }));
  });
  
  console.log('\n=== Top 5 Hacker News Stories ===\n');
  stories.forEach(s => {
    console.log(`${s.rank}. ${s.title}`);
    console.log(`   ${s.url}\n`);
  });
  
  await browser.close();
  console.log('Done!');
})();
