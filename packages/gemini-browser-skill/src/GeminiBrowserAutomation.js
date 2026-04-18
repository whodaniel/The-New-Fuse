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
import { chromium } from 'playwright';
export class GeminiBrowserAutomation {
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
            this.browser = await chromium.launch({
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
        }
        catch (error) {
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
        }
        catch (error) {
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
            const inputSelector = 'textarea[placeholder*="Ask"], textarea[aria-label*="chat"], .chat-input, [contenteditable="true"]';
            await this.geminiPage.waitForSelector(inputSelector, { timeout: 5000 });
            await this.geminiPage.click(inputSelector);
            await this.geminiPage.fill(inputSelector, prompt);
            // Press Enter to send
            await this.geminiPage.keyboard.press('Enter');
            return true;
        }
        catch (error) {
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
            const responses = await this.geminiPage.$$eval(responseSelector, (elements) => elements.map((el) => el.textContent || ''));
            // Return the last response
            return responses[responses.length - 1] || '';
        }
        catch (error) {
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
            }
            catch (error) {
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
        }
        catch (error) {
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
// Export singleton instance
export const geminiBrowser = new GeminiBrowserAutomation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VtaW5pQnJvd3NlckF1dG9tYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHZW1pbmlCcm93c2VyQXV0b21hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxPQUFPLEVBQWlDLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQztBQWVyRSxNQUFNLE9BQU8sdUJBQXVCO0lBQXBDO1FBQ1UsWUFBTyxHQUFtQixJQUFJLENBQUM7UUFDL0IsWUFBTyxHQUEwQixJQUFJLENBQUM7UUFDdEMsZUFBVSxHQUFnQixJQUFJLENBQUM7UUFDL0Isa0JBQWEsR0FBRyxLQUFLLENBQUM7SUE2TmhDLENBQUM7SUEzTkM7O09BRUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNkLElBQUksQ0FBQztZQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsaURBQWlELENBQUMsQ0FBQztZQUUvRCxxREFBcUQ7WUFDckQsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ25DLFFBQVEsRUFBRSxLQUFLLEVBQUUscUNBQXFDO2dCQUN0RCxPQUFPLEVBQUUsUUFBUSxFQUFFLHNDQUFzQztnQkFDekQsSUFBSSxFQUFFO29CQUNKLGdGQUFnRjtvQkFDaEYsZ0JBQWdCO29CQUNoQiw0QkFBNEI7aUJBQzdCO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO2dCQUMzQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7YUFDdkMsQ0FBQyxDQUFDO1lBRUgsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRS9DLGlEQUFpRDtZQUNqRCxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMs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QTRCO0FBQzVCLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxJQUFJLHVCQUF1QixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEdlbWluaSBCcm93c2VyIEF1dG9tYXRpb24gU2VydmljZVxuICpcbiAqIEF1dG9tYXRlcyBDaHJvbWUncyBidWlsdC1pbiBHZW1pbmkgQUkgZm9yIGZyZWUgY29tcHV0ZSBkZWxlZ2F0aW9uXG4gKiBBbGxvd3MgVE5GIGFnZW50cyB0byBsZXZlcmFnZSBHZW1pbmkncyB0YWItYXdhcmVuZXNzIGFuZCBpbnRlcm5ldCBhY2Nlc3NcbiAqXG4gKiBLZXkgRmVhdHVyZXM6XG4gKiAtIE9wZW5zIENocm9tZSB3aXRoIEdlbWluaSBzaWRlIHBhbmVsXG4gKiAtIFR5cGVzIHByb21wdHMgcHJvZ3JhbW1hdGljYWxseVxuICogLSBFeHRyYWN0cyByZXNwb25zZXNcbiAqIC0gTGV2ZXJhZ2VzIEdlbWluaSdzIGFiaWxpdHkgdG8gc2VlIHRhYiBjb250ZW50c1xuICogLSBGcmVlIGNvbXB1dGUgZm9yIG5vbi1jcml0aWNhbCB0YXNrc1xuICovXG5cbmltcG9ydCB7IEJyb3dzZXIsIEJyb3dzZXJDb250ZXh0LCBQYWdlLCBjaHJvbWl1bSB9IGZyb20gJ3BsYXl3cmlnaHQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdlbWluaVByb21wdFJlcXVlc3Qge1xuICBwcm9tcHQ6IHN0cmluZztcbiAgY29udGV4dFVybHM/OiBzdHJpbmdbXTsgLy8gVVJMcyB0byBvcGVuIGluIHRhYnMgZm9yIEdlbWluaSB0byBzZWVcbiAgdGltZW91dD86IG51bWJlcjsgLy8gUmVzcG9uc2UgdGltZW91dCBpbiBtc1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdlbWluaVJlc3BvbnNlIHtcbiAgcmVzcG9uc2U6IHN0cmluZztcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgR2VtaW5pQnJvd3NlckF1dG9tYXRpb24ge1xuICBwcml2YXRlIGJyb3dzZXI6IEJyb3dzZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb250ZXh0OiBCcm93c2VyQ29udGV4dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGdlbWluaVBhZ2U6IFBhZ2UgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBpc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgQ2hyb21lIHdpdGggR2VtaW5pIGVuYWJsZWRcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbR2VtaW5pQnJvd3Nlcl0gTGF1bmNoaW5nIENocm9tZSB3aXRoIEdlbWluaS4uLicpO1xuXG4gICAgICAvLyBMYXVuY2ggQ2hyb21lIHdpdGggc3BlY2lmaWMgZmxhZ3MgdG8gZW5hYmxlIEdlbWluaVxuICAgICAgdGhpcy5icm93c2VyID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoKHtcbiAgICAgICAgaGVhZGxlc3M6IGZhbHNlLCAvLyBHZW1pbmkgVUkgcmVxdWlyZXMgdmlzaWJsZSBicm93c2VyXG4gICAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLCAvLyBVc2UgaW5zdGFsbGVkIENocm9tZSAobm90IENocm9taXVtKVxuICAgICAgICBhcmdzOiBbXG4gICAgICAgICAgJy0tZW5hYmxlLWZlYXR1cmVzPUdlbWluaSxPcHRpbWl6YXRpb25HdWlkZU9uRGV2aWNlTW9kZWwsUHJvbXB0QVBJRm9yR2VtaW5pTmFubycsXG4gICAgICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICBdLFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IHRoaXMuYnJvd3Nlci5uZXdDb250ZXh0KHtcbiAgICAgICAgdmlld3BvcnQ6IHsgd2lkdGg6IDEyODAsIGhlaWdodDogNzIwIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gT3BlbiBhIG5ldyBwYWdlXG4gICAgICB0aGlzLmdlbWluaVBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byBhIHBhZ2Ugd2hlcmUgd2UgY2FuIHRyaWdnZXIgR2VtaW5pXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2UuZ290bygnaHR0cHM6Ly9nZW1pbmkuZ29vZ2xlLmNvbScpO1xuXG4gICAgICBjb25zb2xlLmxvZygnW0dlbWluaUJyb3dzZXJdIENocm9tZSBsYXVuY2hlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBpbml0aWFsaXplOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbiBHZW1pbmkgc2lkZSBwYW5lbCB1c2luZyBrZXlib2FyZCBzaG9ydGN1dFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBvcGVuR2VtaW5pUGFuZWwoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCF0aGlzLmdlbWluaVBhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gVHJ5IEN0cmwrRyAob3IgQ21kK0cgb24gTWFjKSB0byBvcGVuIEdlbWluaSBzaWRlIHBhbmVsXG4gICAgICBjb25zdCBpc01hYyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuICAgICAgY29uc3QgbW9kaWZpZXIgPSBpc01hYyA/ICdNZXRhJyA6ICdDb250cm9sJztcblxuICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlLmtleWJvYXJkLnByZXNzKGAke21vZGlmaWVyfStLZXlHYCk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHNpZGUgcGFuZWwgdG8gYXBwZWFyXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbR2VtaW5pQnJvd3Nlcl0gRmFpbGVkIHRvIG9wZW4gR2VtaW5pIHBhbmVsOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBhIHByb21wdCBpbnRvIEdlbWluaSdzIGlucHV0IGZpZWxkXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHR5cGVQcm9tcHQocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMuZ2VtaW5pUGFnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBMb29rIGZvciBHZW1pbmkncyBjaGF0IGlucHV0XG4gICAgICAvLyBUaGlzIHNlbGVjdG9yIG1heSBuZWVkIGFkanVzdG1lbnQgYmFzZWQgb24gR2VtaW5pJ3MgYWN0dWFsIFVJXG4gICAgICBjb25zdCBpbnB1dFNlbGVjdG9yID1cbiAgICAgICAgJ3RleHRhcmVhW3BsYWNlaG9sZGVyKj1cIkFza1wiXSwgdGV4dGFyZWFbYXJpYS1sYWJlbCo9XCJjaGF0XCJdLCAuY2hhdC1pbnB1dCwgW2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nO1xuXG4gICAgICBhd2FpdCB0aGlzLmdlbWluaVBhZ2Uud2FpdEZvclNlbGVjdG9yKGlucHV0U2VsZWN0b3IsIHsgdGltZW91dDogNTAwMCB9KTtcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5jbGljayhpbnB1dFNlbGVjdG9yKTtcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5maWxsKGlucHV0U2VsZWN0b3IsIHByb21wdCk7XG5cbiAgICAgIC8vIFByZXNzIEVudGVyIHRvIHNlbmRcbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS5rZXlib2FyZC5wcmVzcygnRW50ZXInKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tHZW1pbmlCcm93c2VyXSBGYWlsZWQgdG8gdHlwZSBwcm9tcHQ6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IEdlbWluaSdzIHJlc3BvbnNlIGZyb20gdGhlIFVJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4dHJhY3RSZXNwb25zZSh0aW1lb3V0OiBudW1iZXIgPSAzMDAwMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLmdlbWluaVBhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gV2FpdCBmb3IgcmVzcG9uc2UgdG8gYXBwZWFyXG4gICAgICAvLyBUaGlzIHNlbGVjdG9yIG1heSBuZWVkIGFkanVzdG1lbnQgYmFzZWQgb24gR2VtaW5pJ3MgYWN0dWFsIFVJXG4gICAgICBjb25zdCByZXNwb25zZVNlbGVjdG9yID0gJy5tb2RlbC1yZXNwb25zZSwgLm1lc3NhZ2UtY29udGVudCwgW2RhdGEtbWVzc2FnZS1hdXRob3I9XCJtb2RlbFwiXSc7XG5cbiAgICAgIGF3YWl0IHRoaXMuZ2VtaW5pUGFnZS53YWl0Rm9yU2VsZWN0b3IocmVzcG9uc2VTZWxlY3RvciwgeyB0aW1lb3V0IH0pO1xuXG4gICAgICAvLyBHZXQgdGhlIGxhdGVzdCByZXNwb25zZVxuICAgICAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgdGhpcy5nZW1pbmlQYWdlLiQkZXZhbChyZXNwb25zZVNlbGVjdG9yLCAoZWxlbWVudHMpID0+XG4gICAgICAgIGVsZW1lbnRzLm1hcCgoZWwpID0+IGVsLnRleHRDb250ZW50IHx8ICcnKVxuICAgICAgKTtcblxuICAgICAgLy8gUmV0dXJuIHRoZSBsYXN0IHJlc3BvbnNlXG4gICAgICByZXR1cm4gcmVzcG9uc2VzW3Jlc3BvbnNlcy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBleHRyYWN0IHJlc3BvbnNlOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIGNvbnRleHQgVVJMcyBpbiB0YWJzIGZvciBHZW1pbmkgdG8gc2VlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG9wZW5Db250ZXh0VGFicyh1cmxzOiBzdHJpbmdbXSk6IFByb21pc2U8UGFnZVtdPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYWdlczogUGFnZVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0Lm5ld1BhZ2UoKTtcbiAgICAgICAgYXdhaXQgcGFnZS5nb3RvKHVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJyB9KTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgY29uc29sZS5sb2coYFtHZW1pbmlCcm93c2VyXSBPcGVuZWQgY29udGV4dCB0YWI6ICR7dXJsfWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW0dlbWluaUJyb3dzZXJdIEZhaWxlZCB0byBvcGVuICR7dXJsfTpgLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBwcm9tcHQgdG8gR2VtaW5pIGFuZCBnZXQgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHByb21wdChyZXF1ZXN0OiBHZW1pbmlQcm9tcHRSZXF1ZXN0KTogUHJvbWlzZTxHZW1pbmlSZXNwb25zZT4ge1xuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICBjb25zdCBpbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBpbml0aWFsaXplIGJyb3dzZXInLFxuICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gT3BlbiBjb250ZXh0IHRhYnMgaWYgcHJvdmlkZWRcbiAgICAgIGxldCBjb250ZXh0UGFnZXM6IFBhZ2VbXSA9IFtdO1xuICAgICAgaWYgKHJlcXVlc3QuY29udGV4dFVybHMgJiYgcmVxdWVzdC5jb250ZXh0VXJscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnRleHRQYWdlcyA9IGF3YWl0IHRoaXMub3BlbkNvbnRleHRUYWJzKHJlcXVlc3QuY29udGV4dFVybHMpO1xuICAgICAgICAvLyBHaXZlIEdlbWluaSB0aW1lIHRvIHByb2Nlc3MgdGhlIHRhYnNcbiAgICAgICAgYXdhaXQgdGhpcy5nZW1pbmlQYWdlIS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gT3BlbiBHZW1pbmkgcGFuZWxcbiAgICAgIGF3YWl0IHRoaXMub3BlbkdlbWluaVBhbmVsKCk7XG5cbiAgICAgIC8vIFR5cGUgdGhlIHByb21wdFxuICAgICAgY29uc3QgdHlwZWQgPSBhd2FpdCB0aGlzLnR5cGVQcm9tcHQocmVxdWVzdC5wcm9tcHQpO1xuICAgICAgaWYgKCF0eXBlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byB0eXBlIHByb21wdCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHRyYWN0IHJlc3BvbnNlXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXh0cmFjdFJlc3BvbnNlKHJlcXVlc3QudGltZW91dCB8fCAzMDAwMCk7XG5cbiAgICAgIC8vIENsb3NlIGNvbnRleHQgdGFic1xuICAgICAgZm9yIChjb25zdCBwYWdlIG9mIGNvbnRleHRQYWdlcykge1xuICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXNwb25zZTogJycsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBicm93c2VyXG4gICAqL1xuICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5icm93c2VyKSB7XG4gICAgICBhd2FpdCB0aGlzLmJyb3dzZXIuY2xvc2UoKTtcbiAgICAgIHRoaXMuYnJvd3NlciA9IG51bGw7XG4gICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgICAgdGhpcy5nZW1pbmlQYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgY29uc29sZS5sb2coJ1tHZW1pbmlCcm93c2VyXSBCcm93c2VyIGNsb3NlZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBicm93c2VyIGlzIGluaXRpYWxpemVkXG4gICAqL1xuICBpc1JlYWR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzSW5pdGlhbGl6ZWQ7XG4gIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGdlbWluaUJyb3dzZXIgPSBuZXcgR2VtaW5pQnJvd3NlckF1dG9tYXRpb24oKTtcbiJdfQ==