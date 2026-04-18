import { Logger, NotImplementedException } from '@nestjs/common';
import { WorkflowEngine, WorkflowExecutor } from '../types/core.js';

/**
 * Stub implementation of WorkflowEngine
 * TODO: Replace with actual implementation when workflow engine is ready
 */
export class WorkflowEngineStub implements WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngineStub.name);
  private fail(feature: string): never {
    throw new NotImplementedException(`${feature} is not implemented in this deployment.`);
  }

  async createWorkflow(definition: any): Promise<any> {
    this.logger.warn('WorkflowEngine.createWorkflow is not implemented');
    this.fail('Workflow engine createWorkflow');
  }

  async getWorkflow(id: string): Promise<any> {
    this.logger.warn(`WorkflowEngine.getWorkflow(${id}) is not implemented`);
    this.fail('Workflow engine getWorkflow');
  }

  async updateWorkflow(id: string, data: any): Promise<any> {
    this.logger.warn(`WorkflowEngine.updateWorkflow(${id}) is not implemented`);
    this.fail('Workflow engine updateWorkflow');
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    this.logger.warn(`WorkflowEngine.deleteWorkflow(${id}) is not implemented`);
    this.fail('Workflow engine deleteWorkflow');
  }
}

/**
 * Stub implementation of WorkflowExecutor
 * TODO: Replace with actual implementation when workflow executor is ready
 */
export class WorkflowExecutorStub implements WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutorStub.name);
  private fail(feature: string): never {
    throw new NotImplementedException(`${feature} is not implemented in this deployment.`);
  }

  async execute(workflow: any, input: any): Promise<any> {
    this.logger.warn('WorkflowExecutor.execute is not implemented');
    this.fail('Workflow executor execute');
  }

  async cancel(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.cancel(${executionId}) is not implemented`);
    this.fail('Workflow executor cancel');
  }

  async pause(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.pause(${executionId}) is not implemented`);
    this.fail('Workflow executor pause');
  }

  async resume(executionId: string): Promise<any> {
    this.logger.warn(`WorkflowExecutor.resume(${executionId}) is not implemented`);
    this.fail('Workflow executor resume');
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
