"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
class BasePage {
    constructor(page) {
        this.page = page;
    }
    async navigate(path) {
        await this.page.goto(path);
    }
    async waitForLoad() {
        await this.page.waitForLoadState('networkidle');
    }
    async waitAndClick(selector) {
        await this.page.waitForSelector(selector);
        await this.page.click(selector);
    }
    async waitAndFill(selector, value) {
        await this.page.waitForSelector(selector);
        await this.page.fill(selector, value);
    }
    async takeScreenshot(name) {
        await this.page.screenshot({
            path: `./screenshots/${name}.png`,
            fullPage: true
        });
    }
    async getCurrentUrl() {
        return this.page.url();
    }
}
exports.BasePage = BasePage;
//# sourceMappingURL=base.page.js.map