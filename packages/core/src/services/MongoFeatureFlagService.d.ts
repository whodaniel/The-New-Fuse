import { Logger } from '@nestjs/common';
import { FeatureFlagContext, Environment, FeatureFlagUpdate, FeatureFlag as IFeatureFlag } from '../types/featureFlags';
import { FeatureFlagService } from './FeatureFlagService';
export declare class MongoFeatureFlagService extends FeatureFlagService {
    protected readonly logger: Logger;
    createFeature(data: Omit<IFeatureFlag, 'id' | 'metadata'>): Promise<IFeatureFlag>;
    updateFeature(id: string, update: FeatureFlagUpdate): Promise<IFeatureFlag>;
    evaluateFeature(name: string, context: FeatureFlagContext): Promise<boolean>;
    getFeatures(environment: Environment): Promise<IFeatureFlag[]>;
    getFeatureByName(name: string): Promise<IFeatureFlag | undefined>;
    deleteFeature(id: string): Promise<boolean>;
    getFeatureMetrics(id: string): Promise<any>;
    getAllFeatures(): Promise<IFeatureFlag[]>;
    private documentToFeatureFlag;
}
//# sourceMappingURL=MongoFeatureFlagService.d.ts.map