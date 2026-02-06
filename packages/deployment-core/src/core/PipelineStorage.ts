import { Logger } from 'winston';
import {
  BuildResult,
  DeploymentResult,
  PipelineConfig,
  PipelineResult,
  RollbackResult,
} from '../types/pipeline';

/**
 * Pipeline Storage handles persistence of pipeline configurations, results, and metrics
 */
export class PipelineStorage {
  private logger: Logger;
  private configs: Map<string, PipelineConfig> = new Map();
  private pipelineResults: Map<string, PipelineResult> = new Map();
  private buildResults: Map<string, BuildResult> = new Map();
  private deploymentResults: Map<string, DeploymentResult> = new Map();
  private rollbackResults: Map<string, RollbackResult> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Store pipeline configuration
   */
  async storePipelineConfig(config: PipelineConfig): Promise<void> {
    this.logger.info(`Storing pipeline configuration: ${config.name}`, {
      configId: config.id,
      version: config.version,
    });

    this.configs.set(config.id, config);
  }

  /**
   * Get pipeline configuration by ID
   */
  async getPipelineConfig(configId: string): Promise<PipelineConfig | null> {
    return this.configs.get(configId) || null;
  }

  /**
   * Get all pipeline configurations
   */
  async getAllPipelineConfigs(): Promise<PipelineConfig[]> {
    return Array.from(this.configs.values());
  }

  /**
   * Store pipeline execution result
   */
  async storePipelineResult(result: PipelineResult): Promise<void> {
    this.logger.info(`Storing pipeline result: ${result.id}`, {
      pipelineId: result.pipelineId,
      status: result.status,
      duration: result.duration,
    });

    this.pipelineResults.set(result.id, result);
  }

  /**
   * Get pipeline result by ID
   */
  async getPipelineResult(resultId: string): Promise<PipelineResult | null> {
    return this.pipelineResults.get(resultId) || null;
  }

  /**
   * Get pipeline execution history
   */
  async getPipelineHistory(pipelineId?: string, limit: number = 50): Promise<PipelineResult[]> {
    let results = Array.from(this.pipelineResults.values());

    if (pipelineId) {
      results = results.filter((r) => r.pipelineId === pipelineId);
    }

    // Sort by start time (most recent first)
    results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return results.slice(0, limit);
  }

  /**
   * Store build result
   */
  async storeBuildResult(result: BuildResult): Promise<void> {
    this.logger.info(`Storing build result: ${result.id}`, {
      triggerId: result.triggerId,
      status: result.status,
      duration: result.duration,
    });

    this.buildResults.set(result.id, result);
  }

  /**
   * Get build result by ID
   */
  async getBuildResult(resultId: string): Promise<BuildResult | null> {
    return this.buildResults.get(resultId) || null;
  }

  /**
   * Store deployment result
   */
  async storeDeploymentResult(result: DeploymentResult): Promise<void> {
    this.logger.info(`Storing deployment result: ${result.id}`, {
      deploymentId: result.deploymentId,
      environment: result.environment,
      status: result.status,
      duration: result.duration,
    });

    this.deploymentResults.set(result.id, result);
  }

  /**
   * Get deployment result by ID
   */
  async getDeploymentResult(resultId: string): Promise<DeploymentResult | null> {
    return this.deploymentResults.get(resultId) || null;
  }

  /**
   * Store rollback result
   */
  async storeRollbackResult(result: RollbackResult): Promise<void> {
    this.logger.info(`Storing rollback result: ${result.id}`, {
      deploymentId: result.deploymentId,
      status: result.status,
      duration: result.duration,
    });

    this.rollbackResults.set(result.id, result);
  }

  /**
   * Get rollback result by ID
   */
  async getRollbackResult(resultId: string): Promise<RollbackResult | null> {
    return this.rollbackResults.get(resultId) || null;
  }

  /**
   * Delete old pipeline results based on retention policy
   */
  async cleanupOldResults(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    // Clean up pipeline results
    for (const [id, result] of this.pipelineResults.entries()) {
      if (result.startTime < cutoffDate) {
        this.pipelineResults.delete(id);
        deletedCount++;
      }
    }

    // Clean up build results
    for (const [id, result] of this.buildResults.entries()) {
      if (result.startTime < cutoffDate) {
        this.buildResults.delete(id);
        deletedCount++;
      }
    }

    // Clean up deployment results
    for (const [id, result] of this.deploymentResults.entries()) {
      if (result.startTime < cutoffDate) {
        this.deploymentResults.delete(id);
        deletedCount++;
      }
    }

    // Clean up rollback results
    for (const [id, result] of this.rollbackResults.entries()) {
      if (result.startTime < cutoffDate) {
        this.rollbackResults.delete(id);
        deletedCount++;
      }
    }

    this.logger.info(`Cleaned up ${deletedCount} old results`, {
      retentionDays,
      cutoffDate,
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    configs: number;
    pipelineResults: number;
    buildResults: number;
    deploymentResults: number;
    rollbackResults: number;
  }> {
    return {
      configs: this.configs.size,
      pipelineResults: this.pipelineResults.size,
      buildResults: this.buildResults.size,
      deploymentResults: this.deploymentResults.size,
      rollbackResults: this.rollbackResults.size,
    };
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<{
    configs: PipelineConfig[];
    pipelineResults: PipelineResult[];
    buildResults: BuildResult[];
    deploymentResults: DeploymentResult[];
    rollbackResults: RollbackResult[];
    exportedAt: Date;
  }> {
    return {
      configs: Array.from(this.configs.values()),
      pipelineResults: Array.from(this.pipelineResults.values()),
      buildResults: Array.from(this.buildResults.values()),
      deploymentResults: Array.from(this.deploymentResults.values()),
      rollbackResults: Array.from(this.rollbackResults.values()),
      exportedAt: new Date(),
    };
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    configs?: PipelineConfig[];
    pipelineResults?: PipelineResult[];
    buildResults?: BuildResult[];
    deploymentResults?: DeploymentResult[];
    rollbackResults?: RollbackResult[];
  }): Promise<void> {
    if (data.configs) {
      data.configs.forEach((config) => {
        this.configs.set(config.id, config);
      });
    }

    if (data.pipelineResults) {
      data.pipelineResults.forEach((result) => {
        this.pipelineResults.set(result.id, result);
      });
    }

    if (data.buildResults) {
      data.buildResults.forEach((result) => {
        this.buildResults.set(result.id, result);
      });
    }

    if (data.deploymentResults) {
      data.deploymentResults.forEach((result) => {
        this.deploymentResults.set(result.id, result);
      });
    }

    if (data.rollbackResults) {
      data.rollbackResults.forEach((result) => {
        this.rollbackResults.set(result.id, result);
      });
    }

    this.logger.info('Data import completed', {
      configs: data.configs?.length || 0,
      pipelineResults: data.pipelineResults?.length || 0,
      buildResults: data.buildResults?.length || 0,
      deploymentResults: data.deploymentResults?.length || 0,
      rollbackResults: data.rollbackResults?.length || 0,
    });
  }
}
