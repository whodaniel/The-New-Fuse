// Define types locally to avoid external dependencies
export enum FeatureStage {
  IDEA = 'IDEA',
  PLANNING = 'PLANNING',
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  DEPLOYED = 'DEPLOYED',
  DEPRECATED = 'DEPRECATED',
}

export enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  environments?: Environment[];
  targeting?: FeatureTargeting;
  metadata: FeatureFlagMetadata;
}

export interface FeatureFlagMetadata {
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  version?: number;
}

export interface FeatureTargeting {
  percentage?: number;
  userIds?: string[];
  rules?: FeatureRule[];
}

export interface FeatureRule {
  type: 'user_attribute' | 'custom';
  attribute?: string;
  operator?: 'equals' | 'contains' | 'in' | 'not_equals';
  value?: any;
  condition?: string;
}

export interface FeatureFlagContext {
  environment: Environment;
  userId?: string;
  sessionId?: string;
  userAttributes?: Record<string, any>;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagUpdate {
  name?: string;
  description?: string;
  enabled?: boolean;
  environments?: Environment[];
  targeting?: FeatureTargeting;
  metadata?: Partial<FeatureFlagMetadata>;
}

export interface FeatureFlagEvaluation {
  featureName: string;
  enabled: boolean;
  reason: string;
  context: FeatureFlagContext;
  evaluatedAt: Date;
}
