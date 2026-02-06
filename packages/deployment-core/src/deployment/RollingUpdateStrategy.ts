import { Logger } from 'winston';
import {
  DeploymentConfig,
  DeploymentResult,
  PipelineStatus,
  ServiceDeploymentResult,
} from '../types/pipeline';
import {
  BaseDeploymentStrategy,
  DeploymentPhase,
  RollbackResult,
  ServiceDeploymentStatus,
} from './DeploymentStrategy';

/**
 * Rolling Update Deployment Strategy
 * Gradually replaces old instances with new ones to ensure zero downtime
 */
export class RollingUpdateStrategy extends BaseDeploymentStrategy {
  constructor(logger: Logger) {
    super(logger);
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = `rolling-${Date.now()}`;
    const startTime = new Date();

    this.logger.info(`Starting rolling update deployment: ${deploymentId}`, {
      environment: config.environment,
      services: config.services.length,
    });

    try {
      // Initialize progress tracking
      const progress = this.createInitialProgress(
        deploymentId,
        'rolling_update' as any,
        config.services
      );

      // Phase 1: Preparation
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.PREPARING,
        currentStep: 'Preparing rolling update deployment',
        progress: 10,
      });

      await this.prepareDeployment(config, deploymentId);

      // Phase 2: Rolling deployment of services
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.DEPLOYING,
        currentStep: 'Deploying services with rolling update',
        progress: 20,
      });

      const serviceResults: ServiceDeploymentResult[] = [];

      for (let i = 0; i < config.services.length; i++) {
        const service = config.services[i];

        this.logDeploymentStep(
          deploymentId,
          `Starting rolling update for service: ${service.name}`
        );

        const serviceResult = await this.deployServiceRolling(service, config, deploymentId);
        serviceResults.push(serviceResult);

        // Update progress
        const serviceProgress = ((i + 1) / config.services.length) * 60; // 60% for all services
        this.updateProgress(deploymentId, {
          progress: 20 + serviceProgress,
          currentStep: `Deployed ${i + 1}/${config.services.length} services`,
          completedSteps: progress.completedSteps + 1,
        });

        if (serviceResult.status === PipelineStatus.FAILED) {
          throw new Error(`Service deployment failed: ${service.name}`);
        }
      }

      // Phase 3: Health validation
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.VALIDATING,
        currentStep: 'Validating deployment health',
        progress: 85,
      });

      const healthChecks = await this.getHealthChecks(config);
      const healthResults = await this.executeHealthChecks(healthChecks, deploymentId);

      const unhealthyChecks = healthResults.filter((h) => h.status !== 'healthy');
      if (unhealthyChecks.length > 0) {
        throw new Error(`Health checks failed: ${unhealthyChecks.map((h) => h.name).join(', ')}`);
      }

      // Phase 4: Completion
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.COMPLETED,
        currentStep: 'Rolling update deployment completed',
        progress: 100,
        completedSteps: progress.totalSteps,
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: DeploymentResult = {
        id: deploymentId,
        deploymentId: config.id,
        status: PipelineStatus.SUCCESS,
        startTime,
        endTime,
        duration,
        environment: config.environment,
        services: serviceResults,
        healthChecks: healthResults,
        logs: progress.logs,
      };

      this.logDeploymentStep(
        deploymentId,
        `Rolling update deployment completed successfully in ${duration}ms`
      );
      this.emit('deployment:complete', { deploymentId, result });

      return result;
    } catch (error) {
      this.logger.error(`Rolling update deployment failed: ${deploymentId}`, {
        error: error.message,
        stack: error.stack,
      });

      // Update progress to failed state
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.FAILED,
        currentStep: `Deployment failed: ${error.message}`,
        progress: 0,
      });

      // Attempt rollback if configured
      if (config.rollbackPolicy.enabled && config.rollbackPolicy.automatic) {
        this.logDeploymentStep(deploymentId, 'Attempting automatic rollback', 'warn');

        try {
          await this.rollback(deploymentId, error.message);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed: ${deploymentId}`, {
            error: rollbackError.message,
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const failedResult: DeploymentResult = {
        id: deploymentId,
        deploymentId: config.id,
        status: PipelineStatus.FAILED,
        startTime,
        endTime,
        duration,
        environment: config.environment,
        services: [],
        healthChecks: [],
        logs: this.deployments.get(deploymentId)?.logs || [error.message],
        error: error.message,
      };

      this.emit('deployment:failed', { deploymentId, result: failedResult, error });
      return failedResult;
    }
  }

  async validate(config: DeploymentConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate rolling update specific configuration
    if (config.strategy.type !== 'rolling_update') {
      errors.push('Strategy type must be rolling_update');
    }

    // Validate services have proper configuration for rolling updates
    config.services.forEach((service) => {
      if (!service.replicas || service.replicas < 1) {
        errors.push(`Service ${service.name}: Must have at least 1 replica for rolling update`);
      }

      if (!service.healthCheck) {
        errors.push(`Service ${service.name}: Health check is required for rolling update`);
      }

      if (!service.resources) {
        errors.push(`Service ${service.name}: Resource requirements must be specified`);
      }
    });

    // Validate rolling update parameters
    const params = config.strategy.parameters;
    if (params.maxUnavailable && params.maxSurge) {
      const maxUnavailable = this.parsePercentage(params.maxUnavailable);
      const maxSurge = this.parsePercentage(params.maxSurge);

      if (maxUnavailable === 0 && maxSurge === 0) {
        errors.push('Cannot have both maxUnavailable and maxSurge set to 0');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async rollback(deploymentId: string, reason: string): Promise<RollbackResult> {
    const startTime = Date.now();

    this.logger.info(`Starting rollback for deployment: ${deploymentId}`, { reason });

    try {
      // Update progress to rolling back
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.ROLLING_BACK,
        currentStep: 'Rolling back deployment',
        progress: 0,
      });

      // Get deployment progress to find services
      const progress = this.deployments.get(deploymentId);
      if (!progress) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Rollback each service
      for (const serviceProgress of progress.services) {
        this.logDeploymentStep(deploymentId, `Rolling back service: ${serviceProgress.name}`);

        await this.rollbackService(serviceProgress.name, serviceProgress.version.current);

        // Update service status
        serviceProgress.status = ServiceDeploymentStatus.ROLLING_BACK;
        serviceProgress.version.target = serviceProgress.version.current;
      }

      // Wait for rollback to complete
      await this.waitForRollbackComplete(progress.services.map((s) => s.name));

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.logDeploymentStep(deploymentId, `Rollback completed in ${duration}ms`);

      return {
        success: true,
        previousVersion: 'rolled-back',
        currentVersion: 'previous',
        duration,
        logs: progress.logs,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.logger.error(`Rollback failed: ${deploymentId}`, {
        error: error.message,
      });

      return {
        success: false,
        previousVersion: 'unknown',
        currentVersion: 'unknown',
        duration,
        logs: [`Rollback failed: ${error.message}`],
        error: error.message,
      };
    }
  }

  // Private helper methods

  private async prepareDeployment(config: DeploymentConfig, deploymentId: string): Promise<void> {
    this.logDeploymentStep(deploymentId, 'Preparing deployment environment');

    // Validate cluster resources
    await this.validateClusterResources(config);

    // Prepare deployment manifests
    await this.prepareDeploymentManifests(config);

    // Set up monitoring and logging
    await this.setupMonitoring(config, deploymentId);

    this.logDeploymentStep(deploymentId, 'Deployment preparation completed');
  }

  private async deployServiceRolling(
    service: any,
    config: DeploymentConfig,
    deploymentId: string
  ): Promise<ServiceDeploymentResult> {
    const serviceName = service.name;

    try {
      // Get rolling update parameters
      const maxUnavailable = this.parsePercentage(
        config.strategy.parameters?.maxUnavailable || '25%'
      );
      const maxSurge = this.parsePercentage(config.strategy.parameters?.maxSurge || '25%');

      // Calculate rolling update batches
      const totalReplicas = service.replicas;
      const maxUnavailableCount = Math.floor((totalReplicas * maxUnavailable) / 100);
      const maxSurgeCount = Math.floor((totalReplicas * maxSurge) / 100);
      const batchSize = Math.max(1, Math.min(maxUnavailableCount, maxSurgeCount));

      this.logDeploymentStep(
        deploymentId,
        `Rolling update ${serviceName}: ${totalReplicas} replicas, batch size: ${batchSize}`
      );

      // Update service progress
      const progress = this.deployments.get(deploymentId);
      const serviceProgress = progress?.services.find((s) => s.name === serviceName);
      if (serviceProgress) {
        serviceProgress.status = ServiceDeploymentStatus.DEPLOYING;
      }

      // Perform rolling update in batches
      let updatedReplicas = 0;
      while (updatedReplicas < totalReplicas) {
        const currentBatchSize = Math.min(batchSize, totalReplicas - updatedReplicas);

        this.logDeploymentStep(
          deploymentId,
          `Updating batch of ${currentBatchSize} replicas for ${serviceName}`
        );

        // Deploy new replicas
        await this.deployReplicaBatch(serviceName, service, currentBatchSize);

        // Wait for new replicas to be ready
        const isReady = await this.waitForServiceReady(
          serviceName,
          updatedReplicas + currentBatchSize,
          60000 // 1 minute timeout per batch
        );

        if (!isReady) {
          throw new Error(`Batch deployment timed out for ${serviceName}`);
        }

        // Remove old replicas
        await this.removeOldReplicas(serviceName, currentBatchSize);

        updatedReplicas += currentBatchSize;

        // Update progress
        if (serviceProgress) {
          serviceProgress.progress = (updatedReplicas / totalReplicas) * 100;
          serviceProgress.replicas.ready = updatedReplicas;
          serviceProgress.replicas.unavailable = totalReplicas - updatedReplicas;
          serviceProgress.lastUpdated = new Date();
        }

        this.logDeploymentStep(
          deploymentId,
          `Updated ${updatedReplicas}/${totalReplicas} replicas for ${serviceName}`
        );
      }

      // Final health check
      const healthCheck = await this.executeHealthCheck(
        {
          name: `${serviceName}-final-check`,
          type: 'http',
          port: service.ports?.[0]?.port || 8080,
          path: '/health',
          timeout: 30000,
          interval: 5000,
          retries: 3,
        },
        deploymentId
      );

      if (healthCheck.status !== 'healthy') {
        throw new Error(`Final health check failed for ${serviceName}: ${healthCheck.message}`);
      }

      // Update service progress to ready
      if (serviceProgress) {
        serviceProgress.status = ServiceDeploymentStatus.READY;
        serviceProgress.progress = 100;
        serviceProgress.replicas.ready = totalReplicas;
        serviceProgress.replicas.available = totalReplicas;
        serviceProgress.replicas.unavailable = 0;
        serviceProgress.version.current = service.tag;
      }

      return {
        name: serviceName,
        status: PipelineStatus.SUCCESS,
        replicas: {
          desired: totalReplicas,
          ready: totalReplicas,
          available: totalReplicas,
        },
        image: service.image,
        version: service.tag,
        endpoints: [`http://${serviceName}.${config.environment}.svc.cluster.local`],
      };
    } catch (error) {
      this.logger.error(`Rolling update failed for service: ${serviceName}`, {
        error: error.message,
      });

      // Update service progress to failed
      const progress = this.deployments.get(deploymentId);
      const serviceProgress = progress?.services.find((s) => s.name === serviceName);
      if (serviceProgress) {
        serviceProgress.status = ServiceDeploymentStatus.FAILED;
      }

      return {
        name: serviceName,
        status: PipelineStatus.FAILED,
        replicas: {
          desired: service.replicas,
          ready: 0,
          available: 0,
        },
        image: service.image,
        version: service.tag,
        endpoints: [],
      };
    }
  }

  private parsePercentage(value: string): number {
    if (value.endsWith('%')) {
      return parseInt(value.slice(0, -1));
    }
    return parseInt(value);
  }

  private async validateClusterResources(config: DeploymentConfig): Promise<void> {
    // Validate that cluster has enough resources for the deployment
    // This would integrate with the actual orchestration platform
    this.logger.debug('Validating cluster resources', {
      environment: config.environment,
      services: config.services.length,
    });
  }

  private async prepareDeploymentManifests(config: DeploymentConfig): Promise<void> {
    // Prepare deployment manifests for the orchestration platform
    this.logger.debug('Preparing deployment manifests', {
      environment: config.environment,
    });
  }

  private async setupMonitoring(config: DeploymentConfig, deploymentId: string): Promise<void> {
    // Set up monitoring and alerting for the deployment
    this.logger.debug('Setting up deployment monitoring', {
      deploymentId,
      environment: config.environment,
    });
  }

  private async deployReplicaBatch(
    serviceName: string,
    service: any,
    batchSize: number
  ): Promise<void> {
    // Deploy a batch of replicas
    // This would integrate with the actual orchestration platform
    this.logger.debug(`Deploying batch of ${batchSize} replicas for ${serviceName}`);

    // Simulate deployment time
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async removeOldReplicas(serviceName: string, count: number): Promise<void> {
    // Remove old replicas after new ones are ready
    // This would integrate with the actual orchestration platform
    this.logger.debug(`Removing ${count} old replicas for ${serviceName}`);

    // Simulate cleanup time
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async rollbackService(serviceName: string, previousVersion: string): Promise<void> {
    // Rollback service to previous version
    // This would integrate with the actual orchestration platform
    this.logger.debug(`Rolling back ${serviceName} to version ${previousVersion}`);

    // Simulate rollback time
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  private async waitForRollbackComplete(serviceNames: string[]): Promise<void> {
    // Wait for all services to complete rollback
    this.logger.debug(`Waiting for rollback to complete for services: ${serviceNames.join(', ')}`);

    // Simulate rollback completion time
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
