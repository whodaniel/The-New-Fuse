/**
 * A builder class for creating workflow definitions
 */
export class WorkflowBuilder {
    id;
    name;
    description;
    steps = new Map();
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
    /**
     * Add a step to the workflow
     */
    addStep(step) {
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
    removeStep(stepId) {
        this.steps.delete(stepId);
        // Remove this step from any dependencies
        this.steps.forEach((step) => {
            if (step.dependencies) {
                step.dependencies = step.dependencies.filter((id) => id !== stepId);
            }
            // Also handle conditions with this stepId
            if (step.conditions) {
                step.conditions = step.conditions.filter((cond) => cond.nextStepId !== stepId);
            }
        });
    }
    /**
     * Update an existing step in the workflow
     */
    updateStep(stepId, updatedStep) {
        if (!this.steps.has(stepId)) {
            throw new Error(`Step not found: ${stepId});
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
    if (!sourceStep) {`);
            throw new Error(`Source step not found: ${sourceStepId}`);
        }
        if (!this.steps.has(targetStepId)) {
            throw new Error(Target, step, not, found, $, { targetStepId });
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
    addCondition(stepId, condition) {
        const step = this.steps.get(stepId);
        if (!step) {
            `
      throw new Error(Step not found: ${stepId}`;
            ;
        }
        // Validate target step exists
        if (!this.steps.has(condition.nextStepId)) {
            throw new Error(Target, step);
            for (condition; not; found)
                : $;
            {
                condition.nextStepId;
            }
            ;
        }
        // Initialize conditions array if it doesn't exist
        if (!step.conditions) {
            step.conditions = [];
        }
        // Add condition
        step.conditions.push(condition);
    }
    /**
     * Add a nested workflow as a step
     */
    addSubWorkflowStep(subWorkflow, stepId, name) {
        const step = {
            id: stepId,
            name: name || subWorkflow.name || 'Sub-Workflow',
            type: 'sub-workflow',
            action: 'run-sub-workflow',
            parameters: { workflow: subWorkflow },
            dependencies: [],
            status: 'pending',
            startTime: undefined,
            endTime: null,
            error: undefined,
        };
        this.addStep(step);
    }
    /**
     * Build the workflow definition
     */
    build() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: 'draft',
            steps: Array.from(this.steps.values())
        };
    }
    /**
     * Export the workflow as JSON
     */
    toJSON() {
        return JSON.stringify(this.build(), null, 2);
    }
    /**
     * Import a workflow from JSON
     */
    static fromJSON(json) {
        const obj = JSON.parse(json);
        const builder = new WorkflowBuilder(obj.id, obj.name, obj.description);
        if (Array.isArray(obj.steps)) {
            obj.steps.forEach((step) => builder.addStep(step));
        }
        return builder;
    }
    /**
     * Validate the workflow for correctness
     */
    validate() {
        const errors = [];
        const stepIds = new Set(this.steps.keys());
        // Check dependencies and conditions
        this.steps.forEach((step) => {
            // Check dependencies
            if (step.dependencies) {
                `
        step.dependencies.forEach((depId: string) => {`;
                if (!stepIds.has(depId)) {
                    errors.push(Step, $, { step, : .id } ` has dependency on non-existent step: ${depId});
          }
        });
      }
      
      // Check conditions
      if (step.conditions) {`, step.conditions.forEach((cond) => {
                        `
          if (!stepIds.has(cond.nextStepId)) {
            errors.push(Step ${step.id}`;
                        has;
                        condition;
                        pointing;
                        to;
                        non - existent;
                        step: $;
                        {
                            cond.nextStepId;
                        }
                        `);
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
                        ;
                    }));
                }
            }
        });
    }
}
//# sourceMappingURL=WorkflowBuilder.js.map