/**
 * The New Fuse VSCode Extension - AI CodeLens Provider
 *
 * Provides inline code suggestions and actions using CodeLens
 * Shows AI-powered hints and quick actions above functions, classes, and other code elements
 */

import * as vscode from 'vscode';
import { getAIService } from '../services/AIService';
import { log } from '../utils/logger';

interface CodeLensItem {
  range: vscode.Range;
  command: vscode.Command;
  tooltip?: string;
}

export class AICodeLensProvider implements vscode.CodeLensProvider {
  private static instance: AICodeLensProvider;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  private enabled: boolean = true;
  private cache: Map<string, CodeLensItem[]> = new Map();

  private constructor() {}

  public static getInstance(): AICodeLensProvider {
    if (!AICodeLensProvider.instance) {
      AICodeLensProvider.instance = new AICodeLensProvider();
    }
    return AICodeLensProvider.instance;
  }

  /**
   * Provide CodeLens items for the document
   */
  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (!this.enabled) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    try {
      // Get symbols in the document
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      );

      if (!symbols || symbols.length === 0) {
        return [];
      }

      // Add CodeLens for each function and class
      for (const symbol of symbols) {
        if (
          symbol.kind === vscode.SymbolKind.Function ||
          symbol.kind === vscode.SymbolKind.Method ||
          symbol.kind === vscode.SymbolKind.Class ||
          symbol.kind === vscode.SymbolKind.Interface
        ) {
          codeLenses.push(...this.createCodeLensesForSymbol(document, symbol));
        }

        // Recursively process children
        if (symbol.children) {
          for (const child of symbol.children) {
            if (
              child.kind === vscode.SymbolKind.Function ||
              child.kind === vscode.SymbolKind.Method
            ) {
              codeLenses.push(...this.createCodeLensesForSymbol(document, child));
            }
          }
        }
      }
    } catch (error) {
      log.error('Failed to provide CodeLenses', error);
    }

    return codeLenses;
  }

  /**
   * Create CodeLens items for a symbol
   */
  private createCodeLensesForSymbol(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const range = symbol.range;

    // Add "Explain" CodeLens
    codeLenses.push(
      new vscode.CodeLens(range, {
        title: '$(info) AI: Explain',
        tooltip: `Explain this ${this.getSymbolTypeName(symbol.kind)}`,
        command: 'theNewFuse.codeLens.explain',
        arguments: [document.uri, range],
      })
    );

    // Add "Optimize" CodeLens for functions
    if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
      codeLenses.push(
        new vscode.CodeLens(range, {
          title: '$(rocket) AI: Optimize',
          tooltip: 'Suggest optimizations for this function',
          command: 'theNewFuse.codeLens.optimize',
          arguments: [document.uri, range],
        })
      );

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: '$(beaker) AI: Generate Tests',
          tooltip: 'Generate unit tests for this function',
          command: 'theNewFuse.codeLens.generateTests',
          arguments: [document.uri, range],
        })
      );
    }

    // Add "Document" CodeLens
    codeLenses.push(
      new vscode.CodeLens(range, {
        title: '$(book) AI: Document',
        tooltip: 'Generate documentation for this code',
        command: 'theNewFuse.codeLens.document',
        arguments: [document.uri, range],
      })
    );

    return codeLenses;
  }

  /**
   * Get human-readable name for symbol kind
   */
  private getSymbolTypeName(kind: vscode.SymbolKind): string {
    switch (kind) {
      case vscode.SymbolKind.Function:
        return 'function';
      case vscode.SymbolKind.Method:
        return 'method';
      case vscode.SymbolKind.Class:
        return 'class';
      case vscode.SymbolKind.Interface:
        return 'interface';
      default:
        return 'code';
    }
  }

  /**
   * Resolve CodeLens (optional, for lazy loading)
   */
  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.CodeLens {
    return codeLens;
  }

  /**
   * Enable or disable CodeLens
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Refresh all CodeLenses
   */
  public refresh(): void {
    this.cache.clear();
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onDidChangeCodeLenses.dispose();
    this.cache.clear();
  }
}

/**
 * Register CodeLens commands
 */
export function registerCodeLensCommands(context: vscode.ExtensionContext): void {
  // Explain command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'theNewFuse.codeLens.explain',
      async (uri: vscode.Uri, range: vscode.Range) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const code = document.getText(range);
        const languageId = document.languageId;

        const aiService = getAIService();
        const explanation = await aiService.quickChat(
          `Explain this ${languageId} code:\n\n\`\`\`${languageId}\n${code}\n\`\`\``,
          'You are a code explanation assistant. Provide clear, concise explanations.'
        );

        // Show explanation in a hover-like panel
        const panel = vscode.window.createWebviewPanel(
          'aiExplanation',
          'AI Code Explanation',
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );

        panel.webview.html = getExplanationHTML(explanation, code, languageId);
      }
    )
  );

  // Optimize command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'theNewFuse.codeLens.optimize',
      async (uri: vscode.Uri, range: vscode.Range) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const code = document.getText(range);
        const languageId = document.languageId;

        const aiService = getAIService();
        const optimized = await aiService.quickChat(
          `Optimize this ${languageId} code for performance and readability:\n\n\`\`\`${languageId}\n${code}\n\`\`\``,
          'You are a code optimization assistant. Suggest specific improvements with explanations.'
        );

        // Show in diff view
        const { getDiffViewProvider } = await import('./DiffViewProvider');
        const diffProvider = getDiffViewProvider();

        // Extract code from markdown if present
        const codeMatch = optimized.match(/```[\w]*\n([\s\S]*?)```/);
        const optimizedCode = codeMatch ? codeMatch[1] : optimized;

        await diffProvider.showRangeDiff(uri, range, optimizedCode, 'AI-suggested optimization');
      }
    )
  );

  // Generate tests command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'theNewFuse.codeLens.generateTests',
      async (uri: vscode.Uri, range: vscode.Range) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const code = document.getText(range);
        const languageId = document.languageId;

        const aiService = getAIService();
        const tests = await aiService.quickChat(
          `Generate comprehensive unit tests for this ${languageId} code:\n\n\`\`\`${languageId}\n${code}\n\`\`\``,
          'You are a test generation assistant. Generate thorough unit tests with edge cases.'
        );

        // Create a new test file
        const testFileName = uri.fsPath.replace(/\.(ts|js|py|java)$/, '.test.$1');
        const testUri = vscode.Uri.file(testFileName);

        const edit = new vscode.WorkspaceEdit();
        edit.createFile(testUri, { ignoreIfExists: true });

        // Extract code from markdown if present
        const codeMatch = tests.match(/```[\w]*\n([\s\S]*?)```/);
        const testCode = codeMatch ? codeMatch[1] : tests;

        edit.insert(testUri, new vscode.Position(0, 0), testCode);

        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(testUri);

        vscode.window.showInformationMessage('✓ Test file created');
      }
    )
  );

  // Document command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'theNewFuse.codeLens.document',
      async (uri: vscode.Uri, range: vscode.Range) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const code = document.getText(range);
        const languageId = document.languageId;

        const aiService = getAIService();
        const docs = await aiService.quickChat(
          `Generate documentation comments for this ${languageId} code:\n\n\`\`\`${languageId}\n${code}\n\`\`\``,
          'You are a documentation assistant. Generate clear JSDoc/TSDoc/docstring comments.'
        );

        // Extract documentation
        const docMatch = docs.match(/```[\w]*\n([\s\S]*?)```/);
        const documentation = docMatch ? docMatch[1] : docs;

        // Insert documentation above the code
        const edit = new vscode.WorkspaceEdit();
        const insertPosition = new vscode.Position(range.start.line, 0);
        edit.insert(uri, insertPosition, documentation + '\n');

        await vscode.workspace.applyEdit(edit);
        await document.save();

        vscode.window.showInformationMessage('✓ Documentation added');
      }
    )
  );
}

/**
 * Get HTML for explanation panel
 */
function getExplanationHTML(explanation: string, code: string, language: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Explanation</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        h2 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .explanation {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h2>Code</h2>
    <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>

    <div class="explanation">
        <h2>Explanation</h2>
        <div>${markdownToHtml(explanation)}</div>
    </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

/**
 * Get the singleton instance
 */
export function getAICodeLensProvider(): AICodeLensProvider {
  return AICodeLensProvider.getInstance();
}
