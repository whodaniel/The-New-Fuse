import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface LLMProvider {
    id: string;
    name: string;
    available: boolean;
}

export class LLMProviderManager {
    private providers: LLMProvider[] = [];

    constructor(private configManager: ConfigurationManager) {}

    async initialize(): Promise<void> {
        await this.detectProviders();
    }

    private async detectProviders(): Promise<void> {
        this.providers = [
            {
                id: 'vscode',
                name: 'VS Code Language Models',
                available: await this.checkVSCodeLM()
            },
            {
                id: 'openai',
                name: 'OpenAI GPT',
                available: true
            },
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                available: true
            }
        ];
    }

    private async checkVSCodeLM(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels();
            return models.length > 0;
        } catch {
            return false;
        }
    }

    async getAvailableProviders(): Promise<LLMProvider[]> {
        return this.providers.filter(p => p.available);
    }

    async selectProvider(): Promise<void> {
        const available = await this.getAvailableProviders();
        const items = available.map(p => ({
            label: p.name,
            detail: p.id
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an LLM provider'
        });

        if (selected) {
            await this.configManager.updateConfig('llmProvider', selected.detail);
            vscode.window.showInformationMessage(`Selected provider: ${selected.label}`);
        }
    }

    async generateResponse(message: string): Promise<string> {
        const provider = this.configManager.getLLMProvider();
        
        switch (provider) {
            case 'vscode':
                return this.generateVSCodeResponse(message);
            default:
                return `Echo: ${message} (Provider: ${provider})`;
        }
    }

    private async generateVSCodeResponse(message: string): Promise<string> {
        try {
            const models = await vscode.lm.selectChatModels();
            if (models.length === 0) {
                throw new Error('No VS Code language models available');
            }

            const model = models[0];
            const messages = [
                vscode.LanguageModelChatMessage.User(message)
            ];

            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
            
            let result = '';
            for await (const fragment of response.text) {
                result += fragment;
            }
            
            return result;
        } catch (error) {
            throw new Error(`VS Code LM error: ${error}`);
        }
    }
}