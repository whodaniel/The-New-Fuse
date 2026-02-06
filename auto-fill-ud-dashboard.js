#!/usr/bin/env node

/**
 * Automated script to fill in Unstoppable Domains dashboard branding form
 */

const { chromium } = require('playwright');

async function autoFillUDDashboard() {
  console.log('🚀 Starting browser automation to fill UD dashboard...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  try {
    const context = await browser.newContext({
      viewport: null,
    });

    const page = await context.newPage();

    console.log('📍 Navigating to Unstoppable Domains dashboard...');
    const targetUrl =
      'https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding';

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Check if we need to sign in
    const bodyText = await page.textContent('body');
    if (
      bodyText.includes('500') ||
      bodyText.includes('Something went wrong') ||
      bodyText.includes('Sign in')
    ) {
      console.log('\n⚠️  Authentication required!\n');
      console.log('Please sign in to Unstoppable Domains in the browser window.');
      console.log('Once signed in, I will automatically fill in the form.\n');
      console.log('Waiting for you to sign in...\n');

      // Wait for navigation away from error/login page
      await page.waitForURL(
        (url) => {
          const urlString = url.toString();
          return !urlString.includes('500') && !urlString.includes('sign');
        },
        { timeout: 300000 }
      );

      console.log('✅ Detected successful sign in!\n');

      // Navigate to branding page if not already there
      if (!page.url().includes('branding')) {
        console.log('📍 Navigating to branding page...');
        await page.goto(targetUrl, { waitUntil: 'networkidle' });
      }

      await page.waitForTimeout(2000);
    }

    console.log('🔍 Looking for form fields...\n');

    // Configuration values
    const config = {
      appName: 'The New Fuse',
      description: 'AI-powered browser extension with Web3 authentication',
      primaryColor: '#4C47F7',
      backgroundColor: '#F8F9FF',
      buttonColor: '#4C47F7',
      textColor: '#FFFFFF',
      supportEmail: 'support@thenewfuse.com',
    };

    // Try to find and fill form fields by common selectors
    const fillStrategies = [
      // Strategy 1: By label text
      async () => {
        console.log('Trying to fill by label text...');

        // Application Name
        try {
          const nameInput = page
            .locator('input')
            .filter({ has: page.locator('text=/Application Name|App Name|Name/i') })
            .first();
          if ((await nameInput.count()) > 0) {
            await nameInput.fill(config.appName);
            console.log('✓ Filled Application Name');
          }
        } catch (e) {}

        // Description
        try {
          const descInput = page
            .locator('input, textarea')
            .filter({ has: page.locator('text=/Description|Tagline/i') })
            .first();
          if ((await descInput.count()) > 0) {
            await descInput.fill(config.description);
            console.log('✓ Filled Description');
          }
        } catch (e) {}

        // Colors
        try {
          const primaryColorInput = page
            .locator('input[type="text"], input[type="color"]')
            .filter({ has: page.locator('text=/Primary.*Color|Brand Color/i') })
            .first();
          if ((await primaryColorInput.count()) > 0) {
            await primaryColorInput.fill(config.primaryColor);
            console.log('✓ Filled Primary Color');
          }
        } catch (e) {}

        try {
          const bgColorInput = page
            .locator('input[type="text"], input[type="color"]')
            .filter({ has: page.locator('text=/Background.*Color|Secondary.*Color/i') })
            .first();
          if ((await bgColorInput.count()) > 0) {
            await bgColorInput.fill(config.backgroundColor);
            console.log('✓ Filled Background Color');
          }
        } catch (e) {}

        try {
          const buttonColorInput = page
            .locator('input[type="text"], input[type="color"]')
            .filter({ has: page.locator('text=/Button.*Color/i') })
            .first();
          if ((await buttonColorInput.count()) > 0) {
            await buttonColorInput.fill(config.buttonColor);
            console.log('✓ Filled Button Color');
          }
        } catch (e) {}

        // Email
        try {
          const emailInput = page
            .locator('input[type="email"], input[type="text"]')
            .filter({ has: page.locator('text=/Support.*Email|Contact.*Email/i') })
            .first();
          if ((await emailInput.count()) > 0) {
            await emailInput.fill(config.supportEmail);
            console.log('✓ Filled Support Email');
          }
        } catch (e) {}
      },

      // Strategy 2: By placeholder text
      async () => {
        console.log('Trying to fill by placeholder...');

        const inputs = await page.locator('input, textarea').all();
        for (const input of inputs) {
          const placeholder = await input.getAttribute('placeholder');
          if (!placeholder) continue;

          if (
            placeholder.toLowerCase().includes('name') &&
            !placeholder.toLowerCase().includes('email')
          ) {
            await input.fill(config.appName);
            console.log('✓ Filled name field by placeholder');
          } else if (
            placeholder.toLowerCase().includes('description') ||
            placeholder.toLowerCase().includes('tagline')
          ) {
            await input.fill(config.description);
            console.log('✓ Filled description by placeholder');
          } else if (placeholder.toLowerCase().includes('email')) {
            await input.fill(config.supportEmail);
            console.log('✓ Filled email by placeholder');
          }
        }
      },

      // Strategy 3: By input name/id attributes
      async () => {
        console.log('Trying to fill by name/id attributes...');

        const namePatterns = ['name', 'appName', 'applicationName', 'app_name'];
        for (const pattern of namePatterns) {
          try {
            await page.fill(`input[name="${pattern}"], input[id="${pattern}"]`, config.appName);
            console.log(`✓ Filled name using ${pattern}`);
          } catch (e) {}
        }

        const descPatterns = ['description', 'tagline', 'desc', 'app_description'];
        for (const pattern of descPatterns) {
          try {
            await page.fill(
              `input[name="${pattern}"], textarea[name="${pattern}"], input[id="${pattern}"]`,
              config.description
            );
            console.log(`✓ Filled description using ${pattern}`);
          } catch (e) {}
        }

        const emailPatterns = ['email', 'supportEmail', 'support_email', 'contactEmail'];
        for (const pattern of emailPatterns) {
          try {
            await page.fill(
              `input[name="${pattern}"], input[id="${pattern}"]`,
              config.supportEmail
            );
            console.log(`✓ Filled email using ${pattern}`);
          } catch (e) {}
        }

        const colorPatterns = {
          primary: ['primaryColor', 'primary_color', 'brandColor', 'brand_color'],
          background: ['backgroundColor', 'background_color', 'bgColor', 'bg_color'],
          button: ['buttonColor', 'button_color', 'btnColor'],
        };

        for (const pattern of colorPatterns.primary) {
          try {
            await page.fill(
              `input[name="${pattern}"], input[id="${pattern}"]`,
              config.primaryColor
            );
            console.log(`✓ Filled primary color using ${pattern}`);
          } catch (e) {}
        }

        for (const pattern of colorPatterns.background) {
          try {
            await page.fill(
              `input[name="${pattern}"], input[id="${pattern}"]`,
              config.backgroundColor
            );
            console.log(`✓ Filled background color using ${pattern}`);
          } catch (e) {}
        }

        for (const pattern of colorPatterns.button) {
          try {
            await page.fill(`input[name="${pattern}"], input[id="${pattern}"]`, config.buttonColor);
            console.log(`✓ Filled button color using ${pattern}`);
          } catch (e) {}
        }
      },
    ];

    // Try all strategies
    for (const strategy of fillStrategies) {
      await strategy();
    }

    console.log('\n✅ Attempted to fill all available fields!\n');
    console.log('📋 Configuration used:');
    console.log(`   Application Name: ${config.appName}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Primary Color: ${config.primaryColor}`);
    console.log(`   Background Color: ${config.backgroundColor}`);
    console.log(`   Button Color: ${config.buttonColor}`);
    console.log(`   Text Color: ${config.textColor}`);
    console.log(`   Support Email: ${config.supportEmail}`);

    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Review the filled values in the browser');
    console.log('2. Upload logo if needed (apps/chrome-extension/icons/icon128.png)');
    console.log('3. Click "Save" or "Submit" button');
    console.log('4. Go to "Settings" tab to add redirect URIs:');
    console.log('   - Get your extension ID from chrome://extensions/');
    console.log('   - Add: chrome-extension://[YOUR-ID]/popup.html');
    console.log('   - Add: chrome-extension://[YOUR-ID]/options.html');
    console.log('\n💡 See apps/chrome-extension/UD_QUICK_REFERENCE.md for details\n');
    console.log('Browser will stay open. Press Ctrl+C when done.\n');

    // Keep browser open
    await new Promise(() => {});
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nStack trace:', error.stack);
    console.log('\n📝 If automation failed, manually fill in:');
    console.log('   Application Name: The New Fuse');
    console.log('   Description: AI-powered browser extension with Web3 authentication');
    console.log('   Primary Color: #4C47F7');
    console.log('   Background Color: #F8F9FF');
    console.log('   Button Color: #4C47F7');
    console.log('   Text Color: #FFFFFF');
    console.log('   Support Email: support@thenewfuse.com\n');
  }
}

autoFillUDDashboard().catch(console.error);
