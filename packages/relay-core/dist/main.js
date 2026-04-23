"use strict";
/**
 * Main entry point for The New Fuse Relay Core Server
 * Standalone server application that runs the unified relay system
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const RelayServer_js_1 = require("./server/RelayServer.js");
async function bootstrap() {
    console.log('Starting The New Fuse Relay Core Server...');
    // Configuration from environment variables
    const config = {
        id: process.env.RELAY_ID || 'tnf-relay-core',
        version: process.env.RELAY_VERSION || '1.0.0',
        workspaceDir: process.env.WORKSPACE_DIR || process.cwd(),
        logLevel: process.env.LOG_LEVEL || 'info',
        ports: {
            http: parseInt(process.env.HTTP_PORT || '3000'),
            websocket: parseInt(process.env.WS_PORT || '8080'),
            grpc: parseInt(process.env.GRPC_PORT || '50051'),
        },
        transports: {
            http: process.env.ENABLE_HTTP !== 'false',
            websocket: process.env.ENABLE_WS !== 'false',
            grpc: process.env.ENABLE_GRPC === 'true',
            file: process.env.ENABLE_FILE === 'true',
            mcp: process.env.ENABLE_MCP === 'true',
            redis: process.env.ENABLE_REDIS === 'true',
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            database: parseInt(process.env.REDIS_DB || '0'),
        },
        interceptRules: new Map(),
    };
    // Create and start the relay server
    const relayServer = new RelayServer_js_1.RelayServer(config);
    // Handle server events
    relayServer.on('started', () => {
        console.log('✅ Relay server started successfully');
        console.log(`📡 HTTP Transport: ${config.transports.http ? 'Enabled on port ' + config.ports.http : 'Disabled'}`);
        console.log(`🔌 WebSocket Transport: ${config.transports.websocket ? 'Enabled on port ' + config.ports.websocket : 'Disabled'}`);
        console.log(`🔗 Redis Transport: ${config.transports.redis ? 'Enabled' : 'Disabled'}`);
        console.log(`📋 MCP Transport: ${config.transports.mcp ? 'Enabled' : 'Disabled'}`);
    });
    relayServer.on('error', (error) => {
        console.error('❌ Relay server error:', error);
    });
    relayServer.on('agentRegistered', (agent) => {
        console.log(`🤖 Agent registered: ${agent.id} (${agent.type})`);
    });
    // Create health check HTTP server
    const healthPort = parseInt(process.env.PORT || process.env.HEALTH_PORT || '3000');
    const healthServer = http.createServer((req, res) => {
        if (req.url === '/health' || req.url === '/') {
            const status = relayServer.getSystemStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                ...status,
                timestamp: new Date().toISOString(),
            }));
        }
        else if (req.url === '/agents') {
            const agents = relayServer.getAgents();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ agents }));
        }
        else if (req.url === '/status') {
            const status = relayServer.getSystemStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });
    healthServer.listen(healthPort, () => {
        console.log(`💚 Health check server running on port ${healthPort}`);
    });
    // Start the relay server
    const started = await relayServer.start();
    if (!started) {
        console.error('Failed to start relay server');
        process.exit(1);
    }
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        // Stop health server
        healthServer.close();
        // Stop relay server
        await relayServer.stop();
        console.log('Shutdown complete');
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Error handling
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        shutdown('UNCAUGHT_EXCEPTION');
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        shutdown('UNHANDLED_REJECTION');
    });
}
// Start the application
bootstrap().catch((error) => {
    console.error('Failed to start relay server:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map