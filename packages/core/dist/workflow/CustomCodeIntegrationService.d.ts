import { WorkflowStep, WorkflowState } from '../agents/AgentWorkflowManager.js';
export interface CustomCodeStep extends WorkflowStep {
    type: 'custom_code';
    code: string;
    language?: 'typescript' | 'javascript' | 'python';
    timeout?: number;
    sandboxed?: boolean;
}
export interface CodeInjectionResult {
    workflowId: string;
    stepId: string;
    injected: boolean;
    position: 'before' | 'after' | 'replace';
    previousStepType: string;
}
export declare class CustomCodeIntegrationService {
    private readonly logger;
    private readonly injectedSteps;
    injectCustomCode(workflow: WorkflowState, targetStepId: string, position: 'before' | 'after' | 'replace', code: string, options?: {
        language?: 'typescript' | 'javascript' | 'python';
        timeout?: number;
        sandboxed?: boolean;
        stepName?: string;
    }): CodeInjectionResult;
    getInjectedStep(stepId: string): CustomCodeStep | undefined;
    removeInjectedStep(workflow: WorkflowState, stepId: string): boolean;
    listInjectedSteps(): CustomCodeStep[];
}
//# sourceMappingURL=CustomCodeIntegrationService.d.ts.map