import { test as base, Page, TestInfo } from '@playwright/test';
import { NavigationUtils } from '../utils/navigation.utils.js';
import { TestHelpers } from '../utils/test-helpers.js';
import { TestReporter } from '../utils/test-reporter.js';
import { DashboardPage } from '../pages/dashboard.page.js';
import { WorkflowEditorPage } from '../pages/workflow-editor.page.js';
import { SettingsPage } from '../pages/settings.page.js';

type CustomFixtures = {
  navigationUtils: NavigationUtils;
  testHelpers: TestHelpers;
  testReporter: TestReporter;
  dashboardPage: DashboardPage;
  workflowEditor: WorkflowEditorPage;
  settingsPage: SettingsPage;
};

// Extend base test with our custom fixtures
export const test = base.extend<CustomFixtures>({
  // Add navigation utilities
  navigationUtils: async ({ page }, use) => {
    const navigation = new NavigationUtils(page);
    await use(navigation);
  },

  // Add test helpers
  testHelpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page);
    await use(helpers);
    // Clean up after each test
    await helpers.cleanupTestData();
  },

  // Add test reporter
  testReporter: async ({ page }, use, testInfo) => {
    const reporter = new TestReporter(page, testInfo);
    await reporter.startVideoRecording();
    await use(reporter);
    // Save video on failure
    if (testInfo.status !== 'passed') {
      await reporter.stopVideoRecording(testInfo.title.replace(/\s+/g, '-'));
      await reporter.captureScreenshot(`${testInfo.title.replace(/\s+/g, '-')}-failure`);
    }
  },

  // Add page objects
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  workflowEditor: async ({ page }, use) => {
    await use(new WorkflowEditorPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
});

export { expect } from '@playwright/test';