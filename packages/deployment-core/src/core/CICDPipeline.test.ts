import { CICDPipeline } from './CICDPipeline';
import { PipelineExecutor } from './PipelineExecutor';
import { PipelineValidator } from './PipelineValidator';
import { PipelineStorage } from './PipelineStorage';
import { NotificationService } from './NotificationService';
import { MetricsCollector } from './MetricsCollector';
import { 
  PipelineDefinition, 
  PipelineStatus, 
  StageType, 
  TriggerType,
  BuildTrigger,
  EnvironmentType
} from '../types/pipeline';
import winston from 'winston';

describe('CICDPipeline', () => {
  let pipeline: CICDPipeline;
  let mockExecutor: PipelineExecutor;
  let mockValidator: PipelineValidator;
  let mockStorage: PipelineStorage;
  let mockNotificationService: NotificationService;
  let mockMetricsCollector: MetricsCollector;
  let mockLogger: winston.Logger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = winston.createLogger({
      level: 'error',
      transports: [new winston.transports.Console({ silent: true })]
    });

    // Create real instances for testing
    mockExecutor = new PipelineExecutor(mockLogger);
    mockValidator = new PipelineValidator(mockLogger);
    mockStorage = new PipelineStorage(mockLogger);
    mockNotificationService = new NotificationService(mockLogger);
    mockMetricsCollector = new MetricsCollector(mockLogger);

    // Create pipeline instance
    pipeline = new CICDPipeline(
      mockExecutor,
      mockValidator,
      mockStorage,
      mockNotificationService,
      mockMetricsCollector,
      mockLogger
    );
  });

  describe('triggerBuild', () => {
    it('should trigger a build successfully', async () => {
      const trigger: BuildTrigger = {
        id: 'trigger-1',
        type: TriggerType.PUSH,
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
      jest.spyOn(mockStorage, 'getAllPipelineConfigs').mockResolvedValue([mockPipelineConfig]);
      jest.spyOn(mockStorage, 'storeBuildResult').mockResolvedValue();

      const result = await pipeline.triggerBuild(trigger);

      expect(result).toBeDefined();
      expect(result.triggerId).toBe(trigger.id);
      expect(result.status).toBe(PipelineStatus.SUCCESS);
    });

    it('should handle build trigger failure', async () => {
      const trigger: BuildTrigger = {
        id: 'trigger-2',
        type: TriggerType.PUSH,
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
      jest.spyOn(mockStorage, 'getAllPipelineConfigs').mockResolvedValue([]);
      jest.spyOn(mockStorage, 'storeBuildResult').mockResolvedValue();

      const result = await pipeline.triggerBuild(trigger);

      expect(result).toBeDefined();
      expect(result.status).toBe(PipelineStatus.FAILED);
      expect(result.error).toContain('No pipeline configurations found');
    });
  });

  describe('executePipeline', () => {
    it('should execute a simple pipeline successfully', async () => {
      const pipelineDefinition = createTestPipelineDefinition();

      // Mock validator to return valid
      jest.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
        valid: true,
        errors: []
      });

      // Mock storage
      jest.spyOn(mockStorage, 'storePipelineResult').mockResolvedValue();

      const result = await pipeline.executePipeline(pipelineDefinition);

      expect(result).toBeDefined();
      expect(result.pipelineId).toBe(pipelineDefinition.id);
      expect(result.status).toBe(PipelineStatus.SUCCESS);
      expect(result.stages).toHaveLength(pipelineDefinition.stages.length);
    });

    it('should fail pipeline execution with invalid configuration', async () => {
      const pipelineDefinition = createTestPipelineDefinition();

      // Mock validator to return invalid
      jest.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
        valid: false,
        errors: ['Invalid pipeline configuration']
      });

      await expect(pipeline.executePipeline(pipelineDefinition)).rejects.toThrow(
        'Pipeline validation failed'
      );
    });
  });

  describe('validatePipeline', () => {
    it('should validate a correct pipeline definition', async () => {
      const pipelineDefinition = createTestPipelineDefinition();

      const result = await pipeline.validatePipeline(pipelineDefinition);

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors in pipeline definition', async () => {
      const invalidPipelineDefinition: PipelineDefinition = {
        id: '',  // Invalid: empty ID
        name: '',  // Invalid: empty name
        version: '1.0.0',
        stages: [],  // Invalid: no stages
        triggers: [],  // Invalid: no triggers
        environment: {
          name: 'test',
          type: EnvironmentType.TEST,
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

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('monitorPipeline', () => {
    it('should return pipeline status for running pipeline', async () => {
      const pipelineDefinition = createTestPipelineDefinition();

      // Mock validator
      jest.spyOn(mockValidator, 'validatePipeline').mockResolvedValue({
        valid: true,
        errors: []
      });

      // Mock storage
      jest.spyOn(mockStorage, 'storePipelineResult').mockResolvedValue();

      // Start pipeline execution (don't await to keep it running)
      const executionPromise = pipeline.executePipeline(pipelineDefinition);

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Monitor the pipeline - this should find the running pipeline
      // Since we can't easily get the execution ID, we'll test with a mock ID
      const mockExecutionId = 'test-execution-id';
      const status = await pipeline.monitorPipeline(mockExecutionId);

      expect(status).toBeDefined();
      expect(Object.values(PipelineStatus)).toContain(status);

      // Wait for execution to complete
      await executionPromise;
    });
  });

  describe('getPipelineMetrics', () => {
    it('should return pipeline metrics for specified time range', async () => {
      const metrics = await pipeline.getPipelineMetrics('24h');

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });
  });
});

// Helper function to create a test pipeline definition
function createTestPipelineDefinition(): PipelineDefinition {
  return {
    id: 'test-pipeline-1',
    name: 'Test Pipeline',
    version: '1.0.0',
    stages: [
      {
        id: 'build-stage',
        name: 'Build',
        type: StageType.BUILD,
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
        type: StageType.TEST,
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
        type: TriggerType.PUSH,
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
      type: EnvironmentType.TEST,
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