import * as vscode from 'vscode';
import { LLMProvider, LLMResult } from '../src/types/llm.js';
import { Logger, LogLevel } from '../src/core/logging.js';

export class AnthropicProvider implements LLMProvider {
    readonly id = 'anthropic';
    readonly name = 'Anthropic';
    modelName: string;

    private apiKey: string;
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('anthropicModel', 'claude-2');
        this.apiKey = vscode.workspace.getConfiguration('theFuse').get('anthropicApiKey', '');
    }

    async generate(prompt: string, options?: any): Promise<LLMResult> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: options?.maxTokens || 1000,
                    temperature: options?.temperature ?? 0.7,
                    stop_sequences: options?.stopSequences
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                text: data.content[0].text,
                items: [{
                    insertText: data.content[0].text
                }]
            };
        } catch (error) {
            this.logger.log(LogLevel.ERROR, 'Anthropic generation error:', error);
            throw error;
        }
    }

    async configure(): Promise<void> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Anthropic API key',
            password: true
        });

        if (apiKey) {
            await vscode.workspace.getConfiguration('theFuse').update('anthropicApiKey', apiKey, true);
            this.apiKey = apiKey;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        return ['claude-2', 'claude-instant-1'];
    }

    async setModel(model: string): Promise<void> {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('anthropicModel', model, true);
    }
}