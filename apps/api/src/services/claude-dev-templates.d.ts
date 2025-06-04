import { ClaudeDevConfiguration, ClaudeDevPermissions } from './ClaudeDevAutomationService';
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
export declare class ClaudeDevTemplateRegistry {
    private static templates;
    static registerTemplate(template: ClaudeDevTemplate): void;
    static getTemplate(id: string): ClaudeDevTemplate | undefined;
    static getAllTemplates(): ClaudeDevTemplate[];
    static getTemplatesByCategory(category: string): ClaudeDevTemplate[];
    static getTemplatesByTag(tag: string): ClaudeDevTemplate[];
}
declare const SENIOR_CODE_REVIEWER_TEMPLATE: ClaudeDevTemplate;
declare const FULLSTACK_PROJECT_SETUP_TEMPLATE: ClaudeDevTemplate;
export declare class ClaudeDevTemplateUtils {
    static createAgentFromTemplate(templateId: string, customizations?: {
        configuration?: Partial<ClaudeDevConfiguration>;
        permissions?: Partial<ClaudeDevPermissions>;
        metadata?: Record<string, any>;
    }): {
        template: string;
        configuration: any;
        permissions: any;
        metadata: {
            templateVersion: string;
            templateAuthor: string;
            capabilities: string[];
        };
    };
    static getTemplatesByCapability(capability: string): ClaudeDevTemplate[];
    static getRecommendedTemplate(taskType: string, requirements: string[]): ClaudeDevTemplate | null;
    static getTemplateDocumentation(templateId: string): string;
}
export { ClaudeDevTemplateRegistry, ClaudeDevTemplateUtils, SENIOR_CODE_REVIEWER_TEMPLATE, FULLSTACK_PROJECT_SETUP_TEMPLATE, };
