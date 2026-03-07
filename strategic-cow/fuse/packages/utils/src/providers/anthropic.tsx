
export {}
exports.AnthropicProvider = void 0;
import { BaseLLMProvider } from './base.js';
import { providerRegistry } from './registry.js';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatResponse {
    content: string;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
    model?: string;
}

class AnthropicProvider extends BaseLLMProvider {
    constructor(config = {}) {
        super({
            ...config,
            baseURL: 'https://api.anthropic.com/v1',
            defaultHeaders: {
                'anthropic-version': '2023-06-01',
            },
        });
    }

    getDefaultApiKey() {
        return providerRegistry.getApiKey('anthropic') || '';
    }

    getDefaultBaseURL() {
        return 'https://api.anthropic.com/v1';
    }

    getDefaultModel() {
        return 'claude-2';
    }

    getDefaultMaxTokens() {
        return 4096;
    }

    getDefaultHeaders() {
        return {
            'anthropic-version': '2023-06-01',
        };
    }

    protected initClient(): void {
        // Initialize Anthropic client
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

    async chat(messages: ChatMessage[]): Promise<ChatResponse> {
        // Convert OpenAI format to Anthropic format
        const prompt = messages
            .map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${msg.content}`)
            .join('\n\n');

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: this.maxTokens,
        });

        return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage,
            model: response.model,
        };
    }
}
exports.AnthropicProvider = AnthropicProvider;
