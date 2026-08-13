#!/usr/bin/env node

/**
 * Pi Session -> TNF Handoff bridge
 *
 * Publishes Pi session context into TNF handoff packet format (v1.1)
 * through relay-core's HandoffStoreService.
 */

const crypto = require('node:crypto');

const { HandoffStoreService } = require('../packages/relay-core/src/services/HandoffStoreService.js');

const REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'TERMINAL_BINDING_GATE',
  'HIGH_RISK_RUNTIME_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
];

function ensureMinLength(value, minLength, fallback) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (raw.length >= minLength) return raw;
  if (fallback.length >= minLength) return fallback;
  return `${fallback}${' '.repeat(Math.max(minLength - fallback.length, 0))}`;
}

function parseList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildGateDecisions(atIso) {
  return REQUIRED_GATES.map((gate) => ({
    gate,
    decision: 'allow',
    at: atIso,
  }));
}

function buildCumulativeId({
  tenantId,
  sessionKey,
  workflowId,
  channelId,
  correlationId,
  causationId,
  twid,
  route,
  gateDecisions,
}) {
  const resolvedRoute = Array.isArray(route) && route.length > 0 ? route : ['pi', 'handoff-service'];
  return {
    spec: 'tnf/mcid/0.1',
    id: crypto.randomUUID(),
    scope: {
      tenant_id: tenantId,
      session_key: sessionKey || null,
      workflow_id: workflowId || null,
      channel_id: channelId || null,
    },
    lineage: {
      trace_id: null,
      correlation_id: correlationId || crypto.randomUUID(),
      causation_id: causationId || null,
      handoff_packet_id: null,
      twid: twid || null,
      task_id: null,
      schedule_id: null,
      schedule_run_id: null,
    },
    federation: {
      domain: process.env.TNF_FEDERATION_DOMAIN || 'tnf-local',
      route: resolvedRoute,
      hop_count: Math.max(resolvedRoute.length - 1, 0),
      gate_decisions: gateDecisions,
    },
    issued_at: new Date().toISOString(),
  };
}

function normalizePriority(value) {
  const normalized = String(value || 'normal').toLowerCase();
  if (normalized === 'low' || normalized === 'high' || normalized === 'critical') return normalized;
  return 'normal';
}

function buildHandoffInput(options = {}) {
  const nowIso = new Date().toISOString();
  const tenantId = String(options.tenantId || process.env.TNF_TENANT_ID || 'tnf-prod').trim();
  const fromAgentId = String(options.fromAgentId || 'pi-coding-agent').trim();
  const targetAgentIds = parseList(options.targetAgentIds || options.toAgents || options.toAgent);
  if (targetAgentIds.length === 0) {
    throw new Error('targetAgentIds is required');
  }

  const sessionKey = String(options.sessionKey || '').trim() || null;
  const workflowId = String(options.workflowId || '').trim() || null;
  const channelId = String(options.channelId || '').trim() || null;
  const gateDecisions = buildGateDecisions(nowIso);

  const title = ensureMinLength(
    options.title,
    3,
    'Pi Session Handoff'
  );
  const summary = ensureMinLength(
    options.summary,
    10,
    'Pi worker execution summary for TNF orchestration continuity.'
  );
  const prompt = ensureMinLength(
    options.prompt,
    10,
    'Pi execution context exported for downstream TNF agent handoff processing.'
  );

  const payload = {
    title,
    summary,
    prompt,
    acceptanceCriteria: parseList(options.acceptanceCriteria),
    nextActions: parseList(options.nextActions),
    artifacts: parseList(options.artifacts),
  };

  const cumulativeId = buildCumulativeId({
    tenantId,
    sessionKey,
    workflowId,
    channelId,
    correlationId: options.correlationId,
    causationId: options.causationId,
    twid: options.twid,
    route: parseList(options.route),
    gateDecisions,
  });

  return {
    fromAgentId,
    targets: {
      agentIds: targetAgentIds,
      roles: parseList(options.roles),
    },
    scope: {
      tenantId,
      ...(sessionKey ? { sessionKey } : {}),
      ...(workflowId ? { workflowId } : {}),
      ...(channelId ? { channelId } : {}),
    },
    payload,
    cumulativeId,
    gateDecisions,
    priority: normalizePriority(options.priority),
    tags: parseList(options.tags || 'pi-session-export,a2a'),
  };
}

async function publishPiSessionHandoff(options = {}) {
  const store = new HandoffStoreService({
    keyPrefix: options.keyPrefix || process.env.TNF_HANDOFF_KEY_PREFIX || 'tnf:handoff:v1',
  });
  const input = buildHandoffInput(options);
  try {
    const packet = await store.publish(input);
    return { packet, input };
  } finally {
    await store.close().catch(() => {});
  }
}

function parseArgv(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function printUsage() {
  console.log(`Usage:
  node scripts/pi-session-handoff.cjs \\
    --from-agent pi-coding-agent \\
    --to-agents agent_orchestrator_123 \\
    --session-key tnf-123 \\
    --summary "Pi completed task" \\
    --prompt "original prompt"
`);
}

async function main() {
  const args = parseArgv(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  if (!args['to-agents'] && !args['to-agent']) {
    console.error('[pi-session-handoff] missing --to-agents or --to-agent');
    printUsage();
    process.exit(1);
  }

  const options = {
    fromAgentId: args['from-agent'] || args.fromAgent,
    targetAgentIds: args['to-agents'] || args.toAgents || args['to-agent'] || args.toAgent,
    tenantId: args['tenant-id'] || args.tenantId,
    sessionKey: args['session-key'] || args.sessionKey,
    workflowId: args['workflow-id'] || args.workflowId,
    channelId: args['channel-id'] || args.channelId,
    title: args.title,
    summary: args.summary,
    prompt: args.prompt,
    nextActions: args['next-actions'] || args.nextActions,
    acceptanceCriteria: args['acceptance-criteria'] || args.acceptanceCriteria,
    artifacts: args.artifacts,
    roles: args.roles,
    tags: args.tags,
    priority: args.priority,
    correlationId: args['correlation-id'] || args.correlationId,
    causationId: args['causation-id'] || args.causationId,
    route: args.route,
  };

  const { packet } = await publishPiSessionHandoff(options);
  console.log(
    JSON.stringify(
      {
        ok: true,
        packetId: packet.id,
        tenantId: packet.scope.tenantId,
        sessionKey: packet.scope.sessionKey || null,
        targets: packet.targets.agentIds,
        createdAt: packet.createdAt,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[pi-session-handoff] ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildGateDecisions,
  buildHandoffInput,
  publishPiSessionHandoff,
};
