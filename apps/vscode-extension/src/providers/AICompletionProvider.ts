/**
 * The New Fuse VSCode Extension - AI Completion Provider
 *
 * Provides AI-powered code completions and suggestions
 * Integrates with the extension's LLM providers for intelligent autocompletion
 */

import * as vscode from 'vscode';
import { getAIService } from '../services/AIService';
import { log } from '../utils/logger';

interface CompletionCache {
  prefix: string;
  completions: vscode.CompletionItem[];
  timestamp: number;
}

export class AICompletionProvider implements vscode.CompletionItemProvider {
  private static instance: AICompletionProvider;
  private cache: Map<string, CompletionCache> = new Map();
  private readonly cacheDuration = 2 * 60 * 1000; // 2 minutes
  private enabled: boolean = true;
  private triggerDelay = 1000; // 1 second delay to avoid too many requests
  private lastTriggerTime = 0;

  private constructor() {}

  public static getInstance(): AICompletionProvider {
    if (!AICompletionProvider.instance) {
      AICompletionProvider.instance = new AICompletionProvider();
    }
    return AICompletionProvider.instance;
  }

  /**
   * Provide completion items
   */
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | null> {
    if (!this.enabled) {
      return null;
    }

    // Rate limiting: Don't trigger too frequently
    const now = Date.now();
    if (now - this.lastTriggerTime < this.triggerDelay) {
      return null;
    }
    this.lastTriggerTime = now;

    try {
      // Get the text before the cursor
      const linePrefix = document.lineAt(position).text.substr(0, position.character);

      // Check cache
      const cacheKey = `${document.uri.toString()}:${position.line}`;
      const cached = this.cache.get(cacheKey);
      if (
        cached &&
        linePrefix.startsWith(cached.prefix) &&
        now - cached.timestamp < this.cacheDuration
      ) {
        return cached.completions;
      }

      // Only trigger on certain contexts
      if (!this.shouldTriggerCompletion(linePrefix, context)) {
        return null;
      }

      // Get completions from AI
      const completions = await this.getAICompletions(document, position, linePrefix, token);

      if (completions && completions.length > 0) {
        this.cache.set(cacheKey, {
          prefix: linePrefix,
          completions,
          timestamp: now,
        });
      }

      return completions;
    } catch (error) {
      log.error('Failed to provide completions', error);
      return null;
    }
  }

  /**
   * Determine if completion should be triggered
   */
  private shouldTriggerCompletion(linePrefix: string, context: vscode.CompletionContext): boolean {
    // Trigger on specific characters or contexts
    const triggerCharacters = ['.', '(', '{', '[', ' ', '\t'];

    // Check if triggered by a trigger character
    if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
      return triggerCharacters.includes(context.triggerCharacter || '');
    }

    // For invoke completion, check if we're in a meaningful position
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
      // Don't trigger on empty lines or just whitespace
      if (linePrefix.trim().length === 0) {
        return false;
      }

      // Trigger if we have a meaningful prefix (at least 2 characters)
      return linePrefix.trim().length >= 2;
    }

    return false;
  }

  /**
   * Get completions from AI service
   */
  private async getAICompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    linePrefix: string,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem[]> {
    try {
      // Get context (lines before cursor)
      const contextLines = 20;
      const startLine = Math.max(0, position.line - contextLines);
      const contextRange = new vscode.Range(startLine, 0, position.line, position.character);
      const context = document.getText(contextRange);

      const aiService = getAIService();

      // Request completion from AI
      const prompt = `Complete the following ${document.languageId} code. Provide only the completion, no explanations:\n\n\`\`\`${document.languageId}\n${context}`;

      const completion = await aiService.quickChat(
        prompt,
        'You are a code completion assistant. Provide only the code completion, no explanations or markdown.'
      );

      if (token.isCancellationRequested) {
        return [];
      }

      // Parse the completion response
      const completions = this.parseCompletionResponse(completion, linePrefix);
      return completions;
    } catch (error) {
      log.error('Failed to get AI completions', error);
      return [];
    }
  }

  /**
   * Parse AI completion response into VSCode completion items
   */
  private parseCompletionResponse(response: string, linePrefix: string): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Clean up the response (remove markdown code blocks if present)
    let cleanedResponse = response;
    const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1];
    }

    // Split into lines and create completion items
    const lines = cleanedResponse.split('\n').filter((line) => line.trim().length > 0);

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];

      const item = new vscode.CompletionItem(line.trim(), vscode.CompletionItemKind.Snippet);

      item.insertText = new vscode.SnippetString(line);
      item.detail = 'AI suggestion';
      item.documentation = new vscode.MarkdownString('AI-generated completion');
      item.sortText = `ai-${i}`; // Sort AI completions after built-in ones
      item.preselect = i === 0; // Preselect the first one

      completions.push(item);
    }

    // Also create a multi-line completion if multiple lines are suggested
    if (lines.length > 1) {
      const multiLineItem = new vscode.CompletionItem(
        'AI: Complete block',
        vscode.CompletionItemKind.Snippet
      );

      multiLineItem.insertText = new vscode.SnippetString(cleanedResponse);
      multiLineItem.detail = 'AI multi-line suggestion';
      multiLineItem.documentation = new vscode.MarkdownString(
        `AI-generated multi-line completion:\n\n\`\`\`\n${cleanedResponse}\n\`\`\``
      );
      multiLineItem.sortText = 'ai-block';

      completions.push(multiLineItem);
    }

    return completions;
  }

  /**
   * Resolve completion item (lazy loading)
   */
  public async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    // Add more details if needed
    return item;
  }

  /**
   * Enable or disable the completion provider
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set trigger delay
   */
  public setTriggerDelay(delay: number): void {
    this.triggerDelay = Math.max(0, delay);
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
 * Register completion provider commands
 */
export function registerCompletionCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.completion.toggle', () => {
      const provider = AICompletionProvider.getInstance();
      const currentState = (provider as any).enabled;
      provider.setEnabled(!currentState);

      vscode.window.showInformationMessage(
        `AI Completions ${!currentState ? 'enabled' : 'disabled'}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.completion.clearCache', () => {
      const provider = AICompletionProvider.getInstance();
      provider.clearCache();
      vscode.window.showInformationMessage('Completion cache cleared');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.completion.triggerManual', async () => {
      // Manually trigger completion at cursor position
      await vscode.commands.executeCommand('editor.action.triggerSuggest');
    })
  );
}

/**
 * Get the singleton instance
 */
export function getAICompletionProvider(): AICompletionProvider {
  return AICompletionProvider.getInstance();
}
