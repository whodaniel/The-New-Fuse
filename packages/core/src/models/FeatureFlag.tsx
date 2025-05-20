import mongoose, { Schema, Document } from 'mongoose';
import { FeatureFlag as IFeatureFlag, Environment } from '../types/featureFlags.js';

export interface FeatureFlagDocument extends IFeatureFlag, Document {}

const FeatureFlagSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  stage: { type: String, required: true },
  priority: { type: String, required: true },
  conditions: {
    userGroups: [{
      groupId: String,
      name: String,
      description: String
    }],
    environments: [{ 
      type: String,
      enum: Object.values(Environment)
    }],
    percentage: {
      value: Number,
      seed: String,
      sticky: Boolean
    },
    dateRange: {
      startDate: Date,
      endDate: Date,
      timezone: String
    },
    deviceTypes: [{
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    }],
    regions: [String],
    customRules: [{
      name: String,
      condition: String
    }]
  },
  metadata: {
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    lastModifiedBy: String,
    lastModifiedAt: { type: Date, default: Date.now },
    metrics: {
      usageCount: { type: Number, default: 0 },
      lastUsed: Date,
      errors: { type: Number, default: 0 },
      exposures: { type: Number, default: 0 },
      positiveEvaluations: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true,
  collection: 'featureFlags'
});

// Indexes for efficient queries
FeatureFlagSchema.index({ name: 1 }, { unique: true });
FeatureFlagSchema.index({ 'conditions.environments': 1 });
FeatureFlagSchema.index({ 'conditions.userGroups.groupId': 1 });
FeatureFlagSchema.index({ enabled: 1 });
FeatureFlagSchema.index({ stage: 1 });

export const FeatureFlag = mongoose.model<FeatureFlagDocument>('FeatureFlag', FeatureFlagSchema);