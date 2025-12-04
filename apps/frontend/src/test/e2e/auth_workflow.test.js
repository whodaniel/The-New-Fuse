var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { spawn } from 'child_process';
import * as http from 'http';
describe('Authentication E2E Tests', function () {
    var driver;
    var devServer;
    var waitForServer = function (url, timeout) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var startTime = Date.now();
                    var checkServer = function () {
                        http.get(url, function (res) {
                            if (res.statusCode === 200) {
                                resolve();
                            }
                            else {
                                retry();
                            }
                        }).on('error', retry);
                        function retry() {
                            var elapsed = Date.now() - startTime;
                            if (elapsed > timeout) {
                                reject(new Error("Server not ready after ".concat(timeout, "ms")));
                            }
                            else {
                                setTimeout(checkServer, 1000);
                            }
                        }
                    };
                    checkServer();
                })];
        });
    }); };
    var waitForElement = function (selector_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([selector_1], args_1, true), void 0, function (selector, timeout) {
            if (timeout === void 0) { timeout = 10000; }
            return __generator(this, function (_a) {
                return [2 /*return*/, driver.wait(until.elementLocated(By.css(selector)), timeout, "Element ".concat(selector, " not found after ").concat(timeout, "ms"))];
            });
        });
    };
    var takeScreenshotOnFailure = function (error) { return __awaiter(void 0, void 0, void 0, function () {
        var screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.error('Test failed:', error);
                    return [4 /*yield*/, driver.takeScreenshot()];
                case 1:
                    screenshot = _a.sent();
                    console.log('Screenshot:', screenshot);
                    throw error;
            }
        });
    }); };
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1, chromeOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var kill = spawn('kill', ["$(lsof -t -i:5173)"], { shell: true });
                            kill.on('close', resolve);
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    return [3 /*break*/, 3];
                case 3:
                    // Start the dev server with mock OAuth enabled
                    devServer = spawn('pnpm', ['dev'], {
                        stdio: 'inherit',
                        shell: true,
                        cwd: process.cwd(),
                        env: __assign(__assign({}, process.env), { PORT: '5173', VITE_MOCK_OAUTH: 'true' })
                    });
                    return [4 /*yield*/, waitForServer('http://localhost:5173', 30000)];
                case 4:
                    _a.sent();
                    chromeOptions = new ChromeOptions();
                    chromeOptions.addArguments('--headless');
                    chromeOptions.addArguments('--no-sandbox');
                    chromeOptions.addArguments('--disable-dev-shm-usage');
                    chromeOptions.addArguments('--window-size=1920,1080');
                    return [4 /*yield*/, new Builder()
                            .forBrowser('chrome')
                            .setChromeOptions(chromeOptions)
                            .build()];
                case 5:
                    driver = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 90000);
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!driver) return [3 /*break*/, 2];
                    return [4 /*yield*/, driver.quit()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!devServer) return [3 /*break*/, 6];
                    devServer.kill('SIGTERM');
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var kill = spawn('kill', ["$(lsof -t -i:5173)"], { shell: true });
                            kill.on('close', resolve);
                        })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, driver.get('http://localhost:5173/login')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, waitForElement('[data-testid="login-page"]')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('OAuth Authentication Flows', function () {
        test('Google Sign-In Flow - Success Path', function () { return __awaiter(void 0, void 0, void 0, function () {
            var googleButton, loadingSpinner, _a, mockOAuthPage, _b, emailInput, authorizeButton, dashboard, _c, userMenu, _d, userEmail, _e, error_3;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 18, , 20]);
                        return [4 /*yield*/, waitForElement('[data-testid="google-signin-button"]')];
                    case 1:
                        googleButton = _f.sent();
                        return [4 /*yield*/, googleButton.click()];
                    case 2:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="google-signin-loading"]')];
                    case 3:
                        loadingSpinner = _f.sent();
                        _a = expect;
                        return [4 /*yield*/, loadingSpinner.isDisplayed()];
                    case 4:
                        _a.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-page"]')];
                    case 5:
                        mockOAuthPage = _f.sent();
                        _b = expect;
                        return [4 /*yield*/, mockOAuthPage.isDisplayed()];
                    case 6:
                        _b.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-email"]')];
                    case 7:
                        emailInput = _f.sent();
                        return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                    case 8:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-authorize"]')];
                    case 9:
                        authorizeButton = _f.sent();
                        return [4 /*yield*/, authorizeButton.click()];
                    case 10:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="dashboard"]')];
                    case 11:
                        dashboard = _f.sent();
                        _c = expect;
                        return [4 /*yield*/, dashboard.isDisplayed()];
                    case 12:
                        _c.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="user-menu"]')];
                    case 13:
                        userMenu = _f.sent();
                        _d = expect;
                        return [4 /*yield*/, userMenu.isDisplayed()];
                    case 14:
                        _d.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, userMenu.click()];
                    case 15:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="user-email"]')];
                    case 16:
                        userEmail = _f.sent();
                        _e = expect;
                        return [4 /*yield*/, userEmail.getText()];
                    case 17:
                        _e.apply(void 0, [_f.sent()]).toBe('test@example.com');
                        return [3 /*break*/, 20];
                    case 18:
                        error_3 = _f.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_3)];
                    case 19:
                        _f.sent();
                        return [3 /*break*/, 20];
                    case 20: return [2 /*return*/];
                }
            });
        }); }, 45000);
        test('GitHub Sign-In Flow - Success Path', function () { return __awaiter(void 0, void 0, void 0, function () {
            var githubButton, loadingSpinner, _a, mockOAuthPage, _b, usernameInput, authorizeButton, dashboard, _c, userMenu, _d, username, _e, error_4;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 18, , 20]);
                        return [4 /*yield*/, waitForElement('[data-testid="github-signin-button"]')];
                    case 1:
                        githubButton = _f.sent();
                        return [4 /*yield*/, githubButton.click()];
                    case 2:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="github-signin-loading"]')];
                    case 3:
                        loadingSpinner = _f.sent();
                        _a = expect;
                        return [4 /*yield*/, loadingSpinner.isDisplayed()];
                    case 4:
                        _a.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-page"]')];
                    case 5:
                        mockOAuthPage = _f.sent();
                        _b = expect;
                        return [4 /*yield*/, mockOAuthPage.isDisplayed()];
                    case 6:
                        _b.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-username"]')];
                    case 7:
                        usernameInput = _f.sent();
                        return [4 /*yield*/, usernameInput.sendKeys('testuser')];
                    case 8:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-authorize"]')];
                    case 9:
                        authorizeButton = _f.sent();
                        return [4 /*yield*/, authorizeButton.click()];
                    case 10:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="dashboard"]')];
                    case 11:
                        dashboard = _f.sent();
                        _c = expect;
                        return [4 /*yield*/, dashboard.isDisplayed()];
                    case 12:
                        _c.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="user-menu"]')];
                    case 13:
                        userMenu = _f.sent();
                        _d = expect;
                        return [4 /*yield*/, userMenu.isDisplayed()];
                    case 14:
                        _d.apply(void 0, [_f.sent()]).toBe(true);
                        return [4 /*yield*/, userMenu.click()];
                    case 15:
                        _f.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="user-name"]')];
                    case 16:
                        username = _f.sent();
                        _e = expect;
                        return [4 /*yield*/, username.getText()];
                    case 17:
                        _e.apply(void 0, [_f.sent()]).toBe('testuser');
                        return [3 /*break*/, 20];
                    case 18:
                        error_4 = _f.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_4)];
                    case 19:
                        _f.sent();
                        return [3 /*break*/, 20];
                    case 20: return [2 /*return*/];
                }
            });
        }); }, 45000);
        test('OAuth Error Handling - Access Denied', function () { return __awaiter(void 0, void 0, void 0, function () {
            var errorAlert, _a, loginPage, _b, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 8]);
                        // Simulate access denied error
                        return [4 /*yield*/, driver.get('http://localhost:5173/auth/callback?error=access_denied')];
                    case 1:
                        // Simulate access denied error
                        _c.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="auth-error-alert"]')];
                    case 2:
                        errorAlert = _c.sent();
                        _a = expect;
                        return [4 /*yield*/, errorAlert.getText()];
                    case 3:
                        _a.apply(void 0, [_c.sent()]).toContain('Authentication failed');
                        return [4 /*yield*/, waitForElement('[data-testid="login-page"]')];
                    case 4:
                        loginPage = _c.sent();
                        _b = expect;
                        return [4 /*yield*/, loginPage.isDisplayed()];
                    case 5:
                        _b.apply(void 0, [_c.sent()]).toBe(true);
                        return [3 /*break*/, 8];
                    case 6:
                        error_5 = _c.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_5)];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); }, 30000);
        test('OAuth Error Handling - Network Error', function () { return __awaiter(void 0, void 0, void 0, function () {
            var errorAlert, _a, retryButton, _b, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 8]);
                        // Simulate network error by using invalid callback URL
                        return [4 /*yield*/, driver.get('http://localhost:5173/auth/callback?error=network_error')];
                    case 1:
                        // Simulate network error by using invalid callback URL
                        _c.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="auth-error-alert"]')];
                    case 2:
                        errorAlert = _c.sent();
                        _a = expect;
                        return [4 /*yield*/, errorAlert.getText()];
                    case 3:
                        _a.apply(void 0, [_c.sent()]).toContain('Network error occurred');
                        return [4 /*yield*/, waitForElement('[data-testid="auth-retry-button"]')];
                    case 4:
                        retryButton = _c.sent();
                        _b = expect;
                        return [4 /*yield*/, retryButton.isDisplayed()];
                    case 5:
                        _b.apply(void 0, [_c.sent()]).toBe(true);
                        return [3 /*break*/, 8];
                    case 6:
                        error_6 = _c.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_6)];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); }, 30000);
        test('Session Persistence', function () { return __awaiter(void 0, void 0, void 0, function () {
            var googleButton, emailInput, authorizeButton, dashboard, _a, userMenu, _b, error_7;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 13, , 15]);
                        return [4 /*yield*/, waitForElement('[data-testid="google-signin-button"]')];
                    case 1:
                        googleButton = _c.sent();
                        return [4 /*yield*/, googleButton.click()];
                    case 2:
                        _c.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-email"]')];
                    case 3:
                        emailInput = _c.sent();
                        return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                    case 4:
                        _c.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-authorize"]')];
                    case 5:
                        authorizeButton = _c.sent();
                        return [4 /*yield*/, authorizeButton.click()];
                    case 6:
                        _c.sent();
                        // Verify logged in state
                        return [4 /*yield*/, waitForElement('[data-testid="dashboard"]')];
                    case 7:
                        // Verify logged in state
                        _c.sent();
                        // Refresh page
                        return [4 /*yield*/, driver.navigate().refresh()];
                    case 8:
                        // Refresh page
                        _c.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="dashboard"]')];
                    case 9:
                        dashboard = _c.sent();
                        _a = expect;
                        return [4 /*yield*/, dashboard.isDisplayed()];
                    case 10:
                        _a.apply(void 0, [_c.sent()]).toBe(true);
                        return [4 /*yield*/, waitForElement('[data-testid="user-menu"]')];
                    case 11:
                        userMenu = _c.sent();
                        _b = expect;
                        return [4 /*yield*/, userMenu.isDisplayed()];
                    case 12:
                        _b.apply(void 0, [_c.sent()]).toBe(true);
                        return [3 /*break*/, 15];
                    case 13:
                        error_7 = _c.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_7)];
                    case 14:
                        _c.sent();
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        }); }, 60000);
        test('Logout Flow', function () { return __awaiter(void 0, void 0, void 0, function () {
            var googleButton, emailInput, authorizeButton, userMenu, logoutButton, loginPage, _a, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 16, , 18]);
                        return [4 /*yield*/, waitForElement('[data-testid="google-signin-button"]')];
                    case 1:
                        googleButton = _b.sent();
                        return [4 /*yield*/, googleButton.click()];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-email"]')];
                    case 3:
                        emailInput = _b.sent();
                        return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="mock-oauth-authorize"]')];
                    case 5:
                        authorizeButton = _b.sent();
                        return [4 /*yield*/, authorizeButton.click()];
                    case 6:
                        _b.sent();
                        // Wait for dashboard
                        return [4 /*yield*/, waitForElement('[data-testid="dashboard"]')];
                    case 7:
                        // Wait for dashboard
                        _b.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="user-menu"]')];
                    case 8:
                        userMenu = _b.sent();
                        return [4 /*yield*/, userMenu.click()];
                    case 9:
                        _b.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="logout-button"]')];
                    case 10:
                        logoutButton = _b.sent();
                        return [4 /*yield*/, logoutButton.click()];
                    case 11:
                        _b.sent();
                        return [4 /*yield*/, waitForElement('[data-testid="login-page"]')];
                    case 12:
                        loginPage = _b.sent();
                        _a = expect;
                        return [4 /*yield*/, loginPage.isDisplayed()];
                    case 13:
                        _a.apply(void 0, [_b.sent()]).toBe(true);
                        // Verify session cleared by trying to access dashboard
                        return [4 /*yield*/, driver.get('http://localhost:5173/dashboard')];
                    case 14:
                        // Verify session cleared by trying to access dashboard
                        _b.sent();
                        // Should be redirected back to login
                        return [4 /*yield*/, waitForElement('[data-testid="login-page"]')];
                    case 15:
                        // Should be redirected back to login
                        _b.sent();
                        return [3 /*break*/, 18];
                    case 16:
                        error_8 = _b.sent();
                        return [4 /*yield*/, takeScreenshotOnFailure(error_8)];
                    case 17:
                        _b.sent();
                        return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        }); }, 60000);
    });
});
