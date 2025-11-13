import mongoose, { Document } from 'mongoose';
import { FeatureFlag as IFeatureFlag, Environment } from '../types/featureFlags';
export interface FeatureFlagDocument extends Omit<IFeatureFlag, 'id'>, Document {
    isEnabledForEnvironment(environment: Environment): boolean;
    evaluateForUser(userId: string, userAttributes?: Record<string, any>): boolean;
    hashUser(userId: string): number;
    evaluateRules(rules: any[], userAttributes: Record<string, any>): boolean;
    isModified(path?: string): boolean;
}
export declare const FeatureFlag: mongoose.Model<FeatureFlagDocument, {}, {}, {}, mongoose.Document<unknown, {}, FeatureFlagDocument, {}, {}> & FeatureFlagDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FeatureFlag.d.ts.map