import { chromium, FullConfig } from '@playwright/test';
import { config } from './config/test-config.js';
import { TestDataManager } from './utils/test-data.js';

async function globalTeardown(_fullConfig: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const testData = new TestDataManager(page);

  try {
    // Clean up test data
    await testData.cleanup();

    // Clean up test users except admin
    if (process.env.TEST_USER_ID) {
      await page.request.delete(`${config.apiUrl}/api/users/${process.env.TEST_USER_ID}`);
    }

    // Clean up test workflows
    await page.request.delete(`${config.apiUrl}/api/workflows/test-*`);

    // Clear test databases if needed
    // Note: In CI, we typically use fresh databases per run, so this might not be necessary
    if (process.env.TEST_ENV === 'local') {
      await page.request.post(`${config.apiUrl}/api/testing/reset-db`);
    }
  } catch (error) {
    console.error('Failed to clean up test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalTeardown;