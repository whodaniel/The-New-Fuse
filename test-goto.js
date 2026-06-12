const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err));

  page.on('domcontentloaded', () => console.log('EVENT: domcontentloaded fired!'));
  page.on('load', () => console.log('EVENT: load fired!'));
  page.on('framenavigated', (frame) => console.log('EVENT: framenavigated to', frame.url()));

  console.log('Navigating to /dashboard...');
  try {
    await page.goto('http://localhost:3002/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    console.log('Navigation successful!');

    // Wait a bit to see if redirect happens
    await page.waitForTimeout(5000);
    console.log('Final URL:', page.url());
  } catch (err) {
    console.error('Navigation failed:', err.message);
  }

  await browser.close();
})();
