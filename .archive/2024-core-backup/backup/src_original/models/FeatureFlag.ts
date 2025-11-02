import mongoose from 'mongoose';
  collection: 'featureFlags;'
// Indexes for efficientqueries'
FeatureFlagSchema.index({ name: 1  }, { unique: true });FeatureFlagSchema.index({ conditions.'environments: 1 });FeatureFlagSchema.index({ conditions.userGroups.groupId'