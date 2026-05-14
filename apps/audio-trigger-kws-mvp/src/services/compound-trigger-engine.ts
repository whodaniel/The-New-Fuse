import * as crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  AutomationTriggerEvent,
  AutoPromptRun,
  AutoPromptSequenceDefinition,
} from '../types/events';
import { AutoPromptOrchestrator, AutoPromptDispatchFn } from './auto-prompt-orchestrator';
import { ProfileService, profileService } from './profile/service';
import { ContextCardLogger } from './context-card-logger';

export interface CompoundTriggerCondition {
  /** Unique id for this compound condition */
  conditionId: string;
  /** All sources must fire within this window (ms) */
  windowMs: number;
  /** Required trigger sources (ALL must match within window) */
  requiredSources: Array<AutomationTriggerEvent['source']>;
  /** Optional: specific rule/term/visual labels that must appear */
  ruleIds?: string[];
  termIds?: string[];
  visualLabels?: string[];
  groupIds?: string[];
  keywords?: string[];
}

export interface CompoundTriggerDefinition {
  compoundId: string;
  name: string;
  enabled: boolean;
  agentId: string;
  useCase: string;
  condition: CompoundTriggerCondition;
  steps: AutoPromptSequenceDefinition['steps'];
  assessment: AutoPromptSequenceDefinition['assessment'];
  adaptation: AutoPromptSequenceDefinition['adaptation'];
  cooldownMs: number;
}

interface PendingTrigger {
  trigger: AutomationTriggerEvent;
  receivedAt: number;
}

export class CompoundTriggerEngine extends EventEmitter {
  private readonly pendingByStream = new Map<string, PendingTrigger[]>();
  private readonly lastFireByStream = new Map<string, number>();
  private readonly orchestrator: AutoPromptOrchestrator;

  constructor(
    private readonly compounds: CompoundTriggerDefinition[],
    options: {
      dispatchPrompt?: AutoPromptDispatchFn;
      profileService?: ProfileService;
      contextCardLogger?: ContextCardLogger;
    } = {}
  ) {
    super();

    const sequences = compounds.map((compound) => this.compoundToSequence(compound));
    this.orchestrator = new AutoPromptOrchestrator({
      sequences,
      dispatchPrompt: options.dispatchPrompt,
      profileService: options.profileService ?? profileService,
      contextCardLogger: options.contextCardLogger,
    });

    this.orchestrator.on('auto_prompt_run', (run: AutoPromptRun) => {
      this.emit('compound_trigger_run', run);
    });
    this.orchestrator.on('self_assessment', (assessment) => {
      this.emit('compound_assessment', assessment);
    });
    this.orchestrator.on('context_card', (card) => {
      this.emit('compound_context_card', card);
    });
  }

  async pushTrigger(trigger: AutomationTriggerEvent): Promise<AutoPromptRun[]> {
    const now = trigger.tsMs;
    const streamId = trigger.streamId;

    let pending = this.pendingByStream.get(streamId);
    if (!pending) {
      pending = [];
      this.pendingByStream.set(streamId, pending);
    }

    pending.push({ trigger, receivedAt: now });

    // Prune expired entries
    const maxWindow = this.getMaxWindowMs();
    this.pendingByStream.set(
      streamId,
      pending.filter((p) => now - p.receivedAt < maxWindow)
    );

    // Check each compound definition
    const allRuns: AutoPromptRun[] = [];

    for (const compound of this.compounds) {
      if (!compound.enabled) continue;

      const lastFire = this.lastFireByStream.get(`${streamId}:${compound.compoundId}`) ?? 0;
      if (now - lastFire < compound.cooldownMs) continue;

      if (this.checkCompoundSatisfied(compound, streamId, now)) {
        this.lastFireByStream.set(`${streamId}:${compound.compoundId}`, now);
        const syntheticTrigger = this.buildSyntheticTrigger(compound, streamId, now);
        const runs = (await this.orchestrator.processTrigger?.(syntheticTrigger)) ?? [];
        allRuns.push(...runs);
      }
    }

    return allRuns;
  }

  private checkCompoundSatisfied(
    compound: CompoundTriggerDefinition,
    streamId: string,
    now: number
  ): boolean {
    const pending = this.pendingByStream.get(streamId) ?? [];
    const windowMs = compound.condition.windowMs;

    const withinWindow = pending.filter((p) => now - p.receivedAt < windowMs);

    // Check that every required source has at least one trigger
    for (const requiredSource of compound.condition.requiredSources) {
      const matching = withinWindow.filter((p) => p.trigger.source === requiredSource);
      if (matching.length === 0) return false;

      // Optional label filters
      if (requiredSource === 'rule_fire' && compound.condition.ruleIds?.length) {
        const hasRule = matching.some((m) =>
          compound.condition.ruleIds!.includes(m.trigger.ruleId ?? '')
        );
        if (!hasRule) return false;
      }

      if (requiredSource === 'keyword_hit' && compound.condition.termIds?.length) {
        const hasTerm = matching.some((m) =>
          compound.condition.termIds!.includes(m.trigger.termId ?? '')
        );
        if (!hasTerm) return false;
      }

      if (requiredSource === 'keyword_hit' && compound.condition.groupIds?.length) {
        const hasGroup = matching.some((m) =>
          compound.condition.groupIds!.includes(m.trigger.groupId ?? '')
        );
        if (!hasGroup) return false;
      }

      if (requiredSource === 'visual_object' && compound.condition.visualLabels?.length) {
        const hasLabel = matching.some((m) =>
          compound.condition.visualLabels!.some(
            (l) => l.toLowerCase() === (m.trigger.visualLabel ?? '').toLowerCase()
          )
        );
        if (!hasLabel) return false;
      }

      if (compound.condition.keywords?.length) {
        const hasKeyword = matching.some((m) =>
          compound.condition.keywords!.some((kw) =>
            (m.trigger.utterance ?? '').toLowerCase().includes(kw.toLowerCase())
          )
        );
        if (!hasKeyword) return false;
      }
    }

    return true;
  }

  private buildSyntheticTrigger(
    compound: CompoundTriggerDefinition,
    streamId: string,
    now: number
  ): AutomationTriggerEvent {
    return {
      triggerId: crypto.randomUUID(),
      source: 'manual' as const,
      streamId,
      tsMs: now,
      confidence: 1.0,
      metadata: {
        compoundId: compound.compoundId,
        requiredSources: compound.condition.requiredSources,
        windowMs: compound.condition.windowMs,
      },
      utterance: `Compound trigger: ${compound.name}`,
    };
  }

  private compoundToSequence(compound: CompoundTriggerDefinition): AutoPromptSequenceDefinition {
    return {
      sequenceId: compound.compoundId,
      name: compound.name,
      enabled: compound.enabled,
      useCase: compound.useCase,
      agentId: compound.agentId,
      trigger: {
        source: ['manual'],
        minConfidence: 1.0,
        cooldownMs: compound.cooldownMs,
      },
      steps: compound.steps,
      assessment: compound.assessment,
      adaptation: compound.adaptation,
    };
  }

  private getMaxWindowMs(): number {
    if (this.compounds.length === 0) return 30000;
    return Math.max(...this.compounds.map((c) => c.condition.windowMs));
  }

  getPendingCount(streamId?: string): number {
    if (streamId) {
      return (this.pendingByStream.get(streamId) ?? []).length;
    }
    let total = 0;
    for (const pending of this.pendingByStream.values()) {
      total += pending.length;
    }
    return total;
  }
}
