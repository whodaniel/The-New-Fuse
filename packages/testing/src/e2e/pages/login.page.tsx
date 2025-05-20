import { Page } from '@playwright/test';
import { BasePage } from './base.page.js';

export class LoginPage extends BasePage {
  // Selectors
  private readonly usernameInput = 'input[name="username"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly loginButton = 'button[type="submit"]';
  private readonly rememberMeCheckbox = 'input[name="remember"]';
  private readonly errorMessage = '[data-testid="error-message"]';

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin() {
    await this.navigate('/login');
    await this.waitForLoad();
  }

  async login(username: string, password: string, rememberMe = false) {
    await this.waitAndFill(this.usernameInput, username);
    await this.waitAndFill(this.passwordInput, password);
    
    if (rememberMe) {
      await this.waitAndClick(this.rememberMeCheckbox);
    }
    
    await this.waitAndClick(this.loginButton);
    await this.waitForLoad();
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.page.waitForSelector(this.errorMessage, { timeout: 5000 });
      return this.page.textContent(this.errorMessage);
    } catch {
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    return !currentUrl.includes('/login');
  }
}