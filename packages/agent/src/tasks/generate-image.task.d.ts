interface WorkflowTask {
    id: string;
    title: string;
    description: string;
    steps: Array<{
        tool: string;
        args: Record<string, any>;
    }>;
}
export declare const GenerateImageTask: WorkflowTask;
export {};
//# sourceMappingURL=generate-image.task.d.ts.map