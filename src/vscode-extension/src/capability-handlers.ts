import * as vscode from 'vscode';
import { getLogger } from './core/logging.js';
import { AgentClient } from '../agent-communication.js';

export class CapabilityHandlers {
    private static memoryStore = new Map<string, any>();
    private static agentClient = AgentClient.getInstance();
    private static logger = getLogger('CapabilityHandlers');

    static async handleTaskExecution(task: any, sender: string): Promise<void> {
        try {
            const { type, params } = task;

            switch (type) {
                case 'file_operation':
                    await this.handleFileOperation(params);
                    break;

                case 'shell_command':
                    await this.handleShellCommand(params);
                    break;

                default:
                    throw new Error(`Unsupported task type: ${type}`);
            }

            await this.agentClient.sendMessage({
                type: 'capability_response',
                source: 'capability-handler',
                recipient: sender,
                payload: { success: true }
            });
        } catch (error) {
            this.logger.error('Task execution failed:', error);
            await this.agentClient.sendMessage({
                type: 'capability_response',
                source: 'capability-handler',
                recipient: sender,
                payload: { error: error.message }
            });
        }
    }

    static async handleMemoryOperation(operation: any, sender: string): Promise<void> {
        try {
            const { action, key, value } = operation;

            switch (action) {
                case 'store':
                    this.memoryStore.set(key, value);
                    break;

                case 'retrieve':
                    const storedValue = this.memoryStore.get(key);
                    await this.agentClient.sendMessage({
                        type: 'capability_response',
                        source: 'capability-handler',
                        recipient: sender,
                        payload: { value: storedValue }
                    });
                    break;

                case 'delete':
                    this.memoryStore.delete(key);
                    break;

                default:
                    throw new Error(`Unsupported memory operation: ${action}`);
            }

            if (action !== 'retrieve') {
                await this.agentClient.sendMessage({
                    type: 'capability_response',
                    source: 'capability-handler',
                    recipient: sender,
                    payload: { success: true }
                });
            }
        } catch (error) {
            this.logger.error('Memory operation failed:', error);
            await this.agentClient.sendMessage({
                type: 'capability_response',
                source: 'capability-handler',
                recipient: sender,
                payload: { error: error.message }
            });
        }
    }

    private static async handleFileOperation(params: any): Promise<void> {
        const { action, path, content } = params;
        const uri = vscode.Uri.file(path);

        switch (action) {
            case 'read':
                await vscode.workspace.fs.readFile(uri);
                break;

            case 'write':
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
                break;

            case 'delete':
                await vscode.workspace.fs.delete(uri);
                break;

            default:
                throw new Error(`Unsupported file operation: ${action}`);
        }
    }

    private static async handleShellCommand(params: any): Promise<void> {
        const { command } = params;
        const terminal = vscode.window.createTerminal('Task Execution');
        terminal.sendText(command);
        terminal.show();
    }
}