import { PromptExecutionResult, PromptSnippet, PromptTemplate, PromptTemplateService, PromptVersion } from './types.js';
export declare class PromptTemplateServiceImpl implements PromptTemplateService {
    private repository;
    constructor();
    createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate>;
    getTemplate(id: string, userId: string): Promise<PromptTemplate | null>;
    updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null>;
    deleteTemplate(id: string): Promise<boolean>;
    listTemplates(userId: string, filter?: Partial<PromptTemplate>): Promise<PromptTemplate[]>;
    createVersion(templateId: string, version: Omit<PromptVersion, 'id' | 'createdAt'>): Promise<PromptVersion>;
    getVersion(versionId: string): Promise<PromptVersion | null>;
    setActiveVersion(templateId: string, versionId: string): Promise<PromptTemplate | null>;
    listVersions(templateId: string, userId: string): Promise<PromptVersion[]>;
    createSnippet(snippet: Omit<PromptSnippet, 'id' | 'usageCount'>): Promise<PromptSnippet>;
    getSnippet(id: string): Promise<PromptSnippet | null>;
    updateSnippet(id: string, updates: Partial<PromptSnippet>): Promise<PromptSnippet | null>;
    deleteSnippet(id: string): Promise<boolean>;
    listSnippets(userId: string, filter?: Partial<PromptSnippet>): Promise<PromptSnippet[]>;
    incrementSnippetUsage(id: string): Promise<void>;
    compileTemplate(templateId: string, userId: string, versionId?: string, variables?: Record<string, any>): Promise<string>;
    executeTemplate(templateId: string, userId: string, versionId?: string, variables?: Record<string, any>): Promise<PromptExecutionResult>;
    getTemplateAnalytics(templateId: string): Promise<PromptTemplate['analytics']>;
    recordExecution(result: PromptExecutionResult): Promise<void>;
    private mapTemplate;
    private mapVersion;
    private mapSnippet;
}
export default PromptTemplateServiceImpl;
//# sourceMappingURL=PromptTemplateService.d.ts.map