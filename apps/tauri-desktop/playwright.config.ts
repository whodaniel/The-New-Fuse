import { defineConfig, devices } from '@playwright/test';

const previewPort = Number(process.env.PREVIEW_PORT || 4173);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: `http://127.0.0.1:${previewPort}`,
    // Never reuse an existing server in CI or when a caller pins PREVIEW_PORT
    // (the QA gate uses a unique port to guarantee it tests the fresh build).
    reuseExistingServer: !process.env.CI && !process.env.PREVIEW_PORT,
    timeout: 120_000,
  },
});
