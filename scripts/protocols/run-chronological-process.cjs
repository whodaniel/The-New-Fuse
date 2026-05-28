#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const options = {
    processId: '',
    actorId: 'tnf-master-clock',
    repoRoot: process.env.TNF_REPO_ROOT || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--process-id') {
      options.processId = argv[++i] || '';
    } else if (arg === '--actor-id') {
      options.actorId = argv[++i] || '';
    } else if (arg === '--repo-root') {
      options.repoRoot = argv[++i] || '';
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.processId) {
    throw new Error('Missing required --process-id');
  }

  return options;
}

function printUsage() {
  console.log(
    'Usage: node scripts/protocols/run-chronological-process.cjs --process-id <id> [--actor-id <actor>] [--repo-root <path>]'
  );
}

function resolveRepoRoot(explicitRoot) {
  if (explicitRoot) return path.resolve(explicitRoot);
  const marker = path.join('data', 'protocols', 'chronological-process-catalog.json');
  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(current, marker))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function buildOutputPreview(stdout, stderr) {
  const combined = [stdout || '', stderr || ''].join('\n').trim();
  if (!combined) return null;
  const normalized = combined.replace(/\s+/g, ' ').trim();
  return normalized.length > 420 ? `${normalized.slice(0, 420)}...` : normalized;
}

function createRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
}

function releaseGuardOnExit(guard) {
  let released = false;
  const release = () => {
    if (released || !guard || typeof guard.release !== 'function') return;
    released = true;
    guard.release();
  };

  process.once('exit', release);
  process.once('SIGINT', () => {
    release();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    release();
    process.exit(143);
  });
}

function expandArg(repoRoot, arg) {
  if (
    arg.startsWith('scripts/') ||
    arg.startsWith('docs/') ||
    arg.startsWith('data/') ||
    arg.startsWith('reports/')
  ) {
    return path.join(repoRoot, arg);
  }
  return arg;
}

function acquireLock(lockPath, staleAfterMs, payload) {
  if (fs.existsSync(lockPath)) {
    const current = readJson(lockPath, null);
    const startedAt = Date.parse(current?.startedAt || '');
    if (Number.isFinite(startedAt) && Date.now() - startedAt <= staleAfterMs) {
      return { acquired: false, lock: current };
    }
    fs.rmSync(lockPath, { force: true });
  }

  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const fd = fs.openSync(lockPath, 'wx');
  try {
    fs.writeFileSync(fd, JSON.stringify(payload, null, 2), 'utf8');
  } finally {
    fs.closeSync(fd);
  }
  return { acquired: true, lock: payload };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const processGuard = singleInstanceGuard({
    lockName: `run-chrono-${slugify(options.processId)}`,
    staleMs: 30000,
  });
  if (!processGuard.acquired) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: 'already-running',
          reason: 'already-running',
          processId: options.processId,
          lock: processGuard.existingLock,
        },
        null,
        2
      )
    );
    return;
  }
  releaseGuardOnExit(processGuard);

  const repoRoot = resolveRepoRoot(options.repoRoot);
  const catalogPath = path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
  const registryPath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
  const statePath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
  const locksDir = path.join(repoRoot, 'data', 'protocols', 'cron-job-locks');

  const catalog = readJson(catalogPath, { entries: {} });
  const registry = readJson(registryPath, { jobs: [] });
  const state = readJson(statePath, {
    spec: 'tnf/cron-jobs-control-plane-state/0.1',
    updated_at: new Date(0).toISOString(),
    overrides: {},
    runtime: {},
    history: {},
  });

  const jobExists = Array.isArray(registry.jobs)
    ? registry.jobs.some((job) => job.schedule_id === options.processId)
    : false;
  if (!jobExists) {
    throw new Error(`Chronological process ${options.processId} is not registered`);
  }

  const processCatalog = catalog.entries?.[options.processId];
  if (!processCatalog) {
    throw new Error(`Chronological process ${options.processId} has no catalog entry`);
  }
  if (!processCatalog.runNow) {
    throw new Error(`Chronological process ${options.processId} does not expose a run-now command`);
  }

  const timeoutMs = Number(processCatalog.runNow.timeoutMs || 30000);
  const staleAfterMs = Math.max(timeoutMs * 2, 5 * 60 * 1000);
  const lockPath = path.join(locksDir, `${slugify(options.processId)}.lock.json`);
  const lockPayload = {
    processId: options.processId,
    actorId: options.actorId,
    startedAt: new Date().toISOString(),
    pid: process.pid,
  };
  const lock = acquireLock(lockPath, staleAfterMs, lockPayload);
  if (!lock.acquired) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: 'locked',
          processId: options.processId,
          lock: lock.lock,
        },
        null,
        2
      )
    );
    return;
  }

  const startedAt = new Date().toISOString();
  state.runtime[options.processId] = {
    ...(state.runtime[options.processId] || {}),
    status: 'running',
    lastRunAt: startedAt,
    lastError: null,
  };
  state.updated_at = startedAt;
  writeJson(statePath, state);

const absoluteArgs = processCatalog.runNow.args.map((arg) => expandArg(repoRoot, arg));

function resolveCommand(cmd) {
  if (cmd.includes('/') || cmd.includes('\\')) return cmd;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/root';
  const nvmPrefix = path.join(homeDir, '.nvm', 'versions', 'node');
  try {
    const versions = fs.readdirSync(nvmPrefix).sort().reverse();
    for (const ver of versions) {
      const candidate = path.join(nvmPrefix, ver, 'bin', cmd);
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {}
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  for (const dir of pathDirs) {
    const candidate = path.join(dir, cmd);
    try { if (fs.statSync(candidate).isFile()) return candidate; } catch {}
  }
  return cmd;
}

const resolvedCommand = resolveCommand(processCatalog.runNow.command);
const startedMs = Date.now();
let status = 'healthy';
let exitCode = 0;
let errorMessage = null;
let outputPreview = null;

try {
  const result = await execFileAsync(resolvedCommand, absoluteArgs, {
      cwd: repoRoot,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 2,
      env: process.env,
    });
    outputPreview = buildOutputPreview(result.stdout, result.stderr);
  } catch (error) {
    const execError = error;
    status = 'error';
    exitCode = typeof execError.code === 'number' ? execError.code : 1;
    errorMessage = execError.message || 'Process execution failed';
    outputPreview = buildOutputPreview(execError.stdout, execError.stderr);
  } finally {
    fs.rmSync(lockPath, { force: true });
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startedMs;
  const nextState = readJson(statePath, state);
  const runRecord = {
    runId: createRunId(),
    processId: options.processId,
    actorId: options.actorId,
    startedAt,
    finishedAt,
    durationMs,
    status,
    exitCode,
    error: errorMessage,
    outputPreview,
  };

  nextState.runtime[options.processId] = {
    ...(nextState.runtime[options.processId] || {}),
    status,
    lastRunAt: finishedAt,
    lastDurationMs: durationMs,
    lastExitCode: exitCode,
    lastError: errorMessage,
    lastOutputPreview: outputPreview,
  };
  const existingHistory = Array.isArray(nextState.history[options.processId])
    ? nextState.history[options.processId]
    : [];
  nextState.history[options.processId] = [runRecord, ...existingHistory].slice(0, 25);
  nextState.updated_at = finishedAt;
  writeJson(statePath, nextState);

  console.log(
    JSON.stringify(
      {
        ok: status === 'healthy',
        processId: options.processId,
        run: runRecord,
      },
      null,
      2
    )
  );

  if (status !== 'healthy') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message || String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
