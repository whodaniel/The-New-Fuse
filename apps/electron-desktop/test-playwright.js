const { chromium } = require('playwright');

async function testPlaywright() {
    console.log('🚀 Starting Playwright test...');

    let browser;
    try {
        // Launch browser
        console.log('📦 Launching Chromium...');
        browser = await chromium.launch({
            headless: false,
            slowMo: 100 // Slow down actions for visibility
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Test 1: Navigate to Google
        console.log('🌐 Test 1: Navigating to Google...');
        await page.goto('https://www.google.com');
        await page.waitForLoadState('networkidle');
        const title = await page.title();
        console.log('✅ Page title:', title);

        // Test 2: Search for something
        console.log('🔍 Test 2: Performing a search...');
        await page.fill('textarea[name="q"]', 'Playwright automation');
        await page.press('textarea[name="q"]', 'Enter');
        await page.waitForLoadState('networkidle');
        console.log('✅ Search completed');

        // Test 3: Take a screenshot
        console.log('📸 Test 3: Taking screenshot...');
        await page.screenshot({ path: 'playwright-test-screenshot.png' });
        console.log('✅ Screenshot saved to playwright-test-screenshot.png');

        // Test 4: Navigate to GitHub
        console.log('🌐 Test 4: Navigating to GitHub...');
        await page.goto('https://github.com');
        await page.waitForLoadState('networkidle');
        const githubTitle = await page.title();
        console.log('✅ GitHub page title:', githubTitle);

        // Test 5: Get page content
        console.log('📄 Test 5: Getting page content...');
        const content = await page.content();
        console.log('✅ Page content length:', content.length, 'characters');

        console.log('\n🎉 All tests passed successfully!');
        console.log('⏳ Browser will stay open for 10 seconds for inspection...');

        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        if (browser) {
            console.log('🔒 Closing browser...');
            await browser.close();
            console.log('✅ Browser closed');
        }
    }
}

// Run the test
testPlaywright()
    .then(() => {
        console.log('✅ Test script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
