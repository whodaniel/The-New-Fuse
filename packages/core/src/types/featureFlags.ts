import { FeatureStage, SuggestionPriority } from '@the-new-fuse/feature-tracker';

export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export interface UserGroupCondition {
  groupId: string;
  name: string;
  description?: string;
}

export interface PercentageRollout {
  value: number;
  seed?: string; // For consistent rollout across sessions
  sticky?: boolean; // Keep the same users in the experiment
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export interface FeatureFlagConditions {
  userGroups?: UserGroupCondition[];
  environments?: Environment[];
  percentage?: PercentageRollout;
  dateRange?: DateRange;
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
  regions?: string[]; // Country/region codes
  customRules?: {
    name: string;
    condition: string; // JavaScript expression
  }[];
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  stage: FeatureStage;
  priority: SuggestionPriority;
  conditions?: FeatureFlagConditions;
  metadata?: {
    createdBy: string;
    createdAt: Date;
    lastModifiedBy: string;
    lastModifiedAt: Date;
    metrics?: {
      usageCount: number;
      lastUsed: Date;
      errors: number;
      exposures: number; // Number of times the flag was evaluated
      positiveEvaluations: number; // Number of times the flag returned true
    };
  };
}

export interface FeatureFlagUpdate {
  enabled?: boolean;
  stage?: FeatureStage;
  priority?: SuggestionPriority;
  conditions?: Partial<FeatureFlagConditions>;
}

export interface FeatureFlagContext {
  userId?: string;
  userGroups?: string[];
  environment?: Environment;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  region?: string;
  customContext?: Record<string, any>;
}