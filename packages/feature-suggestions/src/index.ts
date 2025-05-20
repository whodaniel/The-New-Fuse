// Export hooks
export { useFeatureSuggestions } from './hooks/useFeatureSuggestions.js';
export { useKanbanBoard } from './hooks/useKanbanBoard.js';
export { useTimeline } from './hooks/useTimeline.js';

// Export components
export { default as TimelineSlider } from './components/TimelineSlider.js';
export { default as TimelineView } from './components/TimelineView.js';

// Export types - explicitly export SuggestionStatus from types to resolve ambiguity
export { SuggestionStatus, SuggestionPriority, FeatureStage } from './types.js';
export type { 
  FeatureSuggestion, 
  TodoItem, 
  DraggableItem, 
  KanbanColumn, 
  VotingRecord, 
  Comment 
} from './types.js';

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
} from './types/timeline.js';

// Export service types
export * from './services/types.js';
