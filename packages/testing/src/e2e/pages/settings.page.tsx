import { Page } from '@playwright/test';
import { BasePage } from './base.page.js';

export class SettingsPage extends BasePage {
  // Selectors
  private readonly profileTab = '[data-testid="profile-settings-tab"]';
  private readonly workflowTab = '[data-testid="workflow-settings-tab"]';
  private readonly securityTab = '[data-testid="security-settings-tab"]';
  private readonly notificationsTab = '[data-testid="notifications-settings-tab"]';
  
  // Form elements
  private readonly displayNameInput = '[data-testid="display-name-input"]';
  private readonly emailInput = '[data-testid="email-input"]';
  private readonly passwordInput = '[data-testid="password-input"]';
  private readonly saveButton = '[data-testid="save-settings"]';
  private readonly notificationToggle = '[data-testid="notification-toggle"]';
  private readonly workflowAutoSaveToggle = '[data-testid="workflow-autosave-toggle"]';
  private readonly successMessage = '[data-testid="success-message"]';
  private readonly errorMessage = '[data-testid="error-message"]';

  constructor(page: Page) {
    super(page);
  }

  async navigateToSettings() {
    await this.navigate('/settings');
    await this.waitForLoad();
  }

  async switchToTab(tab: 'profile' | 'workflow' | 'security' | 'notifications') {
    const tabMap = {
      profile: this.profileTab,
      workflow: this.workflowTab,
      security: this.securityTab,
      notifications: this.notificationsTab
    };
    await this.waitAndClick(tabMap[tab]);
    await this.waitForLoad();
  }

  async updateProfile(displayName: string, email: string) {
    await this.switchToTab('profile');
    await this.waitAndFill(this.displayNameInput, displayName);
    await this.waitAndFill(this.emailInput, email);
    await this.waitAndClick(this.saveButton);
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    await this.switchToTab('security');
    await this.waitAndFill('[data-testid="current-password"]', currentPassword);
    await this.waitAndFill('[data-testid="new-password"]', newPassword);
    await this.waitAndFill('[data-testid="confirm-password"]', newPassword);
    await this.waitAndClick(this.saveButton);
  }

  async toggleNotification(type: string) {
    await this.switchToTab('notifications');
    await this.waitAndClick(`${this.notificationToggle}[data-type="${type}"]`);
  }

  async toggleWorkflowAutoSave() {
    await this.switchToTab('workflow');
    await this.waitAndClick(this.workflowAutoSaveToggle);
  }

  async getSuccessMessage(): Promise<string | null> {
    try {
      await this.page.waitForSelector(this.successMessage, { timeout: 5000 });
      return this.page.locator(this.successMessage).textContent();
    } catch {
      return null;
    }
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.page.waitForSelector(this.errorMessage, { timeout: 5000 });
      return this.page.locator(this.errorMessage).textContent();
    } catch {
      return null;
    }
  }

  async getCurrentSettings(): Promise<Record<string, any>> {
    const displayName = await this.page.inputValue(this.displayNameInput);
    const email = await this.page.inputValue(this.emailInput);
    const autoSaveEnabled = await this.page.isChecked(this.workflowAutoSaveToggle);
    
    return {
      displayName,
      email,
      autoSaveEnabled
    };
  }
}