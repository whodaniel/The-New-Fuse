/**
 * packages/tnf-cli/src/services/DispatchGuard.ts
 *
 * Recipient resolution and delivery honesty for fleet dispatch (`tnf send`).
 *
 * THE DEFECT THIS CLOSES
 *   `tnf send "..." --to <anything>` published to Redis and printed
 *   "📤 Message sent" unconditionally. Measured 2026-08-12:
 *
 *     tnf send "..." --to DIRECTOR-1786507420823   → "Message sent", exit 0
 *       (that director's last heartbeat was four hours earlier)
 *     tnf send "..." --to agent_does_not_exist_12345 → "Message sent", exit 0
 *       (no such agent has ever existed)
 *
 *   Dispatch could not fail. A typo'd agent id, a dead worker and a healthy
 *   worker were indistinguishable to the caller, and every automated path —
 *   cron jobs, the full-auto loop, handoff fan-out — read that exit 0 as
 *   delivery. This is the most likely mechanism behind the long run of
 *   full-auto cycles that "succeeded" while accomplishing nothing.
 *
 * WHY IT IS A PROTOCOL BUG, NOT A UX NICETY
 *   TURN_ZERO_MANDATE Core Tenet 4 is "Inspect → Act → Verify. Never assume
 *   action succeeded without empirical proof." `tnf send` — the fleet's own
 *   primary act — violated it. Closing this makes the dispatch layer obey the
 *   tenet the rest of the protocol is written against, which is the same
 *   correction already applied to `tnf parity` (a shimmed command name is not
 *   coverage; a queued message to a corpse is not delivery).
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It does not claim the recipient *processed* the message — only that the
 *   recipient exists and was heartbeating recently. End-to-end acknowledgement
 *   is bus contract v1: `RedisAgentClient.sendWithAck` + the `tnf:ack` channel
 *   (see docs/protocols/AGENT_BUS_CONTRACT.md). This guard still only judges
 *   REGISTRY state — liveness and declared capacity — not per-frame delivery.
 *
 * KNOWN TRANSPORT INCOHERENCE (measured 2026-08-12, addressed 2026-08-12)
 *   Cron workers drain LIST queues at `tnf:direct:sub-director:<agentId>`.
 *   `tnf send` now LPUSHes worker envelopes to that queue when the recipient
 *   role is `worker`, while still publishing for live subscribers. See
 *   `docs/protocols/TNF_TRANSPORT_LANE_SPEC.md`.
 */

/** Shape borrowed from RedisAgentClient.listAgents(); kept structural. */
export interface RegisteredAgent {
  agentId?: string;
  id?: string;
  name?: string;
  role?: string;
  platform?: string;
  lastSeen?: string;
  isOnline?: boolean;
  /**
   * How often this agent is expected to heartbeat, in seconds.
   *
   * Cron-driven workers beat every 300-900s, not every 30s. Without this the
   * flat 60s window marked healthy workers stale 80-93% of the time. Agents
   * that declare nothing keep the flat window.
   */
  expectedCadenceSec?: number;
  /**
   * Bus contract v1 capacity fields (docs/protocols/AGENT_BUS_CONTRACT.md).
   * `status: 'busy'` is a declaration by the agent itself; `currentLoad`/
   * `maxLoad` let the broker derive saturation for multi-capacity agents.
   * Agents that declare nothing are assumed to have capacity (backward
   * compatible with every existing registry row).
   */
  status?: string;
  currentLoad?: number;
  maxLoad?: number;
}

export type RecipientStatus = 'live' | 'stale' | 'unknown' | 'broadcast';

export interface RecipientResolution {
  status: RecipientStatus;
  /** The id as resolved against the registry (may differ in case). */
  agentId?: string;
  name?: string;
  role?: string;
  lastSeen?: string;
  /** Whole seconds since the last heartbeat; undefined when unknown. */
  staleSeconds?: number;
  /** Registered ids that look like what the caller typed. */
  suggestions: string[];
  /** One-line explanation suitable for terminal output. */
  summary: string;
  /** Capacity declaration for the matched agent (undefined when unmatched). */
  capacity?: CapacityAssessment;
}

export interface CapacityAssessment {
  /** The registry row carried any capacity information at all. */
  declared: boolean;
  /** The agent declared itself busy, or reported load at max. */
  busy: boolean;
  currentLoad?: number;
  maxLoad?: number;
  /** One-line explanation suitable for terminal output. */
  summary: string;
}

/**
 * Bus contract v1: derive a capacity verdict from a registry row.
 *
 * Busy means the agent declared `status: 'busy'` OR reported a load counter
 * that has reached its max. An agent that declares nothing is NOT busy —
 * the gate must stay backwards compatible with rows that predate the
 * capacity fields.
 */
export function assessCapacity(agent: RegisteredAgent | undefined): CapacityAssessment {
  const status = String(agent?.status ?? '').toLowerCase();
  const currentLoad = typeof agent?.currentLoad === 'number' ? agent.currentLoad : undefined;
  const maxLoad = typeof agent?.maxLoad === 'number' ? agent.maxLoad : undefined;
  const declared = Boolean(status) || currentLoad !== undefined || maxLoad !== undefined;
  const atLoadCap =
    currentLoad !== undefined && maxLoad !== undefined && maxLoad > 0 && currentLoad >= maxLoad;
  const busy = status === 'busy' || atLoadCap;
  const summary = !declared
    ? 'no capacity declared'
    : status === 'busy'
      ? 'declared busy'
      : atLoadCap
        ? `at capacity (${currentLoad}/${maxLoad})`
        : currentLoad !== undefined && maxLoad !== undefined
          ? `spare capacity (${currentLoad}/${maxLoad})`
          : 'not busy';
  return { declared, busy, currentLoad, maxLoad, summary };
}

/**
 * How long after the last heartbeat an agent is still considered live.
 *
 * Matches RedisAgentClient's own rule (2 heartbeat intervals) so the roster
 * and dispatch never disagree about who is up — one liveness source, not two.
 */
export const DEFAULT_LIVENESS_WINDOW_MS = 60_000;

function idOf(agent: RegisteredAgent): string {
  return String(agent.agentId ?? agent.id ?? '').trim();
}

/** Cheap similarity for "did you mean" — case-insensitive substring both ways. */
function looksLike(candidate: string, typed: string): boolean {
  const c = candidate.toLowerCase();
  const t = typed.toLowerCase();
  if (!t) return false;
  if (c.includes(t) || t.includes(c)) return true;
  // Also match on the human-readable segment of `agent_<name>_<timestamp>`.
  const segment = c.split('_')[1];
  return Boolean(segment && (segment.includes(t) || t.includes(segment)));
}

function describeAge(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 90) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

/**
 * Classify a dispatch recipient against the live registry.
 *
 * `now` is injected so the tests are not clock-dependent.
 */
export function resolveRecipient(
  to: string | undefined,
  agents: RegisteredAgent[],
  options: { now?: number; livenessWindowMs?: number } = {}
): RecipientResolution {
  const now = options.now ?? Date.now();
  const windowMs = options.livenessWindowMs ?? DEFAULT_LIVENESS_WINDOW_MS;

  // No recipient means an intentional broadcast; there is nothing to verify.
  if (!to || !to.trim()) {
    return {
      status: 'broadcast',
      suggestions: [],
      summary: `broadcast to ${agents.length} registered agent(s)`,
    };
  }

  const typed = to.trim();
  const match =
    agents.find((agent) => idOf(agent) === typed) ??
    agents.find((agent) => idOf(agent).toLowerCase() === typed.toLowerCase()) ??
    agents.find((agent) => String(agent.name ?? '').toLowerCase() === typed.toLowerCase());

  if (!match) {
    const suggestions = agents
      .map(idOf)
      .filter(Boolean)
      .filter((id) => looksLike(id, typed))
      .slice(0, 5);
    return {
      status: 'unknown',
      suggestions,
      summary: `no agent registered as "${typed}"`,
    };
  }

  const agentId = idOf(match);
  const lastSeenMs = match.lastSeen ? Date.parse(match.lastSeen) : NaN;
  const age = Number.isFinite(lastSeenMs) ? now - lastSeenMs : Number.POSITIVE_INFINITY;

  // Prefer the registry's own isOnline when present so a future change to the
  // heartbeat rule propagates here automatically rather than silently drifting.
  // When it is absent, honour the agent's declared cadence before falling back
  // to the flat window — otherwise this would call a healthy cron worker stale
  // exactly as the old rule did.
  const cadenceSec = Number(match.expectedCadenceSec);
  const effectiveWindowMs =
    Number.isFinite(cadenceSec) && cadenceSec > 0 ? cadenceSec * 1000 * 2 : windowMs;
  const live = typeof match.isOnline === 'boolean' ? match.isOnline : age < effectiveWindowMs;

  return {
    status: live ? 'live' : 'stale',
    agentId,
    name: match.name,
    role: match.role,
    lastSeen: match.lastSeen,
    staleSeconds: Number.isFinite(age) ? Math.round(age / 1000) : undefined,
    suggestions: [],
    capacity: assessCapacity(match),
    summary: live
      ? `${match.name ?? agentId} (${match.role ?? 'agent'}) is live`
      : `${match.name ?? agentId} (${match.role ?? 'agent'}) last heartbeat ${
          Number.isFinite(age) ? describeAge(age) : 'never'
        }`,
  };
}

export interface DispatchDecision {
  /** Whether the message should actually be published. */
  proceed: boolean;
  /** Process exit code the caller should use. */
  exitCode: number;
  /** 'error' | 'warn' | 'ok' — how the caller should render `summary`. */
  level: 'error' | 'warn' | 'ok';
  resolution: RecipientResolution;
}

/**
 * Decide what to do with a resolved recipient.
 *
 * Policy, chosen so that automation fails loudly and humans are not blocked:
 *   unknown  → refuse to send, exit 2. A message addressed to nobody is a bug
 *              in the caller every time; delivering it teaches the caller the
 *              id was fine.
 *   busy     → with `requireCapacity`, refuse to send, exit 4. "Active but
 *              busy" is exactly the state cron must not pile onto — the frame
 *              would sit behind in-flight work with no visibility. Use --force
 *              to override for humans who know better.
 *   stale    → send (the queue is durable and the agent may return), but WARN
 *              and exit 0 — unless `requireLive`, which is what cron and the
 *              full-auto loop should use, where a queued message to a dead
 *              worker is indistinguishable from progress.
 *   live     → send, exit 0.
 */
export function decideDispatch(
  resolution: RecipientResolution,
  options: { requireLive?: boolean; requireCapacity?: boolean } = {}
): DispatchDecision {
  if (resolution.status === 'unknown') {
    return { proceed: false, exitCode: 2, level: 'error', resolution };
  }
  if (options.requireCapacity && resolution.capacity?.busy) {
    return { proceed: false, exitCode: 4, level: 'error', resolution };
  }
  if (resolution.status === 'stale') {
    return options.requireLive
      ? { proceed: false, exitCode: 3, level: 'error', resolution }
      : { proceed: true, exitCode: 0, level: 'warn', resolution };
  }
  return { proceed: true, exitCode: 0, level: 'ok', resolution };
}
