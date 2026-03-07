'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.geminiBrowser = exports.GeminiBrowserAutomation = void 0;
const playwright_1 = require('playwright');
class GeminiBrowserAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.geminiPage = null;
    this.isInitialized = false;
  }
  /**
   * Initialize Chrome with Gemini enabled
   */
  async initialize() {
    try {
      console.log('[GeminiBrowser] Launching Chrome with Gemini...');
      // Launch Chrome with specific flags to enable Gemini
      this.browser = await playwright_1.chromium.launch({
        headless: false, // Gemini UI requires visible browser
        channel: 'chrome', // Use installed Chrome (not Chromium)
        args: [
          '--enable-features=Gemini,OptimizationGuideOnDeviceModel,PromptAPIForGeminiNano',
          '--no-first-run',
          '--no-default-browser-check',
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
  async openGeminiPanel() {
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
  async typePrompt(prompt) {
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
  async extractResponse(timeout = 30000) {
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
  async openContextTabs(urls) {
    if (!this.context) {
      throw new Error('Browser not initialized');
    }
    const pages = [];
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
  async prompt(request) {
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
      let contextPages = [];
      if (request.contextUrls && request.contextUrls.length > 0) {
        contextPages = await this.openContextTabs(request.contextUrls);
        // Give Gemini time to process the tabs
        await this.geminiPage.waitForTimeout(2000);
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
  async close() {
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
  isReady() {
    return this.isInitialized;
  }
}
exports.GeminiBrowserAutomation = GeminiBrowserAutomation;
// Export singleton instance
exports.geminiBrowser = new GeminiBrowserAutomation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VtaW5pQnJvd3NlckF1dG9tYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHZW1pbmlCcm93c2VyQXV0b21hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7QUFFSCwyQ0FBcUU7QUFlckUsTUFBYSx1QkFBdUI7SUFBcEM7UUFDVSxZQUFPLEdBQW1CLElBQUksQ0FBQztRQUMvQixZQUFPLEdBQTBCLElBQUksQ0FBQztRQUN0QyxlQUFVLEdBQWdCLElBQUksQ0FBQztRQUMvQixrQkFBYSxHQUFHLEtBQUssQ0FBQztJQTZOaEMsQ0FBQztJQTNOQzs7T0FFRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsSUFBSSxDQUFDO1lBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1lBRS9ELHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0scUJBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ25DLFFBQVEsRUFBRSxLQUFLLEVBQUUscUNBQXFDO2dCQUN0RCxPQUFPLEVBQUUsUUFBUSxFQUFFLHNDQUFzQztnQkFDekQsSUFBSSxFQUFFO29CQUNKLGdGQUFnRjtvQkFDaEYsZ0JBQWdCO29CQUNoQiw0QkFBNEI7aUJBQzdCO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO2dCQUMzQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7YUFDdkMsQ0FBQyxDQUFDO1lBRUgsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRS9DLGlEQUFpRDtZQUNqRCxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFF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YSxHQUFHLElBQUksdUJBQXVCLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2VtaW5pIEJyb3dzZXIgQXV0b21hdGlvbiBTZXJ2aWNlXG4gKlxuICogQXV0b21hdGVzIENocm9tZSdzIGJ1aWx0LWluIEdlbWluaSBBSSBmb3IgZnJlZSBjb21wdXRlIGRlbGVnYXRpb25cbiAqIEFsbG93cyBUTkYgYWdlbnRzIHRvIGxldmVyYWdlIEdlbWluaSdzIHRhYi1hd2FyZW5lc3MgYW5kIGludGVybmV0IGFjY2Vzc1xuICpcbiAqIEtleSBGZWF0dXJlczpcbiAqIC0gT3BlbnMgQ2hyb21lIHdpdGggR2VtaW5pIHNpZGUgcGFuZWxcbiAqIC0gVHlwZXMgcHJvbXB0cyBwcm9ncmFtbWF0aWNhbGx5XG4gKiAtIEV4dHJhY3RzIHJlc3BvbnNlc1xuICogLSBMZXZlcmFnZXMgR2VtaW5pJ3MgYWJpbGl0eSB0byBzZWUgdGFiIGNvbnRlbnRzXG4gKiAtIEZyZWUgY29tcHV0ZSBmb3Igbm9uLWNyaXRpY2FsIHRhc2tzXG4gKi9cblxuaW1wb3J0IHsgQnJvd3NlciwgQnJvd3NlckNvbnRleHQsIFBhZ2UsIGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2VtaW5pUHJvbXB0UmVxdWVzdCB7XG4gIHByb21wdDogc3RyaW5nO1xuICBjb250ZXh0VXJscz86IHN0cmluZ1tdOyAvLyBVUkxzIHRvIG9wZW4gaW4gdGFicyBmb3IgR2VtaW5pIHRvIHNlZVxuICB0aW1lb3V0PzogbnVtYmVyOyAvLyBSZXNwb25zZSB0aW1lb3V0IGluIG1zXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2VtaW5pUmVzcG9uc2Uge1xuICByZXNwb25zZTogc3RyaW5nO1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBlcnJvcj86IHN0cmluZztcbiAgdGltZXN0YW1wOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBHZW1pbmlCcm93c2VyQXV0b21hdGlvbiB7XG4gIHByaXZhdGUgYnJvd3NlcjogQnJvd3NlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZ2VtaW5pUGFnZTogUGFnZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBDaHJvbWUgd2l0aCBHZW1pbmkgZW5hYmxlZFxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coJ1tHZW1pbmlCcm93c2VyXSBMYXVuY2hpbmcgQ2hyb21lIHdpdGggR2VtaW5pLi4uJyk7XG5cbiAgICAgIC8vIExhdW5jaCBDaHJvbWUgd2l0aCBzcGVjaWZpYyBmbGFncyB0byBlbmFibGUgR2VtaW5pXG4gICAgICB0aGlzLmJyb3dzZXIgPSBhd2FpdCBjaHJvbWl1bS5sYXVuY2goe1xuICAgICAgICBoZWFkbGVzczogZmFsc2UsIC8vIEdlbWluaSBVSSByZXF1aXJlcyB2aXNpYmxlIGJyb3dzZXJcbiAgICAgICAgY2hhbm5lbDogJ2Nocm9tZScsIC8vIFVzZSBpbnN0YWxsZWQgQ2hyb21lIChub3QgQ2hyb21pdW0pXG4gICAgICAgIGFyZ3M6IFtcbiAgICAgICAgICAnLS1lbmFibGUtZmVhdHVyZXM9R2VtaW5pLE9wdGltaXphdGlvbkd1aWRlT25EZXZpY2VNb2RlbCxQcm9tcHRBUElGb3JHZW1pbmlOYW5vJyxcbiAgICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAgICctLW5vLWRlZmF1bHQtYnJvd3Nlci1jaGVjaycsXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5jb250ZXh0ID0gYXdhaXQgdGhpcy5icm93c2VyLm5ld0NvbnRleHQoe1xuICAgICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTI4MCwgaGVpZ2h0OiA3MjAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBPcGVuIGEgbmV3IHBhZ2VcbiAgICAgIHRoaXMuZ2VtaW5pUGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG5cbiAgICAgIC8vIE5hdmlnYXRlIHRvIGEgcGFnZSB3aGVyZSB3ZSBjYW4gdHJpZ2dlciBHZW1pbmlcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5nb3RvKCdodHRwczovL2dlbWluaS5nb29nbGUuY29tJyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbR2VtaW5pQnJvd3Nlcl0gQ2hyb21lIGxhdW5jaGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbR2VtaW5pQnJvd3Nlcl0gRmFpbGVkIHRvIGluaXRpYWxpemU6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIEdlbWluaSBzaWRlIHBhbmVsIHVzaW5nIGtleWJvYXJkIHNob3J0Y3V0XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG9wZW5HZW1pbmlQYW5lbCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMuZ2VtaW5pUGFnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBUcnkgQ3RybCtHIChvciBDbWQrRyBvbiBNYWMpIHRvIG9wZW4gR2VtaW5pIHNpZGUgcGFuZWxcbiAgICAgIGNvbnN0IGlzTWFjID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgICBjb25zdCBtb2RpZmllciA9IGlzTWFjID8gJ01ldGEnIDogJ0NvbnRyb2wnO1xuXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2Uua2V5Ym9hcmQucHJlc3MoYCR7bW9kaWZpZXJ9K0tleUdgKTtcblxuICAgICAgLy8gV2FpdCBmb3Igc2lkZSBwYW5lbCB0byBhcHBlYXJcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHZW1pbmlCcm93c2VyXSBGYWlsZWQgdG8gb3BlbiBHZW1pbmkgcGFuZWw6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUeXBlIGEgcHJvbXB0IGludG8gR2VtaW5pJ3MgaW5wdXQgZmllbGRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdHlwZVByb21wdChwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICghdGhpcy5nZW1pbmlQYWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIExvb2sgZm9yIEdlbWluaSdzIGNoYXQgaW5wdXRcbiAgICAgIC8vIFRoaXMgc2VsZWN0b3IgbWF5IG5lZWQgYWRqdXN0bWVudCBiYXNlZCBvbiBHZW1pbmkncyBhY3R1YWwgVUlcbiAgICAgIGNvbnN0IGlucHV0U2VsZWN0b3IgPVxuICAgICAgICAndGV4dGFyZWFbcGxhY2Vob2xkZXIqPVwiQXNrXCJdLCB0ZXh0YXJlYVthcmlhLWxhYmVsKj1cImNoYXRcIl0sIC5jaGF0LWlucHV0LCBbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXSc7XG5cbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS53YWl0Rm9yU2VsZWN0b3IoaW5wdXRTZWxlY3RvciwgeyB0aW1lb3V0OiA1MDAwIH0pO1xuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLmNsaWNrKGlucHV0U2VsZWN0b3IpO1xuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLmZpbGwoaW5wdXRTZWxlY3RvciwgcHJvbXB0KTtcblxuICAgICAgLy8gUHJlc3MgRW50ZXIgdG8gc2VuZFxuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLmtleWJvYXJkLnByZXNzKCdFbnRlcicpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byB0eXBlIHByb21wdDonLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgR2VtaW5pJ3MgcmVzcG9uc2UgZnJvbSB0aGUgVUlcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXh0cmFjdFJlc3BvbnNlKHRpbWVvdXQ6IG51bWJlciA9IDMwMDAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoIXRoaXMuZ2VtaW5pUGFnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBXYWl0IGZvciByZXNwb25zZSB0byBhcHBlYXJcbiAgICAgIC8vIFRoaXMgc2VsZWN0b3IgbWF5IG5lZWQgYWRqdXN0bWVudCBiYXNlZCBvbiBHZW1pbmkncyBhY3R1YWwgVUlcbiAgICAgIGNvbnN0IHJlc3BvbnNlU2VsZWN0b3IgPSAnLm1vZGVsLXJlc3BvbnNlLCAubWVzc2FnZS1jb250ZW50LCBbZGF0YS1tZXNzYWdlLWF1dGhvcj1cIm1vZGVsXCJdJztcblxuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLndhaXRGb3JTZWxlY3RvcihyZXNwb25zZVNlbGVjdG9yLCB7IHRpbWVvdXQgfSk7XG5cbiAgICAgIC8vIEdldCB0aGUgbGF0ZXN0IHJlc3BvbnNlXG4gICAgICBjb25zdCByZXNwb25zZXMgPSBhd2FpdCB0aGlzLmdlbWluaVBhZ2UuJCRldmFsKHJlc3BvbnNlU2VsZWN0b3IsIChlbGVtZW50cykgPT5cbiAgICAgICAgZWxlbWVudHMubWFwKChlbCkgPT4gZWwudGV4dENvbnRlbnQgfHwgJycpXG4gICAgICApO1xuXG4gICAgICAvLyBSZXR1cm4gdGhlIGxhc3QgcmVzcG9uc2VcbiAgICAgIHJldHVybiByZXNwb25zZXNbcmVzcG9uc2VzLmxlbmd0aCAtIDFdIHx8ICcnO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbR2VtaW5pQnJvd3Nlcl0gRmFpbGVkIHRvIGV4dHJhY3QgcmVzcG9uc2U6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW4gY29udGV4dCBVUkxzIGluIHRhYnMgZm9yIEdlbWluaSB0byBzZWVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgb3BlbkNvbnRleHRUYWJzKHVybHM6IHN0cmluZ1tdKTogUHJvbWlzZTxQYWdlW10+IHtcbiAgICBpZiAoIXRoaXMuY29udGV4dCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHBhZ2VzOiBQYWdlW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuICAgICAgICBhd2FpdCBwYWdlLmdvdG8odXJsLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnIH0pO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW0dlbWluaUJyb3dzZXJdIE9wZW5lZCBjb250ZXh0IHRhYjogJHt1cmx9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbR2VtaW5pQnJvd3Nlcl0gRmFpbGVkIHRvIG9wZW4gJHt1cmx9OmAsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZXM7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHByb21wdCB0byBHZW1pbmkgYW5kIGdldCByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgcHJvbXB0KHJlcXVlc3Q6IEdlbWluaVByb21wdFJlcXVlc3QpOiBQcm9taXNlPEdlbWluaVJlc3BvbnNlPiB7XG4gICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxpemVkID0gYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICBpZiAoIWluaXRpYWxpemVkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzcG9uc2U6ICcnLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGluaXRpYWxpemUgYnJvd3NlcicsXG4gICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBPcGVuIGNvbnRleHQgdGFicyBpZiBwcm92aWRlZFxuICAgICAgbGV0IGNvbnRleHRQYWdlczogUGFnZVtdID0gW107XG4gICAgICBpZiAocmVxdWVzdC5jb250ZXh0VXJscyAmJiByZXF1ZXN0LmNvbnRleHRVcmxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29udGV4dFBhZ2VzID0gYXdhaXQgdGhpcy5vcGVuQ29udGV4dFRhYnMocmVxdWVzdC5jb250ZXh0VXJscyk7XG4gICAgICAgIC8vIEdpdmUgR2VtaW5pIHRpbWUgdG8gcHJvY2VzcyB0aGUgdGFic1xuICAgICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2UhLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuICAgICAgfVxuXG4gICAgICAvLyBPcGVuIEdlbWluaSBwYW5lbFxuICAgICAgYXdhaXQgdGhpcy5vcGVuR2VtaW5pUGFuZWwoKTtcblxuICAgICAgLy8gVHlwZSB0aGUgcHJvbXB0XG4gICAgICBjb25zdCB0eXBlZCA9IGF3YWl0IHRoaXMudHlwZVByb21wdChyZXF1ZXN0LnByb21wdCk7XG4gICAgICBpZiAoIXR5cGVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHR5cGUgcHJvbXB0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4dHJhY3QgcmVzcG9uc2VcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leHRyYWN0UmVzcG9uc2UocmVxdWVzdC50aW1lb3V0IHx8IDMwMDAwKTtcblxuICAgICAgLy8gQ2xvc2UgY29udGV4dCB0YWJzXG4gICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgY29udGV4dFBhZ2VzKSB7XG4gICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzcG9uc2UsXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2UgdGhlIGJyb3dzZXJcbiAgICovXG4gIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmJyb3dzZXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuYnJvd3Nlci5jbG9zZSgpO1xuICAgICAgdGhpcy5icm93c2VyID0gbnVsbDtcbiAgICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgICB0aGlzLmdlbWluaVBhZ2UgPSBudWxsO1xuICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICBjb25zb2xlLmxvZygnW0dlbWluaUJyb3dzZXJdIEJyb3dzZXIgY2xvc2VkJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGJyb3dzZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICovXG4gIGlzUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNJbml0aWFsaXplZDtcbiAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgZ2VtaW5pQnJvd3NlciA9IG5ldyBHZW1pbmlCcm93c2VyQXV0b21hdGlvbigpO1xuIl19
