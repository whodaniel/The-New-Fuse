exports.AWSBedrockProvider = void 0;
const { BedrockRuntimeClient } = require("@aws-sdk/client-bedrock-runtime");
const { BaseLLMProvider } = require("./types");
/**
 * The agent provider for the AWS Bedrock provider.
 */
class AWSBedrockProvider extends BaseLLMProvider {
    constructor(config = {}) {
        super();
        this.defaultModel = config.model || 'anthropic.claude-v2';
        this.models = ['anthropic.claude-v2', 'anthropic.claude-v1', 'anthropic.claude-instant-v1'];
        this.client = new BedrockRuntimeClient({
            region: config.region || 'us-east-1',
            credentials: config.credentials
        });
    }
    convertToBedrockMessage(message) {
        return `${message.role}: ${message.content}`;
    }
    async chat(messages) {
        try {
            const bedrockMessages = messages.map(msg => this.convertToBedrockMessage(msg));
            const prompt = bedrockMessages.join('\n');
            const command = {
                modelId: this.defaultModel,
                body: JSON.stringify({
                    prompt,
                    max_tokens_to_sample: 1000,
                    temperature: 0.7,
                    stop_sequences: ["\n\nHuman:", "\n\nAssistant:"]
                }),
                contentType: 'application/json',
                accept: 'application/json',
            };
            const response = await this.client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            return {
                content: responseBody.completion,
                model: this.defaultModel
            };
        }
        catch (error) {
            throw new Error('Failed to chat with Bedrock: ' + (error instanceof Error ? error.message : String(error)));
        }
    }
    async getDefaultModel() {
        return this.defaultModel;
    }
    getModels() {
        return this.models;
    }
}
exports.AWSBedrockProvider = AWSBedrockProvider;
export {};
//# sourceMappingURL=bedrock.js.map