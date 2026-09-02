#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/harness/managed-mcp-runtime.json'), 'utf8'));

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : null;
}

function expandHome(value) {
  return value.startsWith('~/') ? path.join(os.homedir(), value.slice(2)) : value;
}

const READ_ONLY_SMOKES = {
  'apple-notes': { name: 'health-check', arguments: {} },
  exa: { name: 'web_search_exa', arguments: { query: 'official Model Context Protocol documentation', numResults: 1 } },
  browser: { name: 'browser_tabs', arguments: { action: 'list' } },
  filesystem: { name: 'list_allowed_directories', arguments: {} },
};

function probe(pkg, runtimeRoot, timeoutMs, smokeReadonly) {
  return new Promise((resolve) => {
    const command = path.join(runtimeRoot, 'bin', `tnf-mcp-${pkg.wrapper}`);
    const started = Date.now();
    const child = spawn(command, [], { cwd: ROOT, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let listedTools = [];
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.kill('SIGKILL'); } catch {}
      resolve({ wrapper: pkg.wrapper, command, latencyMs: Date.now() - started, ...result });
    };
    const timer = setTimeout(() => finish({ ok: false, error: `timeout after ${timeoutMs}ms`, stderr: stderr.trim().slice(-500) }), timeoutMs);
    child.on('error', (error) => finish({ ok: false, error: error.message }));
    child.on('exit', (code, signal) => {
      if (!settled) finish({ ok: false, error: `exited code=${code} signal=${signal}`, stderr: stderr.trim().slice(-500) });
    });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString('utf8')).slice(-2000); });
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      let newline;
      while ((newline = stdout.indexOf('\n')) >= 0) {
        const line = stdout.slice(0, newline).trim();
        stdout = stdout.slice(newline + 1);
        if (!line) continue;
        let message;
        try { message = JSON.parse(line); } catch { continue; }
        if (message.id === 1 && message.result) {
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })}\n`);
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
        } else if (message.id === 1 && message.error) {
          finish({ ok: false, error: `initialize: ${JSON.stringify(message.error)}` });
        } else if (message.id === 2 && message.result) {
          const tools = Array.isArray(message.result.tools) ? message.result.tools : [];
          listedTools = tools.map((tool) => ({ name: tool.name, inputSchema: tool.inputSchema }));
          const smoke = READ_ONLY_SMOKES[pkg.wrapper];
          if (smokeReadonly && smoke && tools.some((tool) => tool.name === smoke.name)) {
            child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: smoke })}\n`);
          } else {
            finish({ ok: tools.length > 0, server: message.result.serverInfo, toolCount: tools.length, tools: listedTools });
          }
        } else if (message.id === 2 && message.error) {
          finish({ ok: false, error: `tools/list: ${JSON.stringify(message.error)}` });
        } else if (message.id === 3 && message.result) {
          const smoke = READ_ONLY_SMOKES[pkg.wrapper];
          const isError = message.result.isError === true;
          finish({
            ok: !isError,
            toolCount: listedTools.length,
            tools: listedTools,
            smoke: { tool: smoke.name, ok: !isError, contentTypes: (message.result.content || []).map((item) => item.type) },
            ...(isError ? { error: `${smoke.name} returned isError=true` } : {}),
          });
        } else if (message.id === 3 && message.error) {
          finish({ ok: false, toolCount: listedTools.length, tools: listedTools, error: `tools/call: ${JSON.stringify(message.error)}` });
        }
      }
    });
    child.stdin.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'tnf-managed-runtime-probe', version: '1.0.0' } },
    })}\n`);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const runtimeRoot = valueAfter(argv, '--runtime-root') || expandHome(POLICY.runtimeRoot);
  const concurrent = Number(valueAfter(argv, '--concurrent') || '1');
  const timeoutMs = Number(valueAfter(argv, '--timeout-ms') || '30000');
  const smokeReadonly = argv.includes('--smoke-readonly');
  const rounds = [];
  for (let round = 0; round < concurrent; round += 1) rounds.push(...POLICY.packages.map((pkg) => probe(pkg, runtimeRoot, timeoutMs, smokeReadonly)));
  const results = await Promise.all(rounds);
  const failed = results.filter((result) => !result.ok);
  const payload = { ok: failed.length === 0, at: new Date().toISOString(), runtimeRoot, concurrent, smokeReadonly, results };
  if (argv.includes('--json')) console.log(JSON.stringify(payload, null, 2));
  else {
    for (const result of results) console.log(`${result.ok ? 'OK' : 'FAIL'}: ${result.wrapper} — ${result.toolCount || 0} tools in ${result.latencyMs}ms${result.error ? ` (${result.error})` : ''}`);
  }
  process.exitCode = payload.ok ? 0 : 1;
}

main().catch((error) => { console.error(`mcp-runtime-live-probe: ${error.message}`); process.exitCode = 1; });
