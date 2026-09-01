const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:1420',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
    // Use the installed browser for live local checks; the Playwright-managed
    // Chromium binary is intentionally not downloaded on constrained TNF hosts.
    channel: 'chrome',
  },
  webServer: {
    command: 'echo',
    url: 'http://127.0.0.1:1420',
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
