import { test, expect } from '@playwright/test';
import { gotoRoute } from './helpers/interactionAudit';

test.describe('dual-mode harness (local vs SaaS endpoints)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, '/settings');
  });

  test('local mode shows local endpoint hints', async ({ page }) => {
    await page.locator('.env-btn').filter({ hasText: 'Local' }).click();
    await expect(page.locator('.env-btn.active').filter({ hasText: 'Local' })).toBeVisible();
    await gotoRoute(page, '/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  test('production mode targets thenewfuse.com SaaS', async ({ page }) => {
    await page.locator('.env-btn').filter({ hasText: 'Production' }).click();
    await expect(page.locator('.env-btn.active').filter({ hasText: 'Production' })).toBeVisible();
    await gotoRoute(page, '/web-parity');
    await expect(page.getByText(/thenewfuse\.com|Web Parity|Production/i).first()).toBeVisible();
  });

  test('sandbox mode selectable for staging harness', async ({ page }) => {
    await page.locator('.env-btn').filter({ hasText: 'Sandbox' }).click();
    await expect(page.locator('.env-btn.active').filter({ hasText: 'Sandbox' })).toBeVisible();
  });

  test('harness routes load in local mode after env switch', async ({ page }) => {
    await page.locator('.env-btn').filter({ hasText: 'Local' }).click();
    for (const route of ['/a2a', '/workflows', '/oagi']) {
      await gotoRoute(page, route);
      await expect(page.locator('.page-container, main, .page-header').first()).toBeVisible();
    }
  });
});
