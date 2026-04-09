/**
 * Cascade Bridge - Multi-Agent Workflow Orchestration Bridge
 *
 * Enables cascading workflows where the output of one agent becomes
 * the input of the next, supporting sequential, parallel, and pipeline modes.
 *
 * CONNECTS TO:
 * - UniversalBridge: For message transport
 * - CascadeService: For step execution (packages/core)
 * - EventEmitter: For workflow events
 */

import { BaseBridge, MessageType, Priority } from './index';
import type { UniversalMessage } from './universal_bridge';

// Cascade Step Definition
export interface CascadeStepDef {
  id: string;
  name: string;
  agentId: string;
  input: unknown;
  dependsOn?: string[];
  timeout?: number;
  retries?: number;
  optional?: boolean;
}

// Cascade Workflow Definition
export interface CascadeWorkflow {
  id: string;
  name: string;
  mode: 'sequential' | 'parallel' | 'pipeline' | 'waterfall';
  steps: CascadeStepDef[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

// Cascade Step Result
export interface CascadeStepResult {
  stepId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
}

// Cascade Workflow Result
export interface CascadeWorkflowResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled';
  stepResults: CascadeStepResult[];
  finalOutput: unknown;
  startedAt: Date;
  completedAt: Date;
  totalDurationMs: number;
}

/**
 * Cascade Bridge - Orchestrates multi-agent cascading workflows
 */
export class CascadeBridge extends BaseBridge {
  private workflows: Map<string, CascadeWorkflow> = new Map();
  private stepResults: Map<string, CascadeStepResult[]> = new Map();
  private pendingSteps: Map<string, CascadeStepDef> = new Map();
  private messageHandler?: (message: UniversalMessage) => void;

  constructor(bridgeName = 'cascade-bridge') {
    super(bridgeName);
  }

  /**
   * Connect the cascade bridge
   */
  async connect(): Promise<void> {
    this.isConnected = true;
    this.emit('connected');
  }

  /**
   * Disconnect the cascade bridge
   */
  async disconnect(): Promise<void> {
    this.workflows.clear();
    this.stepResults.clear();
    this.pendingSteps.clear();
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Send a message (required by BaseBridge)
   */
  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    // Forward to workflow execution
    const workflowId = message.workflowId as string;
    if (workflowId) {
      this.emit('workflow:message', { workflowId, message, messageType, priority });
    }
  }

  /**
   * Create a new cascade workflow
   */
  createWorkflow(
    name: string,
    mode: CascadeWorkflow['mode'],
    steps: Omit<CascadeStepDef, 'id'>[]
  ): CascadeWorkflow {
    const workflow: CascadeWorkflow = {
      id: `cascade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      mode,
      steps: steps.map((step, index) => ({
        ...step,
        id: `step-${index}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      createdAt: new Date(),
      status: 'pending',
    };

    this.workflows.set(workflow.id, workflow);
    this.stepResults.set(workflow.id, []);
    this.emit('workflow:created', workflow);

    return workflow;
  }

  /**
   * Execute a cascade workflow
   */
  async executeWorkflow(
    workflowId: string,
    initialInput: unknown,
    onStepComplete?: (result: CascadeStepResult) => void
  ): Promise<CascadeWorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    const startedAt = new Date();
    const results: CascadeStepResult[] = [];

    this.emit('workflow:started', { workflowId, startedAt });

    try {
      let currentInput = initialInput;
      let finalOutput: unknown;

      switch (workflow.mode) {
        case 'sequential':
          finalOutput = await this.executeSequential(
            workflow,
            currentInput,
            results,
            onStepComplete
          );
          break;

        case 'parallel':
          finalOutput = await this.executeParallel(workflow, currentInput, results, onStepComplete);
          break;

        case 'pipeline':
          finalOutput = await this.executePipeline(workflow, currentInput, results, onStepComplete);
          break;

        case 'waterfall':
          finalOutput = await this.executeWaterfall(
            workflow,
            currentInput,
            results,
            onStepComplete
          );
          break;

        default:
          throw new Error(`Unknown workflow mode: ${workflow.mode}`);
      }

      workflow.status = 'completed';
      const completedAt = new Date();

      const workflowResult: CascadeWorkflowResult = {
        workflowId,
        status: 'completed',
        stepResults: results,
        finalOutput,
        startedAt,
        completedAt,
        totalDurationMs: completedAt.getTime() - startedAt.getTime(),
      };

      this.stepResults.set(workflowId, results);
      this.emit('workflow:completed', workflowResult);

      return workflowResult;
    } catch (error) {
      workflow.status = 'failed';
      const completedAt = new Date();

      const workflowResult: CascadeWorkflowResult = {
        workflowId,
        status: 'failed',
        stepResults: results,
        finalOutput: { error: error instanceof Error ? error.message : String(error) },
        startedAt,
        completedAt,
        totalDurationMs: completedAt.getTime() - startedAt.getTime(),
      };

      this.emit('workflow:failed', workflowResult);
      throw error;
    }
  }

  /**
   * Execute steps sequentially (one after another)
   */
  private async executeSequential(
    workflow: CascadeWorkflow,
    initialInput: unknown,
    results: CascadeStepResult[],
    onStepComplete?: (result: CascadeStepResult) => void
  ): Promise<unknown> {
    let currentInput = initialInput;

    for (const step of workflow.steps) {
      const result = await this.executeStep(step, currentInput);
      results.push(result);

      if (onStepComplete) {
        onStepComplete(result);
      }

      if (result.status === 'failed' && !step.optional) {
        throw new Error(`Step ${step.name} failed: ${result.error}`);
      }

      if (result.status === 'completed') {
        currentInput = result.output;
      }
    }

    return currentInput;
  }

  /**
   * Execute steps in parallel (all at once)
   */
  private async executeParallel(
    workflow: CascadeWorkflow,
    initialInput: unknown,
    results: CascadeStepResult[],
    onStepComplete?: (result: CascadeStepResult) => void
  ): Promise<unknown[]> {
    const promises = workflow.steps.map(async (step) => {
      const result = await this.executeStep(step, initialInput);
      results.push(result);

      if (onStepComplete) {
        onStepComplete(result);
      }

      return result;
    });

    const stepResults = await Promise.all(promises);
    return stepResults.map((r) => r.output);
  }

  /**
   * Execute as a pipeline (output → next input, with dependencies)
   */
  private async executePipeline(
    workflow: CascadeWorkflow,
    initialInput: unknown,
    results: CascadeStepResult[],
    onStepComplete?: (result: CascadeStepResult) => void
  ): Promise<unknown> {
    const completed = new Map<string, CascadeStepResult>();
    const pending = new Map(workflow.steps.map((s) => [s.id, s]));

    while (pending.size > 0) {
      // Find steps whose dependencies are satisfied
      const ready: CascadeStepDef[] = [];

      for (const [id, step] of pending) {
        const deps = step.dependsOn || [];
        const depsComplete = deps.every((depId) => completed.has(depId));

        if (deps.length === 0 || depsComplete) {
          ready.push(step);
        }
      }

      if (ready.length === 0 && pending.size > 0) {
        throw new Error('Circular dependency detected in pipeline');
      }

      // Execute ready steps in parallel
      const readyPromises = ready.map(async (step) => {
        pending.delete(step.id);

        // Gather inputs from dependencies
        let stepInput = initialInput;
        if (step.dependsOn && step.dependsOn.length > 0) {
          const depOutputs = step.dependsOn.map((depId) => completed.get(depId)?.output);
          stepInput = depOutputs.length === 1 ? depOutputs[0] : depOutputs;
        }

        const result = await this.executeStep(step, stepInput);
        completed.set(step.id, result);
        results.push(result);

        if (onStepComplete) {
          onStepComplete(result);
        }

        return result;
      });

      await Promise.all(readyPromises);
    }

    // Return the output of the last step(s)
    const lastSteps = workflow.steps.filter(
      (s) => !workflow.steps.some((other) => other.dependsOn?.includes(s.id))
    );

    if (lastSteps.length === 1) {
      return completed.get(lastSteps[0].id)?.output;
    }

    return lastSteps.map((s) => completed.get(s.id)?.output);
  }

  /**
   * Execute as waterfall (each output merges into shared context)
   */
  private async executeWaterfall(
    workflow: CascadeWorkflow,
    initialInput: unknown,
    results: CascadeStepResult[],
    onStepComplete?: (result: CascadeStepResult) => void
  ): Promise<unknown> {
    let context = { input: initialInput, outputs: {} as Record<string, unknown> };

    for (const step of workflow.steps) {
      const result = await this.executeStep(step, context);
      results.push(result);

      if (onStepComplete) {
        onStepComplete(result);
      }

      if (result.status === 'failed' && !step.optional) {
        throw new Error(`Step ${step.name} failed: ${result.error}`);
      }

      if (result.status === 'completed') {
        context = {
          ...context,
          outputs: {
            ...context.outputs,
            [step.id]: result.output,
            [step.name]: result.output,
          },
        };
      }
    }

    return context;
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: CascadeStepDef, input: unknown): Promise<CascadeStepResult> {
    const startedAt = new Date();

    const result: CascadeStepResult = {
      stepId: step.id,
      agentId: step.agentId,
      status: 'running',
      input,
      startedAt,
    };

    this.emit('step:started', { step, result });

    try {
      // Create a promise that resolves when the agent responds
      const output = await this.waitForAgentResponse(step, input, step.timeout || 30000);

      result.status = 'completed';
      result.output = output;
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - startedAt.getTime();

      this.emit('step:completed', { step, result });
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - startedAt.getTime();

      this.emit('step:failed', { step, result, error });
    }

    return result;
  }

  /**
   * Wait for agent response (simulated - needs bridge integration)
   */
  private async waitForAgentResponse(
    step: CascadeStepDef,
    input: unknown,
    timeout: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Store pending step
      this.pendingSteps.set(step.id, step);

      // Emit request to agent
      this.emit('agent:request', {
        stepId: step.id,
        agentId: step.agentId,
        input,
        timeout,
      });

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingSteps.delete(step.id);
        reject(new Error(`Step ${step.name} timed out after ${timeout}ms`));
      }, timeout);

      // Listen for response
      const responseHandler = (response: { stepId: string; output: unknown; error?: string }) => {
        if (response.stepId === step.id) {
          clearTimeout(timeoutHandle);
          this.pendingSteps.delete(step.id);
          this.off('agent:response', responseHandler);

          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.output);
          }
        }
      };

      this.on('agent:response', responseHandler);
    });
  }

  /**
   * Submit a response from an agent
   */
  submitAgentResponse(stepId: string, output: unknown, error?: string): void {
    this.emit('agent:response', { stepId, output, error });
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'cancelled';
      this.emit('workflow:cancelled', { workflowId });
    }
  }

  /**
   * Get workflow status
   */
  getWorkflow(workflowId: string): CascadeWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get step results for a workflow
   */
  getStepResults(workflowId: string): CascadeStepResult[] {
    return this.stepResults.get(workflowId) || [];
  }

  /**
   * Register a message handler for bridge integration
   */
  onMessage(handler: (message: UniversalMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Get bridge statistics
   */
  getStats(): {
    workflowCount: number;
    pendingSteps: number;
    workflowsByStatus: Record<string, number>;
  } {
    const byStatus: Record<string, number> = {};
    for (const workflow of this.workflows.values()) {
      byStatus[workflow.status] = (byStatus[workflow.status] || 0) + 1;
    }

    return {
      workflowCount: this.workflows.size,
      pendingSteps: this.pendingSteps.size,
      workflowsByStatus: byStatus,
    };
  }
}

export default CascadeBridge;
