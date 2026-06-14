import { PromptTemplatesService } from '../services/prompt-templates.service';
export declare class PromptTemplatesController {
    private readonly service;
    constructor(service: PromptTemplatesService);
    createTemplate(data: any): Promise<any>;
    findAllTemplates(query: any): Promise<any>;
    findTemplate(id: string): Promise<any>;
    updateTemplate(id: string, data: any): Promise<any>;
    deleteTemplate(id: string): Promise<any>;
    createVersion(id: string, data: any): Promise<any>;
    getVersions(id: string): Promise<any>;
    compileTemplate(id: string, body: {
        variables: any;
    }): Promise<any>;
    createSnippet(data: any): Promise<any>;
    findAllSnippets(query: any): Promise<any>;
    updateSnippet(id: string, data: any): Promise<any>;
    deleteSnippet(id: string): Promise<any>;
}
//# sourceMappingURL=prompt-templates.controller.d.ts.map