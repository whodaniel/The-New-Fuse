export declare class AdvancedGraphAlgorithms {
    constructor(nodes: any, edges: any);
    buildAdjacencyMatrix(): any[][];
    buildLaplacianMatrix(): any[][];
    powerIteration(matrix: any, iterations?: number): (number | any[])[];
    calculateEigenvectorCentrality(): Map<unknown, unknown>;
    calculateKatzCentrality(alpha?: number): Map<unknown, unknown>;
    calculateSpectralProperties(): {
        eigenvalues: (number | any[])[];
        eigenvectors: (number | any[])[];
        laplacianSpectrum: (number | any[])[];
    };
    detectStructuralHoles(): Map<any, any>;
    findCorePeriphery(): {
        core: Set<unknown>;
        periphery: Set<unknown>;
    };
    calculateAllMetrics(): {
        centrality: {
            degree: Map<any, any>;
            betweenness: Map<any, any>;
            closeness: Map<any, any>;
            eigenvector: Map<unknown, unknown>;
            katz: Map<unknown, unknown>;
        };
        clustering: {
            globalCoefficient: number;
            localCoefficients: Map<any, any>;
            communities: Map<any, any>;
        };
        paths: {
            averagePathLength: number;
            diameter: number;
            eccentricity: Map<any, any>;
        };
        spectral: {
            eigenvalues: (number | any[])[];
            eigenvectors: (number | any[])[];
            laplacianSpectrum: (number | any[])[];
        };
    };
}
