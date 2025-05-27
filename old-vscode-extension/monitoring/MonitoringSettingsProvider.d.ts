import * as vscode from 'vscode';
import { AgentMonitor } from './AgentMonitor.js';
import { LLMMonitoringClient } from './llm-monitoring-client.js';
/**
 * MonitoringSettingsProvider
 *
 * Provides a webview for managing monitoring settings in VS Code,
 * including toggling monitoring features and configuring Langfuse integration.
 */
export declare class MonitoringSettingsProvider implements vscode.WebviewViewProvider {
    private readonly _context;
    private readonly _monitoringClient;
    private readonly _agentMonitor;
    private readonly _llmMonitor;
    static readonly viewType = "thefuse.monitoringSettings";
    private _view?;
    constructor(_context: vscode.ExtensionContext, _monitoringClient: any, _agentMonitor: AgentMonitor, _llmMonitor: LLMMonitoringClient);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private sendCurrentSettings;
    private updateLangfuseSettings;
    private updateLangfuseCredentials;
    private _getHtmlForWebview;
}
//# sourceMappingURL=MonitoringSettingsProvider.d.ts.map