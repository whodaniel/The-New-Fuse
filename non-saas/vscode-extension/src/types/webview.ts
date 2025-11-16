import * as vscode from 'vscode';

export interface WebviewProvider {
    createWebviewPanel(viewType: string, title: string, showOptions: vscode.ViewColumn, options?: vscode.WebviewOptions): vscode.WebviewPanel;
    getHtmlForWebview(webview: vscode.Webview): string;
}

export interface WebviewMessage {
    type: string;
    payload: any;
}

export interface WebviewState {
    viewType: string;
    title: string;
    visible: boolean;
    lastMessage?: WebviewMessage;
}

export interface WebviewPanelSerializer {
    deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any): Thenable<void>;
}

export interface WebviewUpdateOptions {
    content?: string;
    title?: string;
    viewColumn?: vscode.ViewColumn;
}
