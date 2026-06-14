import { DatabaseService } from '@the-new-fuse/database';
interface PromptTemplate {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    category?: string;
    tags: string[];
    analytics: Record<string, any>;
    currentVersionId?: string;
    createdAt: Date;
    updatedAt: Date;
    versions: PromptVersion[];
}
interface PromptVersion {
    id: string;
    templateId: string;
    version: number;
    content: string;
    label?: string;
    variables: Record<string, any>;
    changelog?: string;
    isActive: boolean;
    createdAt: Date;
}
interface PromptSnippet {
    id: string;
    name: string;
    content: string;
    category?: string;
    tags: string[];
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PromptTemplatesService {
    private readonly db;
    private readonly logger;
    private templates;
    private snippets;
    constructor(db: DatabaseService);
    createTemplate(data: any): Promise<PromptTemplate>;
    findAllTemplates(filter?: any): Promise<PromptTemplate[]>;
    findTemplate(id: string): Promise<PromptTemplate>;
    updateTemplate(id: string, data: any): Promise<PromptTemplate>;
    deleteTemplate(id: string): Promise<boolean>;
    createVersion(templateId: string, data: any): Promise<PromptVersion>;
    getVersions(templateId: string): Promise<PromptVersion[]>;
    createSnippet(data: any): Promise<PromptSnippet>;
    findAllSnippets(filter?: any): Promise<PromptSnippet[]>;
    updateSnippet(id: string, data: any): Promise<PromptSnippet>;
    deleteSnippet(id: string): Promise<boolean>;
    incrementSnippetUsage(id: string): Promise<PromptSnippet>;
    compileTemplate(templateId: string, variables?: Record<string, any>): Promise<{
        content: string;
    }>;
    private generateId;
}
export {};
//# sourceMappingURL=prompt-templates.service.d.ts.map