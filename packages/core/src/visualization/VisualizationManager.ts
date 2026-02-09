import { FileVisualizer, VisualizationConfig } from './fileVisualizer';

export interface VisualizationRequest {
  type: 'file-tree' | 'dependency-graph' | 'code-metrics';
  target: string;
  config?: VisualizationConfig;
  format?: 'json' | 'svg' | 'png';
}

export interface VisualizationResult {
  id: string;
  type: string;
  data: any;
  format: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class VisualizationManager {
  private fileVisualizer: FileVisualizer;
  private cache: Map<string, VisualizationResult> = new Map();

  constructor() {
    const defaultConfig = this.getDefaultConfig();
    this.fileVisualizer = new FileVisualizer(defaultConfig);
  }

  async createVisualization(request: VisualizationRequest): Promise<VisualizationResult> {
    const id = this.generateId(request);
    
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    let data: any;
    const format = request.format || 'json';
    
    switch (request.type) {
      case 'file-tree':
        data = await this.fileVisualizer.generateFileTree(request.target);
        break;
      case 'dependency-graph':
        data = await this.fileVisualizer.generateDependencyGraph(request.target);
        break;
      case 'code-metrics':
        data = await this.fileVisualizer.generateCodeMetrics(request.target);
        break;
      default:
        throw new Error(`Unsupported visualization type: ${request.type}`);
    }

    const result: VisualizationResult = {
      id,
      type: request.type,
      data,
      format,
      createdAt: new Date(),
      metadata: {
        target: request.target,
        config: request.config
      }
    };

    this.cache.set(id, result);
    return result;
  }

  async getVisualization(id: string): Promise<VisualizationResult | null> {
    return this.cache.get(id) || null;
  }

  async exportVisualization(id: string, format: string): Promise<string> {
    const visualization = this.cache.get(id);
    if (!visualization) {
      throw new Error(`Visualization not found: ${id}`);
    }

    return this.fileVisualizer.exportVisualization(visualization.data, format);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getCacheStats(): Promise<{ size: number, keys: string[], totalMemory: number }> {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }

  private generateId(request: VisualizationRequest): string {
    const hash = JSON.stringify(request).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString(36);
  }

  private getDefaultConfig(): VisualizationConfig {
    return {
      maxDepth: 5,
      includeHidden: false,
      groupByType: true
    };
  }
}