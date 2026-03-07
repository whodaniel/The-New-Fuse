const { chromium } = require('playwright');
const path = require('path');

async function yoloTestLoop() {
  console.log('🚀 Starting YOLO Tester for TNF Chrome Extension...');

  // Path to the built extension
  const extensionPath = path.resolve(__dirname, '../dist-v7');

  // Launch Playwright with the extension loaded
  const browserContext = await chromium.launchPersistentContext('', {
    headless: false, // Must be false to test extensions
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    viewport: { width: 1280, height: 800 },
  });

  const aiPlatforms = ['https://chatgpt.com', 'https://claude.ai', 'https://pi.ai'];

  console.log('🌐 Opening AI chat platforms...');

  for (const url of aiPlatforms) {
    const page = await browserContext.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      console.log(`✅ Loaded ${url}`);
    } catch (err) {
      console.log(`⚠️  Could not fully load ${url}: ${err.message}`);
    }
  }

  console.log('🤖 YOLO mode initiated. Interacting with pages and extension randomly...');

  // Infinite loop representing "YOLO mode" and "keep doing it"
  let cycle = 0;
  while (true) {
    cycle++;
    console.log(`\n🔄 YOLO Cycle #${cycle} at ${new Date().toISOString()}`);

    const pages = browserContext.pages();

    // Pick a random page
    if (pages.length > 0) {
      const pageToTest = pages[Math.floor(Math.random() * pages.length)];
      const url = await pageToTest.url();
      console.log(`👉 Switching focus to: ${url}`);
      await pageToTest.bringToFront();

      // Simulate random interactions (scrolling, checking for extension injects)
      try {
        await pageToTest.evaluate(() => window.scrollBy(0, Math.random() * 500));

        // Wait to see if our extension's UI is injected
        // e.g. floating panel, indicators, etc.
        const hasTnfUi = await pageToTest.evaluate(() => {
          return (
            document.querySelector('#tnf-floating-panel') !== null ||
            document.querySelector('.tnf-indicator') !== null
          );
        });

        if (hasTnfUi) {
          console.log(`✅ Detected TNF Extension UI on ${url}`);
          // Simulate clicking on the TNF UI if needed
        } else {
          console.log(`ℹ️ TNF Extension UI not yet active on ${url}`);
        }
      } catch (err) {
        console.log(`ℹ️ Interaction on ${url} failed softly: ${err.message}`);
      }
    }

    // Wait a random amount of time between 15s and 30s
    const delay = Math.floor(Math.random() * 15000) + 15000;
    console.log(`😴 Waiting ${delay}ms before next action...`);
    await new Promise((res) => setTimeout(res, delay));
  }
}

yoloTestLoop().catch((err) => {
  console.error('❌ YOLO Tester encountered a fatal error:', err);
  process.exit(1);
});
