/**
 * The New Fuse VSCode Extension - AI Hover Provider
 *
 * Provides AI-powered hover hints for code explanations, documentation, and quick insights
 */

import * as vscode from 'vscode';
import { getAIService } from '../services/AIService';
import { log } from '../utils/logger';

interface HoverCache {
  text: string;
  hover: vscode.Hover;
  timestamp: number;
}

export class AIHoverProvider implements vscode.HoverProvider {
  private static instance: AIHoverProvider;
  private cache: Map<string, HoverCache> = new Map();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes
  private enabled: boolean = true;
  private enableAIHints: boolean = false; // Disabled by default to avoid too many AI calls

  private constructor() {}

  public static getInstance(): AIHoverProvider {
    if (!AIHoverProvider.instance) {
      AIHoverProvider.instance = new AIHoverProvider();
    }
    return AIHoverProvider.instance;
  }

  /**
   * Provide hover information for the position
   */
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Get word range at position
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) {
        return null;
      }

      const word = document.getText(wordRange);

      // Check cache first
      const cacheKey = `${document.uri.toString()}:${position.line}:${position.character}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.hover;
      }

      // Get symbol information
      const hover = await this.createHover(document, position, wordRange, word);

      if (hover) {
        this.cache.set(cacheKey, {
          text: word,
          hover,
          timestamp: Date.now(),
        });
      }

      return hover;
    } catch (error) {
      log.error('Failed to provide hover', error);
      return null;
    }
  }

  /**
   * Create hover content
   */
  private async createHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    wordRange: vscode.Range,
    word: string
  ): Promise<vscode.Hover | null> {
    const markdownString = new vscode.MarkdownString();
    markdownString.isTrusted = true;
    markdownString.supportHtml = true;

    // Get symbol information from language server
    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position
    );

    if (definitions && definitions.length > 0) {
      const def = definitions[0];
      const defDoc = await vscode.workspace.openTextDocument(def.uri);
      const defText = defDoc.getText(def.range);

      markdownString.appendMarkdown(
        `### Definition\n\`\`\`${document.languageId}\n${defText}\n\`\`\`\n\n`
      );
    }

    // Get type information
    try {
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        document.uri,
        position
      );

      if (hovers && hovers.length > 0) {
        for (const hover of hovers) {
          if (hover.contents && hover.contents.length > 0) {
            for (const content of hover.contents) {
              if (typeof content === 'string') {
                markdownString.appendMarkdown(content + '\n\n');
              } else if (content instanceof vscode.MarkdownString) {
                markdownString.appendMarkdown(content.value + '\n\n');
              }
            }
          }
        }
      }
    } catch (error) {
      // Language server might not support hover
      log.debug('No hover information from language server');
    }

    // Add AI-powered insights (if enabled)
    if (this.enableAIHints) {
      markdownString.appendMarkdown('---\n\n');
      markdownString.appendMarkdown('$(loading~spin) Loading AI insights...\n\n');

      // Trigger AI analysis in background
      this.getAIInsights(document, wordRange, word).then((insights) => {
        if (insights) {
          markdownString.appendMarkdown(`### AI Insights\n${insights}\n\n`);
        }
      });
    }

    // Add quick action commands
    markdownString.appendMarkdown('---\n\n');
    markdownString.appendMarkdown(
      `[$(info) Explain](command:theNewFuse.hover.explain?${encodeURIComponent(
        JSON.stringify([document.uri.toString(), wordRange.start.line, wordRange.start.character])
      )}) | `
    );
    markdownString.appendMarkdown(
      `[$(search) Find References](command:editor.action.goToReferences?${encodeURIComponent(
        JSON.stringify([document.uri, position])
      )}) | `
    );
    markdownString.appendMarkdown(
      `[$(go-to-file) Go to Definition](command:editor.action.revealDefinition?${encodeURIComponent(
        JSON.stringify([document.uri, position])
      )})`
    );

    return new vscode.Hover(markdownString, wordRange);
  }

  /**
   * Get AI-powered insights for the code element
   */
  private async getAIInsights(
    document: vscode.TextDocument,
    range: vscode.Range,
    word: string
  ): Promise<string | null> {
    try {
      // Get surrounding context (5 lines before and after)
      const startLine = Math.max(0, range.start.line - 5);
      const endLine = Math.min(document.lineCount - 1, range.end.line + 5);
      const contextRange = new vscode.Range(startLine, 0, endLine, 0);
      const context = document.getText(contextRange);

      const aiService = getAIService();
      const insights = await aiService.quickChat(
        `Provide a brief one-sentence insight about "${word}" in this code context:\n\n\`\`\`${document.languageId}\n${context}\n\`\`\``,
        'You are a code insight assistant. Provide concise, helpful insights in one sentence.'
      );

      return insights;
    } catch (error) {
      log.error('Failed to get AI insights', error);
      return null;
    }
  }

  /**
   * Enable or disable AI hints
   */
  public setAIHintsEnabled(enabled: boolean): void {
    this.enableAIHints = enabled;
    this.clearCache();
  }

  /**
   * Enable or disable the hover provider
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.cache.clear();
  }
}

/**
 * Register hover commands
 */
export function registerHoverCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'theNewFuse.hover.explain',
      async (uriString: string, line: number, character: number) => {
        const uri = vscode.Uri.parse(uriString);
        const document = await vscode.workspace.openTextDocument(uri);
        const position = new vscode.Position(line, character);
        const wordRange = document.getWordRangeAtPosition(position);

        if (!wordRange) {
          return;
        }

        const code = document.getText(wordRange);
        const languageId = document.languageId;

        // Get more context (surrounding lines)
        const startLine = Math.max(0, line - 10);
        const endLine = Math.min(document.lineCount - 1, line + 10);
        const contextRange = new vscode.Range(startLine, 0, endLine, 0);
        const context = document.getText(contextRange);

        const aiService = getAIService();
        const explanation = await aiService.quickChat(
          `Explain "${code}" in this ${languageId} code context:\n\n\`\`\`${languageId}\n${context}\n\`\`\``,
          'You are a code explanation assistant. Provide clear, detailed explanations.'
        );

        // Show in output panel
        const outputChannel = vscode.window.createOutputChannel('The New Fuse: AI Explanation');
        outputChannel.clear();
        outputChannel.appendLine(`# Explanation of "${code}"`);
        outputChannel.appendLine('');
        outputChannel.appendLine(explanation);
        outputChannel.show(true);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.hover.toggleAIHints', () => {
      const provider = AIHoverProvider.getInstance();
      const currentState = (provider as any).enableAIHints;
      provider.setAIHintsEnabled(!currentState);

      vscode.window.showInformationMessage(
        `AI Hover Hints ${!currentState ? 'enabled' : 'disabled'}`
      );
    })
  );
}

/**
 * Get the singleton instance
 */
export function getAIHoverProvider(): AIHoverProvider {
  return AIHoverProvider.getInstance();
}
