import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LLMProviderManager, LLMProviderConfig } from './llm-provider-manager.js';

/**
 * Interface for language model request parameters
 */
export interface LMRequestParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  options?: Record<string, any>;
  llmProviderId?: string; // New field to explicitly specify a provider
}

/**
 * Interface for a language model response
 */
export interface LMResponse {
  text: string;
  provider: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Language model API providers
 */
export enum LMProvider {
  Mock = 'mock',
  Copilot = 'copilot',
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  HuggingFace = 'huggingface',
  Local = 'local'
}

/**
 * Bridge for language model integrations
 * 
 * This class provides a unified interface to various language model APIs
 */
export class LMAPIBridge {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private outputChannel: vscode.OutputChannel;
  private providerManager: LLMProviderManager;
  
  constructor(
    context: vscode.ExtensionContext, 
    agentClient: AgentClient, 
    providerManager: LLMProviderManager,
    outputChannel?: vscode.OutputChannel
  ) {
    this.context = context;
    this.agentClient = agentClient;
    this.providerManager = providerManager;
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('LM API Bridge');
    
    // Register as an agent
    this.agentClient.register('LM API Bridge', ['text-generation', 'lm-api'], '1.0.0')
      .then(() => {
        this.log('Registered as agent');
      })
      .catch(err => {
        this.log(`Error registering agent: ${err.message}`);
      });
    
    // Subscribe to relevant messages
    this.agentClient.subscribe(this.handleMessage.bind(this));
    
    // Register commands
    this.registerCommands();
    
    // Listen for provider changes
    this.providerManager.onProviderChanged((providerId) => {
      const provider = this.providerManager.getProvider(providerId);
      if (provider) {
        this.log(`LLM provider changed to: ${provider.name}`);
      }
    });
    
    this.log('LM API Bridge initialized');
  }
  
  /**
   * Register commands
   */
  private registerCommands() {
    // Register a command to generate text
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.lm.generate', async (params: LMRequestParams) => {
        return this.generateText(params);
      })
    );
  }
  
  /**
   * Handle incoming messages
   */
  private async handleMessage(message: any): Promise<void> {
    if (message.action === 'lm.generate') {
      try {
        const result = await this.generateText(message.payload);
        await this.agentClient.sendMessage(message.sender, 'lm.generateResponse', {
          requestId: message.payload.requestId,
          result
        });
      } catch (error) {
        await this.agentClient.sendMessage(message.sender, 'lm.generateResponse', {
          requestId: message.payload.requestId,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Generate text using the specified or default language model
   */
  async generateText(params: LMRequestParams): Promise<LMResponse> {
    let provider: LLMProviderConfig | undefined;
    
    if (params.llmProviderId) {
      // If a specific provider ID is specified, use it
      provider = this.providerManager.getProvider(params.llmProviderId);
      if (!provider) {
        this.log(`Provider with ID ${params.llmProviderId} not found, using default`);
      }
    }
    
    // If no provider was found by ID (or none specified), use the currently selected provider
    if (!provider) {
      provider = this.providerManager.getSelectedProvider();
    }
    
    // If we still don't have a provider, use mock provider
    if (!provider) {
      this.log('No provider available, using mock provider');
      return this.generateWithMockProvider(params);
    }
    
    this.log(`Generating text using provider: ${provider.name} (${provider.provider})`);
    
    try {
      switch (provider.provider) {
        case LMProvider.Copilot:
          return await this.generateWithCopilot(params, provider);
          
        case LMProvider.Anthropic:
          return await this.generateWithAnthropic(params, provider);
          
        case LMProvider.OpenAI:
          return await this.generateWithOpenAI(params, provider);
          
        case LMProvider.HuggingFace:
          return await this.generateWithHuggingFace(params, provider);
          
        case LMProvider.Local:
          return await this.generateWithLocalModel(params, provider);
          
        case LMProvider.Mock:
        default:
          return this.generateWithMockProvider(params);
      }
    } catch (error) {
      this.log(`Error generating text: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fall back to mock provider on error
      return this.generateWithMockProvider(params);
    }
  }
  
  /**
   * Generate text using GitHub Copilot
   */
  private async generateWithCopilot(
    params: LMRequestParams, 
    provider: LLMProviderConfig
  ): Promise<LMResponse> {
    // Check if Copilot is available
    const copilotExtension = vscode.extensions.all.find(ext => 
      ext.id === 'GitHub.copilot' || 
      ext.id === 'GitHub.copilot-chat'
    );
    
    if (!copilotExtension) {
      throw new Error('GitHub Copilot extension is not installed or not active');
    }
    
    try {
      // Try to use VS Code's built-in Copilot API
      const vscodeApiVersion = parseInt(process.versions.vscode.split('.')[0], 10);
      
      // VS Code 1.85+ (stable as of December 2023) supports built-in Copilot API
      if (vscodeApiVersion >= 1.85) {
        this.log('Using VS Code native Copilot API');
        
        // If github.copilot.generate command exists (VS Code 1.85+)
        try {
          // Try the GitHub Copilot extension - this might change with future versions
          const result = await vscode.commands.executeCommand('github.copilot.generate', {
            prompt: params.prompt,
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            systemPrompt: params.systemPrompt,
            stopSequences: params.stopSequences
          });
          
          if (result && typeof result === 'string') {
            return {
              text: result,
              provider: 'copilot',
              model: 'github-copilot'
            };
          }
        } catch (e) {
          this.log(`Error with github.copilot.generate: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Fall back to the chat-based approach
      try {
        this.log('Falling back to Copilot Chat API');
        
        const chatMessage = params.systemPrompt 
          ? `${params.systemPrompt}\n\n${params.prompt}`
          : params.prompt;
          
        const chatResult = await vscode.commands.executeCommand('github.copilot.chat', chatMessage);
        
        if (chatResult && typeof chatResult === 'string') {
          return {
            text: chatResult,
            provider: 'copilot',
            model: 'github-copilot'
          };
        }
      } catch (e) {
        this.log(`Error with github.copilot.chat: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // If all methods fail, throw an error
      throw new Error('Failed to generate with Copilot');
    } catch (error) {
      this.log(`Copilot generation error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate text using Anthropic
   */
  private async generateWithAnthropic(
    params: LMRequestParams, 
    provider: LLMProviderConfig
  ): Promise<LMResponse> {
    this.log(`Using Anthropic API with model: ${provider.modelName}`);
    
    if (!provider.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    try {
      // In a real implementation, we would use the Anthropic API
      // For now, we'll use a mock implementation
      const mockResult = this.generateWithMockProvider(params);
      mockResult.provider = 'anthropic';
      mockResult.model = provider.modelName;
      mockResult.text = `Note: This is a simulated ${provider.modelName} response.\n\n${mockResult.text}`;
      return mockResult;
    } catch (error) {
      this.log(`Anthropic API error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate text using OpenAI
   */
  private async generateWithOpenAI(
    params: LMRequestParams, 
    provider: LLMProviderConfig
  ): Promise<LMResponse> {
    this.log(`Using OpenAI API with model: ${provider.modelName}`);
    
    if (!provider.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    try {
      // In a real implementation, we would use the OpenAI API
      // For now, we'll use a mock implementation
      const mockResult = this.generateWithMockProvider(params);
      mockResult.provider = 'openai';
      mockResult.model = provider.modelName;
      mockResult.text = `Note: This is a simulated ${provider.modelName} response.\n\n${mockResult.text}`;
      return mockResult;
    } catch (error) {
      this.log(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate text using Hugging Face
   */
  private async generateWithHuggingFace(
    params: LMRequestParams, 
    provider: LLMProviderConfig
  ): Promise<LMResponse> {
    this.log(`Using HuggingFace API with model: ${provider.modelName}`);
    
    if (!provider.apiKey) {
      throw new Error('HuggingFace API key is required');
    }
    
    try {
      // In a real implementation, we would use the HuggingFace API
      // For now, we'll use a mock implementation
      const mockResult = this.generateWithMockProvider(params);
      mockResult.provider = 'huggingface';
      mockResult.model = provider.modelName;
      mockResult.text = `Note: This is a simulated ${provider.modelName} response.\n\n${mockResult.text}`;
      return mockResult;
    } catch (error) {
      this.log(`HuggingFace API error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate text using a local model
   */
  private async generateWithLocalModel(
    params: LMRequestParams, 
    provider: LLMProviderConfig
  ): Promise<LMResponse> {
    this.log(`Using local model: ${provider.modelName}`);
    
    try {
      // In a real implementation, we would call a local API
      // For now, we'll use a mock implementation
      const mockResult = this.generateWithMockProvider(params);
      mockResult.provider = 'local';
      mockResult.model = provider.modelName;
      mockResult.text = `Note: This is a simulated ${provider.modelName} local model response.\n\n${mockResult.text}`;
      return mockResult;
    } catch (error) {
      this.log(`Local model error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate text using a mock provider
   */
  private generateWithMockProvider(params: LMRequestParams): LMResponse {
    this.log('Using mock provider for text generation');
    
    // Create a simplistic response based on the prompt
    const promptLines = params.prompt.split('\n');
    const promptSummary = promptLines.length > 1 
      ? promptLines[0] + '...' 
      : params.prompt;
    
    // Generate deterministic but varied responses based on the prompt hash
    const promptHash = this.hashString(params.prompt);
    const responseOptions = [
      `Here's a response to your query about "${promptSummary}":\n\nBased on the information provided, I would suggest considering the following approach...\n\n1. First, analyze the requirements\n2. Then, design a solution\n3. Finally, implement step by step`,
      
      `Regarding "${promptSummary}":\n\nThere are several ways to address this. The most efficient would be to...\n\nConsider using a modular approach with these components:\n- Component A for handling input\n- Component B for processing\n- Component C for output formatting`,
      
      `I've analyzed your question about "${promptSummary}" and here's what I think:\n\nThe key insight is understanding the underlying patterns. I recommend:\n\n\`\`\`\nconst solution = analyzePattern(input);\nreturn optimize(solution);\n\`\`\`\n\nThis approach will give you the best results because it separates concerns and makes testing easier.`
    ];
    
    // Select a response based on prompt hash
    const selectedResponse = responseOptions[promptHash % responseOptions.length];
    
    return {
      text: selectedResponse,
      provider: 'mock',
      model: 'mock-model',
      usage: {
        promptTokens: params.prompt.length / 4,
        completionTokens: selectedResponse.length / 4,
        totalTokens: (params.prompt.length + selectedResponse.length) / 4
      },
      metadata: {
        temperature: params.temperature || 0.7,
        maxTokens: params.maxTokens || 500
      }
    };
  }
  
  /**
   * Simple hash function for a string
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get LLM configuration
   */
  getLLMConfig(): { provider: string; model: string } {
    const selectedProvider = this.providerManager.getSelectedProvider();
    return {
      provider: selectedProvider?.provider?.toString() || LMProvider.Mock,
      model: selectedProvider?.modelName || 'mock-model'
    };
  }
  
  /**
   * Call VS Code's LM API if available
   */
  async callVSCodeLM(params: LMRequestParams): Promise<string> {
    try {
      const vscodeResult = await this.generateWithCopilot(params, {
        id: 'vscode-copilot',
        name: 'GitHub Copilot',
        provider: LMProvider.Copilot,
        modelName: 'copilot'
      });
      return vscodeResult.text;
    } catch (error) {
      this.log(`Error calling VS Code LM: ${error instanceof Error ? error.message : String(error)}`);
      const fallbackResult = await this.generateText(params);
      return fallbackResult.text;
    }
  }
  
  /**
   * Call a language model
   */
  async callLM(params: LMRequestParams): Promise<string> {
    try {
      const result = await this.generateText(params);
      return result.text;
    } catch (error) {
      this.log(`Error calling LM: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Extract tool calls from a response (simplified placeholder)
   */
  extractToolCalls(response: string): any[] {
    // This would be a more sophisticated function in a real implementation
    // For now, just look for basic patterns
    const toolCallRegex = /\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{[^}]+\})\s*\}/g;
    const matches = [];
    let match;
    
    while ((match = toolCallRegex.exec(response)) !== null) {
      try {
        const tool = match[1];
        const paramsStr = match[2];
        const params = JSON.parse(paramsStr);
        
        matches.push({ tool, params });
      } catch (e) {
        this.log(`Error parsing tool call: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    return matches;
  }
  
  /**
   * Get model information
   */
  getModelInfo(modelId: string): any {
    // This would provide more detailed information in a real implementation
    const provider = this.providerManager.getAllProviders().find(p => p.modelName === modelId);
    
    if (provider) {
      return {
        id: provider.modelName,
        provider: provider.provider,
        contextWindow: provider.provider === LMProvider.OpenAI && provider.modelName.includes('gpt-4') ? 8192 :
                       provider.provider === LMProvider.OpenAI ? 4096 :
                       provider.provider === LMProvider.Anthropic ? 16384 :
                       provider.provider === LMProvider.Copilot ? 8192 : 2048,
        maxTokens: 1024,
        supportsFunctionCalling: provider.provider === LMProvider.OpenAI || provider.provider === LMProvider.Anthropic
      };
    }
    
    return {
      id: modelId,
      provider: 'unknown',
      contextWindow: 2048,
      maxTokens: 1024,
      supportsFunctionCalling: false
    };
  }
  
  /**
   * Validate a response (placeholder)
   */
  validateResponse(response: string): boolean {
    // This would be more sophisticated in a real implementation
    return !!response && response.length > 0;
  }
  
  /**
   * Handle errors
   */
  handleError(error: any): string {
    const message = error instanceof Error ? error.message : String(error);
    this.log(`Error in LM API: ${message}`);
    return `An error occurred: ${message}`;
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }
}

/**
 * Create an LM API Bridge
 */
export function createLMAPIBridge(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  providerManager: LLMProviderManager,
  outputChannel?: vscode.OutputChannel
): LMAPIBridge {
  return new LMAPIBridge(context, agentClient, providerManager, outputChannel);
}
