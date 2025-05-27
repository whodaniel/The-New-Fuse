import * as vscode from 'vscode';
export declare class CommunicationPanel {
    private static currentPanel;
    private readonly _panel;
    private _disposables;
    private logger;
    private constructor();
    static createOrShow(extensionUri: vscode.Uri): CommunicationPanel;
    private _setPanelContent;
    private _setMessageHandlers;
    private _handleUserMessage;
    private _clearMessages;
    private _getWebviewContent;
    dispose(): void;
}
//# sourceMappingURL=communication-panel.d.ts.map