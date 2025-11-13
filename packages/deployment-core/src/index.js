"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineUtils = exports.CanaryStrategy = exports.BlueGreenStrategy = exports.RollingUpdateStrategy = exports.ServiceDeploymentStatus = exports.DeploymentPhase = exports.BaseDeploymentStrategy = exports.ApprovalStatus = exports.DeploymentOrchestrator = exports.QualityGateEvaluator = exports.TestStageStatus = exports.TestPlanStatus = exports.TestOrchestrator = exports.TestStatus = exports.TestFramework = exports.TestType = exports.TestRunner = exports.MetricsCollector = exports.NotificationService = exports.PipelineStorage = exports.PipelineValidator = exports.PipelineExecutor = exports.CICDPipeline = void 0;
exports.createCICDPipeline = createCICDPipeline;
exports.createConfiguredCICDPipeline = createConfiguredCICDPipeline;
// Core CI/CD Pipeline exports
var CICDPipeline_1 = require("./core/CICDPipeline");
Object.defineProperty(exports, "CICDPipeline", { enumerable: true, get: function () { return CICDPipeline_1.CICDPipeline; } });
var PipelineExecutor_1 = require("./core/PipelineExecutor");
Object.defineProperty(exports, "PipelineExecutor", { enumerable: true, get: function () { return PipelineExecutor_1.PipelineExecutor; } });
var PipelineValidator_1 = require("./core/PipelineValidator");
Object.defineProperty(exports, "PipelineValidator", { enumerable: true, get: function () { return PipelineValidator_1.PipelineValidator; } });
var PipelineStorage_1 = require("./core/PipelineStorage");
Object.defineProperty(exports, "PipelineStorage", { enumerable: true, get: function () { return PipelineStorage_1.PipelineStorage; } });
var NotificationService_1 = require("./core/NotificationService");
Object.defineProperty(exports, "NotificationService", { enumerable: true, get: function () { return NotificationService_1.NotificationService; } });
var MetricsCollector_1 = require("./core/MetricsCollector");
Object.defineProperty(exports, "MetricsCollector", { enumerable: true, get: function () { return MetricsCollector_1.MetricsCollector; } });
// Types
// export * from './types/pipeline'; // Temporarily disabled due to export conflicts
// Testing components
var TestRunner_1 = require("./testing/TestRunner");
Object.defineProperty(exports, "TestRunner", { enumerable: true, get: function () { return TestRunner_1.TestRunner; } });
Object.defineProperty(exports, "TestType", { enumerable: true, get: function () { return TestRunner_1.TestType; } });
Object.defineProperty(exports, "TestFramework", { enumerable: true, get: function () { return TestRunner_1.TestFramework; } });
Object.defineProperty(exports, "TestStatus", { enumerable: true, get: function () { return TestRunner_1.TestStatus; } });
var TestOrchestrator_1 = require("./testing/TestOrchestrator");
Object.defineProperty(exports, "TestOrchestrator", { enumerable: true, get: function () { return TestOrchestrator_1.TestOrchestrator; } });
Object.defineProperty(exports, "TestPlanStatus", { enumerable: true, get: function () { return TestOrchestrator_1.TestPlanStatus; } });
Object.defineProperty(exports, "TestStageStatus", { enumerable: true, get: function () { return TestOrchestrator_1.TestStageStatus; } });
var QualityGateEvaluator_1 = require("./testing/QualityGateEvaluator");
Object.defineProperty(exports, "QualityGateEvaluator", { enumerable: true, get: function () { return QualityGateEvaluator_1.QualityGateEvaluator; } });
// export type * from './testing/TestRunner'; // Temporarily disabled due to export conflicts
// export type * from './testing/TestOrchestrator'; // Temporarily disabled due to export conflicts
// export type * from './testing/QualityGateEvaluator'; // Temporarily disabled due to export conflicts
// Deployment components
var DeploymentOrchestrator_1 = require("./deployment/DeploymentOrchestrator");
Object.defineProperty(exports, "DeploymentOrchestrator", { enumerable: true, get: function () { return DeploymentOrchestrator_1.DeploymentOrchestrator; } });
Object.defineProperty(exports, "ApprovalStatus", { enumerable: true, get: function () { return DeploymentOrchestrator_1.ApprovalStatus; } });
var DeploymentStrategy_1 = require("./deployment/DeploymentStrategy");
Object.defineProperty(exports, "BaseDeploymentStrategy", { enumerable: true, get: function () { return DeploymentStrategy_1.BaseDeploymentStrategy; } });
Object.defineProperty(exports, "DeploymentPhase", { enumerable: true, get: function () { return DeploymentStrategy_1.DeploymentPhase; } });
Object.defineProperty(exports, "ServiceDeploymentStatus", { enumerable: true, get: function () { return DeploymentStrategy_1.ServiceDeploymentStatus; } });
var RollingUpdateStrategy_1 = require("./deployment/RollingUpdateStrategy");
Object.defineProperty(exports, "RollingUpdateStrategy", { enumerable: true, get: function () { return RollingUpdateStrategy_1.RollingUpdateStrategy; } });
var BlueGreenStrategy_1 = require("./deployment/BlueGreenStrategy");
Object.defineProperty(exports, "BlueGreenStrategy", { enumerable: true, get: function () { return BlueGreenStrategy_1.BlueGreenStrategy; } });
var CanaryStrategy_1 = require("./deployment/CanaryStrategy");
Object.defineProperty(exports, "CanaryStrategy", { enumerable: true, get: function () { return CanaryStrategy_1.CanaryStrategy; } });
// export type * from './deployment/DeploymentStrategy'; // Temporarily disabled due to export conflicts
// export type * from './deployment/DeploymentOrchestrator'; // Temporarily disabled due to export conflicts
// Factory function for creating a complete CI/CD pipeline instance
const CICDPipeline_2 = require("./core/CICDPipeline");
const PipelineExecutor_2 = require("./core/PipelineExecutor");
const PipelineValidator_2 = require("./core/PipelineValidator");
const PipelineStorage_2 = require("./core/PipelineStorage");
const NotificationService_2 = require("./core/NotificationService");
const MetricsCollector_2 = require("./core/MetricsCollector");
/**
 * Factory function to create a fully configured CI/CD Pipeline instance
 */
function createCICDPipeline(logger) {
    const executor = new PipelineExecutor_2.PipelineExecutor(logger);
    const validator = new PipelineValidator_2.PipelineValidator(logger);
    const storage = new PipelineStorage_2.PipelineStorage(logger);
    const notificationService = new NotificationService_2.NotificationService(logger);
    const metricsCollector = new MetricsCollector_2.MetricsCollector(logger);
    return new CICDPipeline_2.CICDPipeline(executor, validator, storage, notificationService, metricsCollector, logger);
}
/**
 * Advanced factory function with configuration options
 */
function createConfiguredCICDPipeline(config) {
    const { logger } = config;
    // Create components with configuration
    const executor = new PipelineExecutor_2.PipelineExecutor(logger);
    const validator = new PipelineValidator_2.PipelineValidator(logger);
    const storage = new PipelineStorage_2.PipelineStorage(logger);
    const notificationService = new NotificationService_2.NotificationService(logger);
    const metricsCollector = new MetricsCollector_2.MetricsCollector(logger);
    // Configure components based on config
    // This would be expanded to actually configure the components
    // based on the provided configuration options
    const pipeline = new CICDPipeline_2.CICDPipeline(executor, validator, storage, notificationService, metricsCollector, logger);
    return pipeline;
}
/**
 * Utility functions for pipeline management
 */
exports.PipelineUtils = {
    /**
     * Generate a unique pipeline execution ID
     */
    generateExecutionId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)};
  },

  /**
   * Generate a unique build ID
   */
  generateBuildId(): string {`;
        return build - $;
        {
            Date.now();
        }
        `-${Math.random().toString(36).substr(2, 9)}`;
    },
    /**
     * Generate a unique deployment ID
     */
    generateDeploymentId() {
        return deploy - $;
        {
            Date.now();
        }
        -$;
        {
            Math.random().toString(36).substr(2, 9);
        }
        ;
    },
    /**
     * Format duration in human-readable format
     */
    formatDuration(milliseconds) {
        if (milliseconds < 1000) {
            `
      return `;
            $;
            {
                milliseconds;
            }
            ms;
        }
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        `
`;
        if (hours > 0) {
            return $;
            {
                hours;
            }
            `h ${minutes % 60}m ${seconds % 60}s;`;
        }
        else if (minutes > 0) {
            return $;
            {
                minutes;
            }
            m;
            $;
            {
                seconds % 60;
            }
            `s;
    } else {
      return ${seconds}s`;
        }
    },
    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(Invalid, duration, format, $, { duration });
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
                `
        throw new Error(Unknown duration unit: ${unit}`;
                ;
        }
    },
    /**
     * Validate pipeline name format
     */
    validatePipelineName(name) {
        // Pipeline names should be alphanumeric with hyphens and underscores
        const nameRegex = /^[a-zA-Z0-9_-]+$/;
        return nameRegex.test(name) && name.length >= 3 && name.length <= 50;
    },
    /**
     * Validate environment name format
     */
    validateEnvironmentName(name) {
        // Environment names should be lowercase alphanumeric with hyphens
        const envRegex = /^[a-z0-9-]+$/;
        return envRegex.test(name) && name.length >= 2 && name.length <= 20;
    },
    /**
     * Generate pipeline configuration template
     */
    generatePipelineTemplate(name, type = 'web') {
        const baseTemplate = {
            id: pipeline - $
        }, { Date };
    }, : .now()
} `,
      name,
      version: '1.0.0',
      description: CI/CD pipeline for ${name},
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
              configuration: {`;
webhookUrl: '${SLACK_WEBHOOK_URL}``',
    channel;
'#ci-cd';
recipients: [];
events: [
    { type: 'pipeline_start', enabled: true },
    { type: 'pipeline_complete', enabled: true },
    { type: 'pipeline_failed', enabled: true }
],
    conditions;
[];
timeout: 3600000, // 1 hour
    retryPolicy;
{
    enabled: true,
        maxAttempts;
    3,
        backoffStrategy;
    'exponential',
        initialDelay;
    1000,
        maxDelay;
    30000,
        retryConditions;
    ['infrastructure_error', 'timeout'];
}
variables: { }
metadata: {
    createdAt: new Date().toISOString(),
        createdBy;
    'system',
        type;
}
;
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
                        command: 'pnpm run build',
                        parameters: {
                            buildCommand: 'pnpm run build'
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
                        command: 'pnpm run test:integration',
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
                        command: 'pnpm run build',
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
                            tag: '${BUILD_NUMBER}`',
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
                        command: 'pnpm run build',
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
;
//# sourceMappingURL=index.js.map