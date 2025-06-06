import * as vscode from 'vscode';

/**
 * Manages the registration and disposal of VS Code commands.
 */
export class CommandService {
    private disposables: vscode.Disposable[] = [];

    /**
     * Registers a command.
     * @param commandId The ID of the command to register.
     * @param callback The function to execute when the command is invoked.
     * @returns A disposable that can be used to unregister the command.
     */
    public registerCommand(commandId: string, callback: (...args: any[]) => any): vscode.Disposable {
        const disposable = vscode.commands.registerCommand(commandId, callback);
        this.addDisposable(disposable);
        return disposable;
    }

    /**
     * Adds a disposable to the list of disposables managed by this service.
     * These will be disposed of when disposeAll is called.
     * @param disposable The disposable to add.
     */
    public addDisposable(disposable: vscode.Disposable): void {
        this.disposables.push(disposable);
    }

    /**
     * Disposes all registered commands and other disposables.
     * This should be called during extension deactivation.
     */
    public disposeAll(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    /**
     * Dispose method for VS Code subscription compatibility.
     */
    public dispose(): void {
        this.disposeAll();
    }
}