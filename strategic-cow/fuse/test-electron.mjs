const puppeteer = require('puppeteer');

async function testElectronApp() {
  try {
    // Connect to the Electron app's remote debugging port
    const browserWSEndpoint = 'ws://localhost:9222/devtools/browser';
    const browser = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[0]; // The main window

    console.log('Connected to Electron app');

    // Wait for the app to load
    await page.waitForSelector('.sidebar', { timeout: 10000 });
    console.log('App loaded successfully');

    // Test sidebar navigation
    const sidebarItems = await page.$$('.sidebar button, .sidebar a');
    console.log(`Found ${sidebarItems.length} sidebar items`);

    for (let i = 0; i < sidebarItems.length; i++) {
      try {
        const item = sidebarItems[i];
        const text = await item.evaluate(el => el.textContent || el.innerText);
        console.log(`Testing sidebar item: ${text}`);
        await item.click();
        await page.waitForTimeout(500); // Wait for navigation
      } catch (e) {
        console.error(`Error clicking sidebar item ${i}:`, e.message);
      }
    }

    // Test tabs
    const tabs = await page.$$('.tab, [role="tab"]');
    console.log(`Found ${tabs.length} tabs`);

    for (const tab of tabs) {
      try {
        await tab.click();
        await page.waitForTimeout(500);
        console.log('Tab clicked successfully');
      } catch (e) {
        console.error('Error clicking tab:', e.message);
      }
    }

    // Test inputs
    const inputs = await page.$$('input, textarea');
    console.log(`Found ${inputs.length} input fields`);

    for (const input of inputs) {
      try {
        await input.type('test input');
        console.log('Input field tested');
      } catch (e) {
        console.error('Error with input:', e.message);
      }
    }

    // Test buttons
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);

    for (const button of buttons.slice(0, 10)) { // Test first 10 to avoid too many
      try {
        const text = await button.evaluate(el => el.textContent);
        console.log(`Testing button: ${text}`);
        await button.click();
        await page.waitForTimeout(200);
      } catch (e) {
        console.error('Error clicking button:', e.message);
      }
    }

    // Test links
    const links = await page.$$('a');
    console.log(`Found ${links.length} links`);

    for (const link of links.slice(0, 5)) { // Test first 5
      try {
        const href = await link.evaluate(el => el.href);
        console.log(`Testing link: ${href}`);
        // Don't actually navigate, just check
      } catch (e) {
        console.error('Error with link:', e.message);
      }
    }

    console.log('Testing completed');
    await browser.disconnect();

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testElectronApp();
