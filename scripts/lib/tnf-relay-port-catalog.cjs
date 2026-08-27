#!/usr/bin/env node
'use strict';

/**
 * Canonical TNF relay port catalog.
 *
 * Keep this aligned with:
 *   packages/port-management  (relay-core preferred 3000, fallbacks 3010/3020/3030)
 *   apps/chrome-extension/src/v6/shared/constants.ts
 *   native-host relay start/discovery
 *
 * 3001 is the API/backend — never treat it as a relay candidate.
 * 3007 is discovery-only: live TNF often has a working WS relay there, but it is
 * catalogued as skideancer/ide so we never *start* a new relay on it.
 */

const net = require('node:net');
const http = require('node:http');

const RELAY_PREFERRED_PORT = 3000;
const RELAY_FALLBACK_PORTS = [3010, 3020, 3030];
const RELAY_DISCOVERY_ONLY_PORTS = [3007];
const RELAY_START_PORTS = [RELAY_PREFERRED_PORT, ...RELAY_FALLBACK_PORTS];
const RELAY_DISCOVERY_PORTS = [
  ...RELAY_START_PORTS,
  ...RELAY_DISCOVERY_ONLY_PORTS,
];

const RELAY_RUNTIME_CATALOG = [
  { port: 3000, service: 'relay-core', protected: false },
  { port: 3010, service: 'relay-core-alt', protected: false },
  { port: 3020, service: 'relay-core-alt', protected: false },
  { port: 3030, service: 'relay-core-alt', protected: false },
];

function uniquePorts(ports) {
  return Array.from(
    new Set(
      (ports || [])
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0 && value < 65536)
    )
  );
}

function isRelayHealthBody(body) {
  return !!(body && body.status === 'ok' && body.relay === 'running');
}

function fetchRelayHealth(port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: '/health',
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

/**
 * Raw HTTP/1.1 WebSocket upgrade. Does not depend on the `ws` package so the
 * native host, factory-boot, and run-relay.cjs can all share it.
 */
function probeRelayWebSocket(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(result);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    const key = Buffer.alloc(16, 7).toString('base64');
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.write(
        `GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    socket.setTimeout(timeoutMs);
    socket.on('data', (chunk) => {
      const head = String(chunk || '');
      finish(/^HTTP\/1\.[01] 101\b/i.test(head));
    });
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
    socket.on('close', () => finish(false));
  });
}

async function inspectRelayPort(port, timeoutMs = 1500) {
  const health = await fetchRelayHealth(port, Math.min(1200, timeoutMs));
  const httpOk = isRelayHealthBody(health);
  // Always probe WS: HTTP can be up while /ws 404s, and HTTP can be wedged
  // while the upgrade path still works.
  const websocket = await probeRelayWebSocket(port, timeoutMs);
  return {
    port,
    http: httpOk,
    websocket,
    websocketAdvertised: health?.websocket === true,
    ready: httpOk && websocket,
    health,
  };
}

async function discoverReadyRelayPorts(timeoutMs = 1500) {
  const ready = [];
  for (const port of RELAY_DISCOVERY_PORTS) {
    const info = await inspectRelayPort(port, timeoutMs);
    if (info.ready) ready.push(info);
  }
  return ready;
}

function relayWsUrlForPort(port) {
  return `ws://127.0.0.1:${Number(port)}/ws`;
}

module.exports = {
  RELAY_PREFERRED_PORT,
  RELAY_FALLBACK_PORTS,
  RELAY_DISCOVERY_ONLY_PORTS,
  RELAY_START_PORTS,
  RELAY_DISCOVERY_PORTS,
  RELAY_RUNTIME_CATALOG,
  uniquePorts,
  isRelayHealthBody,
  fetchRelayHealth,
  probeRelayWebSocket,
  inspectRelayPort,
  discoverReadyRelayPorts,
  relayWsUrlForPort,
};

if (require.main === module) {
  const command = process.argv[2] || 'help';
  const portArg = Number.parseInt(process.argv[3] || String(RELAY_PREFERRED_PORT), 10);

  (async () => {
    if (command === 'ready') {
      const info = await inspectRelayPort(portArg);
      process.stdout.write(`${JSON.stringify(info)}\n`);
      process.exit(info.ready ? 0 : 1);
    }
    if (command === 'discover') {
      const ready = await discoverReadyRelayPorts();
      process.stdout.write(
        `${JSON.stringify({
          preferred: RELAY_PREFERRED_PORT,
          startPorts: RELAY_START_PORTS,
          discoveryPorts: RELAY_DISCOVERY_PORTS,
          ready,
        })}\n`
      );
      process.exit(0);
    }
    if (command === 'candidates') {
      process.stdout.write(
        `${JSON.stringify({
          preferred: RELAY_PREFERRED_PORT,
          startPorts: RELAY_START_PORTS,
          discoveryPorts: RELAY_DISCOVERY_PORTS,
          catalog: RELAY_RUNTIME_CATALOG,
        })}\n`
      );
      process.exit(0);
    }
    process.stderr.write(
      'Usage: node tnf-relay-port-catalog.cjs <ready [port]|discover|candidates>\n'
    );
    process.exit(2);
  })().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
