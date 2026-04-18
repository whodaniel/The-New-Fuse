import { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';

export type AuthUser = {
  username: string;
  password: string;
};

export class AuthUtils {
  constructor(private page: Page) {}

  async loginAsUser(user: AuthUser): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await loginPage.navigateToLogin();
    await loginPage.login(user.username, user.password);
  }

  async getAuthToken(): Promise<string | null> {
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    return token;
  }

  async setAuthToken(token: string): Promise<void> {
    await this.page.evaluate((t) => {
      localStorage.setItem('authToken', t);
    }, token);
  }

  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}