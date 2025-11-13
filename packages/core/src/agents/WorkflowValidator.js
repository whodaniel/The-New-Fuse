"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const common_1 = require("@nestjs/common");
let WorkflowValidator = class WorkflowValidator {
    /**
     * Validate a complete workflow
     */
    validateWorkflow(workflow) {
        const errors = [];
        const warnings = [];
        // Basic workflow validation
        this.validateWorkflowBasics(workflow, errors, warnings);
        // Step validation
        this.validateSteps(workflow.steps, errors, warnings);
        // Dependency validation
        this.validateDependencies(workflow.steps, errors, warnings);
        // Performance validation
        this.validatePerformance(workflow, errors, warnings);
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate just the workflow steps
     */
    validateWorkflowSteps(steps) {
        const errors = [];
        const warnings = [];
        this.validateSteps(steps, errors, warnings);
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Check if workflow can be executed with current agent capabilities
     */
    validateExecutability(workflow, availableCapabilities) {
        const errors = [];
        const warnings = [];
        for (const step of workflow.steps) {
            const missingCapabilities = step.requiredCapabilities.filter(cap => !availableCapabilities.includes(cap));
            if (missingCapabilities.length > 0) {
                errors.push({
                    type: 'error',
                    code: 'MISSING_CAPABILITIES',
                    message: `Step requires unavailable capabilities: ${missingCapabilities.join(', ')},
          stepId: step.id
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate basic workflow properties
   */
  private validateWorkflowBasics(workflow: Workflow, errors: ValidationError[], warnings: ValidationError[]): void {
    // Name validation
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push({
        type: 'error',
        code: 'MISSING_NAME',
        message: 'Workflow must have a name',
        field: 'name'
      });
    }

    if (workflow.name && workflow.name.length > 100) {
      warnings.push({
        type: 'warning',
        code: 'LONG_NAME',
        message: 'Workflow name is very long (>100 characters)',
        field: 'name'
      });
    }

    // Steps validation
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_STEPS',
        message: 'Workflow must have at least one step',
        field: 'steps'
      });
    }

    if (workflow.steps && workflow.steps.length > 50) {
      warnings.push({
        type: 'warning',
        code: 'MANY_STEPS',
        message: 'Workflow has many steps (>50), consider breaking into smaller workflows',
        field: 'steps'
      });
    }
  }

  /**
   * Validate individual workflow steps
   */
  private validateSteps(steps: WorkflowStep[], errors: ValidationError[], warnings: ValidationError[]): void {
    const stepIds = new Set<string>();
    
    for (const step of steps) {
      // ID uniqueness
      if (stepIds.has(step.id)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_STEP_ID',`,
                    message: `Duplicate step ID: ${step.id}`,
                    stepId: step.id
                });
            }
            stepIds.add(step.id);
            // Required fields
            if (!step.agentType || step.agentType.trim().length === 0) {
                errors.push({
                    type: 'error',
                    code: 'MISSING_AGENT_TYPE',
                    message: 'Step must have an agent type',
                    stepId: step.id,
                    field: 'agentType'
                });
            }
            if (!step.requiredCapabilities || step.requiredCapabilities.length === 0) {
                warnings.push({
                    type: 'warning',
                    code: 'NO_CAPABILITIES',
                    message: 'Step has no required capabilities specified',
                    stepId: step.id,
                    field: 'requiredCapabilities'
                });
            }
            // Timeout validation
            if (step.timeout && step.timeout < 1000) {
                warnings.push({
                    type: 'warning',
                    code: 'SHORT_TIMEOUT',
                    message: 'Step timeout is very short (<1 second)',
                    stepId: step.id,
                    field: 'timeout'
                });
            }
            if (step.timeout && step.timeout > 3600000) { // 1 hour
                warnings.push({
                    type: 'warning',
                    code: 'LONG_TIMEOUT',
                    message: 'Step timeout is very long (>1 hour)',
                    stepId: step.id,
                    field: 'timeout'
                });
            }
            // Retry count validation
            if (step.retryCount && step.retryCount > 5) {
                warnings.push({
                    type: 'warning',
                    code: 'HIGH_RETRY_COUNT',
                    message: 'Step has high retry count (>5)',
                    stepId: step.id,
                    field: 'retryCount'
                });
            }
        }
    }
    /**
     * Validate step dependencies
     */
    validateDependencies(steps, errors, warnings) {
        const stepIds = new Set(steps.map(step => step.id));
        for (const step of steps) {
            if (step.dependencies) {
                // Check dependencies exist
                for (const depId of step.dependencies) {
                    if (!stepIds.has(depId)) {
                        errors.push({
                            type: 'error',
                            code: 'INVALID_DEPENDENCY',
                            message: Step, depends, on, non
                        } - existent, step, $, { depId }, stepId, step.id, field, 'dependencies');
                    }
                    ;
                }
            }
            // Check for self-dependency
            if (step.dependencies.includes(step.id)) {
                errors.push({
                    type: 'error',
                    code: 'SELF_DEPENDENCY',
                    message: 'Step cannot depend on itself',
                    stepId: step.id,
                    field: 'dependencies'
                });
            }
            // Warn about many dependencies
            if (step.dependencies.length > 5) {
                warnings.push({
                    type: 'warning',
                    code: 'MANY_DEPENDENCIES',
                    message: 'Step has many dependencies (>5), consider simplifying',
                    stepId: step.id,
                    field: 'dependencies'
                });
            }
        }
    }
    // Check for circular dependencies
    circularDeps = this.findCircularDependencies(steps);
    for(, cycle, of, circularDeps) {
        errors.push({
            type: 'error',
            code: 'CIRCULAR_DEPENDENCY',
        } `
        message: Circular dependency detected: ${cycle.join(' -> ')}`, field, 'dependencies');
    }
    ;
};
exports.WorkflowValidator = WorkflowValidator;
exports.WorkflowValidator = WorkflowValidator = __decorate([
    (0, common_1.Injectable)()
], WorkflowValidator);
validatePerformance(workflow, agent_orchestrator_1.Workflow, errors, ValidationError[], warnings, ValidationError[]);
void {
    // Calculate maximum execution time
    const: maxExecutionTime = this.calculateMaxExecutionTime(workflow.steps),
    if(maxExecutionTime) { }
} > 3600000;
{ // 1 hour
    warnings.push({
        type: 'warning',
        code: 'LONG_EXECUTION_TIME',
        message: agent_orchestrator_1.Workflow, may, take, very, long, to, execute() { }
    } > $, { Math, : .round(maxExecutionTime / 60000) }, minutes),
        field;
    'performance';
}
;
// Check for potential bottlenecks
const bottlenecks = this.findBottlenecks(workflow.steps);
for (const bottleneck of bottlenecks) {
    warnings.push({} `
        type: 'warning',`, code, 'POTENTIAL_BOTTLENECK', message, Step, may, be, a, bottleneck, $, { bottleneck, : .reason } `,
        stepId: bottleneck.stepId,
        field: 'performance'
      });
    }
  }

  /**
   * Find circular dependencies in workflow steps
   */
  private findCircularDependencies(steps: WorkflowStep[]): string[][] {
    const graph = new Map<string, string[]>();
    const cycles: string[][] = [];
    
    // Build dependency graph
    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }

    // Find cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        // Found cycle - extract the cycle from currentPath
        const cycleStart = currentPath.indexOf(stepId);
        if (cycleStart !== -1) {
          cycles.push([...currentPath.slice(cycleStart), stepId]);
        }
        return true;
      }

      if (visited.has(stepId)) {
        return false;
      }

      visited.add(stepId);
      recursionStack.add(stepId);
      currentPath.push(stepId);

      const dependencies = graph.get(stepId) || [];
      for (const depId of dependencies) {
        if (dfs(depId)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      currentPath.pop();
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        dfs(step.id);
      }
    }

    return cycles;
  }

  /**
   * Calculate maximum possible execution time
   */
  private calculateMaxExecutionTime(steps: WorkflowStep[]): number {
    // Simple calculation: sum of all step timeouts
    // In reality, this would be more complex considering parallelization
    return steps.reduce((total, step) => total + (step.timeout || 300000), 0);
  }

  /**
   * Find potential performance bottlenecks
   */
  private findBottlenecks(steps: WorkflowStep[]): Array<{ stepId: string; reason: string }> {
    const bottlenecks: Array<{ stepId: string; reason: string }> = [];
    
    // Build dependency counts
    const dependencyCount = new Map<string, number>();
    const dependentCount = new Map<string, number>();
    
    for (const step of steps) {
      dependencyCount.set(step.id, (step.dependencies || []).length);
      dependentCount.set(step.id, 0);
    }
    
    for (const step of steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          dependentCount.set(depId, (dependentCount.get(depId) || 0) + 1);
        }
      }
    }

    for (const step of steps) {
      const deps = dependencyCount.get(step.id) || 0;
      const dependents = dependentCount.get(step.id) || 0;
      
      if (deps > 3) {
        bottlenecks.push({
          stepId: step.id,
          reason: Has many dependencies (${deps})
        });
      }
      
      if (dependents > 5) {`, bottlenecks.push({} `
          stepId: step.id,
          reason: Many steps depend on this (${dependents})`));
}
;
if ((step.timeout || 300000) > 600000) { // 10 minutes
    bottlenecks.push({
        stepId: step.id,
        reason: 'Has very long timeout'
    });
}
return bottlenecks;
//# sourceMappingURL=WorkflowValidator.js.map