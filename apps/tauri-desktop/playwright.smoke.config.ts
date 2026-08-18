import { defineConfig, devices } from '@playwright/test';

/** Smoke against the already-running Vite tauri-desktop server on :1420. */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/tauri-hardening-smoke.spec.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:1420',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
    // Prefer installed Google Chrome — avoids downloading Playwright Chromium under low disk.
    channel: 'chrome',
  },
});
