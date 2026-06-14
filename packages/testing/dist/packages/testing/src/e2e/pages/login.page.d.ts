import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export declare class LoginPage extends BasePage {
    private readonly usernameInput;
    private readonly passwordInput;
    private readonly loginButton;
    private readonly rememberMeCheckbox;
    private readonly errorMessage;
    constructor(page: Page);
    navigateToLogin(): Promise<void>;
    login(username: string, password: string, rememberMe?: boolean): Promise<void>;
    getErrorMessage(): Promise<string | null>;
    isLoggedIn(): Promise<boolean>;
}
//# sourceMappingURL=login.page.d.ts.map