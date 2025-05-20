import {
  SuggestionStatus,
  SuggestionPriority,
  FeatureStage
} from './core/enums.js';

export interface Feature {
  id: string;
  name: string;
  description: string;
  stage: FeatureStage;
  priority: SuggestionPriority;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export { SuggestionStatus, SuggestionPriority, FeatureStage };
