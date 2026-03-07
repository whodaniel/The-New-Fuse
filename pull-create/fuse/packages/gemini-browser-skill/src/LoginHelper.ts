import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function login() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');

  console.log(`[LoginHelper] 📂 Using Profile Directory: ${profileDir}`);
  console.log('[LoginHelper] 🚀 Launching Chrome (Clean Mode)...');
  console.log(
    '[LoginHelper] 👉 Please sign in to Google/YouTube/AI Studio in the browser window that opens.'
  );
  console.log(
    '[LoginHelper] 👉 Once signed in, verify you can access https://aistudio.google.com/'
  );
  console.log(
    '[LoginHelper] ⏱️ This script will keep the browser open for 10 minutes or until you close it manually.'
  );

  if (!fs.existsSync(profileDir)) {
    console.log('[LoginHelper] Creating profile directory...');
    fs.mkdirSync(profileDir, { recursive: true });
  }

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
  await page.goto('https://accounts.google.com/ServiceLogin');

  // Also open AI Studio in a second tab
  const page2 = await context.newPage();
  await page2.goto('https://aistudio.google.com/');

  // Debugging: Check AI Studio state
  await page2.waitForTimeout(5000); // Wait for load

  console.log(`[LoginHelper] 🔍 Current URL: ${page2.url()}`);
  console.log(`[LoginHelper] 📄 Page Title: ${await page2.title()}`);

  const textarea = page2.locator('textarea[aria-label="Enter a prompt"]');
  if ((await textarea.count()) > 0 && (await textarea.isVisible())) {
    console.log('[LoginHelper] ✅ SUCCESS: Prompt box found! Automation should work.');
  } else {
    console.log('[LoginHelper] ❌ FAILURE: Prompt box NOT found.');
    console.log('[LoginHelper] 📸 Taking debug screenshot...');
    await page2.screenshot({ path: path.join(process.cwd(), 'login_debug.png') });

    // Check for common alternative states
    if ((await page2.locator('text="Sign in"').count()) > 0) {
      console.log('[LoginHelper] ⚠️ Detected "Sign in" text - You might not be logged in.');
    }
  }

  // Wait for a long time to let user sign in
  await new Promise((resolve) => setTimeout(resolve, 600000)); // 10 minutes

  await context.close();
}

login().catch(console.error);
