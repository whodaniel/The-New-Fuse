#!/usr/bin/env node

/**
 * Automated script to help fill in Unstoppable Domains dashboard branding form using Playwright
 */

const { chromium } = require('playwright');

async function fillUDDashboard() {
  console.log('Starting browser with Playwright...');

  const browser = await chromium.launch({
    headless: false, // Show the browser
    args: ['--start-maximized'],
  });

  try {
    const context = await browser.newContext({
      viewport: null,
    });

    const page = await context.newPage();

    console.log('\nNavigating to Unstoppable Domains dashboard...');
    console.log(
      'URL: https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding\n'
    );

    await page.goto(
      'https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding',
      {
        waitUntil: 'networkidle',
        timeout: 30000,
      }
    );

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log('Page Title:', title);

    // Check for error page
    const bodyText = await page.textContent('body');
    if (bodyText.includes('500') || bodyText.includes('Something went wrong')) {
      console.log('\n⚠️  ERROR PAGE DETECTED');
      console.log("\n📋 Since the automated session shows an error, here's what to do:\n");
      console.log(
        '1. In the browser window that just opened, sign in manually to Unstoppabledomains.com'
      );
      console.log(
        '2. Navigate to: https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding'
      );
      console.log('3. Use these values to fill the form:\n');
      console.log('   Application Name: The New Fuse');
      console.log('   Description: AI-powered browser extension with Web3 authentication');
      console.log('   Primary Color: #4C47F7');
      console.log('   Background Color: #F8F9FF');
      console.log('   Button Color: #4C47F7');
      console.log('   Text Color: #FFFFFF');
      console.log('   Support Email: support@thenewfuse.com');
      console.log('\n4. Then go to Settings tab and add redirect URIs (see UD_QUICK_REFERENCE.md)');
      console.log('\n💡 See apps/chrome-extension/UD_QUICK_REFERENCE.md for complete details\n');
      console.log('Browser will stay open. Press Ctrl+C when done.\n');

      // Keep browser open
      await new Promise(() => {});
    }

    // If we got past the error check, try to find form fields
    console.log('\n✅ Page loaded successfully!\n');

    const inputs = await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input, textarea'));
      return allInputs.map((input) => ({
        type: input.type,
        name: input.name || input.id || input.getAttribute('aria-label') || 'unnamed',
        placeholder: input.placeholder || '',
        label: input.labels?.[0]?.textContent || '',
      }));
    });

    if (inputs.length > 0) {
      console.log('📝 Found form fields:');
      inputs.forEach((input, i) => {
        console.log(`   ${i + 1}. ${input.label || input.name} (${input.type})`);
      });
      console.log('');
    }

    console.log('=== CONFIGURATION VALUES ===\n');
    console.log('Application Name:     The New Fuse');
    console.log('Description:          AI-powered browser extension with Web3 authentication');
    console.log('Primary Color:        #4C47F7');
    console.log('Background Color:     #F8F9FF');
    console.log('Button Color:         #4C47F7');
    console.log('Text Color:           #FFFFFF');
    console.log('Support Email:        support@thenewfuse.com');
    console.log('\n📄 Complete guide: apps/chrome-extension/UD_QUICK_REFERENCE.md\n');
    console.log('✅ Browser is ready. Fill in the form and press Ctrl+C when done.\n');

    // Keep browser open
    await new Promise(() => {});
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📝 Manual steps:');
    console.log('1. Open: https://dashboard.unstoppabledomains.com');
    console.log('2. Sign in with your Unstoppable Domain');
    console.log('3. Navigate to your client branding page');
    console.log('4. Use values from: apps/chrome-extension/UD_QUICK_REFERENCE.md\n');
  }
}

fillUDDashboard().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
