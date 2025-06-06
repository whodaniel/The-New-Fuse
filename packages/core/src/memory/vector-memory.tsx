import { Node } from '../graph/node.js';

export interface VectorMemoryOptions {
  dimensions: number;
  maxSize?: number;
  similarityThreshold?: number;
}

export interface MemoryVector {
  vector: number[];
  node: Node;
  timestamp: number;
  importance: number;
}

export class VectorMemoryManager {
  private vectors: MemoryVector[] = [];
  private readonly dimensions: number;
  private readonly maxSize: number;
  private readonly similarityThreshold: number;

  constructor(options: VectorMemoryOptions) {
    this.dimensions = options.dimensions;
    this.maxSize = options.maxSize || 1000;
    this.similarityThreshold = options.similarityThreshold || 0.8;
  }

  // Add a new memory vector
  async addMemory(node: Node, vector?: number[]): Promise<void> {
    const memoryVector: MemoryVector = {
      vector: vector || await this.generateVector(node),
      node,
      timestamp: Date.now(),
      importance: this.calculateImportance(node)
    };

    this.vectors.push(memoryVector);
    this.optimizeMemory();
  }

  // Find similar memories
  async findSimilar(query: Node | number[], limit: number = 5): Promise<Node[]> {
    const queryVector = Array.isArray(query) ? query : await this.generateVector(query);
    
    const similarities = this.vectors.map(memory => ({
      similarity: this.cosineSimilarity(queryVector, memory.vector),
      node: memory.node
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .filter(item => item.similarity >= this.similarityThreshold)
      .slice(0, limit)
      .map(item => item.node);
  }

  // Optimize memory by removing less important entries
  private optimizeMemory(): void {
    if (this.vectors.length <= this.maxSize) return;

    // Sort by importance and recency
    this.vectors.sort((a, b) => {
      const importanceWeight = 0.7;
      const recencyWeight = 0.3;
      
      const scoreA = (a.importance * importanceWeight) + 
                    (a.timestamp * recencyWeight);
      const scoreB = (b.importance * importanceWeight) + 
                    (b.timestamp * recencyWeight);
      
      return scoreB - scoreA;
    });

    // Keep only the top entries
    this.vectors = this.vectors.slice(0, this.maxSize);
  }

  // Calculate importance score for a node
  private calculateImportance(node: Node): number {
    let score = 1.0;
    
    switch (node.type) {
      case 'agent':
        score *= 1.3;
        break;
      case 'message':
        score *= 1.1;
        break;
      default:
        break;
    }

    // Adjust for priority if present
    if (node.priority === 'high') {
      score *= 1.5;
    }

    return score;
  }

  // Generate vector for a node (placeholder implementation)
  private async generateVector(_node: Node): Promise<number[]> {
    // For now, return a simple random vector
    // In production, this would use an actual embedding model
    return Array.from({ length: this.dimensions }, () => Math.random() - 0.5);
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
