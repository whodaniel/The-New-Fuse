"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualTesting = void 0;
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class VisualTesting {
    constructor(page, testInfo, snapshotsDir = 'visual-snapshots') {
        this.page = page;
        this.testInfo = testInfo;
        this.snapshotsDir = snapshotsDir;
    }
    getSnapshotPath(name) {
        return path_1.default.join(this.snapshotsDir, `${name}.png`);
    }
    async compareScreenshot(name, locator, threshold = 0.1) {
        const snapshotPath = this.getSnapshotPath(name);
        // Take new screenshot
        const screenshot = locator
            ? await this.page.locator(locator).screenshot()
            : await this.page.screenshot();
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(this.snapshotsDir)) {
            fs_1.default.mkdirSync(this.snapshotsDir, { recursive: true });
        }
        // If baseline doesn't exist, create it
        if (!fs_1.default.existsSync(snapshotPath)) {
            fs_1.default.writeFileSync(snapshotPath, screenshot);
            this.testInfo.annotations.push({
                type: 'info',
                description: `Created new baseline for ${name}`
            });
            return;
        }
        // Compare with baseline
        const baseline = fs_1.default.readFileSync(snapshotPath);
        await (0, test_1.expect)(screenshot).toMatchSnapshot(baseline, {
            threshold,
            maxDiffPixelRatio: 0.1
        });
    }
    async updateBaseline(name, locator) {
        const screenshot = locator
            ? await this.page.locator(locator).screenshot()
            : await this.page.screenshot();
        const snapshotPath = this.getSnapshotPath(name);
        fs_1.default.writeFileSync(snapshotPath, screenshot);
    }
    async compareElement(selector, name) {
        await this.compareScreenshot(`${name}-element`, selector, 0.05 // Stricter threshold for specific elements
        );
    }
    async compareFullPage(name) {
        await this.page.evaluate(() => window.scrollTo(0, 0));
        await this.compareScreenshot(`${name}-full`, undefined, 0.1);
    }
    async compareResponsive(name, viewports = [
        { width: 1920, height: 1080 },
        { width: 1280, height: 720 },
        { width: 768, height: 1024 },
        { width: 375, height: 812 }
    ]) {
        for (const viewport of viewports) {
            await this.page.setViewportSize(viewport);
            await this.compareScreenshot(`${name}-${viewport.width}x${viewport.height}`, undefined, 0.1);
        }
    }
    async captureInteractionStates(selector, name, states = ['hover', 'focus', 'active']) {
        const element = this.page.locator(selector);
        // Capture default state
        await this.compareElement(selector, `${name}-default`);
        // Capture each interaction state
        for (const state of states) {
            switch (state) {
                case 'hover':
                    await element.hover();
                    break;
                case 'focus':
                    await element.focus();
                    break;
                case 'active':
                    await element.click({ noWaitAfter: true });
                    break;
            }
            await this.compareElement(selector, `${name}-${state}`);
        }
    }
}
exports.VisualTesting = VisualTesting;
//# sourceMappingURL=visual-testing.js.map