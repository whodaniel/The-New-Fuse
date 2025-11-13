var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FeatureFlagService_1;
import { Injectable, Logger } from '@nestjs/common';
// Remove external dependency - implement tracking internally if needed
import * as crypto from 'crypto';
let FeatureFlagService = FeatureFlagService_1 = class FeatureFlagService {
    logger = new Logger(FeatureFlagService_1.name);
    features = new Map();
    featuresByName = new Map();
    constructor() { }
    async createFeature(feature) {
        try {
            const id = crypto.randomUUID();
            const metadata = {
                createdBy: 'system',
                lastModifiedBy: 'system',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newFeature = {
                ...feature,
                id,
                metadata
            };
            // Store by both ID and name for efficient lookups
            this.features.set(id, newFeature);
            this.featuresByName.set(feature.name, newFeature);
            // Feature creation tracking would go here if needed
            this.logger.log(`Created feature flag: ${feature.name} (${id})`);
            return newFeature;
        }
        catch (error) {
            this.logger.error('Failed to create feature flag:', error);
            throw error;
        }
    }
    async updateFeature(id, update) {
        try {
            const existingFeature = this.features.get(id);
            if (!existingFeature) {
                throw new Error(`Feature flag with ID ${id} not found`);
            }
            const updatedFeature = {
                ...existingFeature,
                ...update,
                metadata: {
                    ...existingFeature.metadata,
                    lastModifiedBy: update.metadata?.lastModifiedBy || 'system',
                    updatedAt: new Date()
                }
            };
            // Update both maps
            this.features.set(id, updatedFeature);
            this.featuresByName.set(updatedFeature.name, updatedFeature);
            // Feature update tracking would go here if needed
            this.logger.log(`Updated feature flag: ${updatedFeature.name} (${id})`);
            return updatedFeature;
        }
        catch (error) {
            this.logger.error('Failed to update feature flag:', error);
            throw error;
        }
    }
    async evaluateFeature(name, context) {
        try {
            const feature = this.featuresByName.get(name);
            if (!feature) {
                this.logger.warn(`Feature flag not found: ${name}`);
                return false;
            }
            if (!feature.enabled) {
                return false;
            }
            // Check environment
            if (feature.environments && !feature.environments.includes(context.environment)) {
                return false;
            }
            // Check user targeting
            if (feature.targeting?.userIds && context.userId) {
                if (feature.targeting.userIds.includes(context.userId)) {
                    return true;
                }
            }
            // Check percentage rollout
            if (feature.targeting?.percentage !== undefined) {
                const hash = this.hashContext(name, context);
                const percentage = hash % 100;
                return percentage < feature.targeting.percentage;
            }
            // Check custom rules
            if (feature.targeting?.rules) {
                return this.evaluateRules(feature.targeting.rules, context);
            }
            // Default to enabled if no specific targeting
            return true;
        }
        catch (error) {
            this.logger.error('Failed to evaluate feature flag:', error);
            return false;
        }
    }
    async getFeatures(environment) {
        try {
            const allFeatures = Array.from(this.features.values());
            return allFeatures.filter(feature => !feature.environments || feature.environments.includes(environment));
        }
        catch (error) {
            this.logger.error('Failed to get features:', error);
            return [];
        }
    }
    async getFeatureByName(name) {
        return this.featuresByName.get(name);
    }
    async deleteFeature(id) {
        try {
            const feature = this.features.get(id);
            if (!feature) {
                return false;
            }
            this.features.delete(id);
            this.featuresByName.delete(feature.name);
            // Feature deletion tracking would go here if needed
            this.logger.log(`Deleted feature flag: ${feature.name} (${id})`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to delete feature flag:', error);
            return false;
        }
    }
    async getAllFeatures() {
        return Array.from(this.features.values());
    }
    hashContext(featureName, context) {
        const hashInput = `${featureName}:${context.userId || 'anonymous'}:${context.sessionId || ''}`;
        const hash = crypto.createHash('md5').update(hashInput).digest('hex');
        return parseInt(hash.substring(0, 8), 16);
    }
    evaluateRules(rules, context) {
        // Simple rule evaluation - can be extended for complex rules
        return rules.every(rule => {
            switch (rule.type) {
                case 'user_attribute':
                    return this.evaluateUserAttributeRule(rule, context);
                case 'custom':
                    return this.evaluateCustomRule(rule, context);
                default:
                    return true;
            }
        });
    }
    evaluateUserAttributeRule(rule, context) {
        const userValue = context.userAttributes?.[rule.attribute];
        if (!userValue)
            return false;
        switch (rule.operator) {
            case 'equals':
                return userValue === rule.value;
            case 'contains':
                return String(userValue).includes(rule.value);
            case 'in':
                return Array.isArray(rule.value) && rule.value.includes(userValue);
            default:
                return false;
        }
    }
    evaluateCustomRule(rule, context) {
        // Placeholder for custom rule evaluation
        // This can be extended to support complex business logic
        return true;
    }
};
FeatureFlagService = FeatureFlagService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], FeatureFlagService);
export { FeatureFlagService };
//# sourceMappingURL=FeatureFlagService.js.map