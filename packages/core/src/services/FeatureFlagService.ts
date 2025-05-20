import { FeatureFlag, FeatureFlagUpdate, FeatureFlagContext, Environment } from '../types/featureFlags.js';
import { FeatureTracker } from '@the-new-fuse/feature-tracker';
import * as crypto from 'crypto';

export class FeatureFlagService {
  private features: Map<string, FeatureFlag> = new Map();
  private featureTracker: FeatureTracker;

  constructor() {
    this.featureTracker = new FeatureTracker();
  }

  async getAllFeatures(): Promise<FeatureFlag[]> {
    return Array.from(this.features.values());
  }

  async getFeature(id: string): Promise<FeatureFlag | null> {
    return this.features.get(id) || null;
  }

  async createFeature(feature: Omit<FeatureFlag, 'id' | 'metadata'>): Promise<FeatureFlag> {
    const id = `feature_${Date.now()}`;
    const now = new Date();

    const newFeature: FeatureFlag = {
      ...feature,
      id,
      metadata: {
        createdAt: now,
        createdBy: 'system',
        lastModifiedAt: now,
        lastModifiedBy: 'system',
        metrics: {
          usageCount: 0,
          lastUsed: now,
          errors: 0,
          exposures: 0,
          positiveEvaluations: 0
        }
      }
    };

    this.features.set(id, newFeature);
    
    // Also track in FeatureTracker for development progress
    this.featureTracker.createFeature(
      id,
      feature.name,
      feature.description
    );

    return newFeature;
  }

  async updateFeature(id: string, update: FeatureFlagUpdate): Promise<FeatureFlag | null> {
    const feature = this.features.get(id);
    if (!feature) return null;

    const updatedFeature: FeatureFlag = {
      ...feature,
      ...update,
      conditions: update.conditions ? {
        ...feature.conditions,
        ...update.conditions
      } : feature.conditions,
      metadata: {
        ...feature.metadata!,
        lastModifiedAt: new Date(),
        lastModifiedBy: 'system'
      }
    };

    this.features.set(id, updatedFeature);

    if (update.stage) {
      this.featureTracker.updateStage(id, update.stage);
    }

    return updatedFeature;
  }

  async deleteFeature(id: string): Promise<boolean> {
    return this.features.delete(id);
  }

  private checkEnvironmentCondition(environments: Environment[] | undefined, context: FeatureFlagContext): boolean {
    if (!environments || environments.length === 0) return true;
    return environments.includes(context.environment || Environment.PRODUCTION);
  }

  private checkUserGroupCondition(userGroups: { groupId: string }[] | undefined, context: FeatureFlagContext): boolean {
    if (!userGroups || userGroups.length === 0) return true;
    if (!context.userGroups || context.userGroups.length === 0) return false;
    return userGroups.some(group => context.userGroups!.includes(group.groupId));
  }

  private checkDeviceTypeCondition(deviceTypes: string[] | undefined, context: FeatureFlagContext): boolean {
    if (!deviceTypes || deviceTypes.length === 0) return true;
    return deviceTypes.includes(context.deviceType || 'desktop');
  }

  private checkRegionCondition(regions: string[] | undefined, context: FeatureFlagContext): boolean {
    if (!regions || regions.length === 0) return true;
    return regions.includes(context.region || '');
  }

  private checkDateRangeCondition(dateRange: { startDate?: Date; endDate?: Date } | undefined): boolean {
    if (!dateRange) return true;
    
    const now = new Date();
    if (dateRange.startDate && new Date(dateRange.startDate) > now) return false;
    if (dateRange.endDate && new Date(dateRange.endDate) < now) return false;
    
    return true;
  }

  private checkPercentageRollout(
    percentage: { value: number; seed?: string; sticky?: boolean } | undefined,
    context: FeatureFlagContext
  ): boolean {
    if (!percentage) return true;
    
    const { value, seed, sticky } = percentage;
    if (value >= 100) return true;
    if (value <= 0) return false;

    // Generate a consistent hash if sticky is enabled
    const hashInput = sticky && context.userId 
      ? `${seed || ''}_${context.userId}`
      : `${seed || ''}_${Date.now()}`;

    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const hashNum = parseInt(hash.slice(0, 8), 16);
    const normalized = (hashNum / 0xffffffff) * 100;

    return normalized <= value;
  }

  private evaluateCustomRules(
    rules: { condition: string }[] | undefined,
    context: FeatureFlagContext
  ): boolean {
    if (!rules || rules.length === 0) return true;

    try {
      return rules.every(rule => {
        // Create a safe evaluation context with user data
        const evalContext = {
          user: {
            id: context.userId,
            groups: context.userGroups,
            region: context.region,
            deviceType: context.deviceType
          },
          custom: context.customContext || {},
          environment: context.environment
        };

        // Evaluate the condition in a safe context
        return new Function('context', `return (${rule.condition})`)(evalContext);
      });
    } catch (error) {
      console.error('Error evaluating custom rules:', error);
      return false;
    }
  }

  async isEnabled(id: string, context: FeatureFlagContext = {}): Promise<boolean> {
    const feature = this.features.get(id);
    if (!feature) return false;

    // Update exposure metrics
    if (feature.metadata?.metrics) {
      feature.metadata.metrics.exposures++;
      this.features.set(id, feature);
    }

    // If feature is not enabled at all, return false
    if (!feature.enabled) return false;

    // If no conditions are set, return true
    if (!feature.conditions) return true;

    // Check all conditions
    const conditionResults = [
      this.checkEnvironmentCondition(feature.conditions.environments, context),
      this.checkUserGroupCondition(feature.conditions.userGroups, context),
      this.checkDeviceTypeCondition(feature.conditions.deviceTypes, context),
      this.checkRegionCondition(feature.conditions.regions, context),
      this.checkDateRangeCondition(feature.conditions.dateRange),
      this.checkPercentageRollout(feature.conditions.percentage, context),
      this.evaluateCustomRules(feature.conditions.customRules, context)
    ];

    const isEnabled = conditionResults.every(Boolean);

    // Update metrics for positive evaluations
    if (isEnabled && feature.metadata?.metrics) {
      feature.metadata.metrics.positiveEvaluations++;
      feature.metadata.metrics.lastUsed = new Date();
      this.features.set(id, feature);
    }

    return isEnabled;
  }

  async recordError(id: string): Promise<void> {
    const feature = this.features.get(id);
    if (!feature?.metadata?.metrics) return;

    feature.metadata.metrics.errors++;
    this.features.set(id, feature);
  }
}