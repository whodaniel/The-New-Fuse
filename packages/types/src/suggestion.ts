import { SuggestionStatus, SuggestionPriority, FeatureStage } from './core/enums.js';

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  submittedBy: string;
  submittedAt: Date;
  updatedAt: Date;
  votes: VotingRecord[];
  tags: string[];
  relatedTodoIds: string[];
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  suggestionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VotingRecord {
  suggestionId: string;
  votedAt: Date;
  vote: number;
}

export interface SuggestionVote {
  id: string;
  userId: string;
  featureSuggestionId: string;
  vote: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureConversion {
  id: string;
  suggestionId: string;
  featureId: string;
  convertedAt: Date;
  convertedBy: string;
  stage: FeatureStage;
  notes?: string;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  reason?: string;
}
