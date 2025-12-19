/**
 * Cascade Agent Implementation
 * An agent that manages cascading workflows - executing tasks through chains of agents
 * Implements the "cascade" pattern where one agent's output becomes another's input
 */

import { IAgent } from '../interfaces/IAgent';

export interface CascadeConfig {
  agentId: string;
  name: string;
  maxCascadeDepth?: number;
  timeoutPerStep?: number;
  errorStrategy?: 'stop' | 'skip' | 'retry';
  retryAttempts?: number;
}

export interface CascadeStep {
  agentId: string;
  agentType: string;
  action: string;
  inputMapping?: Record<string, string>; // Maps previous output to this step's input
  outputKey?: string; // Key to store this step's output
  fallback?: CascadeStep;
}

export interface CascadePipeline {
  pipelineId: string;
  name: string;
  description?: string;
  steps: CascadeStep[];
  globalVariables?: Record<string, unknown>;
}

export interface CascadeExecution {
  executionId: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStepIndex: number;
  results: CascadeStepResult[];
  variables: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
}

export interface CascadeStepResult {
  stepIndex: number;
  agentId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  input: unknown;
  output: unknown;
  error?: string;
  duration: number;
}

export class CascadeAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type = 'cascade';
  public readonly capabilities = [
    'cascade_execution',
    'pipeline_management',
    'agent_chaining',
    'error_recovery',
    'state_management',
  ];

  private config: CascadeConfig;
  private memory: Map<string, unknown> = new Map();
  private state: Record<string, unknown> = {};
  private isInitialized = false;
  private pipelines: Map<string, CascadePipeline> = new Map();
  private executions: Map<string, CascadeExecution> = new Map();
  private agentRegistry: Map<string, IAgent> = new Map();

  constructor(config: CascadeConfig) {
    this.id = config.agentId;
    this.name = config.name;
    this.config = {
      maxCascadeDepth: 10,
      timeoutPerStep: 60000,
      errorStrategy: 'stop',
      retryAttempts: 2,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log(`[CascadeAgent:${this.id}] Initializing...`);
    this.state = {
      status: 'ready',
      lastActive: new Date().toISOString(),
      pipelinesRegistered: 0,
      executionsCompleted: 0,
    };
    this.isInitialized = true;
    console.log(`[CascadeAgent:${this.id}] Ready`);
  }

  async process(message: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { action, payload } = message;

    switch (action) {
      case 'register_pipeline':
        return this.registerPipeline(payload.pipeline);
      case 'execute':
        return this.executePipeline(payload.pipelineId, payload.initialInput);
      case 'register_agent':
        return this.registerAgent(payload.agent);
      case 'status':
        return this.getExecutionStatus(payload.executionId);
      case 'pause':
        return this.pauseExecution(payload.executionId);
      case 'resume':
        return this.resumeExecution(payload.executionId);
      case 'list_pipelines':
        return this.listPipelines();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async learn(data: unknown): Promise<void> {
    const patterns = (await this.retrieveFromMemory('cascade_patterns')) || [];
    await this.saveToMemory('cascade_patterns', [...patterns, data]);
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
      registeredPipelines: this.pipelines.size,
      registeredAgents: this.agentRegistry.size,
      activeExecutions: Array.from(this.executions.values()).filter((e) => e.status === 'running')
        .length,
    };
  }

  async setState(state: unknown): Promise<void> {
    this.state = { ...this.state, ...(state as Record<string, unknown>) };
  }

  async sendMessage(message: any): Promise<void> {
    console.log(`[CascadeAgent:${this.id}] Sending:`, message);
  }

  async receiveMessage(message: any): Promise<void> {
    console.log(`[CascadeAgent:${this.id}] Received:`, message);
    await this.process(message);
  }

  async handleError(error: Error): Promise<void> {
    console.error(`[CascadeAgent:${this.id}] Error:`, error.message);
    this.state = { ...this.state, lastError: error.message, status: 'error' };
  }

  // Cascade-specific methods
  async registerPipeline(
    pipeline: CascadePipeline
  ): Promise<{ success: boolean; pipelineId: string }> {
    const id = pipeline.pipelineId || `pipeline-${Date.now()}`;
    this.pipelines.set(id, { ...pipeline, pipelineId: id });

    this.state = {
      ...this.state,
      pipelinesRegistered: this.pipelines.size,
    };

    console.log(`[CascadeAgent:${this.id}] Registered pipeline: ${pipeline.name}`);
    return { success: true, pipelineId: id };
  }

  async registerAgent(agent: IAgent): Promise<void> {
    this.agentRegistry.set(agent.id, agent);
    console.log(`[CascadeAgent:${this.id}] Registered agent: ${agent.id}`);
  }

  async executePipeline(pipelineId: string, initialInput?: unknown): Promise<CascadeExecution> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const executionId = `cascade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const execution: CascadeExecution = {
      executionId,
      pipelineId,
      status: 'running',
      currentStepIndex: 0,
      results: [],
      variables: { ...pipeline.globalVariables, input: initialInput },
      startTime: new Date(),
    };

    this.executions.set(executionId, execution);
    console.log(`[CascadeAgent:${this.id}] Starting cascade: ${executionId}`);

    try {
      let currentOutput = initialInput;

      for (let i = 0; i < pipeline.steps.length; i++) {
        if (i >= (this.config.maxCascadeDepth || 10)) {
          throw new Error(`Max cascade depth (${this.config.maxCascadeDepth}) exceeded`);
        }

        execution.currentStepIndex = i;
        const step = pipeline.steps[i];

        const stepResult = await this.executeStep(step, currentOutput, execution.variables);
        execution.results.push(stepResult);

        if (stepResult.status === 'failed') {
          if (this.config.errorStrategy === 'stop') {
            execution.status = 'failed';
            break;
          } else if (this.config.errorStrategy === 'skip') {
            continue;
          }
        }

        // Update variables with step output
        if (step.outputKey) {
          execution.variables[step.outputKey] = stepResult.output;
        }
        currentOutput = stepResult.output;
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
        this.state = {
          ...this.state,
          executionsCompleted: ((this.state.executionsCompleted as number) || 0) + 1,
        };
      }
    } catch (error) {
      execution.status = 'failed';
      console.error(`[CascadeAgent:${this.id}] Cascade failed:`, error);
    }

    execution.endTime = new Date();
    return execution;
  }

  private async executeStep(
    step: CascadeStep,
    input: unknown,
    variables: Record<string, unknown>
  ): Promise<CascadeStepResult> {
    const startTime = Date.now();

    const result: CascadeStepResult = {
      stepIndex: 0,
      agentId: step.agentId,
      status: 'running',
      input,
      output: null,
      duration: 0,
    };

    try {
      // Map input based on inputMapping
      let mappedInput = input;
      if (step.inputMapping) {
        mappedInput = {};
        for (const [key, varPath] of Object.entries(step.inputMapping)) {
          (mappedInput as Record<string, unknown>)[key] = this.resolveVariable(
            varPath,
            variables,
            input
          );
        }
      }

      // Execute via agent
      const agent = this.agentRegistry.get(step.agentId);
      if (agent) {
        const response = await agent.process({
          action: step.action,
          payload: mappedInput,
        });
        result.output = response;
        result.status = 'success';
      } else {
        // Simulate execution if agent not registered
        console.log(`[CascadeAgent:${this.id}] Simulating step for agent: ${step.agentId}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        result.output = { simulated: true, input: mappedInput };
        result.status = 'success';
      }
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);

      // Try fallback if available
      if (step.fallback) {
        console.log(`[CascadeAgent:${this.id}] Trying fallback for step`);
        return this.executeStep(step.fallback, input, variables);
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  private resolveVariable(
    path: string,
    variables: Record<string, unknown>,
    lastOutput: unknown
  ): unknown {
    if (path === '$output') return lastOutput;
    if (path.startsWith('$')) {
      return variables[path.slice(1)];
    }
    return path;
  }

  async getExecutionStatus(executionId: string): Promise<CascadeExecution | null> {
    return this.executions.get(executionId) || null;
  }

  async pauseExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      return true;
    }
    return false;
  }

  async resumeExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      // Continue execution from current step
      return true;
    }
    return false;
  }

  async listPipelines(): Promise<CascadePipeline[]> {
    return Array.from(this.pipelines.values());
  }
}

export default CascadeAgent;
