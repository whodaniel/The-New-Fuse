#!/usr/bin/env node

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'tnf-subdirector-autopilot-loop', staleMs: 300000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}


function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function tail(value, maxChars = 1000) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return text.slice(text.length - maxChars);
}

function resolveRepoRoot() {
  const candidates = [
    process.env.TNF_SUBDIRECTOR_AUTOPILOT_ROOT_DIR,
    path.resolve(__dirname, '..', '..'),
    process.cwd(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const sentinel = path.join(
      candidate,
      '.skills',
      'tnf-sub-director-autopilot',
      'scripts',
      'subdirector-cycle-check.sh'
    );
    if (fs.existsSync(sentinel)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, '..', '..');
}

const repoRoot = resolveRepoRoot();

const config = {
  actorId: process.env.TNF_SUBDIRECTOR_AUTOPILOT_ACTOR_ID || 'tnf-subdirector-autopilot',
  rootDir: repoRoot,
  stateDir:
    process.env.TNF_SUBDIRECTOR_AUTOPILOT_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'subdirector-autopilot', 'state'),
  logFile:
    process.env.TNF_SUBDIRECTOR_AUTOPILOT_LOOP_LOG_FILE ||
    path.join(
      repoRoot,
      'logs',
      'sub-director-autopilot-loop.jsonl'
    ),
  checkScript:
    process.env.TNF_SUBDIRECTOR_AUTOPILOT_CHECK_SCRIPT ||
    path.join(
      repoRoot,
      '.skills',
      'tnf-sub-director-autopilot',
      'scripts',
      'subdirector-cycle-check.sh'
    ),
  intervalMs: parsePositiveInt(process.env.TNF_SUBDIRECTOR_AUTOPILOT_INTERVAL_MS, 30000),
  commandTimeoutMs: parsePositiveInt(
    process.env.TNF_SUBDIRECTOR_AUTOPILOT_COMMAND_TIMEOUT_MS,
    45000
  ),
  lockStaleMs: parsePositiveInt(process.env.TNF_SUBDIRECTOR_AUTOPILOT_LOCK_STALE_MS, 300000),
  runOnce: String(process.env.TNF_SUBDIRECTOR_AUTOPILOT_ONCE || '').toLowerCase() === 'true',
};

const paths = {
  latest: path.join(config.stateDir, 'subdirector-autopilot-latest.json'),
  history: path.join(config.stateDir, 'subdirector-autopilot-history.jsonl'),
  signal: path.join(config.stateDir, 'subdirector-autopilot.signal'),
  lockDir: path.join(config.stateDir, 'loop.lock'),
};

function isLoopPidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 1) {
    return false;
  }
  try {
    process.kill(pid, 0);
  } catch (_ignored) {
    return false;
  }

  const probe = spawnSync('ps', ['-p', String(pid), '-o', 'command='], {
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  });
  if (probe.status !== 0) {
    return false;
  }
  const command = String(probe.stdout || '').trim();
  return command.includes('subdirector-autopilot-loop.cjs');
}

function acquireLock() {
  try {
    fs.mkdirSync(paths.lockDir, { recursive: false });
    fs.writeFileSync(
      path.join(paths.lockDir, 'owner.json'),
      JSON.stringify({ pid: process.pid, startedAt: nowIso() }, null, 2)
    );
    return true;
  } catch (error) {
    if (!error || error.code !== 'EEXIST') {
      throw error;
    }
    try {
      const ownerPath = path.join(paths.lockDir, 'owner.json');
      let ownerPid = null;
      try {
        const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
        ownerPid = Number(owner?.pid || 0);
      } catch (_ignored) {}

      let ownerAlive = false;
      if (Number.isFinite(ownerPid) && ownerPid > 1) {
        ownerAlive = isLoopPidAlive(ownerPid);
      }
      const stat = fs.statSync(paths.lockDir);
      if (!ownerAlive || Date.now() - stat.mtimeMs > config.lockStaleMs) {
        fs.rmSync(paths.lockDir, { recursive: true, force: true });
        fs.mkdirSync(paths.lockDir, { recursive: false });
        fs.writeFileSync(
          path.join(paths.lockDir, 'owner.json'),
          JSON.stringify(
            { pid: process.pid, startedAt: nowIso(), recovered: true, previousPid: ownerPid },
            null,
            2
          )
        );
        return true;
      }
    } catch (_ignored) {
      return false;
    }
    return false;
  }
}

function releaseLock() {
  fs.rmSync(paths.lockDir, { recursive: true, force: true });
}

async function ensureDirs() {
  await fsp.mkdir(config.stateDir, { recursive: true });
  await fsp.mkdir(path.dirname(config.logFile), { recursive: true });
}

function runCheckScript() {
  const command = `${shellEscape(config.checkScript)} --log-file ${shellEscape(config.logFile)}`;
  const result = spawnSync('bash', ['-lc', command], {
    encoding: 'utf8',
    timeout: config.commandTimeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    env: process.env,
  });

  const errorText = result.error ? String(result.error.message || result.error) : null;
  const ok = !errorText && result.status === 0;
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();

  let parsed = null;
  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch (_ignored) {}
  }

  return {
    ok,
    exitCode: result.status,
    signal: result.signal || null,
    error: errorText,
    stdoutTail: tail(stdout),
    stderrTail: tail(stderr),
    parsed,
  };
}

function deriveStatus(checkResult) {
  if (!checkResult.ok) return 'degraded';
  const state = String(checkResult.parsed?.state || '').trim().toLowerCase();
  if (state === 'healthy' || state === 'degraded' || state === 'blocked') {
    return state;
  }
  return 'degraded';
}

async function writePayload(payload) {
  await fsp.writeFile(paths.latest, JSON.stringify(payload, null, 2));
  await fsp.appendFile(paths.history, `${JSON.stringify(payload)}\n`);
  await fsp.writeFile(paths.signal, `${payload.generatedAt}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let shouldStop = false;
const stopSignal = () => {
  shouldStop = true;
};
process.on('SIGINT', stopSignal);
process.on('SIGTERM', stopSignal);

async function main() {
  await ensureDirs();

  if (!acquireLock()) {
    const payload = {
      generatedAt: nowIso(),
      actor: { id: config.actorId, role: 'tnf-subdirector-autopilot' },
      status: 'skipped-locked',
      summary: {
        cycle: 0,
      },
      checkResult: null,
      config: {
        intervalMs: config.intervalMs,
        commandTimeoutMs: config.commandTimeoutMs,
        checkScript: config.checkScript,
        logFile: config.logFile,
      },
    };
    await writePayload(payload);
    console.log(`[subdirector-autopilot] status=${payload.status}`);
    return;
  }

  let cycle = 0;
  try {
    while (!shouldStop) {
      cycle += 1;
      const startedMs = Date.now();
      const checkResult = runCheckScript();
      const status = deriveStatus(checkResult);
      const payload = {
        generatedAt: nowIso(),
        actor: { id: config.actorId, role: 'tnf-subdirector-autopilot' },
        status,
        summary: {
          cycle,
          state: checkResult.parsed?.state || null,
          ownerAgentsCsv: checkResult.parsed?.checks?.ownerAgentsCsv || null,
          forcedTargets: checkResult.parsed?.checks?.forcedTargets || 0,
          frontloadStatus: checkResult.parsed?.checks?.frontloadStatus || null,
        },
        checkResult,
        config: {
          rootDir: config.rootDir,
          intervalMs: config.intervalMs,
          commandTimeoutMs: config.commandTimeoutMs,
          checkScript: config.checkScript,
          logFile: config.logFile,
          stateDir: config.stateDir,
        },
      };

      await writePayload(payload);
      console.log(
        `[subdirector-autopilot] cycle=${cycle} status=${status} owner=${
          payload.summary.ownerAgentsCsv || 'none'
        }`
      );

      if (config.runOnce) {
        break;
      }
      const elapsed = Date.now() - startedMs;
      const delayMs = Math.max(1000, config.intervalMs - elapsed);
      await sleep(delayMs);
    }
  } finally {
    releaseLock();
  }
}

main().catch(async (error) => {
  try {
    await ensureDirs();
    const payload = {
      generatedAt: nowIso(),
      actor: { id: config.actorId, role: 'tnf-subdirector-autopilot' },
      status: 'fatal',
      summary: { cycle: 0 },
      checkResult: {
        ok: false,
        exitCode: null,
        signal: null,
        error: String(error?.message || error),
        stdoutTail: '',
        stderrTail: '',
        parsed: null,
      },
      config: {
        intervalMs: config.intervalMs,
        commandTimeoutMs: config.commandTimeoutMs,
        checkScript: config.checkScript,
        logFile: config.logFile,
        stateDir: config.stateDir,
      },
    };
    await writePayload(payload);
  } catch (_ignored) {}
  console.error(`[subdirector-autopilot] fatal: ${String(error?.message || error)}`);
  process.exit(1);
});
