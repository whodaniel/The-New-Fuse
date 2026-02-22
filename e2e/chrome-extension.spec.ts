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

  test('should initialize content script on localhost', async ({}) => {
    const page = await context.newPage();

    // Go to a matched URL (localhost:3000 is in manifest matches)
    await page.goto('http://localhost:3000');

    // Wait for content script to initialize
    await page.waitForFunction(() => window.__FUSE_CONNECT_INITIALIZED__ === true, {
      timeout: 10000,
    });

    const isInitialized = await page.evaluate(() => window.__FUSE_CONNECT_INITIALIZED__);
    expect(isInitialized).toBe(true);

    // Check if debug utils are available
    const hasDebug = await page.evaluate(() => typeof window.__FUSE_DEBUG === 'object');
    expect(hasDebug).toBe(true);
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
