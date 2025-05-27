import * as vscode from 'vscode';
import { BaseWebView } from './base-webview.js';
/**
 * Settings view component for configuring API keys and other extension settings
 */
export declare class SettingsView extends BaseWebView {
    static readonly viewType = "thefuse-settings";
    private static currentPanel;
    static createOrShow(extensionUri: vscode.Uri): SettingsView;
    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri);
    update(): void;
    private saveSettings;
    private sendCurrentSettings;
    private getHtmlForWebview;
}
//# sourceMappingURL=settings-view.d.ts.map