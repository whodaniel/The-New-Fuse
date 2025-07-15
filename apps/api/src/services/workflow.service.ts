import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowEngine, WorkflowExecutor } from '@the-new-fuse/core';
import { CreateWorkflowDto, WorkflowExecutionStatus, WorkflowInput } from '@the-new-fuse/types';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    private readonly workflowEngine: WorkflowEngine,
    private readonly workflowExecutor: WorkflowExecutor,
  ) {}

  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    const workflow = this.workflowRepository.create(data);
    return this.workflowRepository.save(workflow);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.workflowRepository.findOne({ where: { id } });
  }

  async getWorkflows(): Promise<Workflow[]> {
    return this.workflowRepository.find();
  }

  async executeWorkflow(workflowId: string, input: WorkflowInput): Promise<string> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const execution = await this.workflowEngine.startWorkflow(workflow, input, workflowId);
    return execution.id;
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionStatus> {
    const execution = this.workflowEngine.getWorkflowStatus(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }
    
    return {
      id: execution.id,
      status: execution.status,
      templateId: execution.templateId,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      error: execution.error,
      steps: execution.steps
    };
  }

  async updateWorkflow(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow> {
    await this.workflowRepository.update(id, data);
    return this.getWorkflow(id);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.workflowRepository.delete(id);
  }

  handleWorkflowResult(_result: WorkflowExecutionStatus): void {
    // ...existing code...
  }
}
