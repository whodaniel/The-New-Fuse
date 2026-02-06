#!/usr/bin/env node

/**
 * Automated script to help fill in Unstoppable Domains dashboard branding form
 * This script will open the browser, navigate to the page, and help you see the form fields
 */

const puppeteer = require('puppeteer');

async function fillUDDashboard() {
  console.log('Starting browser...');

  const browser = await puppeteer.launch({
    headless: false, // Show the browser so user can interact
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  try {
    const page = await browser.newPage();

    console.log('Navigating to Unstoppable Domains dashboard...');
    console.log(
      'URL: https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding'
    );

    await page.goto(
      'https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      }
    );

    console.log('\n=== Page loaded ===\n');

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);

    // Get the page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Check if we're on an error page
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('500') || bodyText.includes('Something went wrong')) {
      console.log('\n⚠️  ERROR: Page shows 500 error. You may need to sign in again.');
      console.log('\nPlease:');
      console.log('1. Sign in to Unstoppable Domains in this browser window');
      console.log('2. Navigate to the branding page manually');
      console.log('3. Use the values from UD_QUICK_REFERENCE.md to fill in the form');
      console.log('\nPress Ctrl+C to exit when done.');

      // Keep browser open
      await new Promise(() => {});
    }

    // Try to find form fields
    console.log('\nLooking for form fields...');

    const inputs = await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input, textarea'));
      return allInputs.map((input) => ({
        type: input.type,
        name: input.name || input.id || 'unnamed',
        placeholder: input.placeholder || '',
        value: input.value || '',
      }));
    });

    if (inputs.length > 0) {
      console.log('\nFound form fields:');
      inputs.forEach((input, i) => {
        console.log(`  ${i + 1}. ${input.type} - ${input.name} (${input.placeholder})`);
      });

      console.log('\n=== Configuration Values ===');
      console.log('Application Name: The New Fuse');
      console.log('Description: AI-powered browser extension with Web3 authentication');
      console.log('Primary Color: #4C47F7');
      console.log('Background Color: #F8F9FF');
      console.log('Button Color: #4C47F7');
      console.log('Text Color: #FFFFFF');
      console.log('Support Email: support@thenewfuse.com');
      console.log('\nSee UD_QUICK_REFERENCE.md for complete details');
    }

    console.log('\n✅ Browser window is open. You can now:');
    console.log('1. Fill in the form fields using values from UD_QUICK_REFERENCE.md');
    console.log('2. Save the branding configuration');
    console.log('3. Go to Settings tab to configure redirect URIs');
    console.log('\nPress Ctrl+C when done to close the browser.');

    // Keep browser open indefinitely
    await new Promise(() => {});
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nIf you see authentication errors, please:');
    console.log('1. Manually open: https://dashboard.unstoppabledomains.com');
    console.log('2. Sign in with your Unstoppable Domain');
    console.log('3. Navigate to the branding page');
    console.log('4. Use values from UD_QUICK_REFERENCE.md');
  } finally {
    // Don't close automatically - let user close
    console.log('\nBrowser will stay open. Press Ctrl+C to exit.');
  }
}

fillUDDashboard().catch(console.error);
