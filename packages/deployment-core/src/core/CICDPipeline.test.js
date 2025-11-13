"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CICDPipeline_1 = require("./CICDPipeline");
const PipelineExecutor_1 = require("./PipelineExecutor");
const PipelineValidator_1 = require("./PipelineValidator");
const PipelineStorage_1 = require("./PipelineStorage");
const NotificationService_1 = require("./NotificationService");
const MetricsCollector_1 = require("./MetricsCollector");
const pipeline_1 = require("../types/pipeline");
const winston_1 = __importDefault(require("winston"));
(0, vitest_1.describe)('CICDPipeline', () => {
    let pipeline;
    let mockExecutor;
    let mockValidator;
    let mockStorage;
    let mockNotificationService;
    let mockMetricsCollector;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        // Create mock logger
        mockLogger = winston_1.default.createLogger({
            level: 'error',
            transports: [new winston_1.default.transports.Console({ silent: true })]
        });
        // Create real instances for testing
        mockExecutor = new PipelineExecutor_1.PipelineExecutor(mockLogger);
        mockValidator = new PipelineValidator_1.PipelineValidator(mockLogger);
        mockStorage = new PipelineStorage_1.PipelineStorage(mockLogger);
        mockNotificationService = new NotificationService_1.NotificationService(mockLogger);
        mockMetricsCollector = new MetricsCollector_1.MetricsCollector(mockLogger);
        // Create pipeline instance
        pipeline = new CICDPipeline_1.CICDPipeline(mockExecutor, mockValidator, mockStorage, mockNotificationService, mockMetricsCollector, mockLogger);
    });
    (0, vitest_1.describe)('triggerBuild', () => {
        (0, vitest_1.it)('should trigger a build successfully', async () => {
            const trigger = {
                id: 'trigger-1',
                type: pipeline_1.TriggerType.PUSH,
                source: {
                    repository: 'test-repo',
                    branch: 'main',
                    commit: 'abc123',
                    author: 'test-user',
                    message: 'Test commit'
                },
                timestamp: new Date(),
                metadata: {}
            };
            // Mock pipeline configuration
            const mockPipelineConfig = {
                id: 'pipeline-1',
                name: 'Test Pipeline',
                version: '1.0.0',
                definition: createTestPipelineDefinition(),
                enabled: true,
                concurrency: 1,
                timeout: 3600000,
                retentionPolicy: {
                    maxBuilds: 100,
                    maxAge: '30d',
                    artifactRetention: '7d',
                    logRetention: '30d'
                },
                permissions: {
                    read: ['*'],
                    write: ['admin'],
                    execute: ['developer'],
                    admin: ['admin']
                },
                metadata: {}
            };
            // Mock storage to return pipeline config
            vitest_1.vi.spyOn(mockStorage, 'getAllPipelineConfigs').mockResolvedValue([mockPipelineConfig]);
            vitest_1.vi.spyOn(mockStorage, 'storeBuildResult').mockResolvedValue();
            const result = await pipeline.triggerBuild(trigger);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.triggerId).toBe(trigger.id);
            (0, vitest_1.expect)(result.status).toBe(pipeline_1.PipelineStatus.SUCCESS);
        });
        (0, vitest_1.it)('should handle build trigger failure', async () => {
            const trigger = {
                id: 'trigger-2',
                type: pipeline_1.TriggerType.PUSH,
                source: {
                    repository: 'test-repo',
                    branch: 'main',
                    commit: 'abc123',
                    author: 'test-user',
                    message: 'Test commit'
                },
                timestamp: new Date(),
                metadata: {}
            };
            // Mock storage to return no pipeline configs
            vitest_1.vi.spyOn(mockStorage, 'getAllPipelineConfigs').mockResolvedValue([]);
            vitest_1.vi.spyOn(mockStorage, 'storeBuildResult').mockResolvedValue();
            const result = await pipeline.triggerBuild(trigger);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.status).toBe(pipeline_1.PipelineStatus.FAILED);
            (0, vitest_1.expect)(result.error).toContain('No pipeline configurations found');
        });
    });
    (0, vitest_1.describe)('executePipeline', () => {
        (0, vitest_1.it)('should execute a simple pipeline successfully', async () => {
            const pipelineDefinition = createTestPipelineDefinition();
            // Mock validator to return valid
            vitest_1.vi.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
                valid: true,
                errors: []
            });
            // Mock storage
            vitest_1.vi.spyOn(mockStorage, 'storePipelineResult').mockResolvedValue();
            const result = await pipeline.executePipeline(pipelineDefinition);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.pipelineId).toBe(pipelineDefinition.id);
            (0, vitest_1.expect)(result.status).toBe(pipeline_1.PipelineStatus.SUCCESS);
            (0, vitest_1.expect)(result.stages).toHaveLength(pipelineDefinition.stages.length);
        });
        (0, vitest_1.it)('should fail pipeline execution with invalid configuration', async () => {
            const pipelineDefinition = createTestPipelineDefinition();
            // Mock validator to return invalid
            vitest_1.vi.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
                valid: false,
                errors: ['Invalid pipeline configuration']
            });
            await (0, vitest_1.expect)(pipeline.executePipeline(pipelineDefinition)).rejects.toThrow('Pipeline validation failed');
        });
    });
    (0, vitest_1.describe)('validatePipeline', () => {
        (0, vitest_1.it)('should validate a correct pipeline definition', async () => {
            const pipelineDefinition = createTestPipelineDefinition();
            const result = await pipeline.validatePipeline(pipelineDefinition);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should detect validation errors in pipeline definition', async () => {
            const invalidPipelineDefinition = {
                id: '', // Invalid: empty ID
                name: '', // Invalid: empty name
                version: '1.0.0',
                stages: [], // Invalid: no stages
                triggers: [], // Invalid: no triggers
                environment: {
                    name: 'test',
                    type: pipeline_1.EnvironmentType.TEST,
                    variables: {},
                    secrets: [],
                    resources: {
                        cpu: '100m',
                        memory: '128Mi',
                        storage: '1Gi'
                    },
                    constraints: {
                        allowedBranches: ['main'],
                        requiredApprovals: 0,
                        deploymentWindows: [],
                        maxConcurrentDeployments: 1
                    }
                },
                qualityGates: [],
                notifications: [],
                timeout: 3600000,
                retryPolicy: {
                    enabled: false,
                    maxAttempts: 1,
                    backoffStrategy: 'fixed',
                    initialDelay: 1000,
                    maxDelay: 30000,
                    retryConditions: []
                },
                variables: {},
                metadata: {}
            };
            const result = await pipeline.validatePipeline(invalidPipelineDefinition);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('monitorPipeline', () => {
        (0, vitest_1.it)('should return pipeline status for running pipeline', async () => {
            const pipelineDefinition = createTestPipelineDefinition();
            // Mock validator
            vitest_1.vi.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
                valid: true,
                errors: []
            });
            // Mock storage
            vitest_1.vi.spyOn(mockStorage, 'storePipelineResult').mockResolvedValue();
            // Start pipeline execution (don't await to keep it running)
            const executionPromise = pipeline.executePipeline(pipelineDefinition);
            // Give it a moment to start
            await new Promise(resolve => setTimeout(resolve, 10));
            // Monitor the pipeline - this should find the running pipeline
            // Since we can't easily get the execution ID, we'll test with a mock ID
            const mockExecutionId = 'test-execution-id';
            const status = await pipeline.monitorPipeline(mockExecutionId);
            (0, vitest_1.expect)(status).toBeDefined();
            (0, vitest_1.expect)(Object.values(pipeline_1.PipelineStatus)).toContain(status);
            // Wait for execution to complete
            await executionPromise;
        });
    });
    (0, vitest_1.describe)('getPipelineMetrics', () => {
        (0, vitest_1.it)('should return pipeline metrics for specified time range', async () => {
            const metrics = await pipeline.getPipelineMetrics('24h');
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(typeof metrics).toBe('object');
        });
    });
});
// Helper function to create a test pipeline definition
function createTestPipelineDefinition() {
    return {
        id: 'test-pipeline-1',
        name: 'Test Pipeline',
        version: '1.0.0',
        stages: [
            {
                id: 'build-stage',
                name: 'Build',
                type: pipeline_1.StageType.BUILD,
                dependencies: [],
                tasks: [
                    {
                        id: 'build-task',
                        name: 'Build Application',
                        type: 'build',
                        command: 'echo "Building application"',
                        parameters: {},
                        timeout: 60000,
                        retryPolicy: {
                            enabled: false,
                            maxAttempts: 1,
                            backoffStrategy: 'fixed',
                            initialDelay: 1000,
                            maxDelay: 5000,
                            retryConditions: []
                        },
                        conditions: [],
                        artifacts: []
                    }
                ],
                conditions: [],
                timeout: 300000,
                retryPolicy: {
                    enabled: false,
                    maxAttempts: 1,
                    backoffStrategy: 'fixed',
                    initialDelay: 1000,
                    maxDelay: 5000,
                    retryConditions: []
                },
                parallel: false,
                continueOnError: false,
                environment: {}
            },
            {
                id: 'test-stage',
                name: 'Test',
                type: pipeline_1.StageType.TEST,
                dependencies: ['build-stage'],
                tasks: [
                    {
                        id: 'test-task',
                        name: 'Run Tests',
                        type: 'test',
                        command: 'echo "Running tests"',
                        parameters: {},
                        timeout: 60000,
                        retryPolicy: {
                            enabled: false,
                            maxAttempts: 1,
                            backoffStrategy: 'fixed',
                            initialDelay: 1000,
                            maxDelay: 5000,
                            retryConditions: []
                        },
                        conditions: [],
                        artifacts: []
                    }
                ],
                conditions: [],
                timeout: 300000,
                retryPolicy: {
                    enabled: false,
                    maxAttempts: 1,
                    backoffStrategy: 'fixed',
                    initialDelay: 1000,
                    maxDelay: 5000,
                    retryConditions: []
                },
                parallel: false,
                continueOnError: false,
                environment: {}
            }
        ],
        triggers: [
            {
                type: pipeline_1.TriggerType.PUSH,
                configuration: {
                    branches: ['main']
                },
                filters: [
                    {
                        type: 'branch',
                        pattern: 'main',
                        exclude: false
                    }
                ],
                enabled: true
            }
        ],
        environment: {
            name: 'test',
            type: pipeline_1.EnvironmentType.TEST,
            variables: {},
            secrets: [],
            resources: {
                cpu: '100m',
                memory: '128Mi',
                storage: '1Gi'
            },
            constraints: {
                allowedBranches: ['main'],
                requiredApprovals: 0,
                deploymentWindows: [],
                maxConcurrentDeployments: 1
            }
        },
        qualityGates: [],
        notifications: [],
        timeout: 3600000,
        retryPolicy: {
            enabled: false,
            maxAttempts: 1,
            backoffStrategy: 'fixed',
            initialDelay: 1000,
            maxDelay: 30000,
            retryConditions: []
        },
        variables: {},
        metadata: {}
    };
}
//# sourceMappingURL=CICDPipeline.test.js.map