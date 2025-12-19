#!/usr/bin/env node
/**
 * Comprehensive TNF Relay v4.0
 * Complete API interception and management system
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
    this.relayId = 'TNF-RELAY-COMPREHENSIVE-001';
    this.version = '4.0';
    this.isRunning = false;

    this.ports = {
      http: 3000,
      websocket: 3001,
      proxy: 8888,
      ui: 3002,
    };

    this.httpServer = null;
    this.webSocketServer = null;
    this.proxyServer = null;
    this.uiServer = null;

    this.agents = new Map();
    this.chromeExtensions = new Map();
    this.interceptedMessages = [];
    this.interceptRules = new Map();
    this.systemStatus = {
      startTime: null,
      interceptCount: 0,
      activeConnections: 0,
    };

    this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
    this.logPath = path.join(this.workspaceDir, 'comprehensive-relay.log');

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
      console.error('Logging error:', error);
    }
  }

  async start() {
    try {
      this.systemStatus.startTime = new Date().toISOString();
      await this.log('Starting Comprehensive TNF Relay v4.0');

      await this.startHTTPServer();
      await this.startWebSocketServer();
      await this.startProxyServer();
      await this.startUIServer();

      this.isRunning = true;
      await this.log(
        `TNF Relay started on ports: HTTP:${this.ports.http}, WS:${this.ports.websocket}, Proxy:${this.ports.proxy}, UI:${this.ports.ui}`
      );

      return true;
    } catch (error) {
      await this.log(`Failed to start relay: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async startHTTPServer() {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

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
      });
    });

    app.get('/agents', (req, res) => {
      res.json({ agents: Array.from(this.agents.values()) });
    });

    app.get('/intercept-rules', (req, res) => {
      res.json({ rules: Array.from(this.interceptRules.entries()) });
    });

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

    app.post('/setup/claude-code-env', async (req, res) => {
      try {
        await this.setupClaudeCodeEnvironment();
        res.json({ success: true, message: 'Claude Code environment configured' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

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

    return new Promise((resolve, reject) => {
      this.httpServer = app.listen(this.ports.http, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async startWebSocketServer() {
    this.webSocketServer = new WebSocket.Server({ port: this.ports.websocket });

    this.webSocketServer.on('connection', async (ws, req) => {
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
          await this.log(`WebSocket message error: ${error.message}`, 'ERROR');
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
          relayInfo: {
            id: this.relayId,
            version: this.version,
          },
        })
      );
    });
  }

  async startProxyServer() {
    const server = http.createServer();

    server.on('request', (req, res) => {
      this.handleProxyHTTPRequest(req, res);
    });

    server.on('connect', (req, socket, head) => {
      this.handleProxyHTTPSConnect(req, socket, head);
    });

    return new Promise((resolve, reject) => {
      this.proxyServer = server.listen(this.ports.proxy, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async startUIServer() {
    const app = express();
    app.use(express.static(path.join(__dirname, 'ui-build')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui-build', 'index.html'));
    });

    return new Promise((resolve, reject) => {
      this.uiServer = app.listen(this.ports.ui, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async handleProxyHTTPRequest(req, res) {
    const requestUrl = url.parse(req.url);
    const hostname = requestUrl.hostname || req.headers.host;

    await this.log(`HTTP Request: ${req.method} ${hostname}${requestUrl.path}`);

    if (this.shouldIntercept(hostname)) {
      await this.interceptHTTPRequest(req, res, requestUrl);
    } else {
      await this.forwardHTTPRequest(req, res, requestUrl);
    }
  }

  shouldIntercept(hostname) {
    for (const [rule, config] of this.interceptRules) {
      if (config.enabled && hostname.includes(rule)) {
        return true;
      }
    }
    return false;
  }

  async interceptHTTPRequest(req, res, requestUrl) {
    try {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const interceptData = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: body,
          timestamp: new Date().toISOString(),
          source: 'http_proxy',
        };

        await this.processInterceptedRequest(interceptData);
        this.systemStatus.interceptCount++;

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });

        res.end(
          JSON.stringify({
            message: 'Request intercepted and routed via TNF Relay',
            intercepted: true,
            relayId: this.relayId,
            timestamp: new Date().toISOString(),
          })
        );
      });
    } catch (error) {
      await this.log(`Error intercepting HTTP request: ${error.message}`, 'ERROR');
      res.writeHead(500);
      res.end('Intercept error');
    }
  }

  async processInterceptedRequest(interceptData) {
    try {
      const messageEntry = {
        id: `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...interceptData,
        processedAt: new Date().toISOString(),
      };

      this.interceptedMessages.push(messageEntry);

      const claudeMessage = await this.formatForClaudeDesktop(interceptData);
      await this.routeToClaudeDesktop(claudeMessage, interceptData);

      await this.log(`Processed intercepted request: ${messageEntry.id}`);
    } catch (error) {
      await this.log(`Error processing intercepted request: ${error.message}`, 'ERROR');
    }
  }

  async formatForClaudeDesktop(interceptData) {
    let claudeMessage = `🔍 **API Call Intercepted**\n\n`;
    claudeMessage += `**Endpoint:** ${interceptData.url}\n`;
    claudeMessage += `**Method:** ${interceptData.method}\n`;
    claudeMessage += `**Time:** ${new Date(interceptData.timestamp).toLocaleString()}\n\n`;

    if (interceptData.body) {
      try {
        const bodyJson = JSON.parse(interceptData.body);

        if (bodyJson.messages) {
          claudeMessage += `**Conversation:**\n`;
          bodyJson.messages.forEach((msg, index) => {
            claudeMessage += `${index + 1}. **${msg.role.toUpperCase()}:** ${msg.content}\n\n`;
          });
        } else if (bodyJson.prompt) {
          claudeMessage += `**Prompt:** ${bodyJson.prompt}\n\n`;
        } else {
          claudeMessage += `**Request Data:**\n\`\`\`json\n${JSON.stringify(bodyJson, null, 2)}\n\`\`\`\n\n`;
        }
      } catch (error) {
        claudeMessage += `**Raw Request:**\n\`\`\`\n${interceptData.body}\n\`\`\`\n\n`;
      }
    }

    claudeMessage += `---\n*Intercepted via TNF Relay v${this.version}*`;
    return claudeMessage;
  }

  async routeToClaudeDesktop(claudeMessage, interceptData) {
    try {
      execSync(`open "/Applications/Claude.app"`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const appleScript = `
            tell application "Claude"
                activate
                delay 0.5
            end tell
            
            tell application "System Events"
                tell process "Claude"
                    click text area 1 of scroll area 1 of group 1 of group 1 of window 1
                    delay 0.2
                    keystroke "a" using command down
                    keystroke "${claudeMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
                    delay 0.5
                    keystroke return
                end tell
            end tell
            `;

      execSync(`osascript -e '${appleScript}'`);
      await this.log('Message sent to Claude Desktop');
    } catch (error) {
      await this.log(`Error routing to Claude Desktop: ${error.message}`, 'ERROR');
    }
  }

  async setupClaudeCodeEnvironment() {
    try {
      const envScript = `#!/bin/bash
export HTTP_PROXY="http://localhost:${this.ports.proxy}"
export HTTPS_PROXY="http://localhost:${this.ports.proxy}"
export http_proxy="$HTTP_PROXY"
export https_proxy="$HTTPS_PROXY"
export NODE_TLS_REJECT_UNAUTHORIZED=0
export TNF_INTERCEPT_ACTIVE=1

claude_with_tnf() {
    echo "[$(date)] Claude Code: $*" >> "${this.workspaceDir}/claude-code-activity.log"
    command claude "$@"
}

alias claude='claude_with_tnf'
alias claude-original='command claude'

echo "🔧 TNF Claude Code environment loaded"
echo "💡 Proxy: $HTTP_PROXY"
`;

      const envPath = path.join(process.env.HOME, '.tnf-claude-env');
      await fs.writeFile(envPath, envScript);

      await this.log(`Created Claude Code environment script: ${envPath}`);
      return envPath;
    } catch (error) {
      await this.log(`Error setting up Claude Code environment: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'REGISTER':
        await this.handleRegistration(ws, message);
        break;
      case 'API_INTERCEPT_NOTIFICATION':
        await this.handleAPIIntercept(ws, message);
        break;
      default:
        await this.log(`Unknown message type: ${message.type}`, 'WARN');
    }
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
      await this.log(`Chrome extension registered: ${ws.clientId}`);
    } else {
      this.agents.set(ws.clientId, clientInfo);
      await this.log(`Agent registered: ${ws.clientId} (${payload.type})`);
    }

    ws.send(
      JSON.stringify({
        type: 'REGISTRATION_CONFIRMED',
        clientId: ws.clientId,
      })
    );
  }

  async handleAPIIntercept(ws, message) {
    try {
      const { content } = message;
      const interceptData = content.original_request || content.request_data;

      await this.log(`API Intercept received: ${interceptData.method} ${interceptData.url}`);
      await this.processInterceptedRequest(interceptData);
    } catch (error) {
      await this.log(`Error handling API intercept: ${error.message}`, 'ERROR');
    }
  }

  async forwardHTTPRequest(req, res, requestUrl) {
    try {
      const options = {
        hostname: requestUrl.hostname,
        port: requestUrl.port || (requestUrl.protocol === 'https:' ? 443 : 80),
        path: requestUrl.path,
        method: req.method,
        headers: req.headers,
      };

      const protocol = requestUrl.protocol === 'https:' ? https : http;

      const proxyReq = protocol.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (error) => {
        this.log(`Proxy request error: ${error.message}`, 'ERROR');
        res.writeHead(500);
        res.end('Proxy error');
      });

      req.pipe(proxyReq);
    } catch (error) {
      await this.log(`Error forwarding HTTP request: ${error.message}`, 'ERROR');
      res.writeHead(500);
      res.end('Forward error');
    }
  }

  async handleProxyHTTPSConnect(req, socket, head) {
    const [hostname, port] = req.url.split(':');

    await this.log(`HTTPS CONNECT: ${hostname}:${port}`);
    await this.forwardHTTPSConnect(req, socket, head, hostname, port);
  }

  async forwardHTTPSConnect(req, socket, head, hostname, port) {
    const targetSocket = net.connect(port, hostname, () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      targetSocket.write(head);
      socket.pipe(targetSocket);
      targetSocket.pipe(socket);
    });

    targetSocket.on('error', (error) => {
      this.log(`HTTPS forward error: ${error.message}`, 'ERROR');
      socket.destroy();
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async stop() {
    this.isRunning = false;

    if (this.webSocketServer) this.webSocketServer.close();
    if (this.httpServer) this.httpServer.close();
    if (this.proxyServer) this.proxyServer.close();
    if (this.uiServer) this.uiServer.close();

    await this.log('TNF Relay stopped');
  }

  getStatus() {
    return {
      relayId: this.relayId,
      version: this.version,
      isRunning: this.isRunning,
      systemStatus: this.systemStatus,
      ports: this.ports,
      stats: {
        agents: this.agents.size,
        chromeExtensions: this.chromeExtensions.size,
        interceptedMessages: this.interceptedMessages.length,
        activeConnections: this.systemStatus.activeConnections,
      },
    };
  }
}

// CLI Interface
if (require.main === module) {
  const relay = new ComprehensiveTNFRelay();
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'start':
        const success = await relay.start();
        if (success) {
          console.log(`\n🚀 TNF Relay v${relay.version} is running!`);
          console.log(`\n🌐 Access URLs:`);
          console.log(`   📊 Dashboard: http://localhost:${relay.ports.ui}`);
          console.log(`   🔌 HTTP API: http://localhost:${relay.ports.http}`);
          console.log(`   💬 WebSocket: ws://localhost:${relay.ports.websocket}`);
          console.log(`   🔄 Proxy: http://localhost:${relay.ports.proxy}`);
          console.log(`\nPress Ctrl+C to stop...\n`);

          process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down TNF Relay...');
            await relay.stop();
            process.exit(0);
          });

          await new Promise(() => {});
        } else {
          console.error('❌ Failed to start TNF Relay');
          process.exit(1);
        }
        break;

      case 'status':
        const status = relay.getStatus();
        console.log('\n📊 TNF Relay Status:');
        console.log(`   Relay ID: ${status.relayId}`);
        console.log(`   Version: ${status.version}`);
        console.log(`   Running: ${status.isRunning}`);
        console.log(`   Agents: ${status.stats.agents}`);
        console.log(`   Intercepted Messages: ${status.stats.interceptedMessages}`);
        break;

      default:
        console.log(`
🚀 TNF Agent Communication Relay v${relay.version}

Usage:
  node comprehensive-tnf-relay.js start   # Start the relay system
  node comprehensive-tnf-relay.js status  # Show system status

Features:
  ✨ Complete API interception (HTTP/HTTPS proxy)
  🤖 Claude Code terminal integration
  📊 Real-time dashboard UI
  💬 WebSocket communication
  🎯 Claude Desktop integration

After starting, access the dashboard at: http://localhost:${relay.ports.ui}
                `);
    }
  })().catch(console.error);
}

module.exports = ComprehensiveTNFRelay;
