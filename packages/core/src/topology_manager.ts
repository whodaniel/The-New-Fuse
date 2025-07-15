import { Injectable, Logger } from '@nestjs/common';
import { Agent } from './types/agent';

export interface TopologyNode {
  id: string;
  agent: Agent;
  connections: string[];
  embedding?: number[];
}

export interface TopologyEdge {
  source: string;
  target: string;
  weight: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class TopologyManager {
  private readonly logger = new Logger(TopologyManager.name);
  private nodes: Map<string, TopologyNode> = new Map();
  private edges: Map<string, TopologyEdge> = new Map();
  private virtualNodeEmbedding: number[] = [];

  constructor() {
    this.virtualNodeEmbedding = Array.from({ length: 128 }, () => Math.random());
  }

  addNode(agent: Agent): string {
    const nodeId = agent.id || crypto.randomUUID();
    
    if (this.nodes.has(nodeId)) {
      throw new Error(`Agent ${nodeId} already exists in topology`);
    }

    const node: TopologyNode = {
      id: nodeId,
      agent,
      connections: [],
      embedding: Array.from({ length: 128 }, () => Math.random())
    };

    this.nodes.set(nodeId, node);
    this.logger.log(`Added agent ${nodeId} to topology`);
    return nodeId;
  }

  removeNode(nodeId: string): boolean {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Agent ${nodeId} not found in topology`);
    }

    // Remove all edges connected to this node
    const edgesToRemove = Array.from(this.edges.values())
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => `${edge.source}-${edge.target}`);

    edgesToRemove.forEach(edgeKey => this.edges.delete(edgeKey));

    // Remove the node
    this.nodes.delete(nodeId);
    this.logger.log(`Removed agent ${nodeId} from topology`);
    return true;
  }

  addEdge(sourceId: string, targetId: string, weight: number = 1.0): string {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error('One or both agents not found in topology');
    }

    const edgeKey = `${sourceId}-${targetId}`;
    const edge: TopologyEdge = {
      source: sourceId,
      target: targetId,
      weight
    };

    this.edges.set(edgeKey, edge);
    
    // Update connections
    const sourceNode = this.nodes.get(sourceId)!;
    if (!sourceNode.connections.includes(targetId)) {
      sourceNode.connections.push(targetId);
    }

    this.logger.log(`Added edge ${edgeKey} with weight ${weight}`);
    return edgeKey;
  }

  getNode(nodeId: string): TopologyNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): TopologyNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): TopologyEdge[] {
    return Array.from(this.edges.values());
  }

  calculateDistance(nodeId1: string, nodeId2: string): number {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (!node1 || !node2) {
      throw new Error('One or both agents not found in topology');
    }

    if (!node1.embedding || !node2.embedding) {
      throw new Error('Node embeddings not available');
    }

    if (node1.embedding.length !== node2.embedding.length) {
      throw new Error('Matrices dimensions are incompatible for multiplication');
    }

    // Calculate Euclidean distance
    let distance = 0;
    for (let i = 0; i < node1.embedding.length; i++) {
      distance += Math.pow(node1.embedding[i] - node2.embedding[i], 2);
    }
    
    return Math.sqrt(distance);
  }

  getNeighbors(nodeId: string, maxDistance: number = 1.0): string[] {
    const neighbors: string[] = [];
    
    for (const [id, node] of this.nodes) {
      if (id !== nodeId) {
        try {
          const distance = this.calculateDistance(nodeId, id);
          if (distance <= maxDistance) {
            neighbors.push(id);
          }
        } catch (error) {
          this.logger.warn(`Could not calculate distance for ${id}: ${error}`);
        }
      }
    }
    
    return neighbors;
  }
}