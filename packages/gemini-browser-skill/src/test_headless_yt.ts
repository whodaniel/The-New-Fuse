import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  console.log('Navigating to YouTube...');
  await page.goto('https://www.youtube.com/watch?v=bSG9wUYaHWU', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const video = page.locator('video').first();
  if (await video.isVisible()) {
    console.log('Video found, taking screenshot...');
    await video.screenshot({ path: '/tmp/headless_yt_capture.jpg' });
    console.log('Screenshot saved to /tmp/headless_yt_capture.jpg');
  } else {
    console.log('Video not found or not visible');
  }
  await browser.close();
}

main().catch(console.error);
