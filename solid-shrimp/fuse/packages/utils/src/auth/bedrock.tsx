
export {}
exports.AWSBedrockProvider = void 0;
const { BedrockRuntimeClient } = require("@aws-sdk/client-bedrock-runtime");
const { BaseLLMProvider } = require("./types");

interface Message {
    role: string;
    content: string;
}

interface BedrockConfig {
    model?: string;
    region?: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}

/**
 * The agent provider for the AWS Bedrock provider.
 */
class AWSBedrockProvider extends BaseLLMProvider {
    private readonly client: typeof BedrockRuntimeClient;
    private readonly defaultModel: string;
    private readonly models: string[];

    constructor(config: BedrockConfig = {}) {
        super();
        this.defaultModel = config.model || 'anthropic.claude-v2';
        this.models = ['anthropic.claude-v2', 'anthropic.claude-v1', 'anthropic.claude-instant-v1'];
        this.client = new BedrockRuntimeClient({
            region: config.region || 'us-east-1',
            credentials: config.credentials
        });
    }

    private convertToBedrockMessage(message: Message): string {
        return `${message.role}: ${message.content}`;
    }

    async chat(messages: Message[]): Promise<{ content: string; model: string }> {
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
        } catch (error) {
            throw new Error('Failed to chat with Bedrock: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    async getDefaultModel(): Promise<string> {
        return this.defaultModel;
    }

    getModels(): string[] {
        return this.models;
    }
}

exports.AWSBedrockProvider = AWSBedrockProvider;
