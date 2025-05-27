import * as vscode from 'vscode';

/**
 * VSCodeCopilotProvider provides an interface for interacting with
 * GitHub Copilot's VS Code extension features.
 */
export class VSCodeCopilotProvider {
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private isAvailable: boolean = false;

  constructor(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('VS Code Copilot Provider');
    
    // Check availability
    this.checkAvailability().then(available => {
      this.isAvailable = available;
      this.log(`GitHub Copilot availability: ${available ? 'Available' : 'Not available'}`);
    });
  }

  /**
   * Check if GitHub Copilot is available in the current VS Code instance
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Check if Copilot extension is installed
      const extensions = vscode.extensions.all;
      const copilotExtension = extensions.find(ext => 
        ext.id === 'GitHub.copilot' || 
        ext.id === 'GitHub.copilot-chat'
      );
      
      if (!copilotExtension) {
        this.log('GitHub Copilot extension not found');
        return false;
      }
      
      // Try to execute a Copilot command to check if it's active
      try {
        this.log('Testing Copilot command...');
        await vscode.commands.executeCommand('github.copilot.generate', { prompt: 'test' });
        this.log('Copilot generate command successful');
        return true;
      } catch (e) {
        this.log(`Could not execute copilot.generate command: ${e instanceof Error ? e.message : String(e)}`);
        
        // Try the chat command instead
        try {
          await vscode.commands.executeCommand('github.copilot.chat', 'test');
          this.log('Copilot chat command successful');
          return true;
        } catch (e) {
          this.log(`Could not execute copilot.chat command: ${e instanceof Error ? e.message : String(e)}`);
          
          // Check if the extension is active but commands aren't ready
          if (copilotExtension.isActive) {
            this.log('Copilot extension is active but commands are unavailable');
            return true;
          }
          
          return false;
        }
      }
    } catch (err) {
      this.log(`Error checking Copilot availability: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Generate text using VS Code Copilot
   */
  async generateText(options: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  }): Promise<string> {
    if (!await this.checkAvailability()) {
      throw new Error('GitHub Copilot is not available');
    }
    
    this.log(`Generating text with Copilot: "${options.prompt.substring(0, 50)}..."`);
    
    // Try different methods based on what's available
    
    // Method 1: Try the generate command (VS Code 1.85+)
    try {
      const result = await vscode.commands.executeCommand('github.copilot.generate', {
        prompt: options.prompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        stopSequences: options.stopSequences
      });
      
      if (result && typeof result === 'string') {
        this.log('Successfully generated text with copilot.generate');
        return result;
      }
    } catch (e) {
      this.log(`Error with copilot.generate: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Method 2: Try the chat command
    try {
      const chatMessage = options.systemPrompt 
        ? `${options.systemPrompt}\n\n${options.prompt}`
        : options.prompt;
        
      const result = await vscode.commands.executeCommand('github.copilot.chat', chatMessage);
      
      if (result && typeof result === 'string') {
        this.log('Successfully generated text with copilot.chat');
        return result;
      }
    } catch (e) {
      this.log(`Error with copilot.chat: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Method 3: Try to use the ghost text feature indirectly (not implemented)
    
    throw new Error('Could not generate text with GitHub Copilot');
  }

  /**
   * Get Copilot configuration
   */
  async getConfig(): Promise<any> {
    try {
      const config = vscode.workspace.getConfiguration('github.copilot');
      return {
        enabled: config.get('enable', true),
        inlineSuggestEnabled: config.get('inlineSuggest.enable', true),
        ghostTextEnabled: config.get('ghostText.enable', true)
      };
    } catch (e) {
      this.log(`Error getting Copilot config: ${e instanceof Error ? e.message : String(e)}`);
      return {
        enabled: true,
        inlineSuggestEnabled: true,
        ghostTextEnabled: true
      };
    }
  }

  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }
}