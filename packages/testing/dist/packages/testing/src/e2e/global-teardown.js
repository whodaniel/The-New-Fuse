"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_config_js_1 = require("./config/test-config.js");
const test_data_js_1 = require("./utils/test-data.js");
async function globalTeardown(_fullConfig) {
    const browser = await test_1.chromium.launch();
    const page = await browser.newPage();
    const testData = new test_data_js_1.TestDataManager(page);
    try {
        // Clean up test data
        await testData.cleanup();
        // Clean up test users except admin
        if (process.env.TEST_USER_ID) {
            await page.request.delete(`${test_config_js_1.config.apiUrl}/api/users/${process.env.TEST_USER_ID}`);
        }
        // Clean up test workflows
        await page.request.delete(`${test_config_js_1.config.apiUrl}/api/workflows/test-*`);
        // Clear test databases if needed
        // Note: In CI, we typically use fresh databases per run, so this might not be necessary
        if (process.env.TEST_ENV === 'local') {
            await page.request.post(`${test_config_js_1.config.apiUrl}/api/testing/reset-db`);
        }
    }
    catch (error) {
        throw new Error(`Failed to clean up test environment: ${error}`);
    }
    finally {
        await browser.close();
    }
}
exports.default = globalTeardown;
//# sourceMappingURL=global-teardown.js.map