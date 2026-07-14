#!/usr/bin/env node
// scripts/mcp-health-check.js
//
// Live health probe for every stdio MCP server declared in
// tools/config-files/mcp_config.json. Forks each one, sends a real
// `initialize` JSON-RPC request over stdio, returns status + latency,
// and exits non-zero if any server is unhealthy.
//
// Used by:
//   - docs/protocols/MCP-COMPLETE-GUIDE.md (boot verification)
//   - .agent/SYSTEM_PROMPT.md Appendix A (axiom A1 live-check)
//
// Returns: exit 0 if all servers reachable. exit 1 if any failed.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATHS = [
  resolve(REPO_ROOT, 'tools/config-files/mcp_config.json'),
  resolve(REPO_ROOT, 'tools/config-files/enhanced_mcp_config.json'),
];
const START_TIMEOUT_MS = 8000;
const INIT_TIMEOUT_MS = 5000;

function compactText(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function loadConfig() {
  for (const p of CONFIG_PATHS) {
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8'));
      return { path: p, servers: raw.mcpServers || {} };
    } catch (e) {
      // try next
    }
  }
  throw new Error(`No readable mcp_config.json found at: ${CONFIG_PATHS.join(', ')}`);
}

function probeOne(name, cfg) {
  return new Promise((resolve) => {
    const started = Date.now();
    let buf = '';
    let stdoutTail = '';
    let stderrTail = '';
    let child = null;
    let resolved = false;

    const finish = (status, latency, summary, error) => {
      if (resolved) return;
      resolved = true;
      if (child !== null) {
        try { child.kill('SIGKILL'); } catch {}
      }
      resolve({ name, status, latency, summary, error });
    };

    try {
      child = spawn(cfg.command, cfg.args || [], {
        cwd: REPO_ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });
    } catch (err) {
      finish('spawn-fail', 0, '', String(err && err.message || err));
      return;
    }

    const killTimer = setTimeout(
      () => finish('timeout', Date.now() - started, '', 'start or init exceeded budget'),
      START_TIMEOUT_MS + INIT_TIMEOUT_MS
    );

    child.stderr.on('data', (chunk) => {
      stderrTail = (stderrTail + chunk.toString('utf8')).slice(-1000);
    });
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      // Each JSON-RPC response is newline-delimited.
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1 && msg.result) {
            clearTimeout(killTimer);
            const sv = msg.result.serverInfo || {};
            finish(
              'ok',
              Date.now() - started,
              `${sv.name || ''} ${sv.version || ''}`.trim(),
              undefined
            );
            return;
          }
          if (msg.id === 1 && msg.error) {
            clearTimeout(killTimer);
            finish('init-error', Date.now() - started, '', JSON.stringify(msg.error));
            return;
          }
        } catch {
          stdoutTail = (stdoutTail + line).slice(-1000);
        }
      }
    });

    child.on('exit', (code, signal) => {
      clearTimeout(killTimer);
      if (!resolved) {
        const diagnostic = compactText(stderrTail || stdoutTail);
        finish(
          'exited',
          Date.now() - started,
          '',
          diagnostic ? `code=${code} signal=${signal}: ${diagnostic}` : `code=${code} signal=${signal}`
        );
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      finish('spawn-error', Date.now() - started, '', String(err && err.message || err));
    });

    // Send initialize request. Modern MCP stdio transport uses pure
    // newline-delimited JSON (verified against @modelcontextprotocol/sdk
    // dist/esm/shared/stdio.js ReadBuffer — line-by-line JSON.parse).
    // No Content-Length framing. Trailing newline is mandatory.
    const req = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'tnf-mcp-healthcheck', version: '1.0.0' },
      },
    });
    setTimeout(() => {
      try {
        child.stdin.write(req + '\n');
      } catch {}
    }, 200);
  });
}

async function main() {
  const { path: cfgPath, servers } = loadConfig();
  const entries = Object.entries(servers);
  if (entries.length === 0) {
    console.error(`No stdio MCP servers found in ${cfgPath}`);
    process.exit(2);
  }

  console.log(`MCP health probe — ${entries.length} servers from ${cfgPath}`);
  console.log('-'.repeat(72));

  const results = [];
  // Run serially so tsx/pnpm startup cost cannot turn the probe itself into
  // a fork storm that hides otherwise healthy MCP servers.
  for (const [name, cfg] of entries) {
    results.push(await probeOne(name, cfg));
  }

  let badCount = 0;
  for (const r of results) {
    const tag = r.status === 'ok' ? 'OK  ' : 'FAIL';
    const lat = r.latency ? `${r.latency}ms`.padStart(7) : '     -';
    const sum = (r.summary || '').padEnd(28);
    console.log(`${tag}  ${r.name.padEnd(28)} ${lat}  ${sum}  ${r.error || ''}`);
    if (r.status !== 'ok') badCount++;
  }

  console.log('-'.repeat(72));
  console.log(`${results.length - badCount}/${results.length} healthy`);

  if (badCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error('health-check crashed:', err);
  process.exit(3);
});
