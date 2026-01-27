/**
 * Gemini Browser Automation Service
 *
 * Automates Chrome's built-in Gemini AI for free compute delegation
 * Allows TNF agents to leverage Gemini's tab-awareness and internet access
 *
 * Key Features:
 * - Opens Chrome with Gemini side panel
 * - Types prompts programmatically
 * - Extracts responses
 * - Leverages Gemini's ability to see tab contents
 * - Free compute for non-critical tasks
 */

import { Browser, BrowserContext, Page, chromium } from 'playwright';

export interface GeminiPromptRequest {
  prompt: string;
  contextUrls?: string[]; // URLs to open in tabs for Gemini to see
  timeout?: number; // Response timeout in ms
}

export interface GeminiResponse {
  response: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class GeminiBrowserAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private geminiPage: Page | null = null;
  private isInitialized = false;

  /**
   * Initialize Chrome with Gemini enabled
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[GeminiBrowser] Launching Chrome with Gemini...');

      // Launch Chrome with specific flags to enable Gemini
      // Launch Chrome/Chromium
      // In server environments (Alpine/Railway), we rely on the system-installed Chromium
      const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
      const isServer = !!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

      this.browser = await chromium.launch({
        headless: isServer ? true : false, // Headless on server, visible locally
        channel: isServer ? undefined : 'chrome', // Use system Chromium on server, Chrome locally
        executablePath,
        args: [
          '--enable-features=Gemini,OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano',
          '--no-first-run',
          '--no-default-browser-check',
          '--no-sandbox', // Required for Docker/Alpine
          '--disable-setuid-sandbox',
        ],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
      });

      // Open a new page
      this.geminiPage = await this.context.newPage();

      // Navigate to a page where we can trigger Gemini
      await this.geminiPage.goto('https://gemini.google.com');

      console.log('[GeminiBrowser] Chrome launched successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[GeminiBrowser] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Open Gemini side panel using keyboard shortcut
   */
  private async openGeminiPanel(): Promise<boolean> {
    if (!this.geminiPage) {
      throw new Error('Browser not initialized');
    }

    try {
      // Try Ctrl+G (or Cmd+G on Mac) to open Gemini side panel
      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';

      await this.geminiPage.keyboard.press(`${modifier}+KeyG`);

      // Wait for side panel to appear
      await this.geminiPage.waitForTimeout(1000);

      return true;
    } catch (error) {
      console.error('[GeminiBrowser] Failed to open Gemini panel:', error);
      return false;
    }
  }

  /**
   * Type a prompt into Gemini's input field
   */
  private async typePrompt(prompt: string): Promise<boolean> {
    if (!this.geminiPage) {
      throw new Error('Browser not initialized');
    }

    try {
      // Look for Gemini's chat input
      // This selector may need adjustment based on Gemini's actual UI
      const inputSelector =
        'textarea[placeholder*="Ask"], textarea[aria-label*="chat"], .chat-input, [contenteditable="true"]';

      await this.geminiPage.waitForSelector(inputSelector, { timeout: 5000 });
      await this.geminiPage.click(inputSelector);
      await this.geminiPage.fill(inputSelector, prompt);

      // Press Enter to send
      await this.geminiPage.keyboard.press('Enter');

      return true;
    } catch (error) {
      console.error('[GeminiBrowser] Failed to type prompt:', error);
      return false;
    }
  }

  /**
   * Extract Gemini's response from the UI
   */
  private async extractResponse(timeout: number = 30000): Promise<string> {
    if (!this.geminiPage) {
      throw new Error('Browser not initialized');
    }

    try {
      // Wait for response to appear
      // This selector may need adjustment based on Gemini's actual UI
      const responseSelector = '.model-response, .message-content, [data-message-author="model"]';

      await this.geminiPage.waitForSelector(responseSelector, { timeout });

      // Get the latest response
      const responses = await this.geminiPage.$$eval(responseSelector, (elements) =>
        elements.map((el) => el.textContent || '')
      );

      // Return the last response
      return responses[responses.length - 1] || '';
    } catch (error) {
      console.error('[GeminiBrowser] Failed to extract response:', error);
      throw error;
    }
  }

  /**
   * Open context URLs in tabs for Gemini to see
   */
  private async openContextTabs(urls: string[]): Promise<Page[]> {
    if (!this.context) {
      throw new Error('Browser not initialized');
    }

    const pages: Page[] = [];

    for (const url of urls) {
      try {
        const page = await this.context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        pages.push(page);
        console.log(`[GeminiBrowser] Opened context tab: ${url}`);
      } catch (error) {
        console.error(`[GeminiBrowser] Failed to open ${url}:`, error);
      }
    }

    return pages;
  }

  /**
   * Send a prompt to Gemini and get response
   */
  async prompt(request: GeminiPromptRequest): Promise<GeminiResponse> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          response: '',
          success: false,
          error: 'Failed to initialize browser',
          timestamp: Date.now(),
        };
      }
    }

    try {
      // Open context tabs if provided
      let contextPages: Page[] = [];
      if (request.contextUrls && request.contextUrls.length > 0) {
        contextPages = await this.openContextTabs(request.contextUrls);
        // Give Gemini time to process the tabs
        await this.geminiPage!.waitForTimeout(2000);
      }

      // Open Gemini panel
      await this.openGeminiPanel();

      // Type the prompt
      const typed = await this.typePrompt(request.prompt);
      if (!typed) {
        throw new Error('Failed to type prompt');
      }

      // Extract response
      const response = await this.extractResponse(request.timeout || 30000);

      // Close context tabs
      for (const page of contextPages) {
        await page.close();
      }

      return {
        response,
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.geminiPage = null;
      this.isInitialized = false;
      console.log('[GeminiBrowser] Browser closed');
    }
  }

  /**
   * Check if browser is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const geminiBrowser = new GeminiBrowserAutomation();
