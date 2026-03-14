#!/usr/bin/env node
/**
 * Comprehensive TNF Relay v4.1 (Cloud Ready)
 * Complete API interception and management system
 * Consolidated Single-Port Architecture for Cloud Deployment
 */

const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');

class ComprehensiveTNFRelay {
  constructor() {
    this.relayId = process.env.RELAY_ID || 'TNF-RELAY-CLOUD-001';
    this.version = '4.1-cloud';
    this.isRunning = false;

    // Single main port for HTTP + WS + UI
    this.port = process.env.PORT || 3000;
    this.proxyPort = process.env.PROXY_PORT || 8888;

    this.httpServer = null;
    this.webSocketServer = null;
    this.proxyServer = null;

    // Legacy mapping (for status response compatibility)
    this.ports = {
      http: this.port,
      websocket: this.port,
      ui: this.port,
      proxy: this.proxyPort,
    };

    this.agents = new Map();
    this.chromeExtensions = new Map();
    this.interceptedMessages = [];
    this.interceptRules = new Map();
    this.systemStatus = {
      startTime: null,
      interceptCount: 0,
      activeConnections: 0,
    };

    // Use HOME or dedicated data dir
    const homeDir = process.env.HOME || '/root';
    this.workspaceDir = path.join(homeDir, '.tnf-relay');
    this.logPath = path.join(this.workspaceDir, 'relay.log');

    // Ensure workspace exists
    require('fs').mkdir(this.workspaceDir, { recursive: true }, () => {});

    this.setupInterceptRules();
  }

  setupInterceptRules() {
    this.interceptRules.set('api.anthropic.com', {
      action: 'intercept_and_route',
      description: 'Claude API calls',
      enabled: true,
      target: 'claude_desktop',
    });

    this.interceptRules.set('api.githubcopilot.com', {
      action: 'intercept_and_route',
      description: 'GitHub Copilot API calls',
      enabled: true,
      target: 'claude_desktop',
    });

    this.interceptRules.set('api.openai.com', {
      action: 'intercept_and_route',
      description: 'OpenAI API calls',
      enabled: true,
      target: 'claude_desktop',
    });
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logEntry.trim());
    try {
      await fs.appendFile(this.logPath, logEntry);
    } catch (error) {
      // Ignore FS errors in cloud if not persistent
    }
  }

  async start() {
    try {
      this.systemStatus.startTime = new Date().toISOString();
      await this.log(`Starting TNF Relay v${this.version}`);

      await this.startMainServer();
      await this.startProxyServer();

      this.isRunning = true;
      await this.log(`TNF Relay Service Active on Port ${this.port}`);
      return true;
    } catch (error) {
      await this.log(`Failed to start relay: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async startMainServer() {
    const app = express();

    // 1. Setup Middleware
    app.use(express.json());
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // 2. Setup API Routes
    this.setupAPIRoutes(app);

    // 3. Setup UI (Serve Static Files)
    // Assume UI is built in ../ui/build relative to src
    const uiPath = path.join(__dirname, '../ui/build');
    app.use(express.static(uiPath));

    // Handle SPA Routing (Fallback to index.html)
    app.get('*', (req, res) => {
      // Don't intercept API calls or specific extensions
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        if (!req.path.endsWith('.html')) return res.status(404).end();
      }
      res.sendFile(path.join(uiPath, 'index.html'));
    });

    // 4. Create HTTP Server
    this.httpServer = http.createServer(app);

    // 5. Setup WebSocket on SAME server
    this.webSocketServer = new WebSocket.Server({ server: this.httpServer });
    this.webSocketServer.on('connection', async (ws, req) => {
      await this.handleWebSocketConnection(ws, req);
    });

    // 6. Listen
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  setupAPIRoutes(app) {
    app.get('/status', (req, res) => {
      res.json({
        relayId: this.relayId,
        version: this.version,
        isRunning: this.isRunning,
        systemStatus: this.systemStatus,
        stats: {
          agents: this.agents.size,
          chromeExtensions: this.chromeExtensions.size,
          interceptedMessages: this.interceptedMessages.length,
          activeConnections: this.systemStatus.activeConnections,
        },
        ports: this.ports,
        deployMode: 'cloud-single-port',
      });
    });

    app.get('/agents', (req, res) => res.json({ agents: Array.from(this.agents.values()) }));
    app.get('/intercept-rules', (req, res) =>
      res.json({ rules: Array.from(this.interceptRules.entries()) })
    );

    app.post('/intercept-rules', (req, res) => {
      const { hostname, action, description, enabled = true, target = 'claude_desktop' } = req.body;
      this.interceptRules.set(hostname, { action, description, enabled, target });
      res.json({ success: true, message: 'Intercept rule added' });
    });

    app.get('/intercepted-messages', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json({
        messages: this.interceptedMessages.slice(-limit),
        total: this.interceptedMessages.length,
      });
    });

    // Alias for Dashboard data
    app.get('/api/dashboard', (req, res) => {
      res.json({
        systemStatus: this.systemStatus,
        stats: {
          agents: this.agents.size,
          chromeExtensions: this.chromeExtensions.size,
          interceptedMessages: this.interceptedMessages.length,
          activeConnections: this.systemStatus.activeConnections,
        },
        recentMessages: this.interceptedMessages.slice(-10),
        interceptRules: Array.from(this.interceptRules.entries()),
      });
    });
  }

  async handleWebSocketConnection(ws) {
    const clientId = this.generateClientId();
    ws.clientId = clientId;
    ws.isAlive = true;

    this.systemStatus.activeConnections++;
    await this.log(`WebSocket client connected: ${clientId}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleWebSocketMessage(ws, message);
      } catch (error) {
        // Silent error for malformed JSON
      }
    });

    ws.on('close', async () => {
      this.systemStatus.activeConnections--;
      await this.log(`WebSocket client disconnected: ${clientId}`);
      this.agents.delete(clientId);
      this.chromeExtensions.delete(clientId);
    });

    ws.send(
      JSON.stringify({
        type: 'WELCOME',
        clientId: clientId,
        relayInfo: { id: this.relayId, version: this.version },
      })
    );
  }

  async startProxyServer() {
    // Optional Cloud Proxy
    const server = http.createServer();
    server.on('request', (req, res) => this.handleProxyHTTPRequest(req, res));
    server.on('connect', (req, socket, head) => this.handleProxyHTTPSConnect(req, socket, head));

    return new Promise((resolve) => {
      this.proxyServer = server.listen(this.proxyPort, () => {
        this.log(`Proxy Server (Optional) listening on port ${this.proxyPort}`);
        resolve();
      });
    });
  }

  // ... Reuse existing Proxy Logic ...
  async handleProxyHTTPRequest(req, res) {
    const requestUrl = url.parse(req.url);
    const hostname = requestUrl.hostname || req.headers.host;

    if (this.shouldIntercept(hostname)) {
      await this.interceptHTTPRequest(req, res, requestUrl);
    } else {
      await this.forwardHTTPRequest(req, res, requestUrl);
    }
  }

  shouldIntercept(hostname) {
    // Basic check
    if (!hostname) return false;
    for (const [rule, config] of this.interceptRules) {
      if (config.enabled && hostname.includes(rule)) {
        return true;
      }
    }
    return false;
  }

  async interceptHTTPRequest(req, res, requestUrl) {
    // Simplified interceptor
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', async () => {
      const data = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body,
        timestamp: new Date().toISOString(),
        source: 'http_proxy',
      };
      this.interceptedMessages.push({ ...data, id: `MSG_${Date.now()}` });
      this.systemStatus.interceptCount++;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Intercepted by TNF Cloud Relay' }));
    });
  }

  async forwardHTTPRequest(req, res, requestUrl) {
    // Basic non-intercepted forward logic would go here
    // For cloud relay, we often skip full proxying unless needed
    res.writeHead(501);
    res.end('Proxy forwarding not fully enabled in cloud mode');
  }

  async handleProxyHTTPSConnect(req, socket, head) {
    // Connect handling
    socket.destroy(); // Disabled for security in basic cloud setup
  }

  // Helper Methods
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'REGISTER':
        await this.handleRegistration(ws, message);
        break;
      case 'BROADCAST':
        await this.handleBroadcast(ws, message);
        break;
      case 'API_INTERCEPT_NOTIFICATION':
        // Handle notification
        break;
    }
  }

  async handleBroadcast(senderWs, message) {
    const { payload } = message;
    const broadcastMessage = JSON.stringify({
      type: 'BROADCAST_EVENT',
      source: senderWs.clientId,
      payload: payload,
      timestamp: new Date().toISOString(),
    });

    // Send to all other connected clients
    [...this.agents.values(), ...this.chromeExtensions.values()].forEach((client) => {
      if (client.id !== senderWs.clientId) {
        client.ws.send(broadcastMessage);
      }
    });
  }

  async handleRegistration(ws, message) {
    const { payload } = message;
    const clientInfo = {
      id: ws.clientId,
      type: payload.type,
      capabilities: payload.capabilities || [],
      registeredAt: new Date().toISOString(),
      ws: ws,
    };

    if (payload.type === 'chrome_extension') {
      this.chromeExtensions.set(ws.clientId, clientInfo);
    } else {
      this.agents.set(ws.clientId, clientInfo);
    }

    ws.send(
      JSON.stringify({
        type: 'REGISTRATION_CONFIRMED',
        clientId: ws.clientId,
      })
    );
  }

  async stop() {
    this.isRunning = false;
    if (this.webSocketServer) this.webSocketServer.close();
    if (this.httpServer) this.httpServer.close();
    if (this.proxyServer) this.proxyServer.close();
  }
}

// CLI Interface
if (require.main === module) {
  const relay = new ComprehensiveTNFRelay();
  relay.start().then((success) => {
    if (!success) process.exit(1);

    // Handle signals
    process.on('SIGINT', () => {
      relay.stop().then(() => process.exit(0));
    });
  });
}

module.exports = ComprehensiveTNFRelay;
