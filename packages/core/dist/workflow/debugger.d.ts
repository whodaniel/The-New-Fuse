interface WorkflowTemplate {
    id: string;
    name: string;
}
interface DebugContext {
    sessionId: string;
    userId: string;
}
interface WorkflowStep {
    id: string;
    name: string;
}
interface WorkflowDebugState {
    currentStep: WorkflowStep | null;
    variables: Record<string, unknown>;
    callStack: string[];
    breakpoints: string[];
}
declare class DebugSession {
    private readonly id;
    private readonly workflow;
    private readonly context;
    private breakpointHandlers;
    constructor(workflow: WorkflowTemplate, context: DebugContext);
    onBreakpoint(handler: (stepId: string) => Promise<void>): void;
    triggerBreakpoint(stepId: string): Promise<void>;
    getId(): string;
}
export declare class WorkflowDebugger {
    private readonly breakpoints;
    private readonly stepTracer;
    private readonly sessions;
    constructor();
    debugWorkflow(workflow: WorkflowTemplate, context: DebugContext): Promise<DebugSession>;
    getDebugState(sessionId: string): Promise<WorkflowDebugState>;
    private handleBreakpoint;
    private getCurrentStep;
    private getVariables;
    private getCallStack;
}
export {};
//# sourceMappingURL=debugger.d.ts.map