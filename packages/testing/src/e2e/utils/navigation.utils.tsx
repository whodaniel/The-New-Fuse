import { Page } from '@playwright/test';
import { BasePage } from '../pages/base.page.js';
import { config } from '../config/test-config.js';

export class NavigationUtils extends BasePage {
  private readonly navMenu = '[data-testid="nav-menu"]';
  private readonly sidebarToggle = '[data-testid="sidebar-toggle"]';
  private readonly loadingIndicator = '[data-testid="loading-indicator"]';

  constructor(page: Page) {
    super(page);
  }

  async navigateToSection(section: 'dashboard' | 'workflows' | 'settings' | 'agents' | 'analytics') {
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
    } catch {
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

  async waitForUrl(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  async getCurrentSection(): Promise<string> {
    const url = await this.getCurrentUrl();
    const path = url.replace(config.baseUrl, '').split('/')[1];
    return path || 'dashboard';
  }
}