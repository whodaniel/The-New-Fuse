// Core CI/CD Pipeline exports
export { CICDPipeline } from './core/CICDPipeline';
export { PipelineExecutor } from './core/PipelineExecutor';
export { PipelineValidator } from './core/PipelineValidator';
export { PipelineStorage } from './core/PipelineStorage';
export { NotificationService } from './core/NotificationService';
export { MetricsCollector } from './core/MetricsCollector';

// Infrastructure components
// export * from './infrastructure'; // Temporarily disabled due to export conflicts

// Interfaces
export type { ICICDPipeline } from './interfaces/ICICDPipeline';
export type { IInfrastructureManager } from './interfaces/IInfrastructureManager';

// Types
// export * from './types/pipeline'; // Temporarily disabled due to export conflicts

// Testing components
export { TestRunner, TestType, TestFramework, TestStatus } from './testing/TestRunner';
export { TestOrchestrator, TestPlanStatus, TestStageStatus } from './testing/TestOrchestrator';
export { QualityGateEvaluator } from './testing/QualityGateEvaluator';
// export type * from './testing/TestRunner'; // Temporarily disabled due to export conflicts
// export type * from './testing/TestOrchestrator'; // Temporarily disabled due to export conflicts
// export type * from './testing/QualityGateEvaluator'; // Temporarily disabled due to export conflicts

// Deployment components
export { DeploymentOrchestrator, ApprovalStatus } from './deployment/DeploymentOrchestrator';
export { BaseDeploymentStrategy, DeploymentPhase, ServiceDeploymentStatus } from './deployment/DeploymentStrategy';
export { RollingUpdateStrategy } from './deployment/RollingUpdateStrategy';
export { BlueGreenStrategy } from './deployment/BlueGreenStrategy';
export { CanaryStrategy } from './deployment/CanaryStrategy';
// export type * from './deployment/DeploymentStrategy'; // Temporarily disabled due to export conflicts
// export type * from './deployment/DeploymentOrchestrator'; // Temporarily disabled due to export conflicts

// Factory function for creating a complete CI/CD pipeline instance
import { CICDPipeline } from './core/CICDPipeline';
import { PipelineExecutor } from './core/PipelineExecutor';
import { PipelineValidator } from './core/PipelineValidator';
import { PipelineStorage } from './core/PipelineStorage';
import { NotificationService } from './core/NotificationService';
import { MetricsCollector } from './core/MetricsCollector';
import { Logger } from 'winston';

/**
 * Factory function to create a fully configured CI/CD Pipeline instance
 */
export function createCICDPipeline(logger: Logger): CICDPipeline {
  const executor = new PipelineExecutor(logger);
  const validator = new PipelineValidator(logger);
  const storage = new PipelineStorage(logger);
  const notificationService = new NotificationService(logger);
  const metricsCollector = new MetricsCollector(logger);

  return new CICDPipeline(
    executor,
    validator,
    storage,
    notificationService,
    metricsCollector,
    logger
  );
}

/**
 * Configuration interface for CI/CD Pipeline setup
 */
export interface CICDPipelineConfig {
  logger: Logger;
  storage?: {
    type: 'memory' | 'database' | 'file';
    connectionString?: string;
    options?: Record<string, any>;
  };
  notifications?: {
    slack?: {
      webhookUrl: string;
      defaultChannel: string;
    };
    email?: {
      provider: string;
      apiKey: string;
      fromAddress: string;
    };
    webhook?: {
      defaultUrl: string;
      headers?: Record<string, string>;
    };
  };
  metrics?: {
    enabled: boolean;
    retentionDays: number;
    exportInterval: number;
  };
  security?: {
    allowDangerousCommands: boolean;
    requireApprovalForProduction: boolean;
    secretScanningEnabled: boolean;
  };
}

/**
 * Advanced factory function with configuration options
 */
export function createConfiguredCICDPipeline(config: CICDPipelineConfig): CICDPipeline {
  const { logger } = config;

  // Create components with configuration
  const executor = new PipelineExecutor(logger);
  const validator = new PipelineValidator(logger);
  const storage = new PipelineStorage(logger);
  const notificationService = new NotificationService(logger);
  const metricsCollector = new MetricsCollector(logger);

  // Configure components based on config
  // This would be expanded to actually configure the components
  // based on the provided configuration options

  const pipeline = new CICDPipeline(
    executor,
    validator,
    storage,
    notificationService,
    metricsCollector,
    logger
  );

  return pipeline;
}

/**
 * Utility functions for pipeline management
 */
export const PipelineUtils = {
  /**
   * Generate a unique pipeline execution ID
   */
  generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate a unique build ID
   */
  generateBuildId(): string {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate a unique deployment ID
   */
  generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format duration in human-readable format
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  /**
   * Parse duration string to milliseconds
   */
  parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

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
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  },

  /**
   * Validate pipeline name format
   */
  validatePipelineName(name: string): boolean {
    // Pipeline names should be alphanumeric with hyphens and underscores
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    return nameRegex.test(name) && name.length >= 3 && name.length <= 50;
  },

  /**
   * Validate environment name format
   */
  validateEnvironmentName(name: string): boolean {
    // Environment names should be lowercase alphanumeric with hyphens
    const envRegex = /^[a-z0-9-]+$/;
    return envRegex.test(name) && name.length >= 2 && name.length <= 20;
  },

  /**
   * Generate pipeline configuration template
   */
  generatePipelineTemplate(name: string, type: 'web' | 'api' | 'library' = 'web'): any {
    const baseTemplate = {
      id: `pipeline-${Date.now()}`,
      name,
      version: '1.0.0',
      description: `CI/CD pipeline for ${name}`,
      stages: [],
      triggers: [
        {
          type: 'push',
          configuration: {
            branches: ['main', 'develop']
          },
          filters: [
            {
              type: 'branch',
              pattern: '^(main|develop)$',
              exclude: false
            }
          ],
          enabled: true
        }
      ],
      environment: {
        name: 'default',
        type: 'development',
        variables: {},
        secrets: [],
        resources: {
          cpu: '500m',
          memory: '1Gi',
          storage: '10Gi'
        },
        constraints: {
          allowedBranches: ['main', 'develop'],
          requiredApprovals: 0,
          deploymentWindows: [],
          maxConcurrentDeployments: 1
        }
      },
      qualityGates: [
        {
          id: 'coverage-gate',
          name: 'Test Coverage',
          type: 'coverage',
          threshold: 80,
          operator: 'greater_than',
          required: true,
          failureBehavior: 'fail'
        }
      ],
      notifications: [
        {
          enabled: true,
          channels: [
            {
              type: 'slack',
              configuration: {
                webhookUrl: '${SLACK_WEBHOOK_URL}',
                channel: '#ci-cd'
              },
              recipients: []
            }
          ],
          events: [
            { type: 'pipeline_start', enabled: true },
            { type: 'pipeline_complete', enabled: true },
            { type: 'pipeline_failed', enabled: true }
          ],
          conditions: []
        }
      ],
      timeout: 3600000, // 1 hour
      retryPolicy: {
        enabled: true,
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
        retryConditions: ['infrastructure_error', 'timeout']
      },
      variables: {},
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        type
      }
    };

    // Add type-specific stages
    switch (type) {
      case 'web':
        baseTemplate.stages = [
          {
            id: 'install',
            name: 'Install Dependencies',
            type: 'build',
            dependencies: [],
            tasks: [
              {
                id: 'npm-install',
                name: 'Install NPM Dependencies',
                type: 'shell',
                command: 'npm ci',
                parameters: {},
                timeout: 300000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['network_error']
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 600000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'test',
            name: 'Run Tests',
            type: 'test',
            dependencies: ['install'],
            tasks: [
              {
                id: 'unit-tests',
                name: 'Run Unit Tests',
                type: 'test',
                command: 'npm test',
                parameters: {
                  testCommand: 'npm test -- --coverage'
                },
                timeout: 600000,
                retryPolicy: {
                  enabled: false,
                  maxAttempts: 1,
                  backoffStrategy: 'fixed',
                  initialDelay: 0,
                  maxDelay: 0,
                  retryConditions: []
                },
                conditions: [],
                artifacts: [
                  {
                    name: 'test-results',
                    path: 'test-results/',
                    type: 'directory',
                    retention: 30
                  },
                  {
                    name: 'coverage-report',
                    path: 'coverage/',
                    type: 'directory',
                    retention: 30
                  }
                ]
              }
            ],
            conditions: [],
            timeout: 900000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'build',
            name: 'Build Application',
            type: 'build',
            dependencies: ['test'],
            tasks: [
              {
                id: 'build-app',
                name: 'Build Application',
                type: 'build',
                command: 'npm run build',
                parameters: {
                  buildCommand: 'npm run build'
                },
                timeout: 600000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['build_error']
                },
                conditions: [],
                artifacts: [
                  {
                    name: 'build-output',
                    path: 'dist/',
                    type: 'directory',
                    retention: 90
                  }
                ]
              }
            ],
            conditions: [],
            timeout: 900000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          }
        ];
        break;

      case 'api':
        baseTemplate.stages = [
          {
            id: 'install',
            name: 'Install Dependencies',
            type: 'build',
            dependencies: [],
            tasks: [
              {
                id: 'install-deps',
                name: 'Install Dependencies',
                type: 'shell',
                command: 'npm ci',
                parameters: {},
                timeout: 300000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['network_error']
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 600000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'test',
            name: 'Run Tests',
            type: 'test',
            dependencies: ['install'],
            tasks: [
              {
                id: 'unit-tests',
                name: 'Run Unit Tests',
                type: 'test',
                command: 'npm test',
                parameters: {},
                timeout: 600000,
                retryPolicy: {
                  enabled: false,
                  maxAttempts: 1,
                  backoffStrategy: 'fixed',
                  initialDelay: 0,
                  maxDelay: 0,
                  retryConditions: []
                },
                conditions: [],
                artifacts: []
              },
              {
                id: 'integration-tests',
                name: 'Run Integration Tests',
                type: 'test',
                command: 'npm run test:integration',
                parameters: {},
                timeout: 900000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 10000,
                  maxDelay: 20000,
                  retryConditions: ['database_error', 'network_error']
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 1200000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: true,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'build',
            name: 'Build and Package',
            type: 'build',
            dependencies: ['test'],
            tasks: [
              {
                id: 'build-api',
                name: 'Build API',
                type: 'build',
                command: 'npm run build',
                parameters: {},
                timeout: 600000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['build_error']
                },
                conditions: [],
                artifacts: [
                  {
                    name: 'api-build',
                    path: 'dist/',
                    type: 'directory',
                    retention: 90
                  }
                ]
              },
              {
                id: 'docker-build',
                name: 'Build Docker Image',
                type: 'docker',
                parameters: {
                  image: name,
                  tag: '${BUILD_NUMBER}',
                  dockerfile: 'Dockerfile'
                },
                timeout: 900000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 10000,
                  maxDelay: 20000,
                  retryConditions: ['docker_error']
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 1200000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          }
        ];
        break;

      case 'library':
        baseTemplate.stages = [
          {
            id: 'install',
            name: 'Install Dependencies',
            type: 'build',
            dependencies: [],
            tasks: [
              {
                id: 'install-deps',
                name: 'Install Dependencies',
                type: 'shell',
                command: 'npm ci',
                parameters: {},
                timeout: 300000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['network_error']
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 600000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'test',
            name: 'Run Tests',
            type: 'test',
            dependencies: ['install'],
            tasks: [
              {
                id: 'unit-tests',
                name: 'Run Unit Tests',
                type: 'test',
                command: 'npm test',
                parameters: {},
                timeout: 600000,
                retryPolicy: {
                  enabled: false,
                  maxAttempts: 1,
                  backoffStrategy: 'fixed',
                  initialDelay: 0,
                  maxDelay: 0,
                  retryConditions: []
                },
                conditions: [],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 900000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'build',
            name: 'Build Library',
            type: 'build',
            dependencies: ['test'],
            tasks: [
              {
                id: 'build-lib',
                name: 'Build Library',
                type: 'build',
                command: 'npm run build',
                parameters: {},
                timeout: 600000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['build_error']
                },
                conditions: [],
                artifacts: [
                  {
                    name: 'library-build',
                    path: 'lib/',
                    type: 'directory',
                    retention: 90
                  }
                ]
              }
            ],
            conditions: [],
            timeout: 900000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          },
          {
            id: 'publish',
            name: 'Publish Package',
            type: 'deploy',
            dependencies: ['build'],
            tasks: [
              {
                id: 'npm-publish',
                name: 'Publish to NPM',
                type: 'shell',
                command: 'npm publish',
                parameters: {},
                timeout: 300000,
                retryPolicy: {
                  enabled: true,
                  maxAttempts: 2,
                  backoffStrategy: 'linear',
                  initialDelay: 5000,
                  maxDelay: 10000,
                  retryConditions: ['network_error']
                },
                conditions: [
                  {
                    type: 'branch',
                    operator: 'equals',
                    value: 'main'
                  }
                ],
                artifacts: []
              }
            ],
            conditions: [],
            timeout: 600000,
            retryPolicy: baseTemplate.retryPolicy,
            parallel: false,
            continueOnError: false,
            environment: {}
          }
        ];
        break;
    }

    return baseTemplate;
  }
};
