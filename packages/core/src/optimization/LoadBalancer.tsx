import { Injectable } from '@nestjs/common';
import { Logger } from '../logging/LoggingService.js';
import { ResourceManager } from './ResourceManager.js';

export interface Node {
  id: string;
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
  lastChecked: number;
  metrics: {
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
}

export interface BalancingStrategy {
  name: 'round-robin' | 'least-connections' | 'weighted-random' | 'response-time';
  config?: unknown;
}

@Injectable()
export class LoadBalancer {
  private nodes: Map<string, Node> = new Map();
  private currentIndex: number = 0;
  private strategy: BalancingStrategy;
  private logger: Logger;

  constructor(
    private readonly resourceManager: ResourceManager,
    strategy: BalancingStrategy,
    logger: Logger
  ) {
    this.strategy = strategy;
    this.logger = logger.createChild('LoadBalancer');
  }

  addNode(node: Omit<Node, 'healthy' | 'lastChecked' | 'metrics'>): void {
    const newNode: Node = {
      ...node,
      healthy: true,
      lastChecked: Date.now(),
      metrics: {
        responseTime: 0,
        errorRate: 0,
        activeConnections: 0
      }
    };

    this.nodes.set(node.id, newNode);
    this.logger.info('Node added', { nodeId: node.id });
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.logger.info('Node removed', { nodeId });
  }

  async getNextNode(): Promise<Node | null> {
    const healthyNodes = Array.from(this.nodes.values())
      .filter(node => node.healthy);
    
    if (healthyNodes.length === 0) {
      this.logger.warn('No healthy nodes available');
      return null;
    }

    let selectedNode: Node;

    switch (this.strategy.name) {
      case 'round-robin':
        selectedNode = this.roundRobin(healthyNodes);
        break;
      case 'least-connections':
        selectedNode = this.leastConnections(healthyNodes);
        break;
      case 'weighted-random':
        selectedNode = this.weightedRandom(healthyNodes);
        break;
      case 'response-time':
        selectedNode = this.responseTime(healthyNodes);
        break;
      default:
        selectedNode = this.roundRobin(healthyNodes);
    }

    this.logger.debug('Node selected', {
      nodeId: selectedNode.id,
      strategy: this.strategy.name
    });

    return selectedNode;
  }

  private roundRobin(nodes: Node[]): Node {
    this.currentIndex = (this.currentIndex + 1) % nodes.length;
    return nodes[this.currentIndex];
  }

  private leastConnections(nodes: Node[]): Node {
    return nodes.reduce((min, node) => 
      node.metrics.activeConnections < min.metrics.activeConnections ? node : min,
      nodes[0]
    );
  }

  private weightedRandom(nodes: Node[]): Node {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node;
      }
    }
    
    return nodes[0];
  }
  
  private responseTime(nodes: Node[]): Node {
    return nodes.reduce((min, node) => 
      node.metrics.responseTime < min.metrics.responseTime ? node : min,
      nodes[0]
    );
  }

  async updateNodeMetrics(
    nodeId: string,
    metrics: Partial<Node['metrics']>
  ): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      this.logger.warn('Node not found for metrics update', { nodeId });
      return;
    }

    node.metrics = {
      ...node.metrics,
      ...metrics
    };
    node.lastChecked = Date.now();

    this.logger.debug('Node metrics updated', { nodeId, metrics });
  }

  async checkNodeHealth(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    try {
      // Perform health check
      const isHealthy = await this.resourceManager.checkResourceHealth({
        id: nodeId,
        host: node.host,
        port: node.port,
        metrics: node.metrics
      });
      
      node.healthy = isHealthy;
      node.lastChecked = Date.now();
      
      if (!isHealthy) {
        this.logger.warn('Node health check failed', { nodeId });
      }
      
      return isHealthy;
    } catch (error) {
      this.logger.error('Health check error', { nodeId, error });
      node.healthy = false;
      return false;
    }
  }
}
