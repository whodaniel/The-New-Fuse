import { NavigationUtils } from '../utils/navigation.utils';
import { TestHelpers } from '../utils/test-helpers';
import { TestReporter } from '../utils/test-reporter';
import { DashboardPage } from '../pages/dashboard.page';
import { WorkflowEditorPage } from '../pages/workflow-editor.page';
import { SettingsPage } from '../pages/settings.page';
type CustomFixtures = {
    navigationUtils: NavigationUtils;
    testHelpers: TestHelpers;
    testReporter: TestReporter;
    dashboardPage: DashboardPage;
    workflowEditor: WorkflowEditorPage;
    settingsPage: SettingsPage;
};
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & CustomFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export { expect } from '@playwright/test';
//# sourceMappingURL=custom-test.d.ts.map