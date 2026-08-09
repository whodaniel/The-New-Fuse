#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const HOME = os.homedir();
const REPORT_DIR = path.join(ROOT, 'docs/protocols/reports');
const HOME_REPORT = path.join(HOME, '.tnf/live-agent-work-check-latest.json');
const DEFAULT_TIMEOUT_MS = 5000;
const REDIS_FAST_TIMEOUT_MS = 3000;
const REDIS_RECOVERY =
  'Verify/repair com.thenewfuse.redis-tnf-bus with scripts/runtime/redis-local-bootstrap.sh launchd-start, require bounded PONG, then refresh com.tnf.master-heartbeat and rerun this check.';
const REDIS_WEDGE_RECOVERY =
  'Pause new Redis clients, stop stuck bootstrap/shutdown callers, restart com.thenewfuse.redis-tnf-bus, then refresh master-heartbeat.';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const writeMode = args.includes('--write');
const strictMode = args.includes('--strict');
const wsChannelsMode = args.includes('--ws-channels') || process.env.TNF_LIVE_CHECK_WS_CHANNELS === '1';
const timeoutMs = readIntOption('--timeout-ms', DEFAULT_TIMEOUT_MS);

function readIntOption(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number.parseInt(args[index + 1] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function run(command, commandArgs = [], options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    timeout: options.timeoutMs || timeoutMs,
    env: process.env,
  });
  return {
    command: [command, ...commandArgs].join(' '),
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    timedOut: result.error?.code === 'ETIMEDOUT',
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    error: result.error?.message || null,
  };
}

function redisCli(args = []) {
  return run('redis-cli', ['-h', '127.0.0.1', '-p', '6379', ...args], {
    timeoutMs: Math.min(timeoutMs, REDIS_FAST_TIMEOUT_MS),
  });
}

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return { exists: false, path: filePath };
    const stat = fs.statSync(filePath);
    const payload = sanitizeForReport(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    return {
      exists: true,
      path: filePath,
      mtimeMs: stat.mtimeMs,
      ageSeconds: Math.max(0, Math.round((Date.now() - stat.mtimeMs) / 1000)),
      payload,
    };
  } catch (err) {
    return { exists: true, path: filePath, unreadable: true, error: err.message };
  }
}

function shouldRedactKey(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  return [
    'apikey',
    'authorization',
    'credential',
    'encryptionkey',
    'encryptionprivatekeyfile',
    'encryptionprivatekeypem',
    'keypem',
    'password',
    'privatekey',
    'privatekeypem',
    'secret',
    'signingkey',
    'signingprivatekeyfile',
    'signingprivatekeypem',
    'token',
  ].some((needle) => normalized.includes(needle));
}

function shouldRedactString(value) {
  return /-----BEGIN [A-Z ]*PRIVATE KEY-----|[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(value);
}

function sanitizeForReport(value, key = '') {
  if (shouldRedactKey(key)) return '[REDACTED]';
  if (typeof value === 'string') return shouldRedactString(value) ? '[REDACTED]' : value;
  if (Array.isArray(value)) return value.map((entry) => sanitizeForReport(entry));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeForReport(entryValue, entryKey)]));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function firstJsonValue(record, keys) {
  for (const key of keys) {
    if (record?.payload && record.payload[key] !== undefined) return record.payload[key];
  }
  return undefined;
}

function collectGit() {
  const status = run('git', ['status', '--porcelain=v1', '-b'], { timeoutMs: 10000 });
  const commits = run('git', ['log', '-8', '--format=%h%x09%an%x09%s'], { timeoutMs: 6000 });
  const stashes = run('git', ['stash', 'list'], { timeoutMs: 6000 });
  const active = run('ps', ['-axo', 'pid=,ppid=,stat=,etime=,command='], { timeoutMs: 4000 });
  const lockPath = path.join(ROOT, '.git/index.lock');
  const lockExists = fs.existsSync(lockPath);
  const lockOwners = lockExists ? run('lsof', [lockPath]) : null;
  const lines = status.stdout ? status.stdout.split('\n') : [];
  const activeGitProcesses = active.stdout
    ? active.stdout
        .split('\n')
        .filter((line) => /\b(git|husky|lint-staged)\b/i.test(line))
        .filter((line) => !line.includes('fsmonitor--daemon'))
        .filter((line) => !line.includes('live-agent-work-check.cjs'))
        .filter((line) => !line.includes('tnf:live:agents'))
        .filter((line) => !line.includes('LIVE_AGENT_WORK_CHECK'))
        .filter((line) => !line.includes('ps -axo'))
        .slice(0, 20)
    : [];
  return {
    branch: lines[0] || '',
    dirtyFiles: lines.slice(1),
    dirtyCount: Math.max(0, lines.length - 1),
    recentCommits: commits.stdout ? commits.stdout.split('\n') : [],
    stashCount: stashes.stdout ? stashes.stdout.split('\n').filter(Boolean).length : 0,
    stashes: stashes.stdout ? stashes.stdout.split('\n').slice(0, 8) : [],
    activeGitProcesses,
    indexLock: {
      exists: lockExists,
      owners: lockOwners?.stdout ? lockOwners.stdout.split('\n').filter(Boolean) : [],
    },
  };
}

function collectProcesses() {
  const ps = run('ps', ['-axo', 'pid=,ppid=,stat=,etime=,command=']);
  const needles = [
    'codex',
    'cursor',
    'agy',
    'antigravity',
    'kilo',
    'gemini',
    'opencode',
    'claude',
    'local-subdirector-runtime',
    'tnf-master-heartbeat-loop',
  ];
  const lines = ps.stdout ? ps.stdout.split('\n') : [];
  return lines
    .filter((line) => needles.some((needle) => line.toLowerCase().includes(needle)))
    .filter((line) => !line.includes('live-agent-work-check.cjs'))
    .slice(0, 80);
}

function collectRelay() {
  const listener = run('lsof', ['-nP', '-iTCP:3000', '-sTCP:LISTEN'], { timeoutMs: 3000 });
  const health = run('curl', ['-fsS', '--max-time', '2', 'http://127.0.0.1:3000/health'], { timeoutMs: 3500 });
  const ps = run('ps', ['-axo', 'pid=,ppid=,stat=,etime=,command='], { timeoutMs: 4000 });
  const processLines = ps.stdout ? ps.stdout.split('\n') : [];
  const masterClockProcessCandidates = processLines
    .filter((line) => /(^|\/|\s)(pnpm run master-clock|dist\/master-clock\.js|@the-new-fuse\/relay-core run master-clock)/.test(line))
    .filter((line) => !line.includes('live-agent-work-check.cjs'))
    .filter((line) => !line.includes('ps -axo'))
    .slice(0, 40);
  const masterClockRuntimeProcesses = masterClockProcessCandidates.filter((line) => {
    const parsed = parsePsLine(line);
    return (
      /^(?:\S+\/)?node\s+dist\/master-clock\.js\b/.test(parsed.command || '') ||
      /@the-new-fuse\/relay-core run master-clock/.test(parsed.command || '')
    );
  });
  let healthPayload = null;
  try {
    healthPayload = health.stdout ? JSON.parse(health.stdout) : null;
  } catch {
    healthPayload = null;
  }

  let channelCheck = null;
  if (wsChannelsMode) {
    const check = run(
      'node',
      ['scripts/protocols/check-federated-ws-channels.cjs', '--json', '--write', '--timeout-ms', '10000'],
      { timeoutMs: 20000 }
    );
    try {
      channelCheck = check.stdout ? JSON.parse(check.stdout) : { ok: false, error: check.stderr || check.error || 'empty output' };
    } catch (err) {
      channelCheck = { ok: false, error: err.message, stdout: check.stdout, stderr: check.stderr };
    }
  }

  return {
    listening: listener.stdout ? listener.stdout.includes(':3000') : false,
    listener: listener.stdout ? listener.stdout.split('\n').slice(0, 6) : [],
    healthOk: health.ok && healthPayload?.status === 'ok' && healthPayload?.relay === 'running',
    health: healthPayload || health.stderr || health.error || health.stdout,
    masterClockProcesses: masterClockRuntimeProcesses,
    masterClockProcessCandidates,
    masterClockProcessCount: masterClockRuntimeProcesses.length,
    wsChannelsMode,
    channelCheck,
  };
}

function parseLaunchctlList(stdout, label) {
  const row = (stdout || '').split('\n').find((line) => line.includes(label));
  if (!row) return { label, loaded: false };
  const parts = row.trim().split(/\s+/);
  return {
    label,
    loaded: true,
    pid: parts[0] === '-' ? null : parts[0],
    lastExit: parts[1],
    raw: row.trim(),
  };
}

function collectLaunchd() {
  const list = run('launchctl', ['list']);
  const labels = [
    'com.tnf.local-subdirector',
    'com.tnf.master-heartbeat',
    'com.tnf.fleet-health-probe',
    'com.tnf.master-reconciliation',
    'com.thenewfuse.redis-tnf-bus',
    'com.thenewfuse.api-local',
    'com.thenewfuse.api-gateway',
    'com.tnf.voice-beam-watchdog',
  ];
  return {
    ok: list.ok,
    labels: Object.fromEntries(labels.map((label) => [label, parseLaunchctlList(list.stdout, label)])),
  };
}

function collectStateFiles() {
  const files = {
    localSubdirector: {
      staleAfterSeconds: 90,
      record: readJson(path.join(HOME, '.tnf/local-subdirector/state/local-subdirector-heartbeat.json')),
    },
    masterHeartbeat: {
      staleAfterSeconds: 360,
      record: readJson(path.join(HOME, '.tnf/master-heartbeat/state/master-heartbeat-latest.json')),
    },
    coreFleet: {
      staleAfterSeconds: 1800,
      record: readJson(path.join(HOME, '.tnf/core-fleet-latest.json')),
    },
    homeHandoff: {
      staleAfterSeconds: 3600,
      record: readJson(path.join(HOME, '.tnf/handoff-current.json')),
    },
    repoHandoff: {
      staleAfterSeconds: 3600,
      record: readJson(path.join(REPORT_DIR, 'SESSION_HANDOFF_LATEST.json')),
    },
  };
  for (const state of Object.values(files)) {
    const record = state.record;
    state.stale = !record.exists || record.unreadable || Number(record.ageSeconds || Infinity) > state.staleAfterSeconds;
  }
  return files;
}

function collectRedis() {
  const listener = run('lsof', ['-nP', '-iTCP:6379', '-sTCP:LISTEN'], { timeoutMs: 3000 });
  const ps = run('ps', ['-axo', 'pid=,ppid=,stat=,etime=,command='], { timeoutMs: 4000 });
  const redisProcesses = ps.stdout
    ? ps.stdout
        .split('\n')
        .filter((line) => /redis-(server|rdb-bgsave)|redis-cli/i.test(line))
        .filter((line) => !line.includes('live-agent-work-check.cjs'))
        .filter((line) => !line.includes('ps -axo'))
        .slice(0, 80)
    : [];
  const wedgedSignals = redisProcesses.filter((line) => isRedisWedgeSignal(line));
  const ping = redisCli(['PING']);
  const ok = ping.stdout === 'PONG';

  if (!ok) {
    return {
      ok: false,
      ping: ping.timedOut ? `timeout after ${Math.min(timeoutMs, REDIS_FAST_TIMEOUT_MS)}ms` : ping.stdout || ping.stderr || ping.error,
      listening: listener.stdout ? listener.stdout.includes(':6379') : false,
      processes: redisProcesses,
      wedgedSignals,
      likelyWedged: Boolean(listener.stdout?.includes(':6379') || wedgedSignals.length > 0),
      config: {
        configFile: '',
        processId: '',
        save: '',
        shutdownOnSigterm: '',
      },
      queues: {
        planning: null,
        realtime: null,
      },
      registryExists: null,
      skippedDeepQueries: true,
      skippedReason: 'PING did not return PONG; skipped LLEN/EXISTS/INFO/CONFIG to avoid amplifying Redis failure',
    };
  }

  const planning = redisCli(['LLEN', 'tnf:master:tasks:planning']);
  const realtime = redisCli(['LLEN', 'tnf:master:tasks:realtime']);
  const registry = redisCli(['EXISTS', 'tnf:agent-registry']);
  const serverInfo = redisCli(['INFO', 'server']);
  const saveConfig = redisCli(['CONFIG', 'GET', 'save']);
  const shutdownConfig = redisCli(['CONFIG', 'GET', 'shutdown-on-sigterm']);
  return {
    ok,
    ping: ping.stdout || ping.stderr || ping.error,
    listening: listener.stdout ? listener.stdout.includes(':6379') : false,
    processes: redisProcesses,
    wedgedSignals,
    likelyWedged: false,
    config: {
      configFile: parseInfoValue(serverInfo.stdout, 'config_file'),
      processId: parseInfoValue(serverInfo.stdout, 'process_id'),
      save: parseConfigGet(saveConfig.stdout, 'save'),
      shutdownOnSigterm: parseConfigGet(shutdownConfig.stdout, 'shutdown-on-sigterm'),
    },
    queues: {
      planning: Number.parseInt(planning.stdout || '0', 10) || 0,
      realtime: Number.parseInt(realtime.stdout || '0', 10) || 0,
    },
    registryExists: registry.stdout === '1',
  };
}

function isRedisWedgeSignal(line) {
  if (!/redis-rdb-bgsave|redis-cli shutdown|redis-cli ping|redis-cli .*HSET|redis-cli .*PUBLISH/i.test(line)) {
    return false;
  }
  const parsed = parsePsLine(line);
  // Very young redis-cli commands are normal probes. Treat only older clients or
  // redis-rdb-bgsave as wedge evidence.
  return /redis-rdb-bgsave/i.test(line) || Number(parsed.elapsedSeconds || 0) > 5;
}

function parsePsLine(line) {
  const match = String(line).trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
  if (!match) return { elapsedSeconds: 0, command: line };
  return {
    pid: match[1],
    ppid: match[2],
    stat: match[3],
    etime: match[4],
    command: match[5],
    elapsedSeconds: parseElapsedSeconds(match[4]),
  };
}

function parseElapsedSeconds(etime) {
  const value = String(etime || '').trim();
  const dayMatch = value.match(/^(\d+)-(.+)$/);
  const days = dayMatch ? Number.parseInt(dayMatch[1], 10) || 0 : 0;
  const clock = dayMatch ? dayMatch[2] : value;
  const parts = clock.split(':').map((part) => Number.parseInt(part, 10) || 0);
  if (parts.length === 3) return days * 86400 + parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return days * 86400 + parts[0] * 60 + parts[1];
  if (parts.length === 1) return days * 86400 + parts[0];
  return days * 86400;
}

function parseInfoValue(stdout, key) {
  const row = (stdout || '').split('\n').find((line) => line.startsWith(`${key}:`));
  if (!row) return '';
  return row.slice(key.length + 1).trim();
}

function parseConfigGet(stdout, key) {
  const lines = (stdout || '').split('\n').map((line) => line.trim());
  const index = lines.indexOf(key);
  return index === -1 ? '' : lines[index + 1] || '';
}

function collectTokens() {
  return {
    TNF_SUPER_ADMIN_TOKEN: Boolean(process.env.TNF_SUPER_ADMIN_TOKEN),
    TNF_SUPER_ADMIN_INPUT_TOKEN: Boolean(process.env.TNF_SUPER_ADMIN_INPUT_TOKEN),
    TNF_GATE_POLICY_TOKEN: Boolean(process.env.TNF_GATE_POLICY_TOKEN),
    TNF_CLOUD_REDIS_URL: Boolean(process.env.TNF_CLOUD_REDIS_URL),
  };
}

function collectFullAuto() {
  return readJson(path.join(ROOT, 'docs/operations/tnf-full-auto-state.json'));
}

function addFinding(findings, severity, id, message, evidence = {}) {
  findings.push({ severity, id, message, evidence });
}

function analyze(snapshot) {
  const findings = [];
  const launchd = snapshot.launchd.labels;
  const state = snapshot.stateFiles;
  const tokens = snapshot.tokens;
  const fullAuto = snapshot.fullAuto;
  const relay = snapshot.relay;

  if (snapshot.git.indexLock.exists) {
    const hasOwner = snapshot.git.indexLock.owners.length > 1;
    addFinding(
      findings,
      hasOwner ? 'warn' : 'critical',
      'git-index-lock',
      hasOwner ? 'Git index.lock exists and is owned by an active process.' : 'Git index.lock exists with no visible owner.',
      { owners: snapshot.git.indexLock.owners }
    );
  }

  if (snapshot.git.activeGitProcesses.length > 0) {
    addFinding(findings, 'warn', 'active-git-operation', 'A git/husky/lint-staged operation appears active.', {
      processes: snapshot.git.activeGitProcesses.slice(0, 8),
    });
  }

  if (!launchd['com.tnf.master-heartbeat']?.loaded) {
    addFinding(findings, 'critical', 'master-heartbeat-unloaded', 'com.tnf.master-heartbeat is not loaded in launchd.');
  }

  if (!relay.healthOk) {
    addFinding(findings, 'critical', 'relay-unhealthy', 'WebSocket relay on :3000 is not healthy.', {
      listening: relay.listening,
      health: relay.health,
      listener: relay.listener,
    });
  }

  if (relay.masterClockProcessCount > 3) {
    addFinding(
      findings,
      'critical',
      'duplicate-master-clock-flood-risk',
      'Multiple master-clock stacks are live and can flood the WebSocket relay after reconnect.',
      { count: relay.masterClockProcessCount, processes: relay.masterClockProcesses.slice(0, 12) }
    );
  } else if (relay.masterClockProcessCount > 1) {
    addFinding(findings, 'warn', 'duplicate-master-clock', 'More than one master-clock process is live.', {
      count: relay.masterClockProcessCount,
      processes: relay.masterClockProcesses.slice(0, 8),
    });
  }

  if (relay.wsChannelsMode && relay.channelCheck && relay.channelCheck.ok !== true) {
    addFinding(findings, 'critical', 'federated-ws-channel-check-failed', 'Green/Blue federated WebSocket channel probe failed.', {
      channelCheck: relay.channelCheck,
    });
  }

  const masterStatus = firstJsonValue(state.masterHeartbeat.record, ['status']);
  if (state.masterHeartbeat.stale) {
    addFinding(findings, 'critical', 'master-heartbeat-stale', 'Master heartbeat state is missing, unreadable, or stale.', {
      ageSeconds: state.masterHeartbeat.record.ageSeconds,
      generatedAt: firstJsonValue(state.masterHeartbeat.record, ['generatedAt', 'created_at']),
    });
  } else if (['fatal', 'stopped'].includes(String(masterStatus || '').toLowerCase())) {
    addFinding(findings, 'critical', 'master-heartbeat-not-running', 'Master heartbeat state is fresh but not running.', {
      status: masterStatus,
      ageSeconds: state.masterHeartbeat.record.ageSeconds,
      generatedAt: firstJsonValue(state.masterHeartbeat.record, ['generatedAt', 'created_at']),
    });
  } else if (String(masterStatus || '').toLowerCase() === 'skipped-locked') {
    addFinding(findings, 'warn', 'master-heartbeat-lock-held', 'Master heartbeat wrote skipped-locked instead of a cycle state.', {
      status: masterStatus,
      ageSeconds: state.masterHeartbeat.record.ageSeconds,
      generatedAt: firstJsonValue(state.masterHeartbeat.record, ['generatedAt', 'created_at']),
    });
  } else if (String(masterStatus || '').toLowerCase() === 'cycle-running') {
    // Fresh cycle-running state is expected while the master loop is mid-cycle.
  }

  const localStatus = firstJsonValue(state.localSubdirector.record, ['status']);
  if (state.localSubdirector.stale || (localStatus && localStatus !== 'healthy')) {
    addFinding(findings, 'warn', 'local-subdirector-attention', 'Local Subdirector heartbeat is stale or not healthy.', {
      ageSeconds: state.localSubdirector.record.ageSeconds,
      status: localStatus,
      summary: firstJsonValue(state.localSubdirector.record, ['summary']),
    });
  }

  const repoHandoff = firstJsonValue(state.repoHandoff.record, ['handoff_id', 'id']);
  const homeHandoff = firstJsonValue(state.homeHandoff.record, ['handoff_id', 'id']);
  if (repoHandoff && homeHandoff && repoHandoff !== homeHandoff) {
    addFinding(findings, 'warn', 'handoff-divergence', 'Repo and home handoff anchors do not agree.', {
      repoHandoff,
      homeHandoff,
    });
  }

  if (!snapshot.redis.ok) {
    if (snapshot.redis.likelyWedged) {
      addFinding(
        findings,
        'critical',
        'redis-wedged',
        'Redis is listening or has blocked clients, but PING is timing out.',
        {
          ping: snapshot.redis.ping,
          listening: snapshot.redis.listening,
          wedgedSignals: snapshot.redis.wedgedSignals.slice(0, 12),
          remediation: REDIS_WEDGE_RECOVERY,
        }
      );
    } else {
      addFinding(findings, 'critical', 'redis-unavailable', 'Redis is not responding with PONG.', {
        ping: snapshot.redis.ping,
        listening: snapshot.redis.listening,
        skippedDeepQueries: snapshot.redis.skippedDeepQueries,
        remediation: REDIS_RECOVERY,
      });
    }
  } else if (Number(snapshot.redis.queues.planning || 0) || Number(snapshot.redis.queues.realtime || 0)) {
    addFinding(findings, 'warn', 'redis-queues-pending', 'Master task queues are not empty.', snapshot.redis.queues);
  }

  const redisLaunchd = launchd['com.thenewfuse.redis-tnf-bus'];
  if (snapshot.redis.ok && redisLaunchd?.loaded && !redisLaunchd.pid) {
    addFinding(
      findings,
      'warn',
      'redis-launchd-mismatch',
      'Redis responds to PING but com.thenewfuse.redis-tnf-bus is not the owning launchd process.',
      {
        launchd: redisLaunchd,
        processes: snapshot.redis.processes.slice(0, 8),
      }
    );
  }

  if (
    snapshot.redis.ok &&
    (snapshot.redis.config.save || snapshot.redis.config.shutdownOnSigterm !== 'nosave' || !snapshot.redis.config.configFile)
  ) {
    addFinding(
      findings,
      'warn',
      'redis-config-drift',
      'Redis is running outside TNF fleet-safe local bus settings.',
      {
        expected: {
          configFile: path.join(HOME, '.tnf/redis/redis.conf'),
          save: '',
          shutdownOnSigterm: 'nosave',
        },
        actual: snapshot.redis.config,
      }
    );
  }

  if (fullAuto.exists) {
    const fullAutoAge = Number(fullAuto.ageSeconds || Infinity);
    if (fullAutoAge > 1800) {
      addFinding(findings, 'warn', 'full-auto-stale', 'Full-auto state has not updated recently.', {
        ageSeconds: fullAuto.ageSeconds,
        generatedAt: firstJsonValue(fullAuto, ['generatedAt', 'created_at']),
      });
    }
  }

  if (!tokens.TNF_SUPER_ADMIN_INPUT_TOKEN || !tokens.TNF_GATE_POLICY_TOKEN) {
    addFinding(
      findings,
      'warn',
      'protected-full-auto-tokens-missing',
      'Protected full-auto remains gated because input/policy tokens are missing.',
      {
        TNF_SUPER_ADMIN_INPUT_TOKEN: tokens.TNF_SUPER_ADMIN_INPUT_TOKEN,
        TNF_GATE_POLICY_TOKEN: tokens.TNF_GATE_POLICY_TOKEN,
      }
    );
  }

  const verdict = findings.some((finding) => finding.severity === 'critical')
    ? 'block'
    : findings.some((finding) => finding.severity === 'warn')
      ? 'caution'
      : 'proceed';

  return { verdict, findings };
}

function buildSnapshot() {
  const snapshot = {
    schema: 'tnf.live-agent-work-check.v1',
    generatedAt: new Date().toISOString(),
    root: ROOT,
    host: os.hostname(),
    git: collectGit(),
    processes: collectProcesses(),
    launchd: collectLaunchd(),
    stateFiles: collectStateFiles(),
    redis: collectRedis(),
    relay: collectRelay(),
    tokens: collectTokens(),
    fullAuto: collectFullAuto(),
  };
  const analysis = analyze(snapshot);
  return { ...snapshot, ...analysis };
}

function formatStateLine(name, state) {
  const record = state.record;
  const status = firstJsonValue(record, ['status']) || firstJsonValue(record, ['ok']) || 'n/a';
  const generatedAt = firstJsonValue(record, ['generatedAt', 'created_at']) || 'n/a';
  const age = record.exists ? `${record.ageSeconds}s` : 'missing';
  return `| ${name} | ${state.stale ? 'stale' : 'fresh'} | ${status} | ${age} | ${generatedAt} |`;
}

function toMarkdown(snapshot) {
  const findings = snapshot.findings.length
    ? snapshot.findings.map((finding) => `- ${finding.severity.toUpperCase()} ${finding.id}: ${finding.message}`).join('\n')
    : '- No findings.';
  const launchRows = Object.values(snapshot.launchd.labels)
    .map((entry) => `| ${entry.label} | ${entry.loaded ? 'loaded' : 'missing'} | ${entry.pid || '-'} | ${entry.lastExit || '-'} |`)
    .join('\n');
  const processRows = snapshot.processes.length
    ? snapshot.processes.map((line) => `- ${line}`).join('\n')
    : '- No matching agent processes observed.';
  return `# TNF Live Agent Work Check

- Generated: ${snapshot.generatedAt}
- Verdict: ${snapshot.verdict.toUpperCase()}
- Repo: ${snapshot.root}

## Findings
${findings}

## Git
- ${snapshot.git.branch || 'unknown branch'}
- Dirty files: ${snapshot.git.dirtyCount}
- Stashes: ${snapshot.git.stashCount}
- Index lock: ${snapshot.git.indexLock.exists ? 'present' : 'absent'}

## Launchd
| Label | State | PID | Last Exit |
| --- | --- | ---: | ---: |
${launchRows}

## Relay
- Health: ${snapshot.relay.healthOk ? 'healthy' : 'unhealthy'}
- Listener: ${snapshot.relay.listener[0] || 'none'}
- Master-clock process count: ${snapshot.relay.masterClockProcessCount}
- WS channel probe: ${
    snapshot.relay.wsChannelsMode
      ? snapshot.relay.channelCheck?.ok
        ? 'pass'
        : 'fail'
      : 'not run'
  }

## State Files
| Anchor | Freshness | Status | Age | Generated |
| --- | --- | --- | ---: | --- |
${formatStateLine('local-subdirector', snapshot.stateFiles.localSubdirector)}
${formatStateLine('master-heartbeat', snapshot.stateFiles.masterHeartbeat)}
${formatStateLine('core-fleet', snapshot.stateFiles.coreFleet)}
${formatStateLine('home-handoff', snapshot.stateFiles.homeHandoff)}
${formatStateLine('repo-handoff', snapshot.stateFiles.repoHandoff)}

## Agent Processes
${processRows}

## Operating Rule
Agents should run \`pnpm run tnf:live:agents:write\` before claiming fleet success, committing multi-agent work, or handing off after concurrent agent activity. A BLOCK verdict means pause new autonomous work and repair the reported live-state gap first.

If the report contains \`redis-wedged\`, agents must not launch more Redis clients
or bootstrap loops. The Local Subdirector should serialize recovery: stop stuck
Redis callers, restart \`com.thenewfuse.redis-tnf-bus\`, refresh
\`com.tnf.master-heartbeat\`, and rerun this check.

If the report contains \`redis-unavailable\`, do not trust launchd loaded state
or PID alone. Run \`bash scripts/runtime/redis-local-bootstrap.sh launchd-start\`,
require a bounded \`redis-cli -h 127.0.0.1 -p 6379 PING\` result of \`PONG\`,
refresh \`com.tnf.master-heartbeat\`, and rerun this check.

Operational skill: \`.agent/skills/tnf-live-fleet-cohesion/SKILL.md\`.
`;
}

function writeReports(snapshot) {
  ensureDir(REPORT_DIR);
  ensureDir(path.dirname(HOME_REPORT));
  const jsonPath = path.join(REPORT_DIR, 'LIVE_AGENT_WORK_CHECK_LATEST.json');
  const mdPath = path.join(REPORT_DIR, 'LIVE_AGENT_WORK_CHECK_LATEST.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  fs.writeFileSync(mdPath, toMarkdown(snapshot));
  fs.writeFileSync(HOME_REPORT, `${JSON.stringify(snapshot, null, 2)}\n`);
  return { jsonPath, mdPath, homePath: HOME_REPORT };
}

const snapshot = buildSnapshot();
let written = null;
if (writeMode) written = writeReports(snapshot);

if (jsonMode) {
  console.log(JSON.stringify({ ...snapshot, written }, null, 2));
} else {
  console.log(`TNF live agent work check: ${snapshot.verdict.toUpperCase()}`);
  for (const finding of snapshot.findings) {
    console.log(`- ${finding.severity.toUpperCase()} ${finding.id}: ${finding.message}`);
  }
  if (written) {
    console.log(`report: ${written.mdPath}`);
    console.log(`json: ${written.jsonPath}`);
  }
}

if (strictMode && snapshot.verdict === 'block') {
  process.exit(1);
}
