import { Logger } from '@nestjs/common';
import { FeatureFlag, FeatureFlagUpdate, FeatureFlagContext, Environment } from '../types/featureFlags';
export declare class FeatureFlagService {
    protected readonly logger: Logger;
    private readonly features;
    private readonly featuresByName;
    constructor();
    createFeature(feature: Omit<FeatureFlag, 'id' | 'metadata'>): Promise<FeatureFlag>;
    updateFeature(id: string, update: FeatureFlagUpdate): Promise<FeatureFlag>;
    evaluateFeature(name: string, context: FeatureFlagContext): Promise<boolean>;
    getFeatures(environment: Environment): Promise<FeatureFlag[]>;
    getFeatureByName(name: string): Promise<FeatureFlag | undefined>;
    deleteFeature(id: string): Promise<boolean>;
    getAllFeatures(): Promise<FeatureFlag[]>;
    private hashContext;
    private evaluateRules;
    private evaluateUserAttributeRule;
    private evaluateCustomRule;
}
//# sourceMappingURL=FeatureFlagService.d.ts.map