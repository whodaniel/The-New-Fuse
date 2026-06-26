/**
 * DACC-v1 / Phase 9 federated identity helpers for Fuse Connect (browser edge).
 * Mirrors scripts/lib/federation-protocol.cjs and packages/relay-core contracts.
 */

import type { Agent } from './types';

const FEDERATED_BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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

export interface FederationIdentityRecord {
  id: string;
  operationalHandle: string;
  runtimeSessionId: string;
  canonicalEntityId: string | null;
  idNumber: string;
  aliases: string[];
  daccRole: string;
  correlationId: string;
  mcid: McidEnvelope;
}

export interface McidEnvelope {
  spec: 'tnf/mcid/0.1';
  id: string;
  scope: {
    tenant_id: string;
    session_key: string;
    workflow_id: string | null;
    channel_id: string | null;
  };
  lineage: {
    correlation_id: string;
    causation_id: string | null;
    handoff_packet_id: string | null;
  };
}

export interface ResolvedMessageTarget {
  content: string;
  to: string | 'broadcast';
  addressedAgentId: string | null;
  addressedHandle: string | null;
}

function normalizeSegment(value: string): string | null {
  const normalized = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || null;
}

function normalizeInstance(value?: string | number | null): string {
  if (value == null || value === '') return '001';
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return raw.padStart(3, '0');
  return normalizeSegment(raw) || '001';
}

export function buildCanonicalEntityId(parts: {
  category: string;
  provider: string;
  name: string;
  instance?: string | number | null;
  scope?: string | null;
}): string {
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

function encodeBase58(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return FEDERATED_BASE58_ALPHABET[0];
  let remaining = Math.trunc(num);
  let encoded = '';
  while (remaining > 0) {
    encoded = FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
    remaining = Math.floor(remaining / 58);
  }
  return encoded;
}

/** Deterministic bridge-style ID# until master-clock assigns sequential idNumber. */
export function deterministicIdNumber(agentId: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < agentId.length; i += 1) {
    h ^= agentId.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return `ID#:${encodeBase58(5000 + (h % 10000))}`;
}

export function buildMcidEnvelope(input: {
  tenantId?: string;
  sessionKey: string;
  channelId?: string | null;
  correlationId: string;
  causationId?: string | null;
  handoffPacketId?: string | null;
  eventId?: string;
}): McidEnvelope {
  return {
    spec: 'tnf/mcid/0.1',
    id: input.eventId || crypto.randomUUID(),
    scope: {
      tenant_id: input.tenantId || 'tnf-local',
      session_key: input.sessionKey,
      workflow_id: null,
      channel_id: input.channelId || null,
    },
    lineage: {
      correlation_id: input.correlationId,
      causation_id: input.causationId || null,
      handoff_packet_id: input.handoffPacketId || null,
    },
  };
}

function platformProvider(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('gemini')) return 'GOOGLE_GEMINI';
  if (p.includes('chatgpt') || p.includes('openai')) return 'OPENAI_CHATGPT';
  if (p.includes('claude')) return 'ANTHROPIC_CLAUDE';
  if (p.includes('glm') || p.includes('z.ai')) return 'ZHIPU_GLM';
  if (p.includes('qwen')) return 'ALIBABA_QWEN';
  if (p.includes('perplexity')) return 'PERPLEXITY';
  if (p.includes('copilot')) return 'MICROSOFT_COPILOT';
  if (p.includes('chrome')) return 'FUSE_BROWSER';
  return normalizeSegment(platform) || 'UNKNOWN';
}

export function buildPageAgentIdentity(
  pageAgentId: string,
  platform: string,
  tabId?: number,
  sessionLineage?: {
    cumulativeId?: {
      id?: string;
      lineage?: {
        handoff_packet_id?: string | null;
        correlation_id?: string;
      };
    };
  } | null
): FederationIdentityRecord {
  const provider = platformProvider(platform);
  const correlationId = crypto.randomUUID();
  const runtimeSessionId = `${pageAgentId}${tabId ? `-tab-${tabId}` : ''}`;
  const causationId =
    sessionLineage?.cumulativeId?.id ||
    sessionLineage?.cumulativeId?.lineage?.correlation_id ||
    null;
  const handoffPacketId = sessionLineage?.cumulativeId?.lineage?.handoff_packet_id || null;

  let canonicalEntityId: string | null = null;
  try {
    canonicalEntityId = buildCanonicalEntityId({
      category: 'AGENT',
      provider: 'FUSE',
      name: `${provider}_PAGE`,
      instance: tabId ? String(tabId) : '001',
      scope: 'LOCAL',
    });
  } catch {
    canonicalEntityId = null;
  }

  const operationalHandle = pageAgentId.replace(/^page-agent-/, 'PAGE-').toUpperCase();

  return {
    id: pageAgentId,
    operationalHandle,
    runtimeSessionId,
    canonicalEntityId,
    idNumber: deterministicIdNumber(pageAgentId),
    aliases: [
      pageAgentId,
      pageAgentId.toLowerCase(),
      operationalHandle.toLowerCase(),
      platform.toLowerCase(),
      ...(canonicalEntityId ? [canonicalEntityId.toLowerCase()] : []),
    ],
    daccRole: 'participant',
    correlationId,
    mcid: buildMcidEnvelope({
      sessionKey: runtimeSessionId,
      correlationId,
      causationId,
      handoffPacketId,
    }),
  };
}

export function buildBrowserAgentIdentity(browserAgentId: string): FederationIdentityRecord {
  const correlationId = crypto.randomUUID();
  let canonicalEntityId: string | null = null;
  try {
    canonicalEntityId = buildCanonicalEntityId({
      category: 'AGENT',
      provider: 'FUSE',
      name: 'BROWSER_BRIDGE',
      instance: '001',
      scope: 'LOCAL',
    });
  } catch {
    canonicalEntityId = null;
  }

  return {
    id: browserAgentId,
    operationalHandle: 'BROWSER-BRIDGE',
    runtimeSessionId: browserAgentId,
    canonicalEntityId,
    idNumber: deterministicIdNumber(browserAgentId),
    aliases: [browserAgentId, browserAgentId.toLowerCase(), 'browser-bridge'],
    daccRole: 'broker',
    correlationId,
    mcid: buildMcidEnvelope({
      sessionKey: browserAgentId,
      correlationId,
    }),
  };
}

export function signDaccMessage(handle: string, content: string): string {
  const normalizedHandle = String(handle || '').trim();
  const body = String(content || '').trim();
  if (!normalizedHandle) return body;
  const prefix = `[${normalizedHandle}]`;
  if (body.startsWith(prefix)) return body;
  return `${prefix} ${body}`;
}

export function enrichOutboundMetadata(
  identity: FederationIdentityRecord,
  options: {
    channel?: string | null;
    senderId?: string;
    causationId?: string | null;
    correlationId?: string;
    inResponseTo?: string | null;
    conversationId?: string | null;
    platform?: string;
    extra?: Record<string, unknown>;
  } = {}
): Record<string, unknown> {
  const correlationId = options.correlationId || crypto.randomUUID();
  const mcid = buildMcidEnvelope({
    sessionKey: identity.runtimeSessionId,
    channelId: options.channel || null,
    correlationId,
    causationId: options.causationId || null,
  });

  return {
    ...(options.extra || {}),
    senderId: options.senderId || identity.id,
    operationalHandle: identity.operationalHandle,
    runtimeSessionId: identity.runtimeSessionId,
    canonicalEntityId: identity.canonicalEntityId,
    idNumber: identity.idNumber,
    daccRole: identity.daccRole,
    correlationId,
    causationId: options.causationId || null,
    inResponseTo: options.inResponseTo || null,
    conversationId: options.conversationId || options.channel || null,
    mcid,
    federation: { mcid, canonicalEntityId: identity.canonicalEntityId, idNumber: identity.idNumber },
    audit: {
      source: 'fuse-connect-v7',
      actor: identity.operationalHandle,
      sessionId: identity.runtimeSessionId,
      channelId: options.channel || null,
      correlationId,
    },
    ...(options.platform ? { platform: options.platform } : {}),
  };
}

function normalizeAlias(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function findAgentByAlias(agents: Agent[], token: string): Agent | undefined {
  const needle = normalizeAlias(token);
  if (!needle) return undefined;

  return agents.find((agent) => {
    if (normalizeAlias(agent.id) === needle) return true;
    if (normalizeAlias(agent.name) === needle) return true;
    if (normalizeAlias(agent.operationalHandle || '') === needle) return true;
    if (normalizeAlias(agent.canonicalEntityId || '') === needle) return true;
    if (agent.idNumber && normalizeAlias(agent.idNumber) === needle) return true;
    const aliases = (agent.metadata?.aliases as string[] | undefined) || [];
    return aliases.some((alias) => normalizeAlias(alias) === needle);
  });
}

const PLATFORM_ALIASES: Record<string, string[]> = {
  glm: ['glm', 'z.ai', 'chat.z.ai', 'zhipu'],
  gemini: ['gemini', 'bard'],
  chatgpt: ['chatgpt', 'gpt', 'openai'],
  claude: ['claude', 'anthropic'],
  qwen: ['qwen'],
  copilot: ['copilot'],
};

/** Parse @mentions and /to directives into a concrete relay recipient. */
export function resolveMessageTarget(content: string, agents: Agent[]): ResolvedMessageTarget {
  let working = String(content || '').trim();
  let to: string | 'broadcast' = 'broadcast';
  let addressedAgentId: string | null = null;
  let addressedHandle: string | null = null;

  const toDirective = working.match(/^\/to\s+(\S+)\s+([\s\S]+)$/i);
  if (toDirective) {
    working = toDirective[2].trim();
    const agent = findAgentByAlias(agents, toDirective[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
      addressedHandle = agent.operationalHandle || agent.name;
    }
  }

  const idNumberMatch = working.match(/@(ID#:[1-9A-HJ-NP-Za-km-z]+)/);
  if (idNumberMatch) {
    const agent = agents.find((a) => a.idNumber === idNumberMatch[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
      addressedHandle = agent.operationalHandle || agent.name;
      working = working.replace(idNumberMatch[0], '').trim();
    }
  }

  const pageAgentMatch = working.match(
    /@((?:page-agent|browser-agent|agent|AGENT)-[\w-]+)/i
  );
  if (pageAgentMatch) {
    const agent = findAgentByAlias(agents, pageAgentMatch[1]);
    if (agent) {
      to = agent.id;
      addressedAgentId = agent.id;
      addressedHandle = agent.operationalHandle || agent.name;
    }
    working = working.replace(pageAgentMatch[0], '').trim();
  }

  if (to === 'broadcast') {
    const platformMatch = working.match(/@(GLM|Gemini|ChatGPT|Claude|Qwen|Copilot)\b/i);
    if (platformMatch) {
      const key = platformMatch[1].toLowerCase();
      const aliases = PLATFORM_ALIASES[key] || [key];
      const agent = agents.find((a) => {
        const platform = String(a.metadata?.node?.platform || a.platform || a.name || '').toLowerCase();
        return aliases.some((alias) => platform.includes(alias) || normalizeAlias(a.name).includes(alias));
      });
      if (agent) {
        to = agent.id;
        addressedAgentId = agent.id;
        addressedHandle = agent.operationalHandle || agent.name;
        working = working.replace(platformMatch[0], '').trim();
      }
    }
  }

  return {
    content: working,
    to,
    addressedAgentId,
    addressedHandle,
  };
}

export function mergeRegistrationPayload(
  agent: Agent,
  payload: Record<string, unknown>
): Agent {
  const federation =
    payload.federation && typeof payload.federation === 'object'
      ? (payload.federation as Record<string, unknown>)
      : {};

  return {
    ...agent,
    canonicalEntityId:
      (typeof payload.canonicalEntityId === 'string' && payload.canonicalEntityId) ||
      agent.canonicalEntityId ||
      null,
    operationalHandle:
      (typeof payload.operationalHandle === 'string' && payload.operationalHandle) ||
      agent.operationalHandle ||
      null,
    runtimeSessionId:
      (typeof payload.runtimeSessionId === 'string' && payload.runtimeSessionId) ||
      agent.runtimeSessionId ||
      null,
    idNumber:
      (typeof payload.idNumber === 'string' && payload.idNumber) ||
      agent.idNumber ||
      null,
    metadata: {
      ...(agent.metadata || {}),
      federation: {
        ...((agent.metadata?.federation as Record<string, unknown>) || {}),
        ...federation,
        ...(payload.mcid ? { mcid: payload.mcid } : {}),
      },
      daccRole:
        (typeof payload.daccRole === 'string' && payload.daccRole) ||
        agent.metadata?.daccRole ||
        'participant',
      aliases: Array.isArray(payload.aliases)
        ? payload.aliases
        : (agent.metadata?.aliases as string[] | undefined) || [],
      masterClockAgentId:
        (typeof payload.agentId === 'string' && payload.agentId) ||
        agent.metadata?.masterClockAgentId,
    },
  };
}
