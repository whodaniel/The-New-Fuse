import { AssetCategory } from '../classification/assetClassifier.js';
export interface FeatureSet {
    id: string;
    name: string;
    description: string;
    category: AssetCategory;
    components: string[];
    dependencies: string[];
    implementationComplexity: number;
    potentialImpact: number;
}
export declare class FeatureProcessor {
    private processedFeatures;
    private featureDependencies;
    private impactScores;
    constructor();
    catch(e: unknown): any;
    private identifyComponents;
}
