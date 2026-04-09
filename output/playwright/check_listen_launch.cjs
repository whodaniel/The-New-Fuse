const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://ai-arcade.xyz', { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: /Music/i }).first().click();
  await page.waitForTimeout(1000);

  let popupUrl = null;
  const popupPromise = context.waitForEvent('page', { timeout: 5000 }).then(async p => {
    await p.waitForLoadState('domcontentloaded', { timeout: 30000 });
    popupUrl = p.url();
  }).catch(() => null);

  const before = page.url();
  await page.getByRole('button', { name: /^LISTEN$/i }).first().click({ timeout: 15000 });
  await Promise.race([
    page.waitForURL(url => url.toString() !== before, { timeout: 10000 }).catch(() => null),
    popupPromise
  ]);

  const after = page.url();
  console.log('BEFORE_URL', before);
  console.log('AFTER_URL', after);
  console.log('POPUP_URL', popupUrl);
  await page.screenshot({ path: '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/output/playwright/arcade-after-listen-click.png', fullPage: true });
  await browser.close();
})();
