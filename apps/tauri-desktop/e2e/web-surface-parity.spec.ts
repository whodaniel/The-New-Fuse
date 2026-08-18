import { test, expect } from '@playwright/test';

/**
 * Cross-checks thenewfuse.com public surfaces vs desktop WEB_SURFACES registry.
 * Authenticated routes require Google OAuth — this verifies reachability + SPA shell.
 */
const WEB_BASE = process.env.TNF_WEB_BASE_URL || 'https://thenewfuse.com';

const SURFACES: { path: string; name: string; nativeRoute?: string }[] = [
  { path: '/dashboard', name: 'Dashboard', nativeRoute: '/dashboard' },
  { path: '/multi-agent-chat', name: 'Multi-Agent Chat', nativeRoute: '/chat' },
  { path: '/a2a-control', name: 'A2A Control', nativeRoute: '/a2a' },
  { path: '/knowledge-hub', name: 'Knowledge Hub', nativeRoute: '/knowledge' },
  { path: '/mcp-hub', name: 'MCP Hub', nativeRoute: '/mcp' },
  { path: '/workflows/builder', name: 'Workflow Builder', nativeRoute: '/workflows' },
  { path: '/analytics', name: 'Analytics', nativeRoute: '/analytics' },
  { path: '/auth/login', name: 'Auth Login' },
];

for (const surface of SURFACES) {
  test(`web surface reachable: ${surface.name} (${surface.path})`, async ({ request }) => {
    const url = `${WEB_BASE.replace(/\/$/, '')}${surface.path}`;
    const res = await request.get(url, { maxRedirects: 5 });
    expect(res.status(), `${url} status`).toBeLessThan(500);
    const body = await res.text();
    expect(body.length).toBeGreaterThan(500);
    expect(body.toLowerCase()).toMatch(/new fuse|the new fuse|react|vite|root/i);
  });
}

test('login page exposes Google sign-in entry (OAuth required for Super Admin)', async ({
  page,
}) => {
  await page.goto(`${WEB_BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  const googleBtn = page.getByRole('button', { name: /google|sign in/i });
  const startLink = page.getByRole('link', { name: /start building|get started/i });
  const hasAuthUi = (await googleBtn.count()) > 0 || (await startLink.count()) > 0;
  expect(hasAuthUi).toBeTruthy();
});
