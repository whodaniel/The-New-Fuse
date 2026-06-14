export class LLMNodeHandler {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async handle(step, context) {
        try {
            const config = step.config;
            if (!config.model || !config.prompt) {
                throw new Error('LLM model and prompt are required');
            }
            // Mock implementation - replace with actual LLM service
            const result = {
                response: `Processed with model: ${config.model}`,
                prompt: config.prompt,
                temperature: config.temperature || 0.7,
                maxTokens: config.maxTokens || 1000,
            };
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
//# sourceMappingURL=llm-node.js.map