import { PromptParameter, PromptMetrics, PromptTemplate as IPromptTemplate } from '../types/prompt.types.js';
export declare class PromptTemplate implements IPromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    parameters: PromptParameter[];
    category: string;
    version: number;
    metrics: PromptMetrics;
    metadata: {
        author: string;
        created: Date;
        updated: Date;
        tags: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    render(params: Record<string, unknown>): string;
}
