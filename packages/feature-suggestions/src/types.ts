export enum FeatureStage {
    ANALYSIS = 'ANALYSIS',
    DESIGN = 'DESIGN',
    DEVELOPMENT = 'DEVELOPMENT',
    TESTING = 'TESTING',
    REVIEW = 'REVIEW',
    DEPLOYMENT = 'DEPLOYMENT',
    COMPLETED = 'COMPLETED',
    IN_PROGRESS = 'IN_PROGRESS' // Adding this for compatibility with EnhancedTimelineView
}

export enum SuggestionPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

// Define SuggestionStatus directly instead of trying to import it
export enum SuggestionStatus {
    NEW = 'NEW',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    IMPLEMENTED = 'IMPLEMENTED',
    SUBMITTED = 'SUBMITTED',
    PENDING = 'PENDING',
    CONVERTED = 'CONVERTED'
}

export * from '@the-new-fuse/types/core/enums';

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: Date;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  votes: number;
  tags: string[];
  relatedTodoIds: string[];
  convertedFeatureId?: string; // If converted to a tracked feature
  estimatedEffort?: string;
  businessValue?: string;
  technicalComplexity?: string;
  updatedAt: Date;
}

// Kanban Board Types - Union type for items that can be dragged
export type DraggableItem = FeatureSuggestion | TodoItem;

// Removed duplicate DraggableItem definition

export interface KanbanColumn {
  id: string;
  title: string;
  items: DraggableItem[];
}

// Removed duplicate KanbanColumn definition

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: SuggestionPriority;
  assignedTo?: string;
  dueDate?: Date;
  featureId?: string; // ID of related feature if this todo is part of a feature
  suggestionId?: string; // ID of related suggestion if this todo is part of suggestion review
  createdAt: Date;
  updatedAt: Date;
}

export interface VotingRecord {
  userId: string;
  suggestionId: string;
  votedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  suggestionId: string;
  createdAt: Date;
  updatedAt: Date;
}
