import { Injectable } from '@nestjs/common';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'error' | 'paused';
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  agentId?: string;
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  order: number;
  dependencies?: string[];
}

@Injectable()
export class WorkflowService {
  private workflows: Map<string, Workflow> = new Map();

  async createWorkflow(data: Partial<Workflow>, userId: string): Promise<Workflow> {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: data.name || 'Untitled Workflow',
      description: data.description,
      status: 'draft',
      steps: data.steps || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter((workflow) => workflow.userId === userId);
  }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return null;
    }

    const updatedWorkflow = {
      ...workflow,
      ...data,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async executeWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.status = 'running';
    workflow.updatedAt = new Date();

    try {
      // Mock execution - in real implementation, this would execute steps
      await new Promise((resolve) => setTimeout(resolve, 1000));

      workflow.status = 'completed';
    } catch (error) {
      workflow.status = 'error';
      throw error;
    } finally {
      workflow.updatedAt = new Date();
    }
  }

  async pauseWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.status = 'paused';
    workflow.updatedAt = new Date();
  }

  async resumeWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status === 'paused') {
      workflow.status = 'running';
      workflow.updatedAt = new Date();
    }
  }
}
