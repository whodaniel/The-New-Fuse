import { WorkflowStep, WorkflowState } from '../types.js';
export declare class WorkflowTestUtils {
    static createMockStep(overrides?: Partial<WorkflowStep>): WorkflowStep;
    static createMockWorkflowState(overrides?: Partial<WorkflowState>): WorkflowState;
    static simulateStepExecution(step: WorkflowStep, delay?: number): Promise<void>;
    static createTestWorkflow(numSteps: number): WorkflowStep[];
}
