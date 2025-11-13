/**
 * Mock types for API client services
 * These declarations ensure the hooks package builds properly
 * without external dependencies on the actual API client package.
 */
export interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export interface Agent {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    capabilities: string[];
}
export interface AgentCreateData {
    name: string;
    description?: string;
    type: string;
    capabilities?: string[];
}
export interface AgentUpdateData {
    name?: string;
    description?: string;
    status?: string;
    capabilities?: string[];
}
export declare class AgentService {
    getAgents(page?: number, limit?: number): Promise<{
        agents: Agent[];
        total: number;
    }>;
    getAgent(id: string): Promise<Agent>;
    createAgent(data: AgentCreateData): Promise<Agent>;
    updateAgent(id: string, data: AgentUpdateData): Promise<Agent>;
    deleteAgent(id: string): Promise<void>;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}
export declare class AuthService {
    isAuthenticated(): Promise<boolean>;
    login(credentials: LoginCredentials): Promise<{
        token: string;
        user: any;
    }>;
    register(data: RegisterData): Promise<{
        token: string;
        user: any;
    }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<any>;
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: string;
    steps: WorkflowStep[];
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
}
export interface WorkflowCreateData {
    name: string;
    description?: string;
    steps?: Partial<WorkflowStep>[];
}
export interface WorkflowUpdateData {
    name?: string;
    description?: string;
    status?: string;
    steps?: Partial<WorkflowStep>[];
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: string;
    result: any;
    createdAt: Date;
    completedAt?: Date;
}
export declare class WorkflowService {
    getWorkflows(page?: number, limit?: number): Promise<{
        workflows: Workflow[];
        total: number;
    }>;
    getWorkflow(id: string): Promise<Workflow>;
    createWorkflow(data: WorkflowCreateData): Promise<Workflow>;
    updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow>;
}
//# sourceMappingURL=api-client.d.ts.map