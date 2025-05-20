import * as vscode from 'vscode';
import { LLMProvider, LLMResult } from '../src/types/llm.js';
import { Logger, LogLevel } from '../src/core/logging.js';

export class OllamaProvider implements LLMProvider {
    readonly id = 'ollama';
    readonly name = 'Ollama';
    modelName: string;

    private endpoint: string;
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('ollamaModel', 'llama2');
        this.endpoint = vscode.workspace.getConfiguration('theFuse').get('ollamaEndpoint', 'http://localhost:11434');
    }

    async generate(prompt: string, options?: any): Promise<LLMResult> {
        try {
            const response = await fetch(`${this.endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.modelName,
                    prompt: options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
                    stream: false,
                    options: {
                        temperature: options?.temperature ?? 0.7,
                        num_predict: options?.maxTokens,
                        stop: options?.stopSequences
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                text: data.response,
                items: [{
                    insertText: data.response
                }]
            };
        } catch (error) {
            this.logger.log(LogLevel.ERROR, 'Ollama generation error:', error);
            throw error;
        }
    }

    async configure(): Promise<void> {
        const endpoint = await vscode.window.showInputBox({
            prompt: 'Enter your Ollama endpoint URL',
            value: this.endpoint,
            placeHolder: 'http://localhost:11434'
        });

        if (endpoint) {
            await vscode.workspace.getConfiguration('theFuse').update('ollamaEndpoint', endpoint, true);
            this.endpoint = endpoint;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.endpoint}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json();
            return data.models?.map((model: any) => model.name) || ['llama2'];
        } catch (error) {
            this.logger.log(LogLevel.ERROR, 'Failed to fetch Ollama models:', error);
            return ['llama2'];
        }
    }

    async setModel(model: string): Promise<void> {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('ollamaModel', model, true);
    }

    async pullModel(modelName: string): Promise<void> {
        try {
            const response = await fetch(`${this.endpoint}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }

            this.logger.log(LogLevel.INFO, `Successfully pulled model: ${modelName}`);
        } catch (error) {
            this.logger.log(LogLevel.ERROR, `Failed to pull model ${modelName}:`, error);
            throw error;
        }
    }
}