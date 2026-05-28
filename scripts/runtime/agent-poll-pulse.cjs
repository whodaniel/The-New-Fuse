#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'tnf-agent-poll-pulse', staleMs: 300000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}


const execAsync = promisify(exec);

function parseNumber(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseArgs(argv) {
  const args = {
    job: '',
    command: '',
    commandB64: '',
    stateRoot: process.env.TNF_POLL_STATE_ROOT || path.join(os.homedir(), '.tnf', 'poll-jobs'),
    baseBackoffSec: parseNumber(process.env.TNF_POLL_BASE_BACKOFF_SEC, 30),
    maxBackoffSec: parseNumber(process.env.TNF_POLL_MAX_BACKOFF_SEC, 1800),
    jitterSec: parseNumber(process.env.TNF_POLL_JITTER_SEC, 5),
    lockStaleSec: parseNumber(process.env.TNF_POLL_LOCK_STALE_SEC, 300),
    timeoutSec: parseNumber(process.env.TNF_POLL_TIMEOUT_SEC, 900),
    force: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--job' && argv[i + 1]) {
      args.job = argv[++i];
    } else if (arg === '--command' && argv[i + 1]) {
      args.command = argv[++i];
    } else if (arg === '--command-b64' && argv[i + 1]) {
      args.commandB64 = argv[++i];
    } else if (arg === '--state-root' && argv[i + 1]) {
      args.stateRoot = argv[++i];
    } else if (arg === '--base-backoff-sec' && argv[i + 1]) {
      args.baseBackoffSec = parseNumber(argv[++i], args.baseBackoffSec);
    } else if (arg === '--max-backoff-sec' && argv[i + 1]) {
      args.maxBackoffSec = parseNumber(argv[++i], args.maxBackoffSec);
    } else if (arg === '--jitter-sec' && argv[i + 1]) {
      args.jitterSec = parseNumber(argv[++i], args.jitterSec);
    } else if (arg === '--lock-stale-sec' && argv[i + 1]) {
      args.lockStaleSec = parseNumber(argv[++i], args.lockStaleSec);
    } else if (arg === '--timeout-sec' && argv[i + 1]) {
      args.timeoutSec = parseNumber(argv[++i], args.timeoutSec);
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (args.commandB64 && !args.command) {
    try {
      args.command = Buffer.from(args.commandB64, 'base64').toString('utf8');
    } catch {
      throw new Error('Invalid --command-b64 payload');
    }
  }

  if (!args.job) {
    throw new Error('--job is required');
  }
  if (!args.command) {
    throw new Error('--command or --command-b64 is required');
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/runtime/agent-poll-pulse.cjs --job <name> --command <shell command> [options]

Options:
  --command-b64 <base64>     Base64 encoded command (preferred for cron)
  --state-root <dir>         State root (default: ~/.tnf/poll-jobs)
  --base-backoff-sec <sec>   Base backoff on failure (default: 30)
  --max-backoff-sec <sec>    Max backoff cap (default: 1800)
  --jitter-sec <sec>         Random delay before run (default: 5)
  --lock-stale-sec <sec>     Lock stale threshold (default: 300)
  --timeout-sec <sec>        Command timeout (default: 900)
  --force                    Ignore backoff window once
  --dry-run                  Do not execute command
`);
}

function sanitizeJobName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function nowIso() {
  return new Date().toISOString();
}

function hashCommand(command) {
  return crypto.createHash('sha256').update(String(command)).digest('hex').slice(0, 16);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function appendJsonl(filePath, payload) {
  await fsp.appendFile(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function acquireLock(lockPath, lockStaleMs) {
  try {
    fs.mkdirSync(lockPath);
    fs.writeFileSync(
      path.join(lockPath, 'owner.json'),
      JSON.stringify({ pid: process.pid, startedAt: nowIso() }, null, 2)
    );
    return { acquired: true, recovered: false };
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }

    try {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > lockStaleMs) {
        fs.rmSync(lockPath, { recursive: true, force: true });
        fs.mkdirSync(lockPath);
        fs.writeFileSync(
          path.join(lockPath, 'owner.json'),
          JSON.stringify({ pid: process.pid, startedAt: nowIso(), recovered: true }, null, 2)
        );
        return { acquired: true, recovered: true };
      }
    } catch {
      return { acquired: false, recovered: false };
    }

    return { acquired: false, recovered: false };
  }
}

function releaseLock(lockPath) {
  try {
    fs.rmSync(lockPath, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

function computeBackoffSeconds(failures, baseBackoffSec, maxBackoffSec) {
  const cappedFailures = Math.max(1, Number(failures || 1));
  const delay = baseBackoffSec * Math.pow(2, cappedFailures - 1);
  return Math.max(baseBackoffSec, Math.min(maxBackoffSec, Math.round(delay)));
}

async function runCommand(command, timeoutSec) {
  const started = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command, {
      shell: '/bin/bash',
      timeout: Math.max(1, timeoutSec) * 1000,
      maxBuffer: 16 * 1024 * 1024,
    });
    return {
      ok: true,
      exitCode: 0,
      stdout: String(stdout || ''),
      stderr: String(stderr || ''),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      signal: error.signal || null,
      timedOut: Boolean(error.killed && error.signal === 'SIGTERM'),
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || ''),
      error: String(error.message || error),
      durationMs: Date.now() - started,
    };
  }
}

function tail(value, size = 2000) {
  const text = String(value || '');
  return text.length > size ? text.slice(-size) : text;
}

async function main() {
  const args = parseArgs(process.argv);
  const job = sanitizeJobName(args.job);
  if (!job) {
    throw new Error('Invalid job name after sanitization');
  }

  const stateDir = path.join(path.resolve(args.stateRoot), job);
  const stateFile = path.join(stateDir, 'state.json');
  const heartbeatFile = path.join(stateDir, 'heartbeat.json');
  const historyFile = path.join(stateDir, 'history.jsonl');
  const lockPath = path.join(stateDir, 'pulse.lock');
  const lockStaleMs = Math.max(30, args.lockStaleSec) * 1000;

  await fsp.mkdir(stateDir, { recursive: true });

  const lock = acquireLock(lockPath, lockStaleMs);
  if (!lock.acquired) {
    const payload = {
      timestamp: nowIso(),
      job,
      status: 'skipped_locked',
      reason: 'Another pulse is in progress.',
      pid: process.pid,
    };
    await fsp.writeFile(heartbeatFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
    return;
  }

  try {
    const state = await readJson(stateFile, {
      job,
      failures: 0,
      lastStatus: 'never',
      lastRunAt: null,
      lastSuccessAt: null,
      nextAllowedAtMs: 0,
      commandHash: hashCommand(args.command),
    });

    if (!args.force && Date.now() < Number(state.nextAllowedAtMs || 0)) {
      const payload = {
        timestamp: nowIso(),
        job,
        status: 'skipped_backoff',
        failures: Number(state.failures || 0),
        nextAllowedAt: new Date(Number(state.nextAllowedAtMs)).toISOString(),
      };
      await fsp.writeFile(heartbeatFile, JSON.stringify(payload, null, 2), 'utf8');
      await appendJsonl(historyFile, payload);
      console.log(JSON.stringify(payload));
      return;
    }

    const jitterMs = Math.max(0, args.jitterSec) * 1000;
    const jitterAppliedMs = jitterMs > 0 ? Math.floor(Math.random() * (jitterMs + 1)) : 0;
    if (jitterAppliedMs > 0) {
      await sleep(jitterAppliedMs);
    }

    const runResult = args.dryRun
      ? {
          ok: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          durationMs: 0,
          dryRun: true,
        }
      : await runCommand(args.command, args.timeoutSec);

    const nextState = {
      ...state,
      job,
      lastRunAt: nowIso(),
      commandHash: hashCommand(args.command),
    };

    if (runResult.ok) {
      nextState.failures = 0;
      nextState.lastStatus = 'success';
      nextState.lastSuccessAt = nowIso();
      nextState.nextAllowedAtMs = 0;
    } else {
      nextState.failures = Number(state.failures || 0) + 1;
      nextState.lastStatus = 'failure';
      const backoffSec = computeBackoffSeconds(
        nextState.failures,
        Math.max(1, args.baseBackoffSec),
        Math.max(1, args.maxBackoffSec)
      );
      nextState.nextAllowedAtMs = Date.now() + backoffSec * 1000;
      nextState.lastError = runResult.error || tail(runResult.stderr, 800);
    }

    await fsp.writeFile(stateFile, JSON.stringify(nextState, null, 2), 'utf8');

    const heartbeat = {
      timestamp: nowIso(),
      job,
      status: runResult.ok ? 'success' : 'failure',
      failures: nextState.failures,
      commandHash: nextState.commandHash,
      jitterAppliedMs,
      durationMs: runResult.durationMs,
      exitCode: runResult.exitCode,
      timedOut: Boolean(runResult.timedOut),
      signal: runResult.signal || null,
      nextAllowedAt: nextState.nextAllowedAtMs
        ? new Date(Number(nextState.nextAllowedAtMs)).toISOString()
        : null,
      stdoutTail: tail(runResult.stdout),
      stderrTail: tail(runResult.stderr),
      recoveredStaleLock: Boolean(lock.recovered),
      dryRun: Boolean(args.dryRun),
      pid: process.pid,
    };

    await fsp.writeFile(heartbeatFile, JSON.stringify(heartbeat, null, 2), 'utf8');
    await appendJsonl(historyFile, heartbeat);
    console.log(JSON.stringify(heartbeat));

    if (!runResult.ok) {
      process.exitCode = 1;
    }
  } finally {
    releaseLock(lockPath);
  }
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
