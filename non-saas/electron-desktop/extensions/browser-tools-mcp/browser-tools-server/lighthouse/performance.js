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
exports.runPerformanceAudit = runPerformanceAudit;
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
 * Performance audit adapted for AI consumption
 * This format is optimized for AI agents with:
 * - Concise, relevant information without redundant descriptions
 * - Key metrics and opportunities clearly structured
 * - Only actionable data that an AI can use for recommendations
 */
function runPerformanceAudit(url) {
    return __awaiter(this, void 0, void 0, function () {
        var lhr, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, index_js_1.runLighthouseAudit)(url, [types_js_1.AuditCategory.PERFORMANCE])];
                case 1:
                    lhr = _a.sent();
                    return [2 /*return*/, extractAIOptimizedData(lhr, url)];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("Performance audit failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extract AI-optimized performance data from Lighthouse results
 */
var extractAIOptimizedData = function (lhr, url) {
    var _a, _b, _c;
    var audits = lhr.audits || {};
    var categoryData = lhr.categories[types_js_1.AuditCategory.PERFORMANCE];
    var score = Math.round(((categoryData === null || categoryData === void 0 ? void 0 : categoryData.score) || 0) * 100);
    // Add metadata
    var metadata = {
        url: url,
        timestamp: lhr.fetchTime || new Date().toISOString(),
        device: "desktop", // This could be made configurable
        lighthouseVersion: lhr.lighthouseVersion,
    };
    // Count audits by type
    var auditRefs = (categoryData === null || categoryData === void 0 ? void 0 : categoryData.auditRefs) || [];
    var failedCount = 0;
    var passedCount = 0;
    var manualCount = 0;
    var informativeCount = 0;
    var notApplicableCount = 0;
    auditRefs.forEach(function (ref) {
        var audit = audits[ref.id];
        if (!audit)
            return;
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
            if (audit.score >= 0.9) {
                passedCount++;
            }
            else {
                failedCount++;
            }
        }
    });
    var audit_counts = {
        failed: failedCount,
        passed: passedCount,
        manual: manualCount,
        informative: informativeCount,
        not_applicable: notApplicableCount,
    };
    var metrics = [];
    var opportunities = [];
    // Extract core metrics
    if (audits["largest-contentful-paint"]) {
        var lcp = audits["largest-contentful-paint"];
        var lcpElement = audits["largest-contentful-paint-element"];
        var metric = {
            id: "lcp",
            score: lcp.score,
            value_ms: Math.round(lcp.numericValue || 0),
            passes_core_web_vital: lcp.score !== null && lcp.score >= 0.9,
        };
        // Enhanced LCP element detection
        // 1. Try from largest-contentful-paint-element audit
        if (lcpElement && lcpElement.details) {
            var lcpDetails = lcpElement.details;
            // First attempt - try to get directly from items
            if (lcpDetails.items &&
                Array.isArray(lcpDetails.items) &&
                lcpDetails.items.length > 0) {
                var item = lcpDetails.items[0];
                // For text elements in tables format
                if (item.type === "table" && item.items && item.items.length > 0) {
                    var firstTableItem = item.items[0];
                    if (firstTableItem.node) {
                        if (firstTableItem.node.selector) {
                            metric.element_selector = firstTableItem.node.selector;
                        }
                        // Determine element type based on path or selector
                        var path = firstTableItem.node.path;
                        var selector = firstTableItem.node.selector || "";
                        if (path) {
                            if (selector.includes(" > img") ||
                                selector.includes(" img") ||
                                selector.endsWith("img") ||
                                path.includes(",IMG")) {
                                metric.element_type = "image";
                                // Try to extract image name from selector
                                var imgMatch = selector.match(/img[.][^> ]+/);
                                if (imgMatch && !metric.element_url) {
                                    metric.element_url = imgMatch[0];
                                }
                            }
                            else if (path.includes(",SPAN") ||
                                path.includes(",P") ||
                                path.includes(",H")) {
                                metric.element_type = "text";
                            }
                        }
                        // Try to extract text content if available
                        if (firstTableItem.node.nodeLabel) {
                            metric.element_content = firstTableItem.node.nodeLabel.substring(0, 100);
                        }
                    }
                }
                // Original handling for direct items
                else if ((_a = item.node) === null || _a === void 0 ? void 0 : _a.nodeLabel) {
                    // Determine element type from node label
                    if (item.node.nodeLabel.startsWith("<img")) {
                        metric.element_type = "image";
                        // Try to extract image URL from the node snippet
                        var match = (_b = item.node.snippet) === null || _b === void 0 ? void 0 : _b.match(/src="([^"]+)"/);
                        if (match && match[1]) {
                            metric.element_url = match[1];
                        }
                    }
                    else if (item.node.nodeLabel.startsWith("<video")) {
                        metric.element_type = "video";
                    }
                    else if (item.node.nodeLabel.startsWith("<h")) {
                        metric.element_type = "heading";
                    }
                    else {
                        metric.element_type = "text";
                    }
                    if ((_c = item.node) === null || _c === void 0 ? void 0 : _c.selector) {
                        metric.element_selector = item.node.selector;
                    }
                }
            }
        }
        // 2. Try from lcp-lazy-loaded audit
        var lcpImageAudit = audits["lcp-lazy-loaded"];
        if (lcpImageAudit && lcpImageAudit.details) {
            var lcpImageDetails = lcpImageAudit.details;
            if (lcpImageDetails.items &&
                Array.isArray(lcpImageDetails.items) &&
                lcpImageDetails.items.length > 0) {
                var item = lcpImageDetails.items[0];
                if (item.url) {
                    metric.element_type = "image";
                    metric.element_url = item.url;
                }
            }
        }
        // 3. Try directly from the LCP audit details
        if (!metric.element_url && lcp.details) {
            var lcpDirectDetails = lcp.details;
            if (lcpDirectDetails.items && Array.isArray(lcpDirectDetails.items)) {
                for (var _i = 0, _d = lcpDirectDetails.items; _i < _d.length; _i++) {
                    var item = _d[_i];
                    if (item.url || (item.node && item.node.path)) {
                        if (item.url) {
                            metric.element_url = item.url;
                            metric.element_type = item.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                                ? "image"
                                : "resource";
                        }
                        if (item.node && item.node.selector) {
                            metric.element_selector = item.node.selector;
                        }
                        break;
                    }
                }
            }
        }
        // 4. Check for specific audit that might contain image info
        var largestImageAudit = audits["largest-image-paint"];
        if (largestImageAudit && largestImageAudit.details) {
            var imageDetails = largestImageAudit.details;
            if (imageDetails.items &&
                Array.isArray(imageDetails.items) &&
                imageDetails.items.length > 0) {
                var item = imageDetails.items[0];
                if (item.url) {
                    // If we have a large image that's close in time to LCP, it's likely the LCP element
                    metric.element_type = "image";
                    metric.element_url = item.url;
                }
            }
        }
        // 5. Check for network requests audit to find image resources
        if (!metric.element_url) {
            var networkRequests_1 = audits["network-requests"];
            if (networkRequests_1 && networkRequests_1.details) {
                var networkDetails = networkRequests_1.details;
                if (networkDetails.items && Array.isArray(networkDetails.items)) {
                    // Get all image resources loaded close to the LCP time
                    var lcpTime_1 = lcp.numericValue || 0;
                    var imageResources = networkDetails.items
                        .filter(function (item) {
                        return item.url &&
                            item.mimeType &&
                            item.mimeType.startsWith("image/") &&
                            item.endTime &&
                            Math.abs(item.endTime - lcpTime_1) < 500;
                    } // Within 500ms of LCP
                    )
                        .sort(function (a, b) {
                        return Math.abs(a.endTime - lcpTime_1) - Math.abs(b.endTime - lcpTime_1);
                    });
                    if (imageResources.length > 0) {
                        var closestImage = imageResources[0];
                        if (!metric.element_type) {
                            metric.element_type = "image";
                            metric.element_url = closestImage.url;
                        }
                    }
                }
            }
        }
        metrics.push(metric);
    }
    if (audits["first-contentful-paint"]) {
        var fcp = audits["first-contentful-paint"];
        metrics.push({
            id: "fcp",
            score: fcp.score,
            value_ms: Math.round(fcp.numericValue || 0),
            passes_core_web_vital: fcp.score !== null && fcp.score >= 0.9,
        });
    }
    if (audits["speed-index"]) {
        var si = audits["speed-index"];
        metrics.push({
            id: "si",
            score: si.score,
            value_ms: Math.round(si.numericValue || 0),
        });
    }
    if (audits["interactive"]) {
        var tti = audits["interactive"];
        metrics.push({
            id: "tti",
            score: tti.score,
            value_ms: Math.round(tti.numericValue || 0),
        });
    }
    // Add CLS (Cumulative Layout Shift)
    if (audits["cumulative-layout-shift"]) {
        var cls = audits["cumulative-layout-shift"];
        metrics.push({
            id: "cls",
            score: cls.score,
            // CLS is not in ms, but a unitless value
            value_ms: Math.round((cls.numericValue || 0) * 1000) / 1000, // Convert to 3 decimal places
            passes_core_web_vital: cls.score !== null && cls.score >= 0.9,
        });
    }
    // Add TBT (Total Blocking Time)
    if (audits["total-blocking-time"]) {
        var tbt = audits["total-blocking-time"];
        metrics.push({
            id: "tbt",
            score: tbt.score,
            value_ms: Math.round(tbt.numericValue || 0),
            passes_core_web_vital: tbt.score !== null && tbt.score >= 0.9,
        });
    }
    // Extract opportunities
    if (audits["render-blocking-resources"]) {
        var rbrAudit = audits["render-blocking-resources"];
        // Determine impact level based on potential savings
        var impact = "moderate";
        var savings = Math.round(rbrAudit.numericValue || 0);
        if (savings > 2000) {
            impact = "critical";
        }
        else if (savings > 1000) {
            impact = "serious";
        }
        else if (savings < 300) {
            impact = "minor";
        }
        var opportunity_1 = {
            id: "render_blocking_resources",
            savings_ms: savings,
            severity: impact,
            resources: [],
        };
        var rbrDetails = rbrAudit.details;
        if (rbrDetails && rbrDetails.items && Array.isArray(rbrDetails.items)) {
            // Determine how many items to include based on impact
            var itemLimit = DETAIL_LIMITS[impact];
            rbrDetails.items
                .slice(0, itemLimit)
                .forEach(function (item) {
                if (item.url) {
                    // Extract file name from full URL
                    var fileName = item.url.split("/").pop() || item.url;
                    opportunity_1.resources.push({
                        url: fileName,
                        savings_ms: Math.round(item.wastedMs || 0),
                    });
                }
            });
        }
        if (opportunity_1.resources.length > 0) {
            opportunities.push(opportunity_1);
        }
    }
    if (audits["uses-http2"]) {
        var http2Audit = audits["uses-http2"];
        // Determine impact level based on potential savings
        var impact = "moderate";
        var savings = Math.round(http2Audit.numericValue || 0);
        if (savings > 2000) {
            impact = "critical";
        }
        else if (savings > 1000) {
            impact = "serious";
        }
        else if (savings < 300) {
            impact = "minor";
        }
        var opportunity_2 = {
            id: "http2",
            savings_ms: savings,
            severity: impact,
            resources: [],
        };
        var http2Details = http2Audit.details;
        if (http2Details &&
            http2Details.items &&
            Array.isArray(http2Details.items)) {
            // Determine how many items to include based on impact
            var itemLimit = DETAIL_LIMITS[impact];
            http2Details.items
                .slice(0, itemLimit)
                .forEach(function (item) {
                if (item.url) {
                    // Extract file name from full URL
                    var fileName = item.url.split("/").pop() || item.url;
                    opportunity_2.resources.push({ url: fileName });
                }
            });
        }
        if (opportunity_2.resources.length > 0) {
            opportunities.push(opportunity_2);
        }
    }
    // After extracting all metrics and opportunities, collect page stats
    // Extract page stats
    var page_stats;
    // Total page stats
    var totalByteWeight = audits["total-byte-weight"];
    var networkRequests = audits["network-requests"];
    var thirdPartyAudit = audits["third-party-summary"];
    var mainThreadWork = audits["mainthread-work-breakdown"];
    if (networkRequests && networkRequests.details) {
        var resourceDetails = networkRequests.details;
        if (resourceDetails.items && Array.isArray(resourceDetails.items)) {
            var resources = resourceDetails.items;
            var totalRequests = resources.length;
            // Calculate total size and counts by type
            var totalSizeKb_1 = 0;
            var jsCount_1 = 0, cssCount_1 = 0, imgCount_1 = 0, fontCount_1 = 0, otherCount_1 = 0;
            resources.forEach(function (resource) {
                var sizeKb = resource.transferSize
                    ? Math.round(resource.transferSize / 1024)
                    : 0;
                totalSizeKb_1 += sizeKb;
                // Count by mime type
                var mimeType = resource.mimeType || "";
                if (mimeType.includes("javascript") || resource.url.endsWith(".js")) {
                    jsCount_1++;
                }
                else if (mimeType.includes("css") || resource.url.endsWith(".css")) {
                    cssCount_1++;
                }
                else if (mimeType.includes("image") ||
                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.url)) {
                    imgCount_1++;
                }
                else if (mimeType.includes("font") ||
                    /\.(woff|woff2|ttf|otf|eot)$/i.test(resource.url)) {
                    fontCount_1++;
                }
                else {
                    otherCount_1++;
                }
            });
            // Calculate third-party size
            var thirdPartySizeKb_1 = 0;
            if (thirdPartyAudit && thirdPartyAudit.details) {
                var thirdPartyDetails = thirdPartyAudit.details;
                if (thirdPartyDetails.items && Array.isArray(thirdPartyDetails.items)) {
                    thirdPartyDetails.items.forEach(function (item) {
                        if (item.transferSize) {
                            thirdPartySizeKb_1 += Math.round(item.transferSize / 1024);
                        }
                    });
                }
            }
            // Get main thread blocking time
            var mainThreadBlockingTimeMs = 0;
            if (mainThreadWork && mainThreadWork.numericValue) {
                mainThreadBlockingTimeMs = Math.round(mainThreadWork.numericValue);
            }
            // Create page stats object
            page_stats = {
                total_size_kb: totalSizeKb_1,
                total_requests: totalRequests,
                resource_counts: {
                    js: jsCount_1,
                    css: cssCount_1,
                    img: imgCount_1,
                    font: fontCount_1,
                    other: otherCount_1,
                },
                third_party_size_kb: thirdPartySizeKb_1,
                main_thread_blocking_time_ms: mainThreadBlockingTimeMs,
            };
        }
    }
    // Generate prioritized recommendations
    var prioritized_recommendations = [];
    // Add key recommendations based on failed audits with high impact
    if (audits["render-blocking-resources"] &&
        audits["render-blocking-resources"].score !== null &&
        audits["render-blocking-resources"].score === 0) {
        prioritized_recommendations.push("Eliminate render-blocking resources");
    }
    if (audits["uses-responsive-images"] &&
        audits["uses-responsive-images"].score !== null &&
        audits["uses-responsive-images"].score === 0) {
        prioritized_recommendations.push("Properly size images");
    }
    if (audits["uses-optimized-images"] &&
        audits["uses-optimized-images"].score !== null &&
        audits["uses-optimized-images"].score === 0) {
        prioritized_recommendations.push("Efficiently encode images");
    }
    if (audits["uses-text-compression"] &&
        audits["uses-text-compression"].score !== null &&
        audits["uses-text-compression"].score === 0) {
        prioritized_recommendations.push("Enable text compression");
    }
    if (audits["uses-http2"] &&
        audits["uses-http2"].score !== null &&
        audits["uses-http2"].score === 0) {
        prioritized_recommendations.push("Use HTTP/2");
    }
    // Add more specific recommendations based on Core Web Vitals
    if (audits["largest-contentful-paint"] &&
        audits["largest-contentful-paint"].score !== null &&
        audits["largest-contentful-paint"].score < 0.5) {
        prioritized_recommendations.push("Improve Largest Contentful Paint (LCP)");
    }
    if (audits["cumulative-layout-shift"] &&
        audits["cumulative-layout-shift"].score !== null &&
        audits["cumulative-layout-shift"].score < 0.5) {
        prioritized_recommendations.push("Reduce layout shifts (CLS)");
    }
    if (audits["total-blocking-time"] &&
        audits["total-blocking-time"].score !== null &&
        audits["total-blocking-time"].score < 0.5) {
        prioritized_recommendations.push("Reduce JavaScript execution time");
    }
    // Create the performance report content
    var reportContent = {
        score: score,
        audit_counts: audit_counts,
        metrics: metrics,
        opportunities: opportunities,
        page_stats: page_stats,
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
