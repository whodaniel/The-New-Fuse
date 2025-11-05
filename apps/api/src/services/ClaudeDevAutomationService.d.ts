export interface AutomationRequest {
    templateId: string;
    parameters: Record<string, any>;
    userId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: Date;
    context?: Record<string, any>;
}
export interface AutomationResult {
    id: string;
    templateId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    result?: any;
    error?: string;
    metadata: {
        userId: string;
        startTime: Date;
        endTime?: Date;
        duration?: number;
    };
}
export interface ClaudeDevTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    tags: string[];
    capabilities: string[];
    integrations: string[];
    prompt: string;
    parameters: Array<{
        name: string;
        type: string;
        description: string;
        required: boolean;
        defaultValue?: any;
    }>;
}
export interface ClaudeDevAgent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'busy' | 'error';
    capabilities: string[];
    tenantId?: string;
    createdAt: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
}
export interface ClaudeDevTask {
    id: string;
    agentId: string;
    templateId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    parameters: Record<string, any>;
    result?: any;
    error?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}
export interface ClaudeDevStatistics {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    systemUptime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface ClaudeDevConfiguration {
    maxConcurrentTasks: number;
    timeout: number;
    retryAttempts: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableCache: boolean;
    cacheSize: number;
    autoBackup: boolean;
    backupInterval: number;
}
export interface ClaudeDevPermissions {
    canCreateAgents: boolean;
    canDeleteAgents: boolean;
    canModifyAgents: boolean;
    canExecuteTasks: boolean;
    canViewStatistics: boolean;
    canManageTemplates: boolean;
    canAccessLogs: boolean;
    canExportData: boolean;
    maxAgentsPerUser: number;
    maxTasksPerDay: number;
}
export declare class ClaudeDevAutomationService {
    private readonly logger;
    private templates;
    private automations;
    constructor();
    listTemplates(category?: string): Promise<ClaudeDevTemplate[]>;
    getTemplate(templateId: string): Promise<ClaudeDevTemplate | null>;
    createCustomTemplate(templateData: Partial<ClaudeDevTemplate>): Promise<string>;
    deleteTemplate(templateId: string): Promise<boolean>;
    executeAutomation(request: AutomationRequest): Promise<AutomationResult>;
    listAutomations(userId: string, limit?: number): Promise<AutomationResult[]>;
    getAutomationResult(automationId: string): Promise<AutomationResult | null>;
    cancelAutomation(automationId: string, userId: string): Promise<boolean>;
    getUsageStats(userId: string): Promise<any>;
    private processAutomation;
    private initializeDefaultTemplates;
    /**
     * Get health status of the automation service
     */
    getHealthStatus(): Promise<any>;
    /**
     * Get service statistics
     */
    getStatistics(): Promise<any>;
    /**
     * Create a new agent
     */
    createAgent(agentData: any): Promise<any>;
    /**
     * Get agents by tenant
     */
    getAgentsByTenant(tenantId: string): Promise<any[]>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Promise<any | null>;
    /**
     * Execute a task
     */
    executeTask(taskData: any): Promise<any>;
    /**
     * Create agent batch
     */
    createAgentBatch(batchData: any): Promise<any>;
    /**
     * Get tasks by agent ID
     */
    getTasksByAgent(agentId: string, tenantId?: string): Promise<AutomationResult[]>;
}
//# sourceMappingURL=ClaudeDevAutomationService.d.ts.map