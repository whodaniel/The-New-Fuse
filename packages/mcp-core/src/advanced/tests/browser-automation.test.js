"use strict";
/**
 * Comprehensive Test Suite for AdvancedBrowserAutomation
 *
 * This file contains unit tests, integration tests, and performance tests
 * for the AdvancedBrowserAutomation component.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const AdvancedBrowserAutomation_1 = require("../AdvancedBrowserAutomation");
// Mock Chrome DevTools Protocol
const mockCDP = {
    connect: globals_1.jest.fn(),
    close: globals_1.jest.fn(),
    send: globals_1.jest.fn(),
    on: globals_1.jest.fn(),
    off: globals_1.jest.fn()
};
// Mock browser instance
const mockBrowser = {
    newPage: globals_1.jest.fn(),
    close: globals_1.jest.fn(),
    pages: globals_1.jest.fn(),
    version: globals_1.jest.fn(),
    userAgent: globals_1.jest.fn(),
    wsEndpoint: globals_1.jest.fn()
};
// Mock page instance
const mockPage = {
    goto: globals_1.jest.fn(),
    evaluate: globals_1.jest.fn(),
    screenshot: globals_1.jest.fn(),
    pdf: globals_1.jest.fn(),
    click: globals_1.jest.fn(),
    type: globals_1.jest.fn(),
    select: globals_1.jest.fn(),
    waitForSelector: globals_1.jest.fn(),
    waitForNavigation: globals_1.jest.fn(),
    setViewport: globals_1.jest.fn(),
    setUserAgent: globals_1.jest.fn(),
    setCookie: globals_1.jest.fn(),
    deleteCookie: globals_1.jest.fn(),
    close: globals_1.jest.fn(),
    url: globals_1.jest.fn(),
    title: globals_1.jest.fn(),
    content: globals_1.jest.fn(),
    $: globals_1.jest.fn(),
    $$: globals_1.jest.fn(),
    $eval: globals_1.jest.fn(),
    $$eval: globals_1.jest.fn(),
    on: globals_1.jest.fn(),
    off: globals_1.jest.fn(),
    removeListener: globals_1.jest.fn()
};
// Mock Puppeteer
globals_1.jest.mock('puppeteer', () => ({
    launch: globals_1.jest.fn(() => Promise.resolve(mockBrowser)),
    connect: globals_1.jest.fn(() => Promise.resolve(mockBrowser))
}));
(0, globals_1.describe)('AdvancedBrowserAutomation', () => {
    let automation;
    (0, globals_1.beforeEach)(() => {
        automation = new AdvancedBrowserAutomation_1.AdvancedBrowserAutomation();
        globals_1.jest.clearAllMocks();
        // Setup default mock implementations
        mockBrowser.newPage.mockResolvedValue(mockPage);
        mockBrowser.pages.mockResolvedValue([mockPage]);
        mockBrowser.version.mockResolvedValue('Chrome/91.0.4472.124');
        mockBrowser.userAgent.mockResolvedValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        mockBrowser.wsEndpoint.mockReturnValue('ws://localhost:9222/devtools/browser');
        mockPage.goto.mockResolvedValue(null);
        mockPage.url.mockReturnValue('https://example.com');
        mockPage.title.mockResolvedValue('Example Page');
        mockPage.content.mockResolvedValue('<html><body>Test content</body></html>');
        mockPage.screenshot.mockResolvedValue(Buffer.from('fake-screenshot'));
        mockPage.pdf.mockResolvedValue(Buffer.from('fake-pdf'));
        mockPage.$.mockResolvedValue({ click: globals_1.jest.fn(), type: globals_1.jest.fn() });
        mockPage.$$.mockResolvedValue([{ click: globals_1.jest.fn() }, { click: globals_1.jest.fn() }]);
        mockPage.$eval.mockResolvedValue('element text');
        mockPage.$$eval.mockResolvedValue(['text1', 'text2']);
        mockPage.evaluate.mockResolvedValue('evaluation result');
        mockPage.waitForSelector.mockResolvedValue({ click: globals_1.jest.fn() });
        mockPage.waitForNavigation.mockResolvedValue(null);
    });
    (0, globals_1.afterEach)(async () => {
        try {
            await automation.cleanup();
        }
        catch (error) {
            // Ignore cleanup errors in tests
        }
    });
    (0, globals_1.describe)('Browser Management', () => {
        (0, globals_1.it)('should launch browser successfully', async () => {
            const result = await automation.launchBrowser({
                headless: true,
                viewport: { width: 1920, height: 1080 }
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.browserId).toBeDefined();
            (0, globals_1.expect)(result.endpoint).toBe('ws://localhost:9222/devtools/browser');
        });
        (0, globals_1.it)('should handle browser launch failure', async () => {
            const puppeteer = require('puppeteer');
            puppeteer.launch.mockRejectedValueOnce(new Error('Failed to launch browser'));
            const result = await automation.launchBrowser({
                headless: true
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Failed to launch browser');
        });
        (0, globals_1.it)('should connect to existing browser', async () => {
            const result = await automation.connectToBrowser('ws://localhost:9222/devtools/browser');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.browserId).toBeDefined();
        });
        (0, globals_1.it)('should manage multiple browser instances', async () => {
            const browser1 = await automation.launchBrowser({ headless: true });
            const browser2 = await automation.launchBrowser({ headless: true });
            (0, globals_1.expect)(browser1.success).toBe(true);
            (0, globals_1.expect)(browser2.success).toBe(true);
            (0, globals_1.expect)(browser1.browserId).not.toBe(browser2.browserId);
            const browsers = await automation.listBrowsers();
            (0, globals_1.expect)(browsers.length).toBe(2);
        });
        (0, globals_1.it)('should close browser properly', async () => {
            const launchResult = await automation.launchBrowser({ headless: true });
            (0, globals_1.expect)(launchResult.success).toBe(true);
            const closeResult = await automation.closeBrowser(launchResult.browserId);
            (0, globals_1.expect)(closeResult.success).toBe(true);
            mockBrowser.close.mockResolvedValueOnce(undefined);
        });
    });
    (0, globals_1.describe)('Page Operations', () => {
        let browserId;
        (0, globals_1.beforeEach)(async () => {
            const result = await automation.launchBrowser({ headless: true });
            browserId = result.browserId;
        });
        (0, globals_1.it)('should create new page', async () => {
            const result = await automation.createPage(browserId);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.pageId).toBeDefined();
            (0, globals_1.expect)(mockBrowser.newPage).toHaveBeenCalled();
        });
        (0, globals_1.it)('should navigate to URL', async () => {
            const pageResult = await automation.createPage(browserId);
            const pageId = pageResult.pageId;
            const navResult = await automation.navigateToUrl(pageId, 'https://example.com');
            (0, globals_1.expect)(navResult.success).toBe(true);
            (0, globals_1.expect)(mockPage.goto).toHaveBeenCalledWith('https://example.com', globals_1.expect.any(Object));
        });
        (0, globals_1.it)('should handle navigation timeout', async () => {
            mockPage.goto.mockRejectedValueOnce(new Error('Navigation timeout'));
            const pageResult = await automation.createPage(browserId);
            const navResult = await automation.navigateToUrl(pageResult.pageId, 'https://slow-site.com');
            (0, globals_1.expect)(navResult.success).toBe(false);
            (0, globals_1.expect)(navResult.error).toContain('Navigation timeout');
        });
        (0, globals_1.it)('should take screenshot', async () => {
            const pageResult = await automation.createPage(browserId);
            const pageId = pageResult.pageId;
            const screenshotResult = await automation.takeScreenshot(pageId, {
                format: 'png',
                fullPage: true
            });
            (0, globals_1.expect)(screenshotResult.success).toBe(true);
            (0, globals_1.expect)(screenshotResult.data).toBeDefined();
            (0, globals_1.expect)(mockPage.screenshot).toHaveBeenCalledWith({
                format: 'png',
                fullPage: true
            });
        });
        (0, globals_1.it)('should generate PDF', async () => {
            const pageResult = await automation.createPage(browserId);
            const pageId = pageResult.pageId;
            const pdfResult = await automation.generatePdf(pageId, {
                format: 'A4',
                printBackground: true
            });
            (0, globals_1.expect)(pdfResult.success).toBe(true);
            (0, globals_1.expect)(pdfResult.data).toBeDefined();
            (0, globals_1.expect)(mockPage.pdf).toHaveBeenCalledWith({
                format: 'A4',
                printBackground: true
            });
        });
        (0, globals_1.it)('should extract page content', async () => {
            const pageResult = await automation.createPage(browserId);
            const pageId = pageResult.pageId;
            const contentResult = await automation.extractContent(pageId, {
                includeHtml: true,
                includeText: true,
                includeMetadata: true
            });
            (0, globals_1.expect)(contentResult.success).toBe(true);
            (0, globals_1.expect)(contentResult.data).toBeDefined();
            (0, globals_1.expect)(contentResult.data?.html).toBeDefined();
            (0, globals_1.expect)(contentResult.data?.metadata).toBeDefined();
        });
    });
    (0, globals_1.describe)('Element Interactions', () => {
        let browserId;
        let pageId;
        (0, globals_1.beforeEach)(async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            browserId = browserResult.browserId;
            const pageResult = await automation.createPage(browserId);
            pageId = pageResult.pageId;
        });
        (0, globals_1.it)('should click element', async () => {
            const result = await automation.clickElement(pageId, '#submit-button');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPage.click).toHaveBeenCalledWith('#submit-button');
        });
        (0, globals_1.it)('should type text into input', async () => {
            const result = await automation.typeText(pageId, '#username', 'testuser');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPage.type).toHaveBeenCalledWith('#username', 'testuser');
        });
        (0, globals_1.it)('should select option from dropdown', async () => {
            const result = await automation.selectOption(pageId, '#country', 'US');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPage.select).toHaveBeenCalledWith('#country', 'US');
        });
        (0, globals_1.it)('should wait for element to appear', async () => {
            const result = await automation.waitForElement(pageId, '.loading-complete', 5000);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPage.waitForSelector).toHaveBeenCalledWith('.loading-complete', {
                timeout: 5000
            });
        });
        (0, globals_1.it)('should handle element not found', async () => {
            mockPage.waitForSelector.mockRejectedValueOnce(new Error('Element not found'));
            const result = await automation.waitForElement(pageId, '.non-existent', 1000);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Element not found');
        });
        (0, globals_1.it)('should extract element text', async () => {
            const result = await automation.extractElementText(pageId, 'h1');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toBe('element text');
            (0, globals_1.expect)(mockPage.$eval).toHaveBeenCalledWith('h1', globals_1.expect.any(Function));
        });
        (0, globals_1.it)('should extract multiple elements text', async () => {
            const result = await automation.extractElementsText(pageId, '.item');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toEqual(['text1', 'text2']);
            (0, globals_1.expect)(mockPage.$$eval).toHaveBeenCalledWith('.item', globals_1.expect.any(Function));
        });
    });
    (0, globals_1.describe)('Intelligent Element Detection', () => {
        let browserId;
        let pageId;
        (0, globals_1.beforeEach)(async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            browserId = browserResult.browserId;
            const pageResult = await automation.createPage(browserId);
            pageId = pageResult.pageId;
        });
        (0, globals_1.it)('should detect form elements', async () => {
            mockPage.evaluate.mockResolvedValueOnce([
                { type: 'input', selector: '#username', attributes: { type: 'text', name: 'username' } },
                { type: 'input', selector: '#password', attributes: { type: 'password', name: 'password' } },
                { type: 'button', selector: '#submit', attributes: { type: 'submit' } }
            ]);
            const result = await automation.detectElements(pageId, {
                types: ['form'],
                includeHidden: false
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.elements).toHaveLength(3);
            (0, globals_1.expect)(result.elements[0].type).toBe('input');
        });
        (0, globals_1.it)('should detect clickable elements', async () => {
            mockPage.evaluate.mockResolvedValueOnce([
                { type: 'button', selector: '.btn-primary', attributes: { class: 'btn btn-primary' } },
                { type: 'link', selector: 'a[href="/about"]', attributes: { href: '/about' } }
            ]);
            const result = await automation.detectElements(pageId, {
                types: ['clickable'],
                includeHidden: false
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.elements).toHaveLength(2);
        });
        (0, globals_1.it)('should analyze page structure', async () => {
            mockPage.evaluate.mockResolvedValueOnce({
                headings: [
                    { level: 1, text: 'Main Title', selector: 'h1' },
                    { level: 2, text: 'Subtitle', selector: 'h2' }
                ],
                links: [
                    { text: 'Home', href: '/', selector: 'a[href="/"]' },
                    { text: 'About', href: '/about', selector: 'a[href="/about"]' }
                ],
                forms: [
                    { action: '/login', method: 'POST', selector: 'form#login-form' }
                ],
                images: [
                    { src: '/logo.png', alt: 'Company Logo', selector: 'img[src="/logo.png"]' }
                ]
            });
            const result = await automation.analyzePageStructure(pageId);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.structure).toBeDefined();
            (0, globals_1.expect)(result.structure?.headings).toHaveLength(2);
            (0, globals_1.expect)(result.structure?.links).toHaveLength(2);
            (0, globals_1.expect)(result.structure?.forms).toHaveLength(1);
            (0, globals_1.expect)(result.structure?.images).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('Automation Scripts', () => {
        let browserId;
        let pageId;
        (0, globals_1.beforeEach)(async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            browserId = browserResult.browserId;
            const pageResult = await automation.createPage(browserId);
            pageId = pageResult.pageId;
        });
        (0, globals_1.it)('should execute simple automation script', async () => {
            const script = {
                id: 'login-script',
                name: 'Login Automation',
                steps: [
                    { action: 'navigate', target: 'https://example.com/login' },
                    { action: 'type', target: '#username', value: 'testuser' },
                    { action: 'type', target: '#password', value: 'testpass' },
                    { action: 'click', target: '#login-button' },
                    { action: 'waitForNavigation' }
                ]
            };
            const result = await automation.executeScript(pageId, script);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.results).toHaveLength(5);
            (0, globals_1.expect)(mockPage.goto).toHaveBeenCalledWith('https://example.com/login');
            (0, globals_1.expect)(mockPage.type).toHaveBeenCalledWith('#username', 'testuser');
            (0, globals_1.expect)(mockPage.type).toHaveBeenCalledWith('#password', 'testpass');
            (0, globals_1.expect)(mockPage.click).toHaveBeenCalledWith('#login-button');
            (0, globals_1.expect)(mockPage.waitForNavigation).toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle script execution errors', async () => {
            mockPage.click.mockRejectedValueOnce(new Error('Element not found'));
            const script = {
                id: 'failing-script',
                name: 'Failing Script',
                steps: [
                    { action: 'click', target: '#non-existent-button' }
                ]
            };
            const result = await automation.executeScript(pageId, script);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Element not found');
        });
        (0, globals_1.it)('should execute conditional script steps', async () => {
            mockPage.$.mockResolvedValueOnce(null); // Element not found
            mockPage.$.mockResolvedValueOnce({ click: globals_1.jest.fn() }); // Element found
            const script = {
                id: 'conditional-script',
                name: 'Conditional Script',
                steps: [
                    {
                        action: 'conditional',
                        condition: { type: 'elementExists', selector: '#popup' },
                        thenSteps: [{ action: 'click', target: '#close-popup' }],
                        elseSteps: [{ action: 'click', target: '#main-button' }]
                    }
                ]
            };
            const result = await automation.executeScript(pageId, script);
            (0, globals_1.expect)(result.success).toBe(true);
            // Should execute else steps since popup doesn't exist
        });
        (0, globals_1.it)('should execute loop script steps', async () => {
            const script = {
                id: 'loop-script',
                name: 'Loop Script',
                steps: [
                    {
                        action: 'loop',
                        iterations: 3,
                        steps: [
                            { action: 'click', target: '.next-button' },
                            { action: 'wait', duration: 1000 }
                        ]
                    }
                ]
            };
            const result = await automation.executeScript(pageId, script);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockPage.click).toHaveBeenCalledTimes(3);
        });
    });
    (0, globals_1.describe)('Multi-Browser Coordination', () => {
        (0, globals_1.it)('should coordinate actions across multiple browsers', async () => {
            const browser1 = await automation.launchBrowser({ headless: true });
            const browser2 = await automation.launchBrowser({ headless: true });
            const page1 = await automation.createPage(browser1.browserId);
            const page2 = await automation.createPage(browser2.browserId);
            const coordinationScript = {
                id: 'multi-browser-test',
                name: 'Multi-Browser Coordination',
                browsers: [
                    {
                        browserId: browser1.browserId,
                        pageId: page1.pageId,
                        steps: [
                            { action: 'navigate', target: 'https://sender.com' },
                            { action: 'click', target: '#send-message' }
                        ]
                    },
                    {
                        browserId: browser2.browserId,
                        pageId: page2.pageId,
                        steps: [
                            { action: 'navigate', target: 'https://receiver.com' },
                            { action: 'waitForElement', target: '.new-message' }
                        ]
                    }
                ]
            };
            const result = await automation.executeMultiBrowserScript(coordinationScript);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.results).toHaveLength(2);
        });
        (0, globals_1.it)('should synchronize browser actions', async () => {
            const browser1 = await automation.launchBrowser({ headless: true });
            const browser2 = await automation.launchBrowser({ headless: true });
            const syncResult = await automation.synchronizeBrowsers([
                browser1.browserId,
                browser2.browserId
            ], {
                action: 'navigate',
                target: 'https://example.com',
                waitForComplete: true
            });
            (0, globals_1.expect)(syncResult.success).toBe(true);
            (0, globals_1.expect)(syncResult.results).toHaveLength(2);
        });
    });
    (0, globals_1.describe)('Performance Monitoring', () => {
        let browserId;
        let pageId;
        (0, globals_1.beforeEach)(async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            browserId = browserResult.browserId;
            const pageResult = await automation.createPage(browserId);
            pageId = pageResult.pageId;
        });
        (0, globals_1.it)('should collect performance metrics', async () => {
            mockPage.evaluate.mockResolvedValueOnce({
                loadTime: 1250,
                domContentLoaded: 800,
                firstPaint: 600,
                firstContentfulPaint: 750,
                largestContentfulPaint: 1100,
                cumulativeLayoutShift: 0.05,
                firstInputDelay: 50
            });
            const result = await automation.collectPerformanceMetrics(pageId);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.metrics).toBeDefined();
            (0, globals_1.expect)(result.metrics?.loadTime).toBe(1250);
            (0, globals_1.expect)(result.metrics?.firstContentfulPaint).toBe(750);
        });
        (0, globals_1.it)('should monitor resource loading', async () => {
            mockPage.evaluate.mockResolvedValueOnce([
                { url: 'https://example.com/style.css', type: 'stylesheet', size: 15000, loadTime: 200 },
                { url: 'https://example.com/script.js', type: 'script', size: 25000, loadTime: 300 },
                { url: 'https://example.com/image.jpg', type: 'image', size: 50000, loadTime: 500 }
            ]);
            const result = await automation.monitorResourceLoading(pageId);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.resources).toHaveLength(3);
            (0, globals_1.expect)(result.resources[0].type).toBe('stylesheet');
        });
        (0, globals_1.it)('should analyze page accessibility', async () => {
            mockPage.evaluate.mockResolvedValueOnce({
                score: 85,
                issues: [
                    { type: 'missing-alt', severity: 'warning', element: 'img[src="/photo.jpg"]' },
                    { type: 'low-contrast', severity: 'error', element: '.text-light' }
                ],
                recommendations: [
                    'Add alt attributes to all images',
                    'Improve color contrast for better readability'
                ]
            });
            const result = await automation.analyzeAccessibility(pageId);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.analysis).toBeDefined();
            (0, globals_1.expect)(result.analysis?.score).toBe(85);
            (0, globals_1.expect)(result.analysis?.issues).toHaveLength(2);
        });
    });
    (0, globals_1.describe)('Error Handling and Recovery', () => {
        let browserId;
        let pageId;
        (0, globals_1.beforeEach)(async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            browserId = browserResult.browserId;
            const pageResult = await automation.createPage(browserId);
            pageId = pageResult.pageId;
        });
        (0, globals_1.it)('should handle page crashes gracefully', async () => {
            // Simulate page crash
            mockPage.goto.mockRejectedValueOnce(new Error('Page crashed'));
            const result = await automation.navigateToUrl(pageId, 'https://problematic-site.com');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Page crashed');
        });
        (0, globals_1.it)('should retry failed operations', async () => {
            let attemptCount = 0;
            mockPage.click.mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    return Promise.reject(new Error('Temporary failure'));
                }
                return Promise.resolve();
            });
            const result = await automation.clickElement(pageId, '#flaky-button', {
                retries: 3,
                retryDelay: 100
            });
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(attemptCount).toBe(3);
        });
        (0, globals_1.it)('should recover from browser disconnection', async () => {
            // Simulate browser disconnection
            mockBrowser.close.mockRejectedValueOnce(new Error('Browser disconnected'));
            const result = await automation.closeBrowser(browserId);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Browser disconnected');
            // Should be able to launch new browser
            const newBrowserResult = await automation.launchBrowser({ headless: true });
            (0, globals_1.expect)(newBrowserResult.success).toBe(true);
        });
        (0, globals_1.it)('should handle memory leaks', async () => {
            // Create many pages to simulate memory pressure
            const pages = [];
            for (let i = 0; i < 50; i++) {
                const pageResult = await automation.createPage(browserId);
                if (pageResult.success) {
                    pages.push(pageResult.pageId);
                }
            }
            (0, globals_1.expect)(pages.length).toBeGreaterThan(0);
            // Cleanup should handle all pages
            const cleanupResult = await automation.cleanup();
            (0, globals_1.expect)(cleanupResult.success).toBe(true);
        });
    });
    (0, globals_1.describe)('Load Testing', () => {
        (0, globals_1.it)('should handle concurrent page operations', async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            const browserId = browserResult.browserId;
            // Create multiple pages concurrently
            const pagePromises = Array.from({ length: 10 }, () => automation.createPage(browserId));
            const pageResults = await Promise.all(pagePromises);
            const successfulPages = pageResults.filter(r => r.success);
            (0, globals_1.expect)(successfulPages.length).toBe(10);
            // Navigate all pages concurrently
            const navPromises = successfulPages.map(page => automation.navigateToUrl(page.pageId, 'https://example.com'));
            const navResults = await Promise.all(navPromises);
            const successfulNavs = navResults.filter(r => r.success);
            (0, globals_1.expect)(successfulNavs.length).toBe(10);
        });
        (0, globals_1.it)('should maintain performance under load', async () => {
            const browserResult = await automation.launchBrowser({ headless: true });
            const browserId = browserResult.browserId;
            const operationCount = 100;
            const operations = [];
            for (let i = 0; i < operationCount; i++) {
                operations.push(async () => {
                    const pageResult = await automation.createPage(browserId);
                    if (pageResult.success) {
                        await automation.navigateToUrl(pageResult.pageId, `https://example${i}.com`);
                        await automation.takeScreenshot(pageResult.pageId, { format: 'png' });
                        return true;
                    }
                    return false;
                });
            }
            const startTime = Date.now();
            const results = await Promise.all(operations.map(op => op()));
            const endTime = Date.now();
            const successCount = results.filter(Boolean).length;
            const totalTime = endTime - startTime;
            const averageTime = totalTime / operationCount;
            (0, globals_1.expect)(successCount).toBeGreaterThan(operationCount * 0.8); // At least 80% success
            (0, globals_1.expect)(averageTime).toBeLessThan(1000); // Average operation under 1 second
            console.log(`Load test results: ${successCount}/${operationCount} successful, ${averageTime.toFixed(2)}ms average`);
        });
    });
});
//# sourceMappingURL=browser-automation.test.js.map