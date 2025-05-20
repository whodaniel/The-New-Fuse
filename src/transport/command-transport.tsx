import * as vscode from 'vscode';
import { ITransport, TransportMessage, TransportOptions } from './transport-interface.js';

export class CommandTransport implements ITransport {
    private readonly commandPrefix = 'newFuse.transport';
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000;
    private messageHandlers: Map<string, (message: TransportMessage) => void>;
    private disposables: vscode.Disposable[];

    constructor(private options: TransportOptions = {}) {
        this.messageHandlers = new Map();
        this.disposables = [];
    }

    public async initialize(): Promise<void> {
        this.registerCommands();
    }

    public async send(message: TransportMessage): Promise<void> {
        if (this.options.validator && !this.options.validator.validate(message)) {
            throw new Error(`Invalid message: ${this.options.validator.getValidationErrors().join(', ')}`);
        }

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                await vscode.commands.executeCommand(
                    `${this.commandPrefix}.send`,
                    message
                );
                return;
            } catch (error) {
                if (attempt === this.maxRetries) {
                    console.error('Command transport send error:', error);
                    throw new Error(`Failed to send message after ${this.maxRetries} attempts: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    public onMessage(handler: (message: TransportMessage) => void): vscode.Disposable {
        const handlerId = Math.random().toString(36).substring(7);
        this.messageHandlers.set(handlerId, handler);
        
        return {
            dispose: () => {
                this.messageHandlers.delete(handlerId);
            }
        };
    }

    private registerCommands(): void {
        this.disposables.push(
            vscode.commands.registerCommand(
                `${this.commandPrefix}.send`,
                (message: TransportMessage) => {
                    this.handleIncomingMessage(message);
                }
            )
        );
    }

    private handleIncomingMessage(message: TransportMessage): void {
        if (this.options.priorityThreshold !== undefined && 
            (message.priority || 0) < this.options.priorityThreshold) {
            return;
        }
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Message handler error:', error);
            }
        });
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.messageHandlers.clear();
    }
}
