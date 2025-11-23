import { BaseLLMProvider } from './base.js';
import { providerRegistry } from './registry.js';
export class HuggingFaceProvider extends BaseLLMProvider {
    constructor(config = {}) {
        const { task = 'text-generation', ...rest } = config;
        super({
            ...rest,
            baseURL: 'https://api-inference.huggingface.co/models',
        });
        this.apiKey = this.getDefaultApiKey();
    }
    getDefaultApiKey() {
        return providerRegistry.getApiKey('huggingface') || '';
    }
    getDefaultBaseURL() {
        return 'https://api-inference.huggingface.co/models';
    }
    getDefaultModel() {
        return 'mistralai/Mistral-7B-Instruct-v0.1';
    }
    // Make sure all methods have the same visibility as the base class
    getDefaultMaxTokens() {
        return 4096;
    }
    // Changed from protected to public to match the base class
    getDefaultHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    async chat(messages) {
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
    async complete(prompt) {
        return this.chat([{ role: 'user', content: prompt }]);
    }
    async *stream(prompt) {
        const response = await this.complete(prompt);
        yield {
            content: response.content,
            done: true,
        };
    }
}
//# sourceMappingURL=huggingface.js.map