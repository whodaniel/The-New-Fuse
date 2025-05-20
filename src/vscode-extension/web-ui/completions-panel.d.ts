import * as vscode from 'vscode';
import { PanelSolution } from '../services/completions-provider.js';
/**
 * Panel to display multiple AI-generated code completions
 * Based on GitHub Copilot's completions panel UI pattern
 */
export declare class CompletionsPanel {
    static currentPanel: CompletionsPanel | undefined;
    private readonly _panel;
    private readonly _extensionUri;
    private _disposables;
    private _solutions;
    private _document;
    private _position;
    private _currentSolutionIndex;
    static readonly viewType = "theNewFuse.completionsPanel";
    /**
     * Create or show the panel
     */
    static createOrShow(extensionUri: vscode.Uri, solutions: PanelSolution[], document: vscode.TextDocument, position: vscode.Position): void;
    /**
     * Create the CompletionsPanel
     */
    private constructor();
    /**
     * Apply a solution
     */
    private _applySolution;
    /**
     * Show the next solution
     */
    private _showNextSolution;
    /**
     * Show the previous solution
     */
    private _showPreviousSolution;
    /**
     * Update the panel with new solutions
     */
    private _update;
    /**
     * Update the webview content
     */
    private _updateWebview;
    /**
     * Generate the HTML for the webview
     */
    private _getHtmlForWebview;
    /**
     * Escape HTML to prevent XSS
     */
    private _escapeHtml;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=completions-panel.d.ts.map