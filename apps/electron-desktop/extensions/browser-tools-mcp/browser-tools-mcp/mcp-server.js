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
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var path_1 = require("path");
var fs_1 = require("fs");
// Create the MCP server
var server = new mcp_js_1.McpServer({
    name: "Browser Tools MCP",
    version: "1.2.0",
});
// Track the discovered server connection
var discoveredHost = "127.0.0.1";
var discoveredPort = 3025;
var serverDiscovered = false;
// Function to get the default port from environment variable or default
function getDefaultServerPort() {
    // Check environment variable first
    if (process.env.BROWSER_TOOLS_PORT) {
        var envPort = parseInt(process.env.BROWSER_TOOLS_PORT, 10);
        if (!isNaN(envPort) && envPort > 0) {
            return envPort;
        }
    }
    // Try to read from .port file
    try {
        var portFilePath = path_1.default.join(__dirname, ".port");
        if (fs_1.default.existsSync(portFilePath)) {
            var port = parseInt(fs_1.default.readFileSync(portFilePath, "utf8").trim(), 10);
            if (!isNaN(port) && port > 0) {
                return port;
            }
        }
    }
    catch (err) {
        console.error("Error reading port file:", err);
    }
    // Default port if no configuration found
    return 3025;
}
// Function to get default server host from environment variable or default
function getDefaultServerHost() {
    // Check environment variable first
    if (process.env.BROWSER_TOOLS_HOST) {
        return process.env.BROWSER_TOOLS_HOST;
    }
    // Default to localhost
    return "127.0.0.1";
}
// Server discovery function - similar to what you have in the Chrome extension
function discoverServer() {
    return __awaiter(this, void 0, void 0, function () {
        var hosts, defaultPort, ports, p, _i, hosts_1, host, _a, ports_1, port, response, identity, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Starting server discovery process");
                    hosts = [getDefaultServerHost(), "127.0.0.1", "localhost"];
                    defaultPort = getDefaultServerPort();
                    ports = [defaultPort];
                    // Add additional ports (fallback range)
                    for (p = 3025; p <= 3035; p++) {
                        if (p !== defaultPort) {
                            ports.push(p);
                        }
                    }
                    console.log("Will try hosts: ".concat(hosts.join(", ")));
                    console.log("Will try ports: ".concat(ports.join(", ")));
                    _i = 0, hosts_1 = hosts;
                    _b.label = 1;
                case 1:
                    if (!(_i < hosts_1.length)) return [3 /*break*/, 10];
                    host = hosts_1[_i];
                    _a = 0, ports_1 = ports;
                    _b.label = 2;
                case 2:
                    if (!(_a < ports_1.length)) return [3 /*break*/, 9];
                    port = ports_1[_a];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 7, , 8]);
                    console.log("Checking ".concat(host, ":").concat(port, "..."));
                    return [4 /*yield*/, fetch("http://".concat(host, ":").concat(port, "/.identity"), {
                            signal: AbortSignal.timeout(1000), // 1 second timeout
                        })];
                case 4:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.json()];
                case 5:
                    identity = _b.sent();
                    // Verify this is actually our server by checking the signature
                    if (identity.signature === "mcp-browser-connector-24x7") {
                        console.log("Successfully found server at ".concat(host, ":").concat(port));
                        // Save the discovered connection
                        discoveredHost = host;
                        discoveredPort = port;
                        serverDiscovered = true;
                        return [2 /*return*/, true];
                    }
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    // Ignore connection errors during discovery
                    console.error("Error checking ".concat(host, ":").concat(port, ": ").concat(error_1.message));
                    return [3 /*break*/, 8];
                case 8:
                    _a++;
                    return [3 /*break*/, 2];
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10:
                    console.error("No server found during discovery");
                    return [2 /*return*/, false];
            }
        });
    });
}
// Wrapper function to ensure server connection before making requests
function withServerConnection(apiCall) {
    return __awaiter(this, void 0, void 0, function () {
        var discovered, error_2, retryError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!serverDiscovered) return [3 /*break*/, 2];
                    return [4 /*yield*/, discoverServer()];
                case 1:
                    discovered = _a.sent();
                    if (!discovered) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Failed to discover browser connector server. Please ensure it's running.",
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 12]);
                    return [4 /*yield*/, apiCall()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_2 = _a.sent();
                    // If the request fails, try rediscovering the server once
                    console.error("API call failed: ".concat(error_2.message, ". Attempting rediscovery..."));
                    serverDiscovered = false;
                    return [4 /*yield*/, discoverServer()];
                case 5:
                    if (!_a.sent()) return [3 /*break*/, 10];
                    console.error("Rediscovery successful. Retrying API call...");
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, apiCall()];
                case 7: 
                // Retry the API call with the newly discovered connection
                return [2 /*return*/, _a.sent()];
                case 8:
                    retryError_1 = _a.sent();
                    console.error("Retry failed: ".concat(retryError_1.message));
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error after reconnection attempt: ".concat(retryError_1.message),
                                },
                            ],
                            isError: true,
                        }];
                case 9: return [3 /*break*/, 11];
                case 10:
                    console.error("Rediscovery failed. Could not reconnect to server.");
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Failed to reconnect to server: ".concat(error_2.message),
                                },
                            ],
                            isError: true,
                        }];
                case 11: return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// We'll define our tools that retrieve data from the browser connector
server.tool("getConsoleLogs", "Check our browser logs", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/console-logs"))];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("getConsoleErrors", "Check our browsers console errors", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/console-errors"))];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("getNetworkErrors", "Check our network ERROR logs", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/network-errors"))];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                        isError: true,
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("getNetworkLogs", "Check ALL our network logs", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/network-success"))];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("takeScreenshot", "Take a screenshot of the current browser tab", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, result, error_3, errorMessage;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/capture-screenshot"), {
                                        method: "POST",
                                    })];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                result = _a.sent();
                                if (response.ok) {
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Successfully saved screenshot",
                                                },
                                            ],
                                        }];
                                }
                                else {
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Error taking screenshot: ".concat(result.error),
                                                },
                                            ],
                                        }];
                                }
                                return [3 /*break*/, 4];
                            case 3:
                                error_3 = _a.sent();
                                errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Failed to take screenshot: ".concat(errorMessage),
                                            },
                                        ],
                                    }];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("getSelectedElement", "Get the selected element from the browser", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/selected-element"))];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("wipeLogs", "Wipe all browser logs from memory", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/wipelogs"), {
                                    method: "POST",
                                })];
                            case 1:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 2:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: json.message,
                                            },
                                        ],
                                    }];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("navigateToUrl", "Navigate the browser to a specific URL", {
    url: {
        type: "string",
        description: "The URL to navigate to",
        required: true,
    },
}, function (args) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var url, response, json, error_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                url = args.url;
                                if (!url) {
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Error: URL parameter is required",
                                                },
                                            ],
                                            isError: true,
                                        }];
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 4, , 5]);
                                console.log("Attempting to navigate to: ".concat(url));
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/navigate"), {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({ url: url }),
                                    })];
                            case 2:
                                response = _a.sent();
                                return [4 /*yield*/, response.json()];
                            case 3:
                                json = _a.sent();
                                if (!response.ok) {
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Navigation failed: ".concat(json.error || 'Unknown error'),
                                                },
                                            ],
                                            isError: true,
                                        }];
                                }
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: json.message || "Successfully navigated to ".concat(url),
                                            },
                                        ],
                                    }];
                            case 4:
                                error_4 = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Navigation error: ".concat(error_4.message),
                                            },
                                        ],
                                        isError: true,
                                    }];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
// Define audit categories as enum to match the server's AuditCategory enum
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["ACCESSIBILITY"] = "accessibility";
    AuditCategory["PERFORMANCE"] = "performance";
    AuditCategory["SEO"] = "seo";
    AuditCategory["BEST_PRACTICES"] = "best-practices";
    AuditCategory["PWA"] = "pwa";
})(AuditCategory || (AuditCategory = {}));
// Add tool for accessibility audits, launches a headless browser instance
server.tool("runAccessibilityAudit", "Run an accessibility audit on the current page", {}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, errorText, json, metadata, report, flattened, error_5, errorMessage;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                // Simplified approach - let the browser connector handle the current tab and URL
                                console.log("Sending POST request to http://".concat(discoveredHost, ":").concat(discoveredPort, "/accessibility-audit"));
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/accessibility-audit"), {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Accept: "application/json",
                                        },
                                        body: JSON.stringify({
                                            category: AuditCategory.ACCESSIBILITY,
                                            source: "mcp_tool",
                                            timestamp: Date.now(),
                                        }),
                                    })];
                            case 1:
                                response = _a.sent();
                                // Log the response status
                                console.log("Accessibility audit response status: ".concat(response.status));
                                if (!!response.ok) return [3 /*break*/, 3];
                                return [4 /*yield*/, response.text()];
                            case 2:
                                errorText = _a.sent();
                                console.error("Accessibility audit error: ".concat(errorText));
                                throw new Error("Server returned ".concat(response.status, ": ").concat(errorText));
                            case 3: return [4 /*yield*/, response.json()];
                            case 4:
                                json = _a.sent();
                                // flatten it by merging metadata with the report contents
                                if (json.report) {
                                    metadata = json.metadata, report = json.report;
                                    flattened = __assign(__assign({}, metadata), report);
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(flattened, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                else {
                                    // Return as-is if it's not in the new format
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(json, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                return [3 /*break*/, 6];
                            case 5:
                                error_5 = _a.sent();
                                errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                                console.error("Error in accessibility audit:", errorMessage);
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Failed to run accessibility audit: ".concat(errorMessage),
                                            },
                                        ],
                                    }];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
// Add tool for performance audits, launches a headless browser instance
server.tool("runPerformanceAudit", "Run a performance audit on the current page", {}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, errorText, json, metadata, report, flattened, error_6, errorMessage;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                // Simplified approach - let the browser connector handle the current tab and URL
                                console.log("Sending POST request to http://".concat(discoveredHost, ":").concat(discoveredPort, "/performance-audit"));
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/performance-audit"), {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Accept: "application/json",
                                        },
                                        body: JSON.stringify({
                                            category: AuditCategory.PERFORMANCE,
                                            source: "mcp_tool",
                                            timestamp: Date.now(),
                                        }),
                                    })];
                            case 1:
                                response = _a.sent();
                                // Log the response status
                                console.log("Performance audit response status: ".concat(response.status));
                                if (!!response.ok) return [3 /*break*/, 3];
                                return [4 /*yield*/, response.text()];
                            case 2:
                                errorText = _a.sent();
                                console.error("Performance audit error: ".concat(errorText));
                                throw new Error("Server returned ".concat(response.status, ": ").concat(errorText));
                            case 3: return [4 /*yield*/, response.json()];
                            case 4:
                                json = _a.sent();
                                // flatten it by merging metadata with the report contents
                                if (json.report) {
                                    metadata = json.metadata, report = json.report;
                                    flattened = __assign(__assign({}, metadata), report);
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(flattened, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                else {
                                    // Return as-is if it's not in the new format
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(json, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                return [3 /*break*/, 6];
                            case 5:
                                error_6 = _a.sent();
                                errorMessage = error_6 instanceof Error ? error_6.message : String(error_6);
                                console.error("Error in performance audit:", errorMessage);
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Failed to run performance audit: ".concat(errorMessage),
                                            },
                                        ],
                                    }];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
// Add tool for SEO audits, launches a headless browser instance
server.tool("runSEOAudit", "Run an SEO audit on the current page", {}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, errorText, json, error_7, errorMessage;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                console.log("Sending POST request to http://".concat(discoveredHost, ":").concat(discoveredPort, "/seo-audit"));
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/seo-audit"), {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Accept: "application/json",
                                        },
                                        body: JSON.stringify({
                                            category: AuditCategory.SEO,
                                            source: "mcp_tool",
                                            timestamp: Date.now(),
                                        }),
                                    })];
                            case 1:
                                response = _a.sent();
                                // Log the response status
                                console.log("SEO audit response status: ".concat(response.status));
                                if (!!response.ok) return [3 /*break*/, 3];
                                return [4 /*yield*/, response.text()];
                            case 2:
                                errorText = _a.sent();
                                console.error("SEO audit error: ".concat(errorText));
                                throw new Error("Server returned ".concat(response.status, ": ").concat(errorText));
                            case 3: return [4 /*yield*/, response.json()];
                            case 4:
                                json = _a.sent();
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(json, null, 2),
                                            },
                                        ],
                                    }];
                            case 5:
                                error_7 = _a.sent();
                                errorMessage = error_7 instanceof Error ? error_7.message : String(error_7);
                                console.error("Error in SEO audit:", errorMessage);
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Failed to run SEO audit: ".concat(errorMessage),
                                            },
                                        ],
                                    }];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
server.tool("runNextJSAudit", {}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
                content: [
                    {
                        type: "text",
                        text: "\n      You are an expert in SEO and web development with NextJS. Given the following procedures for analyzing my codebase, please perform a comprehensive - page by page analysis of our NextJS application to identify any issues or areas of improvement for SEO.\n\n      After each iteration of changes, reinvoke this tool to re-fetch our SEO audit procedures and then scan our codebase again to identify additional areas of improvement. \n\n      When no more areas of improvement are found, return \"No more areas of improvement found, your NextJS application is optimized for SEO!\".\n\n      Start by analyzing each of the following aspects of our codebase:\n      1. Meta tags - provides information about your website to search engines and social media platforms.\n\n        Pages should provide the following standard meta tags:\n\n        title\n        description\n        keywords\n        robots\n        viewport\n        charSet\n        Open Graph meta tags:\n\n        og:site_name\n        og:locale\n        og:title\n        og:description\n        og:type\n        og:url\n        og:image\n        og:image:alt\n        og:image:type\n        og:image:width\n        og:image:height\n        Article meta tags (actually it's also OpenGraph):\n\n        article:published_time\n        article:modified_time\n        article:author\n        Twitter meta tags:\n\n        twitter:card\n        twitter:site\n        twitter:creator\n        twitter:title\n        twitter:description\n        twitter:image\n\n        For applications using the pages router, set up metatags like this in pages/[slug].tsx:\n          import Head from \"next/head\";\n\n          export default function Page() {\n            return (\n              <Head>\n                <title>\n                  Next.js SEO: The Complete Checklist to Boost Your Site Ranking\n                </title>\n                <meta\n                  name=\"description\"\n                  content=\"Learn how to optimize your Next.js website for SEO by following this complete checklist.\"\n                />\n                <meta\n                  name=\"keywords\"\n                  content=\"nextjs seo complete checklist, nextjs seo tutorial\"\n                />\n                <meta name=\"robots\" content=\"index, follow\" />\n                <meta name=\"googlebot\" content=\"index, follow\" />\n                <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n                <meta charSet=\"utf-8\" />\n                <meta property=\"og:site_name\" content=\"Blog | Minh Vu\" />\n                <meta property=\"og:locale\" content=\"en_US\" />\n                <meta\n                  property=\"og:title\"\n                  content=\"Next.js SEO: The Complete Checklist to Boost Your Site Ranking\"\n                />\n                <meta\n                  property=\"og:description\"\n                  content=\"Learn how to optimize your Next.js website for SEO by following this complete checklist.\"\n                />\n                <meta property=\"og:type\" content=\"website\" />\n                <meta property=\"og:url\" content=\"https://dminhvu.com/nextjs-seo\" />\n                <meta\n                  property=\"og:image\"\n                  content=\"https://ik.imagekit.io/dminhvu/assets/nextjs-seo/thumbnail.png?tr=f-png\"\n                />\n                <meta property=\"og:image:alt\" content=\"Next.js SEO\" />\n                <meta property=\"og:image:type\" content=\"image/png\" />\n                <meta property=\"og:image:width\" content=\"1200\" />\n                <meta property=\"og:image:height\" content=\"630\" />\n                <meta\n                  property=\"article:published_time\"\n                  content=\"2024-01-11T11:35:00+07:00\"\n                />\n                <meta\n                  property=\"article:modified_time\"\n                  content=\"2024-01-11T11:35:00+07:00\"\n                />\n                <meta\n                  property=\"article:author\"\n                  content=\"https://www.linkedin.com/in/dminhvu02\"\n                />\n                <meta name=\"twitter:card\" content=\"summary_large_image\" />\n                <meta name=\"twitter:site\" content=\"@dminhvu02\" />\n                <meta name=\"twitter:creator\" content=\"@dminhvu02\" />\n                <meta\n                  name=\"twitter:title\"\n                  content=\"Next.js SEO: The Complete Checklist to Boost Your Site Ranking\"\n                />\n                <meta\n                  name=\"twitter:description\"\n                  content=\"Learn how to optimize your Next.js website for SEO by following this complete checklist.\"\n                />\n                <meta\n                  name=\"twitter:image\"\n                  content=\"https://ik.imagekit.io/dminhvu/assets/nextjs-seo/thumbnail.png?tr=f-png\"\n                />\n              </Head>\n            );\n          }\n\n        For applications using the app router, set up metatags like this in layout.tsx:\n          import type { Viewport, Metadata } from \"next\";\n\n          export const viewport: Viewport = {\n            width: \"device-width\",\n            initialScale: 1,\n            themeColor: \"#ffffff\"\n          };\n          \n          export const metadata: Metadata = {\n            metadataBase: new URL(\"https://dminhvu.com\"),\n            openGraph: {\n              siteName: \"Blog | Minh Vu\",\n              type: \"website\",\n              locale: \"en_US\"\n            },\n            robots: {\n              index: true,\n              follow: true,\n              \"max-image-preview\": \"large\",\n              \"max-snippet\": -1,\n              \"max-video-preview\": -1,\n              googleBot: \"index, follow\"\n            },\n            alternates: {\n              types: {\n                \"application/rss+xml\": \"https://dminhvu.com/rss.xml\"\n              }\n            },\n            applicationName: \"Blog | Minh Vu\",\n            appleWebApp: {\n              title: \"Blog | Minh Vu\",\n              statusBarStyle: \"default\",\n              capable: true\n            },\n            verification: {\n              google: \"YOUR_DATA\",\n              yandex: [\"YOUR_DATA\"],\n              other: {\n                \"msvalidate.01\": [\"YOUR_DATA\"],\n                \"facebook-domain-verification\": [\"YOUR_DATA\"]\n              }\n            },\n            icons: {\n              icon: [\n                {\n                  url: \"/favicon.ico\",\n                  type: \"image/x-icon\"\n                },\n                {\n                  url: \"/favicon-16x16.png\",\n                  sizes: \"16x16\",\n                  type: \"image/png\"\n                }\n                // add favicon-32x32.png, favicon-96x96.png, android-chrome-192x192.png\n              ],\n              shortcut: [\n                {\n                  url: \"/favicon.ico\",\n                  type: \"image/x-icon\"\n                }\n              ],\n              apple: [\n                {\n                  url: \"/apple-icon-57x57.png\",\n                  sizes: \"57x57\",\n                  type: \"image/png\"\n                },\n                {\n                  url: \"/apple-icon-60x60.png\",\n                  sizes: \"60x60\",\n                  type: \"image/png\"\n                }\n                // add apple-icon-72x72.png, apple-icon-76x76.png, apple-icon-114x114.png, apple-icon-120x120.png, apple-icon-144x144.png, apple-icon-152x152.png, apple-icon-180x180.png\n              ]\n            }\n          };\n        And like this for any page.tsx file:\n          import { Metadata } from \"next\";\n\n          export const metadata: Metadata = {\n            title: \"Elastic Stack, Next.js, Python, JavaScript Tutorials | dminhvu\",\n            description:\n              \"dminhvu.com - Programming blog for everyone to learn Elastic Stack, Next.js, Python, JavaScript, React, Machine Learning, Data Science, and more.\",\n            keywords: [\n              \"elastic\",\n              \"python\",\n              \"javascript\",\n              \"react\",\n              \"machine learning\",\n              \"data science\"\n            ],\n            openGraph: {\n              url: \"https://dminhvu.com\",\n              type: \"website\",\n              title: \"Elastic Stack, Next.js, Python, JavaScript Tutorials | dminhvu\",\n              description:\n                \"dminhvu.com - Programming blog for everyone to learn Elastic Stack, Next.js, Python, JavaScript, React, Machine Learning, Data Science, and more.\",\n              images: [\n                {\n                  url: \"https://dminhvu.com/images/home/thumbnail.png\",\n                  width: 1200,\n                  height: 630,\n                  alt: \"dminhvu\"\n                }\n              ]\n            },\n            twitter: {\n              card: \"summary_large_image\",\n              title: \"Elastic Stack, Next.js, Python, JavaScript Tutorials | dminhvu\",\n              description:\n                \"dminhvu.com - Programming blog for everyone to learn Elastic Stack, Next.js, Python, JavaScript, React, Machine Learning, Data Science, and more.\",\n              creator: \"@dminhvu02\",\n              site: \"@dminhvu02\",\n              images: [\n                {\n                  url: \"https://dminhvu.com/images/home/thumbnail.png\",\n                  width: 1200,\n                  height: 630,\n                  alt: \"dminhvu\"\n                }\n              ]\n            },\n            alternates: {\n              canonical: \"https://dminhvu.com\"\n            }\n          };\n\n          Note that the charSet and viewport are automatically added by Next.js App Router, so you don't need to define them.\n\n        For applications using the app router, dynamic metadata can be defined by using the generateMetadata function, this is useful when you have dynamic pages like [slug]/page.tsx, or [id]/page.tsx:\n\n        import type { Metadata, ResolvingMetadata } from \"next\";\n\n        type Params = {\n          slug: string;\n        };\n        \n        type Props = {\n          params: Params;\n          searchParams: { [key: string]: string | string[] | undefined };\n        };\n        \n        export async function generateMetadata(\n          { params, searchParams }: Props,\n          parent: ResolvingMetadata\n        ): Promise<Metadata> {\n          const { slug } = params;\n        \n          const post: Post = await fetch(\"YOUR_ENDPOINT\", {\n            method: \"GET\",\n            next: {\n              revalidate: 60 * 60 * 24\n            }\n          }).then((res) => res.json());\n        \n          return {\n            title: \"{post.title} | dminhvu\",\n            authors: [\n              {\n                name: post.author || \"Minh Vu\"\n              }\n            ],\n            description: post.description,\n            keywords: post.keywords,\n            openGraph: {\n              title: \"{post.title} | dminhvu\",\n              description: post.description,\n              type: \"article\",\n              url: \"https://dminhvu.com/{post.slug}\",\n              publishedTime: post.created_at,\n              modifiedTime: post.modified_at,\n              authors: [\"https://dminhvu.com/about\"],\n              tags: post.categories,\n              images: [\n                {\n                  url: \"https://ik.imagekit.io/dminhvu/assets/{post.slug}/thumbnail.png?tr=f-png\",\n                  width: 1024,\n                  height: 576,\n                  alt: post.title,\n                  type: \"image/png\"\n                }\n              ]\n            },\n            twitter: {\n              card: \"summary_large_image\",\n              site: \"@dminhvu02\",\n              creator: \"@dminhvu02\",\n              title: \"{post.title} | dminhvu\",\n              description: post.description,\n              images: [\n                {\n                  url: \"https://ik.imagekit.io/dminhvu/assets/{post.slug}/thumbnail.png?tr=f-png\",\n                  width: 1024,\n                  height: 576,\n                  alt: post.title\n                }\n              ]\n            },\n            alternates: {\n              canonical: \"https://dminhvu.com/{post.slug}\"\n            }\n          };\n        }\n\n        \n      2. JSON-LD Schema\n\n      JSON-LD is a format for structured data that can be used by search engines to understand your content. For example, you can use it to describe a person, an event, an organization, a movie, a book, a recipe, and many other types of entities.\n\n      Our current recommendation for JSON-LD is to render structured data as a <script> tag in your layout.js or page.js components. For example:\n      export default async function Page({ params }) {\n        const { id } = await params\n        const product = await getProduct(id)\n      \n        const jsonLd = {\n          '@context': 'https://schema.org',\n          '@type': 'Product',\n          name: product.name,\n          image: product.image,\n          description: product.description,\n        }\n      \n        return (\n          <section>\n            {/* Add JSON-LD to your page */}\n            <script\n              type=\"application/ld+json\"\n              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}\n            />\n            {/* ... */}\n          </section>\n        )\n      }\n      \n      You can type your JSON-LD with TypeScript using community packages like schema-dts:\n\n\n      import { Product, WithContext } from 'schema-dts'\n      \n      const jsonLd: WithContext<Product> = {\n        '@context': 'https://schema.org',\n        '@type': 'Product',\n        name: 'Next.js Sticker',\n        image: 'https://nextjs.org/imgs/sticker.png',\n        description: 'Dynamic at the speed of static.',\n      }\n      3. Sitemap\n      Your website should provide a sitemap so that search engines can easily crawl and index your pages.\n\n        Generate Sitemap for Next.js Pages Router\n        For Next.js Pages Router, you can use next-sitemap to generate a sitemap for your Next.js website after building.\n\n        For example, running the following command will install next-sitemap and generate a sitemap for this blog:\n\n\n        pnpm install next-sitemap\n        pnpm dlx next-sitemap\n        A sitemap will be generated at public/sitemap.xml:\n\n        public/sitemap.xml\n\n        <urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:news=\"http://www.google.com/schemas/sitemap-news/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\" xmlns:mobile=\"http://www.google.com/schemas/sitemap-mobile/1.0\" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\" xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\">\n        <url>\n          <loc>https://dminhvu.com</loc>\n            <lastmod>2024-01-11T02:03:09.613Z</lastmod>\n            <changefreq>daily</changefreq>\n          <priority>0.7</priority>\n        </url>\n        <!-- other pages -->\n        </urlset>\n        Please visit the next-sitemap page for more information.\n\n        Generate Sitemap for Next.js App Router\n        For Next.js App Router, you can define the sitemap.ts file at app/sitemap.ts:\n\n        app/sitemap.ts\n\n        import {\n          getAllCategories,\n          getAllPostSlugsWithModifyTime\n        } from \"@/utils/getData\";\n        import { MetadataRoute } from \"next\";\n        \n        export default async function sitemap(): Promise<MetadataRoute.Sitemap> {\n          const defaultPages = [\n            {\n              url: \"https://dminhvu.com\",\n              lastModified: new Date(),\n              changeFrequency: \"daily\",\n              priority: 1\n            },\n            {\n              url: \"https://dminhvu.com/about\",\n              lastModified: new Date(),\n              changeFrequency: \"monthly\",\n              priority: 0.9\n            },\n            {\n              url: \"https://dminhvu.com/contact\",\n              lastModified: new Date(),\n              changeFrequency: \"monthly\",\n              priority: 0.9\n            }\n            // other pages\n          ];\n        \n          const postSlugs = await getAllPostSlugsWithModifyTime();\n          const categorySlugs = await getAllCategories();\n        \n          const sitemap = [\n            ...defaultPages,\n            ...postSlugs.map((e: any) => ({\n              url: \"https://dminhvu.com/{e.slug}\",\n              lastModified: e.modified_at,\n              changeFrequency: \"daily\",\n              priority: 0.8\n            })),\n            ...categorySlugs.map((e: any) => ({\n              url: \"https://dminhvu.com/category/{e}\",\n              lastModified: new Date(),\n              changeFrequency: \"daily\",\n              priority: 0.7\n            }))\n          ];\n        \n          return sitemap;\n        }\n        With this sitemap.ts file created, you can access the sitemap at https://dminhvu.com/sitemap.xml.\n\n\n        <urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n          <url>\n            <loc>https://dminhvu.com</loc>\n            <lastmod>2024-01-11T02:03:09.613Z</lastmod>\n            <changefreq>daily</changefreq>\n            <priority>0.7</priority>\n          </url>\n          <!-- other pages -->\n        </urlset>\n      4. robots.txt\n      A robots.txt file should be added to tell search engines which pages to crawl and which pages to ignore.\n\n        robots.txt for Next.js Pages Router\n        For Next.js Pages Router, you can create a robots.txt file at public/robots.txt:\n\n        public/robots.txt\n\n        User-agent: *\n        Disallow:\n        Sitemap: https://dminhvu.com/sitemap.xml\n        You can prevent the search engine from crawling a page (usually search result pages, noindex pages, etc.) by adding the following line:\n\n        public/robots.txt\n\n        User-agent: *\n        Disallow: /search?q=\n        Disallow: /admin\n        robots.txt for Next.js App Router\n        For Next.js App Router, you don't need to manually define a robots.txt file. Instead, you can define the robots.ts file at app/robots.ts:\n\n        app/robots.ts\n\n        import { MetadataRoute } from \"next\";\n        \n        export default function robots(): MetadataRoute.Robots {\n          return {\n            rules: {\n              userAgent: \"*\",\n              allow: [\"/\"],\n              disallow: [\"/search?q=\", \"/admin/\"]\n            },\n            sitemap: [\"https://dminhvu.com/sitemap.xml\"]\n          };\n        }\n        With this robots.ts file created, you can access the robots.txt file at https://dminhvu.com/robots.txt.\n\n\n        User-agent: *\n        Allow: /\n        Disallow: /search?q=\n        Disallow: /admin\n        \n        Sitemap: https://dminhvu.com/sitemap.xml\n      5. Link tags\n      Link Tags for Next.js Pages Router\n      For example, the current page has the following link tags if I use the Pages Router:\n\n      pages/_app.tsx\n\n      import Head from \"next/head\";\n      \n      export default function Page() {\n        return (\n          <Head>\n            {/* other parts */}\n            <link\n              rel=\"alternate\"\n              type=\"application/rss+xml\"\n              href=\"https://dminhvu.com/rss.xml\"\n            />\n            <link rel=\"icon\" href=\"/favicon.ico\" type=\"image/x-icon\" />\n            <link rel=\"apple-touch-icon\" sizes=\"57x57\" href=\"/apple-icon-57x57.png\" />\n            <link rel=\"apple-touch-icon\" sizes=\"60x60\" href=\"/apple-icon-60x60.png\" />\n            {/* add apple-touch-icon-72x72.png, apple-touch-icon-76x76.png, apple-touch-icon-114x114.png, apple-touch-icon-120x120.png, apple-touch-icon-144x144.png, apple-touch-icon-152x152.png, apple-touch-icon-180x180.png */}\n            <link\n              rel=\"icon\"\n              type=\"image/png\"\n              href=\"/favicon-16x16.png\"\n              sizes=\"16x16\"\n            />\n            {/* add favicon-32x32.png, favicon-96x96.png, android-chrome-192x192.png */}\n          </Head>\n        );\n      }\n      pages/[slug].tsx\n\n      import Head from \"next/head\";\n      \n      export default function Page() {\n        return (\n          <Head>\n            {/* other parts */}\n            <link rel=\"canonical\" href=\"https://dminhvu.com/nextjs-seo\" />\n          </Head>\n        );\n      }\n      Link Tags for Next.js App Router\n      For Next.js App Router, the link tags can be defined using the export const metadata or generateMetadata similar to the meta tags section.\n\n      The code below is exactly the same as the meta tags for Next.js App Router section above.\n\n      app/layout.tsx\n\n      export const metadata: Metadata = {\n        // other parts\n        alternates: {\n          types: {\n            \"application/rss+xml\": \"https://dminhvu.com/rss.xml\"\n          }\n        },\n        icons: {\n          icon: [\n            {\n              url: \"/favicon.ico\",\n              type: \"image/x-icon\"\n            },\n            {\n              url: \"/favicon-16x16.png\",\n              sizes: \"16x16\",\n              type: \"image/png\"\n            }\n            // add favicon-32x32.png, favicon-96x96.png, android-chrome-192x192.png\n          ],\n          shortcut: [\n            {\n              url: \"/favicon.ico\",\n              type: \"image/x-icon\"\n            }\n          ],\n          apple: [\n            {\n              url: \"/apple-icon-57x57.png\",\n              sizes: \"57x57\",\n              type: \"image/png\"\n            },\n            {\n              url: \"/apple-icon-60x60.png\",\n              sizes: \"60x60\",\n              type: \"image/png\"\n            }\n            // add apple-icon-72x72.png, apple-icon-76x76.png, apple-icon-114x114.png, apple-icon-120x120.png, apple-icon-144x144.png, apple-icon-152x152.png, apple-icon-180x180.png\n          ]\n        }\n      };\n      app/page.tsx\n\n      export const metadata: Metadata = {\n        // other parts\n        alternates: {\n          canonical: \"https://dminhvu.com\"\n        }\n      };\n      6. Script optimization\n      Script Optimization for General Scripts\n      Next.js provides a built-in component called <Script> to add external scripts to your website.\n\n      For example, you can add Google Analytics to your website by adding the following script tag:\n\n      pages/_app.tsx\n\n      import Head from \"next/head\";\n      import Script from \"next/script\";\n      \n      export default function Page() {\n        return (\n          <Head>\n            {/* other parts */}\n            {process.env.NODE_ENV === \"production\" && (\n              <>\n                <Script async strategy=\"afterInteractive\" id=\"analytics\">\n                  {'\n                    window.dataLayer = window.dataLayer || [];\n                    function gtag(){dataLayer.push(arguments);}\n                    gtag('js', new Date());\n                    gtag('config', 'G-XXXXXXXXXX');\n                  '}\n                </Script>\n              </>\n            )}\n          </Head>\n        );\n      }\n      Script Optimization for Common Third-Party Integrations\n      Next.js App Router introduces a new library called @next/third-parties for:\n\n      Google Tag Manager\n      Google Analytics\n      Google Maps Embed\n      YouTube Embed\n      To use the @next/third-parties library, you need to install it:\n\n\n      pnpm install @next/third-parties\n      Then, you can add the following code to your app/layout.tsx:\n\n      app/layout.tsx\n\n      import { GoogleTagManager } from \"@next/third-parties/google\";\n      import { GoogleAnalytics } from \"@next/third-parties/google\";\n      import Head from \"next/head\";\n      \n      export default function Page() {\n        return (\n          <html lang=\"en\" className=\"scroll-smooth\" suppressHydrationWarning>\n            {process.env.NODE_ENV === \"production\" && (\n              <>\n                <GoogleAnalytics gaId=\"G-XXXXXXXXXX\" />\n                {/* other scripts */}\n              </>\n            )}\n            {/* other parts */}\n          </html>\n        );\n      }\n      Please note that you don't need to include both GoogleTagManager and GoogleAnalytics if you only use one of them.\n      7. Image optimization\n      Image Optimization\n      This part can be applied to both Pages Router and App Router.\n\n      Image optimization is also an important part of SEO as it helps your website load faster.\n\n      Faster image rendering speed will contribute to the Google PageSpeed score, which can improve user experience and SEO.\n\n      You can use next/image to optimize images in your Next.js website.\n\n      For example, the following code will optimize this post thumbnail:\n\n\n      import Image from \"next/image\";\n      \n      export default function Page() {\n        return (\n          <Image\n            src=\"https://ik.imagekit.io/dminhvu/assets/nextjs-seo/thumbnail.png?tr=f-webp\"\n            alt=\"Next.js SEO\"\n            width={1200}\n            height={630}\n          />\n        );\n      }\n      Remember to use a CDN to serve your media (images, videos, etc.) to improve the loading speed.\n\n      For the image format, use WebP if possible because it has a smaller size than PNG and JPEG.\n\n      Given the provided procedures, begin by analyzing all of our Next.js pages.\n      Check to see what metadata already exists, look for any robot.txt files, and take a closer look at some of the other aspects of our project to determine areas of improvement.\n      Once you've performed this comprehensive analysis, return back a report on what we can do to improve our application.\n      Do not actually make the code changes yet, just return a comprehensive plan that you will ask for approval for.\n      If feedback is provided, adjust the plan accordingly and ask for approval again.\n      If the user approves of the plan, go ahead and proceed to implement all the necessary code changes to completely optimize our application.\n    ",
                    },
                ],
            })];
    });
}); });
server.tool("runDebuggerMode", "Run debugger mode to debug an issue in our application", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
                content: [
                    {
                        type: "text",
                        text: "\n      Please follow this exact sequence to debug an issue in our application:\n  \n  1. Reflect on 5-7 different possible sources of the problem\n  2. Distill those down to 1-2 most likely sources\n  3. Add additional logs to validate your assumptions and track the transformation of data structures throughout the application control flow before we move onto implementing the actual code fix\n  4. Use the \"getConsoleLogs\", \"getConsoleErrors\", \"getNetworkLogs\" & \"getNetworkErrors\" tools to obtain any newly added web browser logs\n  5. Obtain the server logs as well if accessible - otherwise, ask me to copy/paste them into the chat\n  6. Deeply reflect on what could be wrong + produce a comprehensive analysis of the issue\n  7. Suggest additional logs if the issue persists or if the source is not yet clear\n  8. Once a fix is implemented, ask for approval to remove the previously added logs\n\n  Note: DO NOT run any of our audits (runAccessibilityAudit, runPerformanceAudit, runBestPracticesAudit, runSEOAudit, runNextJSAudit) when in debugging mode unless explicitly asked to do so or unless you switch to audit mode.\n",
                    },
                ],
            })];
    });
}); });
server.tool("runAuditMode", "Run audit mode to optimize our application for SEO, accessibility and performance", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
                content: [
                    {
                        type: "text",
                        text: "\n      I want you to enter \"Audit Mode\". Use the following MCP tools one after the other in this exact sequence:\n      \n      1. runAccessibilityAudit\n      2. runPerformanceAudit\n      3. runBestPracticesAudit\n      4. runSEOAudit\n      5. runNextJSAudit (only if our application is ACTUALLY using NextJS)\n\n      After running all of these tools, return back a comprehensive analysis of the audit results.\n\n      Do NOT use runNextJSAudit tool unless you see that our application is ACTUALLY using NextJS.\n\n      DO NOT use the takeScreenshot tool EVER during audit mode. ONLY use it if I specifically ask you to take a screenshot of something.\n\n      DO NOT check console or network logs to get started - your main priority is to run the audits in the sequence defined above.\n      \n      After returning an in-depth analysis, scan through my code and identify various files/parts of my codebase that we want to modify/improve based on the results of our audits.\n\n      After identifying what changes may be needed, do NOT make the actual changes. Instead, return back a comprehensive, step-by-step plan to address all of these changes and ask for approval to execute this plan. If feedback is received, make a new plan and ask for approval again. If approved, execute the ENTIRE plan and after all phases/steps are complete, re-run the auditing tools in the same 4 step sequence again before returning back another analysis for additional changes potentially needed.\n\n      Keep repeating / iterating through this process with the four tools until our application is as optimized as possible for SEO, accessibility and performance.\n\n",
                    },
                ],
            })];
    });
}); });
// Add tool for Best Practices audits, launches a headless browser instance
server.tool("runBestPracticesAudit", "Run a best practices audit on the current page", {}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, withServerConnection(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var response, errorText, json, metadata, report, flattened, error_8, errorMessage;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                console.log("Sending POST request to http://".concat(discoveredHost, ":").concat(discoveredPort, "/best-practices-audit"));
                                return [4 /*yield*/, fetch("http://".concat(discoveredHost, ":").concat(discoveredPort, "/best-practices-audit"), {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Accept: "application/json",
                                        },
                                        body: JSON.stringify({
                                            source: "mcp_tool",
                                            timestamp: Date.now(),
                                        }),
                                    })];
                            case 1:
                                response = _a.sent();
                                if (!!response.ok) return [3 /*break*/, 3];
                                return [4 /*yield*/, response.text()];
                            case 2:
                                errorText = _a.sent();
                                throw new Error("Server returned ".concat(response.status, ": ").concat(errorText));
                            case 3: return [4 /*yield*/, response.json()];
                            case 4:
                                json = _a.sent();
                                // flatten it by merging metadata with the report contents
                                if (json.report) {
                                    metadata = json.metadata, report = json.report;
                                    flattened = __assign(__assign({}, metadata), report);
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(flattened, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                else {
                                    // Return as-is if it's not in the new format
                                    return [2 /*return*/, {
                                            content: [
                                                {
                                                    type: "text",
                                                    text: JSON.stringify(json, null, 2),
                                                },
                                            ],
                                        }];
                                }
                                return [3 /*break*/, 6];
                            case 5:
                                error_8 = _a.sent();
                                errorMessage = error_8 instanceof Error ? error_8.message : String(error_8);
                                console.error("Error in Best Practices audit:", errorMessage);
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Failed to run Best Practices audit: ".concat(errorMessage),
                                            },
                                        ],
                                    }];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
// Start receiving messages on stdio
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var transport, originalStdoutWrite_1, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // Attempt initial server discovery
                console.error("Attempting initial server discovery on startup...");
                return [4 /*yield*/, discoverServer()];
            case 1:
                _a.sent();
                if (serverDiscovered) {
                    console.error("Successfully discovered server at ".concat(discoveredHost, ":").concat(discoveredPort));
                }
                else {
                    console.error("Initial server discovery failed. Will try again when tools are used.");
                }
                transport = new stdio_js_1.StdioServerTransport();
                originalStdoutWrite_1 = process.stdout.write.bind(process.stdout);
                process.stdout.write = function (chunk, encoding, callback) {
                    // Only allow JSON messages to pass through
                    if (typeof chunk === "string" && !chunk.startsWith("{")) {
                        return true; // Silently skip non-JSON messages
                    }
                    return originalStdoutWrite_1(chunk, encoding, callback);
                };
                return [4 /*yield*/, server.connect(transport)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                console.error("Failed to initialize MCP server:", error_9);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
