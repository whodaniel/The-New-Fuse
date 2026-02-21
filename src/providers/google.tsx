import { Provider, Message } from './provider.js';

export class GoogleProvider extends Provider {
    private model: string;

    constructor(apiKey: string, model: string) {
        super(apiKey);
        this.model = model;
    }

    private getDefaultBaseURL(): string {
        return 'https://generativelanguage.googleapis.com/v1';
    }

    private getDefaultApiKey(): string {
        return this.apiKey;
    }

    async generateContent(messages: Message[]): Promise<string> {
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
            }),
        }).then(res => res.json());

        return response.candidates[0].content.parts[0].text;
    }

    async *streamGenerateContent(prompt: string): AsyncGenerator<{ content: string; done: boolean }> {
        const response = await fetch(`${this.getDefaultBaseURL()}/models/${this.model}:streamGenerateContent?key=${this.getDefaultApiKey()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {},
            }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader?.read()!;
            done = readerDone;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));
                    yield {
                        content: data.candidates[0].content.parts[0].text,
                        done: false,
                    };
                }
            }
        }

        yield { content: '', done: true };
    }
}
