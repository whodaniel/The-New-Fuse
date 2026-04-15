// Export hooks
export { useFeatureSuggestions } from './hooks/useFeatureSuggestions';
export { useKanbanBoard } from './hooks/useKanbanBoard';
export { useTimeline } from './hooks/useTimeline';

// Export components
export { default as TimelineSlider } from './components/TimelineSlider';
export { default as TimelineView } from './components/TimelineView';

// Export types - explicitly export SuggestionStatus from types to resolve ambiguity
export { SuggestionStatus, SuggestionPriority, FeatureStage } from './types';
export type { 
  FeatureSuggestion, 
  TodoItem, 
  DraggableItem, 
  KanbanColumn, 
  VotingRecord, 
  Comment 
} from './types';

// Export timeline types
export type {
  TimelineEvent,
  TimelineItem,
  TimelineNote,
  TimelineRange,
  TimelineBranch,
  TimelineWorkflow,
  TimelineEventType,
  WorkflowStep,
  TimelinePosition
} from './types/timeline';

// Export service types
export * from './services/types';
export { UnifiedLedgerTimelineService } from './services/unifiedLedgerTimeline.service';
