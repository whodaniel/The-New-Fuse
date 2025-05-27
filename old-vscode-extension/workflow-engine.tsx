import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { Logger } from './core/logging.js';

export class WorkflowEngine {
    constructor(
        private readonly logger: Logger,
        private readonly context: vscode.ExtensionContext,
        private readonly agentClient: AgentClient
    ) {}

    public async initializeWorkflow(): Promise<void> {
        try {
            await this.agentClient.initialize();
            this.logger.info('Workflow engine initialized');
            
            this.context.subscriptions.push(
                vscode.commands.registerCommand('thefuse.startWorkflow', () => {
                    this.startWorkflow();
                })
            );
        } catch (error) {
            this.logger.error('Failed to initialize workflow engine:', error);
            throw error;
        }
    }

    private async startWorkflow(): Promise<void> {
        try {
            const response = await this.agentClient.sendMessage({
                type: 'command',
                command: 'start_workflow',
                args: [],
                metadata: {
                    timestamp: new Date().toISOString()
                }
            });

            this.logger.info('Workflow started:', response);
        } catch (error) {
            this.logger.error('Failed to start workflow:', error);
            throw error;
        }
    }

    public dispose(): void {
        this.agentClient.dispose();
    }
}