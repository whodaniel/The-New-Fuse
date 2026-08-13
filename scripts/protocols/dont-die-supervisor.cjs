#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const DEFAULT_REPORT_DIR = path.join('reports', 'protocols', 'dont-die-supervisor');
const DEFAULT_MAX_RUNS = 25;
const DEFAULT_AUDIT_SCRIPT = path.join('scripts', 'protocols', 'master-clock-sync-audit.cjs');
const DEFAULT_RUNNER_SCRIPT = path.join('scripts', 'protocols', 'run-chronological-process.cjs');

function parseArgs(argv) {
  const options = {
    repoRoot: process.env.TNF_REPO_ROOT || '',
    actorId: 'tnf-dont-die-supervisor',
    maxRuns: DEFAULT_MAX_RUNS,
    includeWarnings: false,
    processIds: [],
    dryRun: false,
    json: false,
    warnOnly: false,
    writeReport: true,
    reportDir: DEFAULT_REPORT_DIR,
    allowLocalDispatchFallback: true,
    lockSweep: true,
    now: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo-root') {
      options.repoRoot = argv[++i] || '';
    } else if (arg === '--actor-id') {
      options.actorId = argv[++i] || options.actorId;
    } else if (arg === '--max-runs') {
      options.maxRuns = Number(argv[++i] || DEFAULT_MAX_RUNS);
    } else if (arg === '--include-warnings') {
      options.includeWarnings = true;
    } else if (arg === '--process-id') {
      const processId = argv[++i] || '';
      if (processId.trim()) {
        options.processIds.push(processId.trim());
      }
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--warn-only') {
      options.warnOnly = true;
    } else if (arg === '--no-write-report') {
      options.writeReport = false;
    } else if (arg === '--report-dir') {
      options.reportDir = argv[++i] || DEFAULT_REPORT_DIR;
    } else if (arg === '--no-local-dispatch-fallback') {
      options.allowLocalDispatchFallback = false;
    } else if (arg === '--skip-lock-sweep') {
      options.lockSweep = false;
    } else if (arg === '--now') {
      const value = argv[++i] || '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --now timestamp: ${value}`);
      }
      options.now = parsed.toISOString();
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isFinite(options.maxRuns) || options.maxRuns < 0) {
    throw new Error('--max-runs must be a non-negative integer');
  }
  options.maxRuns = Math.floor(options.maxRuns);

  return options;
}

function printUsage() {
  console.log(
    [
      'Usage: node scripts/protocols/dont-die-supervisor.cjs [options]',
      '',
      'Options:',
      '  --repo-root <path>              Override repository root',
      '  --actor-id <id>                 Actor id for run records',
      `  --max-runs <n>                  Max remediations per execution (default: ${DEFAULT_MAX_RUNS})`,
      '  --process-id <id>               Restrict remediation to specific process id (repeatable)',
      '  --include-warnings              Include warning-severity escalations',
      '  --dry-run                       Compute actions without executing process runs',
      '  --json                          Print JSON output',
      '  --warn-only                     Exit 0 even when critical escalations remain',
      '  --no-write-report               Do not write report artifacts to disk',
      `  --report-dir <path>             Supervisor report directory (default: ${DEFAULT_REPORT_DIR})`,
      '  --now <iso>                     Override current timestamp for audit comparisons',
      '  --no-local-dispatch-fallback    Do not force local fallback for chronological dispatch',
      '  --skip-lock-sweep               Do not clear stale lock files before remediation',
      '  -h, --help                      Show help',
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

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function writeText(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, payload, 'utf8');
}

function parseJsonPayload(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function normalizeSeverity(severity) {
  return severity === 'critical' || severity === 'warning' ? severity : 'info';
}

function shouldIncludeEscalation(processSnapshot, options) {
  if (!processSnapshot?.schedule?.enabled) return false;
  if (options.processIds.length && !options.processIds.includes(processSnapshot.processId)) {
    return false;
  }

  const escalation = processSnapshot.output?.escalationSignal;
  if (!escalation) return false;
  const severity = normalizeSeverity(escalation.severity);
  if (severity === 'warning' && !options.includeWarnings) return false;
  return severity === 'critical' || severity === 'warning';
}

function buildEscalationLookup(report) {
  const lookup = new Map();
  for (const processSnapshot of report?.processes || []) {
    lookup.set(processSnapshot.processId, processSnapshot.output?.escalationSignal || null);
  }
  return lookup;
}

async function runAudit(repoRoot, options) {
  const args = [
    path.join(repoRoot, DEFAULT_AUDIT_SCRIPT),
    '--repo-root',
    repoRoot,
    '--json',
    '--warn-only',
  ];
  if (!options.writeReport) {
    args.push('--no-write-report');
  }
  if (options.now) {
    args.push('--now', options.now);
  }

  const result = await execFileAsync('node', args, {
    cwd: repoRoot,
    env: process.env,
    maxBuffer: 1024 * 1024 * 6,
  });

  const parsed = parseJsonPayload(result.stdout);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Failed to parse master-clock-sync-audit output');
  }
  if (!parsed.report) {
    throw new Error('master-clock-sync-audit output is missing report payload');
  }
  return parsed;
}

function sweepStaleLock(repoRoot, processSnapshot, options) {
  if (!options.lockSweep) return null;
  if (processSnapshot?.idempotency?.lockStatus !== 'stale') return null;

  const lockRel = processSnapshot.idempotency.lockPath;
  if (!lockRel) return null;

  const lockPath = path.join(repoRoot, lockRel);
  if (!fs.existsSync(lockPath)) {
    return {
      attempted: true,
      removed: false,
      lockPath: lockRel,
      reason: 'missing',
    };
  }

  fs.rmSync(lockPath, { force: true });
  return {
    attempted: true,
    removed: true,
    lockPath: lockRel,
    reason: 'stale-lock-swept',
  };
}

async function runProcess(repoRoot, processId, options) {
  if (options.dryRun) {
    return {
      ok: true,
      skipped: 'dry-run',
      processId,
      run: null,
    };
  }

  const args = [
    path.join(repoRoot, DEFAULT_RUNNER_SCRIPT),
    '--repo-root',
    repoRoot,
    '--process-id',
    processId,
    '--actor-id',
    options.actorId,
  ];

  const env = {
    ...process.env,
  };
  if (options.allowLocalDispatchFallback) {
    env.TNF_ALLOW_LOCAL_DISPATCH_FALLBACK = 'true';
    env.ALLOW_LOCAL_DISPATCH_FALLBACK = 'true';
  }

  try {
    const result = await execFileAsync('node', args, {
      cwd: repoRoot,
      env,
      maxBuffer: 1024 * 1024 * 6,
    });
    const parsed = parseJsonPayload(result.stdout) || parseJsonPayload(result.stderr);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {
      ok: true,
      processId,
      run: {
        status: 'healthy',
        outputPreview: String(result.stdout || '').trim() || null,
      },
    };
  } catch (error) {
    const execError = error;
    const parsed =
      parseJsonPayload(execError.stdout) || parseJsonPayload(execError.stderr) || parseJsonPayload(execError.message);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {
      ok: false,
      processId,
      error: execError.message || 'run-chronological-process failed',
      code: execError.code,
    };
  }
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# TNF Don\'t Die Supervisor Report');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Repo root: ${report.repoRoot}`);
  lines.push(`- Dry run: ${report.options.dryRun}`);
  lines.push(`- Max runs: ${report.options.maxRuns}`);
  lines.push('');
  lines.push('## Escalation Delta');
  lines.push('');
  lines.push(`- Before critical/warning: ${report.before.summary.escalations.critical}/${report.before.summary.escalations.warning}`);
  lines.push(`- After critical/warning: ${report.after.summary.escalations.critical}/${report.after.summary.escalations.warning}`);
  lines.push('');
  lines.push('## Remediation Totals');
  lines.push('');
  lines.push(`- Considered: ${report.remediation.considered}`);
  lines.push(`- Attempted: ${report.remediation.totals.attempted}`);
  lines.push(`- Successful: ${report.remediation.totals.successful}`);
  lines.push(`- Failed: ${report.remediation.totals.failed}`);
  lines.push(`- Stale locks swept: ${report.remediation.totals.locksSwept}`);
  lines.push(`- Unresolved missing run-now: ${report.remediation.unresolved.length}`);
  lines.push('');

  if (report.remediation.attempts.length) {
    lines.push('## Attempts');
    lines.push('');
    lines.push('| Process ID | Before Escalation | Run Result | Lock Sweep |');
    lines.push('| --- | --- | --- | --- |');
    for (const attempt of report.remediation.attempts) {
      const runResult = attempt.result?.ok === true ? 'ok' : `failed (${attempt.result?.error || attempt.result?.run?.status || 'error'})`;
      const lockSweep = attempt.lockSweep?.removed ? 'removed' : attempt.lockSweep?.attempted ? attempt.lockSweep.reason : 'none';
      lines.push(`| ${attempt.processId} | ${attempt.beforeEscalation || 'none'} | ${runResult} | ${lockSweep} |`);
    }
    lines.push('');
  }

  if (report.remediation.unresolved.length) {
    lines.push('## Unresolved');
    lines.push('');
    for (const item of report.remediation.unresolved) {
      lines.push(`- ${item.processId}: ${item.reason}`);
    }
    lines.push('');
  }

  lines.push('## Bridge Contract');
  lines.push('');
  lines.push('- Source: master-clock-sync-audit -> deterministic remediation queue');
  lines.push('- Target: run-chronological-process with lock-safe execution and runtime-state history updates');
  lines.push('- Validation: before/after audit summaries, per-process run result capture, unresolved catalog gaps surfaced');
  lines.push('- Failure handling: stale-lock sweep + unresolved process registry for missing run-now commands');

  return `${lines.join('\n')}\n`;
}

function maybeWriteReport(repoRoot, reportDir, report) {
  const absoluteReportDir = path.resolve(repoRoot, reportDir);
  const timestamp = new Date(report.generatedAt).toISOString().replace(/[:]/g, '-');
  const latestJsonPath = path.join(absoluteReportDir, 'dont-die-latest.json');
  const latestMdPath = path.join(absoluteReportDir, 'dont-die-latest.md');
  const runJsonPath = path.join(absoluteReportDir, `dont-die-${timestamp}.json`);

  writeJson(latestJsonPath, report);
  writeJson(runJsonPath, report);
  writeText(latestMdPath, buildMarkdown(report));

  return {
    reportDir: absoluteReportDir,
    latestJsonPath,
    latestMdPath,
    runJsonPath,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = resolveRepoRoot(options.repoRoot);

  const beforeAudit = await runAudit(repoRoot, options);
  const processSnapshots = beforeAudit.report.processes || [];

  const actionable = [];
  const unresolved = [];
  const skipped = [];

  for (const processSnapshot of processSnapshots) {
    if (!shouldIncludeEscalation(processSnapshot, options)) continue;

    const escalation = processSnapshot.output?.escalationSignal;
    if (!processSnapshot.triggerContract?.targetTaskCommand) {
      unresolved.push({
        processId: processSnapshot.processId,
        reason: escalation?.message || 'No run-now command configured in process catalog',
        escalation,
      });
      continue;
    }

    if (processSnapshot.runtime?.status === 'running' && processSnapshot.idempotency?.lockStatus === 'active') {
      skipped.push({
        processId: processSnapshot.processId,
        reason: 'Process is already running with active lock',
      });
      continue;
    }

    actionable.push(processSnapshot);
  }

  const queue = actionable.slice(0, options.maxRuns);
  const attempts = [];

  for (const processSnapshot of queue) {
    const lockSweep = sweepStaleLock(repoRoot, processSnapshot, options);
    const result = await runProcess(repoRoot, processSnapshot.processId, options);

    attempts.push({
      processId: processSnapshot.processId,
      beforeEscalation: processSnapshot.output?.escalationSignal
        ? `${processSnapshot.output.escalationSignal.severity}:${processSnapshot.output.escalationSignal.code}`
        : null,
      lockSweep,
      result,
    });
  }

  const afterAudit = await runAudit(repoRoot, options);
  const beforeEscalations = buildEscalationLookup(beforeAudit.report);
  const afterEscalations = buildEscalationLookup(afterAudit.report);

  const attemptsWithDelta = attempts.map((attempt) => ({
    ...attempt,
    beforeSignal: beforeEscalations.get(attempt.processId) || null,
    afterSignal: afterEscalations.get(attempt.processId) || null,
  }));

  const successfulAttempts = attemptsWithDelta.filter((attempt) => attempt.result?.ok === true).length;
  const failedAttempts = attemptsWithDelta.length - successfulAttempts;
  const locksSwept = attemptsWithDelta.filter((attempt) => attempt.lockSweep?.removed).length;

  const report = {
    spec: 'tnf/dont-die-supervisor-report/0.1',
    generatedAt: new Date().toISOString(),
    repoRoot,
    options: {
      actorId: options.actorId,
      maxRuns: options.maxRuns,
      includeWarnings: options.includeWarnings,
      processIds: options.processIds,
      dryRun: options.dryRun,
      allowLocalDispatchFallback: options.allowLocalDispatchFallback,
      lockSweep: options.lockSweep,
      now: options.now,
    },
    bridgeContract: {
      sourceSkills: ['tnf-stack-self-improvement-loop', 'tnf-skill-bridging'],
      sourceArtifacts: [
        'reports/protocols/master-clock-sync/master-clock-sync-latest.json',
        'data/protocols/cron-jobs.control-plane-state.json',
      ],
      handoffSchema: {
        processId: 'string',
        severity: 'critical|warning',
        targetTaskCommand: 'string|null',
        lockStatus: 'none|active|stale|invalid',
      },
      validation: [
        'Before/after escalation counters are captured for same repo state window',
        'Each attempted remediation emits run result from run-chronological-process',
        'Missing run-now commands are surfaced in unresolved list',
      ],
      failureHandling: [
        'Stale locks are swept before retry when configured',
        'Failed process executions remain in report with error payload',
        'Command exits non-zero when critical escalations remain unless --warn-only is set',
      ],
    },
    before: {
      ok: beforeAudit.ok,
      summary: beforeAudit.report.summary,
    },
    remediation: {
      considered: actionable.length,
      attemptedCap: options.maxRuns,
      skippedDueToCap: Math.max(actionable.length - queue.length, 0),
      attempts: attemptsWithDelta,
      unresolved,
      skipped,
      totals: {
        attempted: attemptsWithDelta.length,
        successful: successfulAttempts,
        failed: failedAttempts,
        locksSwept,
      },
    },
    after: {
      ok: afterAudit.ok,
      summary: afterAudit.report.summary,
    },
  };

  let artifacts = null;
  if (options.writeReport) {
    artifacts = maybeWriteReport(repoRoot, options.reportDir, report);
  }

  const output = {
    ok: report.after.summary.escalations.critical === 0,
    report,
    artifacts,
  };

  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      [
        `[dont-die] considered=${report.remediation.considered} attempted=${report.remediation.totals.attempted} success=${report.remediation.totals.successful} failed=${report.remediation.totals.failed}`,
        `[dont-die] escalations_before=${report.before.summary.escalations.critical}/${report.before.summary.escalations.warning}`,
        `[dont-die] escalations_after=${report.after.summary.escalations.critical}/${report.after.summary.escalations.warning}`,
        artifacts?.latestJsonPath ? `[dont-die] report_json=${path.relative(repoRoot, artifacts.latestJsonPath)}` : '',
        artifacts?.latestMdPath ? `[dont-die] report_md=${path.relative(repoRoot, artifacts.latestMdPath)}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (!options.warnOnly && report.after.summary.escalations.critical > 0) {
    process.exit(2);
  }

  if (!options.warnOnly && report.remediation.totals.failed > 0) {
    process.exit(3);
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
