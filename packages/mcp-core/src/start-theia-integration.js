"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTheiaIntegration = startTheiaIntegration;
const integrations_1 = require("./integrations");
const common_1 = require("./types/common");
async function startTheiaIntegration() {
    console.log('Starting Theia Integration...');
    const bridge = (0, integrations_1.createTheiaMCPBridge)({
        server: {
            name: 'theia-mcp-server',
            version: '1.0.0',
            port: 3006, // The bridge server port
            host: 'localhost',
            enableAuth: false,
            logLevel: common_1.LogLevel.INFO,
        },
        theia: {
            enableAIFeatures: true,
            enableToolIntegration: true,
            enableResourceAccess: true,
            workspaceRoot: process.cwd(),
        },
        options: {
            enableStdioTransport: true,
            enableWebSocketTransport: true,
            enableFileSystemAccess: true,
            enableGitIntegration: true,
            enableTerminalAccess: true,
        }
    });
    try {
        await bridge.start();
        console.log('Theia MCP Bridge started successfully.');
    }
    catch (error) {
        console.error('Failed to start Theia MCP Bridge:', error);
    }
}
startTheiaIntegration();
//# sourceMappingURL=start-theia-integration.js.map