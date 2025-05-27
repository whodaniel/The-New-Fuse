import * as vscode from 'vscode';
import { getLogger } from '../../core/logging.js';
import { LLMProvider, LLMProviderInfo, GenerateOptions } from '../../types.js';

/**
 * VS Code LLM Provider implementation
 * Uses VS Code's built-in language model features
 */
export class VSCodeLLMProvider implements LLMProvider {
  private readonly logger = getLogger();
  private readonly context: vscode.ExtensionContext;
  
  // Required properties by LLMProvider interface
  public readonly id: string = 'vscode';
  public readonly name: string = 'VS Code';
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.logger.debug('VS Code LLM provider initialized');
  }
  
  public async isAvailable(): Promise<boolean> {
    return !!this.getChatRequestApi();
  }
  
  public async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    try {
      this.logger.debug(`Sending prompt to VS Code LLM: ${prompt.substring(0, 50)}...`);
      
      // Check if the chatRequestApi is available
      const chatApi = this.getChatRequestApi();
      if (!chatApi) {
        return "VS Code Chat API is not available in this version of VS Code.";
      }
      
      // Create progress notification
      const response = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating response...',
        cancellable: true
      }, async (progress, token) => {
        // Prepare the request
        // Using any type here since vscode.ChatRequest's shape can change between versions
        const request: any = {
          prompt: prompt,
          command: 'thefuse.chat',
          model: undefined, // Let VS Code select the default model
          references: [],
          toolReferences: [],
          toolInvocationToken: undefined
        };
        
        // Add response handler
        let responseText = '';
        const responsePromise = new Promise<string>((resolve) => {
          chatApi.requestChatResponse(request, {
            onResponse: (response) => {
              responseText += response.content;
              progress.report({ message: `Received ${responseText.length} characters` });
            },
            onComplete: () => {
              resolve(responseText);
            },
            onError: (error) => {
              this.logger.error('VS Code Chat API error', error);
              resolve(`Error: ${error.message || 'Unknown error'}`);
            }
          }, token);
        });
        
        return responsePromise;
      });
      
      return response;
    } catch (error) {
      this.logger.error('VS Code LLM generation failed', error);
      throw error;
    }
  }
  
  public async getInfo(): Promise<LLMProviderInfo> {
    return {
      id: this.id,
      name: this.name,
      version: '1.0.0',
      description: 'VS Code built-in language model integration',
      maxTokens: 10000, // Approximate value, may vary based on VS Code's implementation
      isAvailable: await this.isAvailable(),
      models: ['default'],
      status: await this.isAvailable() ? 'available' : 'unavailable',
      metadata: {
        currentModel: 'default'
      }
    };
  }
  
  public async setModel(_modelId: string): Promise<boolean> {
    // VS Code LLM doesn't support changing models
    return false;
  }
  
  /**
   * Get VS Code Chat API if available
   */
  private getChatRequestApi(): any | undefined {
    try {
      // Check if the requestChatAccess API exists
      if (!vscode.chat) {
        this.logger.warn('VS Code Chat API not available');
        return undefined;
      }
      
      // Get the API
      return vscode.chat;
    } catch (error) {
      this.logger.error('Failed to get VS Code Chat API', error);
      return undefined;
    }
  }
}