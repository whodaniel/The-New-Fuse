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
            // Query the LLM for a completion suggestion
            const suggestion = await this.llmService.getCompletion({
                prompt,
                languageId: document.languageId,
                position,
                linePrefix,
                context: context.selectedCompletionInfo
            });

            if (suggestion && suggestion.content) {
                const completionItem = new vscode.InlineCompletionItem(
                    suggestion.content,
                    new vscode.Range(position, position)
                );
                return new vscode.InlineCompletionList([completionItem]);
            }
        } catch (err) {
            console.error('[FuseCompletionProvider] Error fetching completion:', err);
        }
        return undefined;
    }
}
