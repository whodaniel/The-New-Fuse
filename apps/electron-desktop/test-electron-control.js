const { chromium } = require('playwright');

async function main() {
    try {
        console.log('Connecting to Electron app via CDP...');
        const browser = await chromium.connectOverCDP('http://localhost:9222');

        const contexts = browser.contexts();
        console.log(`Found ${contexts.length} context(s)\n`);

        let browserHubPage = null;

        // Find the Browser Hub page
        for (const context of contexts) {
            for (const page of context.pages()) {
                const title = await page.title();
                const url = page.url();
                console.log(`Page: "${title}" @ ${url.substring(0, 60)}...`);

                if (title.includes('TNF Browser Hub') || title.includes('Browser Hub')) {
                    browserHubPage = page;
                    console.log('  -> This is the Browser Hub!\n');
                }
            }
        }

        if (browserHubPage) {
            console.log('=== BROWSER HUB ANALYSIS ===\n');

            // Take screenshot
            await browserHubPage.screenshot({ path: 'browser-hub-current.png', fullPage: true });
            console.log('✅ Screenshot saved to browser-hub-current.png\n');

            // Check extension toolbar
            const toolbar = await browserHubPage.$('#extensionToolbar');
            if (toolbar) {
                const html = await toolbar.innerHTML();
                const iconCount = (html.match(/extension-icon-btn/g) || []).length;
                console.log(`Extension Toolbar: ${iconCount} extension icon(s)`);
                if (iconCount > 0) {
                    console.log('Toolbar HTML preview:', html.substring(0, 200) + '...');
                }
            } else {
                console.log('Extension toolbar element not found');
            }

            // Check extension count badge
            const countBadge = await browserHubPage.$('.extension-count');
            if (countBadge) {
                const count = await countBadge.textContent();
                console.log(`Extension count badge: ${count}`);
            }

            // Check if electronAPI is available
            const apiCheck = await browserHubPage.evaluate(() => {
                const result = {
                    hasElectronAPI: !!window.electronAPI,
                    methods: []
                };
                if (window.electronAPI) {
                    result.methods = Object.keys(window.electronAPI);
                }
                return result;
            });
            console.log(`\nelectronAPI available: ${apiCheck.hasElectronAPI}`);
            if (apiCheck.methods.length > 0) {
                console.log('Available methods:', apiCheck.methods.join(', '));
            }

            // Try to get loaded extensions via the API
            console.log('\n=== FETCHING LOADED EXTENSIONS ===\n');
            const extensions = await browserHubPage.evaluate(async () => {
                if (window.electronAPI && window.electronAPI.getLoadedExtensions) {
                    return await window.electronAPI.getLoadedExtensions();
                }
                return { success: false, error: 'API not available' };
            });

            if (extensions.success) {
                console.log(`Found ${extensions.extensions.length} loaded extension(s):`);
                extensions.extensions.forEach(ext => {
                    console.log(`  - ${ext.name} (${ext.id})`);
                });
            } else {
                console.log('Could not fetch extensions:', extensions.error || 'Unknown error');
            }

            // Check tabs
            const tabs = await browserHubPage.$$('.tab');
            console.log(`\nOpen tabs: ${tabs.length}`);

            // Get address bar content
            const addressBar = await browserHubPage.$('#addressBar');
            if (addressBar) {
                const url = await addressBar.inputValue();
                console.log(`Address bar: ${url || '(empty)'}`);
            }

            console.log('\n=== INTERACTION TEST ===\n');

            // Click the refresh extensions button
            const refreshBtn = await browserHubPage.$('button[onclick="refreshInstalledExtensions()"]');
            if (refreshBtn) {
                console.log('Clicking refresh extensions button...');
                await refreshBtn.click();
                await browserHubPage.waitForTimeout(1000);
                console.log('Clicked! Taking another screenshot...');
                await browserHubPage.screenshot({ path: 'browser-hub-after-refresh.png' });
            }

            // Navigate to a URL
            console.log('\nAttempting to navigate to https://example.com via address bar...');
            if (addressBar) {
                await addressBar.fill('https://example.com');
                await addressBar.press('Enter');
                await browserHubPage.waitForTimeout(2000);
                await browserHubPage.screenshot({ path: 'browser-hub-after-nav.png' });
                console.log('Navigation attempted. Screenshot saved.');
            }

        } else {
            console.log('Browser Hub page not found!');
        }

        await browser.close();
        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
