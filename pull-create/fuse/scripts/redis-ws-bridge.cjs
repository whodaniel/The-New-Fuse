#!/usr/bin/env node

/**
 * Redis Bridge WebSocket Server
 *
 * This server bridges Chrome Extensions (and other WebSocket clients)
 * to the TNF Redis agent network.
 *
 * Chrome extensions cannot directly connect to Redis, so this server:
 * 1. Accepts WebSocket connections from extensions
 * 2. Translates messages to Redis pub/sub
 * 3. Relays Redis messages back to connected clients
 *
 * Usage:
 *   node redis-ws-bridge.cjs
 *   # With custom port:
 *   PORT=3000 node redis-ws-bridge.cjs
 */

const WebSocket = require('ws');
const http = require('http');
const { RedisAgentClient } = require('./tnf-agent-cli.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  pingInterval: 30000, // 30 seconds
};

// ============================================================================
// BRIDGE SERVER
// ============================================================================

class RedisBridgeServer {
  constructor() {
    this.server = null;
    this.wss = null;
    this.redis = new RedisAgentClient();
    this.clients = new Map(); // wsClient -> agentInfo
    this.agentClients = new Map(); // agentName -> wsClient
  }

  /**
   * Start the bridge server
   */
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║        Redis WebSocket Bridge Server              ║
║     Connecting Extensions to Agent Network        ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      // Initialize Redis connection
      await this.redis.initialize();
      console.log('✅ Connected to Redis');

      // Create HTTP server
      this.server = http.createServer((req, res) => {
        if (req.url === '/health' || req.url === '/healthz') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'ok',
              connectedClients: this.clients.size,
              timestamp: new Date().toISOString(),
            })
          );
        } else if (req.url === '/agents') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              agents: Array.from(this.clients.values()),
            })
          );
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      // Create WebSocket server
      this.wss = new WebSocket.Server({
        server: this.server,
        path: '/redis-bridge',
      });

      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      // Set up Redis message listener
      this.setupRedisListener();

      // Start server
      this.server.listen(CONFIG.port, CONFIG.host, () => {
        console.log(
          `\n🚀 Bridge server running at ws://${CONFIG.host}:${CONFIG.port}/redis-bridge`
        );
        console.log(`   Health check: http://${CONFIG.host}:${CONFIG.port}/health`);
        console.log(`   Agent list: http://${CONFIG.host}:${CONFIG.port}/agents\n`);
      });

      // Handle shutdown
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
    } catch (error) {
      console.error('Failed to start bridge server:', error);
      process.exit(1);
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    console.log(`📱 New client connected: ${clientId}`);

    // Initialize client info
    this.clients.set(ws, {
      id: clientId,
      agentName: null,
      role: null,
      platform: null,
      capabilities: [],
      connectedAt: new Date().toISOString(),
    });

    // Set up ping/pong for keepalive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
        this.sendToClient(ws, {
          type: 'ERROR',
          payload: { message: 'Invalid message format' },
        });
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error(`Client error (${clientId}):`, error.message);
    });

    // Send welcome message
    this.sendToClient(ws, {
      type: 'WELCOME',
      payload: {
        clientId,
        serverVersion: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle client message
   */
  async handleClientMessage(ws, message) {
    const client = this.clients.get(ws);
    console.log(`📨 Message from ${client?.agentName || client?.id}: ${message.type}`);

    switch (message.type) {
      case 'AGENT_REGISTER':
        await this.handleAgentRegister(ws, message.payload);
        break;

      case 'AGENT_MESSAGE':
        await this.handleAgentMessage(ws, message.payload);
        break;

      case 'AGENT_HEARTBEAT':
        this.handleHeartbeat(ws, message.payload);
        break;

      case 'AGENT_LEAVE':
        this.handleAgentLeave(ws);
        break;

      case 'GET_AGENTS':
        this.sendAgentList(ws);
        break;

      case 'PONG':
        ws.isAlive = true;
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle agent registration
   */
  async handleAgentRegister(ws, payload) {
    const { agentName, role, platform, capabilities } = payload;

    // Update client info
    const clientInfo = this.clients.get(ws);
    clientInfo.agentName = agentName;
    clientInfo.role = role || 'participant';
    clientInfo.platform = platform || 'unknown';
    clientInfo.capabilities = capabilities || [];

    // Register with Redis
    await this.redis.register(agentName, role, platform, capabilities);

    // Track agent -> ws mapping
    this.agentClients.set(agentName, ws);

    console.log(`✅ Agent registered: ${agentName} (${role}/${platform})`);

    // Confirm registration
    this.sendToClient(ws, {
      type: 'AGENT_REGISTERED',
      payload: {
        agentName,
        success: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Send current agent list
    this.sendAgentList(ws);
  }

  /**
   * Handle agent message
   */
  async handleAgentMessage(ws, payload) {
    const client = this.clients.get(ws);

    if (!client?.agentName) {
      this.sendToClient(ws, {
        type: 'ERROR',
        payload: { message: 'Must register before sending messages' },
      });
      return;
    }

    // Relay to Redis
    await this.redis.send(payload.content, {
      type: payload.type,
      to: payload.to,
      replyTo: payload.replyTo,
      metadata: payload.metadata,
    });

    console.log(`📤 Relayed message from ${client.agentName} to Redis`);
  }

  /**
   * Handle heartbeat
   */
  handleHeartbeat(ws, payload) {
    const client = this.clients.get(ws);
    if (client) {
      client.lastSeen = new Date().toISOString();
    }

    // Respond with pong
    this.sendToClient(ws, {
      type: 'PONG',
      payload: { timestamp: Date.now() },
    });
  }

  /**
   * Handle agent leave
   */
  handleAgentLeave(ws) {
    const client = this.clients.get(ws);
    if (client?.agentName) {
      this.agentClients.delete(client.agentName);
      console.log(`👋 Agent left: ${client.agentName}`);
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`👋 Client disconnected: ${client.agentName || client.id}`);

      if (client.agentName) {
        this.agentClients.delete(client.agentName);
      }

      this.clients.delete(ws);
    }
  }

  /**
   * Send current agent list to client
   */
  sendAgentList(ws) {
    const agents = Array.from(this.clients.values())
      .filter((c) => c.agentName)
      .map((c) => ({
        name: c.agentName,
        role: c.role,
        platform: c.platform,
        capabilities: c.capabilities,
        status: 'online',
        lastSeen: c.lastSeen || c.connectedAt,
      }));

    this.sendToClient(ws, {
      type: 'AGENT_LIST',
      payload: { agents },
    });
  }

  /**
   * Set up Redis message listener
   */
  setupRedisListener() {
    // Listen for all messages and relay to appropriate clients
    this.redis.onMessage('message', (msg) => {
      this.relayToClients(msg, 'AGENT_MESSAGE');
    });

    this.redis.onMessage('command', (msg) => {
      this.relayToClients(msg, 'AGENT_COMMAND');
    });

    this.redis.onMessage('response', (msg) => {
      this.relayToClients(msg, 'AGENT_RESPONSE');
    });

    this.redis.onMessage('task', (msg) => {
      this.relayToClients(msg, 'TASK_ASSIGNMENT');
    });
  }

  /**
   * Relay Redis message to appropriate clients
   */
  relayToClients(msg, type) {
    // If message has specific target, send only to that agent
    if (msg.to) {
      const ws = this.agentClients.get(msg.to);
      if (ws) {
        this.sendToClient(ws, { type, payload: msg });
      }
    } else {
      // Broadcast to all connected clients (except sender)
      for (const [ws, client] of this.clients) {
        if (client.agentName !== msg.from?.agentName) {
          this.sendToClient(ws, { type, payload: msg });
        }
      }
    }
  }

  /**
   * Send message to client
   */
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Broadcast to all clients
   */
  broadcast(message) {
    for (const ws of this.clients.keys()) {
      this.sendToClient(ws, message);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    console.log('\n🛑 Shutting down bridge server...');

    // Close all client connections
    for (const ws of this.clients.keys()) {
      ws.close();
    }

    // Close server
    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      this.server.close();
    }

    // Cleanup Redis
    await this.redis.cleanup();

    console.log('👋 Bridge server stopped');
    process.exit(0);
  }
}

// ============================================================================
// PING INTERVAL
// ============================================================================

// Ping clients to keep connections alive and detect disconnects
setInterval(() => {
  if (server && server.wss) {
    server.wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }
}, CONFIG.pingInterval);

// ============================================================================
// MAIN
// ============================================================================

const server = new RedisBridgeServer();

async function main() {
  await server.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RedisBridgeServer };
