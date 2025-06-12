// Export hooks
export { useFeatureSuggestions } from './hooks/useFeatureSuggestions.tsx';
export { useKanbanBoard } from './hooks/useKanbanBoard.tsx';
export { useTimeline } from './hooks/useTimeline.tsx';

// Export components
export { default as TimelineSlider } from './components/TimelineSlider.tsx';
export { default as TimelineView } from './components/TimelineView.tsx';

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
export * from './services/types.tsx';
