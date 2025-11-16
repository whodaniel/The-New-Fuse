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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBestPracticesAudit = runBestPracticesAudit;
var types_js_1 = require("./types.js");
var index_js_1 = require("./index.js");
// This ensures we always include critical issues while limiting less important ones
var DETAIL_LIMITS = {
    critical: Number.MAX_SAFE_INTEGER, // No limit for critical issues
    serious: 15, // Up to 15 items for serious issues
    moderate: 10, // Up to 10 items for moderate issues
    minor: 3, // Up to 3 items for minor issues
};
/**
 * Runs a Best Practices audit on the specified URL
 * @param url The URL to audit
 * @returns Promise resolving to AI-optimized Best Practices audit results
 */
function runBestPracticesAudit(url) {
    return __awaiter(this, void 0, void 0, function () {
        var lhr, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, index_js_1.runLighthouseAudit)(url, [types_js_1.AuditCategory.BEST_PRACTICES])];
                case 1:
                    lhr = _a.sent();
                    return [2 /*return*/, extractAIOptimizedData(lhr, url)];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("Best Practices audit failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extract AI-optimized Best Practices data from Lighthouse results
 */
var extractAIOptimizedData = function (lhr, url) {
    var _a;
    var categoryData = lhr.categories[types_js_1.AuditCategory.BEST_PRACTICES];
    var audits = lhr.audits || {};
    // Add metadata
    var metadata = {
        url: url,
        timestamp: lhr.fetchTime || new Date().toISOString(),
        device: ((_a = lhr.configSettings) === null || _a === void 0 ? void 0 : _a.formFactor) || "desktop",
        lighthouseVersion: lhr.lighthouseVersion || "unknown",
    };
    // Process audit results
    var issues = [];
    var categories = {
        security: { score: 0, issues_count: 0 },
        trust: { score: 0, issues_count: 0 },
        "user-experience": { score: 0, issues_count: 0 },
        "browser-compat": { score: 0, issues_count: 0 },
        other: { score: 0, issues_count: 0 },
    };
    // Counters for audit types
    var failedCount = 0;
    var passedCount = 0;
    var manualCount = 0;
    var informativeCount = 0;
    var notApplicableCount = 0;
    // Process failed audits (score < 1)
    var failedAudits = Object.entries(audits)
        .filter(function (_a) {
        var audit = _a[1];
        var score = audit.score;
        return (score !== null &&
            score < 1 &&
            audit.scoreDisplayMode !== "manual" &&
            audit.scoreDisplayMode !== "notApplicable");
    })
        .map(function (_a) {
        var auditId = _a[0], audit = _a[1];
        return (__assign({ auditId: auditId }, audit));
    });
    // Update counters
    Object.values(audits).forEach(function (audit) {
        var score = audit.score, scoreDisplayMode = audit.scoreDisplayMode;
        if (scoreDisplayMode === "manual") {
            manualCount++;
        }
        else if (scoreDisplayMode === "informative") {
            informativeCount++;
        }
        else if (scoreDisplayMode === "notApplicable") {
            notApplicableCount++;
        }
        else if (score === 1) {
            passedCount++;
        }
        else if (score !== null && score < 1) {
            failedCount++;
        }
    });
    // Process failed audits into AI-friendly format
    failedAudits.forEach(function (ref) {
        // Determine impact level based on audit score and weight
        var impact = "moderate";
        var score = ref.score || 0;
        // Use a more reliable approach to determine impact
        if (score === 0) {
            impact = "critical";
        }
        else if (score < 0.5) {
            impact = "serious";
        }
        else if (score < 0.9) {
            impact = "moderate";
        }
        else {
            impact = "minor";
        }
        // Categorize the issue
        var category = "other";
        // Security-related issues
        if (ref.auditId.includes("csp") ||
            ref.auditId.includes("security") ||
            ref.auditId.includes("vulnerab") ||
            ref.auditId.includes("password") ||
            ref.auditId.includes("cert") ||
            ref.auditId.includes("deprecat")) {
            category = "security";
        }
        // Trust and legitimacy issues
        else if (ref.auditId.includes("doctype") ||
            ref.auditId.includes("charset") ||
            ref.auditId.includes("legit") ||
            ref.auditId.includes("trust")) {
            category = "trust";
        }
        // User experience issues
        else if (ref.auditId.includes("user") ||
            ref.auditId.includes("experience") ||
            ref.auditId.includes("console") ||
            ref.auditId.includes("errors") ||
            ref.auditId.includes("paste")) {
            category = "user-experience";
        }
        // Browser compatibility issues
        else if (ref.auditId.includes("compat") ||
            ref.auditId.includes("browser") ||
            ref.auditId.includes("vendor") ||
            ref.auditId.includes("js-lib")) {
            category = "browser-compat";
        }
        // Count issues by category
        categories[category].issues_count++;
        // Create issue object
        var issue = {
            id: ref.auditId,
            title: ref.title,
            impact: impact,
            category: category,
            score: ref.score,
            details: [],
        };
        // Extract details if available
        var refDetails = ref.details;
        if ((refDetails === null || refDetails === void 0 ? void 0 : refDetails.items) && Array.isArray(refDetails.items)) {
            var itemLimit = DETAIL_LIMITS[impact];
            var detailItems = refDetails.items.slice(0, itemLimit);
            detailItems.forEach(function (item) {
                issue.details = issue.details || [];
                // Different audits have different detail structures
                var detail = {};
                if (typeof item.name === "string")
                    detail.name = item.name;
                if (typeof item.version === "string")
                    detail.version = item.version;
                if (typeof item.issue === "string")
                    detail.issue = item.issue;
                if (item.value !== undefined)
                    detail.value = String(item.value);
                // For JS libraries, extract name and version
                if (ref.auditId === "js-libraries" &&
                    typeof item.name === "string" &&
                    typeof item.version === "string") {
                    detail.name = item.name;
                    detail.version = item.version;
                }
                // Add other generic properties that might exist
                for (var _i = 0, _a = Object.entries(item); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    if (!detail[key] && typeof value === "string") {
                        detail[key] = value;
                    }
                }
                issue.details.push(detail);
            });
        }
        issues.push(issue);
    });
    // Calculate category scores (0-100)
    Object.keys(categories).forEach(function (category) {
        // Simplified scoring: if there are issues in this category, score is reduced proportionally
        var issueCount = categories[category].issues_count;
        if (issueCount > 0) {
            // More issues = lower score, max penalty of 25 points per issue
            var penalty = Math.min(100, issueCount * 25);
            categories[category].score = Math.max(0, 100 - penalty);
        }
        else {
            categories[category].score = 100;
        }
    });
    // Generate prioritized recommendations
    var prioritized_recommendations = [];
    // Prioritize recommendations by category with most issues
    Object.entries(categories)
        .filter(function (_a) {
        var _ = _a[0], data = _a[1];
        return data.issues_count > 0;
    })
        .sort(function (_a, _b) {
        var _ = _a[0], a = _a[1];
        var __ = _b[0], b = _b[1];
        return b.issues_count - a.issues_count;
    })
        .forEach(function (_a) {
        var category = _a[0], data = _a[1];
        var recommendation = "";
        switch (category) {
            case "security":
                recommendation = "Address ".concat(data.issues_count, " security issues: vulnerabilities, CSP, deprecations");
                break;
            case "trust":
                recommendation = "Fix ".concat(data.issues_count, " trust & legitimacy issues: doctype, charset");
                break;
            case "user-experience":
                recommendation = "Improve ".concat(data.issues_count, " user experience issues: console errors, user interactions");
                break;
            case "browser-compat":
                recommendation = "Resolve ".concat(data.issues_count, " browser compatibility issues: outdated libraries, vendor prefixes");
                break;
            default:
                recommendation = "Fix ".concat(data.issues_count, " other best practice issues");
        }
        prioritized_recommendations.push(recommendation);
    });
    // Return the optimized report
    return {
        metadata: metadata,
        report: {
            score: (categoryData === null || categoryData === void 0 ? void 0 : categoryData.score) ? Math.round(categoryData.score * 100) : 0,
            audit_counts: {
                failed: failedCount,
                passed: passedCount,
                manual: manualCount,
                informative: informativeCount,
                not_applicable: notApplicableCount,
            },
            issues: issues,
            categories: categories,
            prioritized_recommendations: prioritized_recommendations,
        },
    };
};
