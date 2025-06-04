import { ClaudeDevAutomationService, AutomationResult, ClaudeDevTemplate } from '../services/ClaudeDevAutomationService';
export declare class CreateAutomationDto {
    templateId: string;
    parameters: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: string;
    context?: {
        projectId?: string;
        workflowId?: string;
        parentTaskId?: string;
    };
}
export declare class CreateTemplateDto {
    name: string;
    description: string;
    category: 'development' | 'analysis' | 'automation' | 'communication';
    prompt: string;
    parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        required: boolean;
        defaultValue?: any;
        validation?: {
            min?: number;
            max?: number;
            pattern?: string;
            options?: string[];
        };
    }>;
    outputFormat?: 'json' | 'markdown' | 'code' | 'plain';
    estimatedTokens: number;
    tags: string[];
}
export declare class AuthGuard {
    canActivate(): boolean;
}
export declare class ClaudeDevAutomationController {
    private readonly claudeDevService;
    private readonly logger;
    constructor(claudeDevService: ClaudeDevAutomationService);
    listTemplates(category?: string): Promise<{
        templates: ClaudeDevTemplate[];
    }>;
    getTemplate(templateId: string): Promise<{
        template: ClaudeDevTemplate;
    }>;
    createTemplate(createTemplateDto: CreateTemplateDto, req: any): Promise<{
        templateId: string;
        message: string;
    }>;
    deleteTemplate(templateId: string, req: any): Promise<{
        message: string;
    }>;
    executeAutomation(createAutomationDto: CreateAutomationDto, req: any): Promise<{
        automation: AutomationResult;
    }>;
    listAutomations(limit?: string, req: any): Promise<{
        automations: AutomationResult[];
    }>;
    getAutomation(automationId: string, req: any): Promise<{
        automation: AutomationResult;
    }>;
    cancelAutomation(automationId: string, req: any): Promise<{
        message: string;
    }>;
    getUserStats(req: any): Promise<{
        stats: {
            totalAutomations: number;
            successfulAutomations: number;
            failedAutomations: number;
            totalTokensUsed: number;
            totalCost: number;
            averageExecutionTime: number;
        };
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
