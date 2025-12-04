import { Workflow } from '@/services/WorkflowService';
export declare const useWorkflow: () => {
    workflows: Workflow[];
    currentWorkflow: any;
    executions: WorkflowExecution[];
    loading: boolean;
    error: Error | null;
    setCurrentWorkflow: import("react").Dispatch<any>;
    createWorkflow: (name: string, description?: string) => Promise<any>;
    loadWorkflows: () => Promise<void>;
    saveWorkflow: (workflow: Workflow) => Promise<any>;
    deleteWorkflow: (id: string) => Promise<void>;
    executeWorkflow: (workflowId: string, input?: Record<string, any>) => Promise<any>;
    loadExecutions: (workflowId?: string) => Promise<void>;
    getWorkflow: (id: string) => Promise<any>;
};
export default useWorkflow;
