
export class GraphAnalyzer {
    nodes: any[];
    edges: any[];
    adjacencyMatrix: number[][];
    nodeMetrics: Map<string, any>;

    constructor(nodes: any[], edges: any[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.adjacencyMatrix = this.buildAdjacencyMatrix();
        this.nodeMetrics = new Map();
    }

    buildAdjacencyMatrix() {
        const n = this.nodes.length;
        const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
        const nodeIndices = new Map(this.nodes.map((node, i) => [node.id, i]));
        this.edges.forEach((edge: any) => {
            const sourceIdx = nodeIndices.get(edge.source);
            const targetIdx = nodeIndices.get(edge.target);
            if (sourceIdx !== undefined && targetIdx !== undefined) {
                matrix[sourceIdx][targetIdx] = 1;
                matrix[targetIdx][sourceIdx] = 1; // For undirected graphs
            }
        });
        return matrix;
    }

    calculateDegrees() {
        const degrees = new Map();
        this.nodes.forEach((node: any) => {
            const inDegree = this.edges.filter((e: any) => e.target === node.id).length;
            const outDegree = this.edges.filter((e: any) => e.source === node.id).length;
            degrees.set(node.id, {
                in: inDegree,
                out: outDegree,
                total: inDegree + outDegree
            });
        });
        return degrees;
    }

    calculateBetweennessCentrality() {
        const betweenness = new Map();
        const n = this.nodes.length;
        // Initialize betweenness values
        this.nodes.forEach((node: any) => betweenness.set(node.id, 0));
        // For each pair of nodes
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                // Find all shortest paths between i and j
                const paths = this.findAllShortestPaths(i, j);
                if (paths.length > 0) {
                    // For each node that appears in the shortest paths
                    const intermediateNodes = new Set(paths.flat());
                    intermediateNodes.delete(i);
                    intermediateNodes.delete(j);
                    intermediateNodes.forEach((nodeIdx: any) => {
                        const nodeId = this.nodes[nodeIdx].id;
                        const pathsThroughNode = paths.filter(path => path.includes(nodeIdx));
                        betweenness.set(nodeId, betweenness.get(nodeId) + pathsThroughNode.length / paths.length);
                    });
                }
            }
        }
        // Normalize values
        const maxBetweenness = Math.max(...betweenness.values());
        if (maxBetweenness > 0) {
            betweenness.forEach((value, key) => {
                betweenness.set(key, value / maxBetweenness);
            });
        }
        return betweenness;
    }

    calculateClosenessCentrality() {
        const closeness = new Map();
        const n = this.nodes.length;
        this.nodes.forEach((node, i) => {
            let totalDistance = 0;
            let reachableNodes = 0;
            // Calculate shortest paths to all other nodes
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const distance = this.findShortestPath(i, j).length - 1;
                    if (distance > 0) {
                        totalDistance += distance;
                        reachableNodes++;
                    }
                }
            }
            closeness.set(node.id, reachableNodes > 0 ? reachableNodes / totalDistance : 0);
        });
        return closeness;
    }

    calculatePageRank(damping = 0.85, iterations = 100) {
        const n = this.nodes.length;
        let pageRank = new Map();
        // Initialize PageRank values
        this.nodes.forEach((node: any) => pageRank.set(node.id, 1 / n));
        for (let iter = 0; iter < iterations; iter++) {
            const newRank = new Map();
            this.nodes.forEach((node, i) => {
                let sum = 0;
                const incomingEdges = this.edges.filter((e: any) => e.target === node.id);
                incomingEdges.forEach((edge: any) => {
                    const sourceRank = pageRank.get(edge.source) || 0;
                    const sourceDegree = this.edges.filter((e: any) => e.source === edge.source).length;
                    sum += sourceRank / sourceDegree;
                });
                newRank.set(node.id, (1 - damping) / n + damping * sum);
            });
            pageRank = newRank;
        }
        return pageRank;
    }

    detectCommunities() {
        // Implement Louvain method for community detection
        const communities = new Map();
        let currentCommunity = 0;
        const visited = new Set();
        const dfs = (nodeId: any) => {
            visited.add(nodeId);
            communities.set(nodeId, currentCommunity);
            const neighbors = this.edges
                .filter((e: any) => e.source === nodeId || e.target === nodeId)
                .map((e: any) => e.source === nodeId ? e.target : e.source);
            neighbors.forEach((neighbor: any) => {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            });
        };
        this.nodes.forEach((node: any) => {
            if (!visited.has(node.id)) {
                dfs(node.id);
                currentCommunity++;
            }
        });
        return communities;
    }

    findAllShortestPaths(start: number, end: number) {
        const paths: any[] = [];
        const queue: any[] = [{ path: [start], node: start }];
        const shortestLength = this.findShortestPath(start, end).length;
        while (queue.length > 0) {
            const { path, node } = queue.shift();
            if (path.length > shortestLength)
                break;
            if (node === end && path.length === shortestLength) {
                paths.push(path);
                continue;
            }
            for (let i = 0; i < this.adjacencyMatrix[node].length; i++) {
                if (this.adjacencyMatrix[node][i] && !path.includes(i)) {
                    queue.push({
                        path: [...path, i],
                        node: i
                    });
                }
            }
        }
        return paths;
    }

    findShortestPath(start: number, end: number) {
        const visited = new Set();
        const queue: any[] = [{ path: [start], node: start }];
        while (queue.length > 0) {
            const { path, node } = queue.shift();
            if (node === end)
                return path;
            if (!visited.has(node)) {
                visited.add(node);
                for (let i = 0; i < this.adjacencyMatrix[node].length; i++) {
                    if (this.adjacencyMatrix[node][i] && !visited.has(i)) {
                        queue.push({
                            path: [...path, i],
                            node: i
                        });
                    }
                }
            }
        }
        return [start];
    }

    analyzeGraph() {
        const degrees = this.calculateDegrees();
        const betweenness = this.calculateBetweennessCentrality();
        const closeness = this.calculateClosenessCentrality();
        const pageRank = this.calculatePageRank();
        const communities = this.detectCommunities();
        this.nodes.forEach((node: any) => {
            const degree = degrees.get(node.id);
            this.nodeMetrics.set(node.id, {
                degree: degree?.total || 0,
                inDegree: degree?.in || 0,
                outDegree: degree?.out || 0,
                betweennessCentrality: betweenness.get(node.id) || 0,
                closenessCentrality: closeness.get(node.id) || 0,
                eigenvectorCentrality: 0, // To be implemented
                pageRank: pageRank.get(node.id) || 0,
                clusteringCoefficient: this.calculateLocalClusteringCoefficient(node.id),
                community: communities.get(node.id) || 0
            });
        });
        return this.nodeMetrics;
    }

    calculateLocalClusteringCoefficient(nodeId: any) {
        const neighbors = this.edges
            .filter((e: any) => e.source === nodeId || e.target === nodeId)
            .map((e: any) => e.source === nodeId ? e.target : e.source);
        if (neighbors.length < 2)
            return 0;
        let connections = 0;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                if (this.edges.some((e: any) => (e.source === neighbors[i] && e.target === neighbors[j]) ||
                    (e.source === neighbors[j] && e.target === neighbors[i]))) {
                    connections++;
                }
            }
        }
        const possibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
        return connections / possibleConnections;
    }
}
