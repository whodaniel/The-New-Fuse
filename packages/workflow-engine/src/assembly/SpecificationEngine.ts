/**
 * Specification Engine - Phase 1 of the 3-Phase Assembly Line Pattern
 *
 * Takes a raw user objective and produces an immutable, machine-verifiable
 * task specification with acceptance criteria before any code generation begins.
 */

import {
  VariableType,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowNodeType,
} from '../types/WorkflowTypes';

/**
 * Immutable task specification produced by the Specification Engine.
 * This is the contract that downstream phases (DraftGenerator, VerificationGate) must adhere to.
 */
export interface TaskSpecification {
  /** Unique identifier for this specification */
  readonly id: string;
  /** Human-readable description of the objective */
  readonly objective: string;
  /** Acceptance criteria that must be met for the specification to be considered complete */
  readonly acceptanceCriteria: string[];
  /** Workflow definition that outlines the steps to achieve the objective */
  readonly workflowDefinition: WorkflowDefinition;
  /** Metadata about the specification process */
  readonly metadata: {
    /** Timestamp when the specification was created */
    readonly createdAt: Date;
    /** Version of the specification format */
    readonly version: string;
    /** Any additional context or constraints */
    readonly context?: Record<string, unknown>;
  };
}

/**
 * Input to the Specification Engine - the raw user objective and any context.
 */
export interface SpecificationEngineInput {
  /** The raw user objective or goal */
  readonly objective: string;
  /** Additional context or constraints (optional) */
  readonly context?: Record<string, unknown>;
}

/**
 * Specification Engine - transforms raw objectives into verifiable task specifications.
 */
export class SpecificationEngine {
  private readonly version = '1.0.0';

  /**
   * Create a task specification from a raw user objective.
   *
   * @param input - The raw objective and optional context
   * @returns An immutable task specification
   * @Throws Error if the objective is empty or invalid
   */
  public createSpecification(input: SpecificationEngineInput): TaskSpecification {
    // Validate input
    if (!input.objective || input.objective.trim() === '') {
      throw new Error('Objective cannot be empty');
    }

    // Generate a unique ID for this specification
    const id = `spec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Derive acceptance criteria from the objective (simplified - in practice this would be more sophisticated)
    const acceptanceCriteria = this.deriveAcceptanceCriteria(input.objective);

    // Create a basic workflow definition based on the objective
    const workflowDefinition = this.createWorkflowDefinition(input.objective, input.context);

    // Construct the immutable specification
    const specification: TaskSpecification = {
      id,
      objective: input.objective.trim(),
      acceptanceCriteria,
      workflowDefinition,
      metadata: {
        createdAt: new Date(),
        version: this.version,
        context: input.context,
      },
    };

    // Freeze the specification to make it immutable
    Object.freeze(specification);
    Object.freeze(specification.metadata);

    return specification;
  }

  /**
   * Derive acceptance criteria from the objective.
   * This is a simplified implementation - in practice this would use NLP or templates.
   */
  private deriveAcceptanceCriteria(objective: string): string[] {
    // Basic heuristics - expand based on objective keywords
    const criteria = [
      `The solution must address the core objective: "${objective}"`,
      'The solution must be implemented in TypeScript/JavaScript',
      'The solution must pass all relevant type-checks and linting rules',
      'The solution must include appropriate error handling',
      'The solution must be tested with unit tests covering core functionality',
    ];

    // Add specific criteria based on keywords in the objective
    const lowerObjective = objective.toLowerCase();
    if (lowerObjective.includes('api') || lowerObjective.includes('endpoint')) {
      criteria.push('The solution must include proper API documentation');
      criteria.push('The solution must handle HTTP error codes appropriately');
    }
    if (lowerObjective.includes('database') || lowerObjective.includes('db')) {
      criteria.push('The solution must include proper data validation');
      criteria.push('The solution must handle database connection errors');
    }
    if (
      lowerObjective.includes('ui') ||
      lowerObjective.includes('interface') ||
      lowerObjective.includes('frontend')
    ) {
      criteria.push('The solution must be responsive and accessible');
      criteria.push('The solution must follow established UI/UX guidelines');
    }

    return criteria;
  }

  /**
   * Create a basic workflow definition from the objective.
   * This creates a simple linear workflow - in practice this would be more sophisticated.
   */
  private createWorkflowDefinition(
    objective: string,
    context: Record<string, unknown> | undefined
  ): WorkflowDefinition {
    // Create a simple workflow with start, agent task, and end nodes
    const nodes: WorkflowNode[] = [
      {
        id: 'start-1',
        type: WorkflowNodeType.START,
        name: 'Start',
        description: 'Begin workflow execution',
        position: { x: 100, y: 100 },
        config: {},
        inputs: [],
        outputs: [{ id: 'output-1', name: 'trigger', type: VariableType.BOOLEAN }],
        metadata: {},
      },
      {
        id: 'agent-task-1',
        type: WorkflowNodeType.AGENT_TASK,
        name: 'Implement Solution',
        description: `Implement the solution for: ${objective}`,
        position: { x: 300, y: 100 },
        config: {
          agentId: undefined, // To be filled by DraftGenerator
          agentType: 'DEVELOPER',
          task: objective,
          instructions: `Implement a solution that meets the acceptance criteria for: ${objective}`,
          context: context || {},
        } as any,
        inputs: [{ id: 'input-1', name: 'trigger', type: VariableType.BOOLEAN, required: true }],
        outputs: [{ id: 'output-2', name: 'completed', type: VariableType.BOOLEAN }],
        metadata: {},
      },
      {
        id: 'end-1',
        type: WorkflowNodeType.END,
        name: 'End',
        description: 'Workflow execution completed',
        position: { x: 500, y: 100 },
        config: {},
        inputs: [{ id: 'input-2', name: 'completed', type: VariableType.BOOLEAN, required: true }],
        outputs: [],
        metadata: {},
      },
    ];

    const connections: WorkflowConnection[] = [
      {
        id: 'conn-1',
        sourceNodeId: 'start-1',
        sourceOutputId: 'output-1',
        targetNodeId: 'agent-task-1',
        targetInputId: 'input-1',
        metadata: {},
      },
      {
        id: 'conn-2',
        sourceNodeId: 'agent-task-1',
        sourceOutputId: 'output-2',
        targetNodeId: 'end-1',
        targetInputId: 'input-2',
        metadata: {},
      },
    ];

    return {
      version: '1.0.0',
      nodes,
      connections,
      variables: [],
      triggers: [],
      settings: {
        parallel: false,
        maxConcurrentExecutions: 1,
        timeoutMs: 300000, // 5 minutes
        retryPolicy: {
          enabled: false,
          maxAttempts: 0,
          delayMs: 0,
          backoffMultiplier: 0,
          maxDelayMs: 0,
        },
        errorHandling: { onError: 'stop', captureErrors: true, notifyOnError: true },
        logging: {
          level: 'info',
          includeInputs: false,
          includeOutputs: false,
          includeTiming: true,
          retentionDays: 30,
        },
        notifications: { onStart: false, onComplete: false, onError: false, channels: [] },
      },
    };
  }
}
