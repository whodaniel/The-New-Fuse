import * as vscode from 'vscode';
import { LLMProvider, LLMResult } from '../src/types/llm.js';
import { Logger, LogLevel } from '../src/core/logging.js';

export class OpenAIProvider implements LLMProvider {
    readonly id = 'openai';
    readonly name = 'OpenAI';
    modelName: string;

    private apiKey: string;
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('openAIModel', 'gpt-4');
        this.apiKey = vscode.workspace.getConfiguration('theFuse').get('openAIAPIKey', '');
    }

    async generate(prompt: string, options?: any): Promise<LLMResult> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens,
                    stop: options?.stopSequences
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                text: data.choices[0].message.content,
                items: [{
                    insertText: data.choices[0].message.content
                }]
            };
        } catch (error) {
            this.logger.log(LogLevel.ERROR, 'OpenAI generation error:', error);
            throw error;
        }
    }

    async configure(): Promise<void> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            password: true
        });

        if (apiKey) {
            await vscode.workspace.getConfiguration('theFuse').update('openAIAPIKey', apiKey, true);
            this.apiKey = apiKey;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        return ['gpt-4', 'gpt-3.5-turbo'];
    }

    async setModel(model: string): Promise<void> {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('openAIModel', model, true);
    }
}