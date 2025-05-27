import * as vscode from 'vscode';
import { BaseWebView } from './base-webview.js';
import { CoreFeaturesManager } from '../services/core-features.js';
import { Logger } from '../core/logging.js';

/**
 * Tool definition interface
 */
interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string; // emoji or icon name
    command: string;
    commandArgs?: any[];
}

/**
 * Enhanced Tools View for the sidebar
 * Provides access to AI tools and features
 */
export class ToolsView implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;
    private readonly _coreFeatures: CoreFeaturesManager;
    private _tools: Tool[] = [];
    private _disposables: vscode.Disposable[] = [];
    private _logger: Logger;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        this._coreFeatures = CoreFeaturesManager.getInstance();
        this._logger = Logger.create('ToolsView');
        
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
            }
        ];
    }

    public dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    protected getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    protected getBaseHtml(webview: vscode.Webview, title: string, bodyContent: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>
        `;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;
        
        // Set up the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        
        // Set initial HTML
        webviewView.webview.html = this._getHtmlForWebview();
        
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                try {
                    switch (message.command) {
                        case 'executeTool':
                            await this._executeTool(message.toolId);
                            break;
                            
                        case 'refreshTools':
                            this._refreshTools();
                            break;
                    }
                } catch (error) {
                    this._logger.error('Error handling message:', error);
                }
            },
            null,
            this._disposables
        );
        
        // Initial load of tools
        this._refreshTools();
    }
    
    /**
     * Refresh the tools list
     */
    private _refreshTools(): void {
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
    private async _executeTool(toolId: string): Promise<void> {
        try {
            const tool = this._tools.find(t => t.id === toolId);
            if (!tool) {
                throw new Error(`Tool with ID ${toolId} not found`);
            }
            
            // Execute the associated command
            if (tool.commandArgs) {
                await vscode.commands.executeCommand(tool.command, ...tool.commandArgs);
            } else {
                await vscode.commands.executeCommand(tool.command);
            }
        } catch (error) {
            this._logger.error(`Failed to execute tool ${toolId}:`, error);
            vscode.window.showErrorMessage(`Failed to execute tool: ${error}`);
        }
    }

    /**
     * Generate HTML content for the webview
     */
    private _getHtmlForWebview(): string {
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
                
                // Clear the search input and re-render
                function clearSearch() {
                    toolSearch.value = '';
                    state.filter = '';
                    renderTools();
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
                        categorySection.innerHTML =
                            '<h3 class="category-title">' + category + '</h3>' +
                            '<div class="tools-grid">' +
                                categories[category].map(tool => {
                                    return '<div class="tool-card" onclick="executeTool(\'' + tool.id + '\')">' +
                                        '<span class="tool-icon">' + (tool.icon || '🔧') + '</span>' +
                                        '<h4 class="tool-name">' + tool.name + '</h4>' +
                                        '<p class="tool-description">' + tool.description + '</p>' +
                                    '</div>';
                                }).join('') +
                            '</div>';
                        toolsList.appendChild(categorySection);
                    });
                }
            </script>
        `;
        
        return this.getBaseHtml(this._view!.webview, 'AI Tools', bodyContent);
    }

    /**
     * Send a message to the webview
     */
    public postMessage(message: any): void {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}