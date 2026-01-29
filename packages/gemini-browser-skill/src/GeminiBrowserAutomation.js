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
      // Launch Chrome/Chromium
      // In server environments (Alpine/Railway), we rely on the system-installed Chromium
      const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
      const isServer = !!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      this.browser = await playwright_1.chromium.launch({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VtaW5pQnJvd3NlckF1dG9tYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHZW1pbmlCcm93c2VyQXV0b21hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7QUFFSCwyQ0FBcUU7QUFlckUsTUFBYSx1QkFBdUI7SUFBcEM7UUFDVSxZQUFPLEdBQW1CLElBQUksQ0FBQztRQUMvQixZQUFPLEdBQTBCLElBQUksQ0FBQztRQUN0QyxlQUFVLEdBQWdCLElBQUksQ0FBQztRQUMvQixrQkFBYSxHQUFHLEtBQUssQ0FBQztJQXFPaEMsQ0FBQztJQW5PQzs7T0FFRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsSUFBSSxDQUFDO1lBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1lBRS9ELHFEQUFxRDtZQUNyRCx5QkFBeUI7WUFDekIsb0ZBQW9GO1lBQ3BGLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLElBQUksU0FBUyxDQUFDO1lBQ3BGLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDO1lBRW5FLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxxQkFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDbkMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsc0NBQXNDO2dCQUN6RSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxnREFBZ0Q7Z0JBQzFGLGNBQWM7Z0JBQ2QsSUFBSSxFQUFFO29CQUNKLGdGQUFnRjtvQkFDaEYsZ0JBQWdCO29CQUNoQiw0QkFBNEI7b0JBQzVCLGNBQWMsRUFBRSw2QkFBNkI7b0JBQzdDLDBCQUEwQjtpQkFDM0I7YUFDRixDQUFDLENBQUM7WUFFSCxJQUFJ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QUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUF6T0QsMERBeU9DO0FBRUQsNEJBQTRCO0FBQ2YsUUFBQSxhQUFhLEdBQUcsSUFBSSx1QkFBdUIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZW1pbmkgQnJvd3NlciBBdXRvbWF0aW9uIFNlcnZpY2VcbiAqXG4gKiBBdXRvbWF0ZXMgQ2hyb21lJ3MgYnVpbHQtaW4gR2VtaW5pIEFJIGZvciBmcmVlIGNvbXB1dGUgZGVsZWdhdGlvblxuICogQWxsb3dzIFRORiBhZ2VudHMgdG8gbGV2ZXJhZ2UgR2VtaW5pJ3MgdGFiLWF3YXJlbmVzcyBhbmQgaW50ZXJuZXQgYWNjZXNzXG4gKlxuICogS2V5IEZlYXR1cmVzOlxuICogLSBPcGVucyBDaHJvbWUgd2l0aCBHZW1pbmkgc2lkZSBwYW5lbFxuICogLSBUeXBlcyBwcm9tcHRzIHByb2dyYW1tYXRpY2FsbHlcbiAqIC0gRXh0cmFjdHMgcmVzcG9uc2VzXG4gKiAtIExldmVyYWdlcyBHZW1pbmkncyBhYmlsaXR5IHRvIHNlZSB0YWIgY29udGVudHNcbiAqIC0gRnJlZSBjb21wdXRlIGZvciBub24tY3JpdGljYWwgdGFza3NcbiAqL1xuXG5pbXBvcnQgeyBCcm93c2VyLCBCcm93c2VyQ29udGV4dCwgUGFnZSwgY2hyb21pdW0gfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuZXhwb3J0IGludGVyZmFjZSBHZW1pbmlQcm9tcHRSZXF1ZXN0IHtcbiAgcHJvbXB0OiBzdHJpbmc7XG4gIGNvbnRleHRVcmxzPzogc3RyaW5nW107IC8vIFVSTHMgdG8gb3BlbiBpbiB0YWJzIGZvciBHZW1pbmkgdG8gc2VlXG4gIHRpbWVvdXQ/OiBudW1iZXI7IC8vIFJlc3BvbnNlIHRpbWVvdXQgaW4gbXNcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZW1pbmlSZXNwb25zZSB7XG4gIHJlc3BvbnNlOiBzdHJpbmc7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEdlbWluaUJyb3dzZXJBdXRvbWF0aW9uIHtcbiAgcHJpdmF0ZSBicm93c2VyOiBCcm93c2VyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29udGV4dDogQnJvd3NlckNvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBnZW1pbmlQYWdlOiBQYWdlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIENocm9tZSB3aXRoIEdlbWluaSBlbmFibGVkXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZygnW0dlbWluaUJyb3dzZXJdIExhdW5jaGluZyBDaHJvbWUgd2l0aCBHZW1pbmkuLi4nKTtcblxuICAgICAgLy8gTGF1bmNoIENocm9tZSB3aXRoIHNwZWNpZmljIGZsYWdzIHRvIGVuYWJsZSBHZW1pbmlcbiAgICAgIC8vIExhdW5jaCBDaHJvbWUvQ2hyb21pdW1cbiAgICAgIC8vIEluIHNlcnZlciBlbnZpcm9ubWVudHMgKEFscGluZS9SYWlsd2F5KSwgd2UgcmVseSBvbiB0aGUgc3lzdGVtLWluc3RhbGxlZCBDaHJvbWl1bVxuICAgICAgY29uc3QgZXhlY3V0YWJsZVBhdGggPSBwcm9jZXNzLmVudi5QTEFZV1JJR0hUX0NIUk9NSVVNX0VYRUNVVEFCTEVfUEFUSCB8fCB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBpc1NlcnZlciA9ICEhcHJvY2Vzcy5lbnYuUExBWVdSSUdIVF9DSFJPTUlVTV9FWEVDVVRBQkxFX1BBVEg7XG5cbiAgICAgIHRoaXMuYnJvd3NlciA9IGF3YWl0IGNocm9taXVtLmxhdW5jaCh7XG4gICAgICAgIGhlYWRsZXNzOiBpc1NlcnZlciA/IHRydWUgOiBmYWxzZSwgLy8gSGVhZGxlc3Mgb24gc2VydmVyLCB2aXNpYmxlIGxvY2FsbHlcbiAgICAgICAgY2hhbm5lbDogaXNTZXJ2ZXIgPyB1bmRlZmluZWQgOiAnY2hyb21lJywgLy8gVXNlIHN5c3RlbSBDaHJvbWl1bSBvbiBzZXJ2ZXIsIENocm9tZSBsb2NhbGx5XG4gICAgICAgIGV4ZWN1dGFibGVQYXRoLFxuICAgICAgICBhcmdzOiBbXG4gICAgICAgICAgJy0tZW5hYmxlLWZlYXR1cmVzPUdlbWluaSxPcHRpbWl6YXRpb25HdWlkZU9uRGV2aWNlTW9kZWwsUHJvbXB0QVBJRm9yR2VtaW5pTmFubycsXG4gICAgICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAgICctLW5vLXNhbmRib3gnLCAvLyBSZXF1aXJlZCBmb3IgRG9ja2VyL0FscGluZVxuICAgICAgICAgICctLWRpc2FibGUtc2V0dWlkLXNhbmRib3gnLFxuICAgICAgICBdLFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IHRoaXMuYnJvd3Nlci5uZXdDb250ZXh0KHtcbiAgICAgICAgdmlld3BvcnQ6IHsgd2lkdGg6IDEyODAsIGhlaWdodDogNzIwIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gT3BlbiBhIG5ldyBwYWdlXG4gICAgICB0aGlzLmdlbWluaVBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byBhIHBhZ2Ugd2hlcmUgd2UgY2FuIHRyaWdnZXIgR2VtaW5pXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2UuZ290bygnaHR0cHM6Ly9nZW1pbmkuZ29vZ2xlLmNvbScpO1xuXG4gICAgICBjb25zb2xlLmxvZygnW0dlbWluaUJyb3dzZXJdIENocm9tZSBsYXVuY2hlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBpbml0aWFsaXplOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbiBHZW1pbmkgc2lkZSBwYW5lbCB1c2luZyBrZXlib2FyZCBzaG9ydGN1dFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBvcGVuR2VtaW5pUGFuZWwoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCF0aGlzLmdlbWluaVBhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gVHJ5IEN0cmwrRyAob3IgQ21kK0cgb24gTWFjKSB0byBvcGVuIEdlbWluaSBzaWRlIHBhbmVsXG4gICAgICBjb25zdCBpc01hYyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuICAgICAgY29uc3QgbW9kaWZpZXIgPSBpc01hYyA/ICdNZXRhJyA6ICdDb250cm9sJztcblxuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLmtleWJvYXJkLnByZXNzKGAke21vZGlmaWVyfStLZXlHYCk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHNpZGUgcGFuZWwgdG8gYXBwZWFyXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbR2VtaW5pQnJvd3Nlcl0gRmFpbGVkIHRvIG9wZW4gR2VtaW5pIHBhbmVsOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBhIHByb21wdCBpbnRvIEdlbWluaSdzIGlucHV0IGZpZWxkXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHR5cGVQcm9tcHQocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMuZ2VtaW5pUGFnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBMb29rIGZvciBHZW1pbmkncyBjaGF0IGlucHV0XG4gICAgICAvLyBUaGlzIHNlbGVjdG9yIG1heSBuZWVkIGFkanVzdG1lbnQgYmFzZWQgb24gR2VtaW5pJ3MgYWN0dWFsIFVJXG4gICAgICBjb25zdCBpbnB1dFNlbGVjdG9yID1cbiAgICAgICAgJ3RleHRhcmVhW3BsYWNlaG9sZGVyKj1cIkFza1wiXSwgdGV4dGFyZWFbYXJpYS1sYWJlbCo9XCJjaGF0XCJdLCAuY2hhdC1pbnB1dCwgW2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nO1xuXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2Uud2FpdEZvclNlbGVjdG9yKGlucHV0U2VsZWN0b3IsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5jbGljayhpbnB1dFNlbGVjdG9yKTtcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5maWxsKGlucHV0U2VsZWN0b3IsIHByb21wdCk7XG5cbiAgICAgIC8vIFByZXNzIEVudGVyIHRvIHNlbmRcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5rZXlib2FyZC5wcmVzcygnRW50ZXInKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHZW1pbmlCcm93c2VyXSBGYWlsZWQgdG8gdHlwZSBwcm9tcHQ6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IEdlbWluaSdzIHJlc3BvbnNlIGZyb20gdGhlIFVJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4dHJhY3RSZXNwb25zZSh0aW1lb3V0OiBudW1iZXIgPSAzMDAwMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLmdlbWluaVBhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gV2FpdCBmb3IgcmVzcG9uc2UgdG8gYXBwZWFyXG4gICAgICAvLyBUaGlzIHNlbGVjdG9yIG1heSBuZWVkIGFkanVzdG1lbnQgYmFzZWQgb24gR2VtaW5pJ3MgYWN0dWFsIFVJXG4gICAgICBjb25zdCByZXNwb25zZVNlbGVjdG9yID0gJy5tb2RlbC1yZXNwb25zZSwgLm1lc3NhZ2UtY29udGVudCwgW2RhdGEtbWVzc2FnZS1hdXRob3I9XCJtb2RlbFwiXSc7XG5cbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS53YWl0Rm9yU2VsZWN0b3IocmVzcG9uc2VTZWxlY3RvciwgeyB0aW1lb3V0IH0pO1xuXG4gICAgICAvLyBHZXQgdGhlIGxhdGVzdCByZXNwb25zZVxuICAgICAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgdGhpcy5nZW1pbmlQYWdlLiQkZXZhbChyZXNwb25zZVNlbGVjdG9yLCAoZWxlbWVudHMpID0+XG4gICAgICAgIGVsZW1lbnRzLm1hcCgoZWwpID0+IGVsLnRleHRDb250ZW50IHx8ICcnKVxuICAgICAgKTtcblxuICAgICAgLy8gUmV0dXJuIHRoZSBsYXN0IHJlc3BvbnNlXG4gICAgICByZXR1cm4gcmVzcG9uc2VzW3Jlc3BvbnNlcy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBleHRyYWN0IHJlc3BvbnNlOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIGNvbnRleHQgVVJMcyBpbiB0YWJzIGZvciBHZW1pbmkgdG8gc2VlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG9wZW5Db250ZXh0VGFicyh1cmxzOiBzdHJpbmdbXSk6IFByb21pc2U8UGFnZVtdPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYWdlczogUGFnZVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0Lm5ld1BhZ2UoKTtcbiAgICAgICAgYXdhaXQgcGFnZS5nb3RvKHVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJyB9KTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgY29uc29sZS5sb2coYFtHZW1pbmlCcm93c2VyXSBPcGVuZWQgY29udGV4dCB0YWI6ICR7dXJsfWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBvcGVuICR7dXJsfTpgLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBwcm9tcHQgdG8gR2VtaW5pIGFuZCBnZXQgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHByb21wdChyZXF1ZXN0OiBHZW1pbmlQcm9tcHRSZXF1ZXN0KTogUHJvbWlzZTxHZW1pbmlSZXNwb25zZT4ge1xuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICBjb25zdCBpbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBpbml0aWFsaXplIGJyb3dzZXInLFxuICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gT3BlbiBjb250ZXh0IHRhYnMgaWYgcHJvdmlkZWRcbiAgICAgIGxldCBjb250ZXh0UGFnZXM6IFBhZ2VbXSA9IFtdO1xuICAgICAgaWYgKHJlcXVlc3QuY29udGV4dFVybHMgJiYgcmVxdWVzdC5jb250ZXh0VXJscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnRleHRQYWdlcyA9IGF3YWl0IHRoaXMub3BlbkNvbnRleHRUYWJzKHJlcXVlc3QuY29udGV4dFVybHMpO1xuICAgICAgICAvLyBHaXZlIEdlbWluaSB0aW1lIHRvIHByb2Nlc3MgdGhlIHRhYnNcbiAgICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlIS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gT3BlbiBHZW1pbmkgcGFuZWxcbiAgICAgIGF3YWl0IHRoaXMub3BlbkdlbWluaVBhbmVsKCk7XG5cbiAgICAgIC8vIFR5cGUgdGhlIHByb21wdFxuICAgICAgY29uc3QgdHlwZWQgPSBhd2FpdCB0aGlzLnR5cGVQcm9tcHQocmVxdWVzdC5wcm9tcHQpO1xuICAgICAgaWYgKCF0eXBlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byB0eXBlIHByb21wdCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHRyYWN0IHJlc3BvbnNlXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXh0cmFjdFJlc3BvbnNlKHJlcXVlc3QudGltZW91dCB8fCAzMDAwMCk7XG5cbiAgICAgIC8vIENsb3NlIGNvbnRleHQgdGFic1xuICAgICAgZm9yIChjb25zdCBwYWdlIG9mIGNvbnRleHRQYWdlcykge1xuICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXNwb25zZTogJycsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBicm93c2VyXG4gICAqL1xuICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5icm93c2VyKSB7XG4gICAgICBhd2FpdCB0aGlzLmJyb3dzZXIuY2xvc2UoKTtcbiAgICAgIHRoaXMuYnJvd3NlciA9IG51bGw7XG4gICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgdGhpcy5nZW1pbmlQYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgY29uc29sZS5sb2coJ1tHZW1pbmlCcm93c2VyXSBCcm93c2VyIGNsb3NlZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBicm93c2VyIGlzIGluaXRpYWxpemVkXG4gICAqL1xuICBpc1JlYWR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzSW5pdGlhbGl6ZWQ7XG4gIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGdlbWluaUJyb3dzZXIgPSBuZXcgR2VtaW5pQnJvd3NlckF1dG9tYXRpb24oKTtcbiJdfQ==
