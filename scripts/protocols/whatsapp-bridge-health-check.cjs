#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const args = {
    host: '127.0.0.1',
    port: 3000,
    timeoutMs: 2500,
    sessionPath: path.join(process.env.HOME || '~', '.hermes', 'whatsapp', 'session'),
    logPath: path.join(process.env.HOME || '~', '.hermes', 'whatsapp', 'bridge.log'),
    expectConnected: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--host') args.host = argv[++i] || args.host;
    else if (token === '--port') args.port = Number(argv[++i] || args.port);
    else if (token === '--timeout-ms') args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (token === '--session') args.sessionPath = argv[++i] || args.sessionPath;
    else if (token === '--log') args.logPath = argv[++i] || args.logPath;
    else if (token === '--expect-connected') args.expectConnected = true;
    else if (token === '--json') args.json = true;
    else if (token === '--help' || token === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!Number.isFinite(args.port) || args.port <= 0) {
    throw new Error(`Invalid --port value: ${args.port}`);
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error(`Invalid --timeout-ms value: ${args.timeoutMs}`);
  }

  return args;
}

function printUsage() {
  console.log([
    'Usage:',
    '  node scripts/protocols/whatsapp-bridge-health-check.cjs [options]',
    '',
    'Safe, read-only health check for the Hermes WhatsApp bridge HTTP contract.',
    '',
    'Options:',
    '  --host <host>            Bridge host (default: 127.0.0.1)',
    '  --port <port>            Bridge port (default: 3000)',
    '  --timeout-ms <ms>        HTTP timeout in ms (default: 2500)',
    '  --session <path>         Session directory to inspect',
    '  --log <path>             Bridge log file to inspect',
    '  --expect-connected       Exit non-zero unless /health reports connected',
    '  --json                   Emit machine-readable JSON only',
    '  --help, -h               Show this help',
  ].join('\n'));
}

function statPath(targetPath) {
  try {
    const st = fs.statSync(targetPath);
    return {
      exists: true,
      isDirectory: st.isDirectory(),
      size: st.size,
      mtime: st.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      isDirectory: false,
      size: 0,
      mtime: null,
    };
  }
}

function listSessionArtifacts(sessionPath) {
  try {
    if (!fs.existsSync(sessionPath)) return [];
    return fs.readdirSync(sessionPath).sort().slice(0, 50);
  } catch {
    return [];
  }
}

function tailFile(filePath, lineCount = 12, maxBytes = 64 * 1024) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const st = fs.statSync(filePath);
    const bytesToRead = Math.min(st.size, maxBytes);
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(bytesToRead);
      fs.readSync(fd, buffer, 0, bytesToRead, Math.max(0, st.size - bytesToRead));
      const content = buffer.toString('utf8');
      return content.split(/\r?\n/).filter(Boolean).slice(-lineCount);
    } finally {
      fs.closeSync(fd);
    }
  } catch (error) {
    return [`<tail unavailable: ${error.message}>`];
  }
}

function getProcessMatches() {
  try {
    const cmd = "ps aux | egrep 'whatsapp-bridge/bridge.js|gateway run' | egrep -v 'egrep'";
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!output) return [];
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function httpGetJson(host, port, pathName, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host, port, path: pathName, timeout: timeoutMs }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = raw ? JSON.parse(raw) : null;
          resolve({ statusCode: res.statusCode || 0, body: json, raw });
        } catch (error) {
          reject(new Error(`Invalid JSON from ${pathName}: ${error.message}`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const sessionStat = statPath(args.sessionPath);
  const logStat = statPath(args.logPath);
  const sessionArtifacts = listSessionArtifacts(args.sessionPath);
  const processMatches = getProcessMatches();

  let health = null;
  let httpError = null;
  try {
    health = await httpGetJson(args.host, args.port, '/health', args.timeoutMs);
  } catch (error) {
    httpError = error.message;
  }

  const status = health?.body?.status || 'unreachable';
  const queueLength = Number(health?.body?.queueLength ?? -1);
  const uptime = Number(health?.body?.uptime ?? -1);

  const checks = {
    httpReachable: Boolean(health && health.statusCode >= 200 && health.statusCode < 300),
    connected: status === 'connected',
    sessionPresent: sessionStat.exists,
    logPresent: logStat.exists,
    processPresent: processMatches.length > 0,
  };

  const ok = checks.httpReachable && (!args.expectConnected || checks.connected);
  const lifecycle =
    checks.connected ? 'connected' :
      checks.httpReachable ? 'reachable-not-connected' :
        checks.processPresent && checks.sessionPresent ? 'pairing-or-startup-pending' :
          checks.sessionPresent ? 'session-present-bridge-offline' :
            'not-configured';

  const result = {
    bridge: {
      host: args.host,
      port: args.port,
      status,
      queueLength,
      uptime,
      httpStatusCode: health?.statusCode ?? 0,
      httpError,
    },
    filesystem: {
      sessionPath: args.sessionPath,
      sessionStat,
      sessionArtifacts,
      logPath: args.logPath,
      logStat,
      logTail: tailFile(args.logPath),
    },
    runtime: {
      processMatches,
    },
    checks,
    lifecycle,
    ok,
    startedAt,
    repoRoot,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('TNF WhatsApp Bridge Health Check');
    console.log(`Repo: ${repoRoot}`);
    console.log(`Bridge: http://${args.host}:${args.port}`);
    console.log(`HTTP reachable: ${checks.httpReachable ? 'yes' : 'no'}`);
    console.log(`Connected: ${checks.connected ? 'yes' : 'no'} (status=${status})`);
    console.log(`Lifecycle: ${lifecycle}`);
    console.log(`Queue length: ${queueLength}`);
    console.log(`Uptime: ${uptime}`);
    console.log(`Session path present: ${checks.sessionPresent ? 'yes' : 'no'} (${args.sessionPath})`);
    console.log(`Bridge log present: ${checks.logPresent ? 'yes' : 'no'} (${args.logPath})`);
    console.log(`Bridge/gateway process matches: ${processMatches.length}`);
    if (httpError) console.log(`HTTP error: ${httpError}`);
    if (sessionArtifacts.length) {
      console.log('Session artifacts:');
      for (const item of sessionArtifacts) console.log(`  - ${item}`);
    }
    if (processMatches.length) {
      console.log('Process matches:');
      for (const line of processMatches) console.log(`  - ${line}`);
    }
    const logTail = tailFile(args.logPath);
    if (logTail.length) {
      console.log('Bridge log tail:');
      for (const line of logTail) console.log(`  ${line}`);
    }
    console.log(`Overall result: ${ok ? 'PASS' : 'WARN'}`);
  }

  process.exit(ok ? 0 : 1);
}

run().catch((error) => {
  console.error(`whatsapp-bridge-health-check failed: ${error.message}`);
  process.exit(1);
});
