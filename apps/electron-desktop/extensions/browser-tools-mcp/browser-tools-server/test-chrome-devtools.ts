import { connectToHeadlessBrowser, configurePuppeteerService, scheduleBrowserCleanup } from './puppeteer-service.js';
import { Browser, Page } from 'puppeteer-core';

/**
 * Comprehensive Chrome DevTools Test Suite
 * Tests all major functionality of the browser-tools-mcp Chrome DevTools integration
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class ChromeDevToolsTestSuite {
  private results: TestResult[] = [];
  private browser: Browser | null = null;
  private page: Page | null = null;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Chrome DevTools Test Suite...\n');
    
    try {
      // Test 1: Basic Browser Connection
      await this.testBrowserConnection();
      
      // Test 2: DevTools Protocol Features
      await this.testDevToolsProtocol();
      
      // Test 3: Performance Monitoring
      await this.testPerformanceMonitoring();
      
      // Test 4: Network Interception
      await this.testNetworkInterception();
      
      // Test 5: Console API
      await this.testConsoleAPI();
      
      // Test 6: Resource Blocking
      await this.testResourceBlocking();
      
      // Test 7: Browser Cleanup
      await this.testBrowserCleanup();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`🧪 Running: ${testName}`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name: testName, passed: true, duration });
      console.log(`✅ ${testName} - PASSED (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name: testName, passed: false, error: errorMessage, duration });
      console.log(`❌ ${testName} - FAILED: ${errorMessage} (${duration}ms)\n`);
    }
  }

  private async testBrowserConnection(): Promise<void> {
    await this.runTest('Browser Connection & Launch', async () => {
      // Configure the service with test settings
      configurePuppeteerService({
        connectionTimeout: 15000,
        maxRetries: 2,
        debugPorts: [9222, 9223, 9224]
      });

      // Test browser connection
      const result = await connectToHeadlessBrowser('https://example.com', {
        viewport: { width: 1280, height: 720 },
        waitForTimeout: 3000
      });

      this.browser = result.browser;
      this.page = result.page;

      // Verify browser is connected
      if (!this.browser || !this.page) {
        throw new Error('Failed to establish browser connection');
      }

      // Verify page loaded
      const title = await this.page.title();
      if (!title) {
        throw new Error('Page failed to load properly');
      }

      console.log(`   📄 Page loaded: ${title}`);
      console.log(`   🌐 Browser port: ${result.port}`);
    });
  }

  private async testDevToolsProtocol(): Promise<void> {
    await this.runTest('DevTools Protocol Integration', async () => {
      if (!this.page) throw new Error('No page available for testing');

      // Test CDP (Chrome DevTools Protocol) access
      const client = await this.page.target().createCDPSession();
      
      // Enable runtime domain
      await client.send('Runtime.enable');
      
      // Test JavaScript execution via CDP
      const result = await client.send('Runtime.evaluate', {
        expression: 'navigator.userAgent'
      });
      
      if (!result.result.value) {
        throw new Error('Failed to execute JavaScript via CDP');
      }
      
      console.log(`   🔧 CDP Runtime evaluation successful`);
      console.log(`   🌐 User Agent: ${result.result.value.substring(0, 50)}...`);
      
      // Test DOM access
      await client.send('DOM.enable');
      const document = await client.send('DOM.getDocument');
      
      if (!document.root) {
        throw new Error('Failed to access DOM via CDP');
      }
      
      console.log(`   📄 DOM access successful, root node ID: ${document.root.nodeId}`);
      
      await client.detach();
    });
  }

  private async testPerformanceMonitoring(): Promise<void> {
    await this.runTest('Performance Monitoring', async () => {
      if (!this.page) throw new Error('No page available for testing');

      // Enable performance monitoring
      const client = await this.page.target().createCDPSession();
      await client.send('Performance.enable');
      
      // Get performance metrics
      const metrics = await client.send('Performance.getMetrics');
      
      if (!metrics.metrics || metrics.metrics.length === 0) {
        throw new Error('Failed to retrieve performance metrics');
      }
      
      console.log(`   📊 Retrieved ${metrics.metrics.length} performance metrics`);
      
      // Test specific metrics
      const jsHeapUsed = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
      if (jsHeapUsed) {
        console.log(`   🧠 JS Heap Used: ${Math.round(jsHeapUsed.value / 1024 / 1024)}MB`);
      }
      
      await client.detach();
    });
  }

  private async testNetworkInterception(): Promise<void> {
    await this.runTest('Network Interception', async () => {
      if (!this.page) throw new Error('No page available for testing');

      let requestCount = 0;
      let responseCount = 0;

      // Set up network monitoring
      await this.page.setRequestInterception(true);
      
      this.page.on('request', (request) => {
        requestCount++;
        request.continue();
      });
      
      this.page.on('response', (_response) => {
        responseCount++;
      });

      // Navigate to trigger network requests
      await this.page.goto('https://httpbin.org/json', { waitUntil: 'networkidle0' });
      
      if (requestCount === 0) {
        throw new Error('No network requests intercepted');
      }
      
      if (responseCount === 0) {
        throw new Error('No network responses captured');
      }
      
      console.log(`   📡 Intercepted ${requestCount} requests and ${responseCount} responses`);
      
      // Disable interception for other tests
      await this.page.setRequestInterception(false);
    });
  }

  private async testConsoleAPI(): Promise<void> {
    await this.runTest('Console API Integration', async () => {
      if (!this.page) throw new Error('No page available for testing');

      const consoleMessages: string[] = [];
      
      // Listen for console messages
      this.page.on('console', (msg) => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      });
      
      // Execute console commands
      await this.page.evaluate(() => {
        console.log('Test log message');
        console.warn('Test warning message');
        console.error('Test error message');
      });
      
      // Wait a bit for messages to be captured
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (consoleMessages.length === 0) {
        throw new Error('No console messages captured');
      }
      
      console.log(`   📝 Captured ${consoleMessages.length} console messages:`);
      consoleMessages.forEach(msg => console.log(`      ${msg}`));
    });
  }

  private async testResourceBlocking(): Promise<void> {
    await this.runTest('Resource Blocking', async () => {
      if (!this.browser) throw new Error('No browser available for testing');

      // Create a new page with resource blocking
      const result = await connectToHeadlessBrowser('https://example.com', {
        blockResources: true,
        customResourceBlockList: ['image', 'font', 'media']
      });
      
      const testPage = result.page;
      let blockedRequests = 0;
      
      // Monitor blocked requests
      testPage.on('requestfailed', (request) => {
        if (['image', 'font', 'media'].includes(request.resourceType())) {
          blockedRequests++;
        }
      });
      
      // Navigate to a page with resources
      await testPage.goto('https://example.com', { waitUntil: 'networkidle0' });
      
      console.log(`   🚫 Blocked ${blockedRequests} resource requests`);
      
      await testPage.close();
    });
  }

  private async testBrowserCleanup(): Promise<void> {
    await this.runTest('Browser Cleanup Management', async () => {
      if (!this.browser) throw new Error('No browser available for testing');

      // Test that browser is still connected
      const pages = await this.browser.pages();
      if (pages.length === 0) {
        throw new Error('No pages available in browser');
      }
      
      // Schedule cleanup (this should work without errors)
      scheduleBrowserCleanup();
      
      console.log(`   🧹 Browser cleanup scheduled successfully`);
      console.log(`   📄 Browser has ${pages.length} active pages`);
    });
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      console.warn('⚠️  Cleanup warning:', error);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CHROME DEVTOOLS TEST RESULTS');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
    console.log(`⏱️  Total time: ${totalTime}ms\n`);
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const time = `${result.duration}ms`;
      console.log(`${status} ${result.name.padEnd(35)} ${time.padStart(8)}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 All Chrome DevTools tests passed!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Check the errors above.`);
    }
  }
}

// Main execution function
async function main(): Promise<void> {
  const testSuite = new ChromeDevToolsTestSuite();
  await testSuite.runAllTests();
}

// Export for use in other modules
export { ChromeDevToolsTestSuite };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}