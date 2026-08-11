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
