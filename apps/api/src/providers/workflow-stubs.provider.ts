import { Logger } from '@nestjs/common';
import { WorkflowEngine, WorkflowExecutor } from '../types/core';

/**
 * Stub implementation of WorkflowEngine
 * TODO: Replace with actual implementation when workflow engine is ready
 */
export class WorkflowEngineStub implements WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngineStub.name);

  async createWorkflow(definition: any): Promise<any> {
    this.logger.warn('WorkflowEngine is not implemented yet - returning stub data');
    return {
      id: `wf_${Date.now()}`,
      ...definition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getWorkflow(id: string): Promise<any> {
    this.logger.warn(`WorkflowEngine.getWorkflow(${id}) is not implemented yet`);
    return null;
  }

  async updateWorkflow(id: string, data: any): Promise<any> {
    this.logger.warn(`WorkflowEngine.updateWorkflow(${id}) is not implemented yet`);
    return null;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    this.logger.warn(`WorkflowEngine.deleteWorkflow(${id}) is not implemented yet`);
    return false;
  }
}

/**
 * Stub implementation of WorkflowExecutor
 * TODO: Replace with actual implementation when workflow executor is ready
 */
export class WorkflowExecutorStub implements WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutorStub.name);

  async execute(workflow: any, input: any): Promise<any> {
    this.logger.warn('WorkflowExecutor is not implemented yet - returning stub execution');
    return {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'pending',
      input,
      output: null,
      error: null,
      startedAt: new Date(),
      completedAt: null,
    };
  }

  async cancel(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.cancel(${executionId}) is not implemented yet`);
    return null;
  }

  async pause(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.pause(${executionId}) is not implemented yet`);
    return null;
  }

  async resume(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.resume(${executionId}) is not implemented yet`);
    return null;
  }
}

/**
 * Providers for stub implementations
 * Use these in modules until real implementations are ready
 */
export const WORKFLOW_ENGINE_PROVIDER = {
  provide: 'WorkflowEngine',
  useClass: WorkflowEngineStub,
};

export const WORKFLOW_EXECUTOR_PROVIDER = {
  provide: 'WorkflowExecutor',
  useClass: WorkflowExecutorStub,
};
