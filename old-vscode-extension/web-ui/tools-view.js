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
exports.ToolsView = void 0;
const vscode = __importStar(require("vscode"));
const core_features_1 = require("../services/core-features");
/**
 * Enhanced Tools View for the sidebar
 * Provides access to AI tools and features
 */
class ToolsView {
    constructor(extensionUri) {
        this._tools = [];
        this._disposables = [];
        this._extensionUri = extensionUri;
        this._coreFeatures = core_features_1.CoreFeaturesManager.getInstance();
        // Define available tools
        this._tools = [
            {
                id: 'code-explanation',
                name: 'Code Explanation',
                description: 'Explain selected code',
                category: 'Code Analysis',
                icon: '📝',
                command: 'thefuse.explainCode'
            },
            {
                id: 'code-refactoring',
                name: 'Code Refactoring',
                description: 'Refactor selected code',
                category: 'Code Generation',
                icon: '🔄',
                command: 'thefuse.refactorCode'
            },
            {
                id: 'generate-completions',
                name: 'Generate Completions',
                description: 'Generate code completions',
                category: 'Code Generation',
                icon: '💡',
                command: 'thefuse.generateCompletions'
            },
            {
                id: 'toggle-completions',
                name: 'Toggle Inline Completions',
                description: 'Turn inline completions on/off',
                category: 'Settings',
                icon: '⚙️',
                command: 'thefuse.toggleCompletions'
            },
            {
                id: 'select-model',
                name: 'Select AI Model',
                description: 'Choose which AI model to use',
                category: 'Settings',
                icon: '🧠',
                command: 'thefuse.selectModel'
            },
            {
                id: 'chrome-extension',
                name: 'Connect Chrome Extension',
                description: 'Connect to Chrome extension',
                category: 'Integration',
                icon: '🔗',
                command: 'thefuse.connectChromeExtension'
            },
            {
                id: 'comm-panel',
                name: 'Communication Panel',
                description: 'Show communication panel',
                category: 'Communication',
                icon: '💬',
                command: 'thefuse.showCommunicationPanel'
            }
        ];
    }
    dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getBaseHtml(webview, title, bodyContent) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'styles.css'));
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>${title}</title>
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>`;
    }
    /**
     * Called when the webview is created
     */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Set up the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        // Set initial HTML
        webviewView.webview.html = this._getHtmlForWebview();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'executeTool':
                        await this._executeTool(message.toolId);
                        break;
                    case 'refreshTools':
                        this._refreshTools();
                        break;
                }
            }
            catch (error) {
                this._logger.error('Error handling message:', error);
            }
        }, null, this._disposables);
        // Initial load of tools
        this._refreshTools();
    }
    /**
     * Refresh the tools list
     */
    _refreshTools() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateTools',
                tools: this._tools
            });
        }
    }
    /**
     * Execute a tool by ID
     */
    async _executeTool(toolId) {
        try {
            const tool = this._tools.find(t => t.id === toolId);
            if (!tool) {
                throw new Error(`Tool with ID ${toolId} not found`);
            }
            // Execute the associated command
            if (tool.commandArgs) {
                await vscode.commands.executeCommand(tool.command, ...tool.commandArgs);
            }
            else {
                await vscode.commands.executeCommand(tool.command);
            }
        }
        catch (error) {
            this._logger.error(`Failed to execute tool ${toolId}:`, error);
            vscode.window.showErrorMessage(`Failed to execute tool: ${error}`);
        }
    }
    /**
     * Generate HTML content for the webview
     */
    _getHtmlForWebview() {
        const nonce = this.getNonce();
        const bodyContent = `
            <div class="tools-header">
                <h2>AI Tools</h2>
            </div>
            
            <div class="search-container">
                <input type="text" id="toolSearch" placeholder="Search tools..." />
            </div>
            
            <div class="content-area" id="toolsList"></div>
            
            <script nonce="${nonce}">
                // Store state
                const state = {
                    tools: [],
                    filter: '',
                    categories: new Set()
                };
                
                // Elements
                const toolsList = document.getElementById('toolsList');
                const toolSearch = document.getElementById('toolSearch');
                
                // Event handlers
                toolSearch.addEventListener('input', (e) => {
                    state.filter = e.target.value.toLowerCase();
                    renderTools();
                });
                
                // Handle messages from the extension
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateTools':
                            state.tools = message.tools;
                            // Extract unique categories
                            state.categories = new Set(message.tools.map(tool => tool.category));
                            renderTools();
                            break;
                    }
                });
                
                // Execute a tool
                function executeTool(toolId) {
                    vscode.postMessage({
                        command: 'executeTool',
                        toolId
                    });
                }
                
                // Render tools grouped by category
                function renderTools() {
                    toolsList.innerHTML = '';
                    
                    if (state.tools.length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';
                        emptyState.innerHTML = \`
                            <div class="empty-icon">🔧</div>
                            <h3>No tools available</h3>
                            <p>No AI tools are currently available</p>
                        \`;
                        toolsList.appendChild(emptyState);
                        return;
                    }
                    
                    // Filter tools based on search
                    const filteredTools = state.filter
                        ? state.tools.filter(tool => 
                            tool.name.toLowerCase().includes(state.filter) ||
                            tool.description.toLowerCase().includes(state.filter) ||
                            tool.category.toLowerCase().includes(state.filter)
                          )
                        : state.tools;
                    
                    if (filteredTools.length === 0) {
                        const noResults = document.createElement('div');
                        noResults.className = 'empty-state';
                        noResults.innerHTML = \`
                            <div class="empty-icon">🔍</div>
                            <h3>No matching tools</h3>
                            <p>No tools match your search criteria</p>
                            <button onclick="clearSearch()">Clear Search</button>
                        \`;
                        toolsList.appendChild(noResults);
                        return;
                    }
                    
                    // Group by category
                    const categories = {};
                    filteredTools.forEach(tool => {
                        if (!categories[tool.category]) {
                            categories[tool.category] = [];
                        }
                        categories[tool.category].push(tool);
                    });
                    
                    // Render each category
                    Object.keys(categories).sort().forEach(category => {
                        const categorySection = document.createElement('div');
                        categorySection.className = 'tool-category';
                        
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'category-header';
                        categoryHeader.textContent = category;
                        
                        categorySection.appendChild(categoryHeader);
                        
                        // Render tools in this category
                        categories[category].forEach(tool => {
                            const toolItem = document.createElement('div');
                            toolItem.className = 'tool-item';
                            toolItem.onclick = () => executeTool(tool.id);
                            
                            const icon = document.createElement('div');
                            icon.className = 'tool-icon';
                            icon.textContent = tool.icon || '🔧';
                            
                            const content = document.createElement('div');
                            content.className = 'tool-content';
                            
                            const name = document.createElement('div');
                            name.className = 'tool-name';
                            name.textContent = tool.name;
                            
                            const description = document.createElement('div');
                            description.className = 'tool-description';
                            description.textContent = tool.description;
                            
                            content.appendChild(name);
                            content.appendChild(description);
                            
                            toolItem.appendChild(icon);
                            toolItem.appendChild(content);
                            
                            categorySection.appendChild(toolItem);
                        });
                        
                        toolsList.appendChild(categorySection);
                    });
                }
                
                // Clear search filter
                function clearSearch() {
                    toolSearch.value = '';
                    state.filter = '';
                    renderTools();
                }
                
                // Request initial tools data
                vscode.postMessage({ command: 'refreshTools' });
            </script>
            
            <style>
                .tools-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .tools-header h2 {
                    margin: 0;
                }
                
                .search-container {
                    margin-bottom: 15px;
                }
                
                #toolSearch {
                    width: 100%;
                    padding: 6px 8px;
                    border-radius: 4px;
                }
                
                .tool-category {
                    margin-bottom: 20px;
                }
                
                .category-header {
                    font-weight: bold;
                    margin-bottom: 8px;
                    padding-bottom: 4px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .tool-item {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    background-color: var(--vscode-list-hoverBackground);
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .tool-item:hover {
                    background-color: var(--vscode-list-activeSelectionBackground);
                }
                
                .tool-icon {
                    flex: 0 0 24px;
                    height: 24px;
                    width: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 8px;
                    font-size: 1.2rem;
                }
                
                .tool-content {
                    flex: 1;
                }
                
                .tool-name {
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                
                .tool-description {
                    font-size: 0.85em;
                    color: var(--vscode-descriptionForeground);
                }
                
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--vscode-descriptionForeground);
                    text-align: center;
                    padding: 20px;
                }
                
                .empty-state button {
                    margin-top: 10px;
                }
                
                .empty-icon {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
            </style>
        `;
        return this.getBaseHtml(this._view.webview, 'AI Tools', bodyContent);
    }
    /**
     * Send a message to the webview
     */
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}
exports.ToolsView = ToolsView;
//# sourceMappingURL=tools-view.js.map