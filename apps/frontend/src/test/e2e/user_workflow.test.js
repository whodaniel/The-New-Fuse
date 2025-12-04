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
import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { spawn } from 'child_process';
import * as http from 'http';
describe('User Workflow E2E Tests', function () {
    var driver;
    var devServer;
    var waitForServer = function (url, timeout) {
        return new Promise(function (resolve, reject) {
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
        });
    };
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1, error_2, chromeOptions;
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
                    // Start the dev server
                    devServer = spawn('pnpm', ['dev'], {
                        stdio: 'inherit',
                        shell: true,
                        cwd: process.cwd(),
                        env: __assign(__assign({}, process.env), { PORT: '5173' })
                    });
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, waitForServer('http://localhost:5173', 30000)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error('Failed to start dev server:', error_2);
                    throw error_2;
                case 7:
                    chromeOptions = new ChromeOptions();
                    chromeOptions.addArguments('--headless');
                    chromeOptions.addArguments('--no-sandbox');
                    chromeOptions.addArguments('--disable-dev-shm-usage');
                    return [4 /*yield*/, new Builder()
                            .forBrowser('chrome')
                            .setChromeOptions(chromeOptions)
                            .build()];
                case 8:
                    driver = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 90000);
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
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
                    error_3 = _a.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_4, screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 5]);
                    return [4 /*yield*/, driver.get('http://localhost:5173')];
                case 1:
                    _a.sent();
                    // Wait for app to be fully loaded - adjust selector based on your app
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('#root')), // or another reliable root element
                        30000, 'App root element not found')];
                case 2:
                    // Wait for app to be fully loaded - adjust selector based on your app
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_4 = _a.sent();
                    console.error('Error loading page:', error_4);
                    return [4 /*yield*/, driver.takeScreenshot()];
                case 4:
                    screenshot = _a.sent();
                    console.log('Screenshot:', screenshot);
                    throw error_4;
                case 5: return [2 /*return*/];
            }
        });
    }); });
    test('should load the homepage', function () { return __awaiter(void 0, void 0, void 0, function () {
        var title;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, driver.getTitle()];
                case 1:
                    title = _a.sent();
                    expect(title).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    test('complete user registration flow', function () { return __awaiter(void 0, void 0, void 0, function () {
        var nameInput, emailInput, passwordInput, confirmPasswordInput, submitButton, error_5, screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 13, , 15]);
                    // Wait for any loading states to complete
                    return [4 /*yield*/, driver.sleep(2000)];
                case 1:
                    // Wait for any loading states to complete
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="name-input"]')), 30000, 'Name input not found')];
                case 2:
                    nameInput = _a.sent();
                    return [4 /*yield*/, nameInput.sendKeys('Test User')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="email-input"]')), 30000, 'Email input not found')];
                case 4:
                    emailInput = _a.sent();
                    return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="password-input"]')), 30000, 'Password input not found')];
                case 6:
                    passwordInput = _a.sent();
                    return [4 /*yield*/, passwordInput.sendKeys('password123')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="confirm-password-input"]')), 30000, 'Confirm password input not found')];
                case 8:
                    confirmPasswordInput = _a.sent();
                    return [4 /*yield*/, confirmPasswordInput.sendKeys('password123')];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="register-submit-button"]')), 30000, 'Submit button not found')];
                case 10:
                    submitButton = _a.sent();
                    return [4 /*yield*/, submitButton.click()];
                case 11:
                    _a.sent();
                    // Wait for navigation to login page
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css('[data-testid="login-link"]')), 30000, 'Not redirected to login page')];
                case 12:
                    // Wait for navigation to login page
                    _a.sent();
                    return [3 /*break*/, 15];
                case 13:
                    error_5 = _a.sent();
                    console.error('Registration flow error:', error_5);
                    return [4 /*yield*/, driver.takeScreenshot()];
                case 14:
                    screenshot = _a.sent();
                    console.log('Screenshot:', screenshot);
                    throw error_5;
                case 15: return [2 /*return*/];
            }
        });
    }); }, 45000);
    test('user login and navigation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var emailInput, error_6, screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 7]);
                    // Wait for any loading states
                    return [4 /*yield*/, driver.sleep(2000)];
                case 1:
                    // Wait for any loading states
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css([
                            '[data-testid="email-input"]',
                            'input[type="email"]',
                            '#email',
                            '.email-input'
                        ].join(','))), 30000, 'Email input not found after 30 seconds')];
                case 2:
                    emailInput = _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementIsVisible(emailInput), 10000, 'Email input is not visible')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_6 = _a.sent();
                    console.error('Login flow error:', error_6);
                    return [4 /*yield*/, driver.takeScreenshot()];
                case 6:
                    screenshot = _a.sent();
                    console.log('Screenshot:', screenshot);
                    throw error_6;
                case 7: return [2 /*return*/];
            }
        });
    }); }, 45000);
    test('browser control workflow', function () { return __awaiter(void 0, void 0, void 0, function () {
        var emailInput, error_7, screenshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 7]);
                    return [4 /*yield*/, driver.sleep(2000)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementLocated(By.css([
                            '[data-testid="email-input"]',
                            'input[type="email"]',
                            '#email',
                            '.email-input'
                        ].join(','))), 30000, 'Email input not found after 30 seconds')];
                case 2:
                    emailInput = _a.sent();
                    return [4 /*yield*/, driver.wait(until.elementIsVisible(emailInput), 10000, 'Email input is not visible')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, emailInput.sendKeys('test@example.com')];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_7 = _a.sent();
                    console.error('Browser control flow error:', error_7);
                    return [4 /*yield*/, driver.takeScreenshot()];
                case 6:
                    screenshot = _a.sent();
                    console.log('Screenshot:', screenshot);
                    throw error_7;
                case 7: return [2 /*return*/];
            }
        });
    }); }, 45000);
});
