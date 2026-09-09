/**
 * Helpers for full-auto cycle budgeting and durable counter rollups.
 * Kept out of cli.ts so behavior can be unit-tested without bootstrapping
 * the whole Command tree.
 */

export type FullAutoRunEventLike = {
  ok: boolean;
  cycle?: number;
};

/** Default ceiling for post-cycle broadcast/status when the primary run succeeded. */
export const DEFAULT_FULL_AUTO_POST_STEP_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Consecutive failed cycles that trip the in-loop circuit breaker.
 * Mirrors FULL_AUTO_FAIL_STREAK in scripts/protocols/validate-substrate-attestation.cjs;
 * both must agree or the daemon and the attestor disagree about what "streaking" means.
 */
export const FULL_AUTO_FAIL_STREAK = 5;

/**
 * After a successful primary self-improvement run, post-steps (broadcast,
 * status) must not consume the entire remaining cycle budget — a hung
 * orchestrate previously marked an otherwise-good cycle as TIMED OUT.
 */
export function resolvePostStepTimeoutMs(
  remainingCycleMs: number,
  postStepCeilingMs: number = DEFAULT_FULL_AUTO_POST_STEP_TIMEOUT_MS
): number {
  const remaining = Math.max(0, remainingCycleMs);
  const ceiling = Math.max(1, postStepCeilingMs);
  return Math.max(1, Math.min(remaining, ceiling));
}

/** Roll completed/failed counts from the durable run log (daemon-restart safe). */
export function tallyFullAutoRuns(events: FullAutoRunEventLike[]): {
  completedCycles: number;
  failedCycles: number;
} {
  let completedCycles = 0;
  let failedCycles = 0;
  for (const event of events) {
    if (event?.ok) completedCycles += 1;
    else failedCycles += 1;
  }
  return { completedCycles, failedCycles };
}

/**
 * Consecutive failures at the tail of the run log.
 *
 * The lifetime `failedCycles` counter cannot answer "is the loop broken right
 * now" — once it passes the threshold it stays past it forever, so gates built
 * on it are either permanently tripped or (when paired with a `lastRun.ok`
 * escape hatch) never tripped at all. A trailing streak is the question the
 * circuit breaker actually wants answered.
 */
export function countTrailingFailures(events: FullAutoRunEventLike[]): number {
  let streak = 0;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.ok) break;
    streak += 1;
  }
  return streak;
}

export type FullAutoQualityGateVerdict = 'passed' | 'failed' | 'unverified' | 'skipped';

export class QualityGateError extends Error {
  constructor(
    readonly verdict: FullAutoQualityGateVerdict,
    readonly reason: string
  ) {
    super(`Strict status gate ${verdict}: ${reason}`);
    this.name = 'QualityGateError';
  }
}

/** Require an explicit child verdict; crashes and malformed output never pass. */
export function classifyStrictStatusGate(input: {
  exitCode: number | null;
  stdout: string;
  timedOut?: boolean;
  spawnError?: string;
}): { verdict: FullAutoQualityGateVerdict; reason?: string } {
  if (input.timedOut) return { verdict: 'unverified', reason: 'Strict status gate timed out' };
  if (input.spawnError) return { verdict: 'unverified', reason: input.spawnError };
  let payload: unknown;
  try {
    payload = JSON.parse(input.stdout.trim());
  } catch {
    return { verdict: 'unverified', reason: 'Strict status gate returned invalid JSON' };
  }
  if (!payload || typeof payload !== 'object' || !('ok' in payload) || typeof payload.ok !== 'boolean') {
    return { verdict: 'unverified', reason: 'Strict status gate returned no boolean verdict' };
  }
  if (input.exitCode === null) return { verdict: 'unverified', reason: 'Strict status gate did not exit normally' };
  if (!payload.ok) return { verdict: 'failed', reason: input.stdout.trim() };
  if (input.exitCode !== 0) return { verdict: 'unverified', reason: `Passing verdict with exit code ${input.exitCode}` };
  return { verdict: 'passed' };
}

/** Recovery must retain its quarantine until a complete, strictly gated pass. */
export function resolveFullAutoCompletion(
  previous: { mode?: string; quarantinedAt?: string; quarantineReason?: string; completedCycles?: number; failedCycles?: number },
  events: FullAutoRunEventLike[],
  event: FullAutoRunEventLike & { qualityGate?: FullAutoQualityGateVerdict; finishedAt: string }
): { mode: 'idle' | 'quarantined'; completedCycles: number; failedCycles: number;
     quarantinedAt?: string; quarantineReason?: string; recoveredAt?: string } {
  const history = [...events, event];
  const logged = tallyFullAutoRuns(events);
  // Retention may remove older events; do not erase durable lifetime totals.
  const counts = {
    completedCycles: Math.max(logged.completedCycles, previous.completedCycles || 0) + (event.ok ? 1 : 0),
    failedCycles: Math.max(logged.failedCycles, previous.failedCycles || 0) + (event.ok ? 0 : 1),
  };
  const strictPass = event.ok && event.qualityGate === 'passed';
  if (previous.mode === 'quarantined' && !strictPass) {
    return { ...counts, mode: 'quarantined', quarantinedAt: previous.quarantinedAt,
      quarantineReason: previous.quarantineReason };
  }
  const streak = countTrailingFailures(history);
  if (streak >= FULL_AUTO_FAIL_STREAK) return { ...counts, mode: 'quarantined',
    quarantinedAt: event.finishedAt, quarantineReason: `${streak} consecutive failed cycles (>= ${FULL_AUTO_FAIL_STREAK})` };
  return { ...counts, mode: 'idle',
    ...(previous.mode === 'quarantined' && strictPass ? { recoveredAt: event.finishedAt } : {}) };
}
