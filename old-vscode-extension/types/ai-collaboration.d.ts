export interface AITask {
    id: string;
    type: string;
    input: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}
export interface AICollaborationWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: AITask[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export interface WorkflowStep {
    id: string;
    type: string;
    input: any;
    output?: any;
    error?: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=ai-collaboration.d.ts.map