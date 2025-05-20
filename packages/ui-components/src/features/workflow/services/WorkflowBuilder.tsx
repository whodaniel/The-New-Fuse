import { WorkflowDefinition, WorkflowStep, WorkflowCondition } from '../types.js'; // Added .js extension

/**
 * A builder class for creating workflow definitions
 */
export class WorkflowBuilder {
  private id: string;
  private name: string;
  private description?: string;
  private steps: Map<string, WorkflowStep> = new Map();
  
  constructor(id: string, name: string, description?: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
  
  /**
   * Add a step to the workflow
   */
  addStep(step: WorkflowStep): void {
    // Validate step has required properties
    if (!step.id || !step.name || !step.type || !step.action) {
      throw new Error('Step is missing required properties');
    }
    
    // Store the step
    this.steps.set(step.id, step);
  }
  
  /**
   * Remove a step from the workflow
   */
  removeStep(stepId: string): void {
    this.steps.delete(stepId);
    
    // Remove this step from any dependencies
    this.steps.forEach(step: WorkflowStep => {
      if (step.dependencies) {
        step.dependencies = step.dependencies.filter(id: string) => id !== stepId);
      }
      
      // Also handle conditions with this stepId
      if (step.conditions) {
        step.conditions = step.conditions.filter(cond: WorkflowCondition) => cond.nextStepId !== stepId);
      }
    });
  }
  
  /**
   * Update an existing step in the workflow
   */
  updateStep(stepId: string, updatedStep: WorkflowStep): void {
    if (!this.steps.has(stepId)) {
      throw new Error(`Step not found: ${stepId}`);
    }
    
    this.steps.set(stepId, updatedStep);
  }
  
  /**
   * Get a step by ID
   */
  getStep(stepId: string): WorkflowStep | undefined {
    return this.steps.get(stepId);
  }
  
  /**
   * Add a dependency between steps
   */
  addDependency(sourceStepId: string, targetStepId: string): void {
    const sourceStep = this.steps.get(sourceStepId);
    if (!sourceStep) {
      throw new Error(`Source step not found: ${sourceStepId}`);
    }
    
    if (!this.steps.has(targetStepId)) {
      throw new Error(`Target step not found: ${targetStepId}`);
    }
    
    // Initialize dependencies array if it doesn't exist
    if (!sourceStep.dependencies) {
      sourceStep.dependencies = [];
    }
    
    // Add dependency if it doesn't already exist
    if (!sourceStep.dependencies.includes(targetStepId)) {
      sourceStep.dependencies.push(targetStepId);
    }
  }
  
  /**
   * Add a condition to a step
   */
  addCondition(stepId: string, condition: WorkflowCondition): void {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }
    
    // Validate target step exists
    if (!this.steps.has(condition.nextStepId)) {
      throw new Error(`Target step for condition not found: ${condition.nextStepId}`);
    }
    
    // Initialize conditions array if it doesn't exist
    if (!step.conditions) {
      step.conditions = [];
    }
    
    // Add condition
    step.conditions.push(condition);
  }
  
  /**
   * Build the workflow definition
   */
  build(): WorkflowDefinition {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      steps: Array.from(this.steps.values())
    };
  }
  
  /**
   * Validate the workflow for correctness
   */
  validate(): string[] {
    const errors: string[] = [];
    const stepIds = new Set(this.steps.keys());
    
    // Check dependencies and conditions
    this.steps.forEach(step: WorkflowStep => {
      // Check dependencies
      if (step.dependencies) {
        step.dependencies.forEach(depId: string) => {
          if (!stepIds.has(depId)) {
            errors.push(`Step ${step.id} has dependency on non-existent step: ${depId}`);
          }
        });
      }
      
      // Check conditions
      if (step.conditions) {
        step.conditions.forEach(cond: WorkflowCondition) => {
          if (!stepIds.has(cond.nextStepId)) {
            errors.push(`Step ${step.id} has condition pointing to non-existent step: ${cond.nextStepId}`);
          }
        });
      }
    });
    
    return errors;
  }
  
  /**
   * Update the workflow metadata
   */
  updateMetadata(id?: string, name?: string, description?: string): void {
    if (id) this.id = id;
    if (name) this.name = name;
    if (description !== undefined) this.description = description;
  }
}
