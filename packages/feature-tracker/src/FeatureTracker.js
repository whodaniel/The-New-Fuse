"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureTracker = void 0;
const common_1 = require("@nestjs/common");
const types_js_1 = require("./types.js");
let FeatureTracker = class FeatureTracker {
    features = new Map();
    constructor() { }
    createFeature(featureId, name, description, dependencies = []) {
        const newFeature = {
            featureId,
            name,
            description,
            currentStage: types_js_1.FeatureStage.ANALYSIS,
            metrics: {
                linesOfCode: 0,
                filesModified: [],
                newFiles: [],
                tokensUsed: 0,
                testCoverage: 0
            },
            qualitativeAssessment: {
                challenges: [],
                risks: [],
                notes: '',
                lastUpdated: new Date()
            },
            stageHistory: [],
            dependencies,
            startTime: new Date(),
            lastUpdated: new Date(),
            completionPercentage: 0
        };
        this.features.set(featureId, newFeature);
        return newFeature;
    }
    getFeature(featureId) {
        const feature = this.features.get(featureId);
        if (!feature) {
            throw new Error(`Feature ${featureId} not found`);
        }
        return feature;
    }
    updateStage(featureId, newStage) {
        const feature = this.getFeature(featureId);
        const stageTransition = {
            from: feature.currentStage,
            to: newStage,
            timestamp: new Date(),
            duration: new Date().getTime() - feature.lastUpdated.getTime()
        };
        const updatedFeature = {
            ...feature,
            currentStage: newStage,
            stageHistory: [...feature.stageHistory, stageTransition],
            lastUpdated: new Date(),
            completionPercentage: this.calculateCompletionPercentage(newStage)
        };
        this.features.set(featureId, updatedFeature);
        return updatedFeature;
    }
    calculateCompletionPercentage(stage) {
        const stages = Object.values(types_js_1.FeatureStage);
        const currentIndex = stages.indexOf(stage);
        return Math.round((currentIndex / (stages.length - 1)) * 100);
    }
    updateMetrics(featureId, metrics) {
        const feature = this.getFeature(featureId);
        const updatedFeature = {
            ...feature,
            metrics: {
                ...feature.metrics,
                ...metrics
            },
            lastUpdated: new Date()
        };
        this.features.set(featureId, updatedFeature);
        return updatedFeature;
    }
    updateQualitativeAssessment(featureId, assessment) {
        const feature = this.getFeature(featureId);
        const updatedFeature = {
            ...feature,
            qualitativeAssessment: {
                ...feature.qualitativeAssessment,
                ...assessment,
                lastUpdated: new Date()
            },
            lastUpdated: new Date()
        };
        this.features.set(featureId, updatedFeature);
        return updatedFeature;
    }
    getProgressSummary(featureId) {
        const feature = this.getFeature(featureId);
        return `Feature ${feature.name} is in ${feature.currentStage} stage with ${feature.completionPercentage}% completion.`;
    }
};
exports.FeatureTracker = FeatureTracker;
exports.FeatureTracker = FeatureTracker = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FeatureTracker);
//# sourceMappingURL=FeatureTracker.js.map