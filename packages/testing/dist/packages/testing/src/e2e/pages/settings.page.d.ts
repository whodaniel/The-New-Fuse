import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export declare class SettingsPage extends BasePage {
    private readonly profileTab;
    private readonly workflowTab;
    private readonly securityTab;
    private readonly notificationsTab;
    private readonly displayNameInput;
    private readonly emailInput;
    private readonly passwordInput;
    private readonly saveButton;
    private readonly notificationToggle;
    private readonly workflowAutoSaveToggle;
    private readonly successMessage;
    private readonly errorMessage;
    constructor(page: Page);
    navigateToSettings(): Promise<void>;
    switchToTab(tab: 'profile' | 'workflow' | 'security' | 'notifications'): Promise<void>;
    updateProfile(displayName: string, email: string): Promise<void>;
    updatePassword(currentPassword: string, newPassword: string): Promise<void>;
    toggleNotification(type: string): Promise<void>;
    toggleWorkflowAutoSave(): Promise<void>;
    getSuccessMessage(): Promise<string | null>;
    getErrorMessage(): Promise<string | null>;
    getCurrentSettings(): Promise<Record<string, any>>;
}
//# sourceMappingURL=settings.page.d.ts.map