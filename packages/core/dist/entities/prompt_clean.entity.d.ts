export interface IPromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: Record<string, any>;
    metadata?: Record<string, any>;
    status?: string;
    version?: string;
}
export declare class PromptTemplate implements IPromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: Record<string, any>;
    metadata?: Record<string, any>;
    status?: string;
    version?: string;
    createdAt: Date;
    updatedAt: Date;
    process(values: Record<string, any>): string;
}
//# sourceMappingURL=prompt_clean.entity.d.ts.map