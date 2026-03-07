
export {}
exports.GoogleProvider = void 0;
import { BaseLLMProvider, LLMConfig } from './base.js';
import { providerRegistry } from './registry.js';

interface GoogleConfig extends LLMConfig {
    projectId?: string;
}

interface ChatMessage {
    role: string;
    content: string;
}

interface ChatResponse {
    content: string;
    model?: string;
}

class GoogleProvider extends BaseLLMProvider {
    constructor(config: GoogleConfig = {}) {
        super({
            ...config,
            baseURL: 'https://generativelanguage.googleapis.com/v1',
        });
    }

    getDefaultApiKey() {
        return providerRegistry.getApiKey('google') || '';
    }

    getDefaultBaseURL() {
        return 'https://generativelanguage.googleapis.com/v1';
    }

    getDefaultModel() {
        return 'gemini-pro';
    }

    getDefaultMaxTokens() {
        return 2048;
    }

    getDefaultHeaders() {
        return {};
    }

    getDefaultProjectId() {
        return process.env.GOOGLE_PROJECT_ID || '';
    }

    protected initClient(): void {
        // Google API doesn't use a client library in this implementation
        // We'll use fetch directly in the methods
    }

    async chat(messages: ChatMessage[]): Promise<ChatResponse> {
        const response = await fetch(`${this.getDefaultBaseURL()}/models/${this.model}:generateContent?key=${this.getDefaultApiKey()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                })),
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                },
            }),
        }).then(res => res.json());

        return {
            content: response.candidates[0]?.content?.parts[0]?.text || '',
            model: this.model,
        };
    }

    async *stream(prompt: string): AsyncGenerator<string> {
        const response = await fetch(`${this.getDefaultBaseURL()}/models/${this.model}:streamGenerateContent?key=${this.getDefaultApiKey()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                },
            }),
        });

        const reader = response.body?.getReader();
        if (!reader)
            return;

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;

            const chunk = decoder.decode(value);
            try {
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        yield data.candidates[0]?.content?.parts[0]?.text || '';
                    }
                }
            }
            catch (e) {
                console.error('Failed to parse Google stream chunk:', e);
            }
        }
    }
}

exports.GoogleProvider = GoogleProvider;
