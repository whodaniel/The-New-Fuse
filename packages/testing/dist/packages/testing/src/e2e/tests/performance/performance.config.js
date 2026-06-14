"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_config_1 = require("../../config/test-config");
const config = {
    ...test_config_1.config, // Cast baseConfig to ensure 'use' is recognized
    testDir: './performance',
    workers: 1, // Run performance tests serially
    timeout: 60000,
    reportSlowTests: {
        max: 0,
        threshold: 60000
    },
    use: {
        ...test_config_1.config.use, // Cast baseConfig here too
        viewport: { width: 1920, height: 1080 },
        actionTimeout: 10000,
        navigationTimeout: 30000,
        trace: 'retain-on-failure',
        video: {
            mode: 'retain-on-failure',
            size: { width: 1920, height: 1080 }
        }
    },
    reporter: [
        ['html', { outputFolder: '../../../playwright-report/performance' }],
        ['json', { outputFile: '../../../test-results/performance.json' }]
    ],
    projects: [
        {
            name: 'chromium-perf',
            use: {
                browserName: 'chromium',
                // Performance-specific browser settings
                launchOptions: {
                    args: [
                        '--disable-dev-shm-usage',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                        '--disable-extensions'
                    ]
                }
            }
        }
    ]
};
exports.default = config;
//# sourceMappingURL=performance.config.js.map