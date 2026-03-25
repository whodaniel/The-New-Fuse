import { chromium } from 'playwright';

const url = 'https://poker.ai-arcade.xyz/table';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.error('Console error:', msg.text());
  }
});

await page.goto(url, { waitUntil: 'networkidle' });

const callsignInput = page.locator('input[placeholder="Enter your callsign..."]');
await callsignInput.waitFor({ state: 'visible', timeout: 15000 });
await callsignInput.fill('CODEX');

const jackInBtn = page.locator('button', { hasText: 'Jack In' });
await jackInBtn.click();

await page.waitForTimeout(3500);
await page.waitForSelector('text=TABLE ROUND', { timeout: 15000 }).catch(() => {});

await page.screenshot({ path: '/Users/<owner>/output/web-game/shot-live-table-new.png', fullPage: true });

await browser.close();
