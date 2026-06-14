"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardPage = void 0;
const base_page_1 = require("./base.page");
class DashboardPage extends base_page_1.BasePage {
    constructor(page) {
        super(page);
        // Selectors
        this.createWorkflowButton = '[data-testid="create-workflow-btn"]';
        this.workflowList = '[data-testid="workflow-list"]';
        this.workflowItem = '[data-testid="workflow-item"]';
        this.workflowStatus = '[data-testid="workflow-status"]';
        this.searchInput = '[data-testid="search-workflows"]';
        this.filterDropdown = '[data-testid="filter-workflows"]';
        this.userMenu = '[data-testid="user-menu"]';
    }
    async navigateToDashboard() {
        await this.navigate('/dashboard');
        await this.waitForLoad();
    }
    async createNewWorkflow() {
        await this.waitAndClick(this.createWorkflowButton);
        await this.waitForLoad();
    }
    async getWorkflowCount() {
        await this.page.waitForSelector(this.workflowList);
        return this.page.locator(this.workflowItem).count();
    }
    async searchWorkflows(query) {
        await this.waitAndFill(this.searchInput, query);
        await this.page.waitForTimeout(500); // Wait for search debounce
    }
    async filterWorkflows(status) {
        await this.waitAndClick(this.filterDropdown);
        await this.waitAndClick(`[data-value="${status}"]`);
        await this.waitForLoad();
    }
    async openWorkflow(name) {
        await this.page.click(`${this.workflowItem}:has-text("${name}")`);
        await this.waitForLoad();
    }
    async getWorkflowStatus(name) {
        const workflow = this.page.locator(`${this.workflowItem}:has-text("${name}")`);
        const status = workflow.locator(this.workflowStatus);
        return status.textContent();
    }
    async openUserMenu() {
        await this.waitAndClick(this.userMenu);
    }
    async isDashboardLoaded() {
        try {
            await this.page.waitForSelector(this.workflowList, { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.DashboardPage = DashboardPage;
//# sourceMappingURL=dashboard.page.js.map