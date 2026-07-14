import { expect, test } from '@playwright/test';
import {
  exerciseVisibleButtons,
  fillVisibleFormFields,
  gotoRoute,
  modKey,
  openCommandPalette,
  screenshotUx,
  stubTauriNative,
} from './helpers/interactionAudit';

const DESKTOP_ROUTES = [
  { id: 'platform', path: '/platform', label: 'Platform' },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
  { id: 'browser', path: '/browser', label: 'Browser Control' },
  { id: 'terminal', path: '/terminal', label: 'Swarm Terminal' },
  { id: 'oagi', path: '/oagi', label: 'OAGI Hub' },
  { id: 'antigravity', path: '/antigravity', label: 'Antigravity' },
  { id: 'voice', path: '/voice', label: 'Voice Bridge' },
  { id: 'library', path: '/library', label: 'Virtual Library' },
  { id: 'agents', path: '/agents', label: 'Agent Hub' },
  { id: 'a2a', path: '/a2a', label: 'A2A Control' },
  { id: 'chat', path: '/chat', label: 'Multi-Agent Chat' },
  { id: 'knowledge', path: '/knowledge', label: 'Knowledge Hub' },
  { id: 'workflows', path: '/workflows', label: 'Workflows' },
  { id: 'mcp', path: '/mcp', label: 'MCP Store' },
  { id: 'analytics', path: '/analytics', label: 'Analytics' },
  { id: 'web-hub', path: '/web-hub', label: 'Web Parity' },
  { id: 'settings', path: '/settings', label: 'Settings' },
] as const;

test.beforeEach(async ({ page }) => {
  await stubTauriNative(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

test.describe('UX audit — global shell', () => {
  test('sidebar navigates all registered routes', async ({ page }) => {
    await gotoRoute(page, '/dashboard');
    for (const route of DESKTOP_ROUTES) {
      await page.locator('.sidebar-nav button.nav-item').filter({ hasText: route.label }).first().click();
      await expect(page).toHaveURL(new RegExp(`#${route.path.replace('/', '\\/')}`));
      await screenshotUx(page, `sidebar-${route.id}`);
    }
  });

  test('command palette opens every native route', async ({ page }) => {
    await gotoRoute(page, '/dashboard');
    for (const route of DESKTOP_ROUTES) {
      await openCommandPalette(page);
      await page.getByPlaceholder('Jump to a page or open on web…').fill(route.label);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`#${route.path.replace('/', '\\/')}`));
    }
  });

  test('404 recovery buttons work', async ({ page }) => {
    await gotoRoute(page, '/not-a-real-route');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('button', { name: 'Open Dashboard' }).click();
    await expect(page).toHaveURL(/#\/dashboard/);
  });
});

test.describe('UX audit — Settings (forms + toggles)', () => {
  test('fills every field and exercises controls', async ({ page }) => {
    await gotoRoute(page, '/settings');
    await screenshotUx(page, 'settings-initial');

    for (const section of ['Connection', 'Appearance', 'AI Configuration', 'Notifications', 'About']) {
      await page.locator('.settings-nav button').filter({ hasText: section }).click();
    }

    await page.locator('.env-btn').filter({ hasText: 'Local' }).click();
    await page.locator('.env-btn').filter({ hasText: 'Sandbox' }).click();
    await page.locator('.env-btn').filter({ hasText: 'Custom' }).click();
    await page.getByPlaceholder('https://api.yourdomain.com').fill('http://127.0.0.1:3001');

    for (const theme of ['Light', 'Dark', 'System']) {
      await page.locator('.theme-btn').filter({ hasText: theme }).click();
    }

    const filled = await fillVisibleFormFields(page);
    expect(filled).toBeGreaterThan(0);

    await screenshotUx(page, 'settings-filled');
  });
});

test.describe('UX audit — Dashboard & Forefront', () => {
  test('monitor/controls tabs and forefront panel', async ({ page }) => {
    await gotoRoute(page, '/dashboard');
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByRole('button', { name: 'Monitor', exact: true }).click();

    // Emergency stop dialog — open then cancel (do not kill relay)
    await page.getByRole('button', { name: /emergency stop/i }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.locator('.forefront-btn').filter({ hasText: 'Open Browser + Federation' }).click();
    await expect(page).toHaveURL(/#\/browser/);
    await gotoRoute(page, '/dashboard');

    await exerciseVisibleButtons(page, {
      skipLabels: [/emergency stop/i, /delete/i, /open standalone/i],
    });

    await screenshotUx(page, 'dashboard-exercised');
  });
});

test.describe('UX audit — Agent Hub', () => {
  test('filters, create modal, and form validation', async ({ page }) => {
    await gotoRoute(page, '/agents');

    for (const filter of ['All', 'Active', 'Idle', 'Error']) {
      await page.getByRole('button', { name: new RegExp(filter) }).click();
    }

    await page.getByRole('button', { name: 'Refresh' }).click();
    await page.getByRole('button', { name: '+ Create Agent' }).click();

    await expect(page.getByRole('heading', { name: 'Create New Agent' })).toBeVisible();
    const createBtn = page.getByRole('button', { name: 'Create Agent', exact: true });
    await expect(createBtn).toBeDisabled();

    await page.getByPlaceholder('e.g., Research Assistant').fill('UX Audit Agent');
    await page.locator('.form-group select').selectOption('claude');
    await page.getByPlaceholder('What does this agent do?').fill('Created during automated UX audit.');
    await expect(createBtn).toBeEnabled();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await screenshotUx(page, 'agent-hub');
  });
});

test.describe('UX audit — Multi-Agent Chat', () => {
  test('composer, agent toggles, and send flow', async ({ page }) => {
    await gotoRoute(page, '/chat');
    await fillVisibleFormFields(page);

    const sendBtn = page.getByRole('button', { name: /send/i });
    const input = page.getByPlaceholder(/type your message|select agents/i);

    if (await input.isEnabled()) {
      await input.fill('UX audit ping — please ignore.');
      await sendBtn.click();
      await expect(page.getByText(/offline|not sent|UX audit ping/i).first()).toBeVisible({
        timeout: 10000,
      });
    } else {
      await expect(input).toBeDisabled();
    }

    await screenshotUx(page, 'multi-agent-chat');
  });
});

test.describe('UX audit — A2A Control', () => {
  test('composer fields and send button state', async ({ page }) => {
    await gotoRoute(page, '/a2a');
    await page.locator('#a2a-content').fill('UX audit A2A ping — please ignore.');
    await page.locator('#a2a-type').selectOption('task');

    const targetSelect = page.locator('#a2a-target');
    if ((await targetSelect.locator('option').count()) > 1) {
      await targetSelect.selectOption({ index: 1 });
    }

    const sendBtn = page.getByRole('button', { name: 'Send A2A Message' });
    if (await sendBtn.isEnabled()) {
      await sendBtn.click();
    } else {
      await expect(sendBtn).toBeDisabled();
    }
    await screenshotUx(page, 'a2a-control');
  });
});

test.describe('UX audit — Workflow Builder', () => {
  test('name, library, save, and run', async ({ page }) => {
    await gotoRoute(page, '/workflows');

    await page.getByLabel('Workflow name').fill('UX Audit Workflow');
    await page.getByRole('button', { name: /hide library|show library/i }).click();
    await page.getByRole('button', { name: /hide library|show library/i }).click();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Run' }).click();

    await fillVisibleFormFields(page);
    await screenshotUx(page, 'workflow-builder');
  });
});

test.describe('UX audit — MCP Store', () => {
  test('search, categories, install modal', async ({ page }) => {
    await gotoRoute(page, '/mcp');

    await page.getByPlaceholder(/search/i).fill('browser');
    for (const cat of ['📊 Data', '🌐 Web', '💻 Code', '🤖 AI', '📁 Files', '🗄️ Database', '🧠 Skills']) {
      await page.getByRole('button', { name: cat }).click();
    }
    await page.getByRole('button', { name: '📦 All' }).click();

    const installBtn = page.getByRole('button', { name: /install|get/i }).first();
    if (await installBtn.isVisible().catch(() => false)) {
      await installBtn.click();
      const close = page.getByRole('button', { name: 'Close' });
      if (await close.isVisible().catch(() => false)) {
        await close.click();
      }
    }

    await screenshotUx(page, 'mcp-store');
  });
});

test.describe('UX audit — Analytics', () => {
  test('time range, tabs, export', async ({ page }) => {
    await gotoRoute(page, '/analytics');
    await page.waitForSelector('.analytics-container, .loading-container', { timeout: 15000 });

    await page.locator('.time-select').selectOption('30d');
    for (const tab of ['Overview', 'Performance', 'Agents', 'Costs']) {
      await page.locator('.analytics-container .tab-btn').filter({ hasText: tab }).click();
    }

    await page.getByRole('button', { name: 'Export' }).click();
    await screenshotUx(page, 'analytics');
  });
});

test.describe('UX audit — Knowledge Hub', () => {
  test('tabs and topology interaction', async ({ page }) => {
    await gotoRoute(page, '/knowledge');
    for (const tab of ['Topology', 'Relay Clusters', 'Memory Index']) {
      const tabBtn = page.getByRole('button', { name: tab, exact: true });
      if (await tabBtn.isVisible().catch(() => false)) {
        await tabBtn.click();
      }
    }
    await exerciseVisibleButtons(page);
    await screenshotUx(page, 'knowledge-hub');
  });
});

test.describe('UX audit — OAGI Hub (native stubs)', () => {
  test('capture, actions, and self-check', async ({ page }) => {
    await gotoRoute(page, '/oagi');
    await expect(page.getByRole('heading', { name: 'OAGI Hub' })).toBeVisible();
    await page.getByRole('button', { name: 'Capture Now' }).click();
    await page.getByRole('button', { name: 'Move & Left Click' }).click();
    await page.getByRole('button', { name: 'Scroll Up' }).click();
    await page.getByRole('button', { name: 'Scroll Down' }).click();
    await page.getByRole('button', { name: 'Type Test Text' }).click();
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.locator('.script-item').filter({ hasText: 'Self-Check' }).getByRole('button', { name: 'Run' }).click();

    await screenshotUx(page, 'oagi-hub');
  });
});

test.describe('UX audit — Antigravity', () => {
  test('connection modal and action cards', async ({ page }) => {
    await gotoRoute(page, '/antigravity');
    const connectBtn = page.getByRole('button', { name: /connect|connection/i }).first();
    if (await connectBtn.isVisible().catch(() => false)) {
      await connectBtn.click();
      await page.getByPlaceholder('http://localhost:3000').fill('http://127.0.0.1:8080');
      await page.getByPlaceholder('Enter CSRF token if required').fill('audit-token');
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
    await exerciseVisibleButtons(page, { skipLabels: [/disconnect/i] });
    await screenshotUx(page, 'antigravity');
  });
});

test.describe('UX audit — Browser Control', () => {
  test('tabs, url bar, and panel buttons', async ({ page }) => {
    await gotoRoute(page, '/browser');
    await fillVisibleFormFields(page);
    await exerciseVisibleButtons(page, { maxClicks: 30 });
    await screenshotUx(page, 'browser-control');
  });
});

test.describe('UX audit — Swarm Terminal', () => {
  test('refresh and flush controls', async ({ page }) => {
    await gotoRoute(page, '/terminal');
    await page.getByRole('button', { name: 'Refresh' }).click();
    await page.getByRole('button', { name: 'Force Swarm Flush' }).click();
    await screenshotUx(page, 'swarm-terminal');
  });
});

test.describe('UX audit — Web Parity Hub', () => {
  test('search, categories, and route jumps', async ({ page }) => {
    await gotoRoute(page, '/web-hub');

    await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Browser Control' }) })
      .getByRole('button', { name: 'Open Native' }).click();
    await expect(page).toHaveURL(/#\/browser/);

    await gotoRoute(page, '/web-hub');
    await page.getByPlaceholder('Search surfaces...').fill('workflow');
    for (const cat of ['Core', 'Agents', 'Workflows', 'Workspace']) {
      const btn = page.getByRole('button', { name: cat, exact: true });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
      }
    }
    await screenshotUx(page, 'web-parity');
  });
});

test.describe('UX audit — Platform overview', () => {
  test('feature cards navigate', async ({ page }) => {
    await gotoRoute(page, '/platform');
    await page.getByRole('button', { name: 'Web Parity Hub' }).click();
    await expect(page).toHaveURL(/#\/web-hub/);
    await screenshotUx(page, 'platform');
  });
});

test.describe('UX audit — exhaustive button sweep per route', () => {
  for (const route of DESKTOP_ROUTES) {
    test(`${route.path} — exercise visible controls`, async ({ page }) => {
      await gotoRoute(page, route.path);
      await page.waitForTimeout(500);
      if (route.path === '/browser') {
        await page.getByPlaceholder(/search or enter website/i).fill('https://example.com');
        await page.getByRole('button', { name: 'Refresh' }).click({ timeout: 5000 }).catch(() => undefined);
        await screenshotUx(page, `sweep-${route.id}`);
        return;
      }
      await fillVisibleFormFields(page);
      const result = await exerciseVisibleButtons(page, {
        maxClicks: route.path === '/browser' ? 15 : 80,
        skipLabels: route.path === '/browser' ? [/connect|native|screenshot|analyze|session/i] : undefined,
      });
      expect(result.clicked.length + result.skipped.length).toBeGreaterThan(0);
      await screenshotUx(page, `sweep-${route.id}`);
    });
  }
});
