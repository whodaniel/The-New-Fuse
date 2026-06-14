"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const base_page_1 = require("./base.page");
class LoginPage extends base_page_1.BasePage {
    constructor(page) {
        super(page);
        // Selectors
        this.usernameInput = 'input[name="username"]';
        this.passwordInput = 'input[name="password"]';
        this.loginButton = 'button[type="submit"]';
        this.rememberMeCheckbox = 'input[name="remember"]';
        this.errorMessage = '[data-testid="error-message"]';
    }
    async navigateToLogin() {
        await this.navigate('/login');
        await this.waitForLoad();
    }
    async login(username, password, rememberMe = false) {
        await this.waitAndFill(this.usernameInput, username);
        await this.waitAndFill(this.passwordInput, password);
        if (rememberMe) {
            await this.waitAndClick(this.rememberMeCheckbox);
        }
        await this.waitAndClick(this.loginButton);
        await this.waitForLoad();
    }
    async getErrorMessage() {
        try {
            await this.page.waitForSelector(this.errorMessage, { timeout: 5000 });
            return this.page.textContent(this.errorMessage);
        }
        catch {
            return null;
        }
    }
    async isLoggedIn() {
        const currentUrl = await this.getCurrentUrl();
        return !currentUrl.includes('/login');
    }
}
exports.LoginPage = LoginPage;
//# sourceMappingURL=login.page.js.map