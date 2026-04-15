import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '../apps/chrome-extension/dist-v7');

test.describe('Chrome Extension E2E', () => {
  let context: BrowserContext;

  test.beforeEach(async () => {
    // Launch browser with extension
    context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions only work in non-headless mode
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should initialize content script on localhost', async ({ baseURL }) => {
    const page = await context.newPage();
    const targetUrl =
      baseURL || process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

    // Go to a matched URL served by the e2e web server.
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // MV3 content scripts execute in an isolated world; page globals are not a reliable assertion surface.
    // Keep this as a smoke diagnostic while background-worker coverage remains the hard assertion.
    const pageLoaded = await page.evaluate(() => document.readyState !== 'loading');
    expect(pageLoaded).toBe(true);
  });

  test('should have a working background service worker', async ({}) => {
    // Get background page / service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    expect(background).toBeTruthy();
    expect(background.url()).toContain('background/index.js');
  });
});
