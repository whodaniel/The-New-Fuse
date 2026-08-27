#!/usr/bin/env node

/**
 * TNF Port Reaper
 *
 * Automates the "is my port occupied by a dead/stale process, or a live healthy
 * one?" decision that services previously had to answer manually (see
 * `scripts/tnf-ports.cjs conflicts/clear`, which is opt-in and human-driven).
 *
 * Usage (at the top of any service start script):
 *
 *   const { ensurePortReady } = require('../../scripts/lib/tnf-port-reaper.cjs');
 *   const result = await ensurePortReady({
 *     port: 3000,
 *     healthUrl: 'http://127.0.0.1:3000/health',
 *     isHealthy: (body) => body.status === 'ok' && body.relay === 'running',
 *     probeReady: async () => true, // optional second opinion (e.g. WebSocket handshake)
 *   });
 *   if (result.state === 'already-running') process.exit(0);
 *   // result.state === 'clear' -> safe to bind the port and start the service
 *
 * Behavior:
 *   - Port free                         -> { state: 'clear' }
 *   - Port occupied, health check OK    -> { state: 'already-running', pids }
 *   - Port occupied, health check fails -> reap (SIGTERM, then SIGKILL after
 *     grace period) and return { state: 'clear', reaped: pids }
 *   - Port occupied, reap failed        -> { state: 'blocked', pids }
 *
 * No health check configured means "occupied" is always treated as stale
 * (there's nothing else to go on), so it will be reaped.
 */

'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');

function runCapture(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function pidsOnPort(port) {
  const lsofPids = runCapture('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'])
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .filter(Number.isInteger);
  if (lsofPids.length > 0) return Array.from(new Set(lsofPids));

  const ssOutput = runCapture('ss', ['-ltnp', `sport = :${port}`]);
  const pids = new Set();
  for (const match of ssOutput.matchAll(/pid=(\d+)/g)) {
    pids.add(Number.parseInt(match[1], 10));
  }
  return Array.from(pids);
}

function getPidCommand(pid) {
  return runCapture('ps', ['-p', String(pid), '-o', 'comm=']).trim() || 'unknown';
}

function fetchJson(url, timeoutMs) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
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
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

async function checkHealth({ healthUrl, isHealthy, timeoutMs = 2000 }) {
  if (!healthUrl) return false;
  const body = await fetchJson(healthUrl, timeoutMs);
  if (!body) return false;
  if (typeof isHealthy === 'function') {
    try {
      return !!isHealthy(body);
    } catch {
      return false;
    }
  }
  return body.status === 'ok' || body.health === 'ok' || body.healthy === true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reapPid(pid, { graceMs = 3000, pollMs = 300 } = {}) {
  spawnSync('kill', ['-TERM', String(pid)], { stdio: 'ignore' });
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    try {
      process.kill(pid, 0); // still alive
    } catch {
      return true; // exited
    }
  }
  spawnSync('kill', ['-KILL', String(pid)], { stdio: 'ignore' });
  await sleep(pollMs);
  try {
    process.kill(pid, 0);
    return false; // survived SIGKILL somehow
  } catch {
    return true;
  }
}

/**
 * @param {object} options
 * @param {number} options.port
 * @param {string} [options.healthUrl] - if omitted, any occupant is treated as stale
 * @param {(body: any) => boolean} [options.isHealthy] - custom health predicate
 * @param {() => boolean|Promise<boolean>} [options.probeReady] - extra readiness
 *   check after HTTP health (e.g. WebSocket handshake). If it returns false the
 *   occupant is treated as stale and reaped.
 * @param {number} [options.timeoutMs]
 * @param {number} [options.graceMs] - time to wait after SIGTERM before SIGKILL
 * @param {(message: string) => void} [options.log]
 * @returns {Promise<{state: 'clear'|'already-running'|'blocked', pids: number[], reaped?: number[]}>}
 */
async function ensurePortReady(options) {
  const { port, timeoutMs = 2000, graceMs = 3000 } = options;
  const log = options.log || (() => {});

  const occupants = pidsOnPort(port);
  if (occupants.length === 0) {
    return { state: 'clear', pids: [] };
  }

  let healthy = await checkHealth({ ...options, timeoutMs });
  if (typeof options.probeReady === 'function') {
    let probed = false;
    try {
      probed = !!(await options.probeReady({ port, pids: occupants, httpHealthy: healthy }));
    } catch {
      probed = false;
    }
    if (healthy && !probed) {
      log(
        `[port-reaper] Port ${port} answered HTTP health but failed its readiness probe. Treating occupant as stale.`
      );
    } else if (!healthy && probed) {
      log(
        `[port-reaper] Port ${port} failed HTTP health but passed its readiness probe. Leaving occupant running.`
      );
    }
    healthy = probed;
  }
  if (healthy) {
    log(
      `[port-reaper] Port ${port} is occupied by a healthy service (pid ${occupants.join(', ')}). Leaving it running.`
    );
    return { state: 'already-running', pids: occupants };
  }

  log(
    `[port-reaper] Port ${port} is occupied by pid(s) ${occupants
      .map((pid) => `${pid}:${getPidCommand(pid)}`)
      .join(', ')} but failed its health check. Reaping stale process(es)...`
  );

  const reaped = [];
  for (const pid of occupants) {
    const ok = await reapPid(pid, { graceMs });
    if (ok) reaped.push(pid);
  }

  const stillOccupied = pidsOnPort(port);
  if (stillOccupied.length > 0) {
    log(`[port-reaper] Port ${port} still occupied by pid(s) ${stillOccupied.join(', ')} after reap attempt.`);
    return { state: 'blocked', pids: stillOccupied };
  }

  log(`[port-reaper] Port ${port} cleared (reaped pid(s) ${reaped.join(', ') || 'none'}).`);
  return { state: 'clear', pids: [], reaped };
}

module.exports = { ensurePortReady, pidsOnPort, getPidCommand };
