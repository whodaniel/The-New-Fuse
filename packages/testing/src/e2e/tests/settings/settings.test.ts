import { test, expect } from '../../fixtures/test.fixture.js';
import { SettingsPage } from '../../pages/settings.page.js';
import { config } from '../../config/test-config.js';

test.describe('Settings', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    settingsPage = new SettingsPage(authenticatedPage);
    await settingsPage.navigateToSettings();
  });

  test('should update user profile', async () => {
    const newName = `Test User ${Date.now()}`;
    const newEmail = `test${Date.now()}@example.com`;
    
    await settingsPage.updateProfile(newName, newEmail);
    
    const successMessage = await settingsPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
    
    const settings = await settingsPage.getCurrentSettings();
    expect(settings.displayName).toBe(newName);
    expect(settings.email).toBe(newEmail);
  });

  test('should change password successfully', async () => {
    const currentPassword = config.userPool.testUser.password;
    const newPassword = `newpass${Date.now()}`;
    
    await settingsPage.updatePassword(currentPassword, newPassword);
    
    const successMessage = await settingsPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
  });

  test('should show error for invalid current password', async () => {
    const invalidPassword = 'wrongpassword';
    const newPassword = 'newpassword123';
    
    await settingsPage.updatePassword(invalidPassword, newPassword);
    
    const errorMessage = await settingsPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should toggle workflow autosave', async () => {
    await settingsPage.switchToTab('workflow');
    await settingsPage.toggleWorkflowAutoSave();
    
    const settings = await settingsPage.getCurrentSettings();
    expect(settings.autoSaveEnabled).toBe(true);
    
    // Toggle back
    await settingsPage.toggleWorkflowAutoSave();
    const updatedSettings = await settingsPage.getCurrentSettings();
    expect(updatedSettings.autoSaveEnabled).toBe(false);
  });

  test('should manage notification preferences', async () => {
    await settingsPage.switchToTab('notifications');
    
    // Toggle email notifications
    await settingsPage.toggleNotification('email');
    let successMessage = await settingsPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
    
    // Toggle in-app notifications
    await settingsPage.toggleNotification('in-app');
    successMessage = await settingsPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
  });

  test('should switch between settings tabs', async () => {
    // Test navigation between all tabs
    await settingsPage.switchToTab('workflow');
    let url = await settingsPage.getCurrentUrl();
    expect(url).toContain('workflow');
    
    await settingsPage.switchToTab('security');
    url = await settingsPage.getCurrentUrl();
    expect(url).toContain('security');
    
    await settingsPage.switchToTab('notifications');
    url = await settingsPage.getCurrentUrl();
    expect(url).toContain('notifications');
    
    await settingsPage.switchToTab('profile');
    url = await settingsPage.getCurrentUrl();
    expect(url).toContain('profile');
  });
});