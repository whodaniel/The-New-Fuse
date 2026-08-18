#!/usr/bin/env node
// scripts/test-mcp-tools.js
//
// For each stdio MCP server declared in tools/config-files/mcp_config.json:
//   1. spawn the server
//   2. send `initialize` then `tools/list` over JSON-RPC stdio
//   3. report tool count + per-tool name (anonymized)
//   4. exit non-zero if any server either crashes or returns zero tools
//
// Used by:
//   - docs/protocols/MCP-COMPLETE-GUIDE.md (boot-time tools audit)
//   - `.agent/SYSTEM_PROMPT.md` Appendix A verification
//
// Companion to scripts/mcp-health-check.js — health says "server starts",
// this script says "server exposes a useful tool surface".

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
const TOTAL_TIMEOUT_MS = 12_000;

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
    } catch {}
  }
  throw new Error(`No readable mcp_config.json found at: ${CONFIG_PATHS.join(', ')}`);
}

function jsonRpc(id, method, params) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} });
}

function probeServer(name, cfg) {
  return new Promise((resolve) => {
    const started = Date.now();
    let buf = '';
    let stdoutTail = '';
    let stderrTail = '';
    let child = null;
    let settled = false;
    let initialized = false;
    let nextId = 2;

    const finish = (status, summary, error, tools) => {
      if (settled) return;
      settled = true;
      if (child !== null) {
        try { child.kill('SIGKILL'); } catch {}
      }
      resolve({
        name,
        status,
        latency: Date.now() - started,
        summary,
        error,
        tools: tools || [],
      });
    };

    const timeoutTimer = setTimeout(
      () => finish('timeout', '', 'total budget exceeded', []),
      TOTAL_TIMEOUT_MS
    );

    try {
      child = spawn(cfg.command, cfg.args || [], {
        cwd: REPO_ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
      });
    } catch (err) {
      clearTimeout(timeoutTimer);
      finish('spawn-fail', '', String(err && err.message || err), []);
      return;
    }

    child.stderr.on('data', (chunk) => {
      stderrTail = (stderrTail + chunk.toString('utf8')).slice(-1000);
    });
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1 && msg.result && !initialized) {
            initialized = true;
            // Send tools/list immediately. Pure newline-delimited JSON,
            // per @modelcontextprotocol/sdk ReadBuffer (no frame headers).
            const req = jsonRpc(nextId++, 'tools/list', {});
            try { child.stdin.write(req + '\n'); } catch {}
          } else if (msg.result && Array.isArray(msg.result.tools)) {
            clearTimeout(timeoutTimer);
            const toolNames = msg.result.tools.map((t) => t && t.name).filter(Boolean);
            const status = toolNames.length === 0 ? 'no-tools' : 'ok';
            finish(status, `${toolNames.length} tools`, undefined, toolNames);
            return;
          } else if (msg.error) {
            clearTimeout(timeoutTimer);
            finish('rpc-error', '', JSON.stringify(msg.error), []);
            return;
          }
        } catch {
          stdoutTail = (stdoutTail + line).slice(-1000);
        }
      }
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeoutTimer);
      if (!settled) {
        const diagnostic = compactText(stderrTail || stdoutTail);
        finish(
          'exited',
          '',
          diagnostic ? `code=${code} signal=${signal}: ${diagnostic}` : `code=${code} signal=${signal}`,
          []
        );
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutTimer);
      if (!settled) finish('spawn-error', '', String(err && err.message || err), []);
    });

    // Send initialize. Pure newline-delimited JSON.
    const initReq = jsonRpc(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'tnf-mcp-tooltest', version: '1.0.0' },
    });
    setTimeout(() => {
      try {
        child.stdin.write(initReq + '\n');
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

  console.log(`MCP tool surface probe — ${entries.length} servers from ${cfgPath}`);
  console.log('-'.repeat(72));

  const results = [];
  // Run serially so we don't fork-bomb the repo with N parallel tsx invocations.
  for (const [name, cfg] of entries) {
    const r = await probeServer(name, cfg);
    results.push(r);
    const tag = r.status === 'ok' ? 'OK  '
      : r.status === 'no-tools' ? 'EMPTY'
      : 'FAIL';
    console.log(`${tag}  ${r.name.padEnd(28)} ${(r.latency + 'ms').padStart(7)}  ${r.summary}`);
    if (r.tools.length > 0) {
      // list first 6 tool names so output stays compact
      const head = r.tools.slice(0, 6).join(', ');
      const more = r.tools.length > 6 ? ` +${r.tools.length - 6} more` : '';
      console.log(`        ${head}${more}`);
    }
    if (r.error) console.log(`        error: ${r.error}`);
  }

  console.log('-'.repeat(72));
  const totalTools = results.reduce((acc, r) => acc + r.tools.length, 0);
  const healthy = results.filter((r) => r.status === 'ok').length;
  console.log(`${healthy}/${results.length} ok, ${totalTools} total tools`);
  if (results.some((r) => r.status !== 'ok')) process.exit(1);
}

main().catch((err) => {
  console.error('test-mcp-tools crashed:', err);
  process.exit(3);
});
