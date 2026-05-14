import * as crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
 SelfAssessmentResult,
 AutoPromptSequenceDefinition,
 SelfAdjustmentAction,
} from '../types/events';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface StaleSequencePolicy {
  /** What to do when a sequence is flagged stale. Default: 'disable'. */
  action: 'disable' | 'increase_cooldown';
  /** When action='increase_cooldown', multiply the sequence cooldown by this factor. Default: 2. */
  cooldownMultiplier: number;
  /** Upper cap for cooldown in ms when repeatedly increasing. Default: 600_000 (10 min). */
  maxCooldownMs: number;
}

export interface AdaptationRatePolicy {
  /** How much to scale the adaptation rate down per M-streak of passes. Default: 0.5 (halve it). */
  reductionFactor: number;
  /** Floor for the adaptation rate multiplier — never reduce below this. Default: 0.1. */
  minRateMultiplier: number;
  /** When the streak breaks (a fail occurs), reset the multiplier back to 1. Default: true. */
  resetOnBreak: boolean;
}

export interface SelfAssessmentLoopOptions {
  /** Polling interval in milliseconds. Default: 30_000 (30 s). */
  intervalMs: number;
  /** Number of consecutive failures before flagging a sequence as stale. Default: 5. */
  staleFailThreshold: number;
  /** Number of consecutive passes before reducing adaptation rate. Default: 3. */
  adaptationPassThreshold: number;
  /** Policy for stale sequences. */
  stalePolicy: StaleSequencePolicy;
  /** Policy for adaptation rate changes. */
  adaptationRatePolicy: AdaptationRatePolicy;
  /** Maximum assessment history to retain per sequence+stream key. Default: 100. */
  maxHistoryPerKey: number;
}

const DEFAULT_STALE_POLICY: StaleSequencePolicy = {
  action: 'disable',
  cooldownMultiplier: 2,
  maxCooldownMs: 600_000,
};

const DEFAULT_ADAPTATION_RATE_POLICY: AdaptationRatePolicy = {
  reductionFactor: 0.5,
  minRateMultiplier: 0.1,
  resetOnBreak: true,
};

export const DEFAULT_SELF_ASSESSMENT_LOOP_OPTIONS: SelfAssessmentLoopOptions = {
  intervalMs: 30_000,
  staleFailThreshold: 5,
  adaptationPassThreshold: 3,
  stalePolicy: DEFAULT_STALE_POLICY,
  adaptationRatePolicy: DEFAULT_ADAPTATION_RATE_POLICY,
  maxHistoryPerKey: 100,
};

// ---------------------------------------------------------------------------
// Emitted event payloads
// ---------------------------------------------------------------------------

export interface StaleSequenceEvent {
  sequenceId: string;
  streamId: string;
  consecutiveFails: number;
  action: StaleSequencePolicy['action'];
  previousCooldownMs?: number;
  newCooldownMs?: number;
  timestamp: string;
}

export interface AdaptationRateChangedEvent {
  sequenceId: string;
  streamId: string;
  consecutivePasses: number;
  previousRateMultiplier: number;
  newRateMultiplier: number;
  reason: string;
  timestamp: string;
}

export interface SelfAssessmentLoopTickEvent {
  tickId: string;
  assessedKeys: number;
  staleActions: number;
  rateChanges: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Internal tracking types
// ---------------------------------------------------------------------------

interface StreakTracker {
  consecutiveFails: number;
  consecutivePasses: number;
  history: SelfAssessmentResult[];
  rateMultiplier: number;
  flaggedStale: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SelfAssessmentLoop extends EventEmitter {
  private readonly options: SelfAssessmentLoopOptions;
  private readonly trackers = new Map<string, StreakTracker>();
  private readonly sequences: AutoPromptSequenceDefinition[];
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private running = false;

  /**
   * Build the key used to track streaks — one per sequence+stream pair.
   */
  private static trackerKey(sequenceId: string, streamId: string): string {
    return `${sequenceId}::${streamId}`;
  }

  constructor(
    sequences: AutoPromptSequenceDefinition[],
    options?: Partial<SelfAssessmentLoopOptions>,
  ) {
    super();
    this.sequences = sequences;
    this.options = {
      ...DEFAULT_SELF_ASSESSMENT_LOOP_OPTIONS,
      ...options,
      stalePolicy: { ...DEFAULT_STALE_POLICY, ...options?.stalePolicy },
      adaptationRatePolicy: {
        ...DEFAULT_ADAPTATION_RATE_POLICY,
        ...options?.adaptationRatePolicy,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.timerHandle = setInterval(() => this.tick(), this.options.intervalMs);
    this.emit('loop_started', { intervalMs: this.options.intervalMs, timestamp: new Date().toISOString() });
  }

  stop(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.emit('loop_stopped', { timestamp: new Date().toISOString() });
  }

  isRunning(): boolean {
    return this.running;
  }

  // -----------------------------------------------------------------------
  // Public API — ingest assessment results
  // -----------------------------------------------------------------------

  /**
   * Ingest a SelfAssessmentResult produced by the AutoPromptOrchestrator.
   * The loop keeps a bounded history per sequence+stream and updates streaks.
   */
  ingest(assessment: SelfAssessmentResult): void {
    const key = SelfAssessmentLoop.trackerKey(assessment.sequenceId, assessment.streamId);
    let tracker = this.trackers.get(key);
    if (!tracker) {
      tracker = {
        consecutiveFails: 0,
        consecutivePasses: 0,
        history: [],
        rateMultiplier: 1.0,
        flaggedStale: false,
      };
      this.trackers.set(key, tracker);
    }

    // Update streaks
    if (assessment.passed) {
      tracker.consecutivePasses += 1;
      tracker.consecutiveFails = 0;
    } else {
      tracker.consecutiveFails += 1;
      tracker.consecutivePasses = 0;
      // If a pass streak breaks, optionally reset the rate multiplier
      if (this.options.adaptationRatePolicy.resetOnBreak && tracker.rateMultiplier < 1.0) {
        const previousMultiplier = tracker.rateMultiplier;
        tracker.rateMultiplier = 1.0;
        this.emit('adaptation_rate_changed', {
          sequenceId: assessment.sequenceId,
          streamId: assessment.streamId,
          consecutivePasses: 0,
          previousRateMultiplier: previousMultiplier,
          newRateMultiplier: 1.0,
          reason: 'fail broke the pass streak; rate multiplier reset to 1.0',
          timestamp: new Date().toISOString(),
        } satisfies AdaptationRateChangedEvent);
      }
    }

    // Append to bounded history
    tracker.history.push(assessment);
    if (tracker.history.length > this.options.maxHistoryPerKey) {
      tracker.history = tracker.history.slice(-this.options.maxHistoryPerKey);
    }
  }

  /**
   * Convenience: subscribe this loop to an AutoPromptOrchestrator's
   * 'self_assessment' events so every assessment is automatically ingested.
   */
  attachToOrchestrator(orchestrator: EventEmitter): void {
    orchestrator.on('self_assessment', (assessment: SelfAssessmentResult) => {
      this.ingest(assessment);
    });
  }

  // -----------------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------------

  getStreak(sequenceId: string, streamId: string): { consecutiveFails: number; consecutivePasses: number } {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    const tracker = this.trackers.get(key);
    if (!tracker) {
      return { consecutiveFails: 0, consecutivePasses: 0 };
    }
    return { consecutiveFails: tracker.consecutiveFails, consecutivePasses: tracker.consecutivePasses };
  }

  getRateMultiplier(sequenceId: string, streamId: string): number {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    return this.trackers.get(key)?.rateMultiplier ?? 1.0;
  }

  isFlaggedStale(sequenceId: string, streamId: string): boolean {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    return this.trackers.get(key)?.flaggedStale ?? false;
  }

  getHistory(sequenceId: string, streamId: string): SelfAssessmentResult[] {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    const tracker = this.trackers.get(key);
    if (!tracker) {
      return [];
    }
    return [...tracker.history];
  }

  // -----------------------------------------------------------------------
  // Periodic tick — evaluates streaks and takes action
  // -----------------------------------------------------------------------

  private tick(): void {
    const tickId = crypto.randomUUID();
    let staleActions = 0;
    let rateChanges = 0;

    const entries = Array.from(this.trackers.entries());
    for (const [key, tracker] of entries) {
      const [sequenceId, streamId] = key.split('::') as [string, string];
      const sequence = this.sequences.find((s) => s.sequenceId === sequenceId);

      // ---- Stale sequence detection ----
      if (
        tracker.consecutiveFails >= this.options.staleFailThreshold &&
        !tracker.flaggedStale
      ) {
        tracker.flaggedStale = true;
        staleActions += 1;

        const staleEvent = this.applyStaleAction(sequence, sequenceId, streamId, tracker);
        this.emit('stale_sequence', staleEvent);
      }

      // Allow recovery: if a previously stale sequence now has a pass streak,
      // unflag it so it can be re-enabled externally.
      if (tracker.flaggedStale && tracker.consecutivePasses > 0) {
        tracker.flaggedStale = false;
      }

      // ---- Adaptation rate reduction ----
      if (
        tracker.consecutivePasses > 0 &&
        tracker.consecutivePasses % this.options.adaptationPassThreshold === 0 &&
        tracker.rateMultiplier > this.options.adaptationRatePolicy.minRateMultiplier
      ) {
        const previousMultiplier = tracker.rateMultiplier;
        tracker.rateMultiplier = Math.max(
          this.options.adaptationRatePolicy.minRateMultiplier,
          tracker.rateMultiplier * this.options.adaptationRatePolicy.reductionFactor,
        );

        if (tracker.rateMultiplier !== previousMultiplier) {
          rateChanges += 1;
          this.emit('adaptation_rate_changed', {
            sequenceId,
            streamId,
            consecutivePasses: tracker.consecutivePasses,
            previousRateMultiplier: previousMultiplier,
            newRateMultiplier: tracker.rateMultiplier,
            reason: `${tracker.consecutivePasses} consecutive passes; scaling adaptation rate down to reduce noise`,
            timestamp: new Date().toISOString(),
          } satisfies AdaptationRateChangedEvent);
        }
      }
    }

    this.emit('tick', {
      tickId,
      assessedKeys: this.trackers.size,
      staleActions,
      rateChanges,
      timestamp: new Date().toISOString(),
    } satisfies SelfAssessmentLoopTickEvent);
  }

  // -----------------------------------------------------------------------
  // Stale action helpers
  // -----------------------------------------------------------------------

  private applyStaleAction(
    sequence: AutoPromptSequenceDefinition | undefined,
    sequenceId: string,
    streamId: string,
    tracker: StreakTracker,
  ): StaleSequenceEvent {
    const policy = this.options.stalePolicy;
    const eventBase: StaleSequenceEvent = {
      sequenceId,
      streamId,
      consecutiveFails: tracker.consecutiveFails,
      action: policy.action,
      timestamp: new Date().toISOString(),
    };

    if (!sequence) {
      // Sequence definition not found — just emit the event, consumer can act.
      return eventBase;
    }

    if (policy.action === 'disable') {
      sequence.enabled = false;
      return eventBase;
    }

    if (policy.action === 'increase_cooldown') {
      const currentCooldown = sequence.trigger.cooldownMs ?? 20_000;
      const newCooldown = Math.min(currentCooldown * policy.cooldownMultiplier, policy.maxCooldownMs);
      sequence.trigger.cooldownMs = newCooldown;
      return {
        ...eventBase,
        previousCooldownMs: currentCooldown,
        newCooldownMs: newCooldown,
      };
    }

    return eventBase;
  }

  // -----------------------------------------------------------------------
  // Utility — generate SelfAdjustmentAction entries reflecting the current
  // rate multiplier, useful for attaching to the next assessment cycle.
  // -----------------------------------------------------------------------

  computeAdjustmentsForSequence(
    sequenceId: string,
    streamId: string,
  ): SelfAdjustmentAction[] {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    const tracker = this.trackers.get(key);
    if (!tracker || tracker.rateMultiplier >= 1.0) {
      return [];
    }

    const sequence = this.sequences.find((s) => s.sequenceId === sequenceId);
    if (!sequence || !sequence.adaptation.enabled) {
      return [];
    }

    // Apply the rate multiplier to both increase and decrease steps, producing
    // a "virtual" adjustment that signals the throttled adaptation envelope.
    const effectiveIncrease = sequence.adaptation.increaseStep * tracker.rateMultiplier;
    const effectiveDecrease = sequence.adaptation.decreaseStep * tracker.rateMultiplier;

    return [
      {
        thresholdKey: sequence.adaptation.thresholdKey ?? `sequence_${sequenceId}`,
        previousThreshold: sequence.adaptation.increaseStep,
        newThreshold: effectiveIncrease,
        reason: `adaptation rate scaled by ${tracker.rateMultiplier.toFixed(2)} (pass streak); effective increase step ${effectiveIncrease.toFixed(4)}, decrease step ${effectiveDecrease.toFixed(4)}`,
      },
    ];
  }

  // -----------------------------------------------------------------------
  // Reset helpers
  // -----------------------------------------------------------------------

  resetStreak(sequenceId: string, streamId: string): void {
    const key = SelfAssessmentLoop.trackerKey(sequenceId, streamId);
    const tracker = this.trackers.get(key);
    if (tracker) {
      tracker.consecutiveFails = 0;
      tracker.consecutivePasses = 0;
      tracker.flaggedStale = false;
    }
  }

  clearAll(): void {
    this.trackers.clear();
  }
}
