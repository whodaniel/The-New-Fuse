import { Page, TestInfo } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { WorkflowEditorPage } from '../pages/workflow-editor.page';
import { SettingsPage } from '../pages/settings.page';
import { TestHelpers } from '../utils/test-helpers.js';
import { TestReporter } from '../utils/test-reporter.js';
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
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & CustomFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export { expect } from '@playwright/test';
//# sourceMappingURL=test.fixture.d.ts.map