const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:3002/dashboard');
  await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle' });

  console.log('URL after navigation:', page.url());
  await page.screenshot({ path: 'dashboard.png' });

  await browser.close();
})();
