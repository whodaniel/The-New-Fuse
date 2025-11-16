import * as vscode from 'vscode';

export class NotificationService {
    constructor(private context: vscode.ExtensionContext) {}

    showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    showError(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    async showProgress<T>(
        title: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: false
            },
            task
        );
    }

    async showChoice(message: string, ...choices: string[]): Promise<string | undefined> {
        return vscode.window.showInformationMessage(message, ...choices);
    }
}