// Export hooks
export { useFeatureSuggestions } from './hooks/useFeatureSuggestions';
export { useKanbanBoard } from './hooks/useKanbanBoard';
export { useTimeline } from './hooks/useTimeline';

// Export components
export { default as TimelineSlider } from './components/TimelineSlider';
export { default as TimelineView } from './components/TimelineView';

// Export types - explicitly export SuggestionStatus from types to resolve ambiguity
export { FeatureStage, SuggestionPriority, SuggestionStatus } from './types';
export type {
  Comment,
  DraggableItem,
  FeatureSuggestion,
  KanbanColumn,
  TodoItem,
  VotingRecord,
} from './types';

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
} from './types/timeline';

// Export service types
export * from './services/types';
