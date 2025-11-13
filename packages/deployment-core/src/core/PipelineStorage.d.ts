import { PipelineConfig, PipelineResult, BuildResult, DeploymentResult, RollbackResult } from '../types/pipeline';
import { Logger } from 'winston';
/**
 * Pipeline Storage handles persistence of pipeline configurations, results, and metrics
 */
export declare class PipelineStorage {
    private logger;
    private configs;
    private pipelineResults;
    private buildResults;
    private deploymentResults;
    private rollbackResults;
    constructor(logger: Logger);
    /**
     * Store pipeline configuration
     */
    storePipelineConfig(config: PipelineConfig): Promise<void>;
    /**
     * Get pipeline result by ID
     */
    getPipelineResult(resultId: string): Promise<PipelineResult | null>;
    /**
     * Get pipeline execution history
     */
    getPipelineHistory(pipelineId?: string, limit?: number): Promise<PipelineResult[]>;
    /**
     * Store build result
     */
    storeBuildResult(result: BuildResult): Promise<void>;
    /**
     * Get build result by ID
     */
    getBuildResult(resultId: string): Promise<BuildResult | null>;
    /**
     * Store deployment result
     */
    storeDeploymentResult(result: DeploymentResult): Promise<void>;
    /**
     * Get deployment result by ID
     */
    getDeploymentResult(resultId: string): Promise<DeploymentResult | null>;
    /**
     * Store rollback result
     */
    storeRollbackResult(result: RollbackResult): Promise<void>;
    /**
     * Get rollback result by ID
     */
    getRollbackResult(resultId: string): Promise<RollbackResult | null>;
    /**
     * Delete old pipeline results based on retention policy
     */
    cleanupOldResults(retentionDays?: number): Promise<void>;
}
//# sourceMappingURL=PipelineStorage.d.ts.map