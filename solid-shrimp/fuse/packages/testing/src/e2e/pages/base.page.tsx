import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string) {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  protected async waitAndClick(selector: string) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
  }

  protected async waitAndFill(selector: string, value: string) {
    await this.page.waitForSelector(selector);
    await this.page.fill(selector, value);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `./screenshots/${name}.png`,
      fullPage: true
    });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}