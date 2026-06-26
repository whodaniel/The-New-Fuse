import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const modKey = process.platform === 'darwin' ? 'Meta' : 'Control';

/** Stub Tauri native invokes so preview-mode e2e can exercise OAGI / terminal UI. */
export async function stubTauriNative(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const handlers: Record<string, (args?: Record<string, unknown>) => unknown> = {
      get_screen_size: () => [1920, 1080],
      get_mouse_position: () => [640, 360],
      capture_screen: () => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==',
      execute_click: () => null,
      execute_scroll: () => null,
      execute_type: () => null,
      execute_hotkey: () => null,
      wait_duration: () => null,
      write_to_shell: () => null,
      close_shell_session: () => null,
      antigravity_set_credentials: () => null,
      antigravity_smart_focus: () => null,
      antigravity_cancel_cascade: () => null,
      antigravity_validate_cascade_overlay: () => true,
      antigravity_start_recording: () => null,
      antigravity_save_recording: () => null,
    };

    const invoke = async (cmd: string, args?: Record<string, unknown>) => {
      const handler = handlers[cmd];
      if (handler) return handler(args);
      return null;
    };

    (window as unknown as { __TAURI__: { core: { invoke: typeof invoke } } }).__TAURI__ = {
      core: { invoke },
    };
  });
}

export async function gotoRoute(page: Page, path: string): Promise<void> {
  await page.goto(`/#${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

export async function screenshotUx(page: Page, slug: string): Promise<void> {
  if (!process.env.UX_AUDIT) return;
  await page.screenshot({
    path: `test-results/ux-audit/${slug}.png`,
    fullPage: true,
  });
}

/** Click every visible enabled button, skipping duplicates within the same pass. */
export async function exerciseVisibleButtons(
  page: Page,
  options: {
    skipLabels?: RegExp[];
    maxClicks?: number;
  } = {}
): Promise<{ clicked: string[]; skipped: string[] }> {
  const skipLabels = options.skipLabels ?? [
    /emergency stop/i,
    /delete/i,
    /uninstall/i,
    /disconnect/i,
    /sign out|log out/i,
    /open standalone ui/i,
    /open web app/i,
    /open on web/i,
    /thenewfuse\.com/i,
  ];
  const maxClicks = options.maxClicks ?? 80;
  const clicked: string[] = [];
  const skipped: string[] = [];

  const buttons = page.locator('button:visible');
  const count = await buttons.count();

  for (let i = 0; i < count && clicked.length < maxClicks; i++) {
    const btn = buttons.nth(i);
    const disabled = await btn.isDisabled().catch(() => true);
    if (disabled) continue;

    const label =
      (await btn.getAttribute('aria-label')) ||
      (await btn.innerText()).trim() ||
      `button-${i}`;

    if (skipLabels.some((re) => re.test(label))) {
      skipped.push(label);
      continue;
    }

    try {
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 5000 });
      clicked.push(label);
      await page.waitForTimeout(150);

      // Close accidental modals with Escape or Cancel
      const cancel = page.getByRole('button', { name: /cancel|close|not now/i }).first();
      if (await cancel.isVisible().catch(() => false)) {
        await cancel.click().catch(() => undefined);
      }
    } catch {
      skipped.push(`${label} (click failed)`);
    }
  }

  return { clicked, skipped };
}

export async function fillVisibleFormFields(page: Page): Promise<number> {
  let filled = 0;

  const textInputs = page.locator(
    'input:visible:not([type="checkbox"]):not([type="radio"]):not([type="submit"])'
  );
  for (let i = 0; i < (await textInputs.count()); i++) {
    const input = textInputs.nth(i);
    if (await input.isDisabled()) continue;
    const type = (await input.getAttribute('type')) || 'text';
    const placeholder = (await input.getAttribute('placeholder')) || '';
    let value = 'TNF UX audit test';
    if (type === 'password' || placeholder.toLowerCase().includes('sk-')) {
      value = 'sk-test-audit-key-not-real';
    } else if (placeholder.toLowerCase().includes('url') || type === 'url') {
      value = 'https://api.example.com';
    } else if (placeholder.toLowerCase().includes('http')) {
      value = 'https://example.com';
    }
    await input.fill(value);
    filled++;
  }

  const textareas = page.locator('textarea:visible');
  for (let i = 0; i < (await textareas.count()); i++) {
    const area = textareas.nth(i);
    if (await area.isDisabled()) continue;
    await area.fill('Automated UX audit message — verify composer accepts input.');
    filled++;
  }

  const selects = page.locator('select:visible');
  for (let i = 0; i < (await selects.count()); i++) {
    const select = selects.nth(i);
    if (await select.isDisabled()) continue;
    const options = select.locator('option');
    const optionCount = await options.count();
    if (optionCount > 1) {
      await select.selectOption({ index: 1 });
      filled++;
    }
  }

  return filled;
}

export async function expectNoSevereConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!/favicon|ResizeObserver|Loading chunk|net::ERR|WebSocket|relay|API offline/i.test(text)) {
        errors.push(text);
      }
    }
  });
  return errors;
}

export async function openCommandPalette(page: Page): Promise<void> {
  await page.keyboard.press(`${modKey}+KeyK`);
  await expect(page.getByPlaceholder('Jump to a page or open on web…')).toBeVisible();
}
