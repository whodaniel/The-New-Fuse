import * as vscode from 'vscode';
import { LLMProviderManager } from '../../llm/LLMProviderManager';

export interface CompletionOptions {
    prompt: string;
    languageId: string;
    position: vscode.Position;
    linePrefix: string;
    context?: any;
    n?: number;
}

export interface CompletionSuggestion {
    content: string;
    confidence?: number;
}

export class LLMService {
    constructor(private llmManager: LLMProviderManager) {}

    async getCompletions(options: CompletionOptions): Promise<CompletionSuggestion[]> {
        try {
            const response = await this.llmManager.generateResponse(
                `Complete this ${options.languageId} code:\n${options.prompt}`
            );
            
            return [{
                content: response,
                confidence: 0.8
            }];
        } catch (error) {
            console.error('LLMService completion error:', error);
            return [];
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        return await this.llmManager.generateResponse(prompt);
    }

    async getAvailableProviders() {
        return await this.llmManager.getAvailableProviders();
    }
}