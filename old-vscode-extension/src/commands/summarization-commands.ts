import * as vscode from 'vscode';
import { getLogger } from '../core/logging.js';
import { LLMProvider } from '../types/llm.js';
import { getErrorMessage } from '../utils/error-utils.js';

interface SummarizationAgent {
    level: 'basic' | 'detailed' | 'comprehensive';
    style: 'concise' | 'descriptive' | 'technical';
    contentPriorities: string[];
    initialize(): Promise<void>;
    summarize(content: string): Promise<string>;
}

export class SummarizationCommands {
    private logger = getLogger();
    private agent: SummarizationAgent | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly llmProvider: LLMProvider
    ) {}

    async initializeSummarizationAgent(): Promise<void> {
        try {
            this.agent = {
                level: 'detailed',
                style: 'technical',
                contentPriorities: ['code', 'api', 'architecture'],
                
                async initialize(): Promise<void> {
                    // Initialization logic would go here
                },

                async summarize(content: string): Promise<string> {
                    // Summarization logic would go here
                    return `Summary of: ${content.substring(0, 100)}...`;
                }
            };

            await this.agent.initialize();
            this.logger.info('Summarization agent initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize summarization agent: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    async summarizeContent(): Promise<void> {
        try {
            if (!this.agent) {
                await this.initializeSummarizationAgent();
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }

            const selection = editor.selection;
            const content = editor.document.getText(selection.isEmpty ? undefined : selection);

            const summary = await this.agent?.summarize(content);
            if (summary) {
                const doc = await vscode.workspace.openTextDocument({
                    content: summary,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            }
        } catch (error) {
            this.logger.error(`Failed to summarize content: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    async setSummaryLevel(): Promise<void> {
        try {
            if (!this.agent) {
                await this.initializeSummarizationAgent();
            }

            const level = await vscode.window.showQuickPick(
                ['basic', 'detailed', 'comprehensive'],
                { placeHolder: 'Select summary level' }
            );

            if (level && this.agent) {
                this.agent.level = level as 'basic' | 'detailed' | 'comprehensive';
                this.logger.info(`Summary level set to: ${level}`);
            }
        } catch (error) {
            this.logger.error(`Failed to set summary level: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    async setSummaryStyle(): Promise<void> {
        try {
            if (!this.agent) {
                await this.initializeSummarizationAgent();
            }

            const style = await vscode.window.showQuickPick(
                ['concise', 'descriptive', 'technical'],
                { placeHolder: 'Select summary style' }
            );

            if (style && this.agent) {
                this.agent.style = style as 'concise' | 'descriptive' | 'technical';
                this.logger.info(`Summary style set to: ${style}`);
            }
        } catch (error) {
            this.logger.error(`Failed to set summary style: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    async setContentPriorities(): Promise<void> {
        try {
            if (!this.agent) {
                await this.initializeSummarizationAgent();
            }

            const priorities = await vscode.window.showQuickPick(
                [
                    'code',
                    'api',
                    'architecture',
                    'dependencies',
                    'documentation',
                    'tests'
                ],
                {
                    placeHolder: 'Select content priorities',
                    canPickMany: true
                }
            );

            if (priorities && this.agent) {
                this.agent.contentPriorities = priorities;
                this.logger.info(`Content priorities set to: ${priorities.join(', ')}`);
            }
        } catch (error) {
            this.logger.error(`Failed to set content priorities: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    dispose(): void {
        // Cleanup if needed
    }
}
