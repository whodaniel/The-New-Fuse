import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';
export interface ClaudeDevAgent {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    template: string;
    configuration: ClaudeDevConfiguration;
    status: 'active' | 'inactive' | 'error' | 'initializing';
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    permissions: ClaudeDevPermissions;
    health: {
        lastHealthCheck: Date;
        status: 'healthy' | 'unhealthy' | 'unknown';
        errorCount: number;
        uptime: number;
    };
}
export interface ClaudeDevConfiguration {
    autoApprove: boolean;
    maxFileOperations: number;
    allowedDirectories: string[];
    taskTimeout: number;
    concurrentTasks: number;
    integrations: {
        workspace: boolean;
        terminal: boolean;
        browser: boolean;
        vscode: boolean;
    };
    capabilities: {
        fileOperations: boolean;
        codeAnalysis: boolean;
        terminalAccess: boolean;
        webBrowsing: boolean;
        imageProcessing: boolean;
    };
    automationLevel: 'manual' | 'semi-auto' | 'auto';
    notifications: {
        onTaskStart: boolean;
        onTaskComplete: boolean;
        onError: boolean;
        onApprovalRequired: boolean;
    };
}
export interface ClaudeDevPermissions {
    canCreateFiles: boolean;
    canDeleteFiles: boolean;
    canModifyFiles: boolean;
    canExecuteTerminal: boolean;
    canBrowseWeb: boolean;
    canAccessWorkspace: boolean;
    allowedFileTypes: string[];
    restrictedPaths: string[];
    maxFileSize: number;
}
export interface ClaudeDevTask {
    id: string;
    agentId: string;
    tenantId: string;
    type: 'code_review' | 'project_setup' | 'debug' | 'documentation' | 'test' | 'refactor' | 'deploy' | 'security' | 'analysis' | 'ui_ux';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'approval_required';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    parameters: Record<string, any>;
    progress: {
        percentage: number;
        currentStep: string;
        totalSteps: number;
        completedSteps: number;
        estimatedTimeRemaining: number;
    };
    result?: {
        success: boolean;
        output: any;
        files: string[];
        metrics: Record<string, number>;
        recommendations: string[];
    };
    error?: {
        message: string;
        code: string;
        details: any;
        timestamp: Date;
    };
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    metadata: Record<string, any>;
}
export interface ClaudeDevStatistics {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    successRate: number;
    resourceUsage: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkUsage: number;
    };
}
export declare class ClaudeDevAutomationService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private agents;
    private tasks;
    private healthCheckInterval?;
    private metricsCollectionInterval?;
    private initialized;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    createAgent(tenantId: string, agentData: Partial<ClaudeDevAgent>): Promise<ClaudeDevAgent>;
    getAgent(agentId: string, tenantId: string): Promise<ClaudeDevAgent | undefined>;
    getAgentsByTenant(tenantId: string): Promise<ClaudeDevAgent[]>;
    executeTask(agentId: string, tenantId: string, taskData: Partial<ClaudeDevTask>): Promise<ClaudeDevTask>;
    getStatistics(tenantId?: string): Promise<ClaudeDevStatistics>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
    private setupEventListeners;
    private executeTaskAsync;
    private performTaskExecution;
    private getDefaultConfiguration;
    private getDefaultPermissions;
    private validateAgentConfiguration;
    private initializeAgent;
    private startHealthChecks;
    private startMetricsCollection;
    private performHealthChecks;
    private collectMetrics;
    private generateId;
    private handleAgentCreated;
    private handleTaskStarted;
    private handleTaskCompleted;
    private handleTaskFailed;
}
