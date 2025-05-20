export interface ClusteringConfig {
    numClusters: number;
    minClusterSize: number;
    similarityThreshold: number;
    embeddingModel: string;
}
export declare class MemoryClusterManager {
    private clusters;
}
export interface Cluster {
}
