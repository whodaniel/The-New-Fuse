import * as vscode from 'vscode';
import { PanelSolution } from '../services/completions-provider.js';
import { getLogger, Logger } from '../src/core/logging.js';

/**
 * Panel to display multiple AI-generated code completions
 * Based on GitHub Copilot's completions panel UI pattern
 */
export class CompletionsPanel {
    public static currentPanel: CompletionsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _solutions: PanelSolution[] = [];
    private _document: vscode.TextDocument;
    private _position: vscode.Position;
    private _currentSolutionIndex: number = 0;

    public static readonly viewType = 'theNewFuse.completionsPanel';

    /**
     * Create or show the panel
     */
    public static createOrShow(
        extensionUri: vscode.Uri,
        solutions: PanelSolution[],
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CompletionsPanel.currentPanel) {
            CompletionsPanel.currentPanel._panel.reveal(column);
            CompletionsPanel.currentPanel._update(solutions, document, position);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            CompletionsPanel.viewType,
            'AI Completions',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        CompletionsPanel.currentPanel = new CompletionsPanel(panel, extensionUri, solutions, document, position);
    }

    /**
     * Create the CompletionsPanel
     */
    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        solutions: PanelSolution[],
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._solutions = solutions;
        this._document = document;
        this._position = position;

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
            message => {
                switch (message.command) {
                    case 'apply':
                        this._applySolution(message.index);
                        return;
                    case 'next':
                        this._showNextSolution();
                        return;
                    case 'prev':
                        this._showPreviousSolution();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Apply a solution
     */
    private _applySolution(index: number) {
        try {
            const solution = this._solutions[index];
            if (!solution) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === this._document) {
                editor.edit(editBuilder => {
                    editBuilder.insert(this._position, solution.code);
                });
                this._panel.dispose();
            } else {
                vscode.window.showErrorMessage('Editor has changed. Cannot apply completion.');
                this._panel.dispose();
            }
        } catch (error) {
            getLogger().error('Error applying solution:', error);
            vscode.window.showErrorMessage('Failed to apply code completion');
        }
    }

    /**
     * Show the next solution
     */
    private _showNextSolution() {
        if (this._currentSolutionIndex < this._solutions.length - 1) {
            this._currentSolutionIndex++;
            this._update();
        }
    }

    /**
     * Show the previous solution
     */
    private _showPreviousSolution() {
        if (this._currentSolutionIndex > 0) {
            this._currentSolutionIndex--;
            this._update();
        }
    }

    /**
     * Update the panel with new solutions
     */
    private _update(
        solutions?: PanelSolution[],
        document?: vscode.TextDocument,
        position?: vscode.Position
    ) {
        if (solutions) {
            this._solutions = solutions;
            this._currentSolutionIndex = 0;
        }

        if (document) {
            this._document = document;
        }

        if (position) {
            this._position = position;
        }

        this._updateWebview();
    }

    /**
     * Update the webview content
     */
    private _updateWebview() {
        this._panel.title = `AI Completions (${this._currentSolutionIndex + 1}/${this._solutions.length})`;
        this._panel.webview.html = this._getHtmlForWebview();
    }

    /**
     * Generate the HTML for the webview
     */
    private _getHtmlForWebview() {
        const currentSolution = this._solutions[this._currentSolutionIndex];
        const hasNext = this._currentSolutionIndex < this._solutions.length - 1;
        const hasPrev = this._currentSolutionIndex > 0;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Completions</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .header {
                    padding: 10px 15px;
                    background-color: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .title {
                    font-size: 1.2em;
                    margin: 0;
                }
                .navigation {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .code-container {
                    flex: 1;
                    padding: 15px;
                    overflow: auto;
                }
                pre {
                    margin: 0;
                    padding: 15px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 5px;
                    overflow: auto;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    white-space: pre-wrap;
                }
                .footer {
                    padding: 10px 15px;
                    background-color: var(--vscode-editor-background);
                    border-top: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .page-info {
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2 class="title">AI Suggested Completion</h2>
                <div class="navigation">
                    <button id="prevBtn" ${!hasPrev ? 'disabled' : ''}>Previous</button>
                    <span class="page-info">${this._currentSolutionIndex + 1}/${this._solutions.length}</span>
                    <button id="nextBtn" ${!hasNext ? 'disabled' : ''}>Next</button>
                </div>
            </div>
            
            <div class="code-container">
                <pre>${this._escapeHtml(currentSolution?.code || 'No suggestion available')}</pre>
            </div>
            
            <div class="footer">
                <div>
                    <span>Score: ${currentSolution?.score.toFixed(2) || 'N/A'}</span>
                </div>
                <div>
                    <button id="applyBtn">Apply Suggestion</button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('applyBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'apply',
                        index: ${this._currentSolutionIndex}
                    });
                });
                
                document.getElementById('prevBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'prev'
                    });
                });
                
                document.getElementById('nextBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'next'
                    });
                });
            </script>
        </body>
        </html>`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    private _escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Dispose of resources
     */
    public dispose() {
        CompletionsPanel.currentPanel = undefined;

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