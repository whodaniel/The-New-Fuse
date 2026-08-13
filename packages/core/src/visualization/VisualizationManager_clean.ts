import { Injectable, Logger } from '@nestjs/common';

export interface VisualizationConfig {
  id: string;
  type: 'graph' | 'chart' | 'diagram' | 'tree';
  data: any;
  options?: Record<string, any>;
}

export interface VisualizationResult {
  id: string;
  output: string;
  format: 'svg' | 'png' | 'json';
  metadata?: Record<string, any>;
}

@Injectable()
export class VisualizationManager {
  private readonly logger = new Logger(VisualizationManager.name);
  private visualizations = new Map<string, VisualizationConfig>();

  async createVisualization(config: VisualizationConfig): Promise<VisualizationResult> {
    try {
      this.visualizations.set(config.id, config);
      this.logger.log(`Created visualization: ${config.id} (${config.type})`);

      return {
        id: config.id,
        output: JSON.stringify(config.data),
        format: 'json',
        metadata: config.options
      };
    } catch (error) {
      this.logger.error('Failed to create visualization', error);
      throw error;
    }
  }

  getVisualization(id: string): VisualizationConfig | undefined {
    return this.visualizations.get(id);
  }

  async updateVisualization(id: string, updates: Partial<VisualizationConfig>): Promise<VisualizationResult> {
    const existing = this.visualizations.get(id);
    if (!existing) {
      throw new Error(`Visualization not found: ${id}`);
    }

    const updated = { ...existing, ...updates, id };
    this.visualizations.set(id, updated);

    return {
      id,
      output: JSON.stringify(updated.data),
      format: 'json',
      metadata: updated.options
    };
  }

  deleteVisualization(id: string): boolean {
    return this.visualizations.delete(id);
  }

  getAllVisualizations(): VisualizationConfig[] {
    return Array.from(this.visualizations.values());
  }
}
