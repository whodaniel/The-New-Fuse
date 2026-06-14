import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { TestConfiguration, TestResult, TestType, TestSummaryReport } from './TestRunner.js';
import { QualityGateResult } from './QualityGateEvaluator.js';
export { TestType, TestFramework, TestStatus } from './TestRunner.js';
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
export declare enum TestPlanStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum TestStageStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped",
    CANCELLED = "cancelled"
}
/**
 * TestOrchestrator manages the execution of comprehensive test plans with multiple stages and quality gates
 */
export declare class TestOrchestrator extends EventEmitter {
    private logger;
    private testRunner;
    private qualityGateEvaluator;
    private runningPlans;
    private planResults;
    constructor(logger: Logger);
    /**
     * Execute a complete test plan
     */
    executePlan(plan: TestExecutionPlan): Promise<TestPlanResult>;
    /**
     * Cancel a running test plan
     */
    cancelPlan(executionId: string): Promise<boolean>;
    /**
     * Get test plan result
     */
    getPlanResult(executionId: string): TestPlanResult | null;
    /**
     * Get all test plan results
     */
    getAllPlanResults(): TestPlanResult[];
    /**
     * Generate test plan template
     */
    generatePlanTemplate(name: string, testTypes: TestType[]): TestExecutionPlan;
    private setupEventHandlers;
    private executeStage;
    private executeTestWithRetry;
    private shouldRetry;
    private calculateRetryDelay;
    private evaluateStageConditions;
    private evaluateCondition;
    private matchesQualityGateConditions;
    private determinePlanStatus;
    private determineStageStatus;
    private createFailedTestResult;
    private createEmptyTestSummary;
    private aggregateTestSummaries;
    private collectStageLogs;
    private collectTestLogs;
    private generateTestConfiguration;
    private getDefaultTimeout;
}
//# sourceMappingURL=TestOrchestrator.d.ts.map