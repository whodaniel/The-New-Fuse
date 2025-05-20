
export {}
exports.LLMNodeExecutor = void 0;
import types_1 from '../types.js';
import registry_1 from '../../../providers/registry.js';
class LLMNodeExecutor {
    async validate(node): Promise<void> {
        const { provider, model } = node.data;
        if (!provider || !model) {
            throw new types_1.WorkflowError('Provider and model are required', node.id);
        }
        const llmProvider = registry_1.providerRegistry.getProvider(provider);
        if (!llmProvider) {
            throw new types_1.WorkflowError(`Provider ${provider} not found`, node.id);
        }
        if (!llmProvider.models.includes(model)) {
            throw new types_1.WorkflowError(`Model ${model} not supported by provider ${provider}`, node.id);
        }
        return true;
    }
    async execute(node, context): Promise<void> {
        const { provider, model, temperature, maxTokens, systemPrompt } = node.data;
        const { inputs, logger } = context;
        logger.debug('Executing LLM node', { nodeId: node.id, provider, model });
        try {
            const llmProvider = registry_1.providerRegistry.getProvider(provider);
            if (!llmProvider) {
                throw new Error(`Provider ${provider} not found`);
            }
            const messages = [];
            // Add system prompt if provided
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            // Add input messages
            if (inputs.messages) {
                messages.push(...inputs.messages);
            }
            else if (inputs.prompt) {
                messages.push({ role: 'user', content: inputs.prompt });
            }
            const response = await llmProvider.chat(messages, {
                model,
                temperature,
                maxTokens,
            });
            return {
                content: response.content,
                usage: response.usage,
                model: response.model,
            };
        } catch (error) {
            logger.error('LLM node execution failed', error, { nodeId: node.id });
            throw error;
        }
    }

    async cleanup(node): Promise<void> {
        // No cleanup needed for LLM nodes
    }
}
exports.LLMNodeExecutor = LLMNodeExecutor;
//# sourceMappingURL=llm.js.map
