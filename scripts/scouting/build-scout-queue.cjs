#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const revenuePath = path.join(repoRoot, 'data/business/revenue-channel-registry.json');
const platformsPath = path.join(repoRoot, 'data/agent-ecosystem/platform-capabilities.json');
const outputDir = path.join(repoRoot, 'reports/scouting');
const outputJson = path.join(outputDir, 'scout-queue.json');
const outputMd = path.join(outputDir, 'scout-queue.md');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function daysUntil(target, now) {
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function priorityRank(priority) {
  return ({ high: 0, medium: 1, watch: 2, low: 3 })[priority] ?? 4;
}

const nowArg = process.argv.find((arg) => arg.startsWith('--now='));
const now = nowArg ? new Date(nowArg.slice('--now='.length)) : new Date();
if (Number.isNaN(now.getTime())) throw new Error('Invalid --now ISO date');

const revenue = readJson(revenuePath);
const platforms = readJson(platformsPath);
const tasks = [];

for (const channel of revenue.channels || []) {
  const staleDays = channel.staleAfterDays ?? revenue.policy?.defaultStaleAfterDays ?? 45;
  const due = addDays(channel.verifiedAt, staleDays);
  const remaining = daysUntil(due, now);
  if (remaining <= 14 || channel.priority === 'high') {
    tasks.push({
      kind: 'revenue-program',
      id: `${channel.provider}:${channel.program}`,
      provider: channel.provider,
      priority: channel.priority || 'medium',
      verifiedAt: channel.verifiedAt,
      staleAt: due.toISOString(),
      daysUntilStale: remaining,
      source: channel.source,
      status: channel.status,
      nextAction: channel.nextAction,
      scoutQuestions: [
        'Does the program still exist and accept applicants?',
        'Have commission/revenue-share/credit terms changed?',
        'Have eligibility, geography, payout, disclosure, or integration requirements changed?',
        'Is there a new affiliate/referral/channel/marketplace path from the same provider?',
        'Would participation still preserve TNF vendor neutrality and user value?'
      ]
    });
  }
}

for (const platform of platforms.platforms || []) {
  const staleDays = platform.staleAfterDays ?? platforms.defaultStaleAfterDays ?? 30;
  const due = addDays(platform.verifiedAt, staleDays);
  const remaining = daysUntil(due, now);
  if (remaining <= 14) {
    tasks.push({
      kind: 'agent-platform',
      id: platform.id,
      provider: platform.provider,
      priority: 'high',
      verifiedAt: platform.verifiedAt,
      staleAt: due.toISOString(),
      daysUntilStale: remaining,
      source: platform.source,
      status: platform.status,
      scoutQuestions: [
        'What new agent, scheduling, skills, tool, MCP, connector, app-action, memory, or collaboration capabilities shipped?',
        'What APIs/webhooks/export surfaces now expose instance state or activity?',
        'What limits, pricing, quotas, privacy, retention, or approval semantics changed?',
        'Can TNF integrate more directly while exchanging less context and fewer secrets?',
        'What capabilities should be added to TNF routing/staffing intelligence?'
      ]
    });
  }
}

tasks.sort((a, b) => {
  const p = priorityRank(a.priority) - priorityRank(b.priority);
  if (p) return p;
  return a.daysUntilStale - b.daysUntilStale || a.id.localeCompare(b.id);
});

const payload = {
  schemaVersion: '1.0.0',
  generatedAt: now.toISOString(),
  policy: {
    localFirst: true,
    noPaidCloudRequired: true,
    officialSourcesPreferred: true,
    createIssueOnlyForMaterialChange: true
  },
  tasks
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(payload, null, 2)}\n`);

const lines = [
  '# TNF Ecosystem Scout Queue',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tasks: ${tasks.length}`,
  ''
];
for (const task of tasks) {
  lines.push(`## ${task.id}`);
  lines.push('');
  lines.push(`- Kind: ${task.kind}`);
  lines.push(`- Priority: ${task.priority}`);
  lines.push(`- Verified: ${task.verifiedAt}`);
  lines.push(`- Days until stale: ${task.daysUntilStale}`);
  lines.push(`- Status: ${task.status}`);
  lines.push(`- Source: ${Array.isArray(task.source) ? task.source.join(', ') : task.source}`);
  if (task.nextAction) lines.push(`- Next action: ${task.nextAction}`);
  lines.push('- Questions:');
  for (const question of task.scoutQuestions) lines.push(`  - ${question}`);
  lines.push('');
}
fs.writeFileSync(outputMd, `${lines.join('\n')}\n`);

console.log(JSON.stringify({ outputJson, outputMd, tasks: tasks.length }, null, 2));
