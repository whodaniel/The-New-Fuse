"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpConfig = void 0;
exports.mcpConfig = {
    defaultWsPort: parseInt(process.env.MCP_WS_PORT || "8080", 10),
    timeout: parseInt(process.env.MCP_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.MCP_RETRY_DELAY || "1000", 10),
    maxConnections: parseInt(process.env.MCP_MAX_CONNECTIONS || "100", 10),
    heartbeatInterval: parseInt(process.env.MCP_HEARTBEAT_INTERVAL || "30000", 10),
    errors: {
        noConnectedTab: "No connected tab available",
        connectionTimeout: "Connection timeout",
        invalidMessage: "Invalid message format",
        serverError: "Internal server error",
    },
    websocket: {
        pingInterval: 30000,
        pongTimeout: 5000,
        maxPayload: 1024 * 1024, // 1MB
    },
    browser: {
        headless: process.env.BROWSER_HEADLESS === "false" ? false : true,
        timeout: parseInt(process.env.BROWSER_TIMEOUT || "30000", 10),
        viewport: {
            width: parseInt(process.env.BROWSER_WIDTH || "1920", 10),
            height: parseInt(process.env.BROWSER_HEIGHT || "1080", 10),
        },
    },
};
//# sourceMappingURL=mcp.config.js.map