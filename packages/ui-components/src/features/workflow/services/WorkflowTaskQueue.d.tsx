export declare class WorkflowTaskQueue {
    private static instance;
    private taskService;
    private constructor();
    static getInstance(): WorkflowTaskQueue;
    enqueueWorkflowStep(): Promise<void>;
}
