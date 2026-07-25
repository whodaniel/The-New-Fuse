import { expect, test } from '@playwright/test';

/** Representative native routes → expected PageShell h1 */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'System Console',
  '/platform': 'The New Fuse Platform',
  '/agents': 'Agent Hub',
  '/chat': 'Multi-Agent Chat',
  '/workflows': 'Workflow Builder',
  '/analytics': 'Analytics',
  '/mcp': 'MCP Store',
  '/settings': 'Settings',
  '/web-hub': 'Web Parity Hub',
  '/computer-use': 'Computer Use',
  '/terminal': 'Swarm Terminal',
  '/voice': 'Voice Bridge',
  '/a2a': 'A2A Control',
  '/knowledge': 'Knowledge Hub',
};

const LEGACY_REDIRECTS: Record<string, { path: string; title: string }> = {
  '/browser': { path: '/computer-use', title: 'Computer Use' },
  '/oagi': { path: '/computer-use', title: 'Computer Use' },
  '/antigravity': { path: '/agents', title: 'Agent Hub' },
};

async function expectPageTitle(page: import('@playwright/test').Page, title: string) {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

test.describe('desktop route navigation', () => {
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    test(`loads ${route}`, async ({ page }) => {
      await page.goto(`/#${route}`);
      await expectPageTitle(page, title);
    });
  }

  for (const [legacy, target] of Object.entries(LEGACY_REDIRECTS)) {
    test(`redirects legacy ${legacy} → ${target.path}`, async ({ page }) => {
      await page.goto(`/#${legacy}`);
      await expectPageTitle(page, target.title);
      expect(page.url()).toContain(`#${target.path}`);
    });
  }

  test('unknown route shows 404 shell', async ({ page }) => {
    await page.goto('/#/not-a-real-route');
    await expectPageTitle(page, 'Page not found');
  });

  test('command palette navigates to Agent Hub', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expectPageTitle(page, 'System Console');

    const modKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+KeyK`);
    await expect(page.getByPlaceholder('Jump to a page or open on web…')).toBeVisible();

    await page.getByPlaceholder('Jump to a page or open on web…').fill('Agent Hub');
    await page.keyboard.press('Enter');

    await expectPageTitle(page, 'Agent Hub');
    expect(page.url()).toContain('#/agents');
  });

  test('sidebar navigates to Settings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/dashboard');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expectPageTitle(page, 'Settings');
    expect(page.url()).toContain('#/settings');
  });
});
