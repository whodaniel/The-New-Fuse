import * as vscode from 'vscode';
export class SettingsViewProvider {
    constructor(private context: vscode.ExtensionContext) {}
    public setHostWebview(webview: vscode.Webview): void { console.log('SettingsViewProvider host webview set'); }
    public dispose(): void {}
}
