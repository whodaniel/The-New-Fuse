#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CORE_CATEGORIES = new Set([
  'orchestration_gate',
  'self_improvement_core',
  'system_terminal_awareness',
  'federation_sync',
]);

const SIGNAL_PATTERNS = [
  /\bdeny\b/gi,
  /\bblocked\b/gi,
  /\bfreeze\b/gi,
  /\bmanual-only\b/gi,
  /\bdisabled\b/gi,
  /\brequires_approval\b/gi,
  /\bprohibit/gi,
  /\blocked\b/gi,
];

function usage() {
  console.log(
    'Usage: node .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs [--repo-root <path>] [--json]'
  );
}

function parseArgs(argv) {
  const args = { repoRoot: process.cwd(), json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--repo-root') {
      args.repoRoot = String(argv[++i] || '').trim() || args.repoRoot;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function buildCalendar(repoRoot) {
  const scriptPath = path.join(repoRoot, 'scripts', 'protocols', 'build-staff-master-calendar.cjs');
  execFileSync('node', [scriptPath], { cwd: repoRoot, stdio: 'pipe' });
}

function listFiles(rootDir, maxFiles = 2500) {
  const files = [];
  const queue = [rootDir];
  while (queue.length > 0 && files.length < maxFiles) {
    const nextDir = queue.shift();
    if (!fs.existsSync(nextDir)) continue;
    const entries = fs.readdirSync(nextDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(nextDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
      if (files.length >= maxFiles) break;
    }
  }
  return files;
}

function scoreTextSignals(text) {
  let score = 0;
  let hits = 0;
  for (const pattern of SIGNAL_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length) {
      hits += matches.length;
      score += Math.min(matches.length, 4);
    }
  }
  return { score, hits };
}

function scanPolicySignals(repoRoot) {
  const roots = [
    path.join(repoRoot, 'docs', 'protocols'),
    path.join(repoRoot, 'docs', 'operations'),
    path.join(repoRoot, 'scripts', 'protocols'),
    path.join(repoRoot, 'data', 'protocols'),
  ];

  const findings = [];
  for (const root of roots) {
    const files = listFiles(root, 1500);
    for (const filePath of files) {
      if (!/\.(md|json|yml|yaml|cjs|mjs|sh)$/.test(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8');
      const { score, hits } = scoreTextSignals(raw);
      if (hits < 3) continue;
      findings.push({
        file: path.relative(repoRoot, filePath),
        hits,
        score,
      });
    }
  }
  findings.sort((left, right) => right.score - left.score);
  return findings.slice(0, 120);
}

function evaluateScheduleFindings(calendar) {
  const findings = [];
  for (const row of calendar.scheduleRows || []) {
    if (!row.schedule?.enabled) {
      findings.push({
        severity: CORE_CATEGORIES.has(row.category) ? 'high' : 'medium',
        type: 'disabled-schedule',
        scheduleId: row.scheduleId,
        message: `${row.scheduleId} is disabled.`,
      });
    }
    if (['error', 'paused', 'manual'].includes(String(row.runtime?.status || ''))) {
      findings.push({
        severity: CORE_CATEGORIES.has(row.category) ? 'critical' : 'high',
        type: 'runtime-health',
        scheduleId: row.scheduleId,
        message: `${row.scheduleId} runtime status is ${row.runtime.status}.`,
      });
    }
    if (row.staleRunWarning) {
      findings.push({
        severity: 'high',
        type: 'stale-run-window',
        scheduleId: row.scheduleId,
        message: `${row.scheduleId} has stale-run-window warning.`,
      });
    }
    if (row.locked && row.scope === 'system_framework') {
      findings.push({
        severity: 'medium',
        type: 'locked-policy-review',
        scheduleId: row.scheduleId,
        message: `${row.scheduleId} is locked in system scope; confirm lock intent still supports growth.`,
      });
    }
    if (!row.docs?.protocol || !row.docs?.runbook) {
      findings.push({
        severity: 'medium',
        type: 'missing-doc-link',
        scheduleId: row.scheduleId,
        message: `${row.scheduleId} is missing protocol/runbook linkage.`,
      });
    }
  }
  return findings;
}

function severityRank(severity) {
  if (severity === 'critical') return 0;
  if (severity === 'high') return 1;
  if (severity === 'medium') return 2;
  return 3;
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# TNF Growth Blocker Protocol Audit');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total findings: ${report.summary.totalFindings}`);
  lines.push(`- Critical: ${report.summary.bySeverity.critical}`);
  lines.push(`- High: ${report.summary.bySeverity.high}`);
  lines.push(`- Medium: ${report.summary.bySeverity.medium}`);
  lines.push(`- Low: ${report.summary.bySeverity.low}`);
  lines.push(`- Policy signal files reviewed: ${report.summary.policySignalFiles}`);
  lines.push('');
  lines.push('## Priority Findings');
  lines.push('');
  if (!report.findings.length) {
    lines.push('- No blockers found in this run.');
  } else {
    for (const finding of report.findings.slice(0, 80)) {
      lines.push(
        `- [${finding.severity}] ${finding.type} ${finding.scheduleId ? `(${finding.scheduleId})` : ''}: ${finding.message}`
      );
    }
  }
  lines.push('');
  lines.push('## Policy Signal Hotspots');
  lines.push('');
  if (!report.policySignalHotspots.length) {
    lines.push('- None');
  } else {
    for (const hotspot of report.policySignalHotspots.slice(0, 40)) {
      lines.push(`- ${hotspot.file}: hits=${hotspot.hits} score=${hotspot.score}`);
    }
  }
  lines.push('');
  lines.push('## Suggested Remediation Loop');
  lines.push('');
  lines.push('1. Confirm each critical/high finding has a current business justification.');
  lines.push('2. Convert unjustified blockers into dated temporary controls with expiry.');
  lines.push('3. Re-run this audit after each policy mutation and compare deltas.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(args.repoRoot);

  buildCalendar(repoRoot);
  const calendarPath = path.join(repoRoot, 'data', 'protocols', 'tnf-staff-master-calendar.json');
  const calendar = readJson(calendarPath, { scheduleRows: [] });
  const scheduleFindings = evaluateScheduleFindings(calendar);
  const policySignalHotspots = scanPolicySignals(repoRoot);

  const findings = scheduleFindings.sort((left, right) => {
    const bySeverity = severityRank(left.severity) - severityRank(right.severity);
    if (bySeverity !== 0) return bySeverity;
    return String(left.scheduleId || '').localeCompare(String(right.scheduleId || ''));
  });

  const bySeverity = {
    critical: findings.filter((item) => item.severity === 'critical').length,
    high: findings.filter((item) => item.severity === 'high').length,
    medium: findings.filter((item) => item.severity === 'medium').length,
    low: findings.filter((item) => item.severity === 'low').length,
  };

  const report = {
    spec: 'tnf/growth-blocker-audit/0.1',
    generatedAt: new Date().toISOString(),
    sources: {
      calendarPath: path.relative(repoRoot, calendarPath),
    },
    summary: {
      totalFindings: findings.length,
      bySeverity,
      policySignalFiles: policySignalHotspots.length,
    },
    findings,
    policySignalHotspots,
  };

  const outDir = path.join(repoRoot, 'reports', 'protocols', 'growth-blocker-audit');
  const jsonPath = path.join(outDir, 'growth-blocker-audit-latest.json');
  const mdPath = path.join(outDir, 'growth-blocker-audit-latest.md');
  writeJson(jsonPath, report);
  writeText(mdPath, buildMarkdown(report));

  const output = {
    ok: true,
    jsonPath: path.relative(repoRoot, jsonPath),
    mdPath: path.relative(repoRoot, mdPath),
    summary: report.summary,
  };
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

main();
