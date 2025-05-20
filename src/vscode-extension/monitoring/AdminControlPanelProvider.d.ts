import * as vscode from 'vscode';
import { FuseMonitoringClient } from './FuseMonitoringClient.js';
import { LLMMonitoringClient } from './llm-monitoring-client.js';
export declare class AdminControlPanelProvider {
    static readonly viewType = "thefuse.adminControlPanel";
    private panel;
    private disposables;
    private fuseClient;
    private llmClient;
    private agentMonitor;
    static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, fuseClient: FuseMonitoringClient, llmClient: LLMMonitoringClient): AdminControlPanelProvider;
    private constructor();
    private _getHtml;
    dispose(): void;
}
//# sourceMappingURL=AdminControlPanelProvider.d.ts.map