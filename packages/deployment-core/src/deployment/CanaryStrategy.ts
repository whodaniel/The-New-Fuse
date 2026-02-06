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
 * Canary Deployment Strategy
 * Gradually shifts traffic to new version while monitoring metrics
 */
export class CanaryStrategy extends BaseDeploymentStrategy {
  constructor(logger: Logger) {
    super(logger);
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = `canary-${Date.now()}`;
    const startTime = new Date();

    this.logger.info(`Starting canary deployment: ${deploymentId}`, {
      environment: config.environment,
      services: config.services.length,
    });

    try {
      // Initialize progress tracking
      const progress = this.createInitialProgress(deploymentId, 'canary' as any, config.services);

      const canaryConfig = config.strategy.canaryConfig;
      if (!canaryConfig) {
        throw new Error('Canary configuration is required for canary deployment');
      }

      // Phase 1: Preparation
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.PREPARING,
        currentStep: 'Preparing canary deployment',
        progress: 5,
      });

      await this.prepareCanaryDeployment(config, deploymentId);

      // Phase 2: Deploy canary version
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.DEPLOYING,
        currentStep: 'Deploying canary version',
        progress: 15,
      });

      const serviceResults: ServiceDeploymentResult[] = [];

      for (const service of config.services) {
        const serviceResult = await this.deployCanaryService(service, config, deploymentId);
        serviceResults.push(serviceResult);

        if (serviceResult.status === PipelineStatus.FAILED) {
          throw new Error(`Canary service deployment failed: ${service.name}`);
        }
      }

      // Phase 3: Progressive traffic shifting
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.PROMOTING,
        currentStep: 'Starting progressive traffic shift',
        progress: 25,
      });

      await this.executeProgressiveRollout(config, canaryConfig, deploymentId);

      // Phase 4: Final validation and completion
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.VALIDATING,
        currentStep: 'Final validation',
        progress: 90,
      });

      const healthChecks = await this.getHealthChecks(config);
      const healthResults = await this.executeHealthChecks(healthChecks, deploymentId);

      const unhealthyChecks = healthResults.filter((h) => h.status !== 'healthy');
      if (unhealthyChecks.length > 0) {
        throw new Error(
          `Final health checks failed: ${unhealthyChecks.map((h) => h.name).join(', ')}`
        );
      }

      // Phase 5: Cleanup
      await this.cleanupCanaryDeployment(config, deploymentId);

      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.COMPLETED,
        currentStep: 'Canary deployment completed',
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
        `Canary deployment completed successfully in ${duration}ms`
      );
      this.emit('deployment:complete', { deploymentId, result });

      return result;
    } catch (error) {
      this.logger.error(`Canary deployment failed: ${deploymentId}`, {
        error: error.message,
        stack: error.stack,
      });

      // Update progress to failed state
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.FAILED,
        currentStep: `Deployment failed: ${error.message}`,
        progress: 0,
      });

      // Attempt automatic rollback
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

    // Validate canary specific configuration
    if (config.strategy.type !== 'canary') {
      errors.push('Strategy type must be canary');
    }

    const canaryConfig = config.strategy.canaryConfig;
    if (!canaryConfig) {
      errors.push('Canary configuration is required');
      return { valid: false, errors };
    }

    // Validate traffic steps
    if (!canaryConfig.steps || canaryConfig.steps.length === 0) {
      errors.push('Canary steps are required');
    } else {
      let totalWeight = 0;
      canaryConfig.steps.forEach((step, index) => {
        if (step.weight < 0 || step.weight > 100) {
          errors.push(`Step ${index + 1}: Weight must be between 0 and 100`);
        }
        if (!step.duration) {
          errors.push(`Step ${index + 1}: Duration is required`);
        }
        totalWeight = Math.max(totalWeight, step.weight);
      });

      if (totalWeight !== 100) {
        errors.push('Final canary step must have 100% weight');
      }
    }

    // Validate analysis configuration
    if (canaryConfig.analysis && canaryConfig.analysis.length > 0) {
      canaryConfig.analysis.forEach((analysis, index) => {
        if (!analysis.name || !analysis.provider || !analysis.query) {
          errors.push(`Analysis ${index + 1}: name, provider, and query are required`);
        }
        if (analysis.threshold === undefined || analysis.threshold === null) {
          errors.push(`Analysis ${index + 1}: threshold is required`);
        }
      });
    }

    // Validate services have proper configuration for canary
    config.services.forEach((service) => {
      if (!service.replicas || service.replicas < 2) {
        errors.push(`Service ${service.name}: Must have at least 2 replicas for canary deployment`);
      }

      if (!service.healthCheck) {
        errors.push(`Service ${service.name}: Health check is required for canary deployment`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async rollback(deploymentId: string, reason: string): Promise<RollbackResult> {
    const startTime = Date.now();

    this.logger.info(`Starting canary rollback: ${deploymentId}`, { reason });

    try {
      // Update progress to rolling back
      this.updateProgress(deploymentId, {
        phase: DeploymentPhase.ROLLING_BACK,
        currentStep: 'Rolling back canary deployment',
        progress: 0,
      });

      // Get deployment progress
      const progress = this.deployments.get(deploymentId);
      if (!progress) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }

      // Immediately shift all traffic back to stable version
      await this.shiftTrafficToStable(deploymentId);

      // Remove canary instances
      await this.removeCanaryInstances(
        progress.services.map((s) => s.name),
        deploymentId
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.logDeploymentStep(deploymentId, `Canary rollback completed in ${duration}ms`);

      return {
        success: true,
        previousVersion: 'canary',
        currentVersion: 'stable',
        duration,
        logs: progress.logs,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.logger.error(`Canary rollback failed: ${deploymentId}`, {
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

  private async prepareCanaryDeployment(
    config: DeploymentConfig,
    deploymentId: string
  ): Promise<void> {
    this.logDeploymentStep(deploymentId, 'Preparing canary deployment');

    // Validate current stable deployment exists
    await this.validateStableDeployment(config);

    // Set up traffic splitting infrastructure
    await this.setupTrafficSplitting(config);

    // Initialize monitoring and analysis
    await this.setupCanaryMonitoring(config, deploymentId);

    this.logDeploymentStep(deploymentId, 'Canary deployment preparation completed');
  }

  private async deployCanaryService(
    service: any,
    config: DeploymentConfig,
    deploymentId: string
  ): Promise<ServiceDeploymentResult> {
    const serviceName = service.name;

    try {
      this.logDeploymentStep(deploymentId, `Deploying canary version of ${serviceName}`);

      // Calculate canary replica count (typically small percentage)
      const canaryReplicas = Math.max(1, Math.ceil(service.replicas * 0.1)); // 10% of stable replicas

      // Update service progress
      const progress = this.deployments.get(deploymentId);
      const serviceProgress = progress?.services.find((s) => s.name === serviceName);
      if (serviceProgress) {
        serviceProgress.status = ServiceDeploymentStatus.DEPLOYING;
      }

      // Deploy canary instances
      await this.createCanaryInstances(service, canaryReplicas);

      // Wait for canary instances to be ready
      const isReady = await this.waitForServiceReady(
        `${serviceName}-canary`,
        canaryReplicas,
        180000
      );
      if (!isReady) {
        throw new Error(`Canary deployment timed out for ${serviceName}`);
      }

      // Initial health check
      const healthCheck = await this.executeHealthCheck(
        {
          name: `${serviceName}-canary-health`,
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
        throw new Error(`Canary health check failed for ${serviceName}: ${healthCheck.message}`);
      }

      // Update service progress
      if (serviceProgress) {
        serviceProgress.status = ServiceDeploymentStatus.READY;
        serviceProgress.progress = 50; // Canary deployed, but not fully promoted
        serviceProgress.replicas.ready = canaryReplicas;
        serviceProgress.version.current = service.tag;
        serviceProgress.lastUpdated = new Date();
      }

      return {
        name: serviceName,
        status: PipelineStatus.SUCCESS,
        replicas: {
          desired: service.replicas,
          ready: canaryReplicas,
          available: canaryReplicas,
        },
        image: service.image,
        version: service.tag,
        endpoints: [`http://${serviceName}-canary.${config.environment}.svc.cluster.local`],
      };
    } catch (error) {
      this.logger.error(`Canary service deployment failed: ${serviceName}`, {
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

  private async executeProgressiveRollout(
    config: DeploymentConfig,
    canaryConfig: any,
    deploymentId: string
  ): Promise<void> {
    const steps = canaryConfig.steps;
    const analysis = canaryConfig.analysis || [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepNumber = i + 1;

      this.logDeploymentStep(
        deploymentId,
        `Canary step ${stepNumber}/${steps.length}: ${step.weight}% traffic for ${step.duration}`
      );

      // Update progress
      const stepProgress = 25 + (i / steps.length) * 60; // 25-85% for progressive rollout
      this.updateProgress(deploymentId, {
        currentStep: `Canary step ${stepNumber}: ${step.weight}% traffic`,
        progress: stepProgress,
      });

      // Shift traffic to canary
      await this.shiftTrafficToCanary(step.weight, deploymentId);

      // Wait for the step duration
      const durationMs = this.parseDuration(step.duration);
      if (durationMs > 0) {
        this.logDeploymentStep(deploymentId, `Waiting ${step.duration} for metrics collection`);
        await new Promise((resolve) => setTimeout(resolve, durationMs));
      }

      // Run analysis if configured
      if (analysis.length > 0) {
        this.logDeploymentStep(deploymentId, `Running canary analysis for step ${stepNumber}`);

        const analysisResults = await this.runCanaryAnalysis(analysis, step.weight, deploymentId);
        const failedAnalysis = analysisResults.filter((result) => !result.passed);

        if (failedAnalysis.length > 0) {
          const failedNames = failedAnalysis.map((a) => a.name).join(', ');
          throw new Error(`Canary analysis failed at ${step.weight}% traffic: ${failedNames}`);
        }
      }

      // Check for manual pause
      if (step.pause) {
        this.logDeploymentStep(
          deploymentId,
          `Manual pause at step ${stepNumber} - waiting for approval`
        );
        await this.waitForManualApproval(deploymentId, stepNumber);
      }

      this.logDeploymentStep(deploymentId, `Canary step ${stepNumber} completed successfully`);
    }

    // Final promotion - replace stable with canary
    this.logDeploymentStep(deploymentId, 'Promoting canary to stable');
    await this.promoteCanaryToStable(config, deploymentId);
  }

  private async cleanupCanaryDeployment(
    config: DeploymentConfig,
    deploymentId: string
  ): Promise<void> {
    this.logDeploymentStep(deploymentId, 'Cleaning up canary deployment');

    // Remove canary-specific resources
    for (const service of config.services) {
      await this.removeCanaryResources(service.name);
    }

    // Clean up traffic splitting configuration
    await this.cleanupTrafficSplitting(config);

    this.logDeploymentStep(deploymentId, 'Canary cleanup completed');
  }

  // Utility methods

  private parseDuration(duration: string): number {
    if (duration === '0m' || duration === '0s') return 0;

    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  // Placeholder methods for integration with actual infrastructure
  private async validateStableDeployment(_config: DeploymentConfig): Promise<void> {
    this.logger.debug('Validating stable deployment exists');
  }

  private async setupTrafficSplitting(_config: DeploymentConfig): Promise<void> {
    this.logger.debug('Setting up traffic splitting infrastructure');
  }

  private async setupCanaryMonitoring(
    _config: DeploymentConfig,
    _deploymentId: string
  ): Promise<void> {
    this.logger.debug('Setting up canary monitoring and analysis');
  }

  private async createCanaryInstances(service: any, replicas: number): Promise<void> {
    this.logger.debug(`Creating ${replicas} canary instances for ${service.name}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  private async shiftTrafficToCanary(weight: number, _deploymentId: string): Promise<void> {
    this.logger.debug(`Shifting ${weight}% traffic to canary`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async runCanaryAnalysis(
    analysis: any[],
    weight: number,
    _deploymentId: string
  ): Promise<any[]> {
    this.logger.debug(`Running canary analysis at ${weight}% traffic`);

    // Simulate analysis results
    return analysis.map((a) => ({
      name: a.name,
      passed: Math.random() > 0.1, // 90% success rate
      value: Math.random() * 100,
      threshold: a.threshold,
    }));
  }

  private async waitForManualApproval(_deploymentId: string, stepNumber: number): Promise<void> {
    this.logger.debug(`Waiting for manual approval for step ${stepNumber}`);
    // This would integrate with approval system
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  private async promoteCanaryToStable(
    config: DeploymentConfig,
    _deploymentId: string
  ): Promise<void> {
    this.logger.debug('Promoting canary to stable');

    // Scale up canary to full replicas
    for (const service of config.services) {
      await this.scaleCanaryToFull(service.name, service.replicas);
    }

    // Remove old stable instances
    for (const service of config.services) {
      await this.removeStableInstances(service.name);
    }

    // Update service labels/selectors
    for (const service of config.services) {
      await this.promoteCanaryLabels(service.name);
    }
  }

  private async shiftTrafficToStable(_deploymentId: string): Promise<void> {
    this.logger.debug('Shifting all traffic back to stable');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async removeCanaryInstances(
    serviceNames: string[],
    _deploymentId: string
  ): Promise<void> {
    this.logger.debug(`Removing canary instances for services: ${serviceNames.join(', ')}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  private async removeCanaryResources(serviceName: string): Promise<void> {
    this.logger.debug(`Removing canary resources for ${serviceName}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async cleanupTrafficSplitting(_config: DeploymentConfig): Promise<void> {
    this.logger.debug('Cleaning up traffic splitting configuration');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async scaleCanaryToFull(serviceName: string, replicas: number): Promise<void> {
    this.logger.debug(`Scaling canary ${serviceName} to ${replicas} replicas`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async removeStableInstances(serviceName: string): Promise<void> {
    this.logger.debug(`Removing stable instances for ${serviceName}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async promoteCanaryLabels(serviceName: string): Promise<void> {
    this.logger.debug(`Promoting canary labels for ${serviceName}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
