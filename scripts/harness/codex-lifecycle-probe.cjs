#!/usr/bin/env node
'use strict';
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const path = require('node:path');

async function probe(cwd = process.cwd()) {
  const child = spawn('codex', ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  let id = 0;
  const lines = readline.createInterface({ input: child.stdout });
  const fail = (error) => {
    for (const p of pending.values()) p.reject(error);
    pending.clear();
  };
  child.on('error', fail);
  child.on('exit', () => fail(new Error('Codex app-server exited before discovery completed')));
  child.stderr.resume();
  lines.on('line', (line) => {
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      return;
    }
    const p = pending.get(value.id);
    if (!p) return;
    pending.delete(value.id);
    value.error ? p.reject(new Error(JSON.stringify(value.error))) : p.resolve(value.result);
  });
  function rpc(method, params) {
    const key = ++id;
    return new Promise((resolve, reject) => {
      pending.set(key, { resolve, reject });
      child.stdin.write(JSON.stringify({ id: key, method, params }) + '\n');
    });
  }
  const timer = setTimeout(() => {
    fail(new Error('Codex discovery timeout'));
    child.kill();
  }, 30000);
  try {
    const host = await rpc('initialize', {
      clientInfo: { name: 'tnf-codex-discovery', version: '1.0' },
      capabilities: { experimentalApi: true },
    });
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    const [skills, hooks] = await Promise.all([
      rpc('skills/list', { cwds: [cwd], forceReload: true }),
      rpc('hooks/list', { cwds: [cwd] }),
    ]);
    const tnf = skills.data.flatMap((e) => e.skills).filter((s) => s.name === 'tnf');
    const lifecycle = hooks.data
      .flatMap((e) => e.hooks)
      .filter((h) => h.statusMessage === 'TNF Codex lifecycle');
    const expected = ['sessionStart', 'userPromptSubmit', 'postCompact', 'stop'];
    const errors = [...skills.data, ...hooks.data].flatMap((e) => e.errors || []);
    const commandDiscovery = tnf.length === 1 && tnf[0].enabled;
    const hookDiscovery = expected.every((name) =>
      lifecycle.some((h) => h.eventName === name && h.enabled)
    );
    const hookTrust =
      hookDiscovery && lifecycle.every((h) => ['trusted', 'managed'].includes(h.trustStatus));
    return {
      ok: commandDiscovery && hookDiscovery && hookTrust && !errors.length,
      host: host.userAgent,
      cwd: path.resolve(cwd),
      commandDiscovery,
      hookDiscovery,
      hookTrust,
      nativeInvocation: '$tnf or /skills',
      bareSlashCommands: false,
      runtimeExecution: 'Verify session and turn receipts separately; discovery is not execution.',
      skills: tnf,
      hooks: lifecycle,
      errors,
    };
  } finally {
    clearTimeout(timer);
    lines.close();
    child.kill();
  }
}
if (require.main === module)
  probe(process.argv[2])
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.ok ? 0 : 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
module.exports = { probe };
