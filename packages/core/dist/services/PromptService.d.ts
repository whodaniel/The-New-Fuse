export interface PromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: string[];
    category: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PromptContext {
    [key: string]: any;
}
export declare class PromptService {
    private readonly logger;
    private templates;
    constructor();
    private initializeDefaultTemplates;
    createTemplate(templateData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate;
    getTemplate(id: string): PromptTemplate | undefined;
    getAllTemplates(): PromptTemplate[];
    getTemplatesByCategory(category: string): PromptTemplate[];
    updateTemplate(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>): PromptTemplate | null;
    deleteTemplate(id: string): boolean;
    renderPrompt(templateId: string, context: PromptContext): string | null;
    renderPromptFromTemplate(template: string, context: PromptContext): string;
    private interpolateTemplate;
    validateTemplate(template: string): {
        isValid: boolean;
        variables: string[];
        errors: string[];
    };
    searchTemplates(query: string): PromptTemplate[];
    getCategories(): string[];
    private generateId;
    exportTemplates(): PromptTemplate[];
    importTemplates(templates: PromptTemplate[]): {
        imported: number;
        errors: string[];
    };
}
//# sourceMappingURL=PromptService.d.ts.map