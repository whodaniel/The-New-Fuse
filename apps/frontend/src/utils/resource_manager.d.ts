import { ModelType, ResourceLimits, ResourceUsage, CostMetrics, LatencyParams, LatencyMetrics } from '../types/resource.js';
interface ResourceManagerConfig {
    modelType: ModelType;
    limits?: ResourceLimits;
}
export declare class ResourceManager {
    private readonly modelType;
    private limits;
    private usage;
    private readonly logger;
    constructor(config: ResourceManagerConfig);
    private getDefaultLimits;
    private initializeUsage;
    setLimits(limits: ResourceLimits): void;
    estimateCost(prompt: string): CostMetrics;
    checkContextFit(text: string): [boolean, number];
    truncateToFit(text: string): string;
    measureLatency(params: LatencyParams): LatencyMetrics;
    updateUsage(tokens: number): void;
    getUsage(): ResourceUsage;
    private countTokens;
}
export {};
