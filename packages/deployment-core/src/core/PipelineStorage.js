"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStorage = void 0;
/**
 * Pipeline Storage handles persistence of pipeline configurations, results, and metrics
 */
class PipelineStorage {
    logger;
    configs = new Map();
    pipelineResults = new Map();
    buildResults = new Map();
    deploymentResults = new Map();
    rollbackResults = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Store pipeline configuration
     */
    async storePipelineConfig(config) {
        this.logger.info(`Storing pipeline configuration: ${config.name}, {
      configId: config.id,
      version: config.version
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
  async storePipelineResult(result: PipelineResult): Promise<void> {`, this.logger.info(`Storing pipeline result: ${result.id}`, {
            pipelineId: result.pipelineId,
            status: result.status,
            duration: result.duration
        }));
        this.pipelineResults.set(result.id, result);
    }
    /**
     * Get pipeline result by ID
     */
    async getPipelineResult(resultId) {
        return this.pipelineResults.get(resultId) || null;
    }
    /**
     * Get pipeline execution history
     */
    async getPipelineHistory(pipelineId, limit = 50) {
        let results = Array.from(this.pipelineResults.values());
        if (pipelineId) {
            results = results.filter(r => r.pipelineId === pipelineId);
        }
        // Sort by start time (most recent first)
        results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        return results.slice(0, limit);
    }
    /**
     * Store build result
     */
    async storeBuildResult(result) {
        this.logger.info(Storing, build, result, $, { result, : .id }, {
            triggerId: result.triggerId,
            status: result.status,
            duration: result.duration
        });
        this.buildResults.set(result.id, result);
    }
    /**
     * Get build result by ID
     */
    async getBuildResult(resultId) {
        return this.buildResults.get(resultId) || null;
    }
    /**
     * Store deployment result
     */
    async storeDeploymentResult(result) {
        `
    this.logger.info(Storing deployment result: ${result.id}`, {
            deploymentId: result.deploymentId,
            environment: result.environment,
            status: result.status,
            duration: result.duration
        };
        ;
        this.deploymentResults.set(result.id, result);
    }
    /**
     * Get deployment result by ID
     */
    async getDeploymentResult(resultId) {
        return this.deploymentResults.get(resultId) || null;
    }
    /**
     * Store rollback result
     */
    async storeRollbackResult(result) {
        this.logger.info(Storing, rollback, result, $, { result, : .id }, {
            deploymentId: result.deploymentId,
            status: result.status,
            duration: result.duration
        });
        this.rollbackResults.set(result.id, result);
    }
    /**
     * Get rollback result by ID
     */
    async getRollbackResult(resultId) {
        return this.rollbackResults.get(resultId) || null;
    }
    /**
     * Delete old pipeline results based on retention policy
     */
    async cleanupOldResults(retentionDays = 30) {
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
            `
    }`;
            this.logger.info(Cleaned, up, $, { deletedCount } ` old results`, {
                retentionDays,
                cutoffDate
            });
        }
        /**
         * Get storage statistics
         */
        async;
        getStorageStats();
        Promise < {
            configs: number,
            pipelineResults: number,
            buildResults: number,
            deploymentResults: number,
            rollbackResults: number
        } > {
            return: {
                configs: this.configs.size,
                pipelineResults: this.pipelineResults.size,
                buildResults: this.buildResults.size,
                deploymentResults: this.deploymentResults.size,
                rollbackResults: this.rollbackResults.size
            }
        };
        /**
         * Export all data for backup
         */
        async;
        exportData();
        Promise < {
            configs: pipeline_1.PipelineConfig[],
            pipelineResults: pipeline_1.PipelineResult[],
            buildResults: pipeline_1.BuildResult[],
            deploymentResults: pipeline_1.DeploymentResult[],
            rollbackResults: pipeline_1.RollbackResult[],
            exportedAt: Date
        } > {
            return: {
                configs: Array.from(this.configs.values()),
                pipelineResults: Array.from(this.pipelineResults.values()),
                buildResults: Array.from(this.buildResults.values()),
                deploymentResults: Array.from(this.deploymentResults.values()),
                rollbackResults: Array.from(this.rollbackResults.values()),
                exportedAt: new Date()
            }
        };
        /**
         * Import data from backup
         */
        async;
        importData(data, {
            configs: pipeline_1.PipelineConfig[],
            pipelineResults: pipeline_1.PipelineResult[],
            buildResults: pipeline_1.BuildResult[],
            deploymentResults: pipeline_1.DeploymentResult[],
            rollbackResults: pipeline_1.RollbackResult[]
        });
        Promise < void  > {
            if(data) { }, : .configs
        };
        {
            data.configs.forEach(config => {
                this.configs.set(config.id, config);
            });
        }
        if (data.pipelineResults) {
            data.pipelineResults.forEach(result => {
                this.pipelineResults.set(result.id, result);
            });
        }
        if (data.buildResults) {
            data.buildResults.forEach(result => {
                this.buildResults.set(result.id, result);
            });
        }
        if (data.deploymentResults) {
            data.deploymentResults.forEach(result => {
                this.deploymentResults.set(result.id, result);
            });
        }
        if (data.rollbackResults) {
            data.rollbackResults.forEach(result => {
                this.rollbackResults.set(result.id, result);
            });
        }
        this.logger.info('Data import completed', {
            configs: data.configs?.length || 0,
            pipelineResults: data.pipelineResults?.length || 0,
            buildResults: data.buildResults?.length || 0,
            deploymentResults: data.deploymentResults?.length || 0,
            rollbackResults: data.rollbackResults?.length || 0
        });
    }
}
exports.PipelineStorage = PipelineStorage;
//# sourceMappingURL=PipelineStorage.js.map