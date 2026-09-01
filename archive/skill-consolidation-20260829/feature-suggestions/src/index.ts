// Export hooks
export { useFeatureSuggestions } from './hooks/useFeatureSuggestions.js';
export { useKanbanBoard } from './hooks/useKanbanBoard.js';
export { useTimeline } from './hooks/useTimeline.js';

// Export components
export { default as TimelineSlider } from './components/TimelineSlider.js';
export { default as TimelineView } from './components/TimelineView.js';

// Export types - explicitly export SuggestionStatus from types to resolve ambiguity
export { FeatureStage, SuggestionPriority, SuggestionStatus } from './types/index.js';
export type {
  Comment,
  DraggableItem,
  FeatureSuggestion,
  KanbanColumn,
  TodoItem,
  VotingRecord,
} from './types/index.js';

// Export timeline types
export type {
  TimelineBranch,
  TimelineEvent,
  TimelineEventType,
  TimelineItem,
  TimelineNote,
  TimelinePosition,
  TimelineRange,
  TimelineWorkflow,
  WorkflowStep,
} from './types/timeline.js';

// Export service types
export * from './services/types.js';
export { UnifiedLedgerTimelineService } from './services/unifiedLedgerTimeline.service';
