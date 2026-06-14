export interface PromptConfig {
    includeAgentsMd: boolean;
    strictMode: boolean;
    contextWindow: 'full' | 'summary' | 'minimal';
}
export declare function structurePromptWithAgentsMd(userPrompt: string, config?: Partial<PromptConfig>): string;
export declare function wrapSystemPrompt(baseSystemPrompt: string, config?: Partial<PromptConfig>): string;
export declare const promptTemplates: {
    codeGeneration: (task: string, config?: Partial<PromptConfig>) => string;
    codeReview: (code: string, config?: Partial<PromptConfig>) => string;
    debugging: (error: string, config?: Partial<PromptConfig>) => string;
    architecture: (description: string, config?: Partial<PromptConfig>) => string;
};
//# sourceMappingURL=promptTemplates.d.ts.map