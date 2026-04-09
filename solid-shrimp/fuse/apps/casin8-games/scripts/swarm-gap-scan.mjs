#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const appRoot = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games';
const repoRoot = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse';

const domainMatchers = [
  { domain: 'ui-poker-room', pattern: /index\.html$|script\.js$|styles\.css$|design\/stitch\// },
  { domain: 'engine-core-app', pattern: /engine\.mjs$|engine\.test\.mjs$/ },
  { domain: 'api-server', pattern: /server\.js$|server\.test\.mjs$/ },
  { domain: 'assets-cards', pattern: /assets\/cards\// },
  { domain: 'swarm-engine', pattern: /swarm\/engine-core\// },
  { domain: 'swarm-agent-runtime', pattern: /swarm\/agent-runtime\// },
  { domain: 'swarm-realtime', pattern: /swarm\/realtime-platform\// },
  { domain: 'swarm-sponsorship', pattern: /swarm\/sponsorship-ledger\// },
  { domain: 'swarm-tournament', pattern: /swarm\/tournament\// },
  { domain: 'swarm-cashier', pattern: /swarm\/cashier-token\// },
  { domain: 'swarm-fairness', pattern: /swarm\/fairness-security\// },
  { domain: 'swarm-engine-sim', pattern: /swarm\/engine-sim\// },
  { domain: 'swarm-agent-strategy', pattern: /swarm\/agent-strategy\// },
  { domain: 'swarm-orchestrator', pattern: /swarm\/orchestrator\// },
  { domain: 'graphics-assets', pattern: /swarm\/graphics-assets\// },
  { domain: 'docs', pattern: /docs\// },
];

function rel(p) {
  const out = p.replace(`${repoRoot}/`, '');
  return out;
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function walkFiles(rootDir) {
  if (!existsSync(rootDir)) return [];
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = readdirSync(cur);
    for (const e of entries) {
      const full = path.join(cur, e);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function readStatusFiles() {
  const out = run(`git -C ${repoRoot} status --short ${appRoot}`);
  if (!out) return [];
  const raw = out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[MARCDU?]{1,2}\s+/, ''));

  const expanded = [];
  for (const item of raw) {
    if (item.endsWith('/')) {
      const fullDir = path.join(repoRoot, item);
      expanded.push(...walkFiles(fullDir));
    } else {
      expanded.push(path.join(repoRoot, item));
    }
  }
  return [...new Set(expanded)];
}

function readRecentCommitFiles() {
  const out = run(
    `git -C ${repoRoot} log --since='30 days ago' --name-only --pretty=format: -- ${appRoot}`
  );
  if (!out) return [];
  return [...new Set(out.split('\n').map((s) => s.trim()).filter((s) => s.startsWith('apps/casin8-games/')))];
}

function readWorkingTreeDiffFiles() {
  const out = run(`git -C ${repoRoot} diff --name-only -- ${appRoot}`);
  if (!out) return [];
  return [...new Set(out.split('\n').map((s) => s.trim()).filter((s) => s.startsWith('apps/casin8-games/')))];
}

function classify(file) {
  for (const m of domainMatchers) {
    if (m.pattern.test(file)) return m.domain;
  }
  return 'uncategorized';
}

const statusFiles = readStatusFiles().map((f) => rel(f));
const recentFiles = readRecentCommitFiles();
const diffFiles = readWorkingTreeDiffFiles();

const activeByDomain = {};
for (const file of [...statusFiles, ...recentFiles, ...diffFiles]) {
  const domain = classify(file);
  activeByDomain[domain] = activeByDomain[domain] || new Set();
  activeByDomain[domain].add(file);
}

const allDomains = domainMatchers.map((d) => d.domain);
const uncoveredDomains = allDomains.filter((d) => !activeByDomain[d] || activeByDomain[d].size === 0);

const report = {
  generatedAt: new Date().toISOString(),
  appRoot: rel(appRoot),
  activeDomains: Object.fromEntries(
    Object.entries(activeByDomain).map(([k, set]) => [k, [...set].slice(0, 50)])
  ),
  uncoveredDomains,
  recommendation: uncoveredDomains.length
    ? `Deploy swarm to: ${uncoveredDomains.join(', ')}`
    : 'No uncovered domains detected in current scan window.',
};

const outJson = path.join(appRoot, 'docs', 'SWARM_GAP_REPORT.json');
writeFileSync(outJson, JSON.stringify(report, null, 2));

const md = [
  '# Swarm Gap Report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Recommendation',
  report.recommendation,
  '',
  '## Uncovered Domains',
  ...(uncoveredDomains.length ? uncoveredDomains.map((d) => `- ${d}`) : ['- none']),
  '',
  '## Active Domains',
  ...Object.entries(report.activeDomains).flatMap(([domain, files]) => [
    `- ${domain}`,
    ...files.slice(0, 8).map((f) => `  - ${f}`),
  ]),
  '',
].join('\n');

writeFileSync(path.join(appRoot, 'docs', 'SWARM_GAP_REPORT.md'), md);
console.log(`Wrote ${outJson}`);
