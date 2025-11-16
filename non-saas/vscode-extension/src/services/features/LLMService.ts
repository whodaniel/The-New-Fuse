import * as vscode from 'vscode';
import { LLMProviderManager } from '../../llm/LLMProviderManager';
import { ConfigurationService } from '../core/ConfigurationService';

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
    constructor(
        private llmManager: LLMProviderManager,
        private configService: ConfigurationService
    ) {}

    async initialize(): Promise<void> {
        // Initialize LLM service with configuration
        const providers = await this.llmManager.getAvailableProviders();
        console.log(`LLMService initialized with ${providers.length} providers`);
    }

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

    async getCurrentProvider() {
        return this.configService.get('llmProvider');
    }

    async switchProvider() {
        return await this.llmManager.selectProvider();
    }

    async getProviderConfig(providerId: string) {
        return this.configService.get(`providers.${providerId}`, {});
    }

    async updateProviderConfig(providerId: string, config: any) {
        await this.configService.update(`providers.${providerId}`, config);
    }
}