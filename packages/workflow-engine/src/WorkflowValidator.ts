/**
 * Workflow Validator - The New Fuse
 *
 * This class is responsible for validating workflow definitions to ensure they are
 * well-formed and executable before being saved or run.
 */

import { MasterAgentRegistry } from '@the-new-fuse/relay-core';
import {
  WorkflowDefinition,
  WorkflowStep,
  StepType,
} from './WorkflowTypes';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class WorkflowValidator {
  private agentRegistry: MasterAgentRegistry;

  constructor(agentRegistry: MasterAgentRegistry) {
    this.agentRegistry = agentRegistry;
  }

  public validate(definition: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];

    if (!definition.name) {
      errors.push('Workflow name is required.');
    }

    if (!definition.steps || definition.steps.length === 0) {
      errors.push('Workflow must have at least one step.');
    }

    if (!this.hasStartAndEndSteps(definition.steps)) {
        errors.push('Workflow must have exactly one START and at least one END step.');
    }

    this.validateSteps(definition, errors);
    this.validateEdges(definition, errors);
    this.validateGraph(definition, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private hasStartAndEndSteps(steps: WorkflowStep[]): boolean {
    const startSteps = steps.filter(s => s.type === StepType.START).length;
    const endSteps = steps.filter(s => s.type === StepType.END).length;
    return startSteps === 1 && endSteps >= 1;
  }

  private validateSteps(definition: WorkflowDefinition, errors: string[]): void {
    for (const step of definition.steps) {
      if (!step.id || !step.name || !step.type) {
        errors.push(`Step ${step.id || '(no id)'} is missing required fields (id, name, type).`);
      }
      this.validateAssignee(step, errors);
    }
  }

  private validateAssignee(step: WorkflowStep, errors: string[]): void {
    if (!step.assignee) {
        errors.push(`Step ${step.id} is missing an assignee.`);
        return;
    }

    const { type, value } = step.assignee;
    if (type === 'AGENT_ID') {
      if (!this.agentRegistry.getAgentProfile(value)) {
        errors.push(`Step ${step.id} is assigned to a non-existent agent: ${value}`);
      }
    }
  }

  private validateEdges(definition: WorkflowDefinition, errors: string[]): void {
    const stepIds = new Set(definition.steps.map(s => s.id));
    for (const edge of definition.edges) {
      if (!stepIds.has(edge.sourceStepId) || !stepIds.has(edge.targetStepId)) {
        errors.push(`Edge ${edge.id} connects to a non-existent step.`);
      }
    }
  }

  private validateGraph(definition: WorkflowDefinition, errors: string[]): void {
    const stepIds = new Set(definition.steps.map(s => s.id));
    const adjacencyList = new Map<string, string[]>();
    for (const step of definition.steps) {
        adjacencyList.set(step.id, []);
    }
    for (const edge of definition.edges) {
        adjacencyList.get(edge.sourceStepId)?.push(edge.targetStepId);
    }

    // Check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    for (const stepId of stepIds) {
        if (this.isCyclic(stepId, visited, recursionStack, adjacencyList)) {
            errors.push('Workflow graph contains a cycle.');
            break;
        }
    }

    // Check for disconnected components (all nodes reachable from start)
    const reachable = new Set<string>();
    const startNode = definition.steps.find(s => s.type === StepType.START);
    if (startNode) {
        this.dfs(startNode.id, reachable, adjacencyList);
        if (reachable.size !== stepIds.size) {
            errors.push('Workflow graph has disconnected components.');
        }
    }
  }

  private isCyclic(node: string, visited: Set<string>, recursionStack: Set<string>, adjacencyList: Map<string, string[]>): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
            if (this.isCyclic(neighbor, visited, recursionStack, adjacencyList)) {
                return true;
            }
        } else if (recursionStack.has(neighbor)) {
            return true;
        }
    }

    recursionStack.delete(node);
    return false;
  }

  private dfs(node: string, visited: Set<string>, adjacencyList: Map<string, string[]>) {
    visited.add(node);
    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
            this.dfs(neighbor, visited, adjacencyList);
        }
    }
  }
}
