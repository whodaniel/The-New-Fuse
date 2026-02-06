import mongoose, { Document, Schema } from 'mongoose';
import {
  FeatureFlag as IFeatureFlag,
  Environment,
  FeatureTargeting,
  FeatureFlagMetadata,
} from '../types/featureFlags';

export interface FeatureFlagDocument extends Omit<IFeatureFlag, 'id'>, Document {
  isEnabledForEnvironment(environment: Environment): boolean;
  evaluateForUser(userId: string, userAttributes?: Record<string, any>): boolean;
  hashUser(userId: string): number;
  evaluateRules(rules: any[], userAttributes: Record<string, any>): boolean;
  isModified(path?: string): boolean;
}

const FeatureTargetingSchema = new Schema(
  {
    percentage: { type: Number, min: 0, max: 100 },
    userIds: [{ type: String }],
    rules: [
      {
        type: { type: String, enum: ['user_attribute', 'custom'], required: true },
        attribute: { type: String },
        operator: { type: String, enum: ['equals', 'contains', 'in', 'not_equals'] },
        value: { type: Schema.Types.Mixed },
        condition: { type: String },
      },
    ],
  },
  { _id: false },
);

const FeatureFlagMetadataSchema = new Schema(
  {
    createdBy: { type: String, required: true },
    lastModifiedBy: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
    tags: [{ type: String }],
    version: { type: Number, default: 1 },
  },
  { _id: false },
);

const FeatureFlagSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    enabled: { type: Boolean, required: true, default: false },
    environments: [
      {
        type: String,
        enum: Object.values(Environment),
      },
    ],
    targeting: FeatureTargetingSchema,
    metadata: { type: FeatureFlagMetadataSchema, required: true },
  },
  {
    collection: 'featureFlags',
    timestamps: false, // We handle timestamps manually in metadata
  },
);

// Indexes for efficient queries
FeatureFlagSchema.index({ name: 1 }, { unique: true });
FeatureFlagSchema.index({ id: 1 }, { unique: true });
FeatureFlagSchema.index({ environments: 1 });
FeatureFlagSchema.index({ enabled: 1 });
FeatureFlagSchema.index({ 'metadata.createdAt': 1 });
FeatureFlagSchema.index({ 'metadata.updatedAt': 1 });

// Pre-save middleware to update metadata timestamps
FeatureFlagSchema.pre('save', function (this: FeatureFlagDocument, next: () => void) {
  if (this.isModified() && this.metadata) {
    this.metadata.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to update metadata timestamps
FeatureFlagSchema.pre(
  ['findOneAndUpdate', 'updateOne', 'updateMany'],
  function (this: any, next: () => void) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
  },
);

// Instance methods
FeatureFlagSchema.methods.isEnabledForEnvironment = function (
  this: FeatureFlagDocument,
  environment: Environment,
): boolean {
  if (!this.enabled) return false;
  if (!this.environments || this.environments.length === 0) return true;
  return this.environments.includes(environment);
};

FeatureFlagSchema.methods.evaluateForUser = function (
  this: FeatureFlagDocument,
  userId: string,
  userAttributes?: Record<string, any>,
): boolean {
  if (!this.enabled) return false;

  // Check user ID targeting
  if (this.targeting?.userIds && this.targeting.userIds.includes(userId)) {
    return true;
  }

  // Check percentage rollout
  if (this.targeting?.percentage !== undefined) {
    const hash = this.hashUser(userId);
    const percentage = hash % 100;
    return percentage < this.targeting.percentage;
  }

  // Check rules
  if (this.targeting?.rules && userAttributes) {
    return this.evaluateRules(this.targeting.rules, userAttributes);
  }

  return true;
};

FeatureFlagSchema.methods.hashUser = function (this: FeatureFlagDocument, userId: string): number {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(`${this.name}:${userId}`).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
};

FeatureFlagSchema.methods.evaluateRules = function (
  this: FeatureFlagDocument,
  rules: any[],
  userAttributes: Record<string, any>,
): boolean {
  return rules.every((rule) => {
    const userValue = userAttributes[rule.attribute];
    if (!userValue) return false;

    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'not_equals':
        return userValue !== rule.value;
      case 'contains':
        return String(userValue).includes(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(userValue);
      default:
        return false;
    }
  });
};

// Static methods
FeatureFlagSchema.statics.findByEnvironment = function (environment: Environment) {
  return this.find({
    $or: [{ environments: { $exists: false } }, { environments: { $in: [environment] } }],
  });
};

FeatureFlagSchema.statics.findEnabledFeatures = function (environment?: Environment) {
  const query: any = { enabled: true };

  if (environment) {
    query.$or = [{ environments: { $exists: false } }, { environments: { $in: [environment] } }];
  }

  return this.find(query);
};

export const FeatureFlag = mongoose.model<FeatureFlagDocument>('FeatureFlag', FeatureFlagSchema);
