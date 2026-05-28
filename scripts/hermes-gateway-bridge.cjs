#!/usr/bin/env node
/**
 * Hermes-TNF Gateway Bridge v2 - Redis Pub/Sub Federation
 *
 * v1 tried ws://localhost:7788 which does not exist (Hermes is polling).
 * v2 uses Redis pub/sub as the real federation bus.
 */

const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.env.BRIDGE_CONFIG || path.join(process.env.HOME, '.tnf', 'gateway-bridge.json');

let config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:***@]*/g, '//***@');
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        bridge: {
          redisUrl: safeUrl,
          tnfWsUrl: config.tnfWsUrl,
          redisConnected: bridge.redisPub && bridge.redisPub.isReady,
          tnfWsConnected: bridge.tnfWs && bridge.tnfWs.readyState === WebSocket.OPEN,
          channels: config.channels.subscribe
        },
        stats: bridge.stats,
        timestamp: new Date().toISOString()
      }));
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
    try { await connectTNF(); } catch (e) {
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
