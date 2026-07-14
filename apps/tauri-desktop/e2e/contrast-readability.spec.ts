import { test, expect } from '@playwright/test';
import { gotoRoute } from './helpers/interactionAudit';

/** Relative luminance (sRGB) for WCAG contrast checks */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function contrastRatio(fg: string, bg: string): number {
  const f = parseRgb(fg);
  const b = parseRgb(bg);
  if (!f || !b) return 0;
  const l1 = luminance(...f);
  const l2 = luminance(...b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function textColor(page: import('@playwright/test').Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => {
    const style = getComputedStyle(el);
    const fill = style.webkitTextFillColor;
    if (fill && fill !== 'rgba(0, 0, 0, 0)' && fill !== 'transparent') return fill;
    return style.color;
  });
}

const ROUTES = ['/dashboard', '/settings', '/analytics', '/chat', '/knowledge', '/mcp'];

for (const route of ROUTES) {
  test(`contrast: ${route} page title readable`, async ({ page }) => {
    await gotoRoute(page, route);
    const title = page.locator('.page-title, h1').first();
    await expect(title).toBeVisible();

    const color = await textColor(page, '.page-title, h1');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe('transparent');

    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const ratio = contrastRatio(color, bg);
    expect(ratio).toBeGreaterThan(4.5);
  });
}

test('contrast: sidebar nav labels readable', async ({ page }) => {
  await gotoRoute(page, '/dashboard');
  const nav = page.locator('.sidebar-nav .nav-item').first();
  await expect(nav).toBeVisible();

  const color = await nav.evaluate((el) => getComputedStyle(el).color);
  const bg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const backdrop = bg.includes('0, 0, 0, 0') ? bodyBg : bg;
  const ratio = contrastRatio(color, backdrop);
  expect(ratio).toBeGreaterThan(3);
});

test('contrast: light theme maintains readable subtitles', async ({ page }) => {
  await gotoRoute(page, '/settings');
  await page.locator('.theme-btn').filter({ hasText: 'Light' }).click();
  await page.waitForTimeout(200);

  const subtitle = page.locator('.page-subtitle').first();
  if (await subtitle.count()) {
    const color = await subtitle.evaluate((el) => getComputedStyle(el).color);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(contrastRatio(color, bg)).toBeGreaterThan(4.5);
  }
});
