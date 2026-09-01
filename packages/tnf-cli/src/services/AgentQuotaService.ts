/**
 * Per-agent usage quota observations for delegation composition.
 *
 * UNKNOWN quota stays UNKNOWN (remaining/limit null) — never invent 0 or Infinity.
 * Quota is one ranking component; it must not override authority hard-gates.
 */
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  AgentQuotaRecord,
  AgentStateEntry,
  DEFAULT_QUOTA_FRESHNESS_TTL_SEC,
  DelegationHints,
  QuotaConfidence,
  RankedAgent,
} from './agent-state-types.js';

const requireFromHere = createRequire(import.meta.url);

export interface AgentQuotaServiceOptions {
  tnfHome?: string;
  freshnessTtlSec?: number;
  now?: () => Date;
  repoRoot?: string;
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function loadRoles(tnfHome: string): Record<string, string> {
  const roles = readJson(path.join(tnfHome, 'authority', 'roles.json')) as {
    agents?: Record<string, { role?: string }>;
  } | null;
  const out: Record<string, string> = {};
  if (!roles?.agents) return out;
  for (const [id, row] of Object.entries(roles.agents)) {
    if (row?.role) out[id] = String(row.role);
  }
  return out;
}

export class AgentQuotaService {
  private tnfHome: string;
  private freshnessTtlSec: number;
  private now: () => Date;
  private repoRoot?: string;

  constructor(options: AgentQuotaServiceOptions = {}) {
    this.tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    this.freshnessTtlSec = options.freshnessTtlSec ?? DEFAULT_QUOTA_FRESHNESS_TTL_SEC;
    this.now = options.now || (() => new Date());
    this.repoRoot = options.repoRoot;
  }

  private loadProviderLimits(): Record<
    string,
    { limit: number; unit: AgentQuotaRecord['unit']; resetAt: string | null; confidence: QuotaConfidence }
  > {
    const out: Record<
      string,
      { limit: number; unit: AgentQuotaRecord['unit']; resetAt: string | null; confidence: QuotaConfidence }
    > = {};
    for (const file of [
      path.join(this.tnfHome, 'llm-config.json'),
      path.join(this.tnfHome, 'provider-config.json'),
    ]) {
      const data = readJson(file) as Record<string, unknown> | null;
      if (!data || typeof data !== 'object') continue;
      const providers = (data.providers || data.models || data) as Record<string, unknown>;
      if (!providers || typeof providers !== 'object' || Array.isArray(providers)) continue;
      for (const [name, raw] of Object.entries(providers)) {
        if (!raw || typeof raw !== 'object') continue;
        const row = raw as Record<string, unknown>;
        const limit = asNumber(row.quotaLimit ?? row.limit ?? row.maxTokens ?? row.dailyLimit);
        if (limit == null || limit <= 0) continue;
        const unitRaw = String(row.quotaUnit || row.unit || 'tokens').toLowerCase();
        const unit: AgentQuotaRecord['unit'] =
          unitRaw === 'requests' || unitRaw === 'usd' || unitRaw === 'percent' || unitRaw === 'tokens'
            ? unitRaw
            : 'tokens';
        out[name.toLowerCase()] = {
          limit,
          unit,
          resetAt: row.resetAt || row.reset_at ? String(row.resetAt || row.reset_at) : null,
          confidence: 'reported',
        };
      }
    }
    return out;
  }

  private loadUsageCounters(): Record<string, number> {
    const out: Record<string, number> = {};
    const metricsDir = path.join(this.tnfHome, 'metrics');
    const candidates = [
      path.join(metricsDir, 'health-latest.json'),
      path.join(this.tnfHome, 'usage-latest.json'),
      path.join(this.tnfHome, 'agent-usage.json'),
    ];
    try {
      if (fs.existsSync(metricsDir)) {
        for (const name of fs.readdirSync(metricsDir)) {
          if (name.endsWith('.json')) candidates.push(path.join(metricsDir, name));
        }
      }
    } catch {
      // ignore
    }
    for (const file of candidates) {
      const data = readJson(file) as Record<string, unknown> | null;
      if (!data || typeof data !== 'object') continue;
      const usage =
        (data.usage as Record<string, unknown> | undefined) ||
        (data.quotas as Record<string, unknown> | undefined);
      if (usage && typeof usage === 'object' && !Array.isArray(usage)) {
        for (const [key, raw] of Object.entries(usage)) {
          if (typeof raw === 'number') out[key.toLowerCase()] = raw;
          else if (raw && typeof raw === 'object') {
            const n = asNumber((raw as Record<string, unknown>).used ?? (raw as any).tokensUsed);
            if (n != null) out[key.toLowerCase()] = n;
          }
        }
      }
    }
    return out;
  }

  inferProvider(agent: Pick<AgentStateEntry, 'platform' | 'name' | 'agentId'>): string {
    const platform = String(agent.platform || '').toLowerCase();
    if (platform) return platform;
    const name = String(agent.name || agent.agentId || '').toLowerCase();
    for (const hint of ['openai', 'anthropic', 'claude', 'gemini', 'google', 'nvidia', 'groq', 'openrouter']) {
      if (name.includes(hint)) return hint;
    }
    return 'unknown';
  }

  refreshForAgent(
    agent: Pick<AgentStateEntry, 'agentId' | 'name' | 'platform'>,
    options?: { provider?: string }
  ): AgentQuotaRecord {
    const observedAt = this.now().toISOString();
    const provider = (options?.provider || this.inferProvider(agent)).toLowerCase();
    const limits = this.loadProviderLimits();
    const usage = this.loadUsageCounters();
    const limitRow = limits[provider];
    const used =
      usage[agent.agentId.toLowerCase()] ??
      usage[String(agent.name || '').toLowerCase()] ??
      usage[provider] ??
      null;

    if (!limitRow && used == null) {
      return {
        agentId: agent.agentId,
        provider,
        dimension: 'unknown',
        unit: 'unknown',
        used: null,
        limit: null,
        remaining: null,
        remainingFraction: null,
        observedAt,
        refreshedAt: observedAt,
        resetAt: null,
        freshnessTtlSec: this.freshnessTtlSec,
        source: 'unavailable',
        confidence: 'unknown',
        degraded: true,
        reason: 'no quota signal — remaining stays UNKNOWN',
      };
    }

    const limit = limitRow?.limit ?? null;
    const unit = limitRow?.unit ?? 'unknown';
    const confidence: QuotaConfidence =
      limit != null && used != null ? 'reported' : limit != null || used != null ? 'inferred' : 'unknown';

    let remaining: number | null = null;
    let remainingFraction: number | null = null;
    if (limit != null && used != null) {
      remaining = Math.max(0, limit - used);
      remainingFraction = limit > 0 ? remaining / limit : null;
    } else if (limit != null && used == null) {
      // Limit known, usage unknown → remaining unknown (not "full").
      remaining = null;
      remainingFraction = null;
    }

    return {
      agentId: agent.agentId,
      provider,
      dimension: unit === 'unknown' ? 'quota' : unit,
      unit,
      used,
      limit,
      remaining,
      remainingFraction,
      observedAt,
      refreshedAt: observedAt,
      resetAt: limitRow?.resetAt ?? null,
      freshnessTtlSec: this.freshnessTtlSec,
      source: confidence === 'unknown' ? 'unavailable' : 'local-config+metrics',
      confidence,
      degraded: confidence === 'unknown',
      reason:
        confidence === 'unknown'
          ? 'no quota signal — remaining stays UNKNOWN'
          : used == null && limit != null
            ? 'limit known; usage unknown — remaining UNKNOWN'
            : undefined,
    };
  }

  refreshForAgents(agents: AgentStateEntry[]): AgentQuotaRecord[] {
    return agents.map((agent) => this.refreshForAgent(agent));
  }

  isFresh(record: AgentQuotaRecord, nowMs?: number): boolean {
    if (record.confidence === 'unknown') return false;
    const now = nowMs ?? this.now().getTime();
    const observed = Date.parse(record.observedAt || record.refreshedAt);
    if (!Number.isFinite(observed)) return false;
    return now - observed <= record.freshnessTtlSec * 1000;
  }

  markFreshness(record: AgentQuotaRecord, nowMs?: number): AgentQuotaRecord {
    if (record.confidence === 'unknown') {
      return { ...record, degraded: true, reason: record.reason || 'quota UNKNOWN' };
    }
    if (this.isFresh(record, nowMs)) return record;
    return {
      ...record,
      degraded: true,
      reason: record.reason || 'quota freshness TTL exceeded',
    };
  }

  attachAuthorityRoles(agents: AgentStateEntry[]): AgentStateEntry[] {
    const roles = loadRoles(this.tnfHome);
    return agents.map((agent) => ({
      ...agent,
      authorityRole: roles[agent.agentId] || roles[agent.name] || agent.authorityRole || null,
    }));
  }
}

function loadCapabilityScores(
  taskText: string | undefined,
  repoRoot: string | undefined
): Record<string, number> {
  if (!taskText || !repoRoot) return {};
  try {
    const matcher = requireFromHere(path.join(repoRoot, 'scripts/lib/tnf-agent-match.cjs')) as {
      findBestMatch?: (task: string, opts?: { limit?: number; minScore?: number }) => Array<{
        name: string;
        score: number;
      }>;
    };
    if (typeof matcher.findBestMatch !== 'function') return {};
    const matches = matcher.findBestMatch(taskText, { limit: 50, minScore: 0.05 });
    const out: Record<string, number> = {};
    for (const m of matches || []) out[String(m.name).toLowerCase()] = Number(m.score) || 0;
    return out;
  } catch {
    return {};
  }
}

/**
 * Compose delegation rank. Authority is a HARD GATE: ineligible agents never
 * win even if quota/capability scores are high.
 */
export function rankAgentsForDelegation(
  agents: AgentStateEntry[],
  hints: DelegationHints = {}
): RankedAgent[] {
  const preferOnline = hints.preferOnline !== false;
  const requiredCaps = (hints.capabilities || []).map((c) => c.toLowerCase());
  const requiredRoles = (hints.requiredAuthorityRoles || []).map((r) => r.toLowerCase());
  const now = hints.now ?? Date.now();
  const capScores = {
    ...loadCapabilityScores(hints.taskText, hints.repoRoot),
    ...(hints.capabilityScores || {}),
  };

  const ranked = agents.map((agent) => {
    const reasons: string[] = [];
    const components = {
      capability: 0,
      authority: 0,
      privacy: 0,
      availability: 0,
      quota: 0,
      latency: 0,
      context: 0,
      reliability: 0,
    };

    let authorityEligible = true;
    if (requiredRoles.length > 0) {
      const role = String(agent.authorityRole || agent.role || '').toLowerCase();
      authorityEligible = requiredRoles.includes(role);
      components.authority = authorityEligible ? 20 : -1000;
      reasons.push(authorityEligible ? `authority=${role || 'none'}` : 'authority-hard-gate-fail');
    } else if (agent.authorityRole) {
      components.authority = 5;
      reasons.push(`authority=${agent.authorityRole}`);
    }

    if (preferOnline && agent.isOnline) {
      components.availability = 25;
      reasons.push('online');
    } else if (preferOnline && !agent.isOnline) {
      components.availability = -15;
      reasons.push('offline');
    }

    const nameKey = String(agent.name || '').toLowerCase();
    const idKey = String(agent.agentId || '').toLowerCase();
    const matchScore = capScores[nameKey] ?? capScores[idKey] ?? 0;
    if (matchScore > 0) {
      components.capability += Math.round(matchScore * 40);
      reasons.push(`match=${matchScore.toFixed(2)}`);
    }
    if (requiredCaps.length > 0) {
      const caps = (agent.capabilities || []).map((c) => c.toLowerCase());
      const matched = requiredCaps.filter((c) => caps.includes(c)).length;
      components.capability += matched * 8;
      reasons.push(`caps=${matched}/${requiredCaps.length}`);
    }

    // Privacy/boundary: local/sandbox agents preferred slightly for personal tasks.
    const platform = String(agent.platform || '').toLowerCase();
    if (platform === 'vscode' || platform === 'custom') {
      components.privacy = 5;
      reasons.push('local-boundary');
    }

    const quota = agent.quota;
    if (!quota || quota.confidence === 'unknown' || quota.remaining == null || quota.limit == null) {
      components.quota = 0;
      reasons.push('quota=UNKNOWN');
    } else {
      const observed = Date.parse(quota.observedAt || quota.refreshedAt);
      const fresh =
        Number.isFinite(observed) &&
        now - observed <= quota.freshnessTtlSec * 1000 &&
        !quota.degraded;
      if (fresh) {
        components.quota = Math.round((quota.remainingFraction ?? 0) * 20);
        reasons.push(`quota=${quota.remaining}/${quota.limit}`);
      } else {
        components.quota = -5;
        reasons.push('quota-stale');
      }
    }

    // Latency/reliability proxies from lastSeen when present.
    if (agent.lastSeen) {
      const age = now - Date.parse(agent.lastSeen);
      if (Number.isFinite(age)) {
        if (age < 60_000) {
          components.latency = 8;
          components.reliability = 8;
          reasons.push('recent-heartbeat');
        } else if (age < 15 * 60_000) {
          components.latency = 3;
          components.reliability = 3;
        } else {
          components.reliability = -5;
          reasons.push('stale-heartbeat');
        }
      }
    }

    if (hints.taskText && (agent.capabilities || []).length) {
      components.context = 3;
    }

    const score = Object.values(components).reduce((a, b) => a + b, 0);
    return { agent, score, reasons, authorityEligible, components };
  });

  return ranked.sort((a, b) => {
    // Authority-ineligible always sort after eligible, regardless of score.
    if (a.authorityEligible !== b.authorityEligible) {
      return a.authorityEligible ? -1 : 1;
    }
    return b.score - a.score || a.agent.agentId.localeCompare(b.agent.agentId);
  });
}

/** Select winner: first authority-eligible ranked agent, or null. */
export function selectDelegate(ranked: RankedAgent[]): RankedAgent | null {
  return ranked.find((r) => r.authorityEligible) || null;
}
