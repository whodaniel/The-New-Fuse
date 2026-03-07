import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function login() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('Launching browser for login at:', profileDir);
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
  await page.goto('https://aistudio.google.com/app/prompts/new_chat');

  console.log('Browser open. Please log in to Google AI Studio.');
  console.log('Press Ctrl+C to stop this script once logged in.');

  // Keep alive
  await new Promise(() => {});
}

login().catch(console.error);
