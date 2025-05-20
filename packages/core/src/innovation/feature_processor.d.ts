import { AssetCategory } from '../classification/asset_classifier.js';
interface Component {
    id: string;
    name: string;
    type: string;
    requirements: string[];
}
export interface FeatureSet {
    id: string;
    name: string;
    description: string;
    category: AssetCategory;
    components: Component[];
    dependencies: string[];
    implementationComplexity: number;
    potentialImpact: number;
}
export declare class FeatureProcessor {
    private processedFeatures;
    private featureDependencies;
    private impactScores;
    constructor();
    private generateFeatureId;
    private identifyComponents;
}
export {};
