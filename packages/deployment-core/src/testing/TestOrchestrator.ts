import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { TestRunner, TestConfiguration, TestResult, TestType, TestFramework, TestSummaryReport, TestStatus } from './TestRunner';
import { QualityGateEvaluator, QualityGateResult } from './QualityGateEvaluator';

// Re-export commonly used types from TestRunner for convenience
export { TestType, TestFramework, TestStatus } from './TestRunner';

/**
 * Test execution plan interface
 */
export interface TestExecutionPlan {
  id: string;
  name: string;
  description?: string;
  stages: TestStage[];
  parallelExecution: boolean;
  failFast: boolean;
  timeout: number;
  retryPolicy: TestRetryPolicy;
  qualityGates: QualityGateConfig[];
  notifications: TestNotificationConfig[];
  environment: Record<string, string>;
  metadata: Record<string, any>;
}

export interface TestStage {
  id: string;
  name: string;
  description?: string;
  tests: TestConfiguration[];
  dependencies: string[];
  parallel: boolean;
  continueOnFailure: boolean;
  timeout: number;
  conditions: TestStageCondition[];
}

export interface TestStageCondition {
  type: 'environment' | 'branch' | 'previous_stage' | 'variable';
  operator: 'equals' | 'not_equals' | 'contains' | 'matches';
  value: string;
}

export interface TestRetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  retryOn: TestRetryCondition[];
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface TestRetryCondition {
  type: 'failure' | 'timeout' | 'infrastructure_error' | 'flaky_test';
  pattern?: string;
}

export interface QualityGateConfig {
  id: string;
  name: string;
  type: 'coverage' | 'success_rate' | 'performance' | 'security' | 'custom';
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  required: boolean;
  failureBehavior: 'fail' | 'warn' | 'ignore';
  scope: 'stage' | 'plan' | 'test_type';
  conditions: QualityGateCondition[];
}

export interface QualityGateCondition {
  type: 'test_type' | 'stage' | 'environment';
  value: string;
}

export interface TestNotificationConfig {
  enabled: boolean;
  events: TestNotificationEvent[];
  channels: TestNotificationChannel[];
  conditions: TestNotificationCondition[];
}

export interface TestNotificationEvent {
  type: 'plan_start' | 'plan_complete' | 'plan_failed' | 'stage_complete' | 'stage_failed' | 'quality_gate_failed';
  enabled: boolean;
}

export interface TestNotificationChannel {
  type: 'slack' | 'email' | 'webhook';
  configuration: Record<string, any>;
  recipients: string[];
}

export interface TestNotificationCondition {
  type: 'stage' | 'test_type' | 'success_rate' | 'duration';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string | number;
}

/**
 * Test execution result interfaces
 */
export interface TestPlanResult {
  id: string;
  planId: string;
  status: TestPlanStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  stages: TestStageResult[];
  summary: TestSummaryReport;
  qualityGates: QualityGateResult[];
  logs: string[];
  metadata: Record<string, any>;
  error?: string;
}

export interface TestStageResult {
  id: string;
  stageId: string;
  name: string;
  status: TestStageStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  tests: TestResult[];
  summary: TestSummaryReport;
  logs: string[];
  error?: string;
}

export enum TestPlanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TestStageStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled'
}

/**
 * TestOrchestrator manages the execution of comprehensive test plans with multiple stages and quality gates
 */
export class TestOrchestrator extends EventEmitter {
  private logger: Logger;
  private testRunner: TestRunner;
  private qualityGateEvaluator: QualityGateEvaluator;
  private runningPlans: Map<string, TestPlanExecution> = new Map();
  private planResults: Map<string, TestPlanResult> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.testRunner = new TestRunner(logger);
    this.qualityGateEvaluator = new QualityGateEvaluator(logger);

    this.setupEventHandlers();
  }

  /**
   * Execute a complete test plan
   */
  async executePlan(plan: TestExecutionPlan): Promise<TestPlanResult> {
    const executionId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    this.logger.info(`Starting test plan execution: ${plan.name}`, {
      planId: plan.id,
      executionId,
      stages: plan.stages.length
    });

    const execution: TestPlanExecution = {
      id: executionId,
      planId: plan.id,
      status: TestPlanStatus.RUNNING,
      startTime,
      stages: [],
      currentStageIndex: 0
    };

    this.runningPlans.set(executionId, execution);

    try {
      // Emit plan start event
      this.emit('plan:start', { executionId, plan });

      // Execute stages
      const stageResults: TestStageResult[] = [];

      for (let i = 0; i < plan.stages.length; i++) {
        const stage = plan.stages[i];
        execution.currentStageIndex = i;

        this.logger.info(`Executing test stage: ${stage.name}`, {
          planId: plan.id,
          executionId,
          stageId: stage.id,
          stageIndex: i
        });

        // Check stage conditions
        if (!await this.evaluateStageConditions(stage, stageResults, plan)) {
          this.logger.info(`Stage ${stage.name} skipped due to conditions`, {
            planId: plan.id,
            executionId,
            stageId: stage.id
          });

          const skippedResult: TestStageResult = {
            id: `stage-${Date.now()}`,
            stageId: stage.id,
            name: stage.name,
            status: TestStageStatus.SKIPPED,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            tests: [],
            summary: this.createEmptyTestSummary(),
            logs: ['Stage skipped due to conditions']
          };

          stageResults.push(skippedResult);
          continue;
        }

        // Execute stage
        const stageResult = await this.executeStage(stage, plan, executionId);
        stageResults.push(stageResult);
        execution.stages.push(stageResult);

        // Evaluate quality gates for this stage
        const stageQualityGates = plan.qualityGates.filter(qg =>
          qg.scope === 'stage' && this.matchesQualityGateConditions(qg, { stage: stage.name })
        );

        for (const qualityGate of stageQualityGates) {
          const gateResult = await this.qualityGateEvaluator.evaluate(qualityGate, stageResult.summary);

          if (!gateResult.passed && qualityGate.required) {
            this.logger.error(`Quality gate failed: ${qualityGate.name}`, {
              planId: plan.id,
              executionId,
              stageId: stage.id,
              gate: qualityGate.name,
              threshold: qualityGate.threshold,
              actualValue: gateResult.actualValue
            });

            if (qualityGate.failureBehavior === 'fail') {
              throw new Error(`Quality gate failed: ${qualityGate.name}`);
            }
          }
        }

        // Check if stage failed and should stop execution
        if (stageResult.status === TestStageStatus.FAILED) {
          if (plan.failFast && !stage.continueOnFailure) {
            this.logger.error(`Stage ${stage.name} failed, stopping execution (fail fast enabled)`, {
              planId: plan.id,
              executionId,
              stageId: stage.id
            });
            break;
          }
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Create overall summary
      const overallSummary = this.aggregateTestSummaries(stageResults.map(s => s.summary));

      // Evaluate plan-level quality gates
      const planQualityGates = plan.qualityGates.filter(qg => qg.scope === 'plan');
      const qualityGateResults: QualityGateResult[] = [];

      for (const qualityGate of planQualityGates) {
        const gateResult = await this.qualityGateEvaluator.evaluate(qualityGate, overallSummary);
        qualityGateResults.push(gateResult);

        if (!gateResult.passed && qualityGate.required && qualityGate.failureBehavior === 'fail') {
          throw new Error(`Plan-level quality gate failed: ${qualityGate.name}`);
        }
      }

      // Determine overall status
      const overallStatus = this.determinePlanStatus(stageResults, qualityGateResults);
      execution.status = overallStatus;

      const planResult: TestPlanResult = {
        id: executionId,
        planId: plan.id,
        status: overallStatus,
        startTime,
        endTime,
        duration,
        stages: stageResults,
        summary: overallSummary,
        qualityGates: qualityGateResults,
        logs: this.collectStageLogs(stageResults),
        metadata: {
          totalStages: plan.stages.length,
          executedStages: stageResults.filter(s => s.status !== TestStageStatus.SKIPPED).length,
          parallelExecution: plan.parallelExecution,
          failFast: plan.failFast
        }
      };

      // Store result
      this.planResults.set(executionId, planResult);

      // Emit completion event
      this.emit('plan:complete', { executionId, plan, result: planResult });

      this.logger.info(`Test plan execution completed: ${plan.name}`, {
        planId: plan.id,
        executionId,
        status: overallStatus,
        duration,
        totalTests: overallSummary.totalTests,
        passedTests: overallSummary.passedTests,
        failedTests: overallSummary.failedTests
      });

      return planResult;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      execution.status = TestPlanStatus.FAILED;

      this.logger.error(`Test plan execution failed: ${plan.name}`, {
        planId: plan.id,
        executionId,
        error: error.message,
        stack: error.stack
      });

      const failedResult: TestPlanResult = {
        id: executionId,
        planId: plan.id,
        status: TestPlanStatus.FAILED,
        startTime,
        endTime,
        duration,
        stages: execution.stages,
        summary: this.createEmptyTestSummary(),
        qualityGates: [],
        logs: [error.message],
        metadata: { error: error.message },
        error: error.message
      };

      this.planResults.set(executionId, failedResult);
      this.emit('plan:failed', { executionId, plan, result: failedResult, error });

      return failedResult;

    } finally {
      this.runningPlans.delete(executionId);
    }
  }

  /**
   * Cancel a running test plan
   */
  async cancelPlan(executionId: string): Promise<boolean> {
    const execution = this.runningPlans.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      execution.status = TestPlanStatus.CANCELLED;

      // Cancel any running tests
      // This would require tracking individual test executions

      this.logger.info(`Test plan cancelled: ${executionId}`);
      this.emit('plan:cancelled', { executionId });

      return true;

    } catch (error) {
      this.logger.error(`Failed to cancel test plan: ${executionId}`, {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get test plan result
   */
  getPlanResult(executionId: string): TestPlanResult | null {
    return this.planResults.get(executionId) || null;
  }

  /**
   * Get all test plan results
   */
  getAllPlanResults(): TestPlanResult[] {
    return Array.from(this.planResults.values());
  }

  /**
   * Generate test plan template
   */
  generatePlanTemplate(name: string, testTypes: TestType[]): TestExecutionPlan {
    const stages: TestStage[] = testTypes.map((testType, index) => ({
      id: `stage-${testType}`,
      name: `${testType.charAt(0).toUpperCase() + testType.slice(1)} Tests`,
      description: `Execute ${testType} tests`,
      tests: [this.generateTestConfiguration(testType)],
      dependencies: index > 0 ? [`stage-${testTypes[index - 1]}`] : [],
      parallel: false,
      continueOnFailure: testType !== TestType.UNIT, // Fail fast on unit tests
      timeout: this.getDefaultTimeout(testType),
      conditions: []
    }));

    return {
      id: `plan-${Date.now()}`,
      name,
      description: `Comprehensive test plan for ${name}`,
      stages,
      parallelExecution: false,
      failFast: true,
      timeout: 3600000, // 1 hour
      retryPolicy: {
        enabled: true,
        maxAttempts: 2,
        retryOn: [
          { type: 'infrastructure_error' },
          { type: 'flaky_test' }
        ],
        backoffStrategy: 'exponential',
        initialDelay: 5000,
        maxDelay: 30000
      },
      qualityGates: [
        {
          id: 'coverage-gate',
          name: 'Test Coverage',
          type: 'coverage',
          threshold: 80,
          operator: 'greater_than',
          required: true,
          failureBehavior: 'fail',
          scope: 'plan',
          conditions: []
        },
        {
          id: 'success-rate-gate',
          name: 'Success Rate',
          type: 'success_rate',
          threshold: 95,
          operator: 'greater_than',
          required: true,
          failureBehavior: 'fail',
          scope: 'plan',
          conditions: []
        }
      ],
      notifications: [
        {
          enabled: true,
          events: [
            { type: 'plan_start', enabled: true },
            { type: 'plan_complete', enabled: true },
            { type: 'plan_failed', enabled: true },
            { type: 'quality_gate_failed', enabled: true }
          ],
          channels: [
            {
              type: 'slack',
              configuration: {
                webhookUrl: '${SLACK_WEBHOOK_URL}',
                channel: '#testing'
              },
              recipients: []
            }
          ],
          conditions: []
        }
      ],
      environment: {},
      metadata: {
        createdAt: new Date().toISOString(),
        testTypes
      }
    };
  }

  // Private helper methods

  private setupEventHandlers(): void {
    this.testRunner.on('test:complete', (data) => {
      this.emit('test:complete', data);
    });

    this.testRunner.on('test:failed', (data) => {
      this.emit('test:failed', data);
    });
  }

  private async executeStage(
    stage: TestStage,
    plan: TestExecutionPlan,
    executionId: string
  ): Promise<TestStageResult> {
    const stageStartTime = new Date();
    const stageId = `${executionId}-${stage.id}`;

    this.logger.info(`Executing test stage: ${stage.name}`, {
      stageId,
      tests: stage.tests.length,
      parallel: stage.parallel
    });

    try {
      const testResults: TestResult[] = [];

      if (stage.parallel) {
        // Execute tests in parallel
        const testPromises = stage.tests.map(testConfig =>
          this.executeTestWithRetry(testConfig, plan.retryPolicy)
        );

        const results = await Promise.allSettled(testPromises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            testResults.push(result.value);
          } else {
            // Create a failed test result
            testResults.push(this.createFailedTestResult(
              stage.tests[index],
              result.reason.message
            ));
          }
        });

      } else {
        // Execute tests sequentially
        for (const testConfig of stage.tests) {
          try {
            const testResult = await this.executeTestWithRetry(testConfig, plan.retryPolicy);
            testResults.push(testResult);

            // Check if test failed and stage should not continue
            if (testResult.status === 'failed' && !stage.continueOnFailure) {
              break;
            }

          } catch (error) {
            const failedResult = this.createFailedTestResult(testConfig, error.message);
            testResults.push(failedResult);

            if (!stage.continueOnFailure) {
              break;
            }
          }
        }
      }

      const stageEndTime = new Date();
      const stageDuration = stageEndTime.getTime() - stageStartTime.getTime();

      // Create stage summary
      const stageSummary = this.testRunner.generateTestSummary(testResults);

      // Determine stage status
      const stageStatus = this.determineStageStatus(testResults);

      return {
        id: stageId,
        stageId: stage.id,
        name: stage.name,
        status: stageStatus,
        startTime: stageStartTime,
        endTime: stageEndTime,
        duration: stageDuration,
        tests: testResults,
        summary: stageSummary,
        logs: this.collectTestLogs(testResults)
      };

    } catch (error) {
      const stageEndTime = new Date();
      const stageDuration = stageEndTime.getTime() - stageStartTime.getTime();

      return {
        id: stageId,
        stageId: stage.id,
        name: stage.name,
        status: TestStageStatus.FAILED,
        startTime: stageStartTime,
        endTime: stageEndTime,
        duration: stageDuration,
        tests: [],
        summary: this.createEmptyTestSummary(),
        logs: [error.message],
        error: error.message
      };
    }
  }

  private async executeTestWithRetry(
    testConfig: TestConfiguration,
    retryPolicy: TestRetryPolicy
  ): Promise<TestResult> {
    let lastResult: TestResult | null = null;
    let attempt = 1;

    while (attempt <= (retryPolicy.enabled ? retryPolicy.maxAttempts : 1)) {
      try {
        const result = await this.testRunner.executeTests(testConfig);

        // Check if retry is needed
        if (result.status === 'passed' || !this.shouldRetry(result, retryPolicy)) {
          return result;
        }

        lastResult = result;

        if (attempt < retryPolicy.maxAttempts) {
          const delay = this.calculateRetryDelay(retryPolicy, attempt);
          this.logger.info(`Retrying test after failure (attempt ${attempt + 1}/${retryPolicy.maxAttempts})`, {
            testType: testConfig.type,
            delay
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }

        attempt++;

      } catch (error) {
        if (attempt >= retryPolicy.maxAttempts) {
          throw error;
        }

        const delay = this.calculateRetryDelay(retryPolicy, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    return lastResult || this.createFailedTestResult(testConfig, 'Max retry attempts exceeded');
  }

  private shouldRetry(result: TestResult, retryPolicy: TestRetryPolicy): boolean {
    if (!retryPolicy.enabled) {
      return false;
    }

    return retryPolicy.retryOn.some(condition => {
      switch (condition.type) {
        case 'failure':
          return result.status === 'failed';
        case 'timeout':
          return result.logs.some(log => log.includes('timeout'));
        case 'infrastructure_error':
          return result.logs.some(log =>
            log.includes('ECONNREFUSED') ||
            log.includes('network') ||
            log.includes('infrastructure')
          );
        case 'flaky_test':
          return result.failures.some(failure =>
            failure.error.includes('flaky') ||
            failure.error.includes('intermittent')
          );
        default:
          return false;
      }
    });
  }

  private calculateRetryDelay(retryPolicy: TestRetryPolicy, attempt: number): number {
    switch (retryPolicy.backoffStrategy) {
      case 'linear':
        return Math.min(retryPolicy.initialDelay * attempt, retryPolicy.maxDelay);
      case 'exponential':
        return Math.min(retryPolicy.initialDelay * Math.pow(2, attempt - 1), retryPolicy.maxDelay);
      case 'fixed':
      default:
        return retryPolicy.initialDelay;
    }
  }

  private async evaluateStageConditions(
    stage: TestStage,
    previousStages: TestStageResult[],
    plan: TestExecutionPlan
  ): Promise<boolean> {
    for (const condition of stage.conditions) {
      const result = await this.evaluateCondition(condition, { previousStages, plan });
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(
    condition: TestStageCondition,
    context: { previousStages: TestStageResult[]; plan: TestExecutionPlan }
  ): Promise<boolean> {
    switch (condition.type) {
      case 'environment':
        const envValue = process.env[condition.value] || context.plan.environment[condition.value];
        return condition.operator === 'equals' ? !!envValue : !envValue;

      case 'previous_stage':
        const previousStage = context.previousStages.find(s => s.name === condition.value);
        return previousStage?.status === TestStageStatus.COMPLETED;

      case 'branch':
        const currentBranch = process.env.GIT_BRANCH || 'main';
        return condition.operator === 'equals' ?
          currentBranch === condition.value :
          currentBranch !== condition.value;

      default:
        return true;
    }
  }

  private matchesQualityGateConditions(
    qualityGate: QualityGateConfig,
    context: { stage?: string; testType?: string }
  ): boolean {
    return qualityGate.conditions.every(condition => {
      switch (condition.type) {
        case 'stage':
          return context.stage === condition.value;
        case 'test_type':
          return context.testType === condition.value;
        default:
          return true;
      }
    });
  }

  private determinePlanStatus(
    stageResults: TestStageResult[],
    qualityGateResults: QualityGateResult[]
  ): TestPlanStatus {
    const hasFailedStages = stageResults.some(s => s.status === TestStageStatus.FAILED);
    const hasFailedQualityGates = qualityGateResults.some(qg => !qg.passed && qg.required);

    if (hasFailedStages || hasFailedQualityGates) {
      return TestPlanStatus.FAILED;
    }

    const allCompleted = stageResults.every(s =>
      s.status === TestStageStatus.COMPLETED || s.status === TestStageStatus.SKIPPED
    );

    return allCompleted ? TestPlanStatus.COMPLETED : TestPlanStatus.RUNNING;
  }

  private determineStageStatus(testResults: TestResult[]): TestStageStatus {
    if (testResults.length === 0) {
      return TestStageStatus.COMPLETED;
    }

    const hasFailures = testResults.some(t => t.status === 'failed');
    const hasCancelled = testResults.some(t => t.status === 'cancelled');

    if (hasCancelled) {
      return TestStageStatus.CANCELLED;
    }

    if (hasFailures) {
      return TestStageStatus.FAILED;
    }

    return TestStageStatus.COMPLETED;
  }

  private createFailedTestResult(testConfig: TestConfiguration, error: string): TestResult {
    const now = new Date();
    return {
      id: `failed-${Date.now()}`,
      type: testConfig.type,
      status: TestStatus.FAILED,
      startTime: now,
      endTime: now,
      duration: 0,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      skippedTests: 0,
      failures: [{
        testName: 'Test Execution',
        testFile: 'unknown',
        error
      }],
      logs: [error],
      artifacts: [],
      metadata: { error }
    };
  }

  private createEmptyTestSummary(): TestSummaryReport {
    return {
      totalSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      successRate: 0,
      coverage: null,
      byType: {},
      trends: {
        successRate: 'stable',
        duration: 'stable',
        coverage: 'stable'
      }
    };
  }

  private aggregateTestSummaries(summaries: TestSummaryReport[]): TestSummaryReport {
    const aggregated = this.createEmptyTestSummary();

    summaries.forEach(summary => {
      aggregated.totalSuites += summary.totalSuites;
      aggregated.totalTests += summary.totalTests;
      aggregated.passedTests += summary.passedTests;
      aggregated.failedTests += summary.failedTests;
      aggregated.skippedTests += summary.skippedTests;
      aggregated.totalDuration += summary.totalDuration;

      // Merge by type
      Object.entries(summary.byType).forEach(([type, stats]) => {
        if (!aggregated.byType[type]) {
          aggregated.byType[type] = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: 0,
            successRate: 0
          };
        }

        const typeStats = aggregated.byType[type];
        typeStats.totalTests += stats.totalTests;
        typeStats.passedTests += stats.passedTests;
        typeStats.failedTests += stats.failedTests;
        typeStats.skippedTests += stats.skippedTests;
        typeStats.duration += stats.duration;
      });
    });

    // Calculate success rate
    aggregated.successRate = aggregated.totalTests > 0 ?
      aggregated.passedTests / aggregated.totalTests : 0;

    // Calculate success rates by type
    Object.values(aggregated.byType).forEach(typeStats => {
      typeStats.successRate = typeStats.totalTests > 0 ?
        typeStats.passedTests / typeStats.totalTests : 0;
    });

    return aggregated;
  }

  private collectStageLogs(stageResults: TestStageResult[]): string[] {
    const logs: string[] = [];
    stageResults.forEach(stage => {
      logs.push(...stage.logs);
    });
    return logs;
  }

  private collectTestLogs(testResults: TestResult[]): string[] {
    const logs: string[] = [];
    testResults.forEach(test => {
      logs.push(...test.logs);
    });
    return logs;
  }

  private generateTestConfiguration(testType: TestType): TestConfiguration {
    const baseConfig = {
      type: testType,
      workingDirectory: process.cwd(),
      environment: {},
      timeout: this.getDefaultTimeout(testType),
      retries: 0,
      parallel: false,
      coverage: testType === TestType.UNIT,
      reportFormats: ['junit', 'json'] as any[],
      artifacts: [
        {
          name: 'test-results',
          path: 'test-results/',
          type: 'report' as const,
          enabled: true
        }
      ]
    };

    switch (testType) {
      case TestType.UNIT:
        return {
          ...baseConfig,
          framework: TestFramework.VITEST,
          command: 'npm run test:unit',
          coverageThreshold: {
            lines: 80,
            functions: 80,
            branches: 70,
            statements: 80
          }
        };

      case TestType.INTEGRATION:
        return {
          ...baseConfig,
          framework: TestFramework.VITEST,
          command: 'npm run test:integration',
          timeout: 300000 // 5 minutes
        };

      case TestType.E2E:
        return {
          ...baseConfig,
          framework: TestFramework.PLAYWRIGHT,
          command: 'npm run test:e2e',
          timeout: 600000, // 10 minutes
          artifacts: [
            ...baseConfig.artifacts,
            {
              name: 'screenshots',
              path: 'test-results/screenshots/',
              type: 'screenshot' as const,
              enabled: true
            },
            {
              name: 'videos',
              path: 'test-results/videos/',
              type: 'video' as const,
              enabled: true
            }
          ]
        };

      default:
        return {
          ...baseConfig,
          framework: TestFramework.JEST,
          command: 'npm test'
        };
    }
  }

  private getDefaultTimeout(testType: TestType): number {
    switch (testType) {
      case TestType.UNIT:
        return 60000; // 1 minute
      case TestType.INTEGRATION:
        return 300000; // 5 minutes
      case TestType.E2E:
        return 600000; // 10 minutes
      case TestType.PERFORMANCE:
        return 1800000; // 30 minutes
      default:
        return 180000; // 3 minutes
    }
  }
}

// Internal interfaces
interface TestPlanExecution {
  id: string;
  planId: string;
  status: TestPlanStatus;
  startTime: Date;
  stages: TestStageResult[];
  currentStageIndex: number;
}
