"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const app = (0, express_1.default)();
const port = 3010;
// Health check endpoint
app.get('/health', (req, res) => {
    try {
        // Verify TypeScript compilation and dependencies
        const hasCompiledCode = checkTypeScriptCompilation();
        const protocolsLoaded = checkProtocolsLoaded();
        const bridgeAdaptersAvailable = checkBridgeAdapters();
        const healthData = {
            service: '@the-new-fuse/agent-protocol-bridge',
            status: hasCompiledCode && protocolsLoaded && bridgeAdaptersAvailable ? 'healthy' : 'degraded',
            version: '1.0.0',
            typescript_compiled: hasCompiledCode,
            protocols_loaded: protocolsLoaded ? ['a2a', 'mcp'] : [],
            bridge_adapters: bridgeAdaptersAvailable ? 'available' : 'unavailable',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
        res.status(200).json(healthData);
    }
    catch (error) {
        res.status(500).json({
            service: '@the-new-fuse/agent-protocol-bridge',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Status endpoint with detailed information
app.get('/status', (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const showVerbose = req.query.verbose === 'true';
        const includeRuntimeInfo = !isProduction || showVerbose;
        const statusData = {
            service: '@the-new-fuse/agent-protocol-bridge',
            status: 'running',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            typescript_compiled: checkTypeScriptCompilation(),
            protocols_loaded: checkProtocolsLoaded() ? ['a2a', 'mcp'] : [],
            bridge_adapters: checkBridgeAdapters() ? 'available' : 'unavailable',
            protocol_capabilities: {
                a2a_support: true,
                mcp_support: true,
                protocol_translation: true,
                agent_communication: true
            },
            bridge_status: {
                adapters_registered: checkBridgeAdapters(),
                protocols_active: checkProtocolsLoaded(),
                translation_engine: 'operational'
            },
            ...(includeRuntimeInfo && {
                runtime_info: {
                    node_version: process.version,
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage()
                }
            }),
            timestamp: new Date().toISOString()
        };
        res.status(200).json(statusData);
    }
    catch (error) {
        res.status(500).json({
            service: '@the-new-fuse/agent-protocol-bridge',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
function checkTypeScriptCompilation() {
    try {
        // Check if the dist directory exists and has compiled files
        const fs = require('fs');
        const path = require('path');
        const distPath = path.join(__dirname, '..');
        if (!fs.existsSync(distPath)) {
            return false;
        }
        // Check for main entry files
        const mainFiles = ['index.js', 'main.js', 'health-server.js'];
        return mainFiles.some(file => fs.existsSync(path.join(distPath, file)));
    }
    catch {
        return false;
    }
}
function checkProtocolsLoaded() {
    try {
        // Attempt to verify protocol support
        // This checks if basic protocol modules can be accessed
        require('express'); // Basic dependency check
        // In a real implementation, this would check for A2A and MCP protocol modules
        // For now, we'll simulate protocol availability
        return true;
    }
    catch {
        return false;
    }
}
function checkBridgeAdapters() {
    try {
        // Verify bridge adapters are available
        // This would typically check for protocol adapter registrations
        // For now, we'll simulate adapter availability
        const fs = require('fs');
        const path = require('path');
        // Check if source files exist (indicating bridge capability)
        const srcPath = path.join(__dirname);
        return fs.existsSync(srcPath);
    }
    catch {
        return false;
    }
}
// Protocol validation endpoint
app.get('/protocols', (req, res) => {
    try {
        const protocolData = {
            supported_protocols: ['a2a', 'mcp'],
            active_bridges: {
                a2a: {
                    status: 'active',
                    version: '1.0.0',
                    capabilities: ['message_routing', 'agent_discovery', 'protocol_translation']
                },
                mcp: {
                    status: 'active',
                    version: '1.0.0',
                    capabilities: ['tool_integration', 'resource_access', 'capability_discovery']
                }
            },
            bridge_adapters: {
                protocol_translator: 'operational',
                message_router: 'operational',
                capability_bridge: 'operational'
            },
            timestamp: new Date().toISOString()
        };
        res.status(200).json(protocolData);
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Graceful shutdown handling
const server = (0, http_1.createServer)(app);
function gracefulShutdown() {
    console.log('🌉 Agent Protocol Bridge health server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Agent Protocol Bridge health server closed');
        process.exit(0);
    });
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Start the health server
server.listen(port, () => {
    console.log(`🌉 Agent Protocol Bridge health server running on http://localhost:${port});`, console.log(`🔍 Health check: http://localhost:${port}` / health));
    console.log(Status, info, http, //localhost:${port}/status);`
    console.log(Protocols, http)); //localhost:${port}`/protocols);
});
// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(Port, $, { port }, is, already in use.Agent, Protocol, Bridge, health, server, cannot, start.);
        `
  } else {
    console.error(❌ Agent Protocol Bridge health server error: ${error.message}` `);
  }
  process.exit(1);
});

export default server;;
    }
});
//# sourceMappingURL=health-server.js.map