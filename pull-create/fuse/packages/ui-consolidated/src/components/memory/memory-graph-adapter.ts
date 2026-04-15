interface GraphNode {
  id: string;
  type?: string;
  data: {
    label: string;
    status?: 'running' | 'error' | 'idle';
    priority?: 'high' | 'medium' | 'low';
    metadata?: Record<string, string | number>;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

interface MemoryGraphAdapterOptions {
  dimensions?: number;
}

export class MemoryGraphAdapter {
  private nodes: Map<string, GraphNode> = new Map();
  private dimensions: number;

  constructor(options: MemoryGraphAdapterOptions = {}) {
    this.dimensions = options.dimensions || 128;
  }

  async addNodes(nodes: GraphNode[]): Promise<void> {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }

  async getSuggestedConnections(node: GraphNode): Promise<Edge[]> {
    // Simple implementation - in a real implementation this would use
    // vector similarity or other algorithms to suggest connections
    const suggestions: Edge[] = [];

    for (const [id, existingNode] of this.nodes) {
      if (id !== node.id) {
        // Simple heuristic: suggest connections based on type similarity
        if (existingNode.type === node.type) {
          suggestions.push({
            id: `suggested-${id}-${node.id}`,
            source: id,
            target: node.id,
            type: 'default',
            animated: true,
          });
        }
      }
    }

    return suggestions;
  }

  async findSimilarNodes(node: GraphNode, threshold: number = 0.8): Promise<GraphNode[]> {
    // Simple implementation - would use vector embeddings in production
    const similar: GraphNode[] = [];

    for (const [id, existingNode] of this.nodes) {
      if (id !== node.id && existingNode.type === node.type) {
        similar.push(existingNode);
      }
    }

    return similar;
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  clear(): void {
    this.nodes.clear();
  }
}
