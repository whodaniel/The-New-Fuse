// src/vscode-extension/src/completion-provider.ts

import * as vscode from 'vscode';
import { LLMService } from './services/features/LLMService';

export class FuseCompletionProvider implements vscode.InlineCompletionItemProvider {
    private llmService: LLMService;

    constructor(llmService: LLMService) {
        this.llmService = llmService;
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList | undefined> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const prompt = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

        try {
            // Query the LLM for multiple completion suggestions
            const suggestions = await this.llmService.getCompletions({
                prompt,
                languageId: document.languageId,
                position,
                linePrefix,
                context: context.selectedCompletionInfo,
                n: 3 // Number of suggestions to return for cycling
            });

            if (Array.isArray(suggestions) && suggestions.length > 0) {
                const items = suggestions
                    .filter(s => s && s.content)
                    .map(s => new vscode.InlineCompletionItem(
                        s.content,
                        new vscode.Range(position, position)
                    ));
                return new vscode.InlineCompletionList(items);
            }
        } catch (err) {
            console.error('[FuseCompletionProvider] Error fetching completions:', err);
        }
        return undefined;
    }
}
