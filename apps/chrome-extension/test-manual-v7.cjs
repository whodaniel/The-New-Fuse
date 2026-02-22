const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  try {
    const extensionPath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7';
    console.log('Extension path:', extensionPath);
    
    const browserContext = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    console.log('Browser launched');

    const page = await browserContext.newPage();
    
    // Log console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    });

    console.log('Navigating to http://localhost:3000/mock-chat.html ...');
    await page.goto('http://localhost:3000/mock-chat.html');
    
    // Wait a bit
    await page.waitForTimeout(5000);
    
    // Check if script is there
    const isInitialized = await page.evaluate(() => window.__FUSE_CONNECT_INITIALIZED__).catch(() => false);
    console.log('Content script initialized:', isInitialized);

    if (!isInitialized) {
      console.log('Trying 127.0.0.1...');
      await page.goto('http://127.0.0.1:3000/mock-chat.html');
      await page.waitForTimeout(5000);
      const isInitialized2 = await page.evaluate(() => window.__FUSE_CONNECT_INITIALIZED__).catch(() => false);
      console.log('Content script initialized (127.0.0.1):', isInitialized2);
    }

    await browserContext.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
