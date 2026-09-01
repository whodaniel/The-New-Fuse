#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    json: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--repo-root') {
      options.repoRoot = path.resolve(String(argv[++i] || '').trim() || options.repoRoot);
    } else if (token === '--json') {
      options.json = true;
    } else if (token === '--help' || token === '-h') {
      console.log('Usage: node .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs [--repo-root <path>] [--json]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return options;
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
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeText(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, payload, 'utf8');
}

function appendJsonl(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function toMd(report) {
  const lines = [];
  lines.push('# TNF Staff Review Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Snapshot');
  lines.push('');
  lines.push(`- Critical escalations: ${report.snapshot.masterClockCriticalEscalations}`);
  lines.push(`- Warning escalations: ${report.snapshot.masterClockWarningEscalations}`);
  lines.push(`- Dont-die attempts failed: ${report.snapshot.dontDieFailedAttempts}`);
  lines.push(`- High-priority blockers: ${report.snapshot.highPriorityBlockers}`);
  lines.push(`- Staff owner sessions: ${report.snapshot.ownerSessions}`);
  lines.push('');
  lines.push('## Recommendations');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`- [${rec.priority}] ${rec.title} (${rec.ownerSuggestion})`);
    lines.push(`  action: ${rec.action}`);
  }
  lines.push('');
  lines.push('## Follow-up Checkpoints');
  lines.push('');
  for (const checkpoint of report.followUpCheckpoints) {
    lines.push(`- ${checkpoint}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const options = parseArgs(process.argv);
  const repoRoot = options.repoRoot;

  const paths = {
    masterClock: path.join(repoRoot, 'reports', 'protocols', 'master-clock-sync', 'master-clock-sync-latest.json'),
    dontDie: path.join(repoRoot, 'reports', 'protocols', 'dont-die-supervisor', 'dont-die-latest.json'),
    blockers: path.join(repoRoot, 'reports', 'protocols', 'growth-blocker-audit', 'growth-blocker-audit-latest.json'),
    roleCall: path.join(repoRoot, 'reports', 'protocols', 'staff-scheduling', 'staff-role-call-latest.json'),
    staffing: path.join(repoRoot, 'reports', 'protocols', 'staffing-director', 'staffing-director-latest.json'),
  };

  const masterClock = readJson(paths.masterClock, { report: { summary: { escalations: { critical: 0, warning: 0 } } } });
  const dontDie = readJson(paths.dontDie, { report: { remediation: { totals: { failed: 0 } } } });
  const blockers = readJson(paths.blockers, { findings: [] });
  const roleCall = readJson(paths.roleCall, { staffPresence: { ownerSessions: 0 }, scheduleCoverage: { totalSchedules: 0 } });
  const staffing = readJson(paths.staffing, { summary: { nicheGapCount: 0 } });

  const critical = Number(masterClock?.report?.summary?.escalations?.critical || 0);
  const warning = Number(masterClock?.report?.summary?.escalations?.warning || 0);
  const dontDieFailed = Number(dontDie?.report?.remediation?.totals?.failed || 0);
  const highPriorityBlockers = Array.isArray(blockers.findings)
    ? blockers.findings.filter((item) => item && (item.severity === 'critical' || item.severity === 'high')).length
    : 0;
  const ownerSessions = Number(roleCall?.staffPresence?.ownerSessions || 0);
  const staffingGapCount = Number(staffing?.summary?.nicheGapCount || 0);

  const recommendations = [];

  if (critical > 0) {
    recommendations.push({
      priority: 'P0',
      title: 'Clear critical master-clock escalations',
      ownerSuggestion: 'tnf-staffops-local-subdirector-01',
      action: 'Run dont-die supervisor and verify critical escalation count returns to zero.',
    });
  }

  if (dontDieFailed > 0) {
    recommendations.push({
      priority: 'P1',
      title: 'Resolve failed remediation attempts',
      ownerSuggestion: 'tnf-staffops-staff-review-01',
      action: 'Inspect dont-die failure payloads and assign targeted fixes to process owners.',
    });
  }

  if (ownerSessions !== 1) {
    recommendations.push({
      priority: 'P1',
      title: 'Normalize Local Sub-Director owner session count',
      ownerSuggestion: 'tnf-staffops-staffing-director-01',
      action: 'Enforce exactly one owner session and reconcile terminal role-map assignments.',
    });
  }

  if (highPriorityBlockers > 0) {
    recommendations.push({
      priority: 'P1',
      title: 'Close high-priority growth blockers',
      ownerSuggestion: 'tnf-growth-blocker-auditor',
      action: 'Convert critical/high blocker findings into scheduled remediation tasks with explicit owners.',
    });
  }

  if (staffingGapCount > 0) {
    recommendations.push({
      priority: 'P2',
      title: 'Address staffing architecture gaps',
      ownerSuggestion: 'tnf-staffops-staffing-director-01',
      action: 'Implement approved role+skill proposals from staffing director report.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'P3',
      title: 'Maintain current operating posture',
      ownerSuggestion: 'tnf-staffops-staff-review-01',
      action: 'No urgent issues found; continue periodic review and report deltas.',
    });
  }

  const report = {
    spec: 'tnf/staff-review-report/0.1',
    generatedAt: new Date().toISOString(),
    sources: Object.fromEntries(
      Object.entries(paths).map(([key, value]) => [key, path.relative(repoRoot, value)])
    ),
    snapshot: {
      masterClockCriticalEscalations: critical,
      masterClockWarningEscalations: warning,
      dontDieFailedAttempts: dontDieFailed,
      highPriorityBlockers,
      ownerSessions,
      staffingGapCount,
    },
    recommendations,
    followUpCheckpoints: [
      'Re-run staff review on next cycle and compare escalation deltas.',
      'Validate each P0/P1 recommendation has an accountable owner and a due schedule.',
      'Record closure evidence in protocol reports and StaffOps logs.',
    ],
  };

  const outputDir = path.join(repoRoot, 'reports', 'protocols', 'staff-review');
  const jsonPath = path.join(outputDir, 'staff-review-latest.json');
  const mdPath = path.join(outputDir, 'staff-review-latest.md');
  writeJson(jsonPath, report);
  writeText(mdPath, toMd(report));

  appendJsonl(path.join(repoRoot, 'logs', 'staffops-review.jsonl'), {
    generatedAt: report.generatedAt,
    snapshot: report.snapshot,
    recommendationCount: report.recommendations.length,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        snapshot: report.snapshot,
        recommendationCount: report.recommendations.length,
        jsonPath: path.relative(repoRoot, jsonPath),
        mdPath: path.relative(repoRoot, mdPath),
      },
      null,
      2
    )
  );
}

main();
