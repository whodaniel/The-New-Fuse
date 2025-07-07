export declare class PromptService {
    constructor();
    generatePrompt(template: string, variables: Record<string, any>): Promise<string>;
    validatePrompt(prompt: string): Promise<boolean>;
    createSystemPrompt(context: string): Promise<string>;
    createUserPrompt(message: string): Promise<string>;
}
//# sourceMappingURL=PromptService.d.ts.map