"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePuppeteerService = configurePuppeteerService;
exports.scheduleBrowserCleanup = scheduleBrowserCleanup;
exports.connectToHeadlessBrowser = connectToHeadlessBrowser;
var fs_1 = require("fs");
var puppeteer_core_1 = require("puppeteer-core");
var path_1 = require("path");
var os_1 = require("os");
var child_process_1 = require("child_process");
var ChromeLauncher = require("chrome-launcher");
// Default configuration values
var DEFAULT_CONFIG = {
    preferredBrowsers: ["chrome", "edge", "brave", "firefox"],
    debugPorts: [9222, 9223, 9224, 9225],
    connectionTimeout: 10000,
    maxRetries: 3,
    browserCleanupTimeout: 60000,
    blockResourceTypes: ["image", "font", "media"],
};
// Browser support notes:
// - Chrome/Chromium: Fully supported (primary target)
// - Edge: Fully supported (Chromium-based)
// - Brave: Fully supported (Chromium-based)
// - Firefox: Partially supported (some features may not work)
// - Safari: Not supported by Puppeteer
// ===== Global State =====
// Current active configuration
var currentConfig = __assign({}, DEFAULT_CONFIG);
// Browser instance management
var headlessBrowserInstance = null;
var launchedBrowserWSEndpoint = null;
// Cleanup management
var browserCleanupTimeout = null;
var BROWSER_CLEANUP_TIMEOUT = 60000; // 60 seconds default
// Cache for browser executable paths
var detectedBrowserPath = null;
// ===== Configuration Functions =====
/**
 * Configure the Puppeteer service with custom settings
 * @param config Partial configuration to override defaults
 */
function configurePuppeteerService(config) {
    currentConfig = __assign(__assign({}, DEFAULT_CONFIG), config);
    // Update the timeout if it was changed
    if (config.browserCleanupTimeout &&
        config.browserCleanupTimeout !== BROWSER_CLEANUP_TIMEOUT) {
        BROWSER_CLEANUP_TIMEOUT = config.browserCleanupTimeout;
    }
    console.log("Puppeteer service configured:", currentConfig);
}
// ===== Browser Management =====
/**
 * Get or create a headless browser instance
 * @returns Promise resolving to a browser instance
 */
function getHeadlessBrowserInstance() {
    return __awaiter(this, void 0, void 0, function () {
        var pages, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Browser instance request started");
                    // Cancel any scheduled cleanup
                    cancelScheduledCleanup();
                    if (!headlessBrowserInstance) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, headlessBrowserInstance.pages()];
                case 2:
                    pages = _a.sent();
                    console.log("Reusing existing headless browser with ".concat(pages.length, " pages"));
                    return [2 /*return*/, headlessBrowserInstance];
                case 3:
                    error_1 = _a.sent();
                    console.log("Existing browser instance is no longer valid, creating a new one");
                    headlessBrowserInstance = null;
                    launchedBrowserWSEndpoint = null;
                    return [3 /*break*/, 4];
                case 4: 
                // Create a new browser instance
                return [2 /*return*/, launchNewBrowser()];
            }
        });
    });
}
/**
 * Launches a new browser instance
 * @returns Promise resolving to a browser instance
 */
function launchNewBrowser() {
    return __awaiter(this, void 0, void 0, function () {
        var userDataDir, browser, launchOptions, error_2, closeError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Creating new headless browser instance");
                    userDataDir = createTempUserDataDir();
                    browser = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 10]);
                    launchOptions = configureLaunchOptions(userDataDir);
                    // Set custom browser executable
                    return [4 /*yield*/, setCustomBrowserExecutable(launchOptions)];
                case 2:
                    // Set custom browser executable
                    _a.sent();
                    // Launch the browser
                    console.log("Launching browser with options:", JSON.stringify({
                        headless: launchOptions.headless,
                        executablePath: launchOptions.executablePath,
                    }));
                    return [4 /*yield*/, puppeteer_core_1.default.launch(launchOptions)];
                case 3:
                    browser = _a.sent();
                    // Store references to the browser instance
                    launchedBrowserWSEndpoint = browser.wsEndpoint();
                    headlessBrowserInstance = browser;
                    // Setup cleanup handlers
                    setupBrowserCleanupHandlers(browser, userDataDir);
                    console.log("Browser ready");
                    return [2 /*return*/, browser];
                case 4:
                    error_2 = _a.sent();
                    console.error("Failed to launch browser:", error_2);
                    if (!browser) return [3 /*break*/, 9];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, browser.close()];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    closeError_1 = _a.sent();
                    console.error("Error closing browser:", closeError_1);
                    return [3 /*break*/, 8];
                case 8:
                    headlessBrowserInstance = null;
                    launchedBrowserWSEndpoint = null;
                    _a.label = 9;
                case 9:
                    // Clean up the temporary directory
                    try {
                        fs_1.default.rmSync(userDataDir, { recursive: true, force: true });
                    }
                    catch (fsError) {
                        console.error("Error removing temporary directory:", fsError);
                    }
                    throw error_2;
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Creates a temporary user data directory for the browser
 * @returns Path to the created directory
 */
function createTempUserDataDir() {
    var tempDir = os_1.default.tmpdir();
    var uniqueId = "".concat(Date.now().toString(), "-").concat(Math.random()
        .toString(36)
        .substring(2));
    var userDataDir = path_1.default.join(tempDir, "browser-debug-profile-".concat(uniqueId));
    fs_1.default.mkdirSync(userDataDir, { recursive: true });
    console.log("Using temporary user data directory: ".concat(userDataDir));
    return userDataDir;
}
/**
 * Configures browser launch options
 * @param userDataDir Path to the user data directory
 * @returns Launch options object
 */
function configureLaunchOptions(userDataDir) {
    var launchOptions = {
        args: [
            "--remote-debugging-port=0", // Use dynamic port
            "--user-data-dir=".concat(userDataDir),
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-component-extensions-with-background-pages",
            "--disable-background-networking",
            "--disable-backgrounding-occluded-windows",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--no-pings",
            "--safebrowsing-disable-auto-update",
        ],
    };
    // Add headless mode (using any to bypass type checking issues)
    launchOptions.headless = "new";
    return launchOptions;
}
/**
 * Sets a custom browser executable path if configured
 * @param launchOptions Launch options object to modify
 */
function setCustomBrowserExecutable(launchOptions) {
    return __awaiter(this, void 0, void 0, function () {
        var preferredBrowsers, _i, preferredBrowsers_1, browser, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // First, try to use a custom browser path from configuration
                    if (currentConfig.customBrowserPaths &&
                        Object.keys(currentConfig.customBrowserPaths).length > 0) {
                        preferredBrowsers = currentConfig.preferredBrowsers || [
                            "chrome",
                            "edge",
                            "brave",
                            "firefox",
                        ];
                        for (_i = 0, preferredBrowsers_1 = preferredBrowsers; _i < preferredBrowsers_1.length; _i++) {
                            browser = preferredBrowsers_1[_i];
                            if (currentConfig.customBrowserPaths[browser] &&
                                fs_1.default.existsSync(currentConfig.customBrowserPaths[browser])) {
                                launchOptions.executablePath =
                                    currentConfig.customBrowserPaths[browser];
                                // Set product to firefox if using Firefox browser
                                if (browser === "firefox") {
                                    launchOptions.product = "firefox";
                                }
                                console.log("Using custom ".concat(browser, " path: ").concat(launchOptions.executablePath));
                                return [2 /*return*/];
                            }
                        }
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!(detectedBrowserPath && fs_1.default.existsSync(detectedBrowserPath))) return [3 /*break*/, 2];
                    console.log("Using cached browser path: ".concat(detectedBrowserPath));
                    launchOptions.executablePath = detectedBrowserPath;
                    // Check if the detected browser is Firefox
                    if (detectedBrowserPath.includes("firefox")) {
                        launchOptions.product = "firefox";
                        console.log("Setting product to firefox for Firefox browser");
                    }
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, findBrowserExecutablePath()];
                case 3:
                    detectedBrowserPath = _a.sent();
                    launchOptions.executablePath = detectedBrowserPath;
                    // Check if the detected browser is Firefox
                    if (detectedBrowserPath.includes("firefox")) {
                        launchOptions.product = "firefox";
                        console.log("Setting product to firefox for Firefox browser");
                    }
                    console.log("Using detected browser path: ".concat(launchOptions.executablePath));
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error("Failed to detect browser executable path:", error_3);
                    throw new Error("No browser executable path found. Please specify a custom browser path in the configuration.");
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Find a browser executable path on the current system
 * @returns Path to a browser executable
 */
function findBrowserExecutablePath() {
    return __awaiter(this, void 0, void 0, function () {
        var chrome, chromePath, possiblePaths, _i, possiblePaths_1, p, error_4, errorMessage, platform, preferredBrowsers, registryPath, regOutput, match, regOutput, match, regOutput, programFiles_1, programFilesX86_1, defaultChromePaths, _a, defaultChromePaths_1, chromePath, programFiles, programFilesX86, winBrowserPaths, _b, preferredBrowsers_2, browser, paths, _c, paths_1, browserPath, macBrowserPaths, _d, preferredBrowsers_3, browser, paths, _e, paths_2, browserPath, linuxBrowserCommands, _f, preferredBrowsers_4, browser, commands, _g, commands_1, cmd, browserPath, alternativeLocations, _h, alternativeLocations_1, location_1;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 3, , 4]);
                    console.log("Attempting to find Chrome using chrome-launcher...");
                    return [4 /*yield*/, ChromeLauncher.launch({
                            chromeFlags: ["--headless"],
                            handleSIGINT: false,
                        })];
                case 1:
                    chrome = _j.sent();
                    chromePath = "";
                    // Chrome version data often contains the path
                    if (chrome.process && chrome.process.spawnfile) {
                        chromePath = chrome.process.spawnfile;
                        console.log("Found Chrome path from process.spawnfile");
                    }
                    else {
                        // Try to get the Chrome path from chrome-launcher
                        // In newer versions, it's directly accessible
                        console.log("Trying to determine Chrome path using other methods");
                        possiblePaths = __spreadArray([
                            process.env.CHROME_PATH
                        ], (process.platform === "darwin"
                            ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
                            : process.platform === "win32"
                                ? [
                                    "".concat(process.env.PROGRAMFILES, "\\Google\\Chrome\\Application\\chrome.exe"),
                                    "".concat(process.env["PROGRAMFILES(X86)"], "\\Google\\Chrome\\Application\\chrome.exe"),
                                ]
                                : ["/usr/bin/google-chrome"]), true).filter(Boolean);
                        // Use the first valid path
                        for (_i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
                            p = possiblePaths_1[_i];
                            if (p && fs_1.default.existsSync(p)) {
                                chromePath = p;
                                console.log("Found Chrome path from common locations");
                                break;
                            }
                        }
                    }
                    // Always kill the Chrome instance we just launched
                    return [4 /*yield*/, chrome.kill()];
                case 2:
                    // Always kill the Chrome instance we just launched
                    _j.sent();
                    if (chromePath) {
                        console.log("Chrome found via chrome-launcher: ".concat(chromePath));
                        return [2 /*return*/, chromePath];
                    }
                    else {
                        console.log("Chrome launched but couldn't determine executable path");
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _j.sent();
                    errorMessage = error_4 instanceof Error ? error_4.message : String(error_4);
                    if (errorMessage.includes("No Chrome installations found") ||
                        (error_4 === null || error_4 === void 0 ? void 0 : error_4.code) === "ERR_LAUNCHER_NOT_INSTALLED") {
                        console.log("Chrome not installed. Falling back to manual detection");
                    }
                    else {
                        console.error("Failed to find Chrome using chrome-launcher:", error_4);
                        console.log("Falling back to manual detection");
                    }
                    return [3 /*break*/, 4];
                case 4:
                    platform = process.platform;
                    preferredBrowsers = currentConfig.preferredBrowsers || [
                        "chrome",
                        "edge",
                        "brave",
                        "firefox",
                    ];
                    console.log("Attempting to detect browser executable path on ".concat(platform, "..."));
                    // Platform-specific detection strategies
                    if (platform === "win32") {
                        registryPath = null;
                        try {
                            console.log("Checking Windows registry for Chrome...");
                            regOutput = (0, child_process_1.execSync)('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve', { encoding: "utf8" });
                            match = regOutput.match(/REG_(?:SZ|EXPAND_SZ)\s+([^\s]+)/i);
                            if (match && match[1]) {
                                registryPath = match[1].replace(/\\"/g, "");
                                // Verify the path exists
                                if (fs_1.default.existsSync(registryPath)) {
                                    console.log("Found Chrome via HKLM registry: ".concat(registryPath));
                                    return [2 /*return*/, registryPath];
                                }
                            }
                        }
                        catch (e) {
                            // Try HKCU if HKLM fails
                            try {
                                console.log("Checking user registry for Chrome...");
                                regOutput = (0, child_process_1.execSync)('reg query "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve', { encoding: "utf8" });
                                match = regOutput.match(/REG_(?:SZ|EXPAND_SZ)\s+([^\s]+)/i);
                                if (match && match[1]) {
                                    registryPath = match[1].replace(/\\"/g, "");
                                    // Verify the path exists
                                    if (fs_1.default.existsSync(registryPath)) {
                                        console.log("Found Chrome via HKCU registry: ".concat(registryPath));
                                        return [2 /*return*/, registryPath];
                                    }
                                }
                            }
                            catch (innerError) {
                                console.log("Failed to find Chrome via registry, continuing with path checks");
                            }
                        }
                        // Try to find Chrome through BLBeacon registry key (version info)
                        try {
                            console.log("Checking Chrome BLBeacon registry...");
                            regOutput = (0, child_process_1.execSync)('reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version', { encoding: "utf8" });
                            if (regOutput) {
                                programFiles_1 = process.env.PROGRAMFILES || "C:\\Program Files";
                                programFilesX86_1 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
                                defaultChromePaths = [
                                    path_1.default.join(programFiles_1, "Google\\Chrome\\Application\\chrome.exe"),
                                    path_1.default.join(programFilesX86_1, "Google\\Chrome\\Application\\chrome.exe"),
                                ];
                                for (_a = 0, defaultChromePaths_1 = defaultChromePaths; _a < defaultChromePaths_1.length; _a++) {
                                    chromePath = defaultChromePaths_1[_a];
                                    if (fs_1.default.existsSync(chromePath)) {
                                        console.log("Found Chrome via BLBeacon registry hint: ".concat(chromePath));
                                        return [2 /*return*/, chromePath];
                                    }
                                }
                            }
                        }
                        catch (e) {
                            console.log("Failed to find Chrome via BLBeacon registry");
                        }
                        programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
                        programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
                        winBrowserPaths = {
                            chrome: [
                                path_1.default.join(programFiles, "Google\\Chrome\\Application\\chrome.exe"),
                                path_1.default.join(programFilesX86, "Google\\Chrome\\Application\\chrome.exe"),
                            ],
                            edge: [
                                path_1.default.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe"),
                                path_1.default.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
                            ],
                            brave: [
                                path_1.default.join(programFiles, "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
                                path_1.default.join(programFilesX86, "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
                            ],
                            firefox: [
                                path_1.default.join(programFiles, "Mozilla Firefox\\firefox.exe"),
                                path_1.default.join(programFilesX86, "Mozilla Firefox\\firefox.exe"),
                            ],
                        };
                        // Check each browser in preferred order
                        for (_b = 0, preferredBrowsers_2 = preferredBrowsers; _b < preferredBrowsers_2.length; _b++) {
                            browser = preferredBrowsers_2[_b];
                            paths = winBrowserPaths[browser] || [];
                            for (_c = 0, paths_1 = paths; _c < paths_1.length; _c++) {
                                browserPath = paths_1[_c];
                                if (fs_1.default.existsSync(browserPath)) {
                                    console.log("Found ".concat(browser, " at ").concat(browserPath));
                                    return [2 /*return*/, browserPath];
                                }
                            }
                        }
                    }
                    else if (platform === "darwin") {
                        macBrowserPaths = {
                            chrome: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
                            edge: ["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
                            brave: ["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"],
                            firefox: ["/Applications/Firefox.app/Contents/MacOS/firefox"],
                            safari: ["/Applications/Safari.app/Contents/MacOS/Safari"],
                        };
                        // Check each browser in preferred order
                        for (_d = 0, preferredBrowsers_3 = preferredBrowsers; _d < preferredBrowsers_3.length; _d++) {
                            browser = preferredBrowsers_3[_d];
                            paths = macBrowserPaths[browser] || [];
                            for (_e = 0, paths_2 = paths; _e < paths_2.length; _e++) {
                                browserPath = paths_2[_e];
                                if (fs_1.default.existsSync(browserPath)) {
                                    console.log("Found ".concat(browser, " at ").concat(browserPath));
                                    // Safari is detected but not supported by Puppeteer
                                    if (browser === "safari") {
                                        console.log("Safari detected but not supported by Puppeteer. Continuing search...");
                                        continue;
                                    }
                                    return [2 /*return*/, browserPath];
                                }
                            }
                        }
                    }
                    else if (platform === "linux") {
                        linuxBrowserCommands = {
                            chrome: ["google-chrome", "chromium", "chromium-browser"],
                            edge: ["microsoft-edge"],
                            brave: ["brave-browser"],
                            firefox: ["firefox"],
                        };
                        // Check each browser in preferred order
                        for (_f = 0, preferredBrowsers_4 = preferredBrowsers; _f < preferredBrowsers_4.length; _f++) {
                            browser = preferredBrowsers_4[_f];
                            commands = linuxBrowserCommands[browser] ||
                                [];
                            for (_g = 0, commands_1 = commands; _g < commands_1.length; _g++) {
                                cmd = commands_1[_g];
                                try {
                                    browserPath = (0, child_process_1.execSync)("command -v ".concat(cmd, " || which ").concat(cmd, " || type -p ").concat(cmd, " 2>/dev/null"), { encoding: "utf8" }).trim();
                                    if (browserPath && fs_1.default.existsSync(browserPath)) {
                                        console.log("Found ".concat(browser, " at ").concat(browserPath));
                                        return [2 /*return*/, browserPath];
                                    }
                                }
                                catch (e) {
                                    // Command not found, continue to next
                                }
                            }
                        }
                        alternativeLocations = [
                            "/usr/bin/google-chrome",
                            "/usr/bin/chromium",
                            "/usr/bin/chromium-browser",
                            "/snap/bin/chromium",
                            "/snap/bin/google-chrome",
                            "/opt/google/chrome/chrome",
                        ];
                        for (_h = 0, alternativeLocations_1 = alternativeLocations; _h < alternativeLocations_1.length; _h++) {
                            location_1 = alternativeLocations_1[_h];
                            if (fs_1.default.existsSync(location_1)) {
                                console.log("Found browser at alternative location: ".concat(location_1));
                                return [2 /*return*/, location_1];
                            }
                        }
                    }
                    throw new Error("No browser executable found for platform ".concat(platform, ". Please specify a custom browser path."));
            }
        });
    });
}
/**
 * Sets up cleanup handlers for the browser instance
 * @param browser Browser instance
 * @param userDataDir Path to the user data directory to clean up
 */
function setupBrowserCleanupHandlers(browser, userDataDir) {
    browser.on("disconnected", function () {
        console.log("Browser disconnected. Scheduling cleanup for: ".concat(userDataDir));
        // Clear any existing cleanup timeout when browser is disconnected
        cancelScheduledCleanup();
        // Delayed cleanup to avoid conflicts with potential new browser instances
        setTimeout(function () {
            // Only remove the directory if no new browser has been launched
            if (!headlessBrowserInstance) {
                console.log("Cleaning up temporary directory: ".concat(userDataDir));
                try {
                    fs_1.default.rmSync(userDataDir, { recursive: true, force: true });
                    console.log("Successfully removed directory: ".concat(userDataDir));
                }
                catch (error) {
                    console.error("Failed to remove directory ".concat(userDataDir, ":"), error);
                }
            }
            else {
                console.log("Skipping cleanup for ".concat(userDataDir, " as new browser instance is active"));
            }
        }, 5000); // 5-second delay for cleanup
        // Reset browser instance variables
        launchedBrowserWSEndpoint = null;
        headlessBrowserInstance = null;
    });
}
// ===== Cleanup Management =====
/**
 * Cancels any scheduled browser cleanup
 */
function cancelScheduledCleanup() {
    if (browserCleanupTimeout) {
        console.log("Cancelling scheduled browser cleanup");
        clearTimeout(browserCleanupTimeout);
        browserCleanupTimeout = null;
    }
}
/**
 * Schedules automatic cleanup of the browser instance after inactivity
 */
function scheduleBrowserCleanup() {
    // Clear any existing timeout first
    cancelScheduledCleanup();
    // Only schedule cleanup if we have an active browser instance
    if (headlessBrowserInstance) {
        console.log("Scheduling browser cleanup in ".concat(BROWSER_CLEANUP_TIMEOUT / 1000, " seconds"));
        browserCleanupTimeout = setTimeout(function () {
            console.log("Executing scheduled browser cleanup");
            if (headlessBrowserInstance) {
                console.log("Closing headless browser instance");
                headlessBrowserInstance.close();
                headlessBrowserInstance = null;
                launchedBrowserWSEndpoint = null;
            }
            browserCleanupTimeout = null;
        }, BROWSER_CLEANUP_TIMEOUT);
    }
}
// ===== Public Browser Connection API =====
/**
 * Connects to a headless browser for web operations
 * @param url The URL to navigate to
 * @param options Connection and emulation options
 * @returns Promise resolving to browser, port, and page objects
 */
function connectToHeadlessBrowser(url_1) {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var browser, port, page, navigationTimeout, urlObj_1, cookiesWithDomain, viewport, userAgent, networkConditions, resourceTypesToBlock_1, selectorError_1, error_5;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Connecting to headless browser for ".concat(url).concat(options.blockResources ? " (blocking non-essential resources)" : ""));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 27, , 28]);
                    // Validate URL format
                    try {
                        new URL(url);
                    }
                    catch (e) {
                        throw new Error("Invalid URL format: ".concat(url));
                    }
                    return [4 /*yield*/, getHeadlessBrowserInstance()];
                case 2:
                    browser = _a.sent();
                    if (!launchedBrowserWSEndpoint) {
                        throw new Error("Failed to retrieve WebSocket endpoint for browser");
                    }
                    port = parseInt(launchedBrowserWSEndpoint.split(":")[2].split("/")[0]);
                    // Always create a new page for each audit to avoid request interception conflicts
                    console.log("Creating a new page for this audit");
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _a.sent();
                    navigationTimeout = 10000;
                    page.setDefaultNavigationTimeout(navigationTimeout);
                    // Navigate to the URL
                    console.log("Navigating to ".concat(url));
                    return [4 /*yield*/, page.goto(url, {
                            waitUntil: "networkidle2", // Wait until there are no more network connections for at least 500ms
                            timeout: navigationTimeout,
                        })];
                case 4:
                    _a.sent();
                    if (!(options.headers && Object.keys(options.headers).length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, page.setExtraHTTPHeaders(options.headers)];
                case 5:
                    _a.sent();
                    console.log("Set custom HTTP headers");
                    _a.label = 6;
                case 6:
                    if (!(options.cookies && options.cookies.length > 0)) return [3 /*break*/, 8];
                    urlObj_1 = new URL(url);
                    cookiesWithDomain = options.cookies.map(function (cookie) { return (__assign(__assign({}, cookie), { domain: cookie.domain || urlObj_1.hostname, path: cookie.path || "/" })); });
                    return [4 /*yield*/, page.setCookie.apply(page, cookiesWithDomain)];
                case 7:
                    _a.sent();
                    console.log("Set ".concat(options.cookies.length, " cookies"));
                    _a.label = 8;
                case 8:
                    if (!options.viewport) return [3 /*break*/, 10];
                    return [4 /*yield*/, page.setViewport(options.viewport)];
                case 9:
                    _a.sent();
                    console.log("Set viewport to ".concat(options.viewport.width, "x").concat(options.viewport.height));
                    return [3 /*break*/, 14];
                case 10:
                    if (!options.emulateDevice) return [3 /*break*/, 14];
                    viewport = void 0;
                    userAgent = options.userAgent;
                    switch (options.emulateDevice) {
                        case "mobile":
                            viewport = {
                                width: 375,
                                height: 667,
                                isMobile: true,
                                hasTouch: true,
                            };
                            userAgent =
                                userAgent ||
                                    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)";
                            break;
                        case "tablet":
                            viewport = {
                                width: 768,
                                height: 1024,
                                isMobile: true,
                                hasTouch: true,
                            };
                            userAgent =
                                userAgent || "Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X)";
                            break;
                        case "desktop":
                        default:
                            viewport = {
                                width: 1280,
                                height: 800,
                                isMobile: false,
                                hasTouch: false,
                            };
                            break;
                    }
                    return [4 /*yield*/, page.setViewport(viewport)];
                case 11:
                    _a.sent();
                    if (!userAgent) return [3 /*break*/, 13];
                    return [4 /*yield*/, page.setUserAgent(userAgent)];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13:
                    console.log("Emulating ".concat(options.emulateDevice, " device"));
                    _a.label = 14;
                case 14:
                    if (!options.locale) return [3 /*break*/, 16];
                    return [4 /*yield*/, page.evaluateOnNewDocument(function (locale) {
                            Object.defineProperty(navigator, "language", { get: function () { return locale; } });
                            Object.defineProperty(navigator, "languages", { get: function () { return [locale]; } });
                        }, options.locale)];
                case 15:
                    _a.sent();
                    console.log("Set locale to ".concat(options.locale));
                    _a.label = 16;
                case 16:
                    if (!options.timezoneId) return [3 /*break*/, 18];
                    return [4 /*yield*/, page.emulateTimezone(options.timezoneId)];
                case 17:
                    _a.sent();
                    console.log("Set timezone to ".concat(options.timezoneId));
                    _a.label = 18;
                case 18:
                    if (!options.emulateNetworkCondition) return [3 /*break*/, 20];
                    networkConditions = void 0;
                    switch (options.emulateNetworkCondition) {
                        case "slow3G":
                            networkConditions = {
                                offline: false,
                                latency: 400,
                                download: (500 * 1024) / 8,
                                upload: (500 * 1024) / 8,
                            };
                            break;
                        case "fast3G":
                            networkConditions = {
                                offline: false,
                                latency: 150,
                                download: (1.5 * 1024 * 1024) / 8,
                                upload: (750 * 1024) / 8,
                            };
                            break;
                        case "4G":
                            networkConditions = {
                                offline: false,
                                latency: 50,
                                download: (4 * 1024 * 1024) / 8,
                                upload: (2 * 1024 * 1024) / 8,
                            };
                            break;
                        case "offline":
                            networkConditions = { offline: true };
                            break;
                        default:
                            networkConditions = { offline: false };
                    }
                    // @ts-ignore - Property might not be in types but is supported
                    return [4 /*yield*/, page.emulateNetworkConditions(networkConditions)];
                case 19:
                    // @ts-ignore - Property might not be in types but is supported
                    _a.sent();
                    console.log("Emulating ".concat(options.emulateNetworkCondition, " network conditions"));
                    _a.label = 20;
                case 20:
                    if (!options.blockResources) return [3 /*break*/, 22];
                    resourceTypesToBlock_1 = options.customResourceBlockList ||
                        currentConfig.blockResourceTypes || ["image", "font", "media"];
                    return [4 /*yield*/, page.setRequestInterception(true)];
                case 21:
                    _a.sent();
                    page.on("request", function (request) {
                        // Block unnecessary resources to speed up loading
                        var resourceType = request.resourceType();
                        if (resourceTypesToBlock_1.includes(resourceType)) {
                            request.abort();
                        }
                        else {
                            request.continue();
                        }
                    });
                    console.log("Blocking resource types: ".concat(resourceTypesToBlock_1.join(", ")));
                    _a.label = 22;
                case 22:
                    if (!options.waitForSelector) return [3 /*break*/, 26];
                    _a.label = 23;
                case 23:
                    _a.trys.push([23, 25, , 26]);
                    console.log("Waiting for selector: ".concat(options.waitForSelector));
                    return [4 /*yield*/, page.waitForSelector(options.waitForSelector, {
                            timeout: options.waitForTimeout || 30000,
                        })];
                case 24:
                    _a.sent();
                    return [3 /*break*/, 26];
                case 25:
                    selectorError_1 = _a.sent();
                    console.warn("Failed to find selector \"".concat(options.waitForSelector, "\": ").concat(selectorError_1.message));
                    return [3 /*break*/, 26];
                case 26: return [2 /*return*/, { browser: browser, port: port, page: page }];
                case 27:
                    error_5 = _a.sent();
                    console.error("Failed to connect to headless browser:", error_5);
                    throw new Error("Failed to connect to headless browser: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                case 28: return [2 /*return*/];
            }
        });
    });
}
