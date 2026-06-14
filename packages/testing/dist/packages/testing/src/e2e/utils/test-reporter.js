"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestReporter = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class TestReporter {
    constructor(page, testInfo) {
        this.page = page;
        this.testInfo = testInfo;
    }
    async captureScreenshot(name) {
        const screenshotPath = path_1.default.join(this.testInfo.outputDir, `${name}.png`);
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        return screenshotPath;
    }
    async startVideoRecording() {
        // await this.page.video()?.start();
    }
    async stopVideoRecording(name) {
        // const video = this.page.video();
        // if (video) {
        // await video.stop();
        // const videoPath = await video.path();
        // if (videoPath) {
        // const newPath = path.join(this.testInfo.outputDir, `${name}.webm`);
        // await fs.promises.rename(videoPath, newPath);
        // return newPath;
        // }
        // }
        return null;
    }
    async captureNetworkLogs() {
        const logs = [];
        this.page.on('request', request => {
            logs.push({
                type: 'request',
                url: request.url(),
                method: request.method(),
                timestamp: new Date().toISOString()
            });
        });
        this.page.on('response', response => {
            logs.push({
                type: 'response',
                url: response.url(),
                status: response.status(),
                timestamp: new Date().toISOString()
            });
        });
        return logs;
    }
    async saveConsoleLog(name) {
        const logs = [];
        this.page.on('console', msg => {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        });
        const logPath = path_1.default.join(this.testInfo.outputDir, `${name}-console.log`);
        await fs_1.default.promises.writeFile(logPath, logs.join('\n'));
        return logPath;
    }
    async capturePerformanceMetrics() {
        const metrics = await this.page.evaluate(() => {
            const timing = window.performance.timing;
            const navigationStart = timing.navigationStart;
            return {
                loadTime: timing.loadEventEnd - navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
                firstPaint: timing.responseStart - navigationStart,
                resourceCount: window.performance.getEntriesByType('resource').length
            };
        });
        return metrics;
    }
}
exports.TestReporter = TestReporter;
//# sourceMappingURL=test-reporter.js.map