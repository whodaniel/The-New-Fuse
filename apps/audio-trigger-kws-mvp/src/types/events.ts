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
