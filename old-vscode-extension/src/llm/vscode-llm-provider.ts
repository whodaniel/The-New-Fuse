import * as vscode from 'vscode';
import { LLMProvider, LLMProviderInfo, GenerateOptions } from '../types/llm.js';
import { getLogger, Logger } from '../core/logging.js';
import { getErrorMessage } from '../utils/error-utils.js';

export class VSCodeLLMProvider implements LLMProvider {
    public readonly id = 'vscode';
    public readonly name = 'VS Code';
    private readonly logger: Logger;

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        this.logger = getLogger();
    }

    public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
        try {
            const result = await vscode.commands.executeCommand('vscode.executeCompletionProvider', 
                vscode.Uri.file('input.txt'),
                new vscode.Position(0, 0),
                prompt
            );

            if (Array.isArray(result) && result.length > 0) {
                const text = result[0].insertText?.toString() || '';
                return text;
            }

            return '';

        } catch (error) {
            this.logger.error('VS Code LLM generation error:', getErrorMessage(error));
            throw error;
        }
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const extension = vscode.extensions.getExtension('GitHub.copilot');
            if (!extension) {
                return false;
            }
            return extension.isActive;
        } catch {
            return false;
        }
    }

    public async getInfo(): Promise<LLMProviderInfo> {
        const available = await this.isAvailable();
        return {
            name: this.name,
            version: '1.0.0',
            capabilities: ['code-completion', 'text-generation'],
            models: ['copilot'],
            maxTokens: 1500,
            isAvailable: available
        };
    }
}