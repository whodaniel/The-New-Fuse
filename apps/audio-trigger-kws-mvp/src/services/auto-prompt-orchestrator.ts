import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  AutoPromptRun,
  AutoPromptSequenceDefinition,
  AutoPromptStepExecution,
  AutomationTriggerEvent,
  HitEvent,
  RuleFireEvent,
  SelfAssessmentResult,
  SelfAdjustmentAction,
  VisualObjectDetection,
} from '../types/events';
import { ContextCardLogger } from './context-card-logger';
import { ProfileService, profileService } from './profile/service';

export interface AutoPromptDispatchContext {
  run: AutoPromptRun;
  sequence: AutoPromptSequenceDefinition;
  step: AutoPromptSequenceDefinition['steps'][number];
}

export type AutoPromptDispatchFn = (
  agentId: string,
  prompt: string,
  context: AutoPromptDispatchContext
) => Promise<boolean> | boolean;

export interface AutoPromptOrchestratorOptions {
  sequences: AutoPromptSequenceDefinition[];
  dispatchPrompt?: AutoPromptDispatchFn;
  profileService?: ProfileService;
  contextCardLogger?: ContextCardLogger;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number): number => Math.round(value * 10) / 10;
const metadataString = (trigger: AutomationTriggerEvent, key: string): string => {
  const value = trigger.metadata?.[key];
  return typeof value === 'string' ? value : '';
};

export class AutoPromptOrchestrator extends EventEmitter {
  private readonly sequences: AutoPromptSequenceDefinition[];
  private readonly dispatchPrompt: AutoPromptDispatchFn;
  private readonly profileService: ProfileService;
  private readonly contextCardLogger?: ContextCardLogger;
  private readonly lastRunBySequenceStream = new Map<string, number>();

  constructor(options: AutoPromptOrchestratorOptions) {
    super();
    this.sequences = options.sequences;
    this.dispatchPrompt =
      options.dispatchPrompt ??
      (() => {
        return true;
      });
    this.profileService = options.profileService ?? profileService;
    this.contextCardLogger = options.contextCardLogger;
  }

  async handleRuleFire(ruleFire: RuleFireEvent, utterance: string): Promise<AutoPromptRun[]> {
    const trigger: AutomationTriggerEvent = {
      triggerId: ruleFire.fireId,
      source: 'rule_fire',
      streamId: ruleFire.streamId,
      tsMs: ruleFire.tsMs,
      confidence: ruleFire.confidence,
      ruleId: ruleFire.ruleId,
      matchedGroups: ruleFire.matchedGroups,
      utterance,
      metadata: {
        actionType: ruleFire.action.type,
        templateId: ruleFire.action.templateId,
      },
    };

    return this.processTrigger(trigger);
  }

  async handleKeywordHit(hit: HitEvent, utterance: string): Promise<AutoPromptRun[]> {
    const trigger: AutomationTriggerEvent = {
      triggerId: hit.eventId,
      source: 'keyword_hit',
      streamId: hit.streamId,
      tsMs: hit.tsEndMs,
      confidence: hit.confidence,
      termId: hit.termId,
      groupId: hit.groupId,
      utterance,
    };

    return this.processTrigger(trigger);
  }

  async handleVisualObjects(streamId: string, objects: VisualObjectDetection[]): Promise<AutoPromptRun[]> {
    const runs: AutoPromptRun[] = [];

    for (const object of objects) {
      const trigger: AutomationTriggerEvent = {
        triggerId: crypto.randomUUID(),
        source: 'visual_object',
        streamId,
        tsMs: object.tsMs ?? Date.now(),
        confidence: object.confidence,
        visualLabel: object.label,
        metadata: object.metadata,
      };

      const objectRuns = await this.processTrigger(trigger);
      runs.push(...objectRuns);
    }

    return runs;
  }

  async processTrigger(trigger: AutomationTriggerEvent): Promise<AutoPromptRun[]> {
    const now = trigger.tsMs;
    const matching = this.sequences.filter((sequence) => this.sequenceMatches(sequence, trigger, now));

    if (matching.length === 0) {
      return [];
    }

    const runs: AutoPromptRun[] = [];
    for (const sequence of matching) {
      const run = await this.executeSequence(sequence, trigger);
      runs.push(run);
    }

    return runs;
  }

  private sequenceMatches(
    sequence: AutoPromptSequenceDefinition,
    trigger: AutomationTriggerEvent,
    nowTsMs: number
  ): boolean {
    if (!sequence.enabled) {
      return false;
    }

    const cooldownMs = sequence.trigger.cooldownMs ?? 20000;
    const cooldownKey = `${trigger.streamId}:${sequence.sequenceId}`;
    const lastRunAt = this.lastRunBySequenceStream.get(cooldownKey) ?? 0;
    if (nowTsMs - lastRunAt < cooldownMs) {
      return false;
    }

    const allowedSources = sequence.trigger.source;
    if (allowedSources && allowedSources.length > 0 && !allowedSources.includes(trigger.source)) {
      return false;
    }

    const minConfidence = sequence.trigger.minConfidence ?? 0;
    if (trigger.confidence < minConfidence) {
      return false;
    }

    const hasRuleMatch =
      !sequence.trigger.ruleIds ||
      sequence.trigger.ruleIds.length === 0 ||
      (trigger.ruleId ? sequence.trigger.ruleIds.includes(trigger.ruleId) : false);

    const hasGroupMatch =
      !sequence.trigger.groupIds ||
      sequence.trigger.groupIds.length === 0 ||
      (trigger.groupId ? sequence.trigger.groupIds.includes(trigger.groupId) : false) ||
      Boolean(
        trigger.matchedGroups && sequence.trigger.groupIds.some((groupId) => trigger.matchedGroups?.includes(groupId))
      );

    const hasTermMatch =
      !sequence.trigger.termIds ||
      sequence.trigger.termIds.length === 0 ||
      (trigger.termId ? sequence.trigger.termIds.includes(trigger.termId) : false);

    const hasVisualMatch =
      !sequence.trigger.visualLabels ||
      sequence.trigger.visualLabels.length === 0 ||
      (trigger.visualLabel
        ? sequence.trigger.visualLabels.some(
            (label) => label.toLowerCase() === trigger.visualLabel?.toLowerCase()
          )
        : false);

    const hasKeywordMatch =
      !sequence.trigger.keywords ||
      sequence.trigger.keywords.length === 0 ||
      this.containsKeywords(trigger.utterance ?? '', sequence.trigger.keywords);

    const matched = hasRuleMatch && hasGroupMatch && hasTermMatch && hasVisualMatch && hasKeywordMatch;
    if (matched) {
      this.lastRunBySequenceStream.set(cooldownKey, nowTsMs);
    }

    return matched;
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    const normalizedText = text.toLowerCase();
    return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
  }

  private async executeSequence(
    sequence: AutoPromptSequenceDefinition,
    trigger: AutomationTriggerEvent
  ): Promise<AutoPromptRun> {
    const runId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const run: AutoPromptRun = {
      runId,
      sequenceId: sequence.sequenceId,
      streamId: trigger.streamId,
      agentId: sequence.agentId,
      useCase: sequence.useCase,
      trigger,
      status: 'in_progress',
      steps: [],
      createdAt,
      completedAt: createdAt,
    };

    for (const step of sequence.steps) {
      const renderedPrompt = this.renderTemplate(step.promptTemplate, trigger);
      const execution: AutoPromptStepExecution = {
        stepId: step.stepId,
        title: step.title,
        prompt: renderedPrompt,
        status: 'pending',
        dispatchTarget: sequence.agentId,
        dispatchedAt: new Date().toISOString(),
      };

      try {
        const dispatched = await this.dispatchPrompt(sequence.agentId, renderedPrompt, {
          run,
          sequence,
          step,
        });
        execution.status = dispatched ? 'dispatched' : 'failed';
      } catch (error) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : String(error);
      }

      run.steps.push(execution);
      this.emit('auto_prompt_step', {
        runId,
        sequenceId: sequence.sequenceId,
        streamId: trigger.streamId,
        step: execution,
      });
    }

    run.completedAt = new Date().toISOString();
    run.status = run.steps.every((step) => step.status === 'dispatched') ? 'completed' : 'failed';

    const assessment = this.buildAssessment(run, sequence);
    const adjustments = this.applyAdaptation(sequence, trigger, assessment);
    assessment.adjustments = adjustments;

    this.emit('auto_prompt_run', run);
    this.emit('self_assessment', assessment);

    if (this.contextCardLogger) {
      const contextCard = this.contextCardLogger.writeCard({ run, assessment });
      this.emit('context_card', contextCard);
    }

    return run;
  }

  private renderTemplate(template: string, trigger: AutomationTriggerEvent): string {
    const values: Record<string, string> = {
      streamId: trigger.streamId,
      source: trigger.source,
      hookEventName: trigger.hookEventName ?? '',
      ruleId: trigger.ruleId ?? '',
      termId: trigger.termId ?? '',
      groupId: trigger.groupId ?? '',
      visualLabel: trigger.visualLabel ?? '',
      utterance: trigger.utterance ?? '',
      confidence: trigger.confidence.toFixed(3),
      triggerTime: new Date(trigger.tsMs).toISOString(),
      toolName: metadataString(trigger, 'toolName'),
      sessionId: metadataString(trigger, 'sessionId'),
      permissionMode: metadataString(trigger, 'permissionMode'),
      notificationType: metadataString(trigger, 'notificationType'),
    };

    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      return values[key] ?? '';
    });
  }

  private buildAssessment(
    run: AutoPromptRun,
    sequence: AutoPromptSequenceDefinition
  ): SelfAssessmentResult {
    const triggerScore = clamp(run.trigger.confidence * 100, 0, 100);

    const dispatchedSteps = run.steps.filter((step) => step.status === 'dispatched').length;
    const dispatchScore = run.steps.length === 0 ? 0 : (dispatchedSteps / run.steps.length) * 100;

    const specificitySignals = [
      run.trigger.ruleId,
      run.trigger.termId,
      run.trigger.groupId,
      run.trigger.visualLabel,
      run.trigger.utterance,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).length;
    const specificityScore = clamp((specificitySignals / 5) * 100, 0, 100);

    const overallScore = round1(triggerScore * 0.4 + dispatchScore * 0.35 + specificityScore * 0.25);
    const passed = overallScore >= sequence.assessment.minOverallScore;

    return {
      assessmentId: crypto.randomUUID(),
      runId: run.runId,
      sequenceId: run.sequenceId,
      streamId: run.streamId,
      passed,
      overallScore,
      scores: {
        triggerScore: round1(triggerScore),
        dispatchScore: round1(dispatchScore),
        specificityScore: round1(specificityScore),
      },
      adjustments: [],
      createdAt: new Date().toISOString(),
    };
  }

  private applyAdaptation(
    sequence: AutoPromptSequenceDefinition,
    trigger: AutomationTriggerEvent,
    assessment: SelfAssessmentResult
  ): SelfAdjustmentAction[] {
    if (!sequence.adaptation.enabled) {
      return [];
    }

    const thresholdKey = sequence.adaptation.thresholdKey ?? this.deriveThresholdKey(sequence, trigger);
    const currentThreshold =
      this.profileService.getTriggerThreshold(trigger.streamId, thresholdKey) ??
      sequence.adaptation.defaultThreshold;

    const delta = assessment.passed ? -Math.abs(sequence.adaptation.decreaseStep) : Math.abs(sequence.adaptation.increaseStep);
    const nextThreshold = clamp(
      currentThreshold + delta,
      sequence.adaptation.minThreshold,
      sequence.adaptation.maxThreshold
    );

    if (Math.abs(nextThreshold - currentThreshold) < 0.0001) {
      return [];
    }

    this.profileService.updateProfile(trigger.streamId, {
      triggerThresholds: {
        [thresholdKey]: nextThreshold,
      },
    });

    return [
      {
        thresholdKey,
        previousThreshold: currentThreshold,
        newThreshold: nextThreshold,
        reason: assessment.passed
          ? 'successful run; lowered threshold slightly to improve responsiveness'
          : 'weak run; increased threshold to reduce noisy triggers',
      },
    ];
  }

  private deriveThresholdKey(
    sequence: AutoPromptSequenceDefinition,
    trigger: AutomationTriggerEvent
  ): string {
    if (trigger.ruleId) {
      return `rule_${trigger.ruleId}`;
    }

    if (trigger.visualLabel) {
      return `visual_${trigger.visualLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    }

    if (trigger.groupId) {
      return `group_${trigger.groupId}`;
    }

    if (trigger.termId) {
      return `term_${trigger.termId}`;
    }

    return `sequence_${sequence.sequenceId}`;
  }
}
