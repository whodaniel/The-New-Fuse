#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/protocols/staffops-role-call.cjs [--repo-root <path>] [--json]');
}

function parseArgs(argv) {
  const args = {
    repoRoot: process.cwd(),
    json: false,
  };
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

function ensureMasterCalendar(repoRoot) {
  const scriptPath = path.join(repoRoot, 'scripts', 'protocols', 'build-staff-master-calendar.cjs');
  execFileSync('node', [scriptPath], { cwd: repoRoot, stdio: 'pipe' });
}

function summarizeRoleTags(sessions) {
  const counts = new Map();
  for (const session of sessions) {
    const tags = Array.isArray(session?.roleTags) ? session.roleTags : [];
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count);
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# TNF Staff Role Call and Scheduling Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Common Purpose');
  lines.push('');
  lines.push(
    '- Keep all cron jobs and subroutines aligned to a shared mission: sustained delivery throughput, coordination continuity, and attributable outcomes.'
  );
  lines.push('');
  lines.push('## Staff Presence');
  lines.push('');
  lines.push(`- Total known sessions: ${report.staffPresence.totalSessions}`);
  lines.push(`- Local Sub-Director owners: ${report.staffPresence.ownerSessions}`);
  lines.push(`- Staff-tagged sessions: ${report.staffPresence.staffTaggedSessions}`);
  lines.push('');
  lines.push('## Role Tag Distribution');
  lines.push('');
  if (!report.staffPresence.roleTagCounts.length) {
    lines.push('- No role tags recorded.');
  } else {
    for (const item of report.staffPresence.roleTagCounts) {
      lines.push(`- ${item.tag}: ${item.count}`);
    }
  }
  lines.push('');
  lines.push('## Schedule Coverage');
  lines.push('');
  lines.push(`- Total schedules: ${report.scheduleCoverage.totalSchedules}`);
  lines.push(`- Enabled: ${report.scheduleCoverage.enabledSchedules}`);
  lines.push(`- Disabled: ${report.scheduleCoverage.disabledSchedules}`);
  lines.push(`- Critical/High growth blockers: ${report.scheduleCoverage.highPriorityBlockers}`);
  lines.push('');
  lines.push('## Scheduling Actions');
  lines.push('');
  for (const action of report.recommendedActions) {
    lines.push(`- ${action}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(args.repoRoot);
  ensureMasterCalendar(repoRoot);

  const identityRegistryPath = path.join(
    os.homedir(),
    '.tnf',
    'session-discovery',
    'terminal-identity-registry.json'
  );
  const roleMapPath = path.join(os.homedir(), '.tnf', 'session-discovery', 'terminal-role-map.json');
  const calendarPath = path.join(repoRoot, 'data', 'protocols', 'tnf-staff-master-calendar.json');
  const growthAuditPath = path.join(
    repoRoot,
    'reports',
    'protocols',
    'growth-blocker-audit',
    'growth-blocker-audit-latest.json'
  );

  const identityRegistry = readJson(identityRegistryPath, { sessions: {} });
  const roleMap = readJson(roleMapPath, { owner: {}, aliases: {} });
  const calendar = readJson(calendarPath, { scheduleRows: [] });
  const growthAudit = readJson(growthAuditPath, { findings: [] });
  const sessions = Object.values(identityRegistry.sessions || {});
  const ownerAgentId = String(roleMap?.owner?.agentId || '').trim();

  const staffTaggedSessions = sessions.filter((session) => {
    const tags = Array.isArray(session?.roleTags) ? session.roleTags : [];
    return tags.some((tag) => String(tag).includes('staffops') || String(tag).includes('coordination'));
  });
  const ownerSessions = sessions.filter((session) => session?.isLocalSubdirectorOwner).length;
  const highPriorityBlockers = (growthAudit.findings || []).filter(
    (item) => item.severity === 'critical' || item.severity === 'high'
  );

  const recommendedActions = [
    ownerAgentId
      ? `Confirm Local Sub-Director owner remains ${ownerAgentId}.`
      : 'Assign a Local Sub-Director owner in terminal role map immediately.',
    highPriorityBlockers.length > 0
      ? `Resolve ${highPriorityBlockers.length} critical/high growth blocker findings before adding new automation.`
      : 'No critical/high blockers detected; maintain current cadence and monitor drift.',
    'Ensure every core schedule has owner + runbook + protocol links before next cycle.',
    'Require downstream processes to emit attribution evidence in run artifacts.',
    'Reinforce frontload logging + prompt-handoff protocol checks in recurring StaffOps reviews.',
    'Design per-agent tenant frontload and inter-agent handoff pipeline mapping as a tracked roadmap item.',
  ];

  const report = {
    spec: 'tnf/staff-role-call-scheduling/0.1',
    generatedAt: new Date().toISOString(),
    sources: {
      identityRegistryPath,
      roleMapPath,
      calendarPath: path.relative(repoRoot, calendarPath),
      growthAuditPath: path.relative(repoRoot, growthAuditPath),
    },
    staffPresence: {
      totalSessions: sessions.length,
      ownerSessions,
      ownerAgentId: ownerAgentId || null,
      staffTaggedSessions: staffTaggedSessions.length,
      roleTagCounts: summarizeRoleTags(sessions),
    },
    scheduleCoverage: {
      totalSchedules: (calendar.scheduleRows || []).length,
      enabledSchedules: (calendar.scheduleRows || []).filter((row) => row?.schedule?.enabled).length,
      disabledSchedules: (calendar.scheduleRows || []).filter((row) => !row?.schedule?.enabled).length,
      highPriorityBlockers: highPriorityBlockers.length,
    },
    highPriorityBlockers: highPriorityBlockers.slice(0, 40),
    recommendedActions,
  };

  const outDir = path.join(repoRoot, 'reports', 'protocols', 'staff-scheduling');
  const jsonPath = path.join(outDir, 'staff-role-call-latest.json');
  const mdPath = path.join(outDir, 'staff-role-call-latest.md');
  writeJson(jsonPath, report);
  writeText(mdPath, buildMarkdown(report));

  const output = {
    ok: true,
    jsonPath: path.relative(repoRoot, jsonPath),
    mdPath: path.relative(repoRoot, mdPath),
    summary: {
      totalSessions: report.staffPresence.totalSessions,
      ownerSessions: report.staffPresence.ownerSessions,
      totalSchedules: report.scheduleCoverage.totalSchedules,
      highPriorityBlockers: report.scheduleCoverage.highPriorityBlockers,
    },
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

main();
