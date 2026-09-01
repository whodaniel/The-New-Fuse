/**
 * Thin frontend contract client for authenticated TNF ecosystem snapshots.
 *
 * Full Drive/cloud IO remains owned by the user-context provider track.
 * This client only consumes the shared ecosystem JSON shape produced by:
 *   - `tnf ecosystem show --json`
 *   - `scripts/runtime/tnf-ecosystem-hydrate.cjs`
 *   - Tauri `get_ecosystem_snapshot`
 */

export const ECOSYSTEM_SPEC = 'tnf/agent-state-quota-ecosystem/0.2' as const;

export interface EcosystemQuota {
  agentId: string;
  provider: string;
  dimension?: string;
  used?: number | null;
  limit?: number | null;
  remaining?: number | null;
  remainingFraction?: number | null;
  unit?: string;
  observedAt?: string;
  resetAt?: string | null;
  refreshedAt: string;
  freshnessTtlSec: number;
  source: string;
  confidence?: 'verified' | 'reported' | 'inferred' | 'unknown';
  degraded?: boolean;
  reason?: string;
}

export interface EcosystemAgent {
  agentId: string;
  name: string;
  role?: string;
  platform?: string;
  capabilities?: string[];
  isOnline: boolean;
  lastSeen?: string;
  source: string;
  quota?: EcosystemQuota | null;
}

export interface EcosystemReceipt {
  slice: string;
  status: 'ok' | 'empty' | 'degraded' | 'missing';
  detail: string;
}

/** Cheap boot orientation (prefer for first paint). */
export interface EcosystemOrientSnapshot {
  spec: typeof ECOSYSTEM_SPEC | string;
  kind: 'boot-orientation';
  profile: string;
  generatedAt: string;
  authenticated: boolean;
  enlistedProviders: Array<{ name: string; authenticated: boolean; configured: boolean }>;
  receipts: EcosystemReceipt[];
}

/** Task-scoped hydration (lazy; not for boot). */
export interface EcosystemSnapshot {
  spec: typeof ECOSYSTEM_SPEC | string;
  kind?: 'task-scoped-hydration';
  profile: string;
  generatedAt: string;
  authenticated: boolean;
  slices: {
    profile: Record<string, unknown> | null;
    session: Record<string, unknown> | null;
    agents: EcosystemAgent[];
    quotas: EcosystemQuota[];
    tasks: unknown[];
    projects: unknown[];
    sources: unknown[];
    platforms: unknown[];
    websites: unknown[];
  };
  receipts: EcosystemReceipt[];
}

export interface FetchEcosystemOptions {
  /** Absolute or relative URL that returns EcosystemSnapshot or orient JSON. */
  endpoint?: string;
  /** Optional bearer / session token for app.thenewfuse.com. */
  accessToken?: string;
  signal?: AbortSignal;
  /** Prefer cheap orientation endpoint when true (default false for back-compat). */
  orient?: boolean;
}

const DEFAULT_ENDPOINT = '/api/tnf/ecosystem';
const DEFAULT_ORIENT_ENDPOINT = '/api/tnf/ecosystem/orient';

export function isEcosystemOrientSnapshot(value: unknown): value is EcosystemOrientSnapshot {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.spec === 'string' &&
    row.kind === 'boot-orientation' &&
    typeof row.profile === 'string' &&
    typeof row.generatedAt === 'string' &&
    typeof row.authenticated === 'boolean'
  );
}

export function isEcosystemSnapshot(value: unknown): value is EcosystemSnapshot {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.spec === 'string' &&
    typeof row.profile === 'string' &&
    typeof row.generatedAt === 'string' &&
    typeof row.authenticated === 'boolean' &&
    !!row.slices &&
    typeof row.slices === 'object'
  );
}

/**
 * Fetch authenticated ecosystem orient (boot) or hydrate (task-scoped) JSON.
 * Callers should gate this behind RequireAuth / an active TNF session.
 */
export async function fetchEcosystemSnapshot(
  options: FetchEcosystemOptions = {}
): Promise<EcosystemSnapshot | EcosystemOrientSnapshot> {
  const endpoint =
    options.endpoint || (options.orient ? DEFAULT_ORIENT_ENDPOINT : DEFAULT_ENDPOINT);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Ecosystem fetch failed (${response.status}) at ${endpoint}`);
  }

  const payload = await response.json();
  if (options.orient) {
    if (!isEcosystemOrientSnapshot(payload)) {
      throw new Error('Ecosystem orient payload does not match tnf/agent-state-quota-ecosystem/0.2');
    }
    return payload;
  }
  if (!isEcosystemSnapshot(payload)) {
    throw new Error('Ecosystem payload does not match tnf/agent-state-quota-ecosystem/0.2');
  }
  return payload;
}

export function summarizeEcosystem(snapshot: EcosystemSnapshot | EcosystemOrientSnapshot): string {
  if (isEcosystemOrientSnapshot(snapshot)) {
    return [
      `kind=orient`,
      `profile=${snapshot.profile}`,
      `auth=${snapshot.authenticated ? 'yes' : 'no'}`,
      `providers=${snapshot.enlistedProviders.length}`,
      `receipts=${snapshot.receipts.length}`,
    ].join(' ');
  }
  const s = snapshot.slices;
  return [
    `kind=hydrate`,
    `profile=${snapshot.profile}`,
    `auth=${snapshot.authenticated ? 'yes' : 'no'}`,
    `agents=${s.agents.length}`,
    `quotas=${s.quotas.length}`,
    `tasks=${s.tasks.length}`,
    `projects=${s.projects.length}`,
    `sources=${s.sources.length}`,
    `platforms=${s.platforms.length}`,
    `websites=${s.websites.length}`,
  ].join(' ');
}
