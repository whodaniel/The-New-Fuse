#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  buildWorkQueue,
  assignWorkLanes,
  detectAssignmentCollisions,
  buildExecutionBoard,
} from '../swarm/orchestrator/index.mjs';

const appRoot = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games';
const docsDir = path.join(appRoot, 'docs');
const gapPath = path.join(docsDir, 'SWARM_GAP_REPORT.json');

const REQUIRED_STREAMS = [
  { stream: 'engine-core', domain: 'swarm-engine', evidence: ['swarm/engine-core/index.mjs'] },
  { stream: 'engine-sim', domain: 'swarm-engine-sim', evidence: ['swarm/engine-sim/index.mjs'] },
  { stream: 'agent-runtime', domain: 'swarm-agent-runtime', evidence: ['swarm/agent-runtime/index.mjs'] },
  { stream: 'agent-strategy', domain: 'swarm-agent-strategy', evidence: ['swarm/agent-strategy/index.mjs'] },
  { stream: 'sponsorship-ledger', domain: 'swarm-sponsorship', evidence: ['swarm/sponsorship-ledger/index.mjs'] },
  { stream: 'tournaments', domain: 'swarm-tournament', evidence: ['swarm/tournament/index.mjs'] },
  { stream: 'cashier-token', domain: 'swarm-cashier', evidence: ['swarm/cashier-token/index.mjs'] },
  { stream: 'fairness-security', domain: 'swarm-fairness', evidence: ['swarm/fairness-security/index.mjs'] },
  { stream: 'realtime-platform', domain: 'swarm-realtime', evidence: ['swarm/realtime-platform/index.mjs'] },
  { stream: 'orchestrator', domain: 'swarm-orchestrator', evidence: ['swarm/orchestrator/index.mjs'] },
  { stream: 'graphics-assets', domain: 'graphics-assets', evidence: ['swarm/graphics-assets/index.mjs'] },
  { stream: 'ux-poker-room', domain: 'ui-poker-room', evidence: ['index.html', 'script.js', 'styles.css'] },
];

const AGENTS = [
  { id: 'alpha-core', lane: 'core', capacity: 2, domains: ['swarm-engine', 'swarm-engine-sim'] },
  { id: 'beta-agent', lane: 'agent', capacity: 2, domains: ['swarm-agent-runtime', 'swarm-agent-strategy'] },
  { id: 'gamma-finance', lane: 'finance', capacity: 2, domains: ['swarm-sponsorship', 'swarm-cashier'] },
  { id: 'delta-tourney', lane: 'tourney', capacity: 2, domains: ['swarm-tournament'] },
  { id: 'epsilon-trust', lane: 'trust', capacity: 2, domains: ['swarm-fairness', 'swarm-realtime'] },
  { id: 'zeta-design', lane: 'design', capacity: 2, domains: ['graphics-assets', 'ui-poker-room'] },
  { id: 'eta-orchestrator', lane: 'ops', capacity: 2, domains: ['swarm-orchestrator'] },
];

const PRIORITY_OVERRIDES = {
  'swarm-engine-sim': 91,
  'swarm-agent-strategy': 89,
};

function readGapReport() {
  if (!existsSync(gapPath)) {
    return { activeDomains: {}, uncoveredDomains: [] };
  }
  return JSON.parse(readFileSync(gapPath, 'utf8'));
}

function missingStreams() {
  return REQUIRED_STREAMS.filter((entry) =>
    entry.evidence.every((rel) => !existsSync(path.join(appRoot, rel)))
  );
}

function deriveCurrentOwnership(gapReport) {
  const active = Object.keys(gapReport.activeDomains || {});
  return {
    existing_swarm: active,
  };
}

function buildWorkItems(gapReport) {
  const missing = missingStreams();
  const backlogDomains = missing.map((m) => m.domain);

  return buildWorkQueue({
    gapReport: {
      uncoveredDomains: backlogDomains,
      activeDomains: gapReport.activeDomains || {},
    },
    priorityOverrides: PRIORITY_OVERRIDES,
  });
}

function taskTemplate(domain) {
  const common = {
    acceptance: [
      'Add implementation module with explicit exported API.',
      'Add unit tests with deterministic fixtures.',
      'Wire into scripts/day1-swarm-check.sh.',
      'Update docs/SWARM_EXECUTION_BOARD.md with status.',
    ],
  };

  const specifics = {
    'swarm-engine-sim': {
      objective: 'Build simulation/equity service with deterministic seed control for agent training and evaluation.',
      deliverables: ['swarm/engine-sim/index.mjs', 'swarm/day6-sim.test.mjs'],
    },
    'swarm-agent-strategy': {
      objective: 'Implement temperament/style policy adapter with bounded risk profile outputs.',
      deliverables: ['swarm/agent-strategy/index.mjs', 'swarm/day6-strategy.test.mjs'],
    },
  };

  return {
    domain,
    objective: specifics[domain]?.objective || 'Harden and expand lane capabilities for poker-only production readiness.',
    deliverables: specifics[domain]?.deliverables || [`swarm/${domain.replace('swarm-', '')}/index.mjs`],
    ...common,
  };
}

const gapReport = readGapReport();
const workQueue = buildWorkItems(gapReport);
const assignments = assignWorkLanes({
  workQueue,
  agents: AGENTS,
  currentOwnership: deriveCurrentOwnership(gapReport),
});

const collision = detectAssignmentCollisions(assignments);
const board = buildExecutionBoard({ assignments });

const tasks = assignments.flatMap((row) =>
  row.assignments.map((a) => ({
    agentId: row.id,
    lane: row.lane,
    priority: a.priority,
    ...taskTemplate(a.domain),
  }))
);

const packet = {
  generatedAt: new Date().toISOString(),
  scope: 'poker-only swarm reinforcement',
  sourceGapReport: path.relative(appRoot, gapPath),
  missingStreams: missingStreams().map((x) => x.stream),
  assignments,
  collision,
  tasks,
};

writeFileSync(path.join(docsDir, 'SWARM_TASK_PACKET.json'), JSON.stringify(packet, null, 2));

const md = [
  '# Swarm Task Packet',
  '',
  `Generated: ${packet.generatedAt}`,
  '',
  `Missing Streams: ${packet.missingStreams.length ? packet.missingStreams.join(', ') : 'none detected'}`,
  '',
  '## Assignment Board',
  '',
  '```md',
  board.trim(),
  '```',
  '',
  '## Tasks',
  ...tasks.map((t, idx) =>
    [
      `${idx + 1}. ${t.agentId} -> ${t.domain} (p${t.priority})`,
      `Objective: ${t.objective}`,
      `Deliverables: ${t.deliverables.join(', ')}`,
      `Acceptance: ${t.acceptance.join(' | ')}`,
    ].join('\n')
  ),
  '',
].join('\n');

writeFileSync(path.join(docsDir, 'SWARM_TASK_PACKET.md'), md);
console.log(`Wrote ${path.join(docsDir, 'SWARM_TASK_PACKET.json')}`);
