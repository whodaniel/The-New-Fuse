/**
 * Workflow Agent Implementation
 * An agent that orchestrates and executes multi-step workflows
 */

import type { IAgent } from '../interfaces/IAgent';

export interface WorkflowConfig {
  agentId: string;
  name: string;
  maxConcurrentSteps?: number;
  stepTimeout?: number; // seconds
  retryAttempts?: number;
  onStepComplete?: (step: WorkflowStep, result: StepResult) => void;
  onWorkflowComplete?: (workflow: Workflow, results: StepResult[]) => void;
}

export interface WorkflowStep {
  id: string;
  type: 'agent' | 'tool' | 'condition' | 'loop' | 'delay' | 'parallel';
  name: string;
  config: Record<string, unknown>;
  dependsOn?: string[];
  retryOnFail?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results: StepResult[];
  startTime: Date;
  endTime?: Date;
  variables: Record<string, unknown>;
}

export class WorkflowAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type = 'workflow';
  public readonly capabilities = [
    'workflow_execution',
    'step_orchestration',
    'conditional_logic',
    'parallel_execution',
    'error_recovery',
  ];

  private config: WorkflowConfig;
  private memory: Map<string, unknown> = new Map();
  private state: Record<string, unknown> = {};
  private isInitialized = false;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private workflows: Map<string, Workflow> = new Map();

  constructor(config: WorkflowConfig) {
    this.id = config.agentId;
    this.name = config.name;
    this.config = {
      maxConcurrentSteps: 5,
      stepTimeout: 300,
      retryAttempts: 3,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log(`[WorkflowAgent:${this.id}] Initializing...`);
    this.state = {
      status: 'ready',
      lastActive: new Date().toISOString(),
      executionCount: 0,
      activeExecutions: 0,
    };
    this.isInitialized = true;
    console.log(`[WorkflowAgent:${this.id}] Ready`);
  }

  async process(message: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { action, payload } = message;

    switch (action) {
      case 'execute':
        return this.executeWorkflow(payload.workflowId, payload.variables);
      case 'register':
        return this.registerWorkflow(payload.workflow);
      case 'status':
        return this.getExecutionStatus(payload.executionId);
      case 'cancel':
        return this.cancelExecution(payload.executionId);
      case 'list':
        return this.listWorkflows();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async learn(data: unknown): Promise<void> {
    // Learn from successful workflow patterns
    const patterns = (await this.retrieveFromMemory('patterns')) || [];
    await this.saveToMemory('patterns', [...patterns, data]);
  }

  async saveToMemory(key: string, value: unknown): Promise<void> {
    this.memory.set(key, value);
  }

  async retrieveFromMemory(key: string): Promise<any> {
    return this.memory.get(key);
  }

  async getState(): Promise<any> {
    return {
      ...this.state,
      isInitialized: this.isInitialized,
      registeredWorkflows: this.workflows.size,
      activeExecutions: this.activeExecutions.size,
    };
  }

  async setState(state: unknown): Promise<void> {
    this.state = { ...this.state, ...(state as Record<string, unknown>) };
  }

  async sendMessage(message: any): Promise<void> {
    console.log(`[WorkflowAgent:${this.id}] Sending:`, message);
  }

  async receiveMessage(message: any): Promise<void> {
    console.log(`[WorkflowAgent:${this.id}] Received:`, message);
    await this.process(message);
  }

  async handleError(error: Error): Promise<void> {
    console.error(`[WorkflowAgent:${this.id}] Error:`, error.message);
    this.state = { ...this.state, lastError: error.message, status: 'error' };
  }

  // Workflow-specific methods
  async registerWorkflow(workflow: Workflow): Promise<{ success: boolean; workflowId: string }> {
    const id = workflow.id || `workflow-${Date.now()}`;
    const registeredWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: new Date(),
    };

    this.workflows.set(id, registeredWorkflow);
    console.log(`[WorkflowAgent:${this.id}] Registered workflow: ${workflow.name}`);

    return { success: true, workflowId: id };
  }

  async executeWorkflow(
    workflowId: string,
    variables?: Record<string, unknown>
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const execution: WorkflowExecution = {
      workflowId,
      executionId,
      status: 'running',
      results: [],
      startTime: new Date(),
      variables: { ...workflow.variables, ...variables },
    };

    this.activeExecutions.set(executionId, execution);
    this.state = {
      ...this.state,
      activeExecutions: this.activeExecutions.size,
      executionCount: ((this.state.executionCount as number) || 0) + 1,
    };

    console.log(`[WorkflowAgent:${this.id}] Starting execution: ${executionId}`);

    // Execute steps
    try {
      const sortedSteps = this.topologicalSort(workflow.steps);

      for (const step of sortedSteps) {
        const result = await this.executeStep(step, execution);
        execution.results.push(result);

        if (result.status === 'failed' && !step.retryOnFail) {
          execution.status = 'failed';
          break;
        }

        this.config.onStepComplete?.(step, result);
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (error) {
      execution.status = 'failed';
      console.error(`[WorkflowAgent:${this.id}] Execution failed:`, error);
    }

    execution.endTime = new Date();
    this.config.onWorkflowComplete?.(workflow, execution.results);

    return execution;
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<StepResult> {
    const startTime = new Date();

    console.log(`[WorkflowAgent:${this.id}] Executing step: ${step.name}`);

    const result: StepResult = {
      stepId: step.id,
      status: 'running',
      startTime,
    };

    try {
      let output: unknown;

      switch (step.type) {
        case 'agent':
          output = await this.executeAgentStep(step, execution.variables);
          break;
        case 'tool':
          output = await this.executeToolStep(step, execution.variables);
          break;
        case 'condition':
          output = await this.executeConditionStep(step, execution.variables);
          break;
        case 'delay':
          output = await this.executeDelayStep(step);
          break;
        case 'parallel':
          output = await this.executeParallelSteps(step, execution);
          break;
        default:
          output = { message: `Executed ${step.type} step` };
      }

      result.status = 'success';
      result.output = output;
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - startTime.getTime();

    return result;
  }

  private async executeAgentStep(
    step: WorkflowStep,
    variables: Record<string, unknown>
  ): Promise<unknown> {
    // In production, this would invoke the specified agent
    const { agentId, action, prompt } = step.config;
    console.log(`[WorkflowAgent:${this.id}] Calling agent: ${agentId}, action: ${action}`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      agentId,
      action,
      result: `Simulated response for: ${prompt || 'default prompt'}`,
    };
  }

  private async executeToolStep(
    step: WorkflowStep,
    variables: Record<string, unknown>
  ): Promise<unknown> {
    // In production, this would call the MCP tool
    const { tool, parameters } = step.config;
    console.log(`[WorkflowAgent:${this.id}] Calling tool: ${tool}`);

    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      tool,
      result: `Tool ${tool} executed with parameters: ${JSON.stringify(parameters)}`,
    };
  }

  private async executeConditionStep(
    step: WorkflowStep,
    variables: Record<string, unknown>
  ): Promise<unknown> {
    const { condition, thenBranch, elseBranch } = step.config;

    // Evaluate condition (simplified)
    const conditionMet = this.evaluateCondition(condition as string, variables);

    return {
      condition,
      conditionMet,
      branch: conditionMet ? 'then' : 'else',
    };
  }

  private async executeDelayStep(step: WorkflowStep): Promise<unknown> {
    const { duration = 1000 } = step.config;
    console.log(`[WorkflowAgent:${this.id}] Waiting ${duration}ms`);

    await new Promise((resolve) => setTimeout(resolve, duration as number));

    return { waited: duration };
  }

  private async executeParallelSteps(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<unknown> {
    const { steps: parallelSteps } = step.config;

    if (!Array.isArray(parallelSteps)) {
      return { error: 'No parallel steps defined' };
    }

    const results = await Promise.all(
      (parallelSteps as WorkflowStep[]).map((s) => this.executeStep(s, execution))
    );

    return { parallelResults: results };
  }

  private evaluateCondition(condition: string, variables: Record<string, unknown>): boolean {
    // Simple condition evaluation
    try {
      return variables[condition] === true;
    } catch {
      return false;
    }
  }

  private topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
    // Simple topological sort based on dependencies
    const sorted: WorkflowStep[] = [];
    const visited = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    const visit = (step: WorkflowStep) => {
      if (visited.has(step.id)) {
        return;
      }

      for (const depId of step.dependsOn || []) {
        const dep = stepMap.get(depId);
        if (dep) {
          visit(dep);
        }
      }

      visited.add(step.id);
      sorted.push(step);
    };

    for (const step of steps) {
      visit(step);
    }

    return sorted;
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.activeExecutions.get(executionId) || null;
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      return true;
    }
    return false;
  }

  async listWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }
}

export default WorkflowAgent;
