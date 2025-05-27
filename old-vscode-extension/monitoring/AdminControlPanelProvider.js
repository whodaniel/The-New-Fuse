"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminControlPanelProvider = void 0;
const vscode = __importStar(require("vscode"));
const AgentMonitor_1 = require("./AgentMonitor");
class AdminControlPanelProvider {
    static createOrShow(extensionUri, context, fuseClient, llmClient) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        const panel = vscode.window.createWebviewPanel(AdminControlPanelProvider.viewType, 'Fuse Admin Control Panel', column || vscode.ViewColumn.One, { enableScripts: true });
        return new AdminControlPanelProvider(panel, extensionUri, context, fuseClient, llmClient);
    }
    constructor(panel, extensionUri, context, fuseClient, llmClient) {
        this.disposables = [];
        this.panel = panel;
        this.fuseClient = fuseClient;
        this.llmClient = llmClient;
        this.agentMonitor = AgentMonitor_1.AgentMonitor.getInstance();
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
    _getHtml() {
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
    dispose() {
        this.panel.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
exports.AdminControlPanelProvider = AdminControlPanelProvider;
AdminControlPanelProvider.viewType = 'thefuse.adminControlPanel';
//# sourceMappingURL=AdminControlPanelProvider.js.map