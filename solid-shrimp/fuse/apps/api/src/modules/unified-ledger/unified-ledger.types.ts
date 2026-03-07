export type UnifiedRecordKind = 'task' | 'suggestion' | 'review' | 'insight';

export type UnifiedRecordStatus =
  | 'submitted'
  | 'queued'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'archived';

export type UnifiedRecordPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type UnifiedWorkHorizon = 'realtime' | 'short_term' | 'medium_term' | 'long_term';
export type UnifiedWorkLane =
  | 'directive'
  | 'goal'
  | 'milestone'
  | 'realtime_broker_routing'
  | 'relay_federation'
  | 'tauri_sync'
  | 'redis_sync'
  | 'suggestion_vote'
  | 'changelog_suggestion'
  | 'kanban_delivery';
export type UnifiedCoordinationMode = 'brokered' | 'direct' | 'hybrid';
export type UnifiedSignalSource = 'ws_relay' | 'redis' | 'tauri' | 'api' | 'manual' | 'system';

export interface UnifiedWorkItinerary {
  lane: UnifiedWorkLane;
  horizon: UnifiedWorkHorizon;
  coordinationMode: UnifiedCoordinationMode;
  signalSources: UnifiedSignalSource[];
  sequencingKey: string;
  clockSource: 'master-clock' | 'redis-time' | 'local-time';
}

export interface TraitSlots {
  cognitiveDepth: number;
  orchestrationComplexity: number;
  semanticNovelty: number;
  relationalImpact: number;
  temporalRhythm: number;
  confidence: number;
  alignmentScore: number;
  custom: Record<string, string | number | boolean>;
}

export interface FractalGrid {
  scale: number;
  rhythmBpm: number;
  phase: number;
  progressPercent: number;
  beatSignature: string;
}

export interface FunctionalLink {
  targetId: string;
  linkType:
    | 'depends_on'
    | 'blocks'
    | 'supports'
    | 'reviews'
    | 'derived_from'
    | 'related_to'
    | 'feedback_loop';
  weight: number;
  note?: string;
  createdAt: string;
}

export interface FeedbackIteration {
  id: string;
  iteration: number;
  hypothesis: string;
  evidence: string[];
  confidence: number;
  accepted: boolean;
  notes?: string;
  createdAt: string;
}

export interface RagFeedbackLoop {
  relationalSources: string[];
  semanticSources: string[];
  currentAnswer?: string;
  previousAnswers: string[];
  feedbackIterations: FeedbackIteration[];
}

export interface UnifiedVotes {
  up: number;
  down: number;
}

export interface UnifiedTaskRecord {
  id: string;
  kind: UnifiedRecordKind;
  title: string;
  description: string;
  status: UnifiedRecordStatus;
  priority: UnifiedRecordPriority;
  owner: string;
  assignee?: string;
  tags: string[];
  votes: UnifiedVotes;
  traits: TraitSlots;
  fractal: FractalGrid;
  links: FunctionalLink[];
  rag: RagFeedbackLoop;
  itinerary: UnifiedWorkItinerary;
  metadata: Record<string, unknown>;
  source: 'manual' | 'orchestrator' | 'relay' | 'api' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  userId?: string;
  recordId?: string;
  goalId?: string;
  planId?: string;
  eventType:
    | 'record_created'
    | 'record_updated'
    | 'record_voted'
    | 'feedback_iteration_added'
    | 'functional_link_added'
    | 'goal_created'
    | 'goal_linked'
    | 'plan_created'
    | 'plan_linked'
    | 'milestone_updated'
    | 'historical_event';
  actor: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface GoalMilestone {
  id: string;
  title: string;
  dueAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

export interface GoalRecord {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  linkedRecordIds: string[];
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPlanRecord {
  id: string;
  name: string;
  objective: string;
  owner: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  linkedGoalIds: string[];
  linkedRecordIds: string[];
  cadence: {
    cycleDays: number;
    reviewBpm: number;
    progressPercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedLedgerStore {
  records: UnifiedTaskRecord[];
  timelineEvents: TimelineEvent[];
  goals: GoalRecord[];
  plans: ProjectPlanRecord[];
}
