#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);

function readArg(name, fallback) {
  const exact = args.indexOf(`--${name}`);
  if (exact !== -1) {
    const next = args[exact + 1];
    if (!next) throw new Error(`Missing value for --${name}`);
    return next;
  }
  const prefixed = args.find((arg) => arg.startsWith(`--${name}=`));
  return prefixed ? prefixed.slice(name.length + 3) : fallback;
}

const mode = readArg('mode', 'staged');
const profile = readArg('profile', 'production');
const timeoutMs = Number.parseInt(readArg('timeout-ms', '30000'), 10);
const fileList = readArg('file-list', process.env.PRIVACY_GUARD_FILE_LIST || '');
const json = args.includes('--json');

const validModes = new Set(['staged', 'pre-push', 'repo']);
const validProfiles = new Set(['production']);

if (!validModes.has(mode)) {
  throw new Error(`Unsupported --mode=${mode}. Use staged, pre-push, or repo.`);
}
if (!validProfiles.has(profile)) {
  throw new Error(`Unsupported --profile=${profile}. Use production.`);
}
if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
  throw new Error('--timeout-ms must be an integer between 1000 and 300000');
}

const checks = [
  {
    name: 'privacy_guard',
    command: ['node', 'scripts/security/privacy-guard.cjs', `--mode=${mode}`],
  },
  {
    name: 'secret_sweep',
    command: ['node', 'scripts/security/secret-sweep.cjs', `--mode=${mode}`],
  },
  {
    name: 'docs_pii_guard',
    command: ['node', 'scripts/security/docs-pii-guard.cjs', `--mode=${mode}`],
  },
];

const results = checks.map((check) => {
  const [cmd, ...cmdArgs] = check.command;
  const result = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
    env: {
      ...process.env,
      TNF_AGENT_PII_PROFILE: profile,
      ...(fileList ? { PRIVACY_GUARD_FILE_LIST: fileList } : {}),
    },
  });
  return {
    name: check.name,
    command: check.command.join(' '),
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status,
    signal: result.signal || null,
    error: result.error ? result.error.message : null,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
  };
});

const failed = results.filter((result) => result.status !== 'pass');
const payload = {
  ok: failed.length === 0,
  profile,
  mode,
  timeoutMs,
  fileList: fileList || null,
  generatedAt: new Date().toISOString(),
  checks: results,
};

if (json) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`[agent-pii-gate] profile=${profile} mode=${mode}`);
  for (const result of results) {
    console.log(`- ${result.name}: ${result.status}`);
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
  }
  console.log(`[agent-pii-gate] ${payload.ok ? 'OK' : 'BLOCKED'}`);
}

if (!payload.ok) {
  process.exit(1);
}
