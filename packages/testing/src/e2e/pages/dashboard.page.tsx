import { Page } from '@playwright/test';
import { BasePage } from './base.page.js';

export class DashboardPage extends BasePage {
  // Selectors
  private readonly createWorkflowButton = '[data-testid="create-workflow-btn"]';
  private readonly workflowList = '[data-testid="workflow-list"]';
  private readonly workflowItem = '[data-testid="workflow-item"]';
  private readonly workflowStatus = '[data-testid="workflow-status"]';
  private readonly searchInput = '[data-testid="search-workflows"]';
  private readonly filterDropdown = '[data-testid="filter-workflows"]';
  private readonly userMenu = '[data-testid="user-menu"]';

  constructor(page: Page) {
    super(page);
  }

  async navigateToDashboard() {
    await this.navigate('/dashboard');
    await this.waitForLoad();
  }

  async createNewWorkflow() {
    await this.waitAndClick(this.createWorkflowButton);
    await this.waitForLoad();
  }

  async getWorkflowCount(): Promise<number> {
    await this.page.waitForSelector(this.workflowList);
    return this.page.locator(this.workflowItem).count();
  }

  async searchWorkflows(query: string) {
    await this.waitAndFill(this.searchInput, query);
    await this.page.waitForTimeout(500); // Wait for search debounce
  }

  async filterWorkflows(status: 'active' | 'completed' | 'failed') {
    await this.waitAndClick(this.filterDropdown);
    await this.waitAndClick(`[data-value="${status}"]`);
    await this.waitForLoad();
  }

  async openWorkflow(name: string) {
    await this.page.click(`${this.workflowItem}:has-text("${name}")`);
    await this.waitForLoad();
  }

  async getWorkflowStatus(name: string): Promise<string | null> {
    const workflow = this.page.locator(`${this.workflowItem}:has-text("${name}")`);
    const status = workflow.locator(this.workflowStatus);
    return status.textContent();
  }

  async openUserMenu() {
    await this.waitAndClick(this.userMenu);
  }

  async isDashboardLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.workflowList, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}