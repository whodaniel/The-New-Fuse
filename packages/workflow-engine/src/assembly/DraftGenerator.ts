/**
 * Draft Generator - Phase 2 of the 3-Phase Assembly Line Pattern
 *
 * Executes bounded code/diff generation against the specification
 * without mutating production state.
 */

import {
  UnifiedWorkflow,
  VariableType,
  WorkflowConnection,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowStatus,
} from '../types/WorkflowTypes';
import { TaskSpecification } from './SpecificationEngine';

/**
 * Draft output from the Draft Generator - represents proposed changes
 * that have not yet been applied to production state.
 */
export interface DraftOutput {
  /** Identifier linking back to the source specification */
  readonly specificationId: string;
  /** The proposed workflow or code changes */
  readonly draft: UnifiedWorkflow | string; // Could be workflow or code diff
  /** Type of draft produced */
  readonly draftType: 'workflow' | 'code-diff';
  /** Confidence score in the draft quality (0.0 to 1.0) */
  readonly confidence: number;
  /** Metadata about the generation process */
  readonly metadata: {
    /** Timestamp when the draft was generated */
    readonly generatedAt: Date;
    /** Model or tool used for generation */
    readonly generator: string;
    /** Any warnings or notes about the draft */
    readonly warnings?: string[];
  };
}

/**
 * Input to the Draft Generator - the specification to work against.
 */
export interface DraftGeneratorInput {
  /** The task specification to implement */
  readonly specification: TaskSpecification;
  /** Optional hints or constraints for generation */
  readonly hints?: Record<string, unknown>;
}

/**
 * Draft Generator - creates bounded implementations against specifications.
 */
export class DraftGenerator {
  /**
   * Generate a draft implementation based on the specification.
   *
   * @param input - The specification and optional hints
   * @returns A draft output representing the proposed solution
   * @throws Error if the specification is invalid
   */
  public async generateDraft(input: DraftGeneratorInput): Promise<DraftOutput> {
    // Validate input
    if (!input.specification) {
      throw new Error('Specification is required');
    }

    // For now, we'll generate a workflow draft - in practice this could
    // also generate code diffs, configs, etc. based on the specification type
    const draftWorkflow = await this.createWorkflowDraft(input.specification, input.hints);

    // Calculate a basic confidence score (in practice this would be more sophisticated)
    const confidence = this.calculateConfidence(input.specification, draftWorkflow);

    // Construct the draft output
    const draftOutput: DraftOutput = {
      specificationId: input.specification.id,
      draft: draftWorkflow,
      draftType: 'workflow',
      confidence,
      metadata: {
        generatedAt: new Date(),
        generator: 'DraftGenerator-v1.0',
        warnings: this.generateWarnings(input.specification, draftWorkflow),
      },
    };

    return draftOutput;
  }

  /**
   * Create a workflow draft based on the specification.
   * This enhances the basic workflow from the specification with more details.
   */
  private async createWorkflowDraft(
    spec: TaskSpecification,
    hints: Record<string, unknown> | undefined
  ): Promise<UnifiedWorkflow> {
    // Start with the basic workflow definition from the specification
    const baseDefinition = spec.workflowDefinition;

    // Enhance the workflow with more specific details based on the objective
    const enhancedNodes: WorkflowNode[] = [...baseDefinition.nodes];
    const enhancedConnections: WorkflowConnection[] = [...baseDefinition.connections];

    // Find the agent task node and enhance it
    const agentTaskIndex = enhancedNodes.findIndex(
      (node) => node.type === WorkflowNodeType.AGENT_TASK
    );
    if (agentTaskIndex !== -1) {
      // Enhance the agent task with more specific implementation details
      enhancedNodes[agentTaskIndex] = {
        ...enhancedNodes[agentTaskIndex],
        config: {
          ...(enhancedNodes[agentTaskIndex].config as any),
          // Add specific implementation hints based on the objective
          implementationApproach: this.determineImplementationApproach(spec.objective),
          techStack: this.determineTechStack(spec.objective),
          estimatedComplexity: this.estimateComplexity(spec.objective),
        } as any,
      };
    }

    // Add validation nodes if appropriate
    if (this.shouldAddValidationSteps(spec.objective)) {
      const validationNode: WorkflowNode = {
        id: `validation-${Date.now()}`,
        type: WorkflowNodeType.AGENT_TASK,
        name: 'Validate Implementation',
        description: 'Run tests and validation to ensure implementation meets acceptance criteria',
        position: { x: 400, y: 200 },
        config: {
          agentId: undefined,
          agentType: 'DEVELOPER',
          task: 'Validate the implementation against acceptance criteria',
          instructions:
            'Run unit tests, integration tests, and verify all acceptance criteria are met',
          context: {},
        },
        inputs: [
          { id: 'validation-input', name: 'trigger', type: VariableType.BOOLEAN, required: true },
        ],
        outputs: [
          { id: 'validation-output', name: 'validation-result', type: VariableType.BOOLEAN },
        ],
        metadata: {},
      };

      // Insert validation node before the end node
      const endIndex = enhancedNodes.findIndex((node) => node.type === WorkflowNodeType.END);
      if (endIndex !== -1) {
        enhancedNodes.splice(endIndex, 0, validationNode);

        // Update connections
        const agentTaskNode = enhancedNodes.find(
          (node) => node.type === WorkflowNodeType.AGENT_TASK && node.name === 'Implement Solution'
        );
        if (agentTaskNode) {
          // Remove old connection from agent task to end
          const oldConnIndex = enhancedConnections.findIndex(
            (conn) =>
              conn.sourceNodeId === agentTaskNode.id &&
              conn.targetNodeId === enhancedNodes[endIndex + 1].id
          );
          if (oldConnIndex !== -1) {
            enhancedConnections.splice(oldConnIndex, 1);
          }

          // Add new connections: agent task -> validation -> end
          enhancedConnections.push({
            id: `conn-validation-${Date.now()}-1`,
            sourceNodeId: agentTaskNode.id,
            sourceOutputId: 'output-1', // Assuming this is the completion output
            targetNodeId: validationNode.id,
            targetInputId: 'validation-input',
            metadata: {},
          });

          enhancedConnections.push({
            id: `conn-validation-${Date.now()}-2`,
            sourceNodeId: validationNode.id,
            sourceOutputId: 'validation-output',
            targetNodeId: enhancedNodes[endIndex + 1].id, // The end node
            targetInputId: 'input-2', // Assuming this is the trigger input for end
            metadata: {},
          });
        }
      }
    }

    // Create the enhanced workflow
    const enhancedWorkflow: UnifiedWorkflow = {
      id: `workflow-${spec.id}`,
      name: `Implementation: ${spec.objective.substring(0, 50)}${spec.objective.length > 50 ? '...' : ''}`,
      description: `Auto-generated workflow to implement: ${spec.objective}`,
      definition: {
        version: baseDefinition.version,
        nodes: enhancedNodes,
        connections: enhancedConnections,
        variables: baseDefinition.variables,
        triggers: baseDefinition.triggers,
        settings: {
          ...baseDefinition.settings,
          // Add specific settings based on the objective
          logging: {
            ...baseDefinition.settings.logging,
            level: 'debug', // More verbose logging for generated workflows
            includeTiming: true,
          },
        },
      },
      status: WorkflowStatus.DRAFT,
      agentId: undefined, // To be assigned when executed
      userId: undefined,
      version: '1.0.0',
      tags: ['auto-generated', 'assembly-line'],
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecutedAt: undefined,
      executionCount: 0,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        lastExecutionStatus: undefined,
        lastExecutionError: undefined,
        performance: {
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          peakMemoryUsage: 0,
          throughput: 0,
          bottleneckNodes: [],
        },
      },
      metadata: {
        category: 'auto-generated',
        tags: ['assembly-line', 'draft'],
        author: 'TNF-Assembly-Line-System',
        description: `Draft generated for specification ${spec.id}`,
        documentation: `This workflow was auto-generated by the Draft Generator phase of the Assembly Line pattern.`,
        changelog: [],
        dependencies: [],
        integrations: [],
        customProperties: {
          specificationId: spec.id,
          generationMethod: 'DraftGenerator-v1.0',
        },
      },
    };

    return enhancedWorkflow;
  }

  /**
   * Determine the implementation approach based on the objective.
   */
  private determineImplementationApproach(objective: string): string {
    const lowerObj = objective.toLowerCase();
    if (lowerObj.includes('api') || lowerObj.includes('endpoint') || lowerObj.includes('rest')) {
      return 'REST API implementation with proper routing and validation';
    }
    if (lowerObj.includes('database') || lowerObj.includes('db') || lowerObj.includes('query')) {
      return 'Database integration with proper ORM/query builder usage';
    }
    if (
      lowerObj.includes('ui') ||
      lowerObj.includes('interface') ||
      lowerObj.includes('frontend') ||
      lowerObj.includes('component')
    ) {
      return 'UI component implementation with proper state management';
    }
    if (lowerObj.includes('test') || lowerObj.includes('testing')) {
      return 'Test implementation with proper assertions and mocks';
    }
    if (
      lowerObj.includes('refactor') ||
      lowerObj.includes('optimize') ||
      lowerObj.includes('performance')
    ) {
      return 'Performance optimization with profiling and benchmarking';
    }
    return 'General implementation following best practices';
  }

  /**
   * Determine the technology stack based on the objective.
   */
  private determineTechStack(objective: string): string {
    const lowerObj = objective.toLowerCase();
    if (lowerObj.includes('react') || lowerObj.includes('frontend') || lowerObj.includes('ui')) {
      return 'React/TypeScript with Tailwind CSS';
    }
    if (lowerObj.includes('node') || lowerObj.includes('backend') || lowerObj.includes('server')) {
      return 'Node.js/TypeScript with Express/Fastify';
    }
    if (lowerObj.includes('database') || lowerObj.includes('sql')) {
      return 'PostgreSQL with TypeORM or Prisma';
    }
    if (lowerObj.includes('mongodb') || lowerObj.includes('mongo')) {
      return 'MongoDB with Mongoose';
    }
    return 'TypeScript/JavaScript standard library';
  }

  /**
   * Estimate the complexity of the implementation.
   */
  private estimateComplexity(objective: string): 'low' | 'medium' | 'high' {
    const lowerObj = objective.toLowerCase();
    const highComplexityKeywords = [
      'distributed',
      'microservice',
      'real-time',
      'streaming',
      'machine learning',
      'ai',
      'blockchain',
    ];
    const mediumComplexityKeywords = [
      'api',
      'database',
      'authentication',
      'authorization',
      'payment',
      'file upload',
    ];

    if (highComplexityKeywords.some((keyword) => lowerObj.includes(keyword))) {
      return 'high';
    }
    if (mediumComplexityKeywords.some((keyword) => lowerObj.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Determine if validation steps should be added.
   */
  private shouldAddValidationSteps(objective: string): boolean {
    const lowerObj = objective.toLowerCase();
    // Always add validation for non-trivial objectives
    return lowerObj.length > 10; // Simple objectives might not need explicit validation steps
  }

  /**
   * Calculate confidence in the draft quality.
   * This is a simplified implementation.
   */
  private calculateConfidence(spec: TaskSpecification, draft: UnifiedWorkflow): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if we have clear acceptance criteria
    if (spec.acceptanceCriteria.length > 0) {
      confidence += 0.1;
    }

    // Increase confidence if the objective is clear and specific
    if (spec.objective.length > 20) {
      confidence += 0.1;
    }

    // Decrease confidence for very vague objectives
    if (spec.objective.length < 10) {
      confidence -= 0.2;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate warnings about the draft.
   */
  private generateWarnings(spec: TaskSpecification, draft: UnifiedWorkflow): string[] {
    const warnings: string[] = [];

    // Warn if acceptance criteria are vague
    if (spec.acceptanceCriteria.some((criteria) => criteria.length < 10)) {
      warnings.push('Some acceptance criteria are vague and may need clarification');
    }

    // Warn if the objective is very broad
    if (spec.objective.split(' ').length > 15) {
      warnings.push('Objective is broad - consider breaking into smaller, more specific tasks');
    }

    // Warn if no specific technology was detected
    if (
      !spec.objective.toLowerCase().includes('react') &&
      !spec.objective.toLowerCase().includes('node') &&
      !spec.objective.toLowerCase().includes('database') &&
      !spec.objective.toLowerCase().includes('api')
    ) {
      warnings.push(
        'No specific technology detected in objective - implementation approach may be too generic'
      );
    }

    return warnings;
  }
}
