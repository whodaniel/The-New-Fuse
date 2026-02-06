/**
 * E2E Test Helpers
 *
 * Shared utilities for Playwright E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Login helper
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, url: string | RegExp, timeout: number = 5000) {
  return page.waitForResponse(url, { timeout });
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if element is visible
 */
export async function expectVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
}

/**
 * Check if text is present on page
 */
export async function expectTextPresent(page: Page, text: string | RegExp) {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Fill form with data
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, url?: string | RegExp) {
  if (url) {
    await page.waitForURL(url);
  }
  await page.waitForLoadState('networkidle');
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500kb/s
    uploadThroughput: (500 * 1024) / 8,
    latency: 400, // 400ms
  });
}

/**
 * Clear all cookies and storage
 */
export async function clearBrowserData(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
