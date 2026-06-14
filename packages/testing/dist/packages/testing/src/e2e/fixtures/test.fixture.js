"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const auth_utils_1 = require("../utils/auth.utils");
const login_page_1 = require("../pages/login.page");
const dashboard_page_1 = require("../pages/dashboard.page");
const workflow_editor_page_1 = require("../pages/workflow-editor.page");
const settings_page_1 = require("../pages/settings.page");
const test_helpers_js_1 = require("../utils/test-helpers.js");
const test_reporter_js_1 = require("../utils/test-reporter.js");
// Extend basic test fixtures
exports.test = test_1.test.extend({
    authUtils: async ({ page }, use) => {
        await use(new auth_utils_1.AuthUtils(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new login_page_1.LoginPage(page));
    },
    dashboardPage: async ({ page }, use) => {
        await use(new dashboard_page_1.DashboardPage(page));
    },
    workflowEditorPage: async ({ page }, use) => {
        await use(new workflow_editor_page_1.WorkflowEditorPage(page));
    },
    settingsPage: async ({ page }, use) => {
        await use(new settings_page_1.SettingsPage(page));
    },
    testHelpers: async ({ page }, use) => {
        await use(new test_helpers_js_1.TestHelpers(page));
    },
    authenticatedPage: async ({ page, authUtils }, use) => {
        const testUser = {
            username: process.env.TEST_USER || 'testuser',
            password: process.env.TEST_PASSWORD || 'testpass'
        };
        await authUtils.loginAsUser(testUser);
        await use(page);
    },
    testReporter: async ({ page, testInfo }, use) => {
        await use(new test_reporter_js_1.TestReporter(page, testInfo));
    },
    testInfo: async ({ testInfo }, use) => {
        await use(testInfo);
    }
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
//# sourceMappingURL=test.fixture.js.map