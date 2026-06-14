"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const navigation_utils_1 = require("../utils/navigation.utils");
const test_helpers_1 = require("../utils/test-helpers");
const test_reporter_1 = require("../utils/test-reporter");
const dashboard_page_1 = require("../pages/dashboard.page");
const workflow_editor_page_1 = require("../pages/workflow-editor.page");
const settings_page_1 = require("../pages/settings.page");
// Extend base test with our custom fixtures
exports.test = test_1.test.extend({
    // Add navigation utilities
    navigationUtils: async ({ page }, use) => {
        const navigation = new navigation_utils_1.NavigationUtils(page);
        await use(navigation);
    },
    // Add test helpers
    testHelpers: async ({ page }, use) => {
        const helpers = new test_helpers_1.TestHelpers(page);
        await use(helpers);
        // Clean up after each test
        await helpers.cleanupTestData();
    },
    // Add test reporter
    testReporter: async ({ page }, use, testInfo) => {
        const reporter = new test_reporter_1.TestReporter(page, testInfo);
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
        await use(new dashboard_page_1.DashboardPage(page));
    },
    workflowEditor: async ({ page }, use) => {
        await use(new workflow_editor_page_1.WorkflowEditorPage(page));
    },
    settingsPage: async ({ page }, use) => {
        await use(new settings_page_1.SettingsPage(page));
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
//# sourceMappingURL=custom-test.js.map