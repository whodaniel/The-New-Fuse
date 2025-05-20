import { Provider, ProviderOptions } from './provider.js';

interface HuggingFaceOptions extends ProviderOptions {
    task?: 'text-generation' | 'text2text-generation' | 'conversational';
}

export class HuggingFace extends Provider {
    constructor(private model: string, private options: HuggingFaceOptions = {}) {
        super(options);
    }

    getDefaultBaseURL(): string {
        return 'https://api-inference.huggingface.co/models';
    }

    getDefaultHeaders(): HeadersInit {
        return {
            Authorization: `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json',
        };
    }

    async complete(prompt: string): Promise<any> {
        const response = await fetch(`${this.getDefaultBaseURL()}/${this.model}`, {
            method: 'POST',
            headers: this.getDefaultHeaders(),
            body: JSON.stringify({
                inputs: prompt,
                parameters: this.options.parameters,
            }),
        });

        if (!response.ok) {
            throw new Error(`HuggingFace API request failed with status ${response.status}`);
        }

        return response.json();
    }

    async chat(messages: { role: string; content: string }[]): Promise<any> {
        const response = await this.complete(messages.map(m => m.content).join('\n'));
        return response;
    }

    async *stream(prompt: string): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
        const response = await this.complete(prompt);
        yield {
            content: response.generated_text || response[0].generated_text,
            done: true
        };
    }
}
