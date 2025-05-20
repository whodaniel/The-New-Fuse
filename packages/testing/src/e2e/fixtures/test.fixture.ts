import { test as base, Page, TestInfo } from '@playwright/test'; // Import Page and TestInfo types
import { AuthUtils, AuthUser } from '../utils/auth.utils.js';
import { LoginPage } from '../pages/login.page.js';
import { TestReporter } from '../utils/test-reporter.js';

// Define the types for the extended fixtures
interface CustomFixtures {
  authUtils: AuthUtils;
  loginPage: LoginPage;
  authenticatedPage: Page; // Use Page type
  testReporter: TestReporter;
}

// Extend basic test fixtures
export const test = base.extend<CustomFixtures>({
  authUtils: async ({ page }, use) => {
    await use(new AuthUtils(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Fixture that provides an authenticated page
  authenticatedPage: async ({ page, authUtils }, use) => { // Correct dependency injection
    const testUser: AuthUser = {
      username: process.env.TEST_USER || 'testuser',
      password: process.env.TEST_PASSWORD || 'testpass'
    };

    await authUtils.loginAsUser(testUser);
    await use(page);
    // Consider if clearAuth should run after each test using this fixture
    // await authUtils.clearAuth();
  },

  // Fixture providing a TestReporter instance
  testReporter: async ({ page, testInfo }, use) => {
    await use(new TestReporter(page, testInfo));
  }
});

export { expect } from '@playwright/test';