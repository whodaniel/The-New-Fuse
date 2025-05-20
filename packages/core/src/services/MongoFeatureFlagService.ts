import { FeatureFlag, FeatureFlagDocument } from '../models/FeatureFlag.js';
import { FeatureFlagContext } from '../types/featureFlags.js';
import { FeatureFlagService } from './FeatureFlagService.js';
import * as crypto from 'crypto';

export class MongoFeatureFlagService extends FeatureFlagService {
  async getAllFeatures(): Promise<FeatureFlagDocument[]> {
    return FeatureFlag.find();
  }

  async getFeature(id: string): Promise<FeatureFlagDocument | null> {
    return FeatureFlag.findById(id);
  }

  async createFeature(data: Omit<FeatureFlagDocument, '_id'>): Promise<FeatureFlagDocument> {
    const now = new Date();
    const feature = new FeatureFlag({
      ...data,
      metadata: {
        ...data.metadata,
        createdAt: now,
        lastModifiedAt: now,
        metrics: {
          usageCount: 0,
          lastUsed: now,
          errors: 0,
          exposures: 0,
          positiveEvaluations: 0
        }
      }
    });
    
    return feature.save();
  }

  async updateFeature(id: string, data: Partial<FeatureFlagDocument>): Promise<FeatureFlagDocument | null> {
    const feature = await FeatureFlag.findById(id);
    if (!feature) return null;

    Object.assign(feature, {
      ...data,
      'metadata.lastModifiedAt': new Date()
    });

    return feature.save();
  }

  async deleteFeature(id: string): Promise<boolean> {
    const result = await FeatureFlag.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async isEnabled(id: string, context: FeatureFlagContext = {}): Promise<boolean> {
    const feature = await FeatureFlag.findById(id);
    if (!feature) return false;

    // Update exposure metrics
    await FeatureFlag.updateOne(
      { _id: id },
      { 
        $inc: { 'metadata.metrics.exposures': 1 },
        $set: { 'metadata.metrics.lastUsed': new Date() }
      }
    );

    // If feature is not enabled at all, return false
    if (!feature.enabled) return false;

    // If no conditions are set, return true
    if (!feature.conditions) return true;

    // Check all conditions
    const conditionResults = await Promise.all([
      this.checkEnvironmentCondition(feature.conditions.environments, context),
      this.checkUserGroupCondition(feature.conditions.userGroups, context),
      this.checkDeviceTypeCondition(feature.conditions.deviceTypes, context),
      this.checkRegionCondition(feature.conditions.regions, context),
      this.checkDateRangeCondition(feature.conditions.dateRange),
      this.checkPercentageRollout(feature.conditions.percentage, context),
      this.evaluateCustomRules(feature.conditions.customRules, context)
    ]);

    const isEnabled = conditionResults.every(Boolean);

    // Update metrics for positive evaluations
    if (isEnabled) {
      await FeatureFlag.updateOne(
        { _id: id },
        { 
          $inc: { 'metadata.metrics.positiveEvaluations': 1 },
          $set: { 'metadata.metrics.lastUsed': new Date() }
        }
      );
    }

    return isEnabled;
  }

  async recordError(id: string): Promise<void> {
    await FeatureFlag.updateOne(
      { _id: id },
      { $inc: { 'metadata.metrics.errors': 1 } }
    );
  }

  async getFeaturesForContext(context: FeatureFlagContext): Promise<FeatureFlagDocument[]> {
    const features = await FeatureFlag.find({ enabled: true });
    const enabledFeatures = await Promise.all(
      features.map(async feature => {
        const isEnabled = await this.isEnabled(feature._id, context);
        return isEnabled ? feature : null;
      })
    );
    
    return enabledFeatures.filter((f): f is FeatureFlagDocument => f !== null);
  }

  async getFeatureMetrics(id: string): Promise<FeatureFlagDocument['metadata']['metrics'] | null> {
    const feature = await FeatureFlag.findById(id);
    return feature?.metadata?.metrics || null;
  }

  async bulkUpdateFeatures(updates: Array<{ id: string; data: Partial<FeatureFlagDocument> }>): Promise<void> {
    const operations = updates.map(({ id, data }) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          ...data,
          'metadata.lastModifiedAt': new Date()
        }
      }
    }));

    await FeatureFlag.bulkWrite(operations);
  }
}