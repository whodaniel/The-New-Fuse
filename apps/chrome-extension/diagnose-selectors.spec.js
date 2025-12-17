const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Diagnose Gemini Selectors', () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    const extensionPath = path.join(__dirname);

    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Diagnose Gemini response selectors', async () => {
    await page.goto('https://gemini.google.com/app');
    await page.waitForTimeout(6000);

    // Inject and submit a question
    await page.evaluate(() => {
      window.postMessage({
        type: 'TNF_COMMAND',
        action: 'INJECT_TEXT',
        payload: { text: 'Say only the word "test"', submit: true }
      }, '*');
    });

    // Wait for response
    await page.waitForTimeout(15000);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/gemini-response.png', fullPage: true });

    // Get all elements that might contain the response
    const diagnostics = await page.evaluate(() => {
      const results = {
        allSelectors: [],
        found: [],
        potentialResponses: []
      };

      // Test existing selectors
      const selectorsToTest = [
        '.response-content',
        '.model-response',
        'message-content',
        '.markdown-content',
        '[data-message-id] .message-body',
        // Additional common response selectors
        '[data-message-author-role="model"]',
        '[data-message-author-role="assistant"]',
        '.model-response-text',
        '.message.model',
        '[class*="response"]',
        '[class*="model"]',
        '[class*="markdown"]',
      ];

      for (const selector of selectorsToTest) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.found.push({
            selector,
            count: elements.length,
            sample: Array.from(elements).slice(0, 2).map(el => ({
              tagName: el.tagName,
              className: el.className,
              textPreview: el.textContent?.substring(0, 100)
            }))
          });
        }
      }

      // Find all elements containing text that looks like a response
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent;
        if (text && text.length > 10 && text.length < 5000 && el.children.length < 10) {
          const classes = el.className;
          const dataAttrs = Array.from(el.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `${attr.name}="${attr.value}"`);

          if (classes || dataAttrs.length > 0) {
            results.potentialResponses.push({
              tagName: el.tagName,
              className: classes,
              dataAttributes: dataAttrs,
              textPreview: text.substring(0, 150)
            });
          }
        }
      }

      return results;
    });

    console.log('\n=== DIAGNOSTIC RESULTS ===\n');
    console.log('Found selectors:', JSON.stringify(diagnostics.found, null, 2));
    console.log('\nPotential response elements (first 10):');
    console.log(JSON.stringify(diagnostics.potentialResponses.slice(0, 10), null, 2));

    // Log to file
    fs.writeFileSync('test-screenshots/gemini-diagnostics.json', JSON.stringify(diagnostics, null, 2));
  });
});
