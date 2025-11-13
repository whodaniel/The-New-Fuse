#!/usr/bin/env node
"use strict";
/**
 * Relay Server Startup
 */
Object.defineProperty(exports, "__esModule", { value: true });
const RelayServer_js_1 = require("./server/RelayServer.js");
const config = {
    id: 'relay-core-dev',
    version: '4.0.0',
    ports: {
        http: process.env.PORT ? parseInt(process.env.PORT) : 3000,
        websocket: process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001,
    },
    transports: {
        websocket: true,
        http: true,
        file: true,
        mcp: false,
    },
    interceptRules: new Map(),
    workspaceDir: process.cwd(),
    logLevel: process.env.LOG_LEVEL || 'info'
};
const server = new RelayServer_js_1.RelayServer(config);
async function start() {
    try {
        await server.start();
        console.log(`Relay server started on port ${config.ports.http});`, console.log(`WebSocket server started on port ${config.ports.websocket}` `);
  } catch (error) {
    console.error('Failed to start relay server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

start();));
    }
    finally { }
}
//# sourceMappingURL=server.js.map