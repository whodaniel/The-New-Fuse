import { createLogger } from '../../loggingConfig.js';
import { AssetCategory } from '../classification/asset_classifier.js';

const logger = createLogger('feature_processor');

interface FeatureData {
    name: string;
    description: string;
    type: string;
    attributes: Record<string, any>;
    requirements?: string[];
    metrics?: Record<string, number>;
    [key: string]: unknown;
}

interface SiteData {
    features: FeatureData[];
    metadata: Record<string, any>;
    [key: string]: unknown;
}

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

interface FeatureAnalysis {
    feature: FeatureSet;
    metrics: {
        complexity: number;
        impact: number;
        feasibility: number;
        innovationScore: number;
    };
    risks: string[];
    benefits: string[];
}

interface FeatureComparison {
    feature: FeatureSet;
    existingFeature?: FeatureSet;
    improvements: string[];
    tradeoffs: string[];
    overallBenefit: number;
}

interface FeatureProposal {
    features: FeatureSet[];
    analysis: {
        totalImpact: number;
        totalComplexity: number;
        estimatedTimeframe: string;
        recommendedPriority: 'high' | 'medium' | 'low';
    };
    implementation: {
        phases: string[];
        dependencies: string[];
        resources: Record<string, number>;
    };
}

export class FeatureProcessor {
    private processedFeatures: Map<string, FeatureSet>;
    private featureDependencies: Map<string, string[]>;
    private impactScores: Map<string, number>;

    constructor() {
        this.processedFeatures = new Map();
        this.featureDependencies = new Map();
        this.impactScores = new Map();
    }

    public async processFeatures(siteData: SiteData): Promise<FeatureProposal | { status: string }> {
        try {
            logger.info('Processing new features from site');
            
            const extractedFeatures = await this.extractFeatures(siteData);
            if (extractedFeatures.length === 0) {
                return { status: "no_superior_features_found" };
            }
            
            const featureAnalyses = await this.analyzeFeatures(extractedFeatures);
            const comparisons = await this.compareFeatures(featureAnalyses);
            const superiorFeatures = this.filterSuperiorFeatures(comparisons);
            
            if (superiorFeatures.length > 0) {
                return await this.prepareFeatureProposal(superiorFeatures);
            }

            return { status: "no_superior_features_found" };
        } catch (error) {
            logger.error('Error processing features:', error);
            throw error;
        }
    }

    private async extractFeatures(siteData: SiteData): Promise<FeatureSet[]> {
        const features: FeatureSet[] = [];

        for (const featureData of siteData.features) {
            try {
                const feature = await this.processFeature(featureData);
                features.push(feature);
            } catch (error) {
                logger.error('Error extracting feature:', {
                    feature: featureData.name,
                    error
                });
            }
        }

        return features;
    }

    private async processFeature(featureData: FeatureData): Promise<FeatureSet> {
        const featureId = this.generateFeatureId(featureData);
        const feature: FeatureSet = {
            id: featureId,
            name: featureData.name,
            description: featureData.description,
            category: this.determineCategory(featureData),
            components: await this.identifyComponents(featureData),
            dependencies: await this.analyzeDependencies(featureData),
            implementationComplexity: this.calculateComplexity(featureData),
            potentialImpact: this.estimateImpact(featureData)
        };

        this.processedFeatures.set(featureId, feature);
        return feature;
    }

    private generateFeatureId(featureData: FeatureData): string {
        return `feature_${(featureData as any).name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    }

    private determineCategory(featureData: FeatureData): AssetCategory {
        // Implementation would depend on asset classification logic
        return AssetCategory.UNKNOWN;
    }

    private async identifyComponents(featureData: FeatureData): Promise<Component[]> {
        const components: Component[] = [];

        if (featureData.attributes?.components) {
            for (const comp of (featureData.attributes.components as any[])) {
                components.push({
                    id: `comp_${comp.id || Date.now()}`,
                    name: comp.name,
                    type: comp.type || 'unknown',
                    requirements: comp.requirements || []
                });
            }
        }

        return components;
    }

    private async analyzeDependencies(featureData: FeatureData): Promise<string[]> {
        const dependencies = new Set<string>();

        // Add explicit dependencies
        if (featureData.requirements) {
            featureData.requirements.forEach(dep => dependencies.add(dep));
        }

        return Array.from(dependencies);
    }

    private calculateComplexity(featureData: FeatureData): number {
        let complexity = 0;

        // Factor in number of components
        if (featureData.attributes?.components) {
            complexity += (featureData.attributes.components as any[]).length * 0.2;
        }

        // Factor in dependencies
        if (featureData.requirements) {
            complexity += featureData.requirements.length * 0.15;
        }

        // Factor in technical complexity metrics
        if (featureData.metrics) {
            complexity += (featureData.metrics.technicalComplexity || 0) * 0.4;
            complexity += (featureData.metrics.integrationComplexity || 0) * 0.25;
        }

        return Math.min(Math.max(complexity, 0), 1);
    }

    private estimateImpact(featureData: FeatureData): number {
        let impact = 0;

        // Factor in user impact
        if (featureData.metrics) {
            impact += (featureData.metrics.userImpact || 0) * 0.4;
            impact += (featureData.metrics.businessValue || 0) * 0.3;
            impact += (featureData.metrics.innovationScore || 0) * 0.3;
        }

        return Math.min(Math.max(impact, 0), 1);
    }

    private async analyzeFeatures(features: FeatureSet[]): Promise<FeatureAnalysis[]> {
        return features.map(feature => ({
            feature,
            metrics: {
                complexity: feature.implementationComplexity,
                impact: feature.potentialImpact,
                feasibility: 1 - feature.implementationComplexity,
                innovationScore: this.calculateInnovationScore(feature)
            },
            risks: this.identifyRisks(feature),
            benefits: this.identifyBenefits(feature)
        }));
    }

    private calculateInnovationScore(feature: FeatureSet): number {
        return (feature.potentialImpact * 0.7) + ((1 - feature.implementationComplexity) * 0.3);
    }

    private identifyRisks(feature: FeatureSet): string[] {
        const risks: string[] = [];

        if (feature.implementationComplexity > 0.7) {
            risks.push('High implementation complexity');
        }
        
        if (feature.dependencies.length > 3) {
            risks.push('Multiple dependencies');
        }
        
        return risks;
    }

    private identifyBenefits(feature: FeatureSet): string[] {
        const benefits: string[] = [];

        if (feature.potentialImpact > 0.7) {
            benefits.push('High potential impact');
        }
        
        if (feature.implementationComplexity < 0.3) {
            benefits.push('Low implementation complexity');
        }
        
        return benefits;
    }

    private async compareFeatures(analyses: FeatureAnalysis[]): Promise<FeatureComparison[]> {
        return analyses.map(analysis => ({
            feature: analysis.feature,
            improvements: this.identifyImprovements(analysis),
            tradeoffs: this.identifyTradeoffs(analysis),
            overallBenefit: this.calculateOverallBenefit(analysis)
        }));
    }

    private identifyImprovements(analysis: FeatureAnalysis): string[] {
        const improvements: string[] = [];

        if (analysis.metrics.impact > 0.8) {
            improvements.push('Significant impact improvement');
        }
        
        if (analysis.metrics.innovationScore > 0.7) {
            improvements.push('High innovation potential');
        }
        
        return improvements;
    }

    private identifyTradeoffs(analysis: FeatureAnalysis): string[] {
        const tradeoffs: string[] = [];

        if (analysis.metrics.complexity > 0.7) {
            tradeoffs.push('Increased complexity');
        }
        
        if (analysis.feature.dependencies.length > 3) {
            tradeoffs.push('Additional dependencies');
        }
        
        return tradeoffs;
    }

    private calculateOverallBenefit(analysis: FeatureAnalysis): number {
        return (analysis.metrics.impact * 0.6) + (analysis.metrics.innovationScore * 0.4) - (analysis.metrics.complexity * 0.3);
    }

    private filterSuperiorFeatures(comparisons: FeatureComparison[]): FeatureSet[] {
        return comparisons
            .filter(comp => comp.overallBenefit > 0.7)
            .map(comp => comp.feature);
    }

    private async prepareFeatureProposal(features: FeatureSet[]): Promise<FeatureProposal> {
        const totalImpact = features.reduce(
            (sum, feature) => sum + feature.potentialImpact,
            0
        );
        const totalComplexity = features.reduce(
            (sum, feature) => sum + feature.implementationComplexity,
            0
        );

        return {
            features,
            analysis: {
                totalImpact,
                totalComplexity,
                estimatedTimeframe: this.estimateTimeframe(totalComplexity),
                recommendedPriority: this.determinePriority(totalImpact)
            },
            implementation: {
                phases: this.planImplementationPhases(features),
                dependencies: this.consolidateDependencies(features),
                resources: this.estimateResourceRequirements(features)
            }
        };
    }

    private estimateTimeframe(complexity: number): string {
        if (complexity > 2) return 'long-term';
        if (complexity > 1) return 'medium-term';
        return 'short-term';
    }

    private determinePriority(impact: number): 'high' | 'medium' | 'low' {
        if (impact > 2) return 'high';
        if (impact > 1) return 'medium';
        return 'low';
    }

    private planImplementationPhases(features: FeatureSet[]): string[] {
        return ['planning', 'development', 'testing', 'deployment'];
    }

    private consolidateDependencies(features: FeatureSet[]): string[] {
        const dependencies = new Set<string>();
        
        features.forEach(feature => {
            feature.dependencies.forEach(dep => dependencies.add(dep));
        });
        
        return Array.from(dependencies);
    }

    private estimateResourceRequirements(features: FeatureSet[]): Record<string, number> {
        return {
            developers: Math.ceil(features.length * 0.5),
            testers: Math.ceil(features.length * 0.3),
            devops: Math.ceil(features.length * 0.2)
        };
    }
}
