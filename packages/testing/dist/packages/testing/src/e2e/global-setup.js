"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_config_js_1 = require("./config/test-config.js");
const test_data_js_1 = require("./utils/test-data.js");
async function globalSetup(_fullConfig) {
    // Set up browser
    const browser = await test_1.chromium.launch();
    const page = await browser.newPage();
    // Initialize test data manager
    const testData = new test_data_js_1.TestDataManager(page);
    try {
        // Create test admin user if doesn't exist
        await page.request.post(`${test_config_js_1.config.apiUrl}/api/auth/register`, {
            data: {
                username: test_config_js_1.config.userPool.admin.username,
                password: test_config_js_1.config.userPool.admin.password,
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
    }
    catch (error) {
        throw new Error(`Failed to set up test environment: ${error}`);
    }
    finally {
        await browser.close();
    }
}
exports.default = globalSetup;
//# sourceMappingURL=global-setup.js.map