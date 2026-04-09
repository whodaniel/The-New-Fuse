import { assertString } from '../shared/contracts.mjs';

const DEFAULT_PRIORITIES = Object.freeze({
  'engine-core-app': 100,
  'api-server': 95,
  'swarm-engine': 92,
  'swarm-realtime': 90,
  'swarm-agent-runtime': 88,
  'swarm-sponsorship': 86,
  'swarm-tournament': 84,
  'swarm-cashier': 82,
  'swarm-fairness': 80,
  'graphics-assets': 78,
  'ui-poker-room': 76,
  docs: 20,
  uncategorized: 10,
});

function toPriority(domain, override) {
  if (override && Number.isFinite(override[domain])) {
    return Number(override[domain]);
  }
  return DEFAULT_PRIORITIES[domain] ?? 50;
}

export function normalizeGapReport(report) {
  if (!report || typeof report !== 'object') {
    throw new Error('gap report object is required');
  }

  const uncovered = Array.isArray(report.uncoveredDomains) ? report.uncoveredDomains : [];
  const active = report.activeDomains && typeof report.activeDomains === 'object'
    ? Object.keys(report.activeDomains)
    : [];

  return {
    uncoveredDomains: [...new Set(uncovered.map((d) => String(d).trim()).filter(Boolean))],
    activeDomains: [...new Set(active.map((d) => String(d).trim()).filter(Boolean))],
  };
}

export function buildWorkQueue({ gapReport, extraDomains = [], priorityOverrides = {} }) {
  const normalized = normalizeGapReport(gapReport);
  const uncovered = normalized.uncoveredDomains;
  const extras = extraDomains.map((d) => String(d).trim()).filter(Boolean);

  const all = [...new Set([...uncovered, ...extras])];
  return all
    .map((domain) => ({
      domain,
      priority: toPriority(domain, priorityOverrides),
    }))
    .sort((a, b) => b.priority - a.priority || a.domain.localeCompare(b.domain));
}

export function assignWorkLanes({ workQueue, agents, currentOwnership = {} }) {
  if (!Array.isArray(workQueue)) {
    throw new Error('workQueue must be an array');
  }
  if (!Array.isArray(agents) || agents.length === 0) {
    throw new Error('agents must be a non-empty array');
  }

  const normalizedAgents = agents.map((agent, idx) => {
    assertString(agent.id, `agents[${idx}].id`);
    return {
      id: agent.id,
      lane: agent.lane || 'general',
      capacity: Number.isInteger(agent.capacity) && agent.capacity > 0 ? agent.capacity : 2,
      domains: new Set(Array.isArray(agent.domains) ? agent.domains : []),
      assigned: [],
    };
  });

  const alreadyOwned = new Set(
    Object.values(currentOwnership)
      .flatMap((items) => (Array.isArray(items) ? items : []))
      .map((d) => String(d))
  );

  const queue = workQueue.filter((item) => !alreadyOwned.has(item.domain));

  for (const item of queue) {
    let best = null;
    for (const agent of normalizedAgents) {
      if (agent.assigned.length >= agent.capacity) continue;

      const affinity = agent.domains.has(item.domain) ? 40 : 0;
      const score = affinity - agent.assigned.length * 10;
      if (!best || score > best.score) {
        best = { agent, score };
      }
    }

    if (best) {
      best.agent.assigned.push(item);
    }
  }

  return normalizedAgents.map((agent) => ({
    id: agent.id,
    lane: agent.lane,
    capacity: agent.capacity,
    assignments: agent.assigned,
  }));
}

export function detectAssignmentCollisions(assignments) {
  if (!Array.isArray(assignments)) {
    throw new Error('assignments must be an array');
  }

  const seen = new Map();
  const collisions = [];

  for (const row of assignments) {
    const agentId = String(row.id || 'unknown');
    const domains = Array.isArray(row.assignments) ? row.assignments.map((x) => x.domain) : [];
    for (const domain of domains) {
      if (!seen.has(domain)) {
        seen.set(domain, agentId);
        continue;
      }
      collisions.push({
        domain,
        first: seen.get(domain),
        duplicate: agentId,
      });
    }
  }

  return {
    ok: collisions.length === 0,
    collisions,
  };
}

export function buildExecutionBoard({ assignments, generatedAt = new Date().toISOString() }) {
  const rows = assignments.map((agent) => {
    const domains = agent.assignments.map((x) => `${x.domain} (p${x.priority})`).join(', ');
    return `- ${agent.id} [${agent.lane}] => ${domains || 'standby'}`;
  });

  return [
    '# Swarm Execution Board',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Lane Assignments',
    ...rows,
    '',
  ].join('\n');
}
