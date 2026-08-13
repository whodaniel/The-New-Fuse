import { 
  BuildTrigger, 
  BuildResult, 
  PipelineDefinition, 
  PipelineResult, 
  DeploymentConfig, 
  DeploymentResult, 
  RollbackResult, 
  PipelineStatus,
  PipelineConfig
} from '../types/pipeline.js';

/**
 * Core CI/CD Pipeline interface for managing automated build, test, and deployment processes
 */
export interface ICICDPipeline {
  /**
   * Trigger a build based on the provided trigger configuration
   * @param trigger Build trigger configuration
   * @returns Promise resolving to build result
   */
  triggerBuild(trigger: BuildTrigger): Promise<BuildResult>;

  /**
   * Execute a complete pipeline based on the pipeline definition
   * @param pipeline Pipeline definition with stages and configuration
   * @returns Promise resolving to pipeline execution result
   */
  executePipeline(pipeline: PipelineDefinition): Promise<PipelineResult>;

  /**
   * Deploy to a specific environment using the deployment configuration
   * @param deployment Deployment configuration
   * @returns Promise resolving to deployment result
   */
  deployToEnvironment(deployment: DeploymentConfig): Promise<DeploymentResult>;

  /**
   * Rollback a deployment to the previous stable version
   * @param deploymentId Unique identifier of the deployment to rollback
   * @returns Promise resolving to rollback result
   */
  rollbackDeployment(deploymentId: string): Promise<RollbackResult>;

  /**
   * Monitor the status of a running pipeline
   * @param pipelineId Unique identifier of the pipeline to monitor
   * @returns Promise resolving to current pipeline status
   */
  monitorPipeline(pipelineId: string): Promise<PipelineStatus>;

  /**
   * Manage pipeline configuration including creation, updates, and validation
   * @param config Pipeline configuration to manage
   * @returns Promise resolving when configuration is applied
   */
  managePipelineConfiguration(config: PipelineConfig): Promise<void>;

  /**
   * Get pipeline execution history and metrics
   * @param pipelineId Optional pipeline ID to filter results
   * @param limit Maximum number of results to return
   * @returns Promise resolving to pipeline execution history
   */
  getPipelineHistory(pipelineId?: string, limit?: number): Promise<PipelineResult[]>;

  /**
   * Cancel a running pipeline execution
   * @param pipelineId Unique identifier of the pipeline to cancel
   * @returns Promise resolving to cancellation result
   */
  cancelPipeline(pipelineId: string): Promise<boolean>;

  /**
   * Validate pipeline configuration before execution
   * @param pipeline Pipeline definition to validate
   * @returns Promise resolving to validation result
   */
  validatePipeline(pipeline: PipelineDefinition): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Get pipeline metrics and performance data
   * @param timeRange Time range for metrics (e.g., '24h', '7d', '30d')
   * @returns Promise resolving to pipeline metrics
   */
  getPipelineMetrics(timeRange: string): Promise<Record<string, any>>;
}