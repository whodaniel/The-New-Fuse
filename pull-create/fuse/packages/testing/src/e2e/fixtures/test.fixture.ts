import { test as base, Page, TestInfo } from '@playwright/test';
import { AuthUtils, AuthUser } from '../utils/auth.utils';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { WorkflowEditorPage } from '../pages/workflow-editor.page';
import { SettingsPage } from '../pages/settings.page';
import { TestHelpers } from '../utils/test-helpers';
import { TestReporter } from '../utils/test-reporter';

// Define the types for the extended fixtures
interface CustomFixtures {
  authUtils: AuthUtils;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  workflowEditorPage: WorkflowEditorPage;
  settingsPage: SettingsPage;
  testHelpers: TestHelpers;
  authenticatedPage: Page;
  testReporter: TestReporter;
  testInfo: TestInfo;
}

// Extend basic test fixtures
export const test = base.extend<CustomFixtures>({
  authUtils: async ({ page }, use) => {
    await use(new AuthUtils(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  workflowEditorPage: async ({ page }, use) => {
    await use(new WorkflowEditorPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  testHelpers: async ({ page }, use) => {
    await use(new TestHelpers(page));
  },

  authenticatedPage: async ({ page, authUtils }, use) => {
    const testUser: AuthUser = {
      username: process.env.TEST_USER || 'testuser',
      password: process.env.TEST_PASSWORD || 'testpass'
    };

    await authUtils.loginAsUser(testUser);
    await use(page);
  },

  testReporter: async ({ page, testInfo }, use) => {
    await use(new TestReporter(page, testInfo));
  },

  testInfo: async ({ testInfo }, use) => {
    await use(testInfo);
  }
});

export { expect } from '@playwright/test';