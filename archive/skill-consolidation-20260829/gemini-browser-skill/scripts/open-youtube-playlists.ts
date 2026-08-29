import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function openYoutube() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('Launching browser with profile:', profileDir);
  fs.mkdirSync(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto('https://www.youtube.com/feed/playlists');

  console.log('\n================================================================');
  console.log('BROWSER OPENED TO YOUTUBE PLAYLISTS');
  console.log('1. Please log in to your main Google account.');
  console.log('2. Select your YouTube brand account.');
  console.log('3. Locate the "AI 4" playlist.');
  console.log('4. Once you are on the "AI 4" playlist page, tell me.');
  console.log('================================================================\n');

  // Wait for user to finish in browser (keep script running)
  await new Promise(() => {});
}

openYoutube().catch(console.error);
