export interface AudioFrame {
  streamId: string;
  tsMs: number;
  mockTranscript?: string;
  speechProbability?: number;
}

export interface LexiconTerm {
  termId: string;
  surface: string;
  groupId: string;
  weight?: number;
}

export interface HitEvent {
  eventId: string;
  streamId: string;
  sessionId?: string;
  tsStartMs: number;
  tsEndMs: number;
  termId: string;
  groupId: string;
  confidence: number;
  audioOffsetMs?: number;
  source: 'kws';
}

export interface TriggerConditionHit {
  kind: 'hit';
  groupId: string;
  minConf: number;
  count: number;
  windowMs: number;
}

export interface TriggerConditionSequence {
  kind: 'sequence';
  groupIds: string[];
  maxGapMs: number;
  ordered: boolean;
}

export type TriggerCondition = TriggerConditionHit | TriggerConditionSequence;

export interface TriggerRule {
  ruleId: string;
  name: string;
  enabled: boolean;
  priority: number;
  minRuleConf: number;
  windowMs: number;
  cooldownMs: number;
  all?: TriggerCondition[];
  any?: TriggerCondition[];
  none?: TriggerCondition[];
  action: {
    type: 'enqueue_llm' | 'emit' | 'webhook';
    templateId: string;
    target?: string;
  };
}

export interface RuleFireEvent {
  fireId: string;
  ruleId: string;
  streamId: string;
  tsMs: number;
  confidence: number;
  matchedEventIds: string[];
  matchedGroups: string[];
  action: TriggerRule['action'];
}

export interface ContextEvidence {
  event_id: string;
  term_id: string;
  group_id: string;
  confidence: number;
  ts_ms: number;
}

export interface ContextPackage {
  pkg_id: string;
  stream_id: string;
  rule_id: string;
  normalized_facts: Record<string, unknown>;
  evidence: ContextEvidence[];
  vector_refs: string[];
  graph_refs: string[];
  provenance: {
    template_id: string;
    builder_version: string;
    notes?: string;
  };
  created_at: string;
}

export interface LlmBatchResult {
  pkgId: string;
  ruleId: string;
  streamId: string;
  ok: boolean;
  responsePreview: string;
  completedAt: string;
}

export type TriggerSource = 'keyword_hit' | 'rule_fire' | 'visual_object' | 'manual' | 'claude_hook';

export interface VisualObjectDetection {
  label: string;
  confidence: number;
  tsMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AutomationTriggerEvent {
  triggerId: string;
  source: TriggerSource;
  streamId: string;
  tsMs: number;
  confidence: number;
  hookEventName?: string;
  ruleId?: string;
  termId?: string;
  groupId?: string;
  visualLabel?: string;
  utterance?: string;
  matchedGroups?: string[];
  metadata?: Record<string, unknown>;
}

export interface AutoPromptStepDefinition {
  stepId: string;
  title: string;
  promptTemplate: string;
}

export interface AutoPromptSequenceDefinition {
  sequenceId: string;
  name: string;
  enabled: boolean;
  useCase: string;
  agentId: string;
  trigger: {
    source?: TriggerSource[];
    ruleIds?: string[];
    groupIds?: string[];
    termIds?: string[];
    keywords?: string[];
    visualLabels?: string[];
    minConfidence?: number;
    cooldownMs?: number;
  };
  steps: AutoPromptStepDefinition[];
  assessment: {
    minOverallScore: number;
  };
  adaptation: {
    enabled: boolean;
    thresholdKey?: string;
    minThreshold: number;
    maxThreshold: number;
    increaseStep: number;
    decreaseStep: number;
    defaultThreshold: number;
  };
}

export interface AutoPromptStepExecution {
  stepId: string;
  title: string;
  prompt: string;
  status: 'pending' | 'dispatched' | 'failed';
  dispatchTarget: string;
  dispatchedAt: string;
  error?: string;
}

export interface AutoPromptRun {
  runId: string;
  sequenceId: string;
  streamId: string;
  agentId: string;
  useCase: string;
  trigger: AutomationTriggerEvent;
  status: 'in_progress' | 'completed' | 'failed';
  steps: AutoPromptStepExecution[];
  createdAt: string;
  completedAt: string;
}

export interface SelfAdjustmentAction {
  thresholdKey: string;
  previousThreshold: number;
  newThreshold: number;
  reason: string;
}

export interface SelfAssessmentResult {
  assessmentId: string;
  runId: string;
  sequenceId: string;
  streamId: string;
  passed: boolean;
  overallScore: number;
  scores: {
    triggerScore: number;
    dispatchScore: number;
    specificityScore: number;
  };
  adjustments: SelfAdjustmentAction[];
  createdAt: string;
}

export interface ContextLogCard {
  cardId: string;
  runId: string;
  sequenceId: string;
  streamId: string;
  agentId: string;
  useCase: string;
  summary: {
    source: TriggerSource;
    confidence: number;
    overallScore: number;
    passed: boolean;
  };
  jsonlPath: string;
  markdownPath: string;
  createdAt: string;
}
