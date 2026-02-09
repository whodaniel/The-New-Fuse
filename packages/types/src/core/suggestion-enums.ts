/**
 * Suggestion related enums
 */

export enum SuggestionStatus {
  NEW = 'new',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented'
}

export enum SuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum FeatureStage {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  REVIEW = 'review',
  DEPLOYED = 'deployed'
}