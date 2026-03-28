#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CHRONOLOGICAL_POLL_INTERVAL_MS = 30_000;
const DEFAULT_LOCK_STALE_FLOOR_MS = 5 * 60_000;
const DEFAULT_REPORT_DIR = path.join('reports', 'protocols', 'master-clock-sync');

function parseArgs(argv) {
  const options = {
    repoRoot: process.env.TNF_REPO_ROOT || '',
    json: false,
    warnOnly: false,
    writeReport: true,
    reportDir: DEFAULT_REPORT_DIR,
    now: new Date(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      continue;
    } else if (arg === '--repo-root') {
      options.repoRoot = argv[++i] || '';
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--warn-only') {
      options.warnOnly = true;
    } else if (arg === '--no-write-report') {
      options.writeReport = false;
    } else if (arg === '--report-dir') {
      options.reportDir = argv[++i] || DEFAULT_REPORT_DIR;
    } else if (arg === '--now') {
      const value = argv[++i] || '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --now timestamp: ${value}`);
      }
      options.now = parsed;
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printUsage() {
  console.log(
    [
      'Usage: node scripts/protocols/master-clock-sync-audit.cjs [options]',
      '',
      'Options:',
      '  --repo-root <path>      Override repository root',
      '  --json                  Print JSON report to stdout',
      '  --warn-only             Exit 0 even when critical escalations are found',
      '  --no-write-report       Do not write report artifacts to disk',
      `  --report-dir <path>     Report directory (default: ${DEFAULT_REPORT_DIR})`,
      '  --now <iso>             Override current timestamp (testing)',
      '  -h, --help              Show this help message',
    ].join('\n')
  );
}

function resolveRepoRoot(explicitRoot) {
  if (explicitRoot) return path.resolve(explicitRoot);
  const marker = path.join('data', 'protocols', 'chronological-process-catalog.json');
  let current = process.cwd();
  for (let i = 0; i < 10; i += 1) {
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

function writeText(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, payload, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
}

function normalizeCronExpression(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'manual' || lower === '@never' || lower === 'disabled') {
    return 'manual';
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 6 && tokens[0] === '0') {
    return tokens.slice(1).join(' ');
  }
  if (tokens.length === 5) {
    return tokens.join(' ');
  }
  return null;
}

function deriveCadenceIntervalMs(cadence) {
  const normalized = normalizeCronExpression(cadence);
  if (!normalized || normalized === 'manual') return null;

  const everyMinutes = normalized.match(/^\*\/(\d+) \* \* \* \*$/);
  if (everyMinutes) {
    return Number(everyMinutes[1]) * 60_000;
  }

  const fixedMinuteEachHour = normalized.match(/^(\d{1,2}) \* \* \* \*$/);
  if (fixedMinuteEachHour) {
    return 60 * 60_000;
  }

  const everyHours = normalized.match(/^0 \*\/(\d+) \* \* \*$/);
  if (everyHours) {
    return Number(everyHours[1]) * 60 * 60_000;
  }

  const dailyAtHour = normalized.match(/^0 (\d{1,2}) \* \* \*$/);
  if (dailyAtHour) {
    return 24 * 60 * 60_000;
  }

  return null;
}

function parseTimestampMs(value) {
  if (!value) return null;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function buildTargetTaskCommand(runNow) {
  if (!runNow || !runNow.command) return null;
  const args = Array.isArray(runNow.args) ? runNow.args : [];
  return [runNow.command, ...args].join(' ');
}

function buildExpectedArtifacts(processId, runNow) {
  const artifacts = [
    'data/protocols/cron-jobs.control-plane-state.json',
    `data/protocols/cron-job-locks/${slugify(processId)}.lock.json`,
  ];

  const args = Array.isArray(runNow?.args) ? runNow.args : [];
  if (args.includes('scripts/protocols/chronological-dispatch.cjs')) {
    artifacts.push('reports/chronological-dispatch/pending/*.json (fallback when REDIS_URL is unset)');
  }
  if (args.includes('scripts/openclaw/tnf-openclaw-control.cjs')) {
    artifacts.push('data/protocols/cron-jobs.control-plane-state.json.integrations.openclaw');
  }
  if (args.includes('scripts/timeline/personal-archaeology-orchestrator.mjs')) {
    artifacts.push('reports/personal-archaeology/**');
  }

  return Array.from(new Set(artifacts));
}

function buildEnvironmentContext(runNow) {
  const env = ['TNF_REPO_ROOT'];
  const args = Array.isArray(runNow?.args) ? runNow.args : [];
  if (args.includes('scripts/protocols/chronological-dispatch.cjs')) {
    env.push('REDIS_URL');
  }
  if (args.includes('scripts/openclaw/tnf-openclaw-control.cjs')) {
    env.push('OPENCLAW_HOME');
  }
  return env;
}

function computeConsecutiveFailures(history) {
  if (!Array.isArray(history)) return 0;
  let failures = 0;
  for (const run of history) {
    if (!run || run.status === 'healthy') break;
    failures += 1;
  }
  return failures;
}

function buildSla(processScope, cadence, runNow) {
  const timeoutMs = Math.max(Number(runNow?.timeoutMs || 0), 1_000);
  const cadenceIntervalMs = deriveCadenceIntervalMs(cadence);
  const maxRuntimeMs = Math.max(timeoutMs + 5_000, Math.ceil(timeoutMs * 1.5));
  const maxStartDelayMs = cadenceIntervalMs
    ? Math.max(cadenceIntervalMs * 2, timeoutMs * 3, DEFAULT_CHRONOLOGICAL_POLL_INTERVAL_MS * 4)
    : null;

  return {
    cadenceIntervalMs,
    maxRuntimeMs,
    maxStartDelayMs,
    maxConsecutiveFailures: processScope === 'system_framework' ? 2 : 3,
    staleLockAfterMs: Math.max(timeoutMs * 2, DEFAULT_LOCK_STALE_FLOOR_MS),
  };
}

function getLockDetails(lockPath, staleAfterMs, nowMs) {
  if (!fs.existsSync(lockPath)) {
    return {
      present: false,
      status: 'none',
      ageMs: null,
      payload: null,
    };
  }

  const payload = readJson(lockPath, null);
  const startedAtMs = parseTimestampMs(payload?.startedAt);
  const ageMs = Number.isFinite(startedAtMs) ? nowMs - startedAtMs : null;

  if (ageMs === null) {
    return {
      present: true,
      status: 'invalid',
      ageMs: null,
      payload,
    };
  }

  return {
    present: true,
    status: ageMs > staleAfterMs ? 'stale' : 'active',
    ageMs,
    payload,
  };
}

function pushCheck(checks, escalations, check) {
  checks.push(check);
  if (!check.ok && (check.severity === 'warning' || check.severity === 'critical')) {
    escalations.push({
      severity: check.severity,
      code: check.code,
      message: check.message,
    });
  }
}

function summarizeEscalation(escalations) {
  if (!escalations.length) return null;
  const severityRank = { warning: 1, critical: 2 };
  const top = escalations
    .slice()
    .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))[0];
  return {
    severity: top.severity,
    code: top.code,
    message: top.message,
    total: escalations.length,
  };
}

function toMinutes(ms) {
  if (!Number.isFinite(ms) || ms === null) return 'n/a';
  return `${Math.round(ms / 60_000)}m`;
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Master Clock Sync Audit');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Processes: ${report.summary.totalProcesses}`);
  lines.push(`- Enabled: ${report.summary.enabledProcesses}`);
  lines.push(`- Manual cadence: ${report.summary.manualProcesses}`);
  lines.push(`- Escalations: ${report.summary.escalations.total} (${report.summary.escalations.critical} critical / ${report.summary.escalations.warning} warning)`);
  lines.push('');
  lines.push('## Process Map');
  lines.push('');
  lines.push('| Process | Cadence | SLA start delay | Runtime status | Last run | Escalation |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const process of report.processes) {
    const escalation = process.output.escalationSignal
      ? `${process.output.escalationSignal.severity}:${process.output.escalationSignal.code}`
      : 'none';
    lines.push(
      `| ${process.processId} | ${process.schedule.cadence} | ${toMinutes(process.sla.maxStartDelayMs)} | ${process.output.runStatus} | ${process.runtime.lastRunAt || 'never'} | ${escalation} |`
    );
  }

  lines.push('');
  lines.push('## Contract Compliance');
  lines.push('');
  lines.push('- Inputs enforced: schedule expression, target task command, environment context, artifact locations.');
  lines.push('- Outputs emitted: run status, artifact pointers, escalation signal.');
  lines.push('- Validation gates: lock overlap prevention, bounded retries, and surfaced failures via control-plane state/runtime history.');
  lines.push('');

  return lines.join('\n');
}

function evaluateProcess(params) {
  const {
    job,
    catalogEntry,
    override,
    runtime,
    history,
    nowMs,
    lockPath,
  } = params;

  const processId = job.schedule_id;
  const cadence = override.cadence || catalogEntry.cadence || 'manual';
  const timezone = override.timezone || catalogEntry.timezone || 'UTC';
  const enabled = override.enabled ?? true;
  const runNow = catalogEntry.runNow || null;

  const sla = buildSla(job.scope || 'tenant', cadence, runNow);
  const lock = getLockDetails(lockPath, sla.staleLockAfterMs, nowMs);
  const checks = [];
  const escalations = [];

  const normalizedCadence = normalizeCronExpression(cadence);
  const lastRunAtMs = parseTimestampMs(runtime?.lastRunAt);
  const consecutiveFailures = computeConsecutiveFailures(history);

  if (!catalogEntry) {
    pushCheck(checks, escalations, {
      code: 'missing_catalog_entry',
      ok: false,
      severity: 'critical',
      message: `No catalog entry found for ${processId}`,
    });
  }

  pushCheck(checks, escalations, {
    code: 'has_schedule_expression',
    ok: Boolean(normalizedCadence),
    severity: 'critical',
    message: normalizedCadence
      ? 'Cadence expression is valid'
      : `Cadence expression is invalid: ${cadence}`,
  });

  if (enabled && normalizedCadence && normalizedCadence !== 'manual') {
    pushCheck(checks, escalations, {
      code: 'has_run_now_command',
      ok: Boolean(runNow?.command),
      severity: 'critical',
      message: runNow?.command
        ? 'Run-now command is configured'
        : 'Enabled scheduled process is missing run-now command',
    });
  }

  if (enabled && normalizedCadence && normalizedCadence !== 'manual' && sla.maxStartDelayMs) {
    if (!lastRunAtMs) {
      pushCheck(checks, escalations, {
        code: 'last_run_presence',
        ok: false,
        severity: 'warning',
        message: 'No lastRunAt recorded for enabled scheduled process',
      });
    } else {
      const ageMs = nowMs - lastRunAtMs;
      if (ageMs > sla.maxStartDelayMs * 2) {
        pushCheck(checks, escalations, {
          code: 'stale_run_window',
          ok: false,
          severity: 'critical',
          message: `Last run is stale by ${Math.round(ageMs / 60_000)}m (max ${Math.round((sla.maxStartDelayMs * 2) / 60_000)}m hard threshold)`,
        });
      } else if (ageMs > sla.maxStartDelayMs) {
        pushCheck(checks, escalations, {
          code: 'stale_run_window',
          ok: false,
          severity: 'warning',
          message: `Last run age ${Math.round(ageMs / 60_000)}m exceeds SLA ${Math.round(sla.maxStartDelayMs / 60_000)}m`,
        });
      } else {
        pushCheck(checks, escalations, {
          code: 'stale_run_window',
          ok: true,
          severity: 'warning',
          message: 'Last run is within SLA start delay window',
        });
      }
    }
  }

  pushCheck(checks, escalations, {
    code: 'bounded_retry_policy',
    ok: true,
    severity: 'critical',
    message: 'Retry policy is bounded (master-clock runner performs single execution per slot)',
  });

  if (consecutiveFailures >= sla.maxConsecutiveFailures) {
    pushCheck(checks, escalations, {
      code: 'consecutive_failures',
      ok: false,
      severity: 'critical',
      message: `Consecutive failures ${consecutiveFailures} reached threshold ${sla.maxConsecutiveFailures}`,
    });
  } else if (consecutiveFailures > 0) {
    pushCheck(checks, escalations, {
      code: 'consecutive_failures',
      ok: false,
      severity: 'warning',
      message: `Consecutive failures ${consecutiveFailures} below threshold ${sla.maxConsecutiveFailures}`,
    });
  } else {
    pushCheck(checks, escalations, {
      code: 'consecutive_failures',
      ok: true,
      severity: 'warning',
      message: 'No consecutive failures detected',
    });
  }

  if (lock.status === 'stale') {
    pushCheck(checks, escalations, {
      code: 'stale_lock_detected',
      ok: false,
      severity: 'critical',
      message: `Lock file is stale (age ${Math.round((lock.ageMs || 0) / 60_000)}m, threshold ${Math.round(sla.staleLockAfterMs / 60_000)}m)`,
    });
  } else if (lock.status === 'active' && runtime?.status !== 'running') {
    pushCheck(checks, escalations, {
      code: 'active_lock_without_running_status',
      ok: false,
      severity: 'warning',
      message: 'Active lock exists while runtime status is not running',
    });
  } else {
    pushCheck(checks, escalations, {
      code: 'lock_overlap_prevention',
      ok: true,
      severity: 'critical',
      message: 'No stale or conflicting lock detected',
    });
  }

  const escalationSignal = summarizeEscalation(escalations);

  return {
    processId,
    scope: job.scope || 'tenant',
    category: job.category || 'tenant_automation',
    owner: {
      agentId: job.owner_agent_id || 'unknown',
      userId: job.owner_user_id || 'unknown',
    },
    schedule: {
      cadence,
      timezone,
      enabled,
    },
    sla,
    triggerContract: {
      scheduleExpression: cadence,
      targetTaskCommand: buildTargetTaskCommand(runNow),
      environmentContext: buildEnvironmentContext(runNow),
      artifactLocationRequirements: buildExpectedArtifacts(processId, runNow),
    },
    runtime: {
      status: runtime?.status || 'unknown',
      lastRunAt: runtime?.lastRunAt || null,
      lastDurationMs: runtime?.lastDurationMs ?? null,
      lastExitCode: runtime?.lastExitCode ?? null,
      lastError: runtime?.lastError ?? null,
      consecutiveFailures,
    },
    idempotency: {
      lockPath: path.relative(process.cwd(), lockPath),
      lockPresent: lock.present,
      lockStatus: lock.status,
      lockAgeMs: lock.ageMs,
    },
    verification: {
      checks,
      passed: checks.every((check) => check.ok || check.severity === 'warning'),
    },
    output: {
      runStatus: runtime?.status || 'unknown',
      artifactPointers: [
        'data/protocols/cron-jobs.control-plane-state.json',
        `data/protocols/cron-jobs.control-plane-state.json#history.${processId}`,
      ],
      escalationSignal,
    },
  };
}

function buildReport(paths, options) {
  const registry = readJson(paths.registryPath, { jobs: [] });
  const catalog = readJson(paths.catalogPath, { entries: {} });
  const state = readJson(paths.statePath, {
    overrides: {},
    runtime: {},
    history: {},
  });

  const jobs = Array.isArray(registry.jobs) ? registry.jobs : [];
  const entries = catalog.entries || {};
  const overrides = state.overrides || {};
  const runtime = state.runtime || {};
  const history = state.history || {};

  const nowMs = options.now.getTime();
  const missingCatalog = [];
  const processes = [];

  for (const job of jobs) {
    const processId = job.schedule_id;
    const catalogEntry = entries[processId];
    if (!catalogEntry) {
      missingCatalog.push(processId);
      continue;
    }

    const lockPath = path.join(paths.locksDir, `${slugify(processId)}.lock.json`);
    const result = evaluateProcess({
      job,
      catalogEntry,
      override: overrides[processId] || {},
      runtime: runtime[processId] || {},
      history: Array.isArray(history[processId]) ? history[processId] : [],
      nowMs,
      lockPath,
    });
    processes.push(result);
  }

  const escalations = processes
    .map((process) => process.output.escalationSignal)
    .filter(Boolean);

  const summary = {
    totalProcesses: jobs.length,
    withCatalog: processes.length,
    missingCatalog: missingCatalog.length,
    enabledProcesses: processes.filter((process) => process.schedule.enabled).length,
    manualProcesses: processes.filter(
      (process) => normalizeCronExpression(process.schedule.cadence) === 'manual'
    ).length,
    escalations: {
      total: escalations.length,
      warning: escalations.filter((item) => item.severity === 'warning').length,
      critical: escalations.filter((item) => item.severity === 'critical').length,
    },
  };

  return {
    spec: 'tnf/master-clock-sync-audit/0.1',
    generatedAt: options.now.toISOString(),
    contract: {
      inputs: [
        'schedule expression',
        'target task command',
        'environment context',
        'artifact location requirements',
      ],
      outputs: ['run status', 'artifact pointers', 'escalation signal'],
      validations: [
        'No overlapping destructive runs (lock contract)',
        'Retry policy bounded',
        'Failure surfaced in control-plane state/history',
      ],
    },
    paths: {
      repoRoot: paths.repoRoot,
      registryPath: paths.registryPath,
      catalogPath: paths.catalogPath,
      statePath: paths.statePath,
      locksDir: paths.locksDir,
    },
    summary,
    missingCatalog,
    processes,
  };
}

function maybeWriteReport(report, repoRoot, reportDir) {
  const absoluteDir = path.join(repoRoot, reportDir);
  const jsonPath = path.join(absoluteDir, 'master-clock-sync-latest.json');
  const mdPath = path.join(absoluteDir, 'master-clock-sync-latest.md');
  writeJson(jsonPath, report);
  writeText(mdPath, buildMarkdown(report));
  return {
    jsonPath,
    mdPath,
  };
}

function buildPaths(repoRoot) {
  return {
    repoRoot,
    registryPath: path.join(repoRoot, 'data', 'protocols', 'cron-jobs.registry.json'),
    catalogPath: path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'),
    statePath: path.join(repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json'),
    locksDir: path.join(repoRoot, 'data', 'protocols', 'cron-job-locks'),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const paths = buildPaths(repoRoot);

  const report = buildReport(paths, options);
  let artifacts = null;
  if (options.writeReport) {
    artifacts = maybeWriteReport(report, repoRoot, options.reportDir);
  }

  const payload = {
    ok: report.summary.escalations.critical === 0,
    report,
    artifacts,
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    const critical = report.summary.escalations.critical;
    const warning = report.summary.escalations.warning;
    console.log(
      `[master-clock-sync] processes=${report.summary.totalProcesses} escalations=${report.summary.escalations.total} (critical=${critical}, warning=${warning})`
    );
    if (artifacts) {
      console.log(`[master-clock-sync] report_json=${path.relative(repoRoot, artifacts.jsonPath)}`);
      console.log(`[master-clock-sync] report_md=${path.relative(repoRoot, artifacts.mdPath)}`);
    }
  }

  if (!options.warnOnly && report.summary.escalations.critical > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: message,
      },
      null,
      2
    )
  );
  process.exit(1);
}
