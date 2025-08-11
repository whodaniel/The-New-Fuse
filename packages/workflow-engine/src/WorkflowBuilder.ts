/**
 * Workflow Builder - The New Fuse
 *
 * Provides a programmatic way to construct workflow definitions.
 * In a UI environment, this would be a visual drag-and-drop interface.
 */

import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowEdge,
  WorkflowTrigger,
  StepType,
  WorkflowStatus,
} from './WorkflowTypes';

export class WorkflowBuilder {
  private definition: Partial<WorkflowDefinition>;

  constructor() {
    this.definition = {
      steps: [],
      edges: [],
      status: WorkflowStatus.DRAFT,
      version: 1,
    };
  }

  public setName(name: string): this {
    this.definition.name = name;
    return this;
  }

  public setDescription(description: string): this {
    this.definition.description = description;
    return this;
  }

  public addStep(step: Partial<WorkflowStep>): this {
    if (!this.definition.steps) {
      this.definition.steps = [];
    }
    this.definition.steps.push(step as WorkflowStep);
    return this;
  }

  public addEdge(sourceStepId: string, targetStepId: string): this {
    if (!this.definition.edges) {
      this.definition.edges = [];
    }
    const edge: WorkflowEdge = {
      id: `edge_${sourceStepId}_${targetStepId}`,
      sourceStepId,
      targetStepId,
    };
    this.definition.edges.push(edge);
    return this;
  }

  public setTrigger(trigger: WorkflowTrigger): this {
    this.definition.trigger = trigger;
    return this;
  }

  public build(): WorkflowDefinition {
    if (!this.definition.name || !this.definition.steps || this.definition.steps.length === 0) {
      throw new Error('Workflow definition is incomplete.');
    }
    // Add default start and end steps if they don't exist
    if (!this.definition.steps.some(s => s.type === StepType.START)) {
        this.addStep({ id: 'start', name: 'Start', type: StepType.START, position: { x: 50, y: 150 } });
    }
    if (!this.definition.steps.some(s => s.type === StepType.END)) {
        this.addStep({ id: 'end', name: 'End', type: StepType.END, position: { x: 750, y: 150 } });
    }

    return this.definition as WorkflowDefinition;
  }
}
