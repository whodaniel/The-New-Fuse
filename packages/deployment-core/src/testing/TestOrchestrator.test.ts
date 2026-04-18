import { TestOrchestrator, TestExecutionPlan, TestType, TestPlanStatus } from './TestOrchestrator';
import { TestFramework, TestStatus } from './TestRunner';
import winston from 'winston';

// Mock the TestRunner
jest.mock('./TestRunner', () => {
  const actual = jest.requireActual('./TestRunner');
  return {
    ...actual,
    TestRunner: jest.fn().mockImplementation(() => ({
      executeTests: jest.fn(),
      generateTestSummary: jest.fn(),
      on: jest.fn()
    }))
  };
});

describe('TestOrchestrator', () => {
  let orchestrator: TestOrchestrator;
  let mockLogger: winston.Logger;
  let mockTestRunner: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = winston.createLogger({
      level: 'error',
      transports: [new winston.transports.Console({ silent: true })]
    });

    orchestrator = new TestOrchestrator(mockLogger);

    // Get the mocked TestRunner instance
    mockTestRunner = (orchestrator as any).testRunner;

    // Setup default mock implementations
    mockTestRunner.executeTests.mockResolvedValue({
      id: 'test-1',
      type: TestType.UNIT,
      status: TestStatus.PASSED,
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      totalTests: 10,
      passedTests: 10,
      failedTests: 0,
      skippedTests: 0,
      failures: [],
      logs: [],
      artifacts: [],
      metadata: {}
    });

    mockTestRunner.generateTestSummary.mockReturnValue({
      totalSuites: 1,
      totalTests: 10,
      passedTests: 10,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 1000,
      successRate: 1,
      coverage: null,
      byType: {},
      trends: {
        successRate: 'stable',
        duration: 'stable',
        coverage: 'stable'
      }
    });
  });

  describe('generatePlanTemplate', () => {
    it('should generate a test plan template with specified test types', () => {
      const testTypes = [TestType.UNIT, TestType.INTEGRATION, TestType.E2E];
      const template = orchestrator.generatePlanTemplate('Test Project', testTypes);

      expect(template).toBeDefined();
      expect(template.name).toBe('Test Project');
      expect(template.stages).toHaveLength(3);
      expect(template.stages[0].name).toBe('Unit Tests');
      expect(template.stages[1].name).toBe('Integration Tests');
      expect(template.stages[2].name).toBe('E2e Tests');
      expect(template.qualityGates).toHaveLength(2);
      expect(template.notifications).toHaveLength(1);
    });

    it('should create stages with proper dependencies', () => {
      const testTypes = [TestType.UNIT, TestType.INTEGRATION];
      const template = orchestrator.generatePlanTemplate('Test Project', testTypes);

      expect(template.stages[0].dependencies).toHaveLength(0);
      expect(template.stages[1].dependencies).toContain('stage-unit');
    });
  });

  describe('executePlan', () => {
    it('should execute a simple test plan', async () => {
      const plan: TestExecutionPlan = {
        id: 'test-plan-1',
        name: 'Simple Test Plan',
        stages: [
          {
            id: 'unit-stage',
            name: 'Unit Tests',
            tests: [
              {
                type: TestType.UNIT,
                framework: TestFramework.VITEST,
                command: 'echo "Running unit tests"',
                workingDirectory: process.cwd(),
                environment: {},
                timeout: 30000,
                retries: 0,
                parallel: false,
                coverage: true,
                reportFormats: [],
                artifacts: []
              }
            ],
            dependencies: [],
            parallel: false,
            continueOnFailure: false,
            timeout: 60000,
            conditions: []
          }
        ],
        parallelExecution: false,
        failFast: true,
        timeout: 300000,
        retryPolicy: {
          enabled: false,
          maxAttempts: 1,
          retryOn: [],
          backoffStrategy: 'fixed',
          initialDelay: 1000,
          maxDelay: 5000
        },
        qualityGates: [],
        notifications: [],
        environment: {},
        metadata: {}
      };

      const result = await orchestrator.executePlan(plan);

      expect(result).toBeDefined();
      expect(result.planId).toBe(plan.id);
      expect(result.status).toBe(TestPlanStatus.COMPLETED);
      expect(result.stages).toHaveLength(1);
    }, 30000);

    it('should handle plan execution failure', async () => {
      // Mock a failed test result
      mockTestRunner.executeTests.mockResolvedValueOnce({
        id: 'test-1',
        type: TestType.UNIT,
        status: TestStatus.FAILED,
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        totalTests: 10,
        passedTests: 5,
        failedTests: 5,
        skippedTests: 0,
        failures: [{
          testName: 'failing test',
          testFile: 'test.ts',
          error: 'Test failed'
        }],
        logs: ['Test execution failed'],
        artifacts: [],
        metadata: {}
      });

      mockTestRunner.generateTestSummary.mockReturnValueOnce({
        totalSuites: 1,
        totalTests: 10,
        passedTests: 5,
        failedTests: 5,
        skippedTests: 0,
        totalDuration: 1000,
        successRate: 0.5,
        coverage: null,
        byType: {},
        trends: {
          successRate: 'stable',
          duration: 'stable',
          coverage: 'stable'
        }
      });

      const plan: TestExecutionPlan = {
        id: 'failing-plan',
        name: 'Failing Test Plan',
        stages: [
          {
            id: 'failing-stage',
            name: 'Failing Tests',
            tests: [
              {
                type: TestType.UNIT,
                framework: TestFramework.VITEST,
                command: 'exit 1', // This will fail
                workingDirectory: process.cwd(),
                environment: {},
                timeout: 30000,
                retries: 0,
                parallel: false,
                coverage: false,
                reportFormats: [],
                artifacts: []
              }
            ],
            dependencies: [],
            parallel: false,
            continueOnFailure: false,
            timeout: 60000,
            conditions: []
          }
        ],
        parallelExecution: false,
        failFast: true,
        timeout: 300000,
        retryPolicy: {
          enabled: false,
          maxAttempts: 1,
          retryOn: [],
          backoffStrategy: 'fixed',
          initialDelay: 1000,
          maxDelay: 5000
        },
        qualityGates: [],
        notifications: [],
        environment: {},
        metadata: {}
      };

      const result = await orchestrator.executePlan(plan);

      expect(result).toBeDefined();
      expect(result.status).toBe(TestPlanStatus.FAILED);
      expect(result.stages[0].status).toBe('failed');
    }, 30000);
  });

  describe('getPlanResult', () => {
    it('should return null for non-existent plan', () => {
      const result = orchestrator.getPlanResult('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllPlanResults', () => {
    it('should return empty array when no plans have been executed', () => {
      const results = orchestrator.getAllPlanResults();
      expect(results).toEqual([]);
    });
  });
});
