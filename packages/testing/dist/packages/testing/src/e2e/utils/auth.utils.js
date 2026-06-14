"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUtils = void 0;
const login_page_1 = require("../pages/login.page");
class AuthUtils {
    constructor(page) {
        this.page = page;
    }
    async loginAsUser(user) {
        const loginPage = new login_page_1.LoginPage(this.page);
        await loginPage.navigateToLogin();
        await loginPage.login(user.username, user.password);
    }
    async getAuthToken() {
        const token = await this.page.evaluate(() => {
            return localStorage.getItem('authToken');
        });
        return token;
    }
    async setAuthToken(token) {
        await this.page.evaluate((t) => {
            localStorage.setItem('authToken', t);
        }, token);
    }
    async clearAuth() {
        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    }
}
exports.AuthUtils = AuthUtils;
//# sourceMappingURL=auth.utils.js.map