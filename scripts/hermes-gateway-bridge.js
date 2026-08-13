#!/usr/bin/env node
/**
 * Hermes-TNF Gateway Bridge
 * Bridges Hermes WebSocket gateway (ws://localhost:7788) to TNF relay (ws://localhost:3000)
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load configuration
const CONFIG_PATH = process.env.BRIDGE_CONFIG || path.join(process.env.HOME || process.env.USERPROFILE, '.tnf', 'gateway-bridge.json');

let config = {
  hermesWsUrl: 'ws://localhost:7788',
  tnfWsUrl: 'ws://localhost:3000',
  bridgePort: 4000,
  autoStart: true,
  logLevel: 'info'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = { ...config, ...JSON.parse(data) };
      console.log(`[BRIDGE] Loaded config from ${CONFIG_PATH}`);
    }
  } catch (error) {
    console.log(`[BRIDGE] Using default config: ${error.message}`);
  }
}

function log(level, message) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(config.logLevel);
  const messageLevel = levels.indexOf(level);
  
  if (messageLevel >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

class HermesTNFBridge {
  constructor() {
    this.hermesWs = null;
    this.tnfWs = null;
    this.bridgeServer = null;
    this.reconnectAttempts = { hermes: 0, tnf: 0 };
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  async connectToHermes() {
    return new Promise((resolve, reject) => {
      log('info', `Connecting to Hermes at ${config.hermesWsUrl}...`);
      
      this.hermesWs = new WebSocket(config.hermesWsUrl);
      
      this.hermesWs.on('open', () => {
        log('info', 'Connected to Hermes gateway');
        this.reconnectAttempts.hermes = 0;
        resolve();
      });
      
      this.hermesWs.on('message', (data) => {
        log('debug', `Hermes -> TNF: ${data.toString().substring(0, 200)}`);
        if (this.tnfWs && this.tnfWs.readyState === WebSocket.OPEN) {
          this.tnfWs.send(data);
        } else {
          log('warn', 'TNF relay not connected, dropping message from Hermes');
        }
      });
      
      this.hermesWs.on('close', () => {
        log('warn', 'Disconnected from Hermes gateway');
        this.hermesWs = null;
        this.attemptReconnect('hermes', resolve, reject);
      });
      
      this.hermesWs.on('error', (error) => {
        log('error', `Hermes WebSocket error: ${error.message}`);
        reject(error);
      });
    });
  }

  async connectToTNF() {
    return new Promise((resolve, reject) => {
      log('info', `Connecting to TNF relay at ${config.tnfWsUrl}...`);
      
      this.tnfWs = new WebSocket(config.tnfWsUrl);
      
      this.tnfWs.on('open', () => {
        log('info', 'Connected to TNF relay');
        this.reconnectAttempts.tnf = 0;
        
        // Register with TNF relay
        this.tnfWs.send(JSON.stringify({
          type: 'REGISTER',
          payload: {
            type: 'gateway_bridge',
            capabilities: ['hermes_forwarding', 'tnf_forwarding']
          }
        }));
        
        resolve();
      });
      
      this.tnfWs.on('message', (data) => {
        log('debug', `TNF -> Hermes: ${data.toString().substring(0, 200)}`);
        if (this.hermesWs && this.hermesWs.readyState === WebSocket.OPEN) {
          this.hermesWs.send(data);
        } else {
          log('warn', 'Hermes gateway not connected, dropping message from TNF');
        }
      });
      
      this.tnfWs.on('close', () => {
        log('warn', 'Disconnected from TNF relay');
        this.tnfWs = null;
        this.attemptReconnect('tnf', resolve, reject);
      });
      
      this.tnfWs.on('error', (error) => {
        log('error', `TNF WebSocket error: ${error.message}`);
        reject(error);
      });
    });
  }

  attemptReconnect(service, resolve, reject) {
    if (this.reconnectAttempts[service] >= this.maxReconnectAttempts) {
      log('error', `Max reconnection attempts reached for ${service}`);
      if (service === 'hermes' && !resolve) {
        reject(new Error(`Failed to reconnect to ${service}`));
      }
      return;
    }

    this.reconnectAttempts[service]++;
    log('info', `Attempting to reconnect to ${service} (attempt ${this.reconnectAttempts[service]}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (service === 'hermes') {
        this.connectToHermes()
          .then(() => {
            if (resolve) resolve();
          })
          .catch((error) => {
            if (reject) reject(error);
          });
      } else {
        this.connectToTNF()
          .then(() => {
            if (resolve) resolve();
          })
          .catch((error) => {
            if (reject) reject(error);
          });
      }
    }, this.reconnectDelay);
  }

  startBridgeServer() {
    return new Promise((resolve) => {
      // Simple HTTP server for health checks and status
      this.bridgeServer = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'healthy',
            hermesConnected: this.hermesWs && this.hermesWs.readyState === WebSocket.OPEN,
            tnfConnected: this.tnfWs && this.tnfWs.readyState === WebSocket.OPEN,
            timestamp: new Date().toISOString()
          }));
        } else if (req.url === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            bridge: {
              hermesUrl: config.hermesWsUrl,
              tnfUrl: config.tnfWsUrl,
              hermesConnected: this.hermesWs && this.hermesWs.readyState === WebSocket.OPEN,
              tnfConnected: this.tnfWs && this.tnfWs.readyState === WebSocket.OPEN,
              reconnectAttempts: this.reconnectAttempts
            },
            config: config,
            timestamp: new Date().toISOString()
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.bridgeServer.listen(config.bridgePort, () => {
        log('info', `Bridge health server listening on port ${config.bridgePort}`);
        log('info', `Health check: http://localhost:${config.bridgePort}/health`);
        log('info', `Status: http://localhost:${config.bridgePort}/status`);
        resolve();
      });
    });
  }

  async start() {
    loadConfig();
    
    log('info', 'Starting Hermes-TNF Gateway Bridge...');
    log('info', `Hermes URL: ${config.hermesWsUrl}`);
    log('info', `TNF URL: ${config.tnfWsUrl}`);
    
    try {
      await this.connectToHermes();
      await this.connectToTNF();
      await this.startBridgeServer();
      
      log('info', 'Bridge started successfully!');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
      
    } catch (error) {
      log('error', `Failed to start bridge: ${error.message}`);
      process.exit(1);
    }
  }

  stop() {
    log('info', 'Shutting down bridge...');
    
    if (this.hermesWs) {
      this.hermesWs.close();
    }
    if (this.tnfWs) {
      this.tnfWs.close();
    }
    if (this.bridgeServer) {
      this.bridgeServer.close();
    }
    
    log('info', 'Bridge stopped');
    process.exit(0);
  }
}

// Run the bridge
const bridge = new HermesTNFBridge();
bridge.start();
