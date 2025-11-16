import puppeteer from 'puppeteer-core';
import * as ChromeLauncher from 'chrome-launcher';

class LiveBrowserDemo {
  private browser: any = null;
  private page: any = null;

  private async findChromeExecutable(): Promise<string> {
    try {
      const installations = await ChromeLauncher.Launcher.getInstallations();
      if (installations.length > 0) {
        return installations[0];
      }
    } catch {
      console.warn('Could not find Chrome installations, using default');
    }
    
    // Fallback to common Chrome paths
    const commonPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];
    
    for (const path of commonPaths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(path)) {
          return path;
        }
      } catch {
        continue;
      }
    }
    
    throw new Error('Chrome executable not found');
  }

  async startDemo() {
    console.log('🚀 Starting Live Chrome DevTools Demo...\n');
    
    try {
      // Launch browser with visible UI (non-headless)
      console.log('📱 Opening Chrome browser (visible mode)...');
      
      // Find Chrome executable
      const chromePath = await this.findChromeExecutable();
      
      this.browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,  // Make browser visible
        devtools: true,   // Open DevTools automatically
        slowMo: 250,      // Slow down actions for visibility
        defaultViewport: { width: 1200, height: 800 },
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-dev-shm-usage',
          '--remote-debugging-port=9222'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1200, height: 800 });

      console.log('✅ Browser opened! You should see Chrome window with DevTools.\n');
      
      await this.demoNavigation();
      await this.demoElementInteraction();
      await this.demoConsoleActions();
      await this.demoNetworkMonitoring();
      await this.demoPerformanceAnalysis();
      
      console.log('\n🎉 Demo completed! Browser will stay open for 30 seconds...');
      await this.delay(30000);
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async demoNavigation() {
    console.log('🌐 Demo 1: Navigation & Page Loading');
    console.log('   → Navigating to Google...');
    
    await this.page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    await this.delay(2000);
    
    console.log('   → Navigating to GitHub...');
    await this.page.goto('https://github.com', { waitUntil: 'networkidle2' });
    await this.delay(2000);
    
    console.log('   ✅ Navigation demo complete\n');
  }

  private async demoElementInteraction() {
    console.log('🎯 Demo 2: Element Interaction & DOM Manipulation');
    
    // Go to a page with interactive elements
    console.log('   → Loading interactive demo page...');
    await this.page.goto('https://httpbin.org/forms/post', { waitUntil: 'networkidle2' });
    await this.delay(1000);

    // Highlight and interact with form elements
    console.log('   → Highlighting form elements...');
    
    // Add custom CSS to highlight elements
    await this.page.addStyleTag({
      content: `
        .demo-highlight {
          border: 3px solid #ff6b6b !important;
          background-color: rgba(255, 107, 107, 0.1) !important;
          transition: all 0.3s ease !important;
        }
      `
    });

    // Highlight and fill form fields
    const nameField = await this.page.$('input[name="custname"]');
    if (nameField) {
      await this.page.evaluate(el => el.classList.add('demo-highlight'), nameField);
      await this.delay(1000);
      await nameField.type('Chrome DevTools Demo', { delay: 100 });
      await this.delay(1000);
    }

    const emailField = await this.page.$('input[name="custemail"]');
    if (emailField) {
      await this.page.evaluate(el => el.classList.add('demo-highlight'), emailField);
      await this.delay(1000);
      await emailField.type('demo@chromedevtools.com', { delay: 100 });
      await this.delay(1000);
    }

    console.log('   ✅ Element interaction demo complete\n');
  }

  private async demoConsoleActions() {
    console.log('💻 Demo 3: Console API & JavaScript Execution');
    
    console.log('   → Executing JavaScript in browser console...');
    
    // Execute various console commands
    await this.page.evaluate(() => {
      console.log('🎉 Hello from Chrome DevTools Demo!');
      console.warn('⚠️ This is a warning message');
      console.error('❌ This is an error message (for demo purposes)');
      console.info('ℹ️ Browser info:', navigator.userAgent);
      console.table([
        { feature: 'DevTools Protocol', status: '✅ Working' },
        { feature: 'Console API', status: '✅ Working' },
        { feature: 'DOM Manipulation', status: '✅ Working' }
      ]);
    });

    await this.delay(2000);

    // Create visual elements dynamically
    console.log('   → Creating dynamic visual elements...');
    await this.page.evaluate(() => {
      const banner = document.createElement('div');
      banner.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: Arial, sans-serif;
          animation: slideIn 0.5s ease-out;
        ">
          <h3 style="margin: 0 0 10px 0;">🚀 Chrome DevTools Live Demo</h3>
          <p style="margin: 0; opacity: 0.9;">Browser automation in action!</p>
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(banner);
    });

    await this.delay(3000);
    console.log('   ✅ Console demo complete\n');
  }

  private async demoNetworkMonitoring() {
    console.log('🌐 Demo 4: Network Monitoring & Interception');
    
    console.log('   → Setting up network monitoring...');
    
    // Enable request interception
    await this.page.setRequestInterception(true);
    
    let requestCount = 0;
    this.page.on('request', (request: any) => {
      requestCount++;
      console.log(`   📡 Request #${requestCount}: ${request.method()} ${request.url().substring(0, 60)}...`);
      request.continue();
    });

    this.page.on('response', (response: any) => {
      console.log(`   📨 Response: ${response.status()} ${response.url().substring(0, 60)}...`);
    });

    console.log('   → Loading content-rich page to demonstrate network activity...');
    await this.page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle2' });
    
    await this.delay(3000);
    console.log(`   ✅ Network monitoring demo complete (${requestCount} requests captured)\n`);
  }

  private async demoPerformanceAnalysis() {
    console.log('⚡ Demo 5: Performance Analysis');
    
    console.log('   → Starting performance measurement...');
    
    // Start performance tracing
    await this.page.tracing.start({ screenshots: true, path: 'trace.json' });
    
    // Navigate to a page and measure performance
    await this.page.goto('https://web.dev', { waitUntil: 'networkidle2' });
    
    // Get performance metrics
    const metrics = await this.page.metrics();
    console.log('   📊 Performance Metrics:');
    console.log(`      • JS Heap Used: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100} MB`);
    console.log(`      • JS Heap Total: ${Math.round(metrics.JSHeapTotalSize / 1024 / 1024 * 100) / 100} MB`);
    console.log(`      • DOM Nodes: ${metrics.Nodes}`);
    console.log(`      • Event Listeners: ${metrics.JSEventListeners}`);
    
    // Stop tracing
    await this.page.tracing.stop();
    
    // Measure page load performance
    const performanceTiming = JSON.parse(
      await this.page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    
    const loadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
    console.log(`      • Page Load Time: ${loadTime}ms`);
    
    await this.delay(2000);
    console.log('   ✅ Performance analysis demo complete\n');
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Demo cleanup complete');
  }
}

// Run the demo
async function main() {
  const demo = new LiveBrowserDemo();
  await demo.startDemo();
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Demo crashed:', error);
    process.exit(1);
  });
}

export { LiveBrowserDemo };