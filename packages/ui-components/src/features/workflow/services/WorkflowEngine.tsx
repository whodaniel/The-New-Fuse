import { 
  WorkflowDefinition, 
  WorkflowInstance, 
  WorkflowStep, 
  WorkflowContext, 
  ExecutionResult 
} from '../types.js';
import { WorkflowExecutor } from './WorkflowExecutor.js';
import { WorkflowMetricsTracker } from './WorkflowMetricsTracker.js';
import { WorkflowTaskQueue } from './WorkflowTaskQueue.js';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private workflowDefinitions: Map<string, WorkflowDefinition>;
  private workflowInstances: Map<string, WorkflowInstance>;
  private executor: WorkflowExecutor;
  private taskQueue: WorkflowTaskQueue;

  private constructor() {
    this.workflowDefinitions = new Map();
    this.workflowInstances = new Map();
    this.executor = new WorkflowExecutor(new WorkflowMetricsTracker());
    this.taskQueue = WorkflowTaskQueue.getInstance();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public registerWorkflow(definition: WorkflowDefinition): void {
    this.workflowDefinitions.set(definition.id, definition);
  }

  public getWorkflowDefinition(id: string): WorkflowDefinition | undefined {
    return this.workflowDefinitions.get(id);
  }

  public async startWorkflow(
    workflowId: string,
    initialContext: WorkflowContext = {}
  ): Promise<string> {
    const definition = this.workflowDefinitions.get(workflowId);
    
    if (!definition) {
      throw new Error(`Workflow definition not found: ${workflowId}`);
    }
    
    const instance: WorkflowInstance = {
      id: this.generateInstanceId(),
      workflowId,
      status: 'pending',
      context: initialContext,
      startTime: new Date().toISOString()
    };
    
    this.workflowInstances.set(instance.id, instance);
    
    // Start execution asynchronously
    this.executeWorkflow(instance.id).catch(error => {
      console.error(`Error executing workflow ${instance.id}:`, error);
      this.updateInstanceStatus(instance.id, 'failed', { error });
    });
    
    return instance.id;
  }

  public getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.workflowInstances.get(instanceId);
  }

  public async cancelWorkflow(instanceId: string): Promise<void> {
    const instance = this.workflowInstances.get(instanceId);
    
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    if (instance.status === 'completed' || instance.status === 'failed') {
      throw new Error(`Cannot cancel workflow in ${instance.status} state`);
    }
    
    this.updateInstanceStatus(instanceId, 'cancelled');
  }

  private async executeWorkflow(instanceId: string): Promise<void> {
    const instance = this.workflowInstances.get(instanceId);
    
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    const definition = this.workflowDefinitions.get(instance.workflowId);
    
    if (!definition) {
      throw new Error(`Workflow definition not found: ${instance.workflowId}`);
    }
    
    this.updateInstanceStatus(instanceId, 'running');
    
    try {
      const result = await this.executor.executeWorkflow(definition.steps);
      
      if (result.success) {
        this.updateInstanceStatus(instanceId, 'completed', { 
          result: result.context,
          context: result.context
        });
      } else {
        this.updateInstanceStatus(instanceId, 'failed', { 
          error: result.error,
          context: result.context
        });
      }
    } catch (error) {
      this.updateInstanceStatus(instanceId, 'failed', { error });
    }
  }

  private updateInstanceStatus(
    instanceId: string, 
    status: WorkflowInstance['status'],
    updates: Partial<WorkflowInstance> = {}
  ): void {
    const instance = this.workflowInstances.get(instanceId);
    
    if (instance) {
      const updatedInstance = {
        ...instance,
        ...updates,
        status,
        ...(status === 'completed' || status === 'failed' || status === 'cancelled' 
          ? { endTime: new Date().toISOString() } 
          : {})
      };
      
      this.workflowInstances.set(instanceId, updatedInstance);
    }
  }

  private generateInstanceId(): string {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
