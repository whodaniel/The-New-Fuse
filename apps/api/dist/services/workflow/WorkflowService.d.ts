export interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: 'draft' | 'running' | 'completed' | 'error' | 'paused';
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    agentId?: string;
    action: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'error';
    order: number;
    dependencies?: string[];
}
export declare class WorkflowService {
    private workflows;
    createWorkflow(data: Partial<Workflow>, userId: string): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    getUserWorkflows(userId: string): Promise<Workflow[]>;
    updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    executeWorkflow(id: string): Promise<void>;
    pauseWorkflow(id: string): Promise<void>;
    resumeWorkflow(id: string): Promise<void>;
}
//# sourceMappingURL=WorkflowService.d.ts.map