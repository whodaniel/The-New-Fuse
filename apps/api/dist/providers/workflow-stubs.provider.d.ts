import { WorkflowEngine, WorkflowExecutor } from '../types/core';
/**
 * Stub implementation of WorkflowEngine
 * TODO: Replace with actual implementation when workflow engine is ready
 */
export declare class WorkflowEngineStub implements WorkflowEngine {
    private readonly logger;
    private fail;
    createWorkflow(definition: any): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    updateWorkflow(id: string, data: any): Promise<any>;
    deleteWorkflow(id: string): Promise<boolean>;
}
/**
 * Stub implementation of WorkflowExecutor
 * TODO: Replace with actual implementation when workflow executor is ready
 */
export declare class WorkflowExecutorStub implements WorkflowExecutor {
    private readonly logger;
    private fail;
    execute(workflow: any, input: any): Promise<any>;
    cancel(executionId: string): Promise<any>;
    pause(executionId: string): Promise<any>;
    resume(executionId: string): Promise<any>;
}
/**
 * Providers for stub implementations
 * Use these in modules until real implementations are ready
 */
export declare const WORKFLOW_ENGINE_PROVIDER: {
    provide: string;
    useClass: typeof WorkflowEngineStub;
};
export declare const WORKFLOW_EXECUTOR_PROVIDER: {
    provide: string;
    useClass: typeof WorkflowExecutorStub;
};
//# sourceMappingURL=workflow-stubs.provider.d.ts.map