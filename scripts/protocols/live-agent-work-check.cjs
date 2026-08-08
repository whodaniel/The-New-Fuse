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
const DEFAULT_TIMEOUT_MS = 2500;

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const writeMode = args.includes('--write');
const strictMode = args.includes('--strict');
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

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return { exists: false, path: filePath };
    const stat = fs.statSync(filePath);
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
      staleAfterSeconds: 180,
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
  const ping = run('redis-cli', ['PING']);
  const planning = run('redis-cli', ['LLEN', 'tnf:master:tasks:planning']);
  const realtime = run('redis-cli', ['LLEN', 'tnf:master:tasks:realtime']);
  const registry = run('redis-cli', ['EXISTS', 'tnf:agent-registry']);
  return {
    ok: ping.stdout === 'PONG',
    ping: ping.stdout || ping.stderr || ping.error,
    queues: {
      planning: Number.parseInt(planning.stdout || '0', 10) || 0,
      realtime: Number.parseInt(realtime.stdout || '0', 10) || 0,
    },
    registryExists: registry.stdout === '1',
  };
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

  if (state.masterHeartbeat.stale) {
    addFinding(findings, 'critical', 'master-heartbeat-stale', 'Master heartbeat state is missing, unreadable, or stale.', {
      ageSeconds: state.masterHeartbeat.record.ageSeconds,
      generatedAt: firstJsonValue(state.masterHeartbeat.record, ['generatedAt', 'created_at']),
    });
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
    addFinding(findings, 'critical', 'redis-unavailable', 'Redis is not responding with PONG.', { ping: snapshot.redis.ping });
  } else if (snapshot.redis.queues.planning || snapshot.redis.queues.realtime) {
    addFinding(findings, 'warn', 'redis-queues-pending', 'Master task queues are not empty.', snapshot.redis.queues);
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
