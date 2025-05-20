import * as vscode from 'vscode';
import { LLMProviderInterface } from '../LLMProviderManager.js';

export class VSCodeLLMProvider implements LLMProviderInterface {
    constructor() {}

    async generateText(prompt: string, options?: any): Promise<{ text: string }> {
        try {
            // Use VS Code's built-in completions API
            const result = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', 
                vscode.window.activeTextEditor?.document.uri,
                vscode.window.activeTextEditor?.selection.active,
                prompt
            );

            // Extract the completion text from the result
            const completionText = Array.isArray(result?.items) && result.items.length > 0
                ? result.items[0].insertText?.toString() || ''
                : '';

            return { text: completionText };
        } catch (error) {
            throw new Error(`VSCode LLM generation error: ${(error as Error).message}`);
        }
    }
}