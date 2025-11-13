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
export interface ClaudeDevTemplate {
    id: string;
    name: string;
    description: string;
    category: 'development' | 'analysis' | 'operations' | 'security' | 'ui_ux';
    version: string;
    author: string;
    tags: string[];
    defaultConfiguration: ClaudeDevConfiguration;
    defaultPermissions: ClaudeDevPermissions;
    prompts: {
        systemPrompt: string;
        taskPrompts: Record<string, string>;
        contextPrompts: Record<string, string>;
    };
    workflows: ClaudeDevWorkflow[];
    capabilities: string[];
    integrations: string[];
    examples: ClaudeDevTemplateExample[];
}
export interface ClaudeDevWorkflow {
    id: string;
    name: string;
    description: string;
    steps: ClaudeDevWorkflowStep[];
    triggers: string[];
    outputs: string[];
}
export interface ClaudeDevWorkflowStep {
    id: string;
    name: string;
    type: 'analysis' | 'action' | 'review' | 'approval' | 'notification';
    description: string;
    prompt: string;
    parameters: Record<string, any>;
    conditions: string[];
    timeout: number;
}
export interface ClaudeDevTemplateExample {
    name: string;
    description: string;
    input: Record<string, any>;
    expectedOutput: Record<string, any>;
    workflow: string;
}
//# sourceMappingURL=claude-types.d.ts.map