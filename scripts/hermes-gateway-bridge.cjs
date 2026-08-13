#!/usr/bin/env node
/**
 * Hermes-TNF Gateway Bridge v2 - Redis Pub/Sub Federation
 *
 * Bridges Hermes Agent and TNF via Redis pub/sub channels.
 * Health endpoint: http://localhost:4000/health
 */

const http = require('http');
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.env.BRIDGE_CONFIG || path.join(process.env.HOME, '.tnf', 'gateway-bridge.json');

let config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  tnfWsUrl: process.env.TNF_WS_URL || 'ws://localhost:3000',
  bridgePort: parseInt(process.env.BRIDGE_PORT || '4000', 10),
  channels: {
    ingress: 'tnf:bus:ingress',
    egressPrefix: 'tnf:bus:egress',
    heartbeat: 'tnf:heartbeat',
    synaptic: 'tnf:synaptic_bus',
    registry: 'tnf:agent-registry'
  }
};

let redisPub = null;
let redisSub = null;
let tnfWs = null;

let stats = {
  messagesPublished: 0,
  messagesReceived: 0,
  errors: 0,
  startTime: 0
};

function log(level, message) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level.toUpperCase()}] ${message}`);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const loaded = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...loaded };
      log('info', 'Loaded config from ' + CONFIG_PATH);
    }
  } catch (err) {
    log('warn', 'Config load failed: ' + err.message + ', using defaults');
  }
}

async function connectRedis() {
  return new Promise((resolve, reject) => {
    redisPub = createClient({ url: config.redisUrl });
    redisSub = createClient({ url: config.redisUrl });
    
    redisPub.on('error', err => log('error', 'Redis pub error: ' + err.message));
    redisSub.on('error', err => log('error', 'Redis sub error: ' + err.message));
    
    let connected = 0;
    const onConnect = () => {
      connected++;
      if (connected === 2) {
        log('info', 'Redis connected (pub + sub)');
        resolve();
      }
    };
    
    redisPub.once('connect', onConnect);
    redisSub.once('connect', onConnect);
    redisSub.once('connect', async () => {
      await redisSub.subscribe(config.channels.ingress, (msg) => {
        stats.messagesReceived++;
        log('debug', 'Ingress message received');
        // Forward to TNF WS if connected
        if (tnfWs && tnfWs.readyState === 1) {
          tnfWs.send(msg);
        }
      });
      await redisSub.subscribe(config.channels.synaptic, (msg) => {
        stats.messagesReceived++;
        log('debug', 'Synaptic bus message received');
      });
    });
    
    redisPub.connect().catch(reject);
    redisSub.connect().catch(reject);
    
    setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
  });
}

function connectTNF() {
  return new Promise((resolve, reject) => {
    tnfWs = new (require('ws'))(config.tnfWsUrl);
    tnfWs.on('open', () => {
      log('info', 'TNF WebSocket connected');
      resolve();
    });
    tnfWs.on('error', err => reject(err));
    tnfWs.on('message', (data) => {
      stats.messagesPublished++;
      redisPub.publish(config.channels.egressPrefix, data.toString()).catch(err => {
        log('error', 'Failed to publish to egress: ' + err.message);
        stats.errors++;
      });
    });
    tnfWs.on('close', () => {
      log('warn', 'TNF WebSocket disconnected');
      tnfWs = null;
    });
    
    setTimeout(() => reject(new Error('TNF WS connection timeout')), 10000);
  });
}

function attemptWsReconnect() {
  setTimeout(async () => {
    try {
      await connectTNF();
    } catch (e) {
      attemptWsReconnect();
    }
  }, 5000);
}

function startHealthServer() {
  const server = http.createServer((req, res) => {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    
    if (req.url === '/health' || req.url === '/health/') {
      const safeUrl = config.redisUrl.replace(/\/\/[^@]+@/g, '//***@');
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        bridge: {
          redisUrl: safeUrl,
          tnfWsUrl: config.tnfWsUrl,
          redisConnected: redisSub && redisSub.isReady && redisPub && redisPub.isReady,
          tnfWsConnected: tnfWs && tnfWs.readyState === 1,
          channels: config.channels.subscribe || config.channels
        },
        stats: stats,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });
  
  server.listen(config.bridgePort, () => {
    log('info', 'Health server on port ' + config.bridgePort);
  });
}

async function start() {
  loadConfig();
  log('info', 'Starting Hermes-TNF Gateway Bridge v2 (Redis Pub/Sub)...');
  log('info', 'Redis: ' + config.redisUrl.replace(/\/\/[^@]+@/g, '//***@'));
  log('info', 'TNF WS: ' + config.tnfWsUrl);
  stats.startTime = Date.now();
  
  try {
    await connectRedis();
    try { 
      await connectTNF(); 
    } catch (e) {
      log('warn', 'TNF WS unavailable: ' + e.message + '. Redis-only mode.');
      attemptWsReconnect();
    }
    startHealthServer();
    log('info', 'Bridge v2 started! Redis pub/sub federation active.');
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (err) {
    log('error', 'Failed to start: ' + err.message);
    process.exit(1);
  }
}

async function stop() {
  log('info', 'Shutting down bridge v2...');
  if (redisSub) await redisSub.quit().catch(() => {});
  if (redisPub) await redisPub.quit().catch(() => {});
  if (tnfWs) tnfWs.close();
  log('info', 'Bridge stopped');
  process.exit(0);
}

start();