#!/usr/bin/env node

/**
 * Simple TNF Relay Server for Chrome Extension Testing
 * Handles WebSocket connections on port 3001
 */

const WebSocket = require('ws');
const http = require('http');

class SimpleTNFRelay {
  constructor() {
    this.port = 3001;
    this.httpPort = 3000;
    this.clients = new Map();
    this.conversations = new Map();
    
    this.init();
  }

  init() {
    console.log('🚀 Starting Simple TNF Relay...');
    this.startHttpServer();
    this.startWebSocketServer();
  }

  startHttpServer() {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      if (req.url === '/status') {
        res.end(JSON.stringify({
          status: 'running',
          clients: this.clients.size,
          conversations: this.conversations.size,
          timestamp: Date.now()
        }));
      } else if (req.url === '/health') {
        res.end(JSON.stringify({ status: 'healthy' }));
      } else {
        res.end(JSON.stringify({ 
          message: 'TNF Relay Server',
          version: '1.0.0',
          ports: {
            http: this.httpPort,
            websocket: this.port
          }
        }));
      }
    });

    server.listen(this.httpPort, () => {
      console.log(`📡 HTTP server listening on port ${this.httpPort}`);
    });
  }

  startWebSocketServer() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`🔌 Client connected: ${clientId}`);
      
      this.clients.set(clientId, {
        ws: ws,
        id: clientId,
        connectedAt: Date.now(),
        type: 'unknown'
      });

      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'WELCOME',
        clientId: clientId,
        timestamp: Date.now()
      });
    });

    console.log(`🌐 WebSocket server listening on port ${this.port}`);
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📩 Message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'AGENT_REGISTER':
          this.handleAgentRegistration(clientId, message);
          break;
        case 'INJECT_MESSAGE':
          this.handleInjectMessage(clientId, message);
          break;
        case 'WEB_AI_RESPONSE':
          this.handleWebAIResponse(clientId, message);
          break;
        case 'INJECTION_STATUS':
          this.handleInjectionStatus(clientId, message);
          break;
        case 'PING':
          this.handlePing(clientId, message);
          break;
        case 'WEB_AI_STATUS':
          this.handleWebAIStatus(clientId, message);
          break;
        default:
          console.warn(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`❌ Error parsing message from ${clientId}:`, error);
    }
  }

  handleAgentRegistration(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      client.type = message.agent.type;
      client.name = message.agent.name;
      client.capabilities = message.agent.capabilities;
      
      console.log(`✅ Agent registered: ${message.agent.name} (${message.agent.type})`);
      
      this.sendToClient(clientId, {
        type: 'REGISTRATION_SUCCESS',
        timestamp: Date.now()
      });
    }
  }

  handleInjectMessage(clientId, message) {
    console.log(`💬 Inject message request: ${message.targetAI} - "${message.content.substring(0, 50)}..."`);
    
    // Find chrome extension clients
    const chromeExtensions = Array.from(this.clients.values()).filter(
      client => client.type === 'WEB_BRIDGE'
    );

    if (chromeExtensions.length > 0) {
      // Send to first available chrome extension
      const targetClient = chromeExtensions[0];
      this.sendToClient(targetClient.id, message);
      
      console.log(`📤 Message forwarded to chrome extension: ${targetClient.id}`);
    } else {
      console.warn('⚠️ No chrome extension clients available');
      
      // Send back error response
      this.sendToClient(clientId, {
        type: 'INJECTION_STATUS',
        conversationId: message.conversationId,
        success: false,
        error: 'No chrome extension available',
        timestamp: Date.now()
      });
    }
  }

  handleWebAIResponse(clientId, message) {
    console.log(`🤖 AI Response captured: ${message.source} - "${message.response.substring(0, 50)}..."`);
    
    // Broadcast to all other clients (could be MCP servers, other agents, etc.)
    this.broadcastToOthers(clientId, message);
  }

  handleInjectionStatus(clientId, message) {
    console.log(`📋 Injection status: ${message.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Broadcast to all other clients
    this.broadcastToOthers(clientId, message);
  }

  handlePing(clientId, message) {
    this.sendToClient(clientId, {
      type: 'PONG',
      timestamp: Date.now(),
      conversationId: message.conversationId
    });
  }

  handleWebAIStatus(clientId, message) {
    console.log(`📊 Web AI Status: ${message.status.aiType} - ${message.status.ready ? 'Ready' : 'Not Ready'}`);
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcastToOthers(senderClientId, message) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  broadcast(message) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      clients: this.clients.size,
      conversations: this.conversations.size,
      uptime: Date.now() - this.startTime
    };
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TNF Relay...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down TNF Relay...');
  process.exit(0);
});

// Start the relay
const relay = new SimpleTNFRelay();