"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
class OllamaProvider {
    constructor(model = 'llama2', baseUrl = 'http://localhost:11434') {
        this.model = model;
        this.baseUrl = baseUrl;
    }
    async generateText(prompt, options) {
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
        }
        catch (error) {
            throw new Error(`Ollama generation error: ${error.message}`);
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama-provider.js.map