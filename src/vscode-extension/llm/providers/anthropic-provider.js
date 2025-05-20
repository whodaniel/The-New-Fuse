"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
class AnthropicProvider {
    constructor(apiKey, model = 'claude-2') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateText(prompt, options) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    system: options?.systemPrompt,
                    max_tokens: options?.maxTokens || 1000
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Anthropic API request failed');
            }
            return {
                text: data.content[0]?.text || ''
            };
        }
        catch (error) {
            throw new Error(`Anthropic generation error: ${error.message}`);
        }
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic-provider.js.map