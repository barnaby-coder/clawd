const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  
  await page.goto('http://localhost:3456');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/home/ubuntu/clawd/taskboard/taskboard.png' });
  console.log('Screenshot saved!');
  
  await browser.close();
})();
