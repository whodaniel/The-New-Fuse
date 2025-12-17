/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import * as os from 'os';
import * as path from 'path';

import { app } from 'electron';

export class PlaywrightService {
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private playwright: any = null;

  async initialize() {
    if (this.browser) {
      return;
    }

    console.log('Initializing Playwright Service...');
    try {
      // Set up playwright browsers path
      if (app.isPackaged) {
        // Use system-installed browsers from user's cache
        const playwrightCachePath = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
        process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightCachePath;
        console.log('Using Playwright browsers from:', playwrightCachePath);
      }

      // Dynamically require playwright
      const playwrightPath = app.isPackaged
        ? path.join(process.resourcesPath, 'app', 'node_modules', 'playwright')
        : 'playwright';

      this.playwright = require(playwrightPath);

      this.browser = await this.playwright.chromium.launch({
        headless: false, // Visible for demo
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      console.log('Playwright Service Initialized.');
    } catch (error) {
      console.error('Failed to initialize Playwright:', error);
      throw error;
    }
  }

  async openUrl(url: string) {
    try {
      if (!this.page) {
        await this.initialize();
      }
      if (this.page) {
        console.log(`Navigating to ${url}...`);
        await this.page.goto(url);
        console.log(`Navigated to ${url}`);
      }
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}
