"use strict";
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
exports.runAccessibilityAudit = runAccessibilityAudit;
var types_js_1 = require("./types.js");
var index_js_1 = require("./index.js");
// Original limits were optimized for human consumption
// This ensures we always include critical issues while limiting less important ones
var DETAIL_LIMITS = {
    critical: Number.MAX_SAFE_INTEGER, // No limit for critical issues
    serious: 15, // Up to 15 items for serious issues
    moderate: 10, // Up to 10 items for moderate issues
    minor: 3, // Up to 3 items for minor issues
};
/**
 * Runs an accessibility audit on the specified URL
 * @param url The URL to audit
 * @returns Promise resolving to AI-optimized accessibility audit results
 */
function runAccessibilityAudit(url) {
    return __awaiter(this, void 0, void 0, function () {
        var lhr, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, index_js_1.runLighthouseAudit)(url, [types_js_1.AuditCategory.ACCESSIBILITY])];
                case 1:
                    lhr = _a.sent();
                    return [2 /*return*/, extractAIOptimizedData(lhr, url)];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("Accessibility audit failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extract AI-optimized accessibility data from Lighthouse results
 */
var extractAIOptimizedData = function (lhr, url) {
    var categoryData = lhr.categories[types_js_1.AuditCategory.ACCESSIBILITY];
    var audits = lhr.audits || {};
    // Add metadata
    var metadata = {
        url: url,
        timestamp: lhr.fetchTime || new Date().toISOString(),
        device: "desktop", // This could be made configurable
        lighthouseVersion: lhr.lighthouseVersion,
    };
    // Initialize variables
    var issues = [];
    var criticalElements = [];
    var categories = {};
    // Count audits by type
    var failedCount = 0;
    var passedCount = 0;
    var manualCount = 0;
    var informativeCount = 0;
    var notApplicableCount = 0;
    // Process audit refs
    var auditRefs = (categoryData === null || categoryData === void 0 ? void 0 : categoryData.auditRefs) || [];
    // First pass: count audits by type and initialize categories
    auditRefs.forEach(function (ref) {
        var audit = audits[ref.id];
        if (!audit)
            return;
        // Count by scoreDisplayMode
        if (audit.scoreDisplayMode === "manual") {
            manualCount++;
        }
        else if (audit.scoreDisplayMode === "informative") {
            informativeCount++;
        }
        else if (audit.scoreDisplayMode === "notApplicable") {
            notApplicableCount++;
        }
        else if (audit.score !== null) {
            // Binary pass/fail
            if (audit.score >= 0.9) {
                passedCount++;
            }
            else {
                failedCount++;
            }
        }
        // Process categories
        if (ref.group) {
            // Initialize category if not exists
            if (!categories[ref.group]) {
                categories[ref.group] = { score: 0, issues_count: 0 };
            }
            // Update category score and issues count
            if (audit.score !== null && audit.score < 0.9) {
                categories[ref.group].issues_count++;
            }
        }
    });
    // Second pass: process failed audits into AI-friendly format
    auditRefs
        .filter(function (ref) {
        var audit = audits[ref.id];
        return audit && audit.score !== null && audit.score < 0.9;
    })
        .sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); })
        // No limit on number of failed audits - we'll show them all
        .forEach(function (ref) {
        var audit = audits[ref.id];
        // Determine impact level based on score and weight
        var impact = "moderate";
        if (audit.score === 0) {
            impact = "critical";
        }
        else if (audit.score !== null && audit.score <= 0.5) {
            impact = "serious";
        }
        else if (audit.score !== null && audit.score > 0.7) {
            impact = "minor";
        }
        // Create elements array
        var elements = [];
        if (audit.details) {
            var details = audit.details;
            if (details.items && Array.isArray(details.items)) {
                var items = details.items;
                // Apply limits based on impact level
                var itemLimit = DETAIL_LIMITS[impact];
                items.slice(0, itemLimit).forEach(function (item) {
                    if (item.node) {
                        var element = {
                            selector: item.node.selector,
                            snippet: item.node.snippet,
                            label: item.node.nodeLabel,
                            issue_description: item.node.explanation || item.explanation,
                        };
                        if (item.value !== undefined) {
                            element.value = item.value;
                        }
                        elements.push(element);
                        // Add to critical elements if impact is critical or serious
                        if (impact === "critical" || impact === "serious") {
                            criticalElements.push(element);
                        }
                    }
                });
            }
        }
        // Create the issue
        var issue = {
            id: ref.id,
            title: audit.title,
            impact: impact,
            category: ref.group || "other",
            elements: elements.length > 0 ? elements : undefined,
            score: audit.score,
        };
        issues.push(issue);
    });
    // Calculate overall score
    var score = Math.round(((categoryData === null || categoryData === void 0 ? void 0 : categoryData.score) || 0) * 100);
    // Generate prioritized recommendations
    var prioritized_recommendations = [];
    // Add category-specific recommendations
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
            case "a11y-color-contrast":
                recommendation = "Improve color contrast for better readability";
                break;
            case "a11y-names-labels":
                recommendation = "Add proper labels to all interactive elements";
                break;
            case "a11y-aria":
                recommendation = "Fix ARIA attributes and roles";
                break;
            case "a11y-navigation":
                recommendation = "Improve keyboard navigation and focus management";
                break;
            case "a11y-language":
                recommendation = "Add proper language attributes to HTML";
                break;
            case "a11y-tables-lists":
                recommendation = "Fix table and list structures for screen readers";
                break;
            default:
                recommendation = "Fix ".concat(data.issues_count, " issues in ").concat(category);
        }
        prioritized_recommendations.push(recommendation);
    });
    // Add specific high-impact recommendations
    if (issues.some(function (issue) { return issue.id === "color-contrast"; })) {
        prioritized_recommendations.push("Fix low contrast text for better readability");
    }
    if (issues.some(function (issue) { return issue.id === "document-title"; })) {
        prioritized_recommendations.push("Add a descriptive page title");
    }
    if (issues.some(function (issue) { return issue.id === "image-alt"; })) {
        prioritized_recommendations.push("Add alt text to all images");
    }
    // Create the report content
    var reportContent = {
        score: score,
        audit_counts: {
            failed: failedCount,
            passed: passedCount,
            manual: manualCount,
            informative: informativeCount,
            not_applicable: notApplicableCount,
        },
        issues: issues,
        categories: categories,
        critical_elements: criticalElements,
        prioritized_recommendations: prioritized_recommendations.length > 0
            ? prioritized_recommendations
            : undefined,
    };
    // Return the full report following the LighthouseReport interface
    return {
        metadata: metadata,
        report: reportContent,
    };
};
