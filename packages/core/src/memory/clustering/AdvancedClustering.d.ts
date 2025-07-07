import { ConfigService } from '@nestjs/config';
import { VectorMemoryCache } from '../cache/VectorMemoryCache';
import { MemoryItem } from '../MemoryTypes';
export interface ClusteringConfig {
    algorithm: 'kmeans' | 'hierarchical' | 'dbscan';
    numClusters?: number;
    maxIterations?: number;
    tolerance?: number;
    distanceMetric?: 'cosine' | 'euclidean' | 'manhattan';
    minSamples?: number;
    epsilon?: number;
}
export interface Cluster {
    id: string;
    centroid: number[];
    members: MemoryItem[];
    cohesion: number;
    separation: number;
    tags: string[];
    metadata: Record<string, any>;
}
export interface ClusteringResult {
    clusters: Cluster[];
    totalItems: number;
    clusteredItems: number;
    silhouetteScore: number;
    algorithm: string;
    executionTime: number;
}
export interface HierarchicalNode {
    id: string;
    centroid: number[];
    members: MemoryItem[];
    children?: HierarchicalNode[];
    parent?: HierarchicalNode;
    level: number;
    cohesion: number;
}
export declare class AdvancedClustering {
    private readonly configService;
    private readonly vectorCache;
    private readonly logger;
    private readonly defaultConfig;
    constructor(configService: ConfigService, vectorCache: VectorMemoryCache);
    clusterVectors(vectors: MemoryItem[], config?: Partial<ClusteringConfig>): Promise<ClusteringResult>;
    private kMeansClustering;
    private hierarchicalClustering;
    private dbscanClustering;
    private calculateDistance;
    private cosineDistance;
    private euclideanDistance;
    private manhattanDistance;
    private initializeCentroids;
    private updateCentroids;
    private checkConvergence;
    private createClusters;
    private calculateCentroid;
    private getNeighbors;
    private expandCluster;
    private calculateClusterMetrics;
    private calculateCohesion;
    private calculateSilhouetteScore;
    private calculateIntraClusterDistance;
    private calculateNearestClusterDistance;
    optimizeClusters(clusters: Cluster[], config?: Partial<ClusteringConfig>): Promise<Cluster[]>;
}
//# sourceMappingURL=AdvancedClustering.d.ts.map