import { Logger } from 'winston';
import { EventEmitter } from 'events';
import {
  DeploymentConfig,
  DeploymentResult,
  DeploymentStrategy as StrategyType,
  HealthCheckResult,
} from '../types/pipeline';

/**
 * Base deployment strategy interface
 */
export interface IDeploymentStrategy {
  /**
   * Execute the deployment strategy
   */
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;

  /**
   * Validate deployment configuration for this strategy
   */
  validate(config: DeploymentConfig): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Get strategy-specific health checks
   */
  getHealthChecks(config: DeploymentConfig): Promise<HealthCheckConfig[]>;

  /**
   * Handle rollback for this strategy
   */
  rollback(deploymentId: string, reason: string): Promise<RollbackResult>;

  /**
   * Get deployment progress
   */
  getProgress(deploymentId: string): Promise<DeploymentProgress>;
}

export interface HealthCheckConfig {
  name: string;
  type: 'http' | 'tcp' | 'exec' | 'grpc';
  endpoint?: string;
  port?: number;
  path?: string;
  command?: string[];
  timeout: number;
  interval: number;
  retries: number;
  expectedStatus?: number;
  expectedResponse?: string;
}

export interface RollbackResult {
  success: boolean;
  previousVersion: string;
  currentVersion: string;
  duration: number;
  logs: string[];
  error?: string;
}

export interface DeploymentProgress {
  deploymentId: string;
  strategy: StrategyType;
  phase: DeploymentPhase;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  services: ServiceProgress[];
  healthChecks: HealthCheckProgress[];
  logs: string[];
}

export interface ServiceProgress {
  name: string;
  status: ServiceDeploymentStatus;
  progress: number;
  replicas: {
    desired: number;
    ready: number;
    available: number;
    unavailable: number;
  };
  version: {
    current: string;
    target: string;
  };
  lastUpdated: Date;
}

export interface HealthCheckProgress {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastCheck: Date;
  nextCheck: Date;
  message: string;
}

export enum DeploymentPhase {
  PREPARING = 'preparing',
  DEPLOYING = 'deploying',
  VALIDATING = 'validating',
  PROMOTING = 'promoting',
  COMPLETING = 'completing',
  ROLLING_BACK = 'rolling_back',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ServiceDeploymentStatus {
  PENDING = 'pending',
  DEPLOYING = 'deploying',
  READY = 'ready',
  FAILED = 'failed',
  ROLLING_BACK = 'rolling_back'
}

/**
 * Abstract base class for deployment strategies
 */
export abstract class BaseDeploymentStrategy extends EventEmitter implements IDeploymentStrategy {
  protected logger: Logger;
  protected deployments: Map<string, DeploymentProgress> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  abstract deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  abstract validate(config: DeploymentConfig): Promise<{ valid: boolean; errors: string[] }>;
  abstract rollback(deploymentId: string, reason: string): Promise<RollbackResult>;

  async getHealthChecks(config: DeploymentConfig): Promise<HealthCheckConfig[]> {
    const healthChecks: HealthCheckConfig[] = [];

    // Add service-specific health checks
    config.services.forEach(service => {
      if (service.healthCheck) {
        healthChecks.push({
          name: `${service.name}-health`,
          type: service.healthCheck.type as any,
          endpoint: service.healthCheck.path,
          port: service.healthCheck.port,
          path: service.healthCheck.path,
          command: service.healthCheck.command,
          timeout: service.healthCheck.timeoutSeconds * 1000,
          interval: service.healthCheck.periodSeconds * 1000,
          retries: service.healthCheck.failureThreshold,
          expectedStatus: 200
        });
      }
    });

    // Add deployment-specific health checks
    config.healthChecks.forEach(check => {
      healthChecks.push({
        name: (check as any).name || 'deployment-health',
        type: check.type as any,
        endpoint: check.path,
        port: check.port,
        path: check.path,
        command: check.command,
        timeout: check.timeoutSeconds * 1000,
        interval: check.periodSeconds * 1000,
        retries: check.failureThreshold,
        expectedStatus: 200
      });
    });

    return healthChecks;
  }

  async getProgress(deploymentId: string): Promise<DeploymentProgress> {
    const progress = this.deployments.get(deploymentId);
    if (!progress) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }
    return progress;
  }

  protected createInitialProgress(
    deploymentId: string,
    strategy: StrategyType,
    services: any[]
  ): DeploymentProgress {
    const progress: DeploymentProgress = {
      deploymentId,
      strategy,
      phase: DeploymentPhase.PREPARING,
      progress: 0,
      currentStep: 'Initializing deployment',
      totalSteps: this.calculateTotalSteps(strategy, services.length),
      completedSteps: 0,
      estimatedTimeRemaining: 0,
      services: services.map(service => ({
        name: service.name,
        status: ServiceDeploymentStatus.PENDING,
        progress: 0,
        replicas: {
          desired: service.replicas,
          ready: 0,
          available: 0,
          unavailable: service.replicas
        },
        version: {
          current: 'unknown',
          target: service.tag
        },
        lastUpdated: new Date()
      })),
      healthChecks: [],
      logs: []
    };

    this.deployments.set(deploymentId, progress);
    return progress;
  }

  protected updateProgress(
    deploymentId: string,
    updates: Partial<DeploymentProgress>
  ): void {
    const progress = this.deployments.get(deploymentId);
    if (progress) {
      Object.assign(progress, updates);
      this.emit('progress', { deploymentId, progress });
    }
  }

  protected calculateTotalSteps(strategy: StrategyType, serviceCount: number): number {
    switch (strategy) {
      case StrategyType.ROLLING_UPDATE:
        return 3 + serviceCount; // prepare, deploy services, validate, complete
      case StrategyType.BLUE_GREEN:
        return 5 + serviceCount; // prepare, deploy to blue, validate, switch traffic, cleanup
      case StrategyType.CANARY:
        return 6 + serviceCount; // prepare, deploy canary, validate, promote gradually, complete, cleanup
      default:
        return 3 + serviceCount;
    }
  }

  protected async executeHealthChecks(
    healthChecks: HealthCheckConfig[],
    deploymentId: string
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const check of healthChecks) {
      const result = await this.executeHealthCheck(check, deploymentId);
      results.push(result);
    }

    return results;
  }

  protected async executeHealthCheck(
    check: HealthCheckConfig,
    _deploymentId: string
  ): Promise<HealthCheckResult> {
    const startTime = new Date();

    try {
      let success = false;
      let message = '';

      switch (check.type) {
        case 'http':
          const httpResult = await this.executeHttpHealthCheck(check);
          success = httpResult.success;
          message = httpResult.message;
          break;
        case 'tcp':
          const tcpResult = await this.executeTcpHealthCheck(check);
          success = tcpResult.success;
          message = tcpResult.message;
          break;
        case 'exec':
          const execResult = await this.executeExecHealthCheck(check);
          success = execResult.success;
          message = execResult.message;
          break;
        default:
          throw new Error(`Unsupported health check type: ${check.type}`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        name: check.name,
        status: success ? 'healthy' : 'unhealthy',
        message,
        timestamp: endTime,
        duration
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        name: check.name,
        status: 'unhealthy',
        message: error.message,
        timestamp: endTime,
        duration
      };
    }
  }

  private async executeHttpHealthCheck(check: HealthCheckConfig): Promise<{ success: boolean; message: string }> {
    const axios = await import('axios');
    
    try {
      const url = check.endpoint || `http://localhost:${check.port}${check.path || '/health'}`;
      const response = await axios.default.get(url, {
        timeout: check.timeout,
        validateStatus: (status) => status === (check.expectedStatus || 200)
      });

      return {
        success: true,
        message: `HTTP health check passed: ${response.status}`
      };

    } catch (error) {
      return {
        success: false,
        message: `HTTP health check failed: ${error.message}`
      };
    }
  }

  private async executeTcpHealthCheck(check: HealthCheckConfig): Promise<{ success: boolean; message: string }> {
    const net = await import('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({
          success: false,
          message: `TCP health check timed out after ${check.timeout}ms`
        });
      }, check.timeout);

      socket.connect(check.port!, 'localhost', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          success: true,
          message: `TCP connection successful on port ${check.port}`
        });
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `TCP health check failed: ${error.message}`
        });
      });
    });
  }

  private async executeExecHealthCheck(check: HealthCheckConfig): Promise<{ success: boolean; message: string }> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      if (!check.command || check.command.length === 0) {
        resolve({
          success: false,
          message: 'No command specified for exec health check'
        });
        return;
      }

      const [command, ...args] = check.command;
      const process = spawn(command, args, {
        timeout: check.timeout
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const success = code === 0;
        const message = success ? 
          `Command executed successfully: ${stdout.trim()}` :
          `Command failed with code ${code}: ${stderr.trim()}`;

        resolve({ success, message });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          message: `Exec health check failed: ${error.message}`
        });
      });
    });
  }

  protected async waitForServiceReady(
    serviceName: string,
    targetReplicas: number,
    timeout: number = 300000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // This would integrate with actual orchestration platform (Kubernetes, Docker Swarm, etc.)
        // For now, simulate the check
        const readyReplicas = await this.getServiceReadyReplicas(serviceName);
        
        if (readyReplicas >= targetReplicas) {
          return true;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        this.logger.warn(`Error checking service readiness: ${serviceName}`, {
          error: error.message
        });
      }
    }

    return false;
  }

  private async getServiceReadyReplicas(_serviceName: string): Promise<number> {
    // This would integrate with the actual orchestration platform
    // For now, simulate a gradually increasing ready count
    return Math.floor(Math.random() * 3) + 1;
  }

  protected logDeploymentStep(deploymentId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.logger[level](message, { deploymentId });
    
    const progress = this.deployments.get(deploymentId);
    if (progress) {
      progress.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }
}