import { chromium, FullConfig } from '@playwright/test';
import { config } from './config/test-config.js';
import { TestDataManager } from './utils/test-data.js';

async function globalSetup(fullConfig: FullConfig): Promise<void> {
  // Set up browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Initialize test data manager
  const testData = new TestDataManager(page);

  try {
    // Create test admin user if doesn't exist
    await page.request.post(`${config.apiUrl}/api/auth/register`, {
      data: {
        username: config.userPool.admin.username,
        password: config.userPool.admin.password,
        email: 'admin@example.com',
        isAdmin: true
      }
    });

    // Set up any required test data
    const testUser = await testData.createTestUser();
    
    // Store test data for use in tests
    process.env.TEST_USER_ID = testUser.id;
    process.env.TEST_USER_USERNAME = testUser.username;
    process.env.TEST_USER_PASSWORD = testUser.password;

  } catch (error) {
    console.error('Failed to set up test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;