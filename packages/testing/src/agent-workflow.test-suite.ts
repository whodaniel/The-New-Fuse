// Automated Testing Suite for Agent Workflows
// Comprehensive integration tests for the entire agent workflow pipeline

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

// Import services for testing (commented out - services not available)
// These would be imported from actual service packages when they exist
interface OptimizedQueueService {
  addJob(type: string, payload: any): Promise<any>;
  getQueueMetrics(): Promise<any>;
}

interface RedisCacheService {
  getAgent(id: string): Promise<any>;
  getStats(): Promise<any>;
}

interface OptimizedWebSocketService {}

interface OptimizedA2AService {
  registerAgent(agent: any): Promise<boolean>;
  unregisterAgent(id: string): Promise<void>;
  getMetrics(): Promise<any>;
  sendMessage(message: any): Promise<any>;
  broadcastMessage(message: any): Promise<any>;
}

// Mock enums and types
enum JobType {
  TASK_PROCESSING = 'task_processing',
}

enum JobPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

enum A2AMessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  STATUS_UPDATE = 'status_update',
}

enum A2APriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

interface A2AMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: A2AMessageType;
  payload: any;
  priority: A2APriority;
  timestamp: number;
  requiresResponse?: boolean;
}

// Test data interfaces
interface TestAgent {
  id: string;
  name: string;
  type: 'coordinator' | 'worker' | 'specialist';
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  maxConcurrentTasks: number;
}

interface TestWorkflow {
  id: string;
  name: string;
  description: string;
  steps: TestWorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgents: string[];
}

interface TestWorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'sequential';
  dependencies: string[];
  assignedAgent?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
}

interface TestTask {
  id: string;
  workflowId: string;
  stepId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  payload: any;
  result?: any;
  error?: string;
}

// Test scenarios
interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  verify: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export class AgentWorkflowTestSuite {
  private app: INestApplication;
  private queueService: OptimizedQueueService;
  private cacheService: RedisCacheService;
  private websocketService: OptimizedWebSocketService;
  private a2aService: OptimizedA2AService;
  private redis: Redis;

  // Test data storage
  private testAgents: Map<string, TestAgent> = new Map();
  private testWorkflows: Map<string, TestWorkflow> = new Map();
  private testTasks: Map<string, TestTask> = new Map();
  private testResults: Map<string, any> = new Map();

  // Test configuration
  private readonly testConfig = {
    timeout: 30000, // 30 seconds default timeout
    retryAttempts: 3,
    concurrentTests: 5,
    cleanupInterval: 60000, // 1 minute
  };

  constructor(
    app: INestApplication,
    queueService: OptimizedQueueService,
    cacheService: RedisCacheService,
    websocketService: OptimizedWebSocketService,
    a2aService: OptimizedA2AService,
  ) {
    this.app = app;
    this.queueService = queueService;
    this.cacheService = cacheService;
    this.websocketService = websocketService;
    this.a2aService = a2aService;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_TEST_DB || '15'), // Use separate DB for tests
    });
  }

  // Main test runner
  async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log('🚀 Starting Agent Workflow Test Suite...');

    const testScenarios = this.getTestScenarios();
    const results = [];
    let passed = 0;
    let failed = 0;

    // Setup test environment
    await this.setupTestEnvironment();

    for (const scenario of testScenarios) {
      console.log(`\n📋 Running test: ${scenario.name}`);

      try {
        const startTime = Date.now();

        // Setup
        await scenario.setup();

        // Execute
        await scenario.execute();

        // Verify
        await scenario.verify();

        // Cleanup
        await scenario.cleanup();

        const duration = Date.now() - startTime;

        results.push({
          name: scenario.name,
          status: 'PASSED',
          duration,
          description: scenario.description,
        });

        passed++;
        console.log(`✅ ${scenario.name} - PASSED (${duration}ms)`);
      } catch (error: any) {
        results.push({
          name: scenario.name,
          status: 'FAILED',
          error: error?.message || 'Unknown error',
          description: scenario.description,
        });

        failed++;
        console.log(`❌ ${scenario.name} - FAILED: ${error?.message || 'Unknown error'}`);

        // Cleanup on failure
        try {
          await scenario.cleanup();
        } catch (cleanupError: any) {
          console.log(
            `⚠️ Cleanup failed for ${scenario.name}: ${cleanupError?.message || 'Unknown error'}`,
          );
        }
      }
    }

    // Cleanup test environment
    await this.cleanupTestEnvironment();

    console.log(`\n📊 Test Suite Complete: ${passed} passed, ${failed} failed`);

    return { passed, failed, results };
  }

  // Test scenario definitions
  private getTestScenarios(): TestScenario[] {
    return [
      {
        name: 'Agent Registration and Discovery',
        description: 'Test agent registration, capability announcement, and discovery',
        setup: async () => {
          // No specific setup needed
        },
        execute: async () => {
          const agent = this.createTestAgent('coordinator');
          const registered = await this.a2aService.registerAgent({
            id: agent.id,
            type: agent.type,
            capabilities: agent.capabilities,
            maxConcurrentRequests: agent.maxConcurrentTasks,
            averageResponseTime: 100,
            reliability: 1.0,
            lastSeen: Date.now(),
            isOnline: true,
          });

          if (!registered) {
            throw new Error('Agent registration failed');
          }

          this.testAgents.set(agent.id, agent);

          // Verify agent is discoverable
          const metrics = await this.a2aService.getMetrics();
          if (metrics.onlineAgents === 0) {
            throw new Error('Agent not discoverable after registration');
          }
        },
        verify: async () => {
          // Verify agent is cached
          const agent = Array.from(this.testAgents.values())[0];
          const cachedAgent = await this.cacheService.getAgent(agent.id);
          if (!cachedAgent) {
            throw new Error('Agent not found in cache');
          }
        },
        cleanup: async () => {
          for (const agent of this.testAgents.values()) {
            await this.a2aService.unregisterAgent(agent.id);
          }
          this.testAgents.clear();
        },
      },

      {
        name: 'Simple Workflow Execution',
        description: 'Test creation and execution of a simple linear workflow',
        setup: async () => {
          // Register test agents
          const coordinator = this.createTestAgent('coordinator');
          const worker = this.createTestAgent('worker');

          await this.registerTestAgent(coordinator);
          await this.registerTestAgent(worker);

          this.testAgents.set(coordinator.id, coordinator);
          this.testAgents.set(worker.id, worker);
        },
        execute: async () => {
          const workflow = this.createTestWorkflow('simple_linear');
          this.testWorkflows.set(workflow.id, workflow);

          // Create and execute workflow tasks
          for (const step of workflow.steps) {
            const task = this.createTestTask(workflow.id, step.id);
            this.testTasks.set(task.id, task);

            // Add task to job queue
            await this.queueService.addJob(JobType.TASK_PROCESSING, {
              id: task.id,
              type: 'workflow_task',
              payload: {
                taskId: task.id,
                workflowId: workflow.id,
                stepId: step.id,
                taskType: step.type,
                input: step.input,
              },
              workflowId: workflow.id,
              priority: this.mapPriorityToNumber(task.priority),
            });
          }

          // Wait for tasks to complete
          await this.waitForWorkflowCompletion(workflow.id, 15000);
        },
        verify: async () => {
          const workflow = Array.from(this.testWorkflows.values())[0];

          // Verify all tasks completed
          for (const task of this.testTasks.values()) {
            if (task.workflowId === workflow.id && task.status !== 'completed') {
              throw new Error(`Task ${task.id} not completed. Status: ${task.status}`);
            }
          }

          // Verify workflow status
          if (workflow.status !== 'completed') {
            throw new Error(`Workflow ${workflow.id} not completed. Status: ${workflow.status}`);
          }
        },
        cleanup: async () => {
          await this.cleanupTestData();
        },
      },

      {
        name: 'Parallel Task Execution',
        description: 'Test parallel execution of multiple tasks within a workflow',
        setup: async () => {
          // Register multiple worker agents
          for (let i = 0; i < 3; i++) {
            const worker = this.createTestAgent('worker', `worker_${i}`);
            await this.registerTestAgent(worker);
            this.testAgents.set(worker.id, worker);
          }
        },
        execute: async () => {
          const workflow = this.createTestWorkflow('parallel_execution');

          // Create parallel tasks
          const parallelTasks = [];
          for (let i = 0; i < 5; i++) {
            const step: TestWorkflowStep = {
              id: `parallel_step_${i}`,
              name: `Parallel Task ${i}`,
              type: 'task',
              dependencies: [],
              status: 'pending',
              input: { data: `test_data_${i}` },
            };
            workflow.steps.push(step);

            const task = this.createTestTask(workflow.id, step.id);
            parallelTasks.push(task);
            this.testTasks.set(task.id, task);
          }

          this.testWorkflows.set(workflow.id, workflow);

          // Submit all tasks simultaneously
          const submitPromises = parallelTasks.map(task =>
            this.queueService.addJob(JobType.TASK_PROCESSING, {
              id: task.id,
              type: 'parallel_task',
              payload: {
                taskId: task.id,
                workflowId: workflow.id,
                processingTime: Math.random() * 2000 + 1000, // 1-3 seconds
              },
              workflowId: workflow.id,
              priority: JobPriority.HIGH,
            }),
          );

          await Promise.all(submitPromises);

          // Wait for all tasks to complete
          await this.waitForWorkflowCompletion(workflow.id, 20000);
        },
        verify: async () => {
          const workflow = Array.from(this.testWorkflows.values())[0];

          // Verify all parallel tasks completed
          const workflowTasks = Array.from(this.testTasks.values()).filter(
            task => task.workflowId === workflow.id,
          );

          if (workflowTasks.length !== 5) {
            throw new Error(`Expected 5 tasks, found ${workflowTasks.length}`);
          }

          const completedTasks = workflowTasks.filter(task => task.status === 'completed');
          if (completedTasks.length !== 5) {
            throw new Error(`Expected 5 completed tasks, found ${completedTasks.length}`);
          }

          // Verify parallel execution (all should start within short time window)
          const startTimes = workflowTasks.map(task => task.result?.startTime || 0);
          const maxStartTime = Math.max(...startTimes);
          const minStartTime = Math.min(...startTimes);

          if (maxStartTime - minStartTime > 5000) {
            // 5 second window
            throw new Error('Tasks did not execute in parallel');
          }
        },
        cleanup: async () => {
          await this.cleanupTestData();
        },
      },

      {
        name: 'Agent Communication Test',
        description: 'Test A2A communication between agents during workflow execution',
        setup: async () => {
          // Register coordinator and multiple workers
          const coordinator = this.createTestAgent('coordinator');
          const worker1 = this.createTestAgent('worker', 'worker_1');
          const worker2 = this.createTestAgent('worker', 'worker_2');

          await this.registerTestAgent(coordinator);
          await this.registerTestAgent(worker1);
          await this.registerTestAgent(worker2);

          this.testAgents.set(coordinator.id, coordinator);
          this.testAgents.set(worker1.id, worker1);
          this.testAgents.set(worker2.id, worker2);
        },
        execute: async () => {
          const coordinator = Array.from(this.testAgents.values()).find(
            agent => agent.type === 'coordinator',
          );
          const workers = Array.from(this.testAgents.values()).filter(
            agent => agent.type === 'worker',
          );

          if (!coordinator) {
            throw new Error('No coordinator agent found');
          }

          // Coordinator sends task assignments to workers
          const messagePromises = workers.map(worker => {
            const message: A2AMessage = {
              id: uuidv4(),
              fromAgent: coordinator.id,
              toAgent: worker.id,
              type: A2AMessageType.TASK_ASSIGNMENT,
              payload: {
                taskId: uuidv4(),
                taskType: 'data_processing',
                data: { chunk: Math.random() },
              },
              priority: A2APriority.HIGH,
              timestamp: Date.now(),
              requiresResponse: true,
            };

            return this.a2aService.sendMessage(message);
          });

          const responses = await Promise.all(messagePromises);

          // Verify all messages sent successfully
          for (const response of responses) {
            if (!response.success) {
              throw new Error(`Message failed: ${response.error}`);
            }
          }

          // Test broadcast message
          const broadcastMessage: A2AMessage = {
            id: uuidv4(),
            fromAgent: coordinator.id,
            toAgent: '*',
            type: A2AMessageType.STATUS_UPDATE,
            payload: { status: 'workflow_started' },
            priority: A2APriority.MEDIUM,
            timestamp: Date.now(),
          };

          const broadcastResponses = await this.a2aService.broadcastMessage(broadcastMessage);

          if (broadcastResponses.length !== workers.length) {
            throw new Error(
              `Expected ${workers.length} broadcast responses, got ${broadcastResponses.length}`,
            );
          }
        },
        verify: async () => {
          // Verify A2A metrics
          const metrics = await this.a2aService.getMetrics();

          if (metrics.messagesSent === 0) {
            throw new Error('No messages recorded in A2A metrics');
          }

          if (metrics.onlineAgents !== this.testAgents.size) {
            throw new Error(
              `Expected ${this.testAgents.size} online agents, found ${metrics.onlineAgents}`,
            );
          }
        },
        cleanup: async () => {
          await this.cleanupTestData();
        },
      },

      {
        name: 'Error Handling and Recovery',
        description: 'Test error handling, retries, and recovery mechanisms',
        setup: async () => {
          const coordinator = this.createTestAgent('coordinator');
          const worker = this.createTestAgent('worker');

          await this.registerTestAgent(coordinator);
          await this.registerTestAgent(worker);

          this.testAgents.set(coordinator.id, coordinator);
          this.testAgents.set(worker.id, worker);
        },
        execute: async () => {
          const workflow = this.createTestWorkflow('error_recovery');
          this.testWorkflows.set(workflow.id, workflow);

          // Create a task designed to fail initially
          const failingTask = this.createTestTask(workflow.id, 'failing_step');
          failingTask.payload = { shouldFail: true, attemptCount: 0 };
          this.testTasks.set(failingTask.id, failingTask);

          // Submit the failing task
          await this.queueService.addJob(JobType.TASK_PROCESSING, {
            id: failingTask.id,
            type: 'error_test_task',
            payload: failingTask.payload,
            workflowId: workflow.id,
            priority: JobPriority.HIGH,
          });

          // Wait for retries and eventual success
          await this.waitForTaskCompletion(failingTask.id, 25000);
        },
        verify: async () => {
          const task = Array.from(this.testTasks.values())[0];

          // Task should eventually succeed after retries
          if (task.status !== 'completed') {
            throw new Error(`Task should have completed after retries. Status: ${task.status}`);
          }

          // Should have retry attempts recorded
          if (!task.result?.retryCount || task.result.retryCount < 1) {
            throw new Error('Task should have retry attempts recorded');
          }
        },
        cleanup: async () => {
          await this.cleanupTestData();
        },
      },

      {
        name: 'Load and Performance Test',
        description: 'Test system performance under load with multiple concurrent workflows',
        setup: async () => {
          // Register multiple agents
          for (let i = 0; i < 5; i++) {
            const agent = this.createTestAgent('worker', `load_worker_${i}`);
            await this.registerTestAgent(agent);
            this.testAgents.set(agent.id, agent);
          }
        },
        execute: async () => {
          const startTime = Date.now();
          const workflowPromises = [];

          // Create multiple concurrent workflows
          for (let i = 0; i < 10; i++) {
            const workflow = this.createTestWorkflow('load_test', `load_workflow_${i}`);
            this.testWorkflows.set(workflow.id, workflow);

            // Create tasks for each workflow
            const workflowPromise = this.executeLoadTestWorkflow(workflow);
            workflowPromises.push(workflowPromise);
          }

          // Wait for all workflows to complete
          await Promise.all(workflowPromises);

          const totalDuration = Date.now() - startTime;
          this.testResults.set('load_test_duration', totalDuration);
        },
        verify: async () => {
          const duration = this.testResults.get('load_test_duration');

          // Should complete within reasonable time (60 seconds)
          if (duration > 60000) {
            throw new Error(`Load test took too long: ${duration}ms`);
          }

          // Verify all workflows completed
          for (const workflow of this.testWorkflows.values()) {
            if (workflow.status !== 'completed') {
              throw new Error(`Workflow ${workflow.id} not completed: ${workflow.status}`);
            }
          }

          // Check system metrics
          const queueMetrics = await this.queueService.getQueueMetrics();
          const cacheStats = await this.cacheService.getStats();

          // Cache hit rate should be reasonable
          if (cacheStats.hitRate < 50) {
            console.warn(`Low cache hit rate during load test: ${cacheStats.hitRate}%`);
          }
        },
        cleanup: async () => {
          await this.cleanupTestData();
        },
      },
    ];
  }

  // Helper methods
  private createTestAgent(
    type: 'coordinator' | 'worker' | 'specialist',
    suffix?: string,
  ): TestAgent {
    const id = `test_${type}_${suffix || uuidv4().slice(0, 8)}`;

    const capabilityMap = {
      coordinator: ['workflow_management', 'task_coordination', 'resource_allocation'],
      worker: ['task_execution', 'data_processing', 'computation'],
      specialist: ['analysis', 'optimization', 'validation'],
    };

    return {
      id,
      name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} ${suffix || ''}`,
      type,
      capabilities: capabilityMap[type],
      status: 'online',
      maxConcurrentTasks: type === 'coordinator' ? 10 : 5,
    };
  }

  private createTestWorkflow(type: string, suffix?: string): TestWorkflow {
    const id = `test_workflow_${type}_${suffix || uuidv4().slice(0, 8)}`;

    const stepTemplates: { [key: string]: any[] } = {
      simple_linear: [
        { name: 'Initialize', type: 'task', dependencies: [] },
        { name: 'Process', type: 'task', dependencies: ['Initialize'] },
        { name: 'Finalize', type: 'task', dependencies: ['Process'] },
      ],
      parallel_execution: [],
      error_recovery: [{ name: 'Failing Step', type: 'task', dependencies: [] }],
      load_test: [
        { name: 'Quick Task 1', type: 'task', dependencies: [] },
        { name: 'Quick Task 2', type: 'task', dependencies: [] },
        { name: 'Quick Task 3', type: 'task', dependencies: ['Quick Task 1', 'Quick Task 2'] },
      ],
    };

    const steps = (stepTemplates[type] || []).map((template: any, index: number) => ({
      id: `step_${index}`,
      name: template.name,
      type: template.type as any,
      dependencies: template.dependencies,
      status: 'pending' as const,
      input: { stepIndex: index },
    }));

    return {
      id,
      name: `Test Workflow - ${type}`,
      description: `Test workflow for ${type} scenario`,
      steps,
      status: 'pending',
      assignedAgents: [],
    };
  }

  private createTestTask(workflowId: string, stepId: string): TestTask {
    return {
      id: `test_task_${uuidv4().slice(0, 8)}`,
      workflowId,
      stepId,
      type: 'test_task',
      priority: 'medium',
      status: 'pending',
      payload: {
        workflowId,
        stepId,
        timestamp: Date.now(),
      },
    };
  }

  private async registerTestAgent(agent: TestAgent): Promise<void> {
    await this.a2aService.registerAgent({
      id: agent.id,
      type: agent.type as any,
      capabilities: agent.capabilities,
      maxConcurrentRequests: agent.maxConcurrentTasks,
      averageResponseTime: 100 + Math.random() * 100,
      reliability: 0.95 + Math.random() * 0.05,
      lastSeen: Date.now(),
      isOnline: true,
    });
  }

  private async waitForWorkflowCompletion(workflowId: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const workflow = this.testWorkflows.get(workflowId);
      if (!workflow) break;

      const workflowTasks = Array.from(this.testTasks.values()).filter(
        task => task.workflowId === workflowId,
      );

      const completedTasks = workflowTasks.filter(task => task.status === 'completed');
      const failedTasks = workflowTasks.filter(task => task.status === 'failed');

      if (failedTasks.length > 0) {
        workflow.status = 'failed';
        throw new Error(`Workflow ${workflowId} failed due to task failures`);
      }

      if (completedTasks.length === workflowTasks.length && workflowTasks.length > 0) {
        workflow.status = 'completed';
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Workflow ${workflowId} did not complete within ${timeout}ms`);
  }

  private async waitForTaskCompletion(taskId: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const task = this.testTasks.get(taskId);
      if (!task) break;

      if (task.status === 'completed') {
        return;
      }

      if (task.status === 'failed') {
        throw new Error(`Task ${taskId} failed`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Task ${taskId} did not complete within ${timeout}ms`);
  }

  private async executeLoadTestWorkflow(workflow: TestWorkflow): Promise<void> {
    // Submit all tasks for the workflow
    const taskPromises = workflow.steps.map(async step => {
      const task = this.createTestTask(workflow.id, step.id);
      this.testTasks.set(task.id, task);

      return this.queueService.addJob(JobType.TASK_PROCESSING, {
        id: task.id,
        type: 'load_test_task',
        payload: {
          taskId: task.id,
          workflowId: workflow.id,
          processingTime: Math.random() * 1000 + 500, // 0.5-1.5 seconds
        },
        workflowId: workflow.id,
        priority: JobPriority.MEDIUM,
      });
    });

    await Promise.all(taskPromises);
    await this.waitForWorkflowCompletion(workflow.id, 30000);
  }

  private mapPriorityToNumber(priority: string): number {
    const mapping: { [key: string]: JobPriority } = {
      critical: JobPriority.CRITICAL,
      high: JobPriority.HIGH,
      medium: JobPriority.MEDIUM,
      low: JobPriority.LOW,
    };
    return mapping[priority] || JobPriority.MEDIUM;
  }

  private async setupTestEnvironment(): Promise<void> {
    // Clear test database
    await this.redis.flushdb();

    // Initialize test data structures
    this.testAgents.clear();
    this.testWorkflows.clear();
    this.testTasks.clear();
    this.testResults.clear();

    console.log('🔧 Test environment setup complete');
  }

  private async cleanupTestData(): Promise<void> {
    // Unregister all test agents
    for (const agent of this.testAgents.values()) {
      try {
        await this.a2aService.unregisterAgent(agent.id);
      } catch (error: any) {
        // Ignore cleanup errors
      }
    }

    // Clear test data
    this.testAgents.clear();
    this.testWorkflows.clear();
    this.testTasks.clear();
  }

  private async cleanupTestEnvironment(): Promise<void> {
    await this.cleanupTestData();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    console.log('🧹 Test environment cleanup complete');
  }

  // Utility method for manual test execution
  async runSingleTest(testName: string): Promise<any> {
    const scenarios = this.getTestScenarios();
    const scenario = scenarios.find(s => s.name === testName);

    if (!scenario) {
      throw new Error(`Test scenario '${testName}' not found`);
    }

    await this.setupTestEnvironment();

    try {
      await scenario.setup();
      await scenario.execute();
      await scenario.verify();
      await scenario.cleanup();

      return { status: 'PASSED', scenario: scenario.name };
    } catch (error: any) {
      await scenario.cleanup();
      return {
        status: 'FAILED',
        scenario: scenario.name,
        error: error?.message || 'Unknown error',
      };
    } finally {
      await this.cleanupTestEnvironment();
    }
  }
}
