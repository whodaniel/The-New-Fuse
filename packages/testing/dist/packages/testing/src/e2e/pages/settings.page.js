"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsPage = void 0;
const base_page_1 = require("./base.page");
class SettingsPage extends base_page_1.BasePage {
    constructor(page) {
        super(page);
        // Selectors
        this.profileTab = '[data-testid="profile-settings-tab"]';
        this.workflowTab = '[data-testid="workflow-settings-tab"]';
        this.securityTab = '[data-testid="security-settings-tab"]';
        this.notificationsTab = '[data-testid="notifications-settings-tab"]';
        // Form elements
        this.displayNameInput = '[data-testid="display-name-input"]';
        this.emailInput = '[data-testid="email-input"]';
        this.passwordInput = '[data-testid="password-input"]';
        this.saveButton = '[data-testid="save-settings"]';
        this.notificationToggle = '[data-testid="notification-toggle"]';
        this.workflowAutoSaveToggle = '[data-testid="workflow-autosave-toggle"]';
        this.successMessage = '[data-testid="success-message"]';
        this.errorMessage = '[data-testid="error-message"]';
    }
    async navigateToSettings() {
        await this.navigate('/settings');
        await this.waitForLoad();
    }
    async switchToTab(tab) {
        const tabMap = {
            profile: this.profileTab,
            workflow: this.workflowTab,
            security: this.securityTab,
            notifications: this.notificationsTab
        };
        await this.waitAndClick(tabMap[tab]);
        await this.waitForLoad();
    }
    async updateProfile(displayName, email) {
        await this.switchToTab('profile');
        await this.waitAndFill(this.displayNameInput, displayName);
        await this.waitAndFill(this.emailInput, email);
        await this.waitAndClick(this.saveButton);
    }
    async updatePassword(currentPassword, newPassword) {
        await this.switchToTab('security');
        await this.waitAndFill('[data-testid="current-password"]', currentPassword);
        await this.waitAndFill('[data-testid="new-password"]', newPassword);
        await this.waitAndFill('[data-testid="confirm-password"]', newPassword);
        await this.waitAndClick(this.saveButton);
    }
    async toggleNotification(type) {
        await this.switchToTab('notifications');
        await this.waitAndClick(`${this.notificationToggle}[data-type="${type}"]`);
    }
    async toggleWorkflowAutoSave() {
        await this.switchToTab('workflow');
        await this.waitAndClick(this.workflowAutoSaveToggle);
    }
    async getSuccessMessage() {
        try {
            await this.page.waitForSelector(this.successMessage, { timeout: 5000 });
            return this.page.locator(this.successMessage).textContent();
        }
        catch {
            return null;
        }
    }
    async getErrorMessage() {
        try {
            await this.page.waitForSelector(this.errorMessage, { timeout: 5000 });
            return this.page.locator(this.errorMessage).textContent();
        }
        catch {
            return null;
        }
    }
    async getCurrentSettings() {
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
exports.SettingsPage = SettingsPage;
//# sourceMappingURL=settings.page.js.map