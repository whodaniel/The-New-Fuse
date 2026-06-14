import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
export declare class ClaudeDevCreateAgentDto {
    name?: string;
    description?: string;
    template: string;
    configuration?: any;
    permissions?: any;
    metadata?: Record<string, any>;
}
export declare class ClaudeDevUpdateAgentDto {
    name?: string;
    description?: string;
    configuration?: any;
    permissions?: any;
    metadata?: Record<string, any>;
}
export declare class ExecuteTaskDto {
    type: 'code_review' | 'project_setup' | 'debug' | 'documentation' | 'test' | 'refactor' | 'deploy' | 'security' | 'analysis' | 'ui_ux';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    parameters?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class CreateAgentBatchDto {
    agents: ClaudeDevCreateAgentDto[];
}
export declare class TemplateCustomizationDto {
    templateId: string;
    configuration?: any;
    permissions?: any;
    metadata?: Record<string, any>;
}
export declare class ClaudeDevAutomationController {
    private readonly claudeDevService;
    private readonly logger;
    constructor(claudeDevService: ClaudeDevAutomationService);
    getHealthStatus(): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    getStatistics(tenantId?: string): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    createAgent(tenantId: string, createAgentDto: ClaudeDevCreateAgentDto): Promise<{
        success: boolean;
        data: any;
        message: string;
        timestamp: string;
    }>;
    getAgentsByTenant(tenantId: string, status?: string, template?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
        timestamp: string;
    }>;
    getAgent(tenantId: string, agentId: string): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    executeTask(tenantId: string, agentId: string, executeTaskDto: ExecuteTaskDto): Promise<{
        success: boolean;
        data: any;
        message: string;
        timestamp: string;
    }>;
    getTasksByTenant(tenantId: string, agentId?: string, status?: string, type?: string, limit?: string): Promise<{
        success: boolean;
        data: import("../services/ClaudeDevAutomationService").AutomationResult[];
        count: number;
        timestamp: string;
    }>;
    createAgentBatch(tenantId: string, createAgentBatchDto: CreateAgentBatchDto): Promise<{
        success: boolean;
        data: any;
        message: string;
        requested: number;
        created: any;
        timestamp: string;
    }>;
    getTemplates(category?: string, tag?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string;
            category: "security" | "analysis" | "development" | "operations" | "ui_ux";
            version: string;
            author: string;
            tags: string[];
            capabilities: string[];
            integrations: string[];
        }[];
        count: number;
        timestamp: string;
    }>;
    getTemplate(templateId: string): Promise<{
        success: boolean;
        data: import("../services/claude-dev-templates").ClaudeDevTemplate;
        timestamp: string;
    }>;
    customizeTemplate(templateId: string, customization: TemplateCustomizationDto): Promise<{
        success: boolean;
        data: {
            template: string;
            configuration: {
                maxConcurrentTasks: number;
                timeout: number;
                retryAttempts: number;
                logLevel: "debug" | "info" | "warn" | "error";
                enableMetrics: boolean;
                enableCache: boolean;
                cacheSize: number;
                autoBackup: boolean;
                backupInterval: number;
            };
            permissions: {
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
            };
            metadata: {
                templateVersion: string;
                templateAuthor: string;
                capabilities: string[];
            };
        };
        message: string;
        timestamp: string;
    }>;
    getUsageAnalytics(tenantId: string, period?: string): Promise<{
        success: boolean;
        data: {
            period: string;
            summary: {
                totalAgents: any;
                activeAgents: any;
                totalTasks: any;
                successRate: any;
                averageTaskDuration: any;
            };
            agentDistribution: {
                byTemplate: Record<string, number>;
                byStatus: Record<string, number>;
            };
            performance: {
                resourceUsage: any;
                efficiency: any;
            };
            trends: {
                taskVolumeGrowth: string;
                successRateTrend: string;
                avgDurationTrend: string;
            };
        };
        timestamp: string;
    }>;
    private validateTenantId;
    private validateAgentId;
    private validateCreateAgentDto;
    private validateExecuteTaskDto;
    private groupAgentsByTemplate;
    private groupAgentsByStatus;
    private calculateEfficiencyMetrics;
}
//# sourceMappingURL=claude-dev-automation.controller.d.ts.map