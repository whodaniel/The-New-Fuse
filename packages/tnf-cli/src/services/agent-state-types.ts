/**
 * Shared types for agent-state observation, quotas, and ecosystem orientation.
 * Spec: docs/protocols/TNF_AGENT_STATE_QUOTA_ECOSYSTEM_PROTOCOL.md
 *
 * ~/.tnf/agent-state/<profile>/ is OBSERVATION HISTORY + projection cache.
 * It is NOT authoritative for roles, open tasks, or handoff. Canonical surfaces:
 *   - authority: ~/.tnf/authority/roles.json (+ elevation broker)
 *   - open tasks: handoff-current.json IMMEDIATE_TASKS / next_actions
 *   - operator narrative: docs/protocols/AGENT_STATUS_LEDGER.md
 */

export const AGENT_STATE_SPEC = 'tnf/agent-state-quota-ecosystem/0.2' as const;

export const DEFAULT_QUOTA_FRESHNESS_TTL_SEC = 300;
export const AGENT_STATE_HISTORY_CAP = 300;
export const AGENT_STATE_HISTORY_RETENTION_DAYS = 14;
export const AGENT_STATE_HISTORY_JSONL_LINES = 1000;

/** How the quota value was obtained. UNKNOWN must stay UNKNOWN. */
export type QuotaConfidence = 'verified' | 'reported' | 'inferred' | 'unknown';

export type AgentStateKind = 'observation-history' | 'projection-cache';

export interface AgentQuotaRecord {
  agentId: string;
  provider: string;
  /** Quota dimension (tokens, requests, usd, …). */
  dimension: string;
  unit: 'tokens' | 'requests' | 'usd' | 'percent' | 'unknown';
  /** null when confidence is unknown — never invent 0 or Infinity. */
  used: number | null;
  limit: number | null;
  remaining: number | null;
  /** remaining/limit when both known; otherwise null. */
  remainingFraction: number | null;
  observedAt: string;
  /** Alias retained for older callers; same as observedAt. */
  refreshedAt: string;
  resetAt: string | null;
  freshnessTtlSec: number;
  source: string;
  confidence: QuotaConfidence;
  degraded?: boolean;
  reason?: string;
}

export interface AgentStateEntry {
  agentId: string;
  name: string;
  role?: string;
  platform?: string;
  capabilities?: string[];
  isOnline: boolean;
  lastSeen?: string;
  source: string;
  protocolsVerified?: string[];
  /** Authority role from ~/.tnf/authority/roles.json when known. */
  authorityRole?: string | null;
  quota?: AgentQuotaRecord | null;
}

export interface AgentStateSnapshot {
  spec: typeof AGENT_STATE_SPEC;
  kind: AgentStateKind;
  /** Explicit non-authority disclaimer for consumers. */
  authority: 'not-authoritative';
  canonicalPointers: {
    roles: string;
    handoffCurrent: string;
    statusLedgerDoc: string;
  };
  profile: string;
  generatedAt: string;
  agents: AgentStateEntry[];
  receipts: {
    writer: string;
    agentCount: number;
    quotaFreshCount: number;
    quotaDegradedCount: number;
    quotaUnknownCount: number;
  };
}

export interface DelegationHints {
  taskText?: string;
  capabilities?: string[];
  preferOnline?: boolean;
  now?: number;
  /** Hard gate: agents lacking these authority roles are scored but never win. */
  requiredAuthorityRoles?: string[];
  /** Optional precomputed capability match scores keyed by agent name/id. */
  capabilityScores?: Record<string, number>;
  /** Repo root for tnf-agent-match roster load. */
  repoRoot?: string;
}

export interface RankedAgent {
  agent: AgentStateEntry;
  score: number;
  reasons: string[];
  /** False when authority hard-gate fails; rankers must not select these. */
  authorityEligible: boolean;
  components: {
    capability: number;
    authority: number;
    privacy: number;
    availability: number;
    quota: number;
    latency: number;
    context: number;
    reliability: number;
  };
}

export interface ProfileSession {
  profile: string;
  sessionId: string;
  authenticatedAt: string;
  expiresAt: string;
  identityMode: 'local' | 'cloud' | 'sandbox' | 'custom';
  cloudEndpoint?: string;
  cloudLinked?: boolean;
}

export interface ProfileWhoAmI {
  identity: {
    profile: string;
    identityMode: string | null;
    profileDocPresent: boolean;
  };
  authentication: {
    authenticated: boolean;
    session: ProfileSession | null;
  };
  capability: {
    note: string;
    providerAuthConfigured: string[];
  };
  authority: {
    note: string;
    rolesPath: string;
    rolesPresent: boolean;
    agentRoles: Record<string, string>;
    elevationPendingCount: number;
  };
  disclaimer: string;
}

export interface EcosystemOrientSnapshot {
  spec: typeof AGENT_STATE_SPEC;
  kind: 'boot-orientation';
  profile: string;
  generatedAt: string;
  authenticated: boolean;
  enlistedProviders: Array<{ name: string; authenticated: boolean; configured: boolean }>;
  runtimeHealth: { handoffPresent: boolean; agentStateLatestPresent: boolean; rolesPresent: boolean };
  authorityRefs: { rolesPath: string; agentRoleCount: number };
  quotaFreshnessSummary: {
    fresh: number;
    degraded: number;
    unknown: number;
    total: number;
  };
  communicationSurfaces: Array<{ name: string; url: string; kind: string }>;
  receipts: Array<{ slice: string; status: 'ok' | 'empty' | 'degraded' | 'missing'; detail: string }>;
}

export interface EcosystemSnapshot {
  spec: typeof AGENT_STATE_SPEC;
  kind: 'task-scoped-hydration';
  profile: string;
  generatedAt: string;
  authenticated: boolean;
  orientation: EcosystemOrientSnapshot;
  slices: {
    profile: Record<string, unknown> | null;
    session: ProfileSession | null;
    agents: AgentStateEntry[];
    quotas: AgentQuotaRecord[];
    tasks: unknown[];
    projects: unknown[];
    sources: unknown[];
    platforms: unknown[];
    websites: unknown[];
  };
  receipts: Array<{
    slice: string;
    status: 'ok' | 'empty' | 'degraded' | 'missing';
    detail: string;
  }>;
}
