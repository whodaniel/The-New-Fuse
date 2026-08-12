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
 *   needs a reply channel and belongs in a later change; promising it here
 *   would recreate the very over-claiming this fixes.
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
  const live = typeof match.isOnline === 'boolean' ? match.isOnline : age < windowMs;

  return {
    status: live ? 'live' : 'stale',
    agentId,
    name: match.name,
    role: match.role,
    lastSeen: match.lastSeen,
    staleSeconds: Number.isFinite(age) ? Math.round(age / 1000) : undefined,
    suggestions: [],
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
 *   stale    → send (the queue is durable and the agent may return), but WARN
 *              and exit 0 — unless `requireLive`, which is what cron and the
 *              full-auto loop should use, where a queued message to a dead
 *              worker is indistinguishable from progress.
 *   live     → send, exit 0.
 */
export function decideDispatch(
  resolution: RecipientResolution,
  options: { requireLive?: boolean } = {}
): DispatchDecision {
  if (resolution.status === 'unknown') {
    return { proceed: false, exitCode: 2, level: 'error', resolution };
  }
  if (resolution.status === 'stale') {
    return options.requireLive
      ? { proceed: false, exitCode: 3, level: 'error', resolution }
      : { proceed: true, exitCode: 0, level: 'warn', resolution };
  }
  return { proceed: true, exitCode: 0, level: 'ok', resolution };
}
