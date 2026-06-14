var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CustomCodeIntegrationService_1;
import { Injectable, Logger } from '@nestjs/common';
let CustomCodeIntegrationService = CustomCodeIntegrationService_1 = class CustomCodeIntegrationService {
    constructor() {
        this.logger = new Logger(CustomCodeIntegrationService_1.name);
        this.injectedSteps = new Map();
    }
    injectCustomCode(workflow, targetStepId, position, code, options) {
        const stepIndex = workflow.steps.findIndex((s) => s.id === targetStepId);
        if (stepIndex === -1) {
            throw new Error(`Step not found: ${targetStepId} in workflow ${workflow.id}`);
        }
        const previousStepType = workflow.steps[stepIndex].type;
        const customStep = {
            id: `custom-${targetStepId}-${Date.now()}`,
            name: options?.stepName || `Custom code at ${targetStepId}`,
            type: 'custom_code',
            code,
            language: options?.language || 'typescript',
            timeout: options?.timeout || 30000,
            sandboxed: options?.sandboxed !== false,
            dependencies: position === 'after' ? [targetStepId] : workflow.steps[stepIndex].dependencies,
        };
        this.injectedSteps.set(customStep.id, customStep);
        if (position === 'replace') {
            const targetDeps = workflow.steps[stepIndex].dependencies || [];
            customStep.dependencies = targetDeps;
            const afterSteps = workflow.steps.filter((s) => s.dependencies?.includes(targetStepId));
            for (const afterStep of afterSteps) {
                if (afterStep.dependencies) {
                    const idx = afterStep.dependencies.indexOf(targetStepId);
                    if (idx !== -1) {
                        afterStep.dependencies[idx] = customStep.id;
                    }
                }
            }
            workflow.steps[stepIndex] = customStep;
        }
        else if (position === 'before') {
            customStep.dependencies = workflow.steps[stepIndex].dependencies || [];
            workflow.steps[stepIndex].dependencies = [customStep.id];
            workflow.steps.splice(stepIndex, 0, customStep);
        }
        else {
            customStep.dependencies = [targetStepId];
            const afterSteps = workflow.steps.filter((s) => s.dependencies?.includes(targetStepId));
            for (const afterStep of afterSteps) {
                if (afterStep.dependencies) {
                    const idx = afterStep.dependencies.indexOf(targetStepId);
                    if (idx !== -1) {
                        afterStep.dependencies[idx] = customStep.id;
                    }
                }
            }
            workflow.steps.splice(stepIndex + 1, 0, customStep);
        }
        this.logger.log(`Injected custom code at step ${targetStepId} (${position}) in workflow ${workflow.id}`);
        return {
            workflowId: workflow.id,
            stepId: customStep.id,
            injected: true,
            position,
            previousStepType,
        };
    }
    getInjectedStep(stepId) {
        return this.injectedSteps.get(stepId);
    }
    removeInjectedStep(workflow, stepId) {
        const step = this.injectedSteps.get(stepId);
        if (!step)
            return false;
        const stepIndex = workflow.steps.findIndex((s) => s.id === stepId);
        if (stepIndex === -1)
            return false;
        const dependentSteps = workflow.steps.filter((s) => s.dependencies?.includes(stepId));
        const stepDeps = step.dependencies || [];
        for (const dep of dependentSteps) {
            if (dep.dependencies) {
                const idx = dep.dependencies.indexOf(stepId);
                if (idx !== -1) {
                    dep.dependencies.splice(idx, 1, ...stepDeps);
                }
            }
        }
        workflow.steps.splice(stepIndex, 1);
        this.injectedSteps.delete(stepId);
        this.logger.log(`Removed injected step ${stepId} from workflow ${workflow.id}`);
        return true;
    }
    listInjectedSteps() {
        return Array.from(this.injectedSteps.values());
    }
};
CustomCodeIntegrationService = CustomCodeIntegrationService_1 = __decorate([
    Injectable()
], CustomCodeIntegrationService);
export { CustomCodeIntegrationService };
//# sourceMappingURL=CustomCodeIntegrationService.js.map