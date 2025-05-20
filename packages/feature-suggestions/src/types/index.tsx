// Import enums from the central types package
import { SuggestionStatus as CoreSuggestionStatus, SuggestionPriority as CoreSuggestionPriority } from '@the-new-fuse/types/core/suggestion-enums';

// Re-export the standardized enums
export { CoreSuggestionStatus as SuggestionStatus, CoreSuggestionPriority as SuggestionPriority };

// Define service interface
export interface SuggestionService {
  getSuggestionsByStatus: (status: CoreSuggestionStatus) => Promise<FeatureSuggestion[]>;
  createSuggestion: (suggestion: Partial<FeatureSuggestion>) => Promise<FeatureSuggestion>;
  updateSuggestion: (id: string, data: Partial<FeatureSuggestion>) => Promise<FeatureSuggestion>;
  deleteSuggestion: (id: string) => Promise<void>;
  voteSuggestion: (id: string, userId: string) => Promise<void>;
  convertToFeature: (id: string) => Promise<void>;
}

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: CoreSuggestionStatus;
  priority: CoreSuggestionPriority;
  submittedBy: string;
  submittedAt: Date;
  tags: string[];
  votes: number;
}

/**
 * Represents a column in the Kanban board
 */
export interface KanbanColumn {
  /** Unique identifier for the column */
  id: string;
  /** Display title for the column */
  title: string;
  /** Items in the column (can be either FeatureSuggestion or TodoItem) */
  items: DraggableItem[];
}

/**
 * Type for items that can be dragged in the Kanban board
 */
export interface DraggableItem {
  /** Unique identifier for the item */
  id: string;
  /** Type of the item - either a suggestion or a todo */
  type: 'suggestion' | 'todo';
  /** Title of the item */
  title: string;
  /** Description of the item */
  description: string;
  /** Tags associated with the item */
  tags: string[];
  /** Current status of the item */
  status: string;
  /** Priority of the item */
  priority: CoreSuggestionPriority;
}

export interface TodoItem extends DraggableItem {
  assignedTo?: string;
  dueDate?: Date;
}

export type { FeatureProgress } from '@the-new-fuse/feature-tracker';
