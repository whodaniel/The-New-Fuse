export interface PromptBlock {
    id: string;
    type: 'system' | 'user' | 'assistant' | 'function' | 'variable' | 'condition' | 'summary' | 'context' | 'instruction';
    content: string;
    position: number;
    locked: boolean;
    collapsed?: boolean;
    metadata?: {
        name?: string;
        description?: string;
        parameters?: Record<string, any>;
        validation?: {
            required?: boolean;
            type?: string;
            pattern?: string;
        };
    };
    children?: PromptBlock[];
    parentId?: string | null;
}
export interface PromptVersion {
    id: string;
    version: number;
    name?: string;
    label: 'staging' | 'production' | 'development' | 'archived';
    content: string;
    variables: Record<string, any>;
    blocks: PromptBlock[];
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
    metrics?: {
        successRate: number;
        totalRuns: number;
        avgResponseTime: number;
        lastRun?: Date;
    };
    changelog?: string;
}
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    currentVersion: string;
    versions: PromptVersion[];
    blocks: PromptBlock[];
    variables: Record<string, any>;
    tags: string[];
    category: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    analytics?: {
        totalRuns: number;
        successRate: number;
        popularVariables: string[];
        recentActivity: Date[];
    };
}
export interface PromptSnippet {
    id: string;
    name: string;
    content: string;
    type: PromptBlock['type'];
    category: string;
    tags: string[];
    usageCount: number;
    description?: string;
    parameters?: Record<string, any>;
    isStarred?: boolean;
}
export interface PromptExecutionResult {
    id: string;
    templateId: string;
    versionId: string;
    executedAt: Date;
    success: boolean;
    responseTime: number;
    tokenUsage?: number;
    result?: any;
    error?: string;
    variables: Record<string, any>;
}
export interface PromptTemplateService {
    createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate>;
    getTemplate(id: string): Promise<PromptTemplate | null>;
    updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null>;
    deleteTemplate(id: string): Promise<boolean>;
    listTemplates(filter?: Partial<PromptTemplate>): Promise<PromptTemplate[]>;
    createVersion(templateId: string, version: Omit<PromptVersion, 'id' | 'createdAt'>): Promise<PromptVersion>;
    getVersion(versionId: string): Promise<PromptVersion | null>;
    setActiveVersion(templateId: string, versionId: string): Promise<PromptTemplate | null>;
    listVersions(templateId: string): Promise<PromptVersion[]>;
    createSnippet(snippet: Omit<PromptSnippet, 'id' | 'usageCount'>): Promise<PromptSnippet>;
    getSnippet(id: string): Promise<PromptSnippet | null>;
    updateSnippet(id: string, updates: Partial<PromptSnippet>): Promise<PromptSnippet | null>;
    deleteSnippet(id: string): Promise<boolean>;
    listSnippets(filter?: Partial<PromptSnippet>): Promise<PromptSnippet[]>;
    incrementSnippetUsage(id: string): Promise<void>;
    compileTemplate(templateId: string, versionId?: string, variables?: Record<string, any>): Promise<string>;
    executeTemplate(templateId: string, versionId?: string, variables?: Record<string, any>): Promise<PromptExecutionResult>;
    getTemplateAnalytics(templateId: string): Promise<PromptTemplate['analytics']>;
    recordExecution(result: PromptExecutionResult): Promise<void>;
}
export interface PromptTemplateWorkflowNode {
    id: string;
    type: 'prompt-template';
    data: {
        templateId: string;
        versionId?: string;
        variables: Record<string, any>;
        outputVariable?: string;
    };
    position: {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=types.d.ts.map