#!/usr/bin/env node
/**
 * DACC-v1 / Federation protocol helpers for runtime scripts.
 * Source of truth: .agent/ROLE_DEFINITIONS.md (Phase 8–9)
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const IDENTITY_CATEGORIES = new Set([
  'AGENT',
  'SESSION',
  'CHANNEL',
  'WORKFLOW',
  'TASK',
  'SCHEDULE',
  'HARNESS',
  'MCP',
  'LLM',
  'USER',
  'SYSTEM',
]);

function normalizeSegment(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || null;
}

function normalizeInstance(value) {
  if (value == null || value === '') return '001';
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return raw.padStart(3, '0');
  return normalizeSegment(raw) || '001';
}

function buildCanonicalEntityId(parts) {
  const category = normalizeSegment(parts.category);
  const provider = normalizeSegment(parts.provider);
  const name = normalizeSegment(parts.name);
  const scope = parts.scope ? normalizeSegment(parts.scope) : 'LOCAL';
  const instance = normalizeInstance(parts.instance);
  if (!category || !provider || !name) {
    throw new Error('category, provider, and name are required for canonicalEntityId');
  }
  if (!IDENTITY_CATEGORIES.has(category)) {
    throw new Error(`invalid identity category: ${category}`);
  }
  return ['TNF', scope, category, provider, name, instance].filter(Boolean).join(':');
}

const FEDERATED_BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(num) {
  if (!Number.isFinite(num) || num <= 0) return FEDERATED_BASE58_ALPHABET[0];
  let remaining = Math.trunc(num);
  let encoded = '';
  while (remaining > 0) {
    encoded = FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
    remaining = Math.floor(remaining / 58);
  }
  return encoded;
}

function deterministicIdNumber(agentId) {
  let h = 0x811c9dc5;
  const id = String(agentId || 'agent');
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return `ID#:${encodeBase58(5000 + (h % 10000))}`;
}

function buildIdentityRecord(input) {
  const operationalHandle = String(input.operationalHandle || '').trim();
  if (!operationalHandle) throw new Error('operationalHandle is required');

  const runtimeSessionId =
    String(input.runtimeSessionId || `${operationalHandle}-${Date.now()}`).trim() || null;
  const canonicalEntityId = input.canonicalEntityIdString
    ? input.canonicalEntityIdString
    : input.canonicalEntityIdParts
      ? buildCanonicalEntityId(input.canonicalEntityIdParts)
      : null;

  const aliases = new Set(
    [operationalHandle, runtimeSessionId, input.id, ...(input.aliases || [])]
      .filter(Boolean)
      .map((v) => String(v).trim().toLowerCase())
  );

  const correlationId = input.correlationId || uuidv4();
  const mcid = buildMcidEnvelope({
    tenantId: input.tenantId || 'tnf-local',
    sessionKey: runtimeSessionId,
    channelId: input.channelId || null,
    correlationId,
    causationId: input.causationId || null,
  });

  const id = input.id || operationalHandle;

  return {
    id,
    operationalHandle,
    runtimeSessionId,
    canonicalEntityId,
    idNumber: input.idNumber || deterministicIdNumber(id),
    aliases: [...aliases],
    daccRole: input.daccRole || 'worker',
    correlationId,
    mcid,
  };
}

function buildMcidEnvelope({ tenantId, sessionKey, channelId, correlationId, causationId, handoffPacketId }) {
  return {
    spec: 'tnf/mcid/0.1',
    id: uuidv4(),
    scope: {
      tenant_id: tenantId || 'tnf-local',
      session_key: sessionKey || 'session',
      workflow_id: null,
      channel_id: channelId || null,
    },
    lineage: {
      correlation_id: correlationId || uuidv4(),
      causation_id: causationId || null,
      handoff_packet_id: handoffPacketId || null,
    },
  };
}

function signDaccMessage(handle, content) {
  const normalizedHandle = String(handle || '').trim();
  const body = String(content || '').trim();
  if (!normalizedHandle) return body;
  const prefix = `[${normalizedHandle}]`;
  if (body.startsWith(prefix)) return body;
  return `${prefix} ${body}`;
}

function parseDaccSignature(content) {
  const text = String(content || '');
  const match = text.match(/^\[([A-Z0-9._-]+)\]\s*([\s\S]*)$/);
  if (!match) {
    return { handle: null, body: text, signed: false };
  }
  return { handle: match[1], body: match[2].trim(), signed: true };
}

function buildRelayAgentRegister(identity, options = {}) {
  const agent = {
    id: identity.id,
    name: options.name || identity.operationalHandle,
    platform: options.platform || 'tnf-runtime',
    status: 'active',
    capabilities: options.capabilities || [],
    channels: options.channels || [],
    canonicalEntityId: identity.canonicalEntityId,
    operationalHandle: identity.operationalHandle,
    runtimeSessionId: identity.runtimeSessionId,
    idNumber: identity.idNumber,
    aliases: identity.aliases,
    metadata: {
      daccRole: identity.daccRole,
      federation: {
        canonicalEntityId: identity.canonicalEntityId,
        idNumber: identity.idNumber,
        mcid: identity.mcid,
      },
      audit: {
        source: 'federation-protocol',
        actor: identity.operationalHandle,
        sessionId: identity.runtimeSessionId,
        correlationId: identity.correlationId,
      },
      ...(options.metadata || {}),
    },
  };

  return {
    type: 'AGENT_REGISTER',
    source: identity.id,
    payload: { agent },
  };
}

function buildRelayMessageSend(identity, options) {
  const correlationId = options.correlationId || uuidv4();
  const mcid = buildMcidEnvelope({
    tenantId: options.tenantId,
    sessionKey: identity.runtimeSessionId,
    channelId: options.channel,
    correlationId,
    causationId: options.causationId || null,
  });

  const metadata = {
    daccRole: identity.daccRole,
    operationalHandle: identity.operationalHandle,
    runtimeSessionId: identity.runtimeSessionId,
    canonicalEntityId: identity.canonicalEntityId,
    idNumber: identity.idNumber,
    correlationId,
    mcid,
    federation: { mcid, idNumber: identity.idNumber, canonicalEntityId: identity.canonicalEntityId },
    audit: {
      source: 'federation-protocol',
      actor: identity.operationalHandle,
      channelId: options.channel,
      sessionId: identity.runtimeSessionId,
      correlationId,
    },
    ...(options.metadata || {}),
  };

  return {
    type: 'MESSAGE_SEND',
    source: identity.id,
    channel: options.channel,
    payload: {
      to: options.to || 'broadcast',
      content: signDaccMessage(identity.operationalHandle, options.content || ''),
      messageType: options.messageType || 'text',
      metadata,
    },
  };
}

function buildBrokerIdentity(channelName) {
  const channel = String(channelName || 'Green');
  const channelKey = normalizeSegment(channel) || 'GREEN';
  const handle = `BROKER-${channel.charAt(0).toUpperCase()}${channel.slice(1).toLowerCase()}`;

  return buildIdentityRecord({
    id: handle,
    operationalHandle: handle,
    daccRole: 'broker',
    canonicalEntityIdParts: {
      category: 'AGENT',
      provider: 'TNF',
      name: `BROKER_${channelKey}`,
      instance: '001',
      scope: 'LOCAL',
    },
    aliases: [handle.toLowerCase(), `broker-${channelKey.toLowerCase()}`],
    channelId: channel,
  });
}

function buildWorkerAgentIdentity(input) {
  const id = String(input.id || input.operationalHandle || `agent-${Date.now()}`);
  const platform = String(input.platform || 'tnf-runtime');
  const provider = normalizeSegment(input.provider || platform) || 'TNF_RUNTIME';
  const identity = buildIdentityRecord({
    id,
    operationalHandle: input.operationalHandle || id,
    daccRole: input.daccRole || 'participant',
    channelId: input.channelId || null,
    canonicalEntityIdParts: input.canonicalEntityIdParts || {
      category: 'AGENT',
      provider: 'TNF',
      name: provider,
      instance: '001',
      scope: 'LOCAL',
    },
    aliases: input.aliases || [id, platform],
  });
  identity.idNumber = deterministicIdNumber(id);
  return identity;
}

function relayHealthUrl(relayUrl) {
  return String(relayUrl || '')
    .replace(/^ws:/, 'http:')
    .replace(/^wss:/, 'https:')
    .replace(/\/ws$/, '/health');
}

async function discoverRelayUrl(preferred, candidates = []) {
  const urls = [
    preferred,
    process.env.RELAY_URL,
    process.env.TNF_RELAY_URL,
    'ws://127.0.0.1:3007/ws',
    'ws://127.0.0.1:3000/ws',
    ...candidates,
  ].filter(Boolean);

  for (const candidate of [...new Set(urls)]) {
    try {
      const response = await fetch(relayHealthUrl(candidate), { signal: AbortSignal.timeout(2500) });
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.status === 'ok' && data?.relay === 'running') return candidate;
    } catch (_ignored) {
      // try next
    }
  }
  return preferred || null;
}

function normalizeAlias(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function findAgentByAlias(agents, token) {
  const needle = normalizeAlias(token);
  if (!needle) return null;
  for (const agent of agents) {
    if (normalizeAlias(agent.id) === needle) return agent;
    if (normalizeAlias(agent.name) === needle) return agent;
    if (normalizeAlias(agent.operationalHandle) === needle) return agent;
    if (agent.idNumber && normalizeAlias(agent.idNumber) === needle) return agent;
  }
  return null;
}

function resolveMessageTarget(content, agents = []) {
  let working = String(content || '').trim();
  let to = 'broadcast';
  let addressedAgentId = null;

  const toDirective = working.match(/^\/to\s+(\S+)\s+([\s\S]+)$/i);
  if (toDirective) {
    working = toDirective[2].trim();
    const agent = findAgentByAlias(agents, toDirective[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
    }
  }

  const idNumberMatch = working.match(/@(ID#:[1-9A-HJ-NP-Za-km-z]+)/);
  if (idNumberMatch) {
    const agent = agents.find((a) => a.idNumber === idNumberMatch[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
      working = working.replace(idNumberMatch[0], '').trim();
    }
  }

  const pageAgentMatch = working.match(/@((?:page-agent|browser-agent|agent|AGENT)-[\w-]+)/i);
  if (pageAgentMatch) {
    const agent = findAgentByAlias(agents, pageAgentMatch[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
    }
    working = working.replace(pageAgentMatch[0], '').trim();
  }

  const handleMatch = working.match(/@([A-Za-z0-9._-]+)/);
  if (handleMatch && !addressedAgentId) {
    const agent = findAgentByAlias(agents, handleMatch[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
      working = working.replace(handleMatch[0], '').trim();
    }
  }

  return { content: working, to, addressedAgentId };
}

function readSessionHandoffLineage(repoRoot) {
  const candidates = [
    path.join(repoRoot || process.cwd(), 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'),
    path.join(os.homedir(), '.tnf', 'handoff-lineage.json'),
    path.join(os.homedir(), '.tnf', 'handoff-current.json'),
  ];

  for (const filePath of candidates) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const lineage = raw.federation_lineage || raw;
      if (lineage?.cumulativeId?.id) {
        return {
          handoff_id: raw.handoff_id || null,
          ...lineage,
        };
      }
    } catch {
      // try next
    }
  }
  return null;
}

module.exports = {
  buildBrokerIdentity,
  buildCanonicalEntityId,
  buildIdentityRecord,
  buildMcidEnvelope,
  buildRelayAgentRegister,
  buildRelayMessageSend,
  buildWorkerAgentIdentity,
  deterministicIdNumber,
  discoverRelayUrl,
  findAgentByAlias,
  parseDaccSignature,
  relayHealthUrl,
  resolveMessageTarget,
  readSessionHandoffLineage,
  signDaccMessage,
};
