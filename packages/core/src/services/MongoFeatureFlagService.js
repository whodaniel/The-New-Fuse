var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MongoFeatureFlagService_1;
import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlag } from '../models/FeatureFlag';
import { FeatureFlagService } from './FeatureFlagService';
import * as crypto from 'crypto';
let MongoFeatureFlagService = MongoFeatureFlagService_1 = class MongoFeatureFlagService extends FeatureFlagService {
    logger = new Logger(MongoFeatureFlagService_1.name);
    async createFeature(data) {
        try {
            const id = crypto.randomUUID();
            const metadata = {
                createdBy: 'system',
                lastModifiedBy: 'system',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
            };
            const featureFlag = new FeatureFlag({
                ...data,
                id,
                metadata,
            });
            const savedFeature = await featureFlag.save();
            this.logger.log(`Created MongoDB feature flag: ${data.name} (${id})`);
            return this.documentToFeatureFlag(savedFeature);
        }
        catch (error) {
            this.logger.error('Failed to create MongoDB feature flag:', error);
            throw error;
        }
    }
    async updateFeature(id, update) {
        try {
            const existingFeature = await FeatureFlag.findOne({ id });
            if (!existingFeature) {
                throw new Error(`Feature flag with ID ${id} not found`);
            }
            const updatedData = {
                ...update,
                metadata: {
                    ...existingFeature.metadata,
                    lastModifiedBy: update.metadata?.lastModifiedBy || 'system',
                    updatedAt: new Date(),
                    version: (existingFeature.metadata.version || 0) + 1,
                },
            };
            const updatedFeature = await FeatureFlag.findOneAndUpdate({ id }, updatedData, { new: true });
            if (!updatedFeature) {
                throw new Error(`Failed to update feature flag ${id}`);
            }
            this.logger.log(`Updated MongoDB feature flag: ${updatedFeature.name} (${id})`);
            return this.documentToFeatureFlag(updatedFeature);
        }
        catch (error) {
            this.logger.error('Failed to update MongoDB feature flag:', error);
            throw error;
        }
    }
    async evaluateFeature(name, context) {
        try {
            const feature = await FeatureFlag.findOne({ name });
            if (!feature) {
                this.logger.warn(`MongoDB feature flag not found: ${name}`);
                return false;
            }
            if (!feature.enabled) {
                return false;
            }
            // Check environment
            if (feature.environments && !feature.environments.includes(context.environment)) {
                return false;
            }
            // Use parent class evaluation logic
            return super.evaluateFeature(name, context);
        }
        catch (error) {
            this.logger.error('Failed to evaluate MongoDB feature flag:', error);
            return false;
        }
    }
    async getFeatures(environment) {
        try {
            const query = {};
            if (environment) {
                query.$or = [
                    { environments: { $exists: false } },
                    { environments: { $in: [environment] } }
                ];
            }
            const features = await FeatureFlag.find(query);
            return features.map((doc) => this.documentToFeatureFlag(doc));
        }
        catch (error) {
            this.logger.error('Failed to get MongoDB features:', error);
            return [];
        }
    }
    async getFeatureByName(name) {
        try {
            const doc = await FeatureFlag.findOne({ name });
            return doc ? this.documentToFeatureFlag(doc) : undefined;
        }
        catch (error) {
            this.logger.error('Failed to get MongoDB feature by name:', error);
            return undefined;
        }
    }
    async deleteFeature(id) {
        try {
            const result = await FeatureFlag.deleteOne({ id });
            const deleted = result.deletedCount > 0;
            if (deleted) {
                this.logger.log(`Deleted MongoDB feature flag: ${id}`);
            }
            return deleted;
        }
        catch (error) {
            this.logger.error('Failed to delete MongoDB feature flag:', error);
            return false;
        }
    }
    async getFeatureMetrics(id) {
        try {
            const feature = await FeatureFlag.findOne({ id });
            if (!feature) {
                return null;
            }
            // Return basic metrics - can be extended with actual usage data
            return {
                id: feature.id,
                name: feature.name,
                enabled: feature.enabled,
                environments: feature.environments,
                metadata: feature.metadata,
                // Add usage metrics here when available
                evaluations: 0,
                lastEvaluated: null,
            };
        }
        catch (error) {
            this.logger.error('Failed to get MongoDB feature metrics:', error);
            return null;
        }
    }
    async getAllFeatures() {
        try {
            const features = await FeatureFlag.find({});
            return features.map((doc) => this.documentToFeatureFlag(doc));
        }
        catch (error) {
            this.logger.error('Failed to get all MongoDB features:', error);
            return [];
        }
    }
    documentToFeatureFlag(doc) {
        return {
            id: doc.id || doc._id.toString(),
            name: doc.name,
            description: doc.description,
            enabled: doc.enabled,
            environments: doc.environments,
            targeting: doc.targeting,
            metadata: {
                createdBy: doc.metadata.createdBy,
                lastModifiedBy: doc.metadata.lastModifiedBy,
                createdAt: doc.metadata.createdAt || new Date(),
                updatedAt: doc.metadata.updatedAt || new Date(),
                tags: doc.metadata.tags,
                version: doc.metadata.version,
            },
        };
    }
};
MongoFeatureFlagService = MongoFeatureFlagService_1 = __decorate([
    Injectable()
], MongoFeatureFlagService);
export { MongoFeatureFlagService };
//# sourceMappingURL=MongoFeatureFlagService.js.map