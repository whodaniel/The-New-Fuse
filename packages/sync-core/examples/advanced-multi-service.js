/**
 * Advanced Multi-Service Integration Example
 *
 * Shows complex scenarios with multiple services coordinating
 * through sync-core for distributed workflows.
 */
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var _a;
import { Injectable } from '@nestjs/common';
import { ConflictManager } from '../src/services/ConflictManager';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
import { TaskSynchronizationService } from '../src/services/TaskSynchronizationService';
let DistributedWorkflowService = class DistributedWorkflowService {
  syncOrchestrator;
  conflictManager;
  taskSync;
  constructor(syncOrchestrator, conflictManager, taskSync) {
    this.syncOrchestrator = syncOrchestrator;
    this.conflictManager = conflictManager;
    this.taskSync = taskSync;
  }
  async onModuleInit() {
    await this.subscribeToWorkflowEvents();
  }
  /**
   * Subscribe to workflow-related events
   */
  async subscribeToWorkflowEvents() {
    // Listen for workflow updates from any instance
    this.syncOrchestrator.subscribe('workflow', this.handleWorkflowSync.bind(this));
    // Listen for step completions
    this.syncOrchestrator.subscribe('workflow_step', this.handleStepCompletion.bind(this));
    // Listen for task updates
    this.taskSync.onTaskUpdate(this.handleTaskUpdate.bind(this));
  }
  /**
   * Execute distributed workflow
   */
  async executeWorkflow(workflowDef, tenantId) {
    const workflow = {
      id: this.generateId(),
      ...workflowDef,
      tenantId,
      status: 'PENDING',
      currentStep: 0,
      startedAt: new Date(),
    };
    // Store workflow state
    await this.storeWorkflow(workflow);
    // Sync workflow creation
    await this.syncOrchestrator.syncTenantData(tenantId, 'workflow', workflow);
    // Start execution
    await this.executeNextStep(workflow);
    return workflow;
  }
  /**
   * Execute next workflow step
   */
  async executeNextStep(workflow) {
    if (workflow.currentStep >= workflow.steps.length) {
      await this.completeWorkflow(workflow);
      return;
    }
    const step = workflow.steps[workflow.currentStep];
    // Check dependencies
    const dependenciesMet = await this.checkDependencies(step, workflow);
    if (!dependenciesMet) {
      console.log(`Step ${step.id} waiting for dependencies`);
      return;
    }
    // Update step status
    step.status = 'RUNNING';
    workflow.status = 'RUNNING';
    // Sync step start
    await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow_step', {
      workflowId: workflow.id,
      stepId: step.id,
      status: 'RUNNING',
      startedAt: new Date(),
    });
    try {
      // Execute step based on type
      const result = await this.executeStep(step, workflow);
      // Update step with result
      step.status = 'COMPLETED';
      step.output = result;
      // Sync step completion
      await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow_step', {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'COMPLETED',
        output: result,
        completedAt: new Date(),
      });
      // Move to next step
      workflow.currentStep++;
      await this.syncWorkflowState(workflow);
      // Continue execution
      await this.executeNextStep(workflow);
    } catch (error) {
      await this.handleStepError(step, workflow, error);
    }
  }
  /**
   * Execute individual workflow step
   */
  async executeStep(step, workflow) {
    switch (step.type) {
      case 'agent':
        return await this.executeAgentStep(step, workflow);
      case 'service':
        return await this.executeServiceStep(step, workflow);
      case 'function':
        return await this.executeFunctionStep(step, workflow);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  /**
   * Execute agent-based step
   */
  async executeAgentStep(step, workflow) {
    console.log(`Executing agent step: ${step.name} (${step.target})`);
    // Create task for agent
    const task = {
      id: this.generateId(),
      agentName: step.target,
      input: step.input,
      workflowId: workflow.id,
      stepId: step.id,
      tenantId: workflow.tenantId,
    };
    // Sync task creation
    await this.taskSync.syncTaskData(task, workflow.tenantId);
    // Wait for agent to complete task (handled by subscription)
    return await this.waitForTaskCompletion(task.id, 300000); // 5 minute timeout
  }
  /**
   * Execute service call step
   */
  async executeServiceStep(step, workflow) {
    console.log(`Executing service step: ${step.name} (${step.target})`);
    // Call service via RPC or HTTP
    // Implementation depends on service architecture
    const result = await this.callService(step.target, step.input);
    return result;
  }
  /**
   * Execute function step
   */
  async executeFunctionStep(step, workflow) {
    console.log(`Executing function step: ${step.name}`);
    // Execute registered function
    const fn = this.getFunctionByName(step.target);
    if (!fn) {
      throw new Error(`Function not found: ${step.target}`);
    }
    return await fn(step.input, workflow);
  }
  /**
   * Handle step error with retry logic
   */
  async handleStepError(step, workflow, error) {
    console.error(`Step ${step.id} failed:`, error);
    step.retryCount++;
    if (step.retryCount < step.maxRetries) {
      // Retry step
      console.log(`Retrying step ${step.id} (${step.retryCount}/${step.maxRetries})`);
      step.status = 'PENDING';
      await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow_step', {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'PENDING',
        retryCount: step.retryCount,
        lastError: error.message,
      });
      // Retry after delay
      setTimeout(() => this.executeNextStep(workflow), 5000);
    } else {
      // Max retries exceeded - fail workflow
      step.status = 'FAILED';
      workflow.status = 'FAILED';
      workflow.error = error;
      await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow', {
        id: workflow.id,
        status: 'FAILED',
        error: {
          message: error.message,
          stack: error.stack,
          failedStep: step.id,
        },
        failedAt: new Date(),
      });
      console.error(`Workflow ${workflow.id} failed at step ${step.id}`);
    }
  }
  /**
   * Complete workflow
   */
  async completeWorkflow(workflow) {
    workflow.status = 'COMPLETED';
    workflow.completedAt = new Date();
    // Collect results from all steps
    workflow.result = workflow.steps.map((step) => ({
      stepId: step.id,
      output: step.output,
    }));
    await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow', {
      id: workflow.id,
      status: 'COMPLETED',
      result: workflow.result,
      completedAt: workflow.completedAt,
    });
    console.log(`Workflow ${workflow.id} completed successfully`);
  }
  /**
   * Check if step dependencies are met
   */
  async checkDependencies(step, workflow) {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }
    for (const depId of step.dependencies) {
      const depStep = workflow.steps.find((s) => s.id === depId);
      if (!depStep || depStep.status !== 'COMPLETED') {
        return false;
      }
    }
    return true;
  }
  /**
   * Sync workflow state across instances
   */
  async syncWorkflowState(workflow) {
    await this.syncOrchestrator.syncTenantData(workflow.tenantId, 'workflow', {
      id: workflow.id,
      status: workflow.status,
      currentStep: workflow.currentStep,
      steps: workflow.steps,
      updatedAt: new Date(),
    });
  }
  /**
   * Handle workflow sync from other instances
   */
  handleWorkflowSync(event) {
    console.log('Workflow sync received:', event.resourceId);
    // Update local cache or trigger UI updates
    this.updateWorkflowCache(event.data);
  }
  /**
   * Handle step completion from other instances
   */
  handleStepCompletion(event) {
    console.log('Step completion received:', event.data.stepId);
    // Continue workflow if this instance is responsible
    // Implementation depends on workflow ownership model
  }
  /**
   * Handle task updates from task sync service
   */
  handleTaskUpdate(task) {
    console.log('Task update:', task.id);
    // Check if task belongs to a workflow
    if (task.workflowId) {
      this.updateWorkflowWithTaskResult(task.workflowId, task.stepId, task);
    }
  }
  /**
   * Pause workflow execution
   */
  async pauseWorkflow(workflowId, tenantId) {
    const workflow = await this.getWorkflow(workflowId);
    workflow.status = 'PAUSED';
    await this.syncOrchestrator.syncTenantData(tenantId, 'workflow', {
      id: workflowId,
      status: 'PAUSED',
      pausedAt: new Date(),
    });
    console.log(`Workflow ${workflowId} paused`);
  }
  /**
   * Resume workflow execution
   */
  async resumeWorkflow(workflowId, tenantId) {
    const workflow = await this.getWorkflow(workflowId);
    workflow.status = 'RUNNING';
    await this.syncOrchestrator.syncTenantData(tenantId, 'workflow', {
      id: workflowId,
      status: 'RUNNING',
      resumedAt: new Date(),
    });
    // Continue execution
    await this.executeNextStep(workflow);
    console.log(`Workflow ${workflowId} resumed`);
  }
  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(workflowId, tenantId) {
    const workflow = await this.getWorkflow(workflowId);
    workflow.status = 'FAILED';
    await this.syncOrchestrator.syncTenantData(tenantId, 'workflow', {
      id: workflowId,
      status: 'FAILED',
      error: { message: 'Cancelled by user' },
      cancelledAt: new Date(),
    });
    console.log(`Workflow ${workflowId} cancelled`);
  }
  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(workflowId) {
    return await this.getWorkflow(workflowId);
  }
  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(tenantId) {
    // Aggregate metrics from sync orchestrator
    const metrics = this.syncOrchestrator.getMetrics();
    return {
      totalWorkflows: await this.countWorkflows(tenantId),
      activeWorkflows: await this.countActiveWorkflows(tenantId),
      completedWorkflows: await this.countCompletedWorkflows(tenantId),
      avgExecutionTime: await this.getAvgExecutionTime(tenantId),
      successRate: metrics.performance.successRate,
      conflictRate: metrics.performance.conflictRate,
    };
  }
  // Helper methods
  generateId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async storeWorkflow(workflow) {
    console.log('Storing workflow:', workflow.id);
  }
  async getWorkflow(id) {
    console.log('Getting workflow:', id);
    return null;
  }
  async updateWorkflowCache(data) {
    console.log('Updating workflow cache');
  }
  async updateWorkflowWithTaskResult(workflowId, stepId, task) {
    console.log(`Updating workflow ${workflowId} with task result`);
  }
  async waitForTaskCompletion(taskId, timeout) {
    console.log(`Waiting for task ${taskId} completion`);
    return {};
  }
  async callService(serviceName, input) {
    console.log(`Calling service ${serviceName}`);
    return {};
  }
  getFunctionByName(name) {
    console.log(`Getting function ${name}`);
    return null;
  }
  async countWorkflows(tenantId) {
    return 0;
  }
  async countActiveWorkflows(tenantId) {
    return 0;
  }
  async countCompletedWorkflows(tenantId) {
    return 0;
  }
  async getAvgExecutionTime(tenantId) {
    return 0;
  }
};
DistributedWorkflowService = __decorate(
  [
    Injectable(),
    __metadata('design:paramtypes', [
      SyncOrchestrator,
      ConflictManager,
      typeof (_a =
        typeof TaskSynchronizationService !== 'undefined' && TaskSynchronizationService) ===
      'function'
        ? _a
        : Object,
    ]),
  ],
  DistributedWorkflowService
);
export { DistributedWorkflowService };
//# sourceMappingURL=advanced-multi-service.js.map
