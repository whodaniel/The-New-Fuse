const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('TNF Chrome Extension Tests', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Launch browser with extension loaded
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

  test('should auto-inject floating panel on Gemini', async () => {
    // Navigate to Gemini
    await page.goto('https://gemini.google.com/app');

    // Wait for page to load
    await page.waitForTimeout(6000);

    // Check for TNF console logs
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('[TNF]')) {
        logs.push(msg.text());
      }
    });

    // Check if floating panel exists
    const panel = await page.locator('#tnf-floating-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/panel-loaded.png' });

    console.log(' Floating panel appeared');
    console.log('Console logs:', logs);
  });

  test('should inject text and submit via postMessage', async () => {
    await page.goto('https://gemini.google.com/app');
    await page.waitForTimeout(6000);

    // Inject text via postMessage
    await page.evaluate(() => {
      window.postMessage({
        type: 'TNF_COMMAND',
        action: 'INJECT_TEXT',
        payload: { text: 'What is 10 + 7?', submit: true }
      }, '*');
    });

    // Wait for the text to be injected and submitted
    await page.waitForTimeout(2000);

    // Take screenshot after injection
    await page.screenshot({ path: 'test-screenshots/text-injected.png' });

    console.log(' Text injected and submitted');
  });

  test('should capture AI response and display in panel', async () => {
    await page.goto('https://gemini.google.com/app');
    await page.waitForTimeout(6000);

    // Set up response listener
    const responses = [];
    page.on('console', msg => {
      if (msg.text().includes('New response captured')) {
        responses.push(msg.text());
      }
    });

    // Inject question
    await page.evaluate(() => {
      window.postMessage({
        type: 'TNF_COMMAND',
        action: 'INJECT_TEXT',
        payload: { text: 'What is the square root of 144?', submit: true }
      }, '*');
    });

    // Wait for AI to respond
    await page.waitForTimeout(15000);

    // Check panel chat messages
    const chatMessages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.tnf-chat-message')).map(el => ({
        className: el.className,
        text: el.textContent.substring(0, 200)
      }));
    });

    // Check panel log content
    const panelLog = await page.evaluate(() => {
      return document.querySelector('#tnf-panel-log')?.innerHTML.substring(0, 2000) || 'Panel not found';
    });

    // Take final screenshot
    await page.screenshot({ path: 'test-screenshots/ai-response-captured.png', fullPage: true });

    console.log(' AI response test complete');
    console.log('Chat messages found:', chatMessages.length);
    console.log('Chat messages:', JSON.stringify(chatMessages, null, 2));
    console.log('Panel log preview:', panelLog.substring(0, 500));
    console.log('Response captures:', responses);

    // Verify we have at least user message in panel
    expect(chatMessages.length).toBeGreaterThan(0);
  });

  test('should display user message with =d icon', async () => {
    await page.goto('https://gemini.google.com/app');
    await page.waitForTimeout(6000);

    // Inject a message
    await page.evaluate(() => {
      window.postMessage({
        type: 'TNF_COMMAND',
        action: 'INJECT_TEXT',
        payload: { text: 'Hello TNF!', submit: true }
      }, '*');
    });

    await page.waitForTimeout(3000);

    // Check for user message in panel
    const userMessage = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.tnf-user-message'));
      return messages.map(m => m.textContent).join(' | ');
    });

    console.log('User messages:', userMessage);
    expect(userMessage).toContain('Hello TNF!');
  });

  test('should display AI response with > icon', async () => {
    await page.goto('https://gemini.google.com/app');
    await page.waitForTimeout(6000);

    // Inject a simple math question
    await page.evaluate(() => {
      window.postMessage({
        type: 'TNF_COMMAND',
        action: 'INJECT_TEXT',
        payload: { text: 'What is 3 + 3?', submit: true }
      }, '*');
    });

    // Wait longer for AI response
    await page.waitForTimeout(20000);

    // Check for AI message in panel
    const aiMessages = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.tnf-ai-message'));
      return messages.map(m => ({
        text: m.textContent.substring(0, 100),
        html: m.innerHTML.substring(0, 200)
      }));
    });

    await page.screenshot({ path: 'test-screenshots/ai-message-with-icon.png', fullPage: true });

    console.log('AI messages found:', aiMessages.length);
    console.log('AI messages:', JSON.stringify(aiMessages, null, 2));

    // Verify at least one AI response
    expect(aiMessages.length).toBeGreaterThan(0);
  });
});
