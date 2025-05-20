import * as vscode from 'vscode';
import { FuseMonitoringClient } from './FuseMonitoringClient.js';
import { LLMMonitoringClient } from './llm-monitoring-client.js';
import { AgentMonitor } from './AgentMonitor.js';

export class AdminControlPanelProvider {
  public static readonly viewType = 'thefuse.adminControlPanel';
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private fuseClient: FuseMonitoringClient;
  private llmClient: LLMMonitoringClient;
  private agentMonitor: AgentMonitor;

  public static createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    fuseClient: FuseMonitoringClient,
    llmClient: LLMMonitoringClient
  ) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    const panel = vscode.window.createWebviewPanel(
      AdminControlPanelProvider.viewType,
      'Fuse Admin Control Panel',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );
    return new AdminControlPanelProvider(panel, extensionUri, context, fuseClient, llmClient);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    fuseClient: FuseMonitoringClient,
    llmClient: LLMMonitoringClient
  ) {
    this.panel = panel;
    this.fuseClient = fuseClient;
    this.llmClient = llmClient;
    this.agentMonitor = AgentMonitor.getInstance();

    this.panel.webview.html = this._getHtml();

    this.panel.webview.onDidReceiveMessage(msg => {
      switch (msg.command) {
        case 'refresh':
          this.panel.webview.postMessage({
            command: 'updateData',
            data: {
              agents: this.agentMonitor.getMetrics(),
              llm: this.llmClient.getSessionMetrics(),
              fuse: this.fuseClient.getSessionMetrics()
            }
          });
          break;
      }
    }, null, this.disposables);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private _getHtml(): string {
    const script = `<script>
      const vscode = acquireVsCodeApi();
      function refresh() { vscode.postMessage({ command: 'refresh' }); }
      window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.command === 'updateData') {
          document.getElementById('agents').textContent = JSON.stringify(msg.data.agents, null, 2);
          document.getElementById('llm').textContent = JSON.stringify(msg.data.llm, null, 2);
          document.getElementById('fuse').textContent = JSON.stringify(msg.data.fuse, null, 2);
        }
      });
      setTimeout(refresh, 0);
    </script>`;

    return `<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Fuse Admin Control Panel</title></head>
    <body>
      <h1>Fuse Admin Control Panel</h1>
      <button onclick="refresh()">Refresh</button>
      <h2>Agent Metrics</h2><pre id="agents">Loading...</pre>
      <h2>LLM Metrics</h2><pre id="llm">Loading...</pre>
      <h2>Fuse Monitoring Metrics</h2><pre id="fuse">Loading...</pre>
      ${script}
    </body>
    </html>`;
  }

  public dispose() {
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}