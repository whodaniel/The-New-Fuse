const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://ai-arcade.xyz', { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('text=Open Audio Deck').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/output/playwright/arcade-desktop-modal-login-overlay.png', fullPage: true });
  const body = await page.locator('body').innerText();
  console.log('HAS_FREE_OPEN', /FREE\s*\/\s*OPEN/i.test(body));
  console.log('HAS_LAUNCH_EXPERIENCE', /Launch Experience/i.test(body));
  await browser.close();
})();
