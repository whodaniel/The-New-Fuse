#!/usr/bin/env node
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
exports.BrowserConnector = void 0;
var express_1 = require("express");
var cors_1 = require("cors");
var body_parser_1 = require("body-parser");
var ws_1 = require("ws");
var fs_1 = require("fs");
var path_1 = require("path");
var os_1 = require("os");
var child_process_1 = require("child_process");
var index_js_1 = require("./lighthouse/index.js");
var net = require("net");
var best_practices_js_1 = require("./lighthouse/best-practices.js");
/**
 * Converts a file path to the appropriate format for the current platform
 * Handles Windows, WSL, macOS and Linux path formats
 *
 * @param inputPath - The path to convert
 * @returns The converted path appropriate for the current platform
 */
function convertPathForCurrentPlatform(inputPath) {
    var platform = os_1.default.platform();
    // If no path provided, return as is
    if (!inputPath)
        return inputPath;
    console.log("Converting path \"".concat(inputPath, "\" for platform: ").concat(platform));
    // Windows-specific conversion
    if (platform === "win32") {
        // Convert forward slashes to backslashes
        return inputPath.replace(/\//g, "\\");
    }
    // Linux/Mac-specific conversion
    if (platform === "linux" || platform === "darwin") {
        // Check if this is a Windows UNC path (starts with \\)
        if (inputPath.startsWith("\\\\") || inputPath.includes("\\")) {
            // Check if this is a WSL path (contains wsl.localhost or wsl$)
            if (inputPath.includes("wsl.localhost") || inputPath.includes("wsl$")) {
                // Extract the path after the distribution name
                // Handle both \\wsl.localhost\Ubuntu\path and \\wsl$\Ubuntu\path formats
                var parts = inputPath.split("\\").filter(function (part) { return part.length > 0; });
                console.log("Path parts:", parts);
                // Find the index after the distribution name
                var distNames = [
                    "Ubuntu",
                    "Debian",
                    "kali",
                    "openSUSE",
                    "SLES",
                    "Fedora",
                ];
                // Find the distribution name in the path
                var distIndex = -1;
                var _loop_1 = function (dist) {
                    var index = parts.findIndex(function (part) { return part === dist || part.toLowerCase() === dist.toLowerCase(); });
                    if (index !== -1) {
                        distIndex = index;
                        return "break";
                    }
                };
                for (var _i = 0, distNames_1 = distNames; _i < distNames_1.length; _i++) {
                    var dist = distNames_1[_i];
                    var state_1 = _loop_1(dist);
                    if (state_1 === "break")
                        break;
                }
                if (distIndex !== -1 && distIndex + 1 < parts.length) {
                    // Reconstruct the path as a native Linux path
                    var linuxPath = "/" + parts.slice(distIndex + 1).join("/");
                    console.log("Converted Windows WSL path \"".concat(inputPath, "\" to Linux path \"").concat(linuxPath, "\""));
                    return linuxPath;
                }
                // If we couldn't find a distribution name but it's clearly a WSL path,
                // try to extract everything after wsl.localhost or wsl$
                var wslIndex = parts.findIndex(function (part) {
                    return part === "wsl.localhost" ||
                        part === "wsl$" ||
                        part.toLowerCase() === "wsl.localhost" ||
                        part.toLowerCase() === "wsl$";
                });
                if (wslIndex !== -1 && wslIndex + 2 < parts.length) {
                    // Skip the WSL prefix and distribution name
                    var linuxPath = "/" + parts.slice(wslIndex + 2).join("/");
                    console.log("Converted Windows WSL path \"".concat(inputPath, "\" to Linux path \"").concat(linuxPath, "\""));
                    return linuxPath;
                }
            }
            // For non-WSL Windows paths, just normalize the slashes
            var normalizedPath = inputPath
                .replace(/\\\\/g, "/")
                .replace(/\\/g, "/");
            console.log("Converted Windows UNC path \"".concat(inputPath, "\" to \"").concat(normalizedPath, "\""));
            return normalizedPath;
        }
        // Handle Windows drive letters (e.g., C:\path\to\file)
        if (/^[A-Z]:\\/i.test(inputPath)) {
            // Convert Windows drive path to Linux/Mac compatible path
            var normalizedPath = inputPath
                .replace(/^[A-Z]:\\/i, "/")
                .replace(/\\/g, "/");
            console.log("Converted Windows drive path \"".concat(inputPath, "\" to \"").concat(normalizedPath, "\""));
            return normalizedPath;
        }
    }
    // Return the original path if no conversion was needed or possible
    return inputPath;
}
// Function to get default downloads folder
function getDefaultDownloadsFolder() {
    var homeDir = os_1.default.homedir();
    // Downloads folder is typically the same path on Windows, macOS, and Linux
    var downloadsPath = path_1.default.join(homeDir, "Downloads", "mcp-screenshots");
    return downloadsPath;
}
// We store logs in memory
var consoleLogs = [];
var consoleErrors = [];
var networkErrors = [];
var networkSuccess = [];
var allXhr = [];
// Store the current URL from the extension
var currentUrl = "";
// Store the current tab ID from the extension
var currentTabId = null;
// Add settings state
var currentSettings = {
    logLimit: 50,
    queryLimit: 30000,
    showRequestHeaders: false,
    showResponseHeaders: false,
    model: "claude-3-sonnet",
    stringSizeLimit: 500,
    maxLogSize: 20000,
    screenshotPath: getDefaultDownloadsFolder(),
    // Add server host configuration
    serverHost: process.env.SERVER_HOST || "0.0.0.0", // Default to all interfaces
};
// Add new storage for selected element
var selectedElement = null;
var screenshotCallbacks = new Map();
// Function to get available port starting with the given port
function getAvailablePort(startPort_1) {
    return __awaiter(this, arguments, void 0, function (startPort, maxAttempts) {
        var currentPort, attempts, error_1;
        if (maxAttempts === void 0) { maxAttempts = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentPort = startPort;
                    attempts = 0;
                    _a.label = 1;
                case 1:
                    if (!(attempts < maxAttempts)) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    // Try to create a server on the current port
                    // We'll use a raw Node.js net server for just testing port availability
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var testServer = net.createServer();
                            // Handle errors (e.g., port in use)
                            testServer.once("error", function (err) {
                                if (err.code === "EADDRINUSE") {
                                    console.log("Port ".concat(currentPort, " is in use, trying next port..."));
                                    currentPort++;
                                    attempts++;
                                    resolve(); // Continue to next iteration
                                }
                                else {
                                    reject(err); // Different error, propagate it
                                }
                            });
                            // If we can listen, the port is available
                            testServer.once("listening", function () {
                                // Make sure to close the server to release the port
                                testServer.close(function () {
                                    console.log("Found available port: ".concat(currentPort));
                                    resolve();
                                });
                            });
                            // Try to listen on the current port
                            testServer.listen(currentPort, currentSettings.serverHost);
                        })];
                case 3:
                    // Try to create a server on the current port
                    // We'll use a raw Node.js net server for just testing port availability
                    _a.sent();
                    // If we reach here without incrementing the port, it means the port is available
                    return [2 /*return*/, currentPort];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error checking port ".concat(currentPort, ":"), error_1);
                    // For non-EADDRINUSE errors, try the next port
                    currentPort++;
                    attempts++;
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 1];
                case 6: 
                // If we've exhausted all attempts, throw an error
                throw new Error("Could not find an available port after ".concat(maxAttempts, " attempts starting from ").concat(startPort));
            }
        });
    });
}
// Start with requested port and find an available one
var REQUESTED_PORT = parseInt(process.env.PORT || "3025", 10);
var PORT = REQUESTED_PORT;
// Create application and initialize middleware
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Increase JSON body parser limit to 50MB to handle large screenshots
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "50mb", extended: true }));
// Helper to recursively truncate strings in any data structure
function truncateStringsInData(data, maxLength) {
    if (typeof data === "string") {
        return data.length > maxLength
            ? data.substring(0, maxLength) + "... (truncated)"
            : data;
    }
    if (Array.isArray(data)) {
        return data.map(function (item) { return truncateStringsInData(item, maxLength); });
    }
    if (typeof data === "object" && data !== null) {
        var result = {};
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            result[key] = truncateStringsInData(value, maxLength);
        }
        return result;
    }
    return data;
}
// Helper to safely parse and process JSON strings
function processJsonString(jsonString, maxLength) {
    try {
        // Try to parse the string as JSON
        var parsed = JSON.parse(jsonString);
        // Process any strings within the parsed JSON
        var processed = truncateStringsInData(parsed, maxLength);
        // Stringify the processed data
        return JSON.stringify(processed);
    }
    catch (e) {
        // If it's not valid JSON, treat it as a regular string
        return truncateStringsInData(jsonString, maxLength);
    }
}
// Helper to process logs based on settings
function processLogsWithSettings(logs) {
    return logs.map(function (log) {
        var processedLog = __assign({}, log);
        if (log.type === "network-request") {
            // Handle headers visibility
            if (!currentSettings.showRequestHeaders) {
                delete processedLog.requestHeaders;
            }
            if (!currentSettings.showResponseHeaders) {
                delete processedLog.responseHeaders;
            }
        }
        return processedLog;
    });
}
// Helper to calculate size of a log entry
function calculateLogSize(log) {
    return JSON.stringify(log).length;
}
// Helper to truncate logs based on character limit
function truncateLogsToQueryLimit(logs) {
    if (logs.length === 0)
        return logs;
    // First process logs according to current settings
    var processedLogs = processLogsWithSettings(logs);
    var currentSize = 0;
    var result = [];
    for (var _i = 0, processedLogs_1 = processedLogs; _i < processedLogs_1.length; _i++) {
        var log = processedLogs_1[_i];
        var logSize = calculateLogSize(log);
        // Check if adding this log would exceed the limit
        if (currentSize + logSize > currentSettings.queryLimit) {
            console.log("Reached query limit (".concat(currentSize, "/").concat(currentSettings.queryLimit, "), truncating logs"));
            break;
        }
        // Add log and update size
        result.push(log);
        currentSize += logSize;
        console.log("Added log of size ".concat(logSize, ", total size now: ").concat(currentSize));
    }
    return result;
}
// Endpoint for the extension to POST data
app.post("/extension-log", function (req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    console.log("\n=== Received Extension Log ===");
    console.log("Request body:", {
        dataType: (_a = req.body.data) === null || _a === void 0 ? void 0 : _a.type,
        timestamp: (_b = req.body.data) === null || _b === void 0 ? void 0 : _b.timestamp,
        hasSettings: !!req.body.settings,
    });
    var _k = req.body, data = _k.data, settings = _k.settings;
    // Update settings if provided
    if (settings) {
        console.log("Updating settings:", settings);
        currentSettings = __assign(__assign({}, currentSettings), settings);
    }
    if (!data) {
        console.log("Warning: No data received in log request");
        res.status(400).json({ status: "error", message: "No data provided" });
        return;
    }
    console.log("Processing ".concat(data.type, " log entry"));
    switch (data.type) {
        case "page-navigated":
            // Handle page navigation event via HTTP POST
            // Note: This is also handled in the WebSocket message handler
            // as the extension may send navigation events through either channel
            console.log("Received page navigation event with URL:", data.url);
            currentUrl = data.url;
            // Also update the tab ID if provided
            if (data.tabId) {
                console.log("Updating tab ID from page navigation event:", data.tabId);
                currentTabId = data.tabId;
            }
            console.log("Updated current URL:", currentUrl);
            break;
        case "console-log":
            console.log("Adding console log:", {
                level: data.level,
                message: ((_c = data.message) === null || _c === void 0 ? void 0 : _c.substring(0, 100)) +
                    (((_d = data.message) === null || _d === void 0 ? void 0 : _d.length) > 100 ? "..." : ""),
                timestamp: data.timestamp,
            });
            consoleLogs.push(data);
            if (consoleLogs.length > currentSettings.logLimit) {
                console.log("Console logs exceeded limit (".concat(currentSettings.logLimit, "), removing oldest entry"));
                consoleLogs.shift();
            }
            break;
        case "console-error":
            console.log("Adding console error:", {
                level: data.level,
                message: ((_e = data.message) === null || _e === void 0 ? void 0 : _e.substring(0, 100)) +
                    (((_f = data.message) === null || _f === void 0 ? void 0 : _f.length) > 100 ? "..." : ""),
                timestamp: data.timestamp,
            });
            consoleErrors.push(data);
            if (consoleErrors.length > currentSettings.logLimit) {
                console.log("Console errors exceeded limit (".concat(currentSettings.logLimit, "), removing oldest entry"));
                consoleErrors.shift();
            }
            break;
        case "network-request":
            var logEntry = {
                url: data.url,
                method: data.method,
                status: data.status,
                timestamp: data.timestamp,
            };
            console.log("Adding network request:", logEntry);
            // Route network requests based on status code
            if (data.status >= 400) {
                networkErrors.push(data);
                if (networkErrors.length > currentSettings.logLimit) {
                    console.log("Network errors exceeded limit (".concat(currentSettings.logLimit, "), removing oldest entry"));
                    networkErrors.shift();
                }
            }
            else {
                networkSuccess.push(data);
                if (networkSuccess.length > currentSettings.logLimit) {
                    console.log("Network success logs exceeded limit (".concat(currentSettings.logLimit, "), removing oldest entry"));
                    networkSuccess.shift();
                }
            }
            break;
        case "selected-element":
            console.log("Updating selected element:", {
                tagName: (_g = data.element) === null || _g === void 0 ? void 0 : _g.tagName,
                id: (_h = data.element) === null || _h === void 0 ? void 0 : _h.id,
                className: (_j = data.element) === null || _j === void 0 ? void 0 : _j.className,
            });
            selectedElement = data.element;
            break;
        default:
            console.log("Unknown log type:", data.type);
    }
    console.log("Current log counts:", {
        consoleLogs: consoleLogs.length,
        consoleErrors: consoleErrors.length,
        networkErrors: networkErrors.length,
        networkSuccess: networkSuccess.length,
    });
    console.log("=== End Extension Log ===\n");
    res.json({ status: "ok" });
});
// Update GET endpoints to use the new function
app.get("/console-logs", function (req, res) {
    var truncatedLogs = truncateLogsToQueryLimit(consoleLogs);
    res.json(truncatedLogs);
});
app.get("/console-errors", function (req, res) {
    var truncatedLogs = truncateLogsToQueryLimit(consoleErrors);
    res.json(truncatedLogs);
});
app.get("/network-errors", function (req, res) {
    var truncatedLogs = truncateLogsToQueryLimit(networkErrors);
    res.json(truncatedLogs);
});
app.get("/network-success", function (req, res) {
    var truncatedLogs = truncateLogsToQueryLimit(networkSuccess);
    res.json(truncatedLogs);
});
app.get("/all-xhr", function (req, res) {
    // Merge and sort network success and error logs by timestamp
    var mergedLogs = __spreadArray(__spreadArray([], networkSuccess, true), networkErrors, true).sort(function (a, b) { return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); });
    var truncatedLogs = truncateLogsToQueryLimit(mergedLogs);
    res.json(truncatedLogs);
});
// Add new endpoint for selected element
app.post("/selected-element", function (req, res) {
    var data = req.body.data;
    selectedElement = data;
    res.json({ status: "ok" });
});
app.get("/selected-element", function (req, res) {
    res.json(selectedElement || { message: "No element selected" });
});
app.get("/.port", function (req, res) {
    res.send(PORT.toString());
});
// Add new identity endpoint with a unique signature
app.get("/.identity", function (req, res) {
    res.json({
        port: PORT,
        name: "browser-tools-server",
        version: "1.2.0",
        signature: "mcp-browser-connector-24x7",
    });
});
// Add function to clear all logs
function clearAllLogs() {
    console.log("Wiping all logs...");
    consoleLogs.length = 0;
    consoleErrors.length = 0;
    networkErrors.length = 0;
    networkSuccess.length = 0;
    allXhr.length = 0;
    selectedElement = null;
    console.log("All logs have been wiped");
}
// Add endpoint to wipe logs
app.post("/wipelogs", function (req, res) {
    clearAllLogs();
    res.json({ status: "ok", message: "All logs cleared successfully" });
});
// Add endpoint for the extension to report the current URL
app.post("/current-url", function (req, res) {
    console.log("Received current URL update request:", JSON.stringify(req.body, null, 2));
    if (req.body && req.body.url) {
        var oldUrl = currentUrl;
        currentUrl = req.body.url;
        // Update the current tab ID if provided
        if (req.body.tabId) {
            var oldTabId = currentTabId;
            currentTabId = req.body.tabId;
            console.log("Updated current tab ID: ".concat(oldTabId, " -> ").concat(currentTabId));
        }
        // Log the source of the update if provided
        var source = req.body.source || "unknown";
        var tabId = req.body.tabId || "unknown";
        var timestamp = req.body.timestamp
            ? new Date(req.body.timestamp).toISOString()
            : "unknown";
        console.log("Updated current URL via dedicated endpoint: ".concat(oldUrl, " -> ").concat(currentUrl));
        console.log("URL update details: source=".concat(source, ", tabId=").concat(tabId, ", timestamp=").concat(timestamp));
        res.json({
            status: "ok",
            url: currentUrl,
            tabId: currentTabId,
            previousUrl: oldUrl,
            updated: oldUrl !== currentUrl,
        });
    }
    else {
        console.log("No URL provided in current-url request");
        res.status(400).json({ status: "error", message: "No URL provided" });
    }
});
// Add endpoint to get the current URL
app.get("/current-url", function (req, res) {
    console.log("Current URL requested, returning:", currentUrl);
    res.json({ url: currentUrl });
});
// Add endpoint to navigate to a URL
app.post("/navigate", function (req, res) {
    console.log("Navigation request received:", req.body);
    var url = req.body.url;
    if (!url) {
        console.log("Navigation request missing URL");
        res.status(400).json({ error: "Missing URL parameter" });
        return;
    }
    // Validate URL format
    try {
        new URL(url);
    }
    catch (error) {
        console.log("Invalid URL format:", url);
        res.status(400).json({ error: "Invalid URL format" });
        return;
    }
    console.log("Attempting to navigate to: ".concat(url));
    // Use chrome.tabs.update to navigate the current tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.update(currentTabId, { url: url }, function (tab) {
            if (chrome.runtime.lastError) {
                console.error("Navigation failed:", chrome.runtime.lastError);
                res.status(500).json({
                    error: "Navigation failed",
                    details: chrome.runtime.lastError.message
                });
            }
            else {
                console.log("Successfully navigated to: ".concat(url));
                currentUrl = url; // Update the current URL
                res.json({
                    success: true,
                    url: url,
                    message: "Successfully navigated to ".concat(url)
                });
            }
        });
    }
    else {
        // Fallback: try to execute navigation script in the browser
        console.log("Chrome tabs API not available, using script injection");
        // This will be handled by the Chrome extension via WebSocket
        res.json({
            success: true,
            url: url,
            message: "Navigation request sent for ".concat(url)
        });
    }
});
var BrowserConnector = /** @class */ (function () {
    function BrowserConnector(app, server) {
        var _this = this;
        this.activeConnection = null;
        this.urlRequestCallbacks = new Map();
        this.app = app;
        this.server = server;
        // Initialize WebSocket server using the existing HTTP server
        this.wss = new ws_1.WebSocketServer({
            noServer: true,
            path: "/extension-ws",
        });
        // Register the capture-screenshot endpoint
        this.app.post("/capture-screenshot", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Browser Connector: Received request to /capture-screenshot endpoint");
                        console.log("Browser Connector: Request body:", req.body);
                        console.log("Browser Connector: Active WebSocket connection:", !!this.activeConnection);
                        return [4 /*yield*/, this.captureScreenshot(req, res)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Set up accessibility audit endpoint
        this.setupAccessibilityAudit();
        // Set up performance audit endpoint
        this.setupPerformanceAudit();
        // Set up SEO audit endpoint
        this.setupSEOAudit();
        // Set up Best Practices audit endpoint
        this.setupBestPracticesAudit();
        // Handle upgrade requests for WebSocket
        this.server.on("upgrade", function (request, socket, head) {
            if (request.url === "/extension-ws") {
                _this.wss.handleUpgrade(request, socket, head, function (ws) {
                    _this.wss.emit("connection", ws, request);
                });
            }
        });
        this.wss.on("connection", function (ws) {
            console.log("Chrome extension connected via WebSocket");
            _this.activeConnection = ws;
            ws.on("message", function (message) {
                try {
                    var data = JSON.parse(message.toString());
                    // Log message without the base64 data
                    console.log("Received WebSocket message:", __assign(__assign({}, data), { data: data.data ? "[base64 data]" : undefined }));
                    // Handle URL response
                    if (data.type === "current-url-response" && data.url) {
                        console.log("Received current URL from browser:", data.url);
                        currentUrl = data.url;
                        // Also update the tab ID if provided
                        if (data.tabId) {
                            console.log("Updating tab ID from WebSocket message:", data.tabId);
                            currentTabId = data.tabId;
                        }
                        // Call the callback if exists
                        if (data.requestId &&
                            _this.urlRequestCallbacks.has(data.requestId)) {
                            var callback = _this.urlRequestCallbacks.get(data.requestId);
                            if (callback)
                                callback(data.url);
                            _this.urlRequestCallbacks.delete(data.requestId);
                        }
                    }
                    // Handle page navigation event via WebSocket
                    // Note: This is intentionally duplicated from the HTTP handler in /extension-log
                    // as the extension may send navigation events through either channel
                    if (data.type === "page-navigated" && data.url) {
                        console.log("Page navigated to:", data.url);
                        currentUrl = data.url;
                        // Also update the tab ID if provided
                        if (data.tabId) {
                            console.log("Updating tab ID from page navigation event:", data.tabId);
                            currentTabId = data.tabId;
                        }
                    }
                    // Handle screenshot response
                    if (data.type === "screenshot-data" && data.data) {
                        console.log("Received screenshot data");
                        console.log("Screenshot path from extension:", data.path);
                        console.log("Auto-paste setting from extension:", data.autoPaste);
                        // Get the most recent callback since we're not using requestId anymore
                        var callbacks = Array.from(screenshotCallbacks.values());
                        if (callbacks.length > 0) {
                            var callback = callbacks[0];
                            console.log("Found callback, resolving promise");
                            // Pass both the data, path and autoPaste to the resolver
                            callback.resolve({
                                data: data.data,
                                path: data.path,
                                autoPaste: data.autoPaste,
                            });
                            screenshotCallbacks.clear(); // Clear all callbacks
                        }
                        else {
                            console.log("No callbacks found for screenshot");
                        }
                    }
                    // Handle screenshot error
                    else if (data.type === "screenshot-error") {
                        console.log("Received screenshot error:", data.error);
                        var callbacks = Array.from(screenshotCallbacks.values());
                        if (callbacks.length > 0) {
                            var callback = callbacks[0];
                            callback.reject(new Error(data.error || "Screenshot capture failed"));
                            screenshotCallbacks.clear(); // Clear all callbacks
                        }
                    }
                    else {
                        console.log("Unhandled message type:", data.type);
                    }
                }
                catch (error) {
                    console.error("Error processing WebSocket message:", error);
                }
            });
            ws.on("close", function () {
                console.log("Chrome extension disconnected");
                if (_this.activeConnection === ws) {
                    _this.activeConnection = null;
                }
            });
        });
        // Add screenshot endpoint
        this.app.post("/screenshot", function (req, res) {
            console.log("Browser Connector: Received request to /screenshot endpoint");
            console.log("Browser Connector: Request body:", req.body);
            try {
                console.log("Received screenshot capture request");
                var _a = req.body, data = _a.data, outputPath = _a.path;
                if (!data) {
                    console.log("Screenshot request missing data");
                    res.status(400).json({ error: "Missing screenshot data" });
                    return;
                }
                // Use provided path or default to downloads folder
                var targetPath = outputPath || getDefaultDownloadsFolder();
                console.log("Using screenshot path: ".concat(targetPath));
                // Remove the data:image/png;base64, prefix
                var base64Data = data.replace(/^data:image\/png;base64,/, "");
                // Create the full directory path if it doesn't exist
                fs_1.default.mkdirSync(targetPath, { recursive: true });
                console.log("Created/verified directory: ".concat(targetPath));
                // Generate a unique filename using timestamp
                var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                var filename = "screenshot-".concat(timestamp, ".png");
                var fullPath = path_1.default.join(targetPath, filename);
                console.log("Saving screenshot to: ".concat(fullPath));
                // Write the file
                fs_1.default.writeFileSync(fullPath, base64Data, "base64");
                console.log("Screenshot saved successfully");
                res.json({
                    path: fullPath,
                    filename: filename,
                });
            }
            catch (error) {
                console.error("Error saving screenshot:", error);
                if (error instanceof Error) {
                    res.status(500).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    BrowserConnector.prototype.handleScreenshot = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.activeConnection) {
                            return [2 /*return*/, res.status(503).json({ error: "Chrome extension not connected" })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var _a, _b;
                                // Set up one-time message handler for this screenshot request
                                var messageHandler = function (message) {
                                    var _a;
                                    try {
                                        var response = JSON.parse(message.toString());
                                        if (response.type === "screenshot-error") {
                                            reject(new Error(response.error));
                                            return;
                                        }
                                        if (response.type === "screenshot-data" &&
                                            response.data &&
                                            response.path) {
                                            // Remove the data:image/png;base64, prefix
                                            var base64Data = response.data.replace(/^data:image\/png;base64,/, "");
                                            // Ensure the directory exists
                                            var dir = path_1.default.dirname(response.path);
                                            fs_1.default.mkdirSync(dir, { recursive: true });
                                            // Generate a unique filename using timestamp
                                            var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                                            var filename = "screenshot-".concat(timestamp, ".png");
                                            var fullPath = path_1.default.join(response.path, filename);
                                            // Write the file
                                            fs_1.default.writeFileSync(fullPath, base64Data, "base64");
                                            resolve({
                                                path: fullPath,
                                                filename: filename,
                                            });
                                        }
                                    }
                                    catch (error) {
                                        reject(error);
                                    }
                                    finally {
                                        (_a = _this.activeConnection) === null || _a === void 0 ? void 0 : _a.removeListener("message", messageHandler);
                                    }
                                };
                                // Add temporary message handler
                                (_a = _this.activeConnection) === null || _a === void 0 ? void 0 : _a.on("message", messageHandler);
                                // Request screenshot
                                (_b = _this.activeConnection) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify({ type: "take-screenshot" }));
                                // Set timeout
                                setTimeout(function () {
                                    var _a;
                                    (_a = _this.activeConnection) === null || _a === void 0 ? void 0 : _a.removeListener("message", messageHandler);
                                    reject(new Error("Screenshot timeout"));
                                }, 30000); // 30 second timeout
                            })];
                    case 2:
                        result = _a.sent();
                        res.json(result);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        if (error_2 instanceof Error) {
                            res.status(500).json({ error: error_2.message });
                        }
                        else {
                            res.status(500).json({ error: "An unknown error occurred" });
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Updated method to get URL for audits with improved connection tracking and waiting
    BrowserConnector.prototype.getUrlForAudit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var maxAttempts, waitTime_1, attempt, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log("getUrlForAudit called");
                        // Use the stored URL if available immediately
                        if (currentUrl && currentUrl !== "" && currentUrl !== "about:blank") {
                            console.log("Using existing URL immediately: ".concat(currentUrl));
                            return [2 /*return*/, currentUrl];
                        }
                        // Wait for a URL to become available (retry loop)
                        console.log("No valid URL available yet, waiting for navigation...");
                        maxAttempts = 50;
                        waitTime_1 = 500;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < maxAttempts)) return [3 /*break*/, 4];
                        // Check if URL is available now
                        if (currentUrl && currentUrl !== "" && currentUrl !== "about:blank") {
                            console.log("URL became available after waiting: ".concat(currentUrl));
                            return [2 /*return*/, currentUrl];
                        }
                        // Wait before checking again
                        console.log("Waiting for URL (attempt ".concat(attempt + 1, "/").concat(maxAttempts, ")..."));
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_1); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4:
                        // If we reach here, no URL became available after waiting
                        console.log("Timed out waiting for URL, returning null");
                        return [2 /*return*/, null];
                    case 5:
                        error_3 = _a.sent();
                        console.error("Error in getUrlForAudit:", error_3);
                        return [2 /*return*/, null]; // Return null to trigger an error
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Public method to check if there's an active connection
    BrowserConnector.prototype.hasActiveConnection = function () {
        return this.activeConnection !== null;
    };
    // Add new endpoint for programmatic screenshot capture
    BrowserConnector.prototype.captureScreenshot = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var requestId_1, screenshotPromise, message, _a, base64Data, customPath, autoPaste, targetPath, timestamp, filename, fullPath, cleanBase64, appleScript, error_4, errorMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Browser Connector: Starting captureScreenshot method");
                        console.log("Browser Connector: Request headers:", req.headers);
                        console.log("Browser Connector: Request method:", req.method);
                        if (!this.activeConnection) {
                            console.log("Browser Connector: No active WebSocket connection to Chrome extension");
                            return [2 /*return*/, res.status(503).json({ error: "Chrome extension not connected" })];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log("Browser Connector: Starting screenshot capture...");
                        requestId_1 = Date.now().toString();
                        console.log("Browser Connector: Generated requestId:", requestId_1);
                        screenshotPromise = new Promise(function (resolve, reject) {
                            console.log("Browser Connector: Setting up screenshot callback for requestId: ".concat(requestId_1));
                            // Store callback in map
                            screenshotCallbacks.set(requestId_1, { resolve: resolve, reject: reject });
                            console.log("Browser Connector: Current callbacks:", Array.from(screenshotCallbacks.keys()));
                            // Set timeout to clean up if we don't get a response
                            setTimeout(function () {
                                if (screenshotCallbacks.has(requestId_1)) {
                                    console.log("Browser Connector: Screenshot capture timed out for requestId: ".concat(requestId_1));
                                    screenshotCallbacks.delete(requestId_1);
                                    reject(new Error("Screenshot capture timed out - no response from Chrome extension"));
                                }
                            }, 10000);
                        });
                        message = JSON.stringify({
                            type: "take-screenshot",
                            requestId: requestId_1,
                        });
                        console.log("Browser Connector: Sending WebSocket message to extension:", message);
                        this.activeConnection.send(message);
                        // Wait for screenshot data
                        console.log("Browser Connector: Waiting for screenshot data...");
                        return [4 /*yield*/, screenshotPromise];
                    case 2:
                        _a = _b.sent(), base64Data = _a.data, customPath = _a.path, autoPaste = _a.autoPaste;
                        console.log("Browser Connector: Received screenshot data, saving...");
                        console.log("Browser Connector: Custom path from extension:", customPath);
                        console.log("Browser Connector: Auto-paste setting:", autoPaste);
                        targetPath = customPath;
                        // If no path provided by extension, fall back to defaults
                        if (!targetPath) {
                            targetPath =
                                currentSettings.screenshotPath || getDefaultDownloadsFolder();
                        }
                        // Convert the path for the current platform
                        targetPath = convertPathForCurrentPlatform(targetPath);
                        console.log("Browser Connector: Using path: ".concat(targetPath));
                        if (!base64Data) {
                            throw new Error("No screenshot data received from Chrome extension");
                        }
                        try {
                            fs_1.default.mkdirSync(targetPath, { recursive: true });
                            console.log("Browser Connector: Created directory: ".concat(targetPath));
                        }
                        catch (err) {
                            console.error("Browser Connector: Error creating directory: ".concat(targetPath), err);
                            throw new Error("Failed to create screenshot directory: ".concat(err instanceof Error ? err.message : String(err)));
                        }
                        timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                        filename = "screenshot-".concat(timestamp, ".png");
                        fullPath = path_1.default.join(targetPath, filename);
                        console.log("Browser Connector: Full screenshot path: ".concat(fullPath));
                        cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, "");
                        // Save the file
                        try {
                            fs_1.default.writeFileSync(fullPath, cleanBase64, "base64");
                            console.log("Browser Connector: Screenshot saved to: ".concat(fullPath));
                        }
                        catch (err) {
                            console.error("Browser Connector: Error saving screenshot to: ".concat(fullPath), err);
                            throw new Error("Failed to save screenshot: ".concat(err instanceof Error ? err.message : String(err)));
                        }
                        // Check if running on macOS before executing AppleScript
                        if (os_1.default.platform() === "darwin" && autoPaste === true) {
                            console.log("Browser Connector: Running on macOS with auto-paste enabled, executing AppleScript to paste into Cursor");
                            appleScript = "\n          -- Set path to the screenshot\n          set imagePath to \"".concat(fullPath, "\"\n          \n          -- Copy the image to clipboard\n          try\n            set the clipboard to (read (POSIX file imagePath) as \u00ABclass PNGf\u00BB)\n          on error errMsg\n            log \"Error copying image to clipboard: \" & errMsg\n            return \"Failed to copy image to clipboard: \" & errMsg\n          end try\n          \n          -- Activate Cursor application\n          try\n            tell application \"Cursor\"\n              activate\n            end tell\n          on error errMsg\n            log \"Error activating Cursor: \" & errMsg\n            return \"Failed to activate Cursor: \" & errMsg\n          end try\n          \n          -- Wait for the application to fully activate\n          delay 3\n          \n          -- Try to interact with Cursor\n          try\n            tell application \"System Events\"\n              tell process \"Cursor\"\n                -- Get the frontmost window\n                if (count of windows) is 0 then\n                  return \"No windows found in Cursor\"\n                end if\n                \n                set cursorWindow to window 1\n                \n                -- Try Method 1: Look for elements of class \"Text Area\"\n                set foundElements to {}\n                \n                -- Try different selectors to find the text input area\n                try\n                  -- Try with class\n                  set textAreas to UI elements of cursorWindow whose class is \"Text Area\"\n                  if (count of textAreas) > 0 then\n                    set foundElements to textAreas\n                  end if\n                end try\n                \n                if (count of foundElements) is 0 then\n                  try\n                    -- Try with AXTextField role\n                    set textFields to UI elements of cursorWindow whose role is \"AXTextField\"\n                    if (count of textFields) > 0 then\n                      set foundElements to textFields\n                    end if\n                  end try\n                end if\n                \n                if (count of foundElements) is 0 then\n                  try\n                    -- Try with AXTextArea role in nested elements\n                    set allElements to UI elements of cursorWindow\n                    repeat with anElement in allElements\n                      try\n                        set childElements to UI elements of anElement\n                        repeat with aChild in childElements\n                          try\n                            if role of aChild is \"AXTextArea\" or role of aChild is \"AXTextField\" then\n                              set end of foundElements to aChild\n                            end if\n                          end try\n                        end repeat\n                      end try\n                    end repeat\n                  end try\n                end if\n                \n                -- If no elements found with specific attributes, try a broader approach\n                if (count of foundElements) is 0 then\n                  -- Just try to use the Command+V shortcut on the active window\n                   -- This assumes Cursor already has focus on the right element\n                    keystroke \"v\" using command down\n                    delay 1\n                    keystroke \"here is the screenshot\"\n                    delay 1\n                   -- Try multiple methods to press Enter\n                   key code 36 -- Use key code for Return key\n                   delay 0.5\n                   keystroke return -- Use keystroke return as alternative\n                   return \"Used fallback method: Command+V on active window\"\n                else\n                  -- We found a potential text input element\n                  set inputElement to item 1 of foundElements\n                  \n                  -- Try to focus and paste\n                  try\n                    set focused of inputElement to true\n                    delay 0.5\n                    \n                    -- Paste the image\n                    keystroke \"v\" using command down\n                    delay 1\n                    \n                    -- Type the text\n                    keystroke \"here is the screenshot\"\n                    delay 1\n                    -- Try multiple methods to press Enter\n                    key code 36 -- Use key code for Return key\n                    delay 0.5\n                    keystroke return -- Use keystroke return as alternative\n                    return \"Successfully pasted screenshot into Cursor text element\"\n                  on error errMsg\n                    log \"Error interacting with found element: \" & errMsg\n                    -- Fallback to just sending the key commands\n                    keystroke \"v\" using command down\n                    delay 1\n                    keystroke \"here is the screenshot\"\n                    delay 1\n                    -- Try multiple methods to press Enter\n                    key code 36 -- Use key code for Return key\n                    delay 0.5\n                    keystroke return -- Use keystroke return as alternative\n                    return \"Used fallback after element focus error: \" & errMsg\n                  end try\n                end if\n              end tell\n            end tell\n          on error errMsg\n            log \"Error in System Events block: \" & errMsg\n            return \"Failed in System Events: \" & errMsg\n          end try\n        ");
                            // Execute the AppleScript
                            (0, child_process_1.exec)("osascript -e '".concat(appleScript, "'"), function (error, stdout, stderr) {
                                if (error) {
                                    console.error("Browser Connector: Error executing AppleScript: ".concat(error.message));
                                    console.error("Browser Connector: stderr: ".concat(stderr));
                                    // Don't fail the response; log the error and proceed
                                }
                                else {
                                    console.log("Browser Connector: AppleScript executed successfully");
                                    console.log("Browser Connector: stdout: ".concat(stdout));
                                }
                            });
                        }
                        else {
                            if (os_1.default.platform() === "darwin" && !autoPaste) {
                                console.log("Browser Connector: Running on macOS but auto-paste is disabled, skipping AppleScript execution");
                            }
                            else {
                                console.log("Browser Connector: Not running on macOS, skipping AppleScript execution");
                            }
                        }
                        res.json({
                            path: fullPath,
                            filename: filename,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _b.sent();
                        errorMessage = error_4 instanceof Error ? error_4.message : String(error_4);
                        console.error("Browser Connector: Error capturing screenshot:", errorMessage);
                        res.status(500).json({
                            error: errorMessage,
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Add shutdown method
    BrowserConnector.prototype.shutdown = function () {
        var _this = this;
        return new Promise(function (resolve) {
            console.log("Shutting down WebSocket server...");
            // Send close message to client if connection is active
            if (_this.activeConnection &&
                _this.activeConnection.readyState === ws_1.WebSocket.OPEN) {
                console.log("Notifying client to close connection...");
                try {
                    _this.activeConnection.send(JSON.stringify({ type: "server-shutdown" }));
                }
                catch (err) {
                    console.error("Error sending shutdown message to client:", err);
                }
            }
            // Set a timeout to force close after 2 seconds
            var forceCloseTimeout = setTimeout(function () {
                console.log("Force closing connections after timeout...");
                if (_this.activeConnection) {
                    _this.activeConnection.terminate(); // Force close the connection
                    _this.activeConnection = null;
                }
                _this.wss.close();
                resolve();
            }, 2000);
            // Close active WebSocket connection if exists
            if (_this.activeConnection) {
                _this.activeConnection.close(1000, "Server shutting down");
                _this.activeConnection = null;
            }
            // Close WebSocket server
            _this.wss.close(function () {
                clearTimeout(forceCloseTimeout);
                console.log("WebSocket server closed gracefully");
                resolve();
            });
        });
    };
    // Sets up the accessibility audit endpoint
    BrowserConnector.prototype.setupAccessibilityAudit = function () {
        this.setupAuditEndpoint(index_js_1.AuditCategory.ACCESSIBILITY, "/accessibility-audit", index_js_1.runAccessibilityAudit);
    };
    // Sets up the performance audit endpoint
    BrowserConnector.prototype.setupPerformanceAudit = function () {
        this.setupAuditEndpoint(index_js_1.AuditCategory.PERFORMANCE, "/performance-audit", index_js_1.runPerformanceAudit);
    };
    // Set up SEO audit endpoint
    BrowserConnector.prototype.setupSEOAudit = function () {
        this.setupAuditEndpoint(index_js_1.AuditCategory.SEO, "/seo-audit", index_js_1.runSEOAudit);
    };
    // Add a setup method for Best Practices audit
    BrowserConnector.prototype.setupBestPracticesAudit = function () {
        this.setupAuditEndpoint(index_js_1.AuditCategory.BEST_PRACTICES, "/best-practices-audit", best_practices_js_1.runBestPracticesAudit);
    };
    /**
     * Generic method to set up an audit endpoint
     * @param auditType The type of audit (accessibility, performance, SEO)
     * @param endpoint The endpoint path
     * @param auditFunction The audit function to call
     */
    BrowserConnector.prototype.setupAuditEndpoint = function (auditType, endpoint, auditFunction) {
        var _this = this;
        // Add server identity validation endpoint
        this.app.get("/.identity", function (req, res) {
            res.json({
                signature: "mcp-browser-connector-24x7",
                version: "1.2.0",
            });
        });
        this.app.post(endpoint, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var url, result, auditError_1, errorMessage, error_5, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        console.log("".concat(auditType, " audit request received"));
                        return [4 /*yield*/, this.getUrlForAudit()];
                    case 1:
                        url = _b.sent();
                        if (!url) {
                            console.log("No URL available for ".concat(auditType, " audit"));
                            return [2 /*return*/, res.status(400).json({
                                    error: "URL is required for ".concat(auditType, " audit. Make sure you navigate to a page in the browser first, and the browser-tool extension tab is open."),
                                })];
                        }
                        // If we're using the stored URL (not from request body), log it now
                        if (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.url) && url === currentUrl) {
                            console.log("Using stored URL for ".concat(auditType, " audit:"), url);
                        }
                        // Check if we're using the default URL
                        if (url === "about:blank") {
                            console.log("Cannot run ".concat(auditType, " audit on about:blank"));
                            return [2 /*return*/, res.status(400).json({
                                    error: "Cannot run ".concat(auditType, " audit on about:blank"),
                                })];
                        }
                        console.log("Preparing to run ".concat(auditType, " audit for: ").concat(url));
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, auditFunction(url)];
                    case 3:
                        result = _b.sent();
                        console.log("".concat(auditType, " audit completed successfully"));
                        // Return the results
                        res.json(result);
                        return [3 /*break*/, 5];
                    case 4:
                        auditError_1 = _b.sent();
                        console.error("".concat(auditType, " audit failed:"), auditError_1);
                        errorMessage = auditError_1 instanceof Error
                            ? auditError_1.message
                            : String(auditError_1);
                        res.status(500).json({
                            error: "Failed to run ".concat(auditType, " audit: ").concat(errorMessage),
                        });
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_5 = _b.sent();
                        console.error("Error in ".concat(auditType, " audit endpoint:"), error_5);
                        errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                        res.status(500).json({
                            error: "Error in ".concat(auditType, " audit endpoint: ").concat(errorMessage),
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); });
    };
    return BrowserConnector;
}());
exports.BrowserConnector = BrowserConnector;
// Use an async IIFE to allow for async/await in the initial setup
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var portError_1, server_1, browserConnector_1, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                console.log("Starting Browser Tools Server...");
                console.log("Requested port: ".concat(REQUESTED_PORT));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, getAvailablePort(REQUESTED_PORT)];
            case 2:
                PORT = _a.sent();
                if (PORT !== REQUESTED_PORT) {
                    console.log("\n====================================");
                    console.log("NOTICE: Requested port ".concat(REQUESTED_PORT, " was in use."));
                    console.log("Using port ".concat(PORT, " instead."));
                    console.log("====================================\n");
                }
                return [3 /*break*/, 4];
            case 3:
                portError_1 = _a.sent();
                console.error("Failed to find an available port:", portError_1);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4:
                server_1 = app.listen(PORT, currentSettings.serverHost, function () {
                    console.log("\n=== Browser Tools Server Started ===");
                    console.log("Aggregator listening on http://".concat(currentSettings.serverHost, ":").concat(PORT));
                    if (PORT !== REQUESTED_PORT) {
                        console.log("NOTE: Using fallback port ".concat(PORT, " instead of requested port ").concat(REQUESTED_PORT));
                    }
                    // Log all available network interfaces for easier discovery
                    var networkInterfaces = os_1.default.networkInterfaces();
                    console.log("\nAvailable on the following network addresses:");
                    Object.keys(networkInterfaces).forEach(function (interfaceName) {
                        var interfaces = networkInterfaces[interfaceName];
                        if (interfaces) {
                            interfaces.forEach(function (iface) {
                                if (!iface.internal && iface.family === "IPv4") {
                                    console.log("  - http://".concat(iface.address, ":").concat(PORT));
                                }
                            });
                        }
                    });
                    console.log("\nFor local access use: http://localhost:".concat(PORT));
                });
                // Handle server startup errors
                server_1.on("error", function (err) {
                    if (err.code === "EADDRINUSE") {
                        console.error("ERROR: Port ".concat(PORT, " is still in use, despite our checks!"));
                        console.error("This might indicate another process started using this port after our check.");
                    }
                    else {
                        console.error("Server error:", err);
                    }
                    process.exit(1);
                });
                browserConnector_1 = new BrowserConnector(app, server_1);
                // Handle shutdown gracefully with improved error handling
                process.on("SIGINT", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var error_7;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log("\nReceived SIGINT signal. Starting graceful shutdown...");
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 4, , 5]);
                                // First shutdown WebSocket connections
                                return [4 /*yield*/, browserConnector_1.shutdown()];
                            case 2:
                                // First shutdown WebSocket connections
                                _a.sent();
                                // Then close the HTTP server
                                return [4 /*yield*/, new Promise(function (resolve, reject) {
                                        server_1.close(function (err) {
                                            if (err) {
                                                console.error("Error closing HTTP server:", err);
                                                reject(err);
                                            }
                                            else {
                                                console.log("HTTP server closed successfully");
                                                resolve();
                                            }
                                        });
                                    })];
                            case 3:
                                // Then close the HTTP server
                                _a.sent();
                                // Clear all logs
                                clearAllLogs();
                                console.log("Shutdown completed successfully");
                                process.exit(0);
                                return [3 /*break*/, 5];
                            case 4:
                                error_7 = _a.sent();
                                console.error("Error during shutdown:", error_7);
                                // Force exit in case of error
                                process.exit(1);
                                return [3 /*break*/, 5];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); });
                // Also handle SIGTERM
                process.on("SIGTERM", function () {
                    console.log("\nReceived SIGTERM signal");
                    process.emit("SIGINT");
                });
                return [3 /*break*/, 6];
            case 5:
                error_6 = _a.sent();
                console.error("Failed to start server:", error_6);
                process.exit(1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); })().catch(function (err) {
    console.error("Unhandled error during server startup:", err);
    process.exit(1);
});
