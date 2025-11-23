exports.AzureProvider = void 0;
import { BaseLLMProvider } from './base.js';
import { providerRegistry } from './registry.js';
class AzureProvider extends BaseLLMProvider {
    constructor(config = {}) {
        const { endpoint, deploymentName, ...rest } = config;
        super({
            ...rest,
            baseURL: endpoint || '',
        });
        this.endpoint = endpoint || this.getDefaultEndpoint();
        this.deploymentName = deploymentName || this.getDefaultDeploymentName();
    }
    getDefaultApiKey() {
        return providerRegistry.getApiKey('azure') || '';
    }
    getDefaultBaseURL() {
        return this.endpoint;
    }
    getDefaultModel() {
        return this.deploymentName;
    }
    getDefaultMaxTokens() {
        return 4096;
    }
    getDefaultHeaders() {
        return {
            'api-key': this.getDefaultApiKey(),
        };
    }
    getDefaultEndpoint() {
        return process.env.AZURE_OPENAI_ENDPOINT || '';
    }
    getDefaultDeploymentName() {
        return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo';
    }
    initClient() {
        // Initialize Azure OpenAI client
        this.client = {
            chat: {
                completions: {
                    create: async () => {
                        // Implementation without unused params
                        return {};
                    }
                }
            }
        };
    }
    async chat(messages) {
        const response = await this.client.chat.completions.create({
            model: this.deploymentName,
            messages,
            max_tokens: this.maxTokens,
        });
        return {
            content: response.choices[0]?.message?.content || '',
            usage: {
                promptTokens: response.usage?.prompt_tokens,
                completionTokens: response.usage?.completion_tokens,
                totalTokens: response.usage?.total_tokens,
            },
            model: response.model,
        };
    }
}
exports.AzureProvider = AzureProvider;
//# sourceMappingURL=azure.js.map