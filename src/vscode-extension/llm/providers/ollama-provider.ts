import { LLMProviderInterface } from '../LLMProviderManager.js';

export class OllamaProvider implements LLMProviderInterface {
    private baseUrl: string;
    private model: string;

    constructor(model: string = 'llama2', baseUrl: string = 'http://localhost:11434') {
        this.model = model;
        this.baseUrl = baseUrl;
    }

    async generateText(prompt: string, options?: any): Promise<{ text: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    system: options?.systemPrompt,
                    stream: false,
                    options: {
                        temperature: options?.temperature || 0.7,
                        top_p: options?.topP || 0.9
                    }
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ollama API request failed');
            }

            return {
                text: data.response || ''
            };
        } catch (error) {
            throw new Error(`Ollama generation error: ${(error as Error).message}`);
        }
    }
}