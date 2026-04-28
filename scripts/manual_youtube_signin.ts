import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Chrome with profile: ${profileDir}`);

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
  const signinUrl =
    'https://accounts.google.com/ServiceLogin?service=youtube&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26next%3D%252F%26hl%3Den&hl=en';

  console.log('Navigating to standard YouTube login...');
  await page.goto(signinUrl);

  console.log('Browser is open. Please sign in to your Google account.');
  console.log('Once you see the YouTube homepage, the session is saved.');
  console.log('You can then close the window or let me know.');
}

main().catch(console.error);
