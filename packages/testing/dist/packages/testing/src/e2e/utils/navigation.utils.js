"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationUtils = void 0;
const base_page_1 = require("../pages/base.page");
const test_config_1 = require("../config/test-config");
class NavigationUtils extends base_page_1.BasePage {
    constructor(page) {
        super(page);
        this.navMenu = '[data-testid="nav-menu"]';
        this.sidebarToggle = '[data-testid="sidebar-toggle"]';
        this.loadingIndicator = '[data-testid="loading-indicator"]';
    }
    async navigateToSection(section) {
        await this.waitAndClick(`${this.navMenu} [data-section="${section}"]`);
        await this.waitForLoad();
    }
    async toggleSidebar() {
        await this.waitAndClick(this.sidebarToggle);
    }
    async waitForNavigation() {
        await this.page.waitForNavigation();
        await this.waitForLoad();
    }
    async waitForLoadingToComplete() {
        try {
            await this.page.waitForSelector(this.loadingIndicator);
            await this.page.waitForSelector(this.loadingIndicator, { state: 'hidden' });
        }
        catch {
            // Loading indicator might not appear if load is very fast
        }
    }
    async refreshPage() {
        await this.page.reload();
        await this.waitForLoad();
    }
    async goBack() {
        await this.page.goBack();
        await this.waitForLoad();
    }
    async goForward() {
        await this.page.goForward();
        await this.waitForLoad();
    }
    async waitForUrl(urlPattern) {
        await this.page.waitForURL(urlPattern);
    }
    async getCurrentSection() {
        const url = await this.getCurrentUrl();
        const path = url.replace(test_config_1.config.baseUrl, '').split('/')[1];
        return path || 'dashboard';
    }
}
exports.NavigationUtils = NavigationUtils;
//# sourceMappingURL=navigation.utils.js.map