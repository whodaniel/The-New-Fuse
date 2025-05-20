export interface ClusteringConfig {
    minClusterSize: number;
    maxClusters: number;
    minSimilarity: number;
    hierarchicalLevels: number;
    updateInterval: number;
}
export declare class AdvancedClusteringEngine {
    private config;
    private logger;
    constructor(config?: Partial<ClusteringConfig>);
    catch(error: unknown): any;
    private initializeCentroids;
}
