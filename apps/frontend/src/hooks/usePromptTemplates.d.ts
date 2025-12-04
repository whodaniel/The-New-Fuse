export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    variables: Record<string, string>;
    testCases: any[];
    createdAt: string;
    updatedAt: string;
    versions?: PromptTemplateVersion[];
}
export interface PromptTemplateVersion {
    id: string;
    templateId: string;
    content: string;
    variables: Record<string, string>;
    testCases: any[];
    createdAt: string;
    createdBy: string;
    comment: string;
}
export interface SaveTemplateParams {
    id?: string;
    name: string;
    description: string;
    content: string;
    variables: Record<string, string>;
    testCases: any[];
    comment?: string;
}
export declare function usePromptTemplates(): any;
