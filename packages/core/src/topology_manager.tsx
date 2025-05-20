import { Agent } from './types/agent.js';

interface TopologyNode {
  agent: Agent;
  connections: Set<string>;
  communication_weights?: { [key: string]: number };
}

interface CommunicationMetric {
  [key: string]: number;
}

export class TopologyManager {
    private nodes: Map<string, TopologyNode>;
    private communicationMetrics: CommunicationMetric;
    private taskHistory: unknown[];
    private sparsityFactor: number;
    private anchorWeight: number;
    private virtualNodeEmbedding: number[] | null;

    constructor() {
        this.nodes = new Map();
        this.communicationMetrics = {};
        this.taskHistory = [];
        this.sparsityFactor = 0.3;
        this.anchorWeight = 0.5;
        this.virtualNodeEmbedding = null;
    }

    addAgent(agent: Agent & { id: string }): void {
        if (!this.nodes.has(agent.id)) {
            this.nodes.set(agent.id, {
                agent,
                connections: new Set(),
                communication_weights: {}
            });
        }
    }

    /**
     * Generate node embedding for an agent
     */
    private generateNodeEmbedding(agent: Agent): number[] {
        // Initialize node embedding based on agent properties
        const embeddingSize = 384;  // Same as paper's D=384
        return Array.from({ length: embeddingSize }, () => this.normalRandom(0, 0.1));
    }

    /**
     * Connect two agents in the topology
     */
    connectAgents(agent1Id: string, agent2Id: string, weight: number = 1.0): void {
        const node1 = this.nodes.get(agent1Id);
        const node2 = this.nodes.get(agent2Id);

        if (!node1 || !node2) {
            throw new Error("One or both agents not found in topology");
        }

        node1.connections.add(agent2Id);
        node2.connections.add(agent1Id);

        if (!node1.communication_weights) {
            node1.communication_weights = {};
        }

        if (!node2.communication_weights) {
            node2.communication_weights = {};
        }

        node1.communication_weights[agent2Id] = weight;
        node2.communication_weights[agent1Id] = weight;
    }

    /**
     * Update the virtual node based on task description
     */
    private updateVirtualNode(taskDescription: string): void {
        if (this.nodes.size === 0) {
            return;
        }

        const embeddingSize = 384;

        this.virtualNodeEmbedding = Array.from(
            { length: embeddingSize },
            () => this.normalRandom(0, 0.1)
        );

        // Additional task-specific processing could be added here
    }

    /**
     * Update the topology based on a task description
     */
    updateTopologyForTask(taskDescription: string, taskComplexity: number = 0.5): void {
        if (this.nodes.size === 0) {
            return;
        }

        // Update virtual node for task-awareness
        this.updateVirtualNode(taskDescription);

        // Get all agent IDs
        const agentIds = Array.from(this.nodes.keys());
        const nAgents = agentIds.length;

        // Create adjacency matrix
        const adjMatrix = Array(nAgents).fill(0).map(() => Array(nAgents).fill(0));

        // Build node feature matrix and calculate topology
        // This is a simplified implementation
        for (let i = 0; i < nAgents; i++) {
            for (let j = 0; j < nAgents; j++) {
                if (i !== j) {
                    // Calculate some measure of compatibility between agents
                    adjMatrix[i][j] = this.normalRandom(0.5, 0.2);
                }
            }
        }

        // Apply the task scaling factor
        const scalingFactor = this.getTaskScalingFactor(taskComplexity);
        for (let i = 0; i < nAgents; i++) {
            for (let j = 0; j < nAgents; j++) {
                adjMatrix[i][j] *= scalingFactor;
            }
        }

        // Update the topology based on the adjacency matrix
        this.updateTopologyFromMatrix(adjMatrix, agentIds);
    }

    /**
     * Get the task scaling factor based on complexity
     */
    private getTaskScalingFactor(complexity: number): number {
        return 0.5 + (complexity * 0.5);  // Scale between 0.5 and 1.0
    }

    /**
     * Update the topology based on an adjacency matrix
     */
    private updateTopologyFromMatrix(adjMatrix: number[][], agentIds: string[]): void {
        const threshold = 0.3;  // Minimum efficiency threshold

        for (let i = 0; i < agentIds.length; i++) {
            for (let j = 0; j < agentIds.length; j++) {
                if (i === j) continue; // Skip self-connections

                const id1 = agentIds[i];
                const id2 = agentIds[j];
                const node1 = this.nodes.get(id1);
                const node2 = this.nodes.get(id2);

                if (!node1 || !node2) continue;

                if (adjMatrix[i][j] > threshold) {
                    // Connect agents if the adjacency value is above threshold
                    this.connectAgents(id1, id2, adjMatrix[i][j]);
                } else if (node1.connections.has(id2)) {
                    // Disconnect agents if the adjacency value is below threshold
                    node1.connections.delete(id2);
                    if (node1.communication_weights) {
                        delete node1.communication_weights[id2];
                    }

                    node2.connections.delete(id1);
                    if (node2.communication_weights) {
                        delete node2.communication_weights[id1];
                    }
                }
            }
        }
    }

    /**
     * Get all agents connected to a specific agent
     */
    public getConnectedAgents(agentId: string): string[] {
        const node = this.nodes.get(agentId);
        if (!node) {
            return [];
        }

        return Array.from(node.connections);
    }

    /**
     * Get the communication weight between two agents
     */
    public getCommunicationWeight(agent1Id: string, agent2Id: string): number {
        const node1 = this.nodes.get(agent1Id);
        if (!node1 || !node1.communication_weights) {
            return 0.0;
        }
        return node1.communication_weights[agent2Id] || 0.0;
    }

    // Utility methods for matrix operations
    /**
     * Generates a random number following a normal distribution.
     * Uses the Box-Muller transform.
     */
    private normalRandom(mean: number, stdDev: number): number {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + stdDev * z;
    }

    /**
     * Performs element-wise operation on two matrices.
     */
    private matrixOperation(matrix1: number[][], matrix2: number[][], operation: (a: number, b: number) => number): number[][] {
        if (matrix1.length !== matrix2.length || matrix1[0].length !== matrix2[0].length) {
            throw new Error("Matrices must have the same dimensions for element-wise operations.");
        }
        return matrix1.map((row, i) =>
            row.map((val, j) => operation(val, matrix2[i][j]))
        );
    }

    /**
     * Multiplies two matrices.
     */
    private matrixMultiply(matrix1: number[][], matrix2: number[][]): number[][] {
        const rows1 = matrix1.length;
        const cols1 = matrix1[0].length;
        const rows2 = matrix2.length;
        const cols2 = matrix2[0].length;

        if (cols1 !== rows2) {
            throw new Error("Matrices dimensions are incompatible for multiplication.");
        }

        const result: number[][] = Array(rows1).fill(0).map(() => Array(cols2).fill(0));

        for (let i = 0; i < rows1; i++) {
            for (let j = 0; j < cols2; j++) {
                for (let k = 0; k < cols1; k++) {
                    result[i][j] += matrix1[i][k] * matrix2[k][j];
                }
            }
        }
        return result;
    }

    /**
     * Transposes a matrix.
     */
    private transpose(matrix: number[][]): number[][] {
        if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
            return [];
        }
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[j][i] = matrix[i][j];
            }
        }
        return result;
    }
}

export type { CommunicationMetric };
