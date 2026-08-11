import { expect, test } from '@playwright/test';
import { gotoRoute, stubTauriNative } from './helpers/interactionAudit';

/**
 * Interactive smoke for Living State baton:
 * external links, Chrome bootstrap path, OAGI arm/disarm UI.
 */
test.beforeEach(async ({ page }) => {
  await stubTauriNative(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function openScreenAutomation(page: import('@playwright/test').Page): Promise<void> {
  await gotoRoute(page, '/computer-use');
  await expect(page.getByText('Computer Use', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole('tab', { name: 'Screen automation' }).click();
  await expect(
    page.getByRole('button', { name: /Arm computer-use|Disarm computer-use/ })
  ).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Tauri hardening interactive smoke', () => {
  test('external link uses openExternal fallback and records https URL', async ({ page }) => {
    await openScreenAutomation(page);

    await page.getByRole('button', { name: 'Web docs' }).click();

    const opened = await page.evaluate(() => {
      return (window as unknown as { __TNF_SMOKE_OPENED__?: string[] }).__TNF_SMOKE_OPENED__ || [];
    });
    expect(opened.some((url) => url.includes('https://thenewfuse.com/oagi'))).toBeTruthy();
  });

  test('OAGI arm/disarm toggles and gates automation', async ({ page }) => {
    await openScreenAutomation(page);

    await expect(page.getByText(/Automation:\s*DISARMED/i)).toBeVisible();

    // Disarmed click should log failure, not succeed silently.
    await page.getByRole('button', { name: 'Move & Left Click' }).click();
    await expect(page.locator('.oagi-container')).toContainText(/DISARMED|failed|Arm/i);

    await page.getByRole('button', { name: 'Arm computer-use' }).click();
    await expect(page.getByText(/Automation:\s*ARMED/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disarm computer-use' })).toBeVisible();

    await page.getByRole('button', { name: 'Move & Left Click' }).click();
    await expect(page.locator('.oagi-container')).toContainText(/click completed/i);

    await page.getByRole('button', { name: 'Disarm computer-use' }).click();
    await expect(page.getByText(/Automation:\s*DISARMED/i)).toBeVisible();
  });

  test('Chrome bootstrap ensure path launches via stubbed Tauri invokes', async ({ page }) => {
    await gotoRoute(page, '/dashboard');
    await expect(page.getByText(/Dashboard|Mission Control|The New Fuse/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Drive the bootstrap invoke surface directly (ensure() is not yet wired to a button).
    const result = await page.evaluate(async () => {
      const invoke = (
        window as unknown as {
          __TAURI__?: {
            core?: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };
          };
        }
      ).__TAURI__?.core?.invoke;
      if (!invoke) throw new Error('Tauri stub invoke missing');
      const [chromePath, extensionPath] = await Promise.all([
        invoke('find_chrome_executable'),
        invoke('resolve_chrome_extension_path'),
      ]);
      const launch = (await invoke('launch_chrome_with_extension', {
        startUrl: 'https://thenewfuse.com',
      })) as {
        launched?: boolean;
        message?: string;
        extension_path?: string | null;
      };
      return { chromePath, extensionPath, launch };
    });

    expect(String(result.chromePath)).toMatch(/Chrome|chrome|chromium/i);
    expect(String(result.extensionPath)).toMatch(/chrome-extension\/dist-v7/);
    expect(result.launch.launched).toBe(true);
    expect(String(result.launch.message)).toMatch(/Chrome launched|extension/i);
  });
});
