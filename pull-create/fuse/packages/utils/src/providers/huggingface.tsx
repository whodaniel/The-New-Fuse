import { BaseLLMProvider, LLMConfig } from './base.js';
import { providerRegistry } from './registry.js';

interface HuggingFaceConfig extends LLMConfig {
    task?: 'text-generation' | 'text2text-generation' | 'conversational';
}

export class HuggingFaceProvider extends BaseLLMProvider {
    // Changed from private to protected to match inheritance requirements
    protected apiKey: string;

    constructor(config: HuggingFaceConfig = {}) {
        const { task = 'text-generation', ...rest } = config;
        super({
            ...rest,
            baseURL: 'https://api-inference.huggingface.co/models',
        });
        this.apiKey = this.getDefaultApiKey();
    }

    public getDefaultApiKey(): string {
        return providerRegistry.getApiKey('huggingface') || '';
    }

    public getDefaultBaseURL(): string {
        return 'https://api-inference.huggingface.co/models';
    }

    public getDefaultModel(): string {
        return 'mistralai/Mistral-7B-Instruct-v0.1';
    }

    // Make sure all methods have the same visibility as the base class
    public getDefaultMaxTokens(): number {
        return 4096;
    }

    // Changed from protected to public to match the base class
    public getDefaultHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string; model: string }> {
        const lastMessage = messages[messages.length - 1];
        const response = await fetch(`${this.getDefaultBaseURL()}/${this.model}`, {
            method: 'POST',
            headers: this.getDefaultHeaders(),
            body: JSON.stringify({
                inputs: lastMessage.content,
                parameters: {
                    max_new_tokens: this.maxTokens,
                    return_full_text: false,
                },
            }),
        }).then(res => res.json());

        return {
            content: Array.isArray(response) ? response[0].generated_text : response.generated_text,
            model: this.model,
        };
    }

    async complete(prompt: string): Promise<{ content: string; model: string }> {
        return this.chat([{ role: 'user', content: prompt }]);
    }

    async *stream(prompt: string): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
        const response = await this.complete(prompt);
        yield {
            content: response.content,
            done: true,
        };
    }
}
