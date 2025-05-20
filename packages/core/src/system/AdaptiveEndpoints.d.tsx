export interface AdaptiveEndpoint {
    path: string;
    capabilities: string[];
    adaptiveRules: AdaptiveRule[];
    evolutionPatterns: EvolutionPattern[];
    metricCollectors: MetricCollector[];
}
export declare class AdaptiveEndpointSystem {
    registerEndpoint(): Promise<void>;
}
