import { LLMProviderInterface } from '../LLMProviderManager.js';

export class OpenAIProvider implements LLMProviderInterface {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateText(prompt: string, options?: any): Promise<{ text: string }> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: options?.systemPrompt || 'You are a helpful AI assistant.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: options?.temperature || 0.7
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'OpenAI API request failed');
            }

            return { 
                text: data.choices[0]?.message?.content || ''
            };
        } catch (error) {
            throw new Error(`OpenAI generation error: ${(error as Error).message}`);
        }
    }
}