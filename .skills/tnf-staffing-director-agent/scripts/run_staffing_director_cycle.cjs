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
      console.log('Usage: node .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs [--repo-root <path>] [--json]');
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

function listNamesByDir(dirPath, suffix = '') {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const names = [];

  for (const entry of entries) {
    if (suffix) {
      if (entry.isFile() && entry.name.endsWith(suffix)) {
        names.push(entry.name.slice(0, -suffix.length));
      }
    } else if (entry.isDirectory()) {
      names.push(entry.name);
    }
  }

  return names.sort();
}

function toMd(report) {
  const lines = [];
  lines.push('# TNF Staffing Director Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Coverage Summary');
  lines.push('');
  lines.push(`- Registered agents: ${report.summary.registeredAgents}`);
  lines.push(`- Registered skills: ${report.summary.registeredSkills}`);
  lines.push(`- Schedules: ${report.summary.totalSchedules}`);
  lines.push(`- Staff coordination schedules: ${report.summary.staffCoordinationSchedules}`);
  lines.push(`- Staff architecture schedules: ${report.summary.staffArchitectureSchedules}`);
  lines.push(`- Staff review schedules: ${report.summary.staffReviewSchedules}`);
  lines.push(`- High-priority blocker findings: ${report.summary.highPriorityBlockers}`);
  lines.push('');
  lines.push('## Niche Gaps');
  lines.push('');

  if (!report.nicheGaps.length) {
    lines.push('- None detected.');
  } else {
    for (const gap of report.nicheGaps) {
      lines.push(`- [${gap.severity}] ${gap.code}: ${gap.message}`);
    }
  }

  lines.push('');
  lines.push('## Role + Skill Proposals');
  lines.push('');

  for (const proposal of report.roleSkillProposals) {
    lines.push(`- ${proposal.roleId} -> ${proposal.skillName} (${proposal.status})`);
    lines.push(`  rationale: ${proposal.rationale}`);
  }

  lines.push('');
  lines.push('## Next Actions');
  lines.push('');

  for (const action of report.nextActions) {
    lines.push(`- ${action}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const options = parseArgs(process.argv);
  const repoRoot = options.repoRoot;

  const registryPath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
  const growthPath = path.join(
    repoRoot,
    'reports',
    'protocols',
    'growth-blocker-audit',
    'growth-blocker-audit-latest.json'
  );

  const registry = readJson(registryPath, { jobs: [] });
  const growth = readJson(growthPath, { findings: [] });
  const jobs = Array.isArray(registry.jobs) ? registry.jobs : [];
  const findings = Array.isArray(growth.findings) ? growth.findings : [];

  const agentNames = listNamesByDir(path.join(repoRoot, '.claude', 'agents'), '.md');
  const skillNames = listNamesByDir(path.join(repoRoot, '.skills'));

  const hasStaffingDirectorRole = agentNames.includes('staffing-director-agent');
  const hasStaffReviewRole = agentNames.includes('staff-review-agent');
  const hasStaffingSkill = skillNames.includes('tnf-staffing-director-agent');
  const hasStaffReviewSkill = skillNames.includes('tnf-staff-review-agent');

  const staffCoordinationSchedules = jobs.filter((job) => job.category === 'staff_coordination');
  const staffArchitectureSchedules = jobs.filter((job) => job.category === 'staff_architecture');
  const staffReviewSchedules = jobs.filter((job) => job.category === 'staff_review');
  const highPriorityBlockers = findings.filter(
    (item) => item && (item.severity === 'critical' || item.severity === 'high')
  );

  const nicheGaps = [];

  if (!hasStaffingDirectorRole) {
    nicheGaps.push({
      severity: 'critical',
      code: 'missing_staffing_director_role',
      message: 'No Staffing Director agent role is registered in .claude/agents.',
    });
  }

  if (!hasStaffReviewRole) {
    nicheGaps.push({
      severity: 'high',
      code: 'missing_staff_review_role',
      message: 'No Staff Review agent role is registered in .claude/agents.',
    });
  }

  if (!hasStaffingSkill) {
    nicheGaps.push({
      severity: 'high',
      code: 'missing_staffing_skill',
      message: 'No staffing director skill is registered in .skills.',
    });
  }

  if (!hasStaffReviewSkill) {
    nicheGaps.push({
      severity: 'high',
      code: 'missing_staff_review_skill',
      message: 'No staff review skill is registered in .skills.',
    });
  }

  if (staffCoordinationSchedules.length + staffArchitectureSchedules.length < 2) {
    nicheGaps.push({
      severity: 'medium',
      code: 'low_staff_coordination_schedule_coverage',
      message: 'Staff coordination/architecture coverage has fewer than two recurring schedules.',
    });
  }

  if (staffReviewSchedules.length < 1) {
    nicheGaps.push({
      severity: 'medium',
      code: 'missing_staff_review_schedule',
      message: 'No recurring schedule exists for staff review cycles.',
    });
  }

  if (highPriorityBlockers.length > 0) {
    nicheGaps.push({
      severity: 'medium',
      code: 'blocker_driven_staffing_pressure',
      message: `${highPriorityBlockers.length} critical/high blocker findings indicate potential staffing specialization gaps.`,
    });
  }

  const roleSkillProposals = [
    {
      roleId: 'tnf-staffops-staffing-director-01',
      skillName: 'tnf-staffing-director-agent',
      status: hasStaffingDirectorRole && hasStaffingSkill ? 'implemented' : 'proposed',
      rationale:
        'Maintains corporation-wide staffing architecture and proposes new role+skill packages for uncovered niches.',
    },
    {
      roleId: 'tnf-staffops-staff-review-01',
      skillName: 'tnf-staff-review-agent',
      status: hasStaffReviewRole && hasStaffReviewSkill ? 'implemented' : 'proposed',
      rationale:
        'Runs periodic review of recent staff outputs and publishes ranked improvement recommendations.',
    },
  ];

  const nextActions = [
    'Ensure Staffing Director and Staff Review schedules are enabled in cron governance control plane.',
    'Require each proposed niche role to include an associated skill and runbook reference before activation.',
    'Route high-severity blocker findings into staffing proposals when ownership gaps repeat across cycles.',
  ];

  const report = {
    spec: 'tnf/staffing-director-report/0.1',
    generatedAt: new Date().toISOString(),
    sources: {
      registryPath: path.relative(repoRoot, registryPath),
      growthAuditPath: path.relative(repoRoot, growthPath),
    },
    summary: {
      registeredAgents: agentNames.length,
      registeredSkills: skillNames.length,
      totalSchedules: jobs.length,
      staffCoordinationSchedules: staffCoordinationSchedules.length,
      staffArchitectureSchedules: staffArchitectureSchedules.length,
      staffReviewSchedules: staffReviewSchedules.length,
      highPriorityBlockers: highPriorityBlockers.length,
      nicheGapCount: nicheGaps.length,
    },
    nicheGaps,
    roleSkillProposals,
    nextActions,
  };

  const outputDir = path.join(repoRoot, 'reports', 'protocols', 'staffing-director');
  const jsonPath = path.join(outputDir, 'staffing-director-latest.json');
  const mdPath = path.join(outputDir, 'staffing-director-latest.md');
  writeJson(jsonPath, report);
  writeText(mdPath, toMd(report));

  appendJsonl(path.join(repoRoot, 'logs', 'staffops-staffing.jsonl'), {
    generatedAt: report.generatedAt,
    summary: report.summary,
    nicheGapCount: report.nicheGaps.length,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary: report.summary,
        jsonPath: path.relative(repoRoot, jsonPath),
        mdPath: path.relative(repoRoot, mdPath),
      },
      null,
      2
    )
  );
}

main();
