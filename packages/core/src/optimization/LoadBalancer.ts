import { Injectable, Logger } from '@nestjs/common';

export interface Node {
  id: string;
  address: string;
  healthy: boolean;
  connections: number;
  weight?: number;
  responseTime?: number;
}

export type BalancingStrategy =
  | 'round-robin'
  | 'least-connections'
  | 'weighted-random'
  | 'fastest-response';

@Injectable()
export class LoadBalancer {
  private readonly logger = new Logger(LoadBalancer.name);
  private nodes: Node[] = [];
  private strategy: BalancingStrategy = 'round-robin';
  private currentIndex = -1;

  constructor() {}

  addNode(node: Omit<Node, 'healthy' | 'connections'>): Node {
    const newNode: Node = { ...node, healthy: true, connections: 0 };
    this.nodes.push(newNode);
    this.logger.log(`Added node: ${newNode.id} (${newNode.address})`);
    return newNode;
  }

  removeNode(id: string): boolean {
    const index = this.nodes.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.nodes.splice(index, 1);
      this.logger.log(`Removed node: ${id}`);
      return true;
    }
    return false;
  }

  setStrategy(strategy: BalancingStrategy): void {
    this.logger.log(`Setting load balancing strategy to: ${strategy}`);
    this.strategy = strategy;
    this.currentIndex = -1; // Reset index when strategy changes
  }

  async getNextNode(): Promise<Node | null> {
    const healthyNodes = this.nodes.filter((n) => n.healthy);
    if (healthyNodes.length === 0) {
      this.logger.warn('No healthy nodes available.');
      return null;
    }

    let selectedNode: Node;
    switch (this.strategy) {
      case 'least-connections':
        selectedNode = healthyNodes.sort((a, b) => a.connections - b.connections)[0];
        break;
      case 'weighted-random':
        selectedNode = this.getWeightedRandomNode(healthyNodes);
        break;
      case 'fastest-response':
        selectedNode = healthyNodes.sort(
          (a, b) => (a.responseTime ?? Infinity) - (b.responseTime ?? Infinity),
        )[0];
        break;
      case 'round-robin':
      default:
        this.currentIndex = (this.currentIndex + 1) % healthyNodes.length;
        selectedNode = healthyNodes[this.currentIndex];
        break;
    }

    selectedNode.connections++;
    this.logger.debug(`Selected node: ${selectedNode.id} using strategy: ${this.strategy}`);
    return selectedNode;
  }

  releaseNode(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node && node.connections > 0) {
      node.connections--;
      this.logger.debug(`Released node: ${nodeId}. Current connections: ${node.connections}`);
    }
  }

  updateNodeHealth(nodeId: string, healthy: boolean): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.healthy = healthy;
      this.logger.log(
        `Node ${nodeId} health status updated to: ${healthy ? 'healthy' : 'unhealthy'}`,
      );
    }
  }

  private getWeightedRandomNode(nodes: Node[]): Node {
    const totalWeight = nodes.reduce((sum, node) => sum + (node.weight ?? 1), 0);
    let random = Math.random() * totalWeight;

    for (const node of nodes) {
      random -= node.weight ?? 1;
      if (random <= 0) {
        return node;
      }
    }
    return nodes[nodes.length - 1]; // Fallback
  }
}
