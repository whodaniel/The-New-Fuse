import * as vscode from 'vscode';
// import { getLogger, ExtensionLogger } from '@core/logging';
import { getLogger, ExtensionLogger } from '@core/logging';
import { CommandEvent } from './types/commands.js';
import { getErrorMessage } from './utils/error-utils.js';

export class CommandMonitor {
    private readonly logger: ExtensionLogger;
    private readonly commandHistory: CommandEvent[] = [];
    private readonly disposables: vscode.Disposable[] = [];

    constructor() {
        this.logger = getLogger();
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.logger.info('Initializing command monitor');

        // Set up command execution monitoring
        const onCommandExecute = vscode.commands.onDidExecuteCommand(event => {
            this.handleCommandExecution({
                command: event.command,
                args: event.args,
                timestamp: new Date().toISOString()
            });
        });

        this.disposables.push(onCommandExecute);
        context.subscriptions.push(this);
    }

    private handleCommandExecution(event: CommandEvent): void {
        this.commandHistory.push(event);
        this.logger.debug('Command executed:', {
            command: event.command,
            args: event.args,
            timestamp: event.timestamp,
            result: event.result,
            error: event.error ? getErrorMessage(event.error) : undefined
        });
    }

    public getCommandHistory(): CommandEvent[] {
        return [...this.commandHistory];
    }

    public clearHistory(): void {
        this.commandHistory.length = 0;
        this.logger.info('Command history cleared');
    }

    public dispose(): void {
        this.logger.debug('Disposing command monitor');
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables.length = 0;
    }
}
