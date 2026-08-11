#!/usr/bin/env node

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveRootDir() {
  const candidates = [
    process.env.TNF_MASTER_HEARTBEAT_ROOT_DIR,
    process.env.TNF_REPO_ROOT,
    path.resolve(__dirname, '../..'),
    process.cwd(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const sentinel = path.join(candidate, 'scripts', 'runtime', 'tnf-perpetual-scaffold.sh');
    if (fs.existsSync(sentinel)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, '../..');
}

function nowIso() {
  return new Date().toISOString();
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function tail(value, maxChars = 600) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return text.slice(text.length - maxChars);
}

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
  return command.includes('tnf-master-heartbeat-loop.cjs');
}

const config = {
  rootDir: resolveRootDir(),
  stateDir:
    process.env.TNF_MASTER_HEARTBEAT_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'master-heartbeat', 'state'),
  intervalMs: parsePositiveInt(process.env.TNF_MASTER_HEARTBEAT_INTERVAL_MS, 15000),
  commandTimeoutMs: parsePositiveInt(process.env.TNF_MASTER_HEARTBEAT_COMMAND_TIMEOUT_MS, 120000),
  watchdogEveryCycles: parsePositiveInt(process.env.TNF_MASTER_HEARTBEAT_WATCHDOG_EVERY_CYCLES, 3),
  ensureInstallEveryCycles: parsePositiveInt(
    process.env.TNF_MASTER_HEARTBEAT_ENSURE_INSTALL_EVERY_CYCLES,
    20
  ),
  ensureServicesEveryCycles: parsePositiveInt(
    process.env.TNF_MASTER_HEARTBEAT_ENSURE_SERVICES_EVERY_CYCLES,
    4
  ),
  resourceRetentionEveryCycles: parsePositiveInt(
    process.env.TNF_MASTER_HEARTBEAT_RETENTION_EVERY_CYCLES,
    240
  ),
  roleMapReconcileEveryCycles: parsePositiveInt(
    process.env.TNF_MASTER_HEARTBEAT_RECONCILE_EVERY_CYCLES,
    5760
  ),
  lockStaleMs: parsePositiveInt(process.env.TNF_MASTER_HEARTBEAT_LOCK_STALE_MS, 300000),
  allowPromptInjection:
    String(process.env.TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION || 'false').toLowerCase() ===
    'true',
  interactiveSafeMode:
    String(process.env.TNF_INTERACTIVE_SAFE_MODE || 'true').toLowerCase() !== 'false',
  interactiveSafeModeFile:
    process.env.TNF_INTERACTIVE_SAFE_MODE_FILE ||
    path.join(os.homedir(), '.tnf', 'flags', 'interactive-safe-mode'),
  runOnce: String(process.env.TNF_MASTER_HEARTBEAT_ONCE || '').toLowerCase() === 'true',
};

const paths = {
  latest: path.join(config.stateDir, 'master-heartbeat-latest.json'),
  history: path.join(config.stateDir, 'master-heartbeat-history.jsonl'),
  signal: path.join(config.stateDir, 'master-heartbeat.signal'),
  lockDir: path.join(config.stateDir, 'loop.lock'),
};

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

function runCommand(name, command) {
  const startedAt = nowIso();
  const startedMs = Date.now();

  const result = spawnSync('bash', ['-lc', command], {
    encoding: 'utf8',
    timeout: config.commandTimeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...process.env,
      TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION: String(config.allowPromptInjection),
      TNF_INTERACTIVE_SAFE_MODE: String(config.interactiveSafeMode),
      TNF_INTERACTIVE_SAFE_MODE_FILE: config.interactiveSafeModeFile,
      TNF_RELAY_MONITOR_ALLOW_PROMPT_INJECTION:
        process.env.TNF_RELAY_MONITOR_ALLOW_PROMPT_INJECTION || 'false',
      TNF_ASSIGNMENT_MONITOR_ALLOW_PROMPT_INJECTION:
        process.env.TNF_ASSIGNMENT_MONITOR_ALLOW_PROMPT_INJECTION || 'false',
    },
  });

  const endedAt = nowIso();
  const durationMs = Date.now() - startedMs;
  const errorText = result.error ? String(result.error.message || result.error) : null;
  const ok = !errorText && result.status === 0;

  return {
    name,
    ok,
    startedAt,
    endedAt,
    durationMs,
    exitCode: result.status,
    signal: result.signal || null,
    error: errorText,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr),
  };
}

async function ensureDirs() {
  await fsp.mkdir(config.stateDir, { recursive: true });
}

async function pruneMasterHistory() {
  const keepLines = parsePositiveInt(process.env.TNF_MASTER_HEARTBEAT_HISTORY_LINES, 500);
  try {
    const raw = await fsp.readFile(paths.history, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    if (lines.length > keepLines) {
      await fsp.writeFile(paths.history, `${lines.slice(-keepLines).join('\n')}\n`);
    }
  } catch (_error) {
    // best-effort
  }
}

async function writePayload(payload) {
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  const tmp = `${paths.latest}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, body);
  await fsp.rename(tmp, paths.latest);
  await fsp.appendFile(paths.history, `${JSON.stringify(payload)}\n`);
  await fsp.writeFile(paths.signal, `${payload.generatedAt}\n`);
  await pruneMasterHistory();
  // Keep lock mtime fresh so a concurrent start does not treat us as stale
  // while a long cycle is in flight.
  try {
    const now = new Date();
    fs.utimesSync(paths.lockDir, now, now);
  } catch {
    /* ignore */
  }
}

function cycleCommands(cycle) {
  const repo = shellEscape(config.rootDir);
  const commands = [];

  if (cycle === 1 || cycle % config.ensureInstallEveryCycles === 0) {
    commands.push({
      name: 'ensure-terminal-heartbeat-cron',
      command: `cd ${repo} && scripts/runtime/terminal-heartbeat-cron.sh install`,
    });
    commands.push({
      name: 'ensure-director-cron',
      command: `cd ${repo} && scripts/runtime/tnf-director-cron.sh install`,
    });
  }

  if (cycle === 1 || cycle % config.ensureServicesEveryCycles === 0) {
    commands.push({
      name: 'ensure-local-subdirector',
      command: `cd ${repo} && scripts/runtime/local-subdirector-service.sh start`,
    });
    commands.push({
      name: 'ensure-subdirector-autopilot',
      command: `cd ${repo} && scripts/runtime/subdirector-autopilot-service.sh start`,
    });
    commands.push({
      name: 'ensure-relay-monitor',
      command: `cd ${repo} && scripts/runtime/relay-monitor-service.sh start`,
    });
    commands.push({
      name: 'ensure-factory-supervisor',
      command: `cd ${repo} && bash scripts/operations/ensure-factory-supervisor.sh`,
    });
    commands.push({
      name: 'ensure-green-coordinator',
      command: `cd ${repo} && bash scripts/runtime/green-channel-coordinator-service.sh start`,
    });
  }

  if (cycle === 1 || cycle % config.resourceRetentionEveryCycles === 0) {
    commands.push({
      name: 'swarm-disk-retention',
      command: `cd ${repo} && bash scripts/operations/swarm-disk-retention.sh`,
    });
    commands.push({
      name: 'swarm-ram-audit',
      command: `cd ${repo} && bash scripts/operations/swarm-ram-profile.sh`,
    });
  }

  if (cycle === 1 || cycle % config.roleMapReconcileEveryCycles === 0) {
    commands.push({
      name: 'fleet-role-map-reconcile',
      command: `cd ${repo} && node scripts/operations/fleet-role-map-reconcile.cjs`,
    });
    commands.push({
      name: 'fleet-status-snapshot',
      command: `cd ${repo} && node scripts/tnf-fleet-status.cjs --json > /dev/null`,
    });
  }

  commands.push({
    name: 'terminal-heartbeat-pulse',
    command: `cd ${repo} && scripts/runtime/terminal-heartbeat-cron.sh run-once`,
  });
  commands.push({
    name: 'swarm-context-bridge',
    command: `cd ${repo} && node scripts/runtime/tnf-swarm-context-bridge.cjs`,
  });
  commands.push({
    name: 'director-cycle',
    command: `cd ${repo} && scripts/runtime/tnf-director-cron.sh run-once`,
  });

  if (cycle === 1 || cycle % config.watchdogEveryCycles === 0) {
    commands.push({
      name: 'watchdog-cycle',
      command: `cd ${repo} && TNF_PERPETUAL_ROOT_DIR=${repo} scripts/runtime/tnf-perpetual-scaffold.sh run-watchdog`,
    });
  }

  return commands;
}

function runCycle(cycle) {
  const commands = cycleCommands(cycle);
  const steps = commands.map((entry) => runCommand(entry.name, entry.command));
  const failed = steps.filter((step) => !step.ok);

  const status = failed.length === 0 ? 'healthy' : 'degraded';
  return {
    generatedAt: nowIso(),
    status,
    cycle,
    actor: {
      id: process.env.TNF_MASTER_HEARTBEAT_ACTOR_ID || 'tnf-master-heartbeat',
      role: 'tnf-master-clock',
    },
    config: {
      rootDir: config.rootDir,
      intervalMs: config.intervalMs,
      commandTimeoutMs: config.commandTimeoutMs,
      watchdogEveryCycles: config.watchdogEveryCycles,
      ensureInstallEveryCycles: config.ensureInstallEveryCycles,
      ensureServicesEveryCycles: config.ensureServicesEveryCycles,
      resourceRetentionEveryCycles: config.resourceRetentionEveryCycles,
      roleMapReconcileEveryCycles: config.roleMapReconcileEveryCycles,
      allowPromptInjection: config.allowPromptInjection,
      interactiveSafeMode: config.interactiveSafeMode,
      interactiveSafeModeFile: config.interactiveSafeModeFile,
    },
    summary: {
      totalSteps: steps.length,
      failedSteps: failed.length,
    },
    steps,
  };
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
      status: 'skipped-locked',
      actor: { id: 'tnf-master-heartbeat', role: 'tnf-master-clock' },
      summary: {
        totalSteps: 0,
        failedSteps: 0,
      },
      steps: [],
    };
    await writePayload(payload);
    console.log(
      `[master-heartbeat] status=${payload.status} reason=lock-held state=${paths.latest}`
    );
    return;
  }

  let cycle = 0;
  try {
    while (!shouldStop) {
      cycle += 1;
      const cycleStartedMs = Date.now();

      // --- Fleet-wide pause gate (2026-07-21) ---
      // Keep the heartbeat process alive and writing state (so monitoring can
      // see it's running), but skip all autonomous command dispatch when paused.
      // This is the root scheduler — pausing it effectively pauses everything
      // it orchestrates (terminal-heartbeat-pulse, director-cron, etc.).
      // Prefer the mirrored service lib; fall back to repo scripts/lib when the
      // LaunchAgent home was only partially synced.
      let isFleetPaused;
      try {
        ({ isFleetPaused } = require(path.join(__dirname, '..', 'lib', 'tnf-fleet-mode.cjs')));
      } catch {
        ({ isFleetPaused } = require(path.join(config.rootDir, 'scripts', 'lib', 'tnf-fleet-mode.cjs')));
      }
      if (isFleetPaused()) {
        const pausedPayload = {
          generatedAt: nowIso(),
          status: 'fleet-paused',
          cycle,
          actor: {
            id: process.env.TNF_MASTER_HEARTBEAT_ACTOR_ID || 'tnf-master-heartbeat',
            role: 'tnf-master-clock',
          },
          config: {
            rootDir: config.rootDir,
            intervalMs: config.intervalMs,
          },
          summary: { totalSteps: 0, failedSteps: 0 },
          steps: [],
        };
        await writePayload(pausedPayload);
        console.log(`[master-heartbeat] cycle=${cycle} status=fleet-paused (skipping command dispatch)`);
        const elapsed = Date.now() - cycleStartedMs;
        const delayMs = Math.max(1000, config.intervalMs - elapsed);
        if (config.runOnce) break;
        await sleep(delayMs);
        continue;
      }

      const payload = runCycle(cycle);
      await writePayload(payload);

      console.log(
        `[master-heartbeat] cycle=${cycle} status=${payload.status} failed=${payload.summary.failedSteps}`
      );

      const elapsed = Date.now() - cycleStartedMs;
      const delayMs = Math.max(1000, config.intervalMs - elapsed);
      if (config.runOnce) {
        break;
      }
      await sleep(delayMs);
    }
  } finally {
    releaseLock();
    if (!config.runOnce) {
      const stopped = {
        generatedAt: nowIso(),
        status: 'stopped',
        cycle,
        actor: { id: 'tnf-master-heartbeat', role: 'tnf-master-clock' },
        summary: {
          totalSteps: 0,
          failedSteps: 0,
        },
        steps: [],
      };
      await writePayload(stopped);
    }
  }
}

main().catch(async (error) => {
  try {
    await ensureDirs();
    const payload = {
      generatedAt: nowIso(),
      status: 'fatal',
      actor: { id: 'tnf-master-heartbeat', role: 'tnf-master-clock' },
      summary: {
        totalSteps: 0,
        failedSteps: 1,
      },
      steps: [
        {
          name: 'fatal',
          ok: false,
          error: String(error.message || error),
        },
      ],
    };
    await writePayload(payload);
  } catch (_ignored) {
    // no-op
  }
  console.error(`[master-heartbeat] fatal: ${String(error.message || error)}`);
  process.exit(1);
});
