interface Node {
  id: string;
  label: string;
  type?: string;
  position?: { x: number; y: number };
  data?: any;
  timestamp?: Date;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface EventSystem {
  emit: (event: string, payload: any) => Promise<void>;
}

interface CachedEdge extends Edge {
  createdAt: Date;
}

export class MemoryGraphAdapter {
  private nodeCache: Map<string, Node> = new Map();
  private edgeCache: Map<string, CachedEdge> = new Map();
  private eventSystem?: EventSystem;

  constructor(options?: { dimensions?: number; eventSystem?: EventSystem }) {
    if (options?.eventSystem) {
      this.eventSystem = options.eventSystem;
    }
  }

  // Adapt memory data to graph structure
  async adapt(data: any): Promise<void> {
    const node: Node = {
      id: data.id || `node_${Date.now()}`,
      label: data.label || 'Memory Node',
      type: 'memory',
      timestamp: new Date(),
      data: {
        ...data.metadata,
        created: new Date(),
        updated: new Date().toISOString()
      }
    };

    this.nodeCache.set(node.id, node);
    
    if (this.eventSystem) {
      await this.eventSystem.emit('memory.node.added', {
        nodeId: node.id,
        type: 'graph_adaptation'
      });
    }
  }

  // Add multiple nodes efficiently
  async addNodes(nodes: Node[]): Promise<void> {
    await Promise.all(nodes.map(node => this.adapt(node)));
  }

  // Get recent nodes
  async getRecentNodes(limit: number = 5): Promise<Node[]> {
    const nodes = Array.from(this.nodeCache.values());
    return nodes
      .sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  // Get suggested connections based on memory
  async getSuggestedConnections(node: Node): Promise<Edge[]> {
    const relatedNodes = await this.findRelatedNodes(node);
    return relatedNodes.map(relatedNode => ({
      id: `${node.id}-${relatedNode.id}`,
      source: node.id,
      target: relatedNode.id,
      type: 'suggested',
      label: 'Suggested Connection',
      animated: true,
      style: { stroke: '#10b981', strokeDasharray: '5,5' }
    }));
  }

  // Find related nodes (stub implementation)
  private async findRelatedNodes(node: Node): Promise<Node[]> {
    // Simple implementation - return other nodes from cache
    return Array.from(this.nodeCache.values())
      .filter(n => n.id !== node.id)
      .slice(0, 3); // Limit to 3 related nodes
  }

  // Optimize memory usage
  async optimizeMemory(): Promise<void> {
    const now = new Date();
    const cacheTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [id, node] of Array.from(this.nodeCache.entries())) {
      if (node.timestamp && (now.getTime() - node.timestamp.getTime() > cacheTimeout)) {
        this.nodeCache.delete(id);
      }
    }

    for (const [id, edge] of Array.from(this.edgeCache.entries())) {
      if (now.getTime() - edge.createdAt.getTime() > cacheTimeout) {
        this.edgeCache.delete(id);
      }
    }

    if (this.eventSystem) {
      await this.eventSystem.emit('memory.consolidation.needed', {
        timestamp: now.toISOString(),
        nodesRemoved: this.nodeCache.size,
        edgesRemoved: this.edgeCache.size
      });
    }
  }

  // Get memory statistics
  getMemoryStats(): Record<string, number> {
    return {
      cachedNodes: this.nodeCache.size,
      cachedEdges: this.edgeCache.size
    };
  }
}