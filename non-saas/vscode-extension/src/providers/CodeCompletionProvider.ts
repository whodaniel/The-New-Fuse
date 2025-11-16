import * as vscode from 'vscode';
import { ApiClient } from '../services/ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface CodeCompletionItem extends vscode.CompletionItem {
    taskId?: string;
    agentId?: string;
    confidence?: number;
    completionType?: 'snippet' | 'function' | 'variable' | 'import' | 'comment';
}

export interface CompletionData {
    text: string;
    type: string;
    documentation?: string;
    detail?: string;
    insertText?: string;
    agentId?: string;
    confidence?: number;
}

export class CodeCompletionProvider implements vscode.CompletionItemProvider {
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private activeTasks = new Map<string, string>(); // filePath -> taskId

    constructor(apiClient: ApiClient, configManager: ConfigurationManager) {
        this.apiClient = apiClient;
        this.configManager = configManager;
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.CompletionContext,
        token: vscode.CancellationToken
    ): Promise<CodeCompletionItem[]> {
        try {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            const filePath = document.fileName;

            // Get context around cursor
            const contextRange = new vscode.Range(
                new vscode.Position(Math.max(0, position.line - 5), 0),
                new vscode.Position(position.line + 5, 0)
            );
            const contextCode = document.getText(contextRange);

            // Create completion task in backend
            const taskId = await this.createCompletionTask(filePath, linePrefix, contextCode, position);

            if (taskId) {
                this.activeTasks.set(filePath, taskId);

                // Get completions from backend
                const completions = await this.getCompletionsFromBackend(taskId, token);

                // Convert to VSCode completion items
                return completions.map(comp => this.createCompletionItem(comp, taskId));
            }

            return [];
        } catch (error) {
            console.error('Error providing completions:', error);
            return [];
        }
    }

    async resolveCompletionItem(item: CodeCompletionItem, token: vscode.CancellationToken): Promise<CodeCompletionItem> {
        // Add additional details if needed
        const taskId = (item as any).taskId;
        if (taskId) {
            try {
                const details = await this.getCompletionDetails(taskId, token);
                if (details) {
                    (item as any).detail = details.explanation;
                    (item as any).documentation = new vscode.MarkdownString(details.documentation);
                }
            } catch (error) {
                console.error('Error resolving completion item:', error);
            }
        }
        return item;
    }

    private async createCompletionTask(
        filePath: string,
        linePrefix: string,
        contextCode: string,
        position: vscode.Position
    ): Promise<string | null> {
        try {
            const response = await this.apiClient.axiosInstance.post('/tasks/completion', {
                filePath,
                linePrefix,
                contextCode,
                position: {
                    line: position.line,
                    character: position.character
                },
                language: vscode.languages.getLanguageIdAtPosition(vscode.window.activeTextEditor?.document.uri || filePath, position),
                workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            });

            return response.data.taskId;
        } catch (error) {
            console.error('Error creating completion task:', error);
            return null;
        }
    }

    private async getCompletionsFromBackend(taskId: string, token: vscode.CancellationToken): Promise<any[]> {
        try {
            const response = await this.apiClient.axiosInstance.get(`/tasks/${taskId}/completions`);

            // Poll for completion results
            const maxPolls = 30; // 3 seconds max
            let polls = 0;

            while (polls < maxPolls && !token.isCancellationRequested) {
                if (response.data.completions && response.data.completions.length > 0) {
                    return response.data.completions;
                }

                await new Promise(resolve => setTimeout(resolve, 100));
                polls++;
            }

            return [];
        } catch (error) {
            console.error('Error getting completions from backend:', error);
            return [];
        }
    }

    private async getCompletionDetails(taskId: string, token: vscode.CancellationToken): Promise<any> {
        try {
            const response = await this.apiClient.axiosInstance.get(`/tasks/${taskId}/details`);
            return response.data;
        } catch (error) {
            console.error('Error getting completion details:', error);
            return null;
        }
    }

    private createCompletionItem(completion: CompletionData, taskId: string): CodeCompletionItem {
        const item = new vscode.CompletionItem(
            completion.text,
            this.mapCompletionKind(completion.type)
        );

        // Store custom data in a way that doesn't conflict with VSCode interfaces
        (item as any).taskId = taskId;
        (item as any).agentId = completion.agentId;
        (item as any).confidence = completion.confidence;
        (item as any).completionType = completion.type;

        if (completion.documentation) {
            item.documentation = new vscode.MarkdownString(completion.documentation);
        }

        if (completion.detail) {
            item.detail = completion.detail;
        }

        // Add insert text if different from label
        if (completion.insertText && completion.insertText !== completion.text) {
            item.insertText = completion.insertText;
        }

        return item as CodeCompletionItem;
    }

    private mapCompletionKind(type: string): vscode.CompletionItemKind {
        switch (type) {
            case 'function': return vscode.CompletionItemKind.Function;
            case 'variable': return vscode.CompletionItemKind.Variable;
            case 'class': return vscode.CompletionItemKind.Class;
            case 'interface': return vscode.CompletionItemKind.Interface;
            case 'method': return vscode.CompletionItemKind.Method;
            case 'property': return vscode.CompletionItemKind.Property;
            case 'import': return vscode.CompletionItemKind.Module;
            case 'snippet': return vscode.CompletionItemKind.Snippet;
            case 'comment': return vscode.CompletionItemKind.Text;
            default: return vscode.CompletionItemKind.Text;
        }
    }

    /**
     * Clean up completed tasks
     */
    cleanupTask(filePath: string): void {
        this.activeTasks.delete(filePath);
    }

    /**
     * Get all active tasks
     */
    getActiveTasks(): Map<string, string> {
        return new Map(this.activeTasks);
    }
}