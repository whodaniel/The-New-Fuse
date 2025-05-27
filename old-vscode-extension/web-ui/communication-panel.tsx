import * as vscode from 'vscode';

/**
 * Communication Panel for agent-to-agent communication
 */
export class CommunicationPanel {
  public static currentPanel: CommunicationPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (CommunicationPanel.currentPanel) {
      CommunicationPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'communicationPanel',
      'Agent Communication',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    CommunicationPanel.currentPanel = new CommunicationPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'discoverAgents':
            await this._discoverAgents();
            break;
          case 'sendMessage':
            await this._sendMessage(message.recipient, message.action, message.payload);
            break;
          case 'registerMcpHandler':
            await this._registerMcpHandler(message.namespace, message.handler);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async _discoverAgents() {
    try {
      // This would be replaced with actual agent discovery
      const agents = await this._fetchAgents();
      
      this._panel.webview.postMessage({
        command: 'updateAgents',
        agents
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'logMessage',
        text: `Error discovering agents: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    }
  }

  private async _sendMessage(recipient: string, action: string, payload: any) {
    try {
      // This would be replaced with actual message sending
      console.log(`Sending message to ${recipient}: ${action}`, payload);
      
      // Simulate message sending
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this._panel.webview.postMessage({
        command: 'logMessage',
        text: `Message sent to ${recipient}: ${action}`,
        type: 'info'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'logMessage',
        text: `Error sending message: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    }
  }

  private async _registerMcpHandler(namespace: string, handler: string) {
    try {
      // This would be replaced with actual MCP handler registration
      console.log(`Registering MCP handler for ${namespace}: ${handler}`);
      
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this._panel.webview.postMessage({
        command: 'logMessage',
        text: `Registered MCP handler for ${namespace}`,
        type: 'info'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'logMessage',
        text: `Error registering handler: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    }
  }

  private async _fetchAgents(): Promise<any[]> {
    // This would be replaced with actual agent discovery
    return [
      {
        id: 'agent-1',
        name: 'Code Assistant',
        capabilities: ['code-generation', 'code-review', 'refactoring']
      },
      {
        id: 'agent-2',
        name: 'Data Analyst',
        capabilities: ['data-processing', 'visualization', 'statistics']
      },
      {
        id: 'agent-3',
        name: 'Documentation Helper',
        capabilities: ['documentation', 'explanation', 'summarization']
      }
    ];
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "Agent Communication";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Agent Communication</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            padding: 20px;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header {
            margin-bottom: 20px;
        }
        .main-content {
            display: flex;
            flex: 1;
            gap: 20px;
            margin-bottom: 20px;
        }
        .agents-panel {
            flex: 1;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
            overflow-y: auto;
        }
        .communication-panel {
            flex: 2;
            display: flex;
            flex-direction: column;
        }
        .message-form {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .mcp-form {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .log-panel {
            flex: 1;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
            overflow-y: auto;
            background-color: var(--vscode-editor-background);
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
        textarea {
            min-height: 100px;
            font-family: monospace;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .agent-item {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            padding: 10px;
            margin-bottom: 10px;
        }
        .agent-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .agent-name {
            font-weight: bold;
        }
        .agent-capabilities {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        .capability-tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
        }
        .log-entry {
            display: flex;
            margin-bottom: 5px;
            font-family: monospace;
            font-size: 12px;
        }
        .log-timestamp {
            color: var(--vscode-descriptionForeground);
            margin-right: 10px;
            white-space: nowrap;
        }
        .log-message {
            word-break: break-word;
        }
        h2 {
            margin-top: 0;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Agent Communication Panel</h1>
            <button id="discover-agents">Discover AI Agents</button>
        </div>
        
        <div class="main-content">
            <div class="agents-panel">
                <h2>Available Agents</h2>
                <div id="agents-container">
                    <p>No agents discovered yet. Click "Discover AI Agents" to find available AI extensions.</p>
                </div>
            </div>
            
            <div class="communication-panel">
                <div class="message-form">
                    <h2>Send Message</h2>
                    <div class="form-group">
                        <label for="recipient">Recipient:</label>
                        <select id="recipient">
                            <option value="">Select an agent</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="action">Action:</label>
                        <input type="text" id="action" placeholder="e.g., generate-code, analyze-data">
                    </div>
                    
                    <div class="form-group">
                        <label for="payload">Payload (JSON):</label>
                        <textarea id="payload" placeholder='{"prompt": "Generate a function that..."}'></textarea>
                    </div>
                    
                    <button id="send-message">Send Message</button>
                </div>
                
                <div class="mcp-form">
                    <h2>Register MCP Handler</h2>
                    <div class="form-group">
                        <label for="mcp-namespace">Namespace:</label>
                        <input type="text" id="mcp-namespace" placeholder="e.g., code">
                    </div>
                    
                    <div class="form-group">
                        <label for="mcp-command">Command:</label>
                        <input type="text" id="mcp-command" placeholder="e.g., generate">
                    </div>
                    
                    <div class="form-group">
                        <label for="mcp-handler">Handler:</label>
                        <input type="text" id="mcp-handler" placeholder="e.g., generateCode">
                    </div>
                    
                    <button id="register-mcp">Register Handler</button>
                </div>
                
                <div class="log-panel">
                    <h2>Communication Log</h2>
                    <div id="comms-log"></div>
                </div>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        document.addEventListener('DOMContentLoaded', () => {
            // Set up event listeners
            document.getElementById('discover-agents').addEventListener('click', () => {
                vscode.postMessage({ command: 'discoverAgents' });
                logMessage('Discovering AI agents...');
            });
            
            document.getElementById('send-message').addEventListener('click', () => {
                const recipient = document.getElementById('recipient').value;
                const action = document.getElementById('action').value;
                const payload = document.getElementById('payload').value;
                
                if (!recipient || !action) {
                    logMessage('Error: Recipient and action are required', 'error');
                    return;
                }
                
                try {
                    const parsedPayload = JSON.parse(payload);
                    vscode.postMessage({
                        command: 'sendMessage',
                        recipient,
                        action,
                        payload: parsedPayload
                    });
                    logMessage(\`Sent message to \${recipient}: \${action}\`);
                } catch (e) {
                    logMessage('Error: Invalid JSON payload', 'error');
                }
            });

            document.getElementById('register-mcp').addEventListener('click', () => {
                const namespace = document.getElementById('mcp-namespace').value;
                const command = document.getElementById('mcp-command').value;
                const handler = document.getElementById('mcp-handler').value;

                if (!namespace || !command || !handler) {
                    logMessage('Error: All MCP fields are required', 'error');
                    return;
                }

                vscode.postMessage({
                    command: 'registerMcpHandler',
                    namespace: namespace + '.' + command,
                    handler
                });
                logMessage(\`Registered MCP handler for \${namespace}.\${command}\`);
            });
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'updateAgents':
                    updateAgentsList(message.agents);
                    break;

                case 'logMessage':
                    logMessage(message.text, message.type);
                    break;
            }
        });

        // Update the agents list
        function updateAgentsList(agents) {
            const container = document.getElementById('agents-container');
            const recipientSelect = document.getElementById('recipient');

            // Clear existing content
            container.innerHTML = '';
            recipientSelect.innerHTML = '';

            if (!agents || agents.length === 0) {
                container.innerHTML = '<p>No agents discovered. Click "Discover AI Agents" to find available AI extensions.</p>';
                return;
            }

            agents.forEach(agent => {
                // Add to the detailed view
                const agentEl = document.createElement('div');
                agentEl.className = 'agent-item';

                const header = document.createElement('div');
                header.className = 'agent-header';

                const name = document.createElement('div');
                name.className = 'agent-name';
                name.textContent = agent.name || agent.id;

                header.appendChild(name);
                agentEl.appendChild(header);

                if (agent.capabilities && agent.capabilities.length) {
                    const capsContainer = document.createElement('div');
                    capsContainer.className = 'agent-capabilities';

                    agent.capabilities.forEach(cap => {
                        const capTag = document.createElement('span');
                        capTag.className = 'capability-tag';
                        capTag.textContent = cap;
                        capsContainer.appendChild(capTag);
                    });

                    agentEl.appendChild(capsContainer);
                }

                container.appendChild(agentEl);

                // Add to the recipient dropdown
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name || agent.id;
                recipientSelect.appendChild(option);
            });

            logMessage(\`Found \${agents.length} AI agents\`);
        }

        // Add a message to the log
        function logMessage(message, type = 'info') {
            const log = document.getElementById('comms-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry';

            const timestamp = document.createElement('div');
            timestamp.className = 'log-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString();

            const messageEl = document.createElement('div');
            messageEl.className = 'log-message';
            if (type === 'error') {
                messageEl.style.color = 'var(--vscode-errorForeground)';
            }
            messageEl.textContent = message;

            entry.appendChild(timestamp);
            entry.appendChild(messageEl);

            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        // Request initial agents list
        vscode.postMessage({ command: 'discoverAgents' });
    </script>
</body>
</html>`;
  }

  public dispose() {
    CommunicationPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
