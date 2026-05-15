import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const screenshotPath = process.env.TNF_LOGIN_DIAGNOSTIC_PATH
    ? path.resolve(process.env.TNF_LOGIN_DIAGNOSTIC_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'login_diagnostic.png');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🔍 Diagnosing Login Page with profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
  });

  const page = await context.newPage();

  // Catch console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Error] ${msg.text()}`);
    }
  });

  try {
    console.log('🚀 Navigating to https://app.thenewfuse.com/login...');
    await page.goto('https://app.thenewfuse.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page Loaded.');
    console.log('Title:', await page.title());
    console.log('Current URL:', page.url());

    // Check for specific elements
    const loginForm = await page.$('form');
    console.log('Login Form Found:', !!loginForm);

    const emailInput = await page.$('input[type="email"]');
    console.log('Email Input Found:', !!emailInput);

    // Check for the "isAppHost" crash evidence in the DOM
    const bodyText = await page.innerText('body');
    if (
      bodyText.includes('isAppHost is not defined') ||
      bodyText.includes('Something went wrong')
    ) {
      console.log("🚩 CRASH DETECTED: Page showing 'Something went wrong' or ReferenceError.");
    }

    // Diagnostic screenshot
    await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Diagnostic screenshot saved to: ${screenshotPath}`);
  } catch (e) {
    console.error('❌ Failed to load login page:', (e as Error).message);
  }

  console.log('\nLeaving browser open for 10 seconds for visual inspection...');
  await page.waitForTimeout(10000);
  await context.close();
}

main().catch(console.error);
