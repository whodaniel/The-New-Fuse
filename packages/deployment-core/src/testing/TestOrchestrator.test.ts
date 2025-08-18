import { describe, it, expect, beforeEach } from 'vitest';
import { TestOrchestrator, TestExecutionPlan, TestType, TestPlanStatus } from './TestOrchestrator';
import { TestFramework } from './TestRunner';
import winston from 'winston';

describe('TestOrchestrator', () => {
  let orchestrator: TestOrchestrator;
  let mockLogger: winston.Logger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = winston.createLogger({
      level: 'error',
      transports: [new winston.transports.Console({ silent: true })]
    });

    orchestrator = new TestOrchestrator(mockLogger);
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
    });

    it('should handle plan execution failure', async () => {
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
    });
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