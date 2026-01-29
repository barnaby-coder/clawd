const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  console.log('=== Reuters Canada News ===\n');
  try {
    await page.goto('https://www.reuters.com/world/americas/', { timeout: 25000 });
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: '/home/ubuntu/clawd/reuters_screenshot.png', fullPage: false });
    console.log('Screenshot saved: reuters_screenshot.png\n');
    
    const headlines = await page.evaluate(() => {
      const links = document.querySelectorAll('a[data-testid="Heading"], h3 a, [data-testid="TitleHeading"] a');
      const results = [];
      const seen = new Set();
      
      for (const link of links) {
        const text = link.innerText?.trim();
        if (text && text.length > 15 && !seen.has(text)) {
          seen.add(text);
          results.push(text.substring(0, 100));
        }
        if (results.length >= 10) break;
      }
      return results;
    });
    
    console.log('Headlines:\n');
    headlines.forEach((h, i) => console.log(`${i + 1}. ${h}`));
    
  } catch (e) {
    console.log('Reuters issue:', e.message);
  }
  
  // Also check CTV for Canadian perspective
  console.log('\n=== CTV News Politics ===\n');
  try {
    await page.goto('https://www.ctvnews.ca/politics/', { timeout: 25000 });
    await page.waitForTimeout(2000);
    
    const ctv = await page.evaluate(() => {
      const cards = document.querySelectorAll('.c-card__title, h2 a, h3 a');
      return Array.from(cards).slice(0, 6).map(c => c.innerText?.trim()).filter(t => t && t.length > 10);
    });
    
    ctv.forEach((h, i) => console.log(`${i + 1}. ${h}`));
  } catch (e) {
    console.log('CTV issue:', e.message);
  }
  
  await browser.close();
})();
