"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLighthouseConfig = createLighthouseConfig;
exports.runLighthouseAudit = runLighthouseAudit;
var lighthouse_1 = require("lighthouse");
var puppeteer_service_js_1 = require("../puppeteer-service.js");
var types_js_1 = require("./types.js");
/**
 * Creates a Lighthouse configuration object
 * @param categories Array of categories to audit
 * @returns Lighthouse configuration and flags
 */
function createLighthouseConfig(categories) {
    if (categories === void 0) { categories = [types_js_1.AuditCategory.ACCESSIBILITY]; }
    return {
        flags: {
            output: ["json"],
            onlyCategories: categories,
            formFactor: "desktop",
            port: undefined,
            screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
            },
        },
        config: {
            extends: "lighthouse:default",
            settings: {
                onlyCategories: categories,
                emulatedFormFactor: "desktop",
                throttling: { cpuSlowdownMultiplier: 1 },
            },
        },
    };
}
/**
 * Runs a Lighthouse audit on the specified URL via CDP
 * @param url The URL to audit
 * @param categories Array of categories to audit, defaults to ["accessibility"]
 * @returns Promise resolving to the Lighthouse result
 * @throws Error if the URL is invalid or if the audit fails
 */
function runLighthouseAudit(url, categories) {
    return __awaiter(this, void 0, void 0, function () {
        var isPerformanceAudit, port, _a, flags, config, runnerResult, result, browserError_1, errorMessage, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Starting Lighthouse ".concat(categories.join(", "), " audit for: ").concat(url));
                    if (!url || url === "about:blank") {
                        console.error("Invalid URL for Lighthouse audit");
                        throw new Error("Cannot run audit on an empty page or about:blank. Please navigate to a valid URL first.");
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    // Always use a dedicated headless browser for audits
                    console.log("Using dedicated headless browser for audit");
                    isPerformanceAudit = categories.includes(types_js_1.AuditCategory.PERFORMANCE);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, (0, puppeteer_service_js_1.connectToHeadlessBrowser)(url, {
                            blockResources: !isPerformanceAudit,
                        })];
                case 3:
                    port = (_b.sent()).port;
                    console.log("Connected to browser on port: ".concat(port));
                    _a = createLighthouseConfig(categories), flags = _a.flags, config = _a.config;
                    flags.port = port;
                    console.log("Running Lighthouse with categories: ".concat(categories.join(", ")));
                    return [4 /*yield*/, (0, lighthouse_1.default)(url, flags, config)];
                case 4:
                    runnerResult = _b.sent();
                    console.log("Lighthouse scan completed");
                    if (!(runnerResult === null || runnerResult === void 0 ? void 0 : runnerResult.lhr)) {
                        console.error("Lighthouse audit failed to produce results");
                        throw new Error("Lighthouse audit failed to produce results");
                    }
                    // Schedule browser cleanup after a delay to allow for subsequent audits
                    (0, puppeteer_service_js_1.scheduleBrowserCleanup)();
                    result = runnerResult.lhr;
                    return [2 /*return*/, result];
                case 5:
                    browserError_1 = _b.sent();
                    errorMessage = browserError_1 instanceof Error
                        ? browserError_1.message
                        : String(browserError_1);
                    if (errorMessage.includes("Chrome could not be found") ||
                        errorMessage.includes("Failed to launch browser") ||
                        errorMessage.includes("spawn ENOENT")) {
                        throw new Error("Chrome or Edge browser could not be found. Please ensure that Chrome or Edge is installed on your system to run audits.");
                    }
                    // Re-throw other errors
                    throw browserError_1;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error("Lighthouse audit failed:", error_1);
                    // Schedule browser cleanup even if the audit fails
                    (0, puppeteer_service_js_1.scheduleBrowserCleanup)();
                    throw new Error("Lighthouse audit failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Export from specific audit modules
__exportStar(require("./accessibility.js"), exports);
__exportStar(require("./performance.js"), exports);
__exportStar(require("./seo.js"), exports);
__exportStar(require("./types.js"), exports);
