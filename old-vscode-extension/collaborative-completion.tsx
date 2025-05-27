import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';

/**
 * Interface representing a completion response from an AI agent
 */
interface AgentCompletion {
  agentId: string;
  text: string;
  range?: vscode.Range;
  confidence?: number;
  metadata?: Record<string, any>;
}

/**
 * Mode for combining completions from multiple agents
 */
enum CompletionCombineMode {
  Highest = 'highest',     // Show highest confidence completion
  All = 'all',             // Show all completions
  Blend = 'blend',         // Blend completions together
  Vote = 'vote',           // Show most common completion
  Context = 'context'      // Select based on context
}

/**
 * Collaborative Completion Provider
 * 
 * Coordinate multiple AI agents to provide code completions together
 */
export class CollaborativeCompletionProvider implements vscode.CompletionItemProvider {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private lmBridge: LMAPIBridge;
  private outputChannel: vscode.OutputChannel;
  private activeAgents: Map<string, boolean> = new Map();
  private isCollaborativeModeEnabled: boolean = false;
  private combineMode: CompletionCombineMode = CompletionCombineMode.Highest;
  private onDidChangeModeListeners: ((isEnabled: boolean) => void)[] = [];
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge) {
    this.context = context;
    this.agentClient = agentClient;
    this.lmBridge = lmBridge;
    this.outputChannel = vscode.window.createOutputChannel('Collaborative Completion');
    
    // Load stored settings
    this.isCollaborativeModeEnabled = this.context.globalState.get('thefuse.collaborativeCompletions', false);
    this.combineMode = this.context.globalState.get('thefuse.completionCombineMode', CompletionCombineMode.Highest);
    
    // Subscribe to agent messages
    this.agentClient.subscribe(this.handleAgentMessage.bind(this));
    
    // Register commands
    this.registerCommands();
    
    this.log('Collaborative Completion Provider initialized');
  }
  
  /**
   * Register commands
   */
  private registerCommands() {
    // Toggle collaborative mode
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.toggleCollaborativeCompletion', () => {
        this.toggleCollaborativeMode();
      })
    );
    
    // Set completion combine mode
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.setCompletionCombineMode', async () => {
        await this.selectCompletionCombineMode();
      })
    );
  }
  
  /**
   * Toggle collaborative completion mode
   */
  public toggleCollaborativeMode(): void {
    this.isCollaborativeModeEnabled = !this.isCollaborativeModeEnabled;
    this.context.globalState.update('thefuse.collaborativeCompletions', this.isCollaborativeModeEnabled);
    
    vscode.window.showInformationMessage(
      `Collaborative completions ${this.isCollaborativeModeEnabled ? 'enabled' : 'disabled'}`
    );
    
    this.log(`Collaborative mode ${this.isCollaborativeModeEnabled ? 'enabled' : 'disabled'}`);
    
    // Notify listeners
    this.notifyModeChange();
  }
  
  /**
   * Select completion combine mode
   */
  private async selectCompletionCombineMode(): Promise<void> {
    const modes = [
      { label: 'Highest Confidence', detail: 'Show the completion with highest confidence', mode: CompletionCombineMode.Highest },
      { label: 'All Completions', detail: 'Show all completions from different agents', mode: CompletionCombineMode.All },
      { label: 'Blend', detail: 'Combine completions together intelligently', mode: CompletionCombineMode.Blend },
      { label: 'Vote', detail: 'Show most common completion across agents', mode: CompletionCombineMode.Vote },
      { label: 'Context-Aware', detail: 'Select based on current code context', mode: CompletionCombineMode.Context }
    ];
    
    const selected = await vscode.window.showQuickPick(modes, {
      placeHolder: 'Select how to combine completions from multiple AI agents'
    });
    
    if (selected) {
      this.combineMode = selected.mode;
      this.context.globalState.update('thefuse.completionCombineMode', this.combineMode);
      vscode.window.showInformationMessage(`Completion combine mode set to: ${selected.label}`);
      this.log(`Completion combine mode set to: ${this.combineMode}`);
    }
  }
  
  /**
   * Handler for agent messages
   */
  private async handleAgentMessage(message: any): Promise<void> {
    if (message.action === 'registerCompletionProvider') {
      this.activeAgents.set(message.sender, true);
      this.log(`Registered completion provider: ${message.sender}`);
      
      // Acknowledge registration
      await this.agentClient.sendMessage({
        recipient: message.sender,
        type: 'agent-response', // Example type
        action: 'completionProviderRegistered',
        payload: { success: true },
        source: 'collaborative-completion'
      });
    } else if (message.action === 'provideCompletion') {
      // This would handle direct completion responses
      this.log(`Received completion from ${message.sender}`);
    }
  }
  
  /**
   * VS Code completion provider implementation
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    if (!this.isCollaborativeModeEnabled) {
      return [];
    }

    try {
      const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
      const docContent = document.getText();

      const completions = await this.getCompletionsFromAgents(document, position, linePrefix, docContent, token);

      if (token.isCancellationRequested || completions.length === 0) {
        return [];
      }

      return completions.map(completion => {
        const item = new vscode.CompletionItem(completion.text);
        item.detail = `From ${completion.agentId}`;
        item.kind = vscode.CompletionItemKind.Text;
        if (completion.confidence) {
          item.sortText = String(1 - completion.confidence).padStart(5, '0');
        }
        return item;
      });
    } catch (error) {
      this.log(`Error providing completions: ${(error as Error).message}`);
      return [];
    }
  }
  
  /**
   * Get completions from multiple AI agents
   */
  private async getCompletionsFromAgents(
    document: vscode.TextDocument,
    position: vscode.Position,
    linePrefix: string,
    docContent: string,
    token: vscode.CancellationToken
  ): Promise<AgentCompletion[]> {
    const completions: AgentCompletion[] = [];
    const promises: Promise<void>[] = [];
    
    // Request completions from registered agents
    for (const [agentId, isActive] of this.activeAgents.entries()) {
      if (!isActive) continue;
      
      const promise = this.requestCompletionFromAgent(agentId, document, position, linePrefix, docContent)
        .then(response => {
          if (response && !token.isCancellationRequested) {
            completions.push({
              agentId,
              text: response.text,
              confidence: response.confidence,
              range: response.range ? new vscode.Range(
                new vscode.Position(response.range.start.line, response.range.start.character),
                new vscode.Position(response.range.end.line, response.range.end.character)
              ) : undefined,
              metadata: response.metadata
            });
          }
        })
        .catch(err => {
          this.log(`Error getting completion from ${agentId}: ${(err as Error).message}`);
        });
      
      promises.push(promise);
    }
    
    // Always include a fallback completion from our language model bridge
    const fallbackPromise = this.getFallbackCompletion(document, position, linePrefix, docContent)
      .then(completion => {
        if (completion && !token.isCancellationRequested) {
          completions.push(completion);
        }
      })
      .catch(err => {
        this.log(`Error getting fallback completion: ${(err as Error).message}`);
      });
    
    promises.push(fallbackPromise);
    
    // Wait for all promises with a timeout
    await Promise.race([
      Promise.all(promises),
      new Promise(resolve => setTimeout(resolve, 1000)) // 1 second timeout
    ]);
    
    return completions;
  }
  
  /**
   * Request a completion from a specific agent
   */
  private async requestCompletionFromAgent(
    agentId: string,
    document: vscode.TextDocument,
    position: vscode.Position,
    linePrefix: string,
    docContent: string
  ): Promise<any> {
    try {
      const response = await this.agentClient.sendMessage({
        recipient: agentId,
        type: 'agent-request', // Example type
        action: 'requestCompletion',
        payload: {
            documentUri: document.uri.toString(),
            position: {
                line: position.line,
                character: position.character
            },
            linePrefix,
            docContent,
            language: document.languageId,
            requestId: `completion-${Date.now()}`
        },
        source: 'collaborative-completion'
      });
      
      return response;
    } catch (error) {
      this.log(`Error requesting completion from ${agentId}: ${(error as Error).message}`);
      return null;
    }
  }
  
  /**
   * Get a fallback completion using the language model bridge
   */
  private async getFallbackCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    _linePrefix: string, // Added underscore prefix to mark as intentionally unused
    _docContent: string
    ): Promise<AgentCompletion | null> {
    try {
      // Extract context - about 20 lines around the cursor
      const contextStart = Math.max(0, position.line - 10);
      const contextEnd = Math.min(document.lineCount - 1, position.line + 10);
      let context = '';
      for (let i = contextStart; i <= contextEnd; i++) {
      if (i === position.line) {
        context += document.lineAt(i).text.substring(0, position.character) + '█\n';
      } else {
        context += document.lineAt(i).text + '\n';
      }
      }
      
      // Generate completion using language model
      const prompt = `Complete the following code. Only provide the completion, not the entire code:

  \`\`\`${document.languageId}
  ${context}
  \`\`\``;
      
      const completion = await this.lmBridge.generate({
      prompt: prompt,
      systemPrompt: undefined // this.systemPrompt was not defined on the class
      });
      
      // Clean up completion text
      let completionText = completion.text.trim();
      // Remove leading and trailing backticks and language identifiers
      completionText = completionText.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
      
      return {
      agentId: 'thefuse.lm',
      text: completionText,
      confidence: 0.8,
      metadata: {
        source: 'language-model'
      }
      };
    } catch (error) {
      this.log(`Error getting fallback completion: ${(error as Error).message}`);
      return null;
    }
    }
  
  /**
   * Process completions according to the selected combine mode
   */
  private processCompletions(
    completions: AgentCompletion[],
    _linePrefix: string,
    _docContent: string
  ): AgentCompletion[] {
    if (completions.length === 0) return [];
    
    switch (this.combineMode) {
      case CompletionCombineMode.Highest:
        // Sort by confidence (highest first) and return the top one
        return [completions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]];
      
      case CompletionCombineMode.All:
        // Return all completions
        return completions;
      
      case CompletionCombineMode.Blend:
        // In a real implementation, this would intelligently blend completions
        // For now, we'll return the longest completion as a simple form of blending
        return [completions.sort((a, b) => b.text.length - a.text.length)[0]];
      
      case CompletionCombineMode.Vote:
        // Group identical completions and return the most common one
        const completionGroups = new Map<string, AgentCompletion[]>();
        
        for (const completion of completions) {
          const text = completion.text;
          if (!completionGroups.has(text)) {
            completionGroups.set(text, []);
          }
          completionGroups.get(text)!.push(completion);
        }
        
        // Find the group with the most votes
        let mostVotes = 0;
        let mostVotedCompletion: AgentCompletion | null = null;
        
        for (const group of completionGroups.values()) {
          if (group.length > mostVotes) {
            mostVotes = group.length;
            mostVotedCompletion = group[0];
          }
        }
        
        return mostVotedCompletion ? [mostVotedCompletion] : [completions[0]];
      
      case CompletionCombineMode.Context:
        // In a real implementation, this would use context to select the best completion
        // For now, we'll just return the highest confidence completion
        return [completions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]];
      
      default:
        return [completions[0]];
    }
  }
  
  /**
   * Register a listener for mode changes
   */
  public onDidChangeMode(listener: (isEnabled: boolean) => void): vscode.Disposable {
    this.onDidChangeModeListeners.push(listener);
    
    return {
      dispose: () => {
        const index = this.onDidChangeModeListeners.indexOf(listener);
        if (index !== -1) {
          this.onDidChangeModeListeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Notify listeners of mode change
   */
  private notifyModeChange(): void {
    for (const listener of this.onDidChangeModeListeners) {
      listener(this.isCollaborativeModeEnabled);
    }
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }
}

/**
 * Create a collaborative completion provider
 */
export function createCollaborativeCompletionProvider(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  lmBridge: LMAPIBridge
): CollaborativeCompletionProvider {
  return new CollaborativeCompletionProvider(context, agentClient, lmBridge);
}
