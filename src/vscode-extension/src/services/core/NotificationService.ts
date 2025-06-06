import * as vscode from 'vscode';

/**
 * Provides a standardized way to show VS Code notifications.
 */
export class NotificationService {
    /**
     * Shows an informational message.
     * @param message The message to show.
     * @param items Optional Quick Pick items to include in the message.
     * @returns A promise that resolves to the selected item or undefined if the message is dismissed.
     */
    public showInfo(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showInformationMessage(message, ...items);
    }

    /**
     * Shows a warning message.
     * @param message The message to show.
     * @param items Optional Quick Pick items to include in the message.
     * @returns A promise that resolves to the selected item or undefined if the message is dismissed.
     */
    public showWarning(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showWarningMessage(message, ...items);
    }

    /**
     * Shows an error message.
     * @param message The message to show.
     * @param items Optional Quick Pick items to include in the message.
     * @returns A promise that resolves to the selected item or undefined if the message is dismissed.
     */
    public showError(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showErrorMessage(message, ...items);
    }

    // Alias methods for backward compatibility
    public showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return this.showInfo(message, ...items);
    }

    public showInformation(message: string, ...items: string[]): Thenable<string | undefined> {
        return this.showInfo(message, ...items);
    }

    public showWarningMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return this.showWarning(message, ...items);
    }

    public showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return this.showError(message, ...items);
    }
}