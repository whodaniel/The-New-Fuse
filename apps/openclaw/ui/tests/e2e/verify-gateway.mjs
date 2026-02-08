import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const CONFIG_PATH = path.join(HOME_DIR, '.openclaw', 'openclaw.json');

async function main() {
  console.log('🔍 Starting Gateway Verification Test...');

  // 1. Retrieve Token
  let token = process.env.OPENCLAW_TOKEN || '';
  if (!token && fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      token = config.gateway?.auth?.token || '';
      if (token) {
        console.log('✅ Found gateway token in ~/.openclaw/openclaw.json');
      }
    } catch (e) {
      console.warn(`⚠️ Error reading config from ${CONFIG_PATH}:`, e.message);
    }
  }

  if (!token) {
    console.warn('⚠️ No token found. Assuming auth is disabled or test will fail on login.');
  }

  // 2. Launch Browser
  console.log('🚀 Launching Chromium...');
  const browser = await chromium.launch({
    headless: true, // Run headless for automation
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 3. Navigate to Gateway
    // If token exists, pass it via URL query param to bypass modal
    const targetUrl = token ? `${GATEWAY_URL}/?token=${token}` : `${GATEWAY_URL}/dashboard`;
    console.log(`🌐 Navigating to ${GATEWAY_URL}...`);

    // Increased timeout for initial load
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    if (!response) {
      throw new Error(`Failed to load ${targetUrl}: No response`);
    }

    if (response.status() >= 400) {
      throw new Error(`Gateway returned HTTP ${response.status()}`);
    }

    console.log(`📡 HTTP ${response.status()} OK`);

    // 4. Verify Connection Status
    console.log('⏳ Waiting for "Connected" indicator in UI...');

    // Check for "Connected" text which appears when WebSocket connects
    // We add a reasonable timeout because WS connection might take a moment
    await page.waitForSelector('text=Connected', { timeout: 10000 });
    console.log('✅ Connection verified: "Connected" text found in UI');

    // 5. Basic UI Integrity Checks

    // Check for Chat Input
    const chatInput = page.locator('textarea, input[type="text"]');
    if ((await chatInput.count()) > 0) {
      console.log('✅ Chat input field is present');
    } else {
      console.warn('⚠️ Warning: Chat input field not found');
    }

    // Check for "Send" button
    const sendBtn = page.locator(
      'button:has-text("Send"), button:has-text("Run"), button:has-text("Submit")'
    );
    if ((await sendBtn.count()) > 0) {
      console.log('✅ Send/Run button is present');
    }

    console.log('🎉 Application appears functional!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);

    // Capture failure state
    const screenshotPath = path.resolve('gateway-failure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to ${screenshotPath}`);

    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
