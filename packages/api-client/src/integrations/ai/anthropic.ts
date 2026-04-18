import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

/**
 * Anthropic API configuration
 */
export interface AnthropicConfig extends IntegrationConfig {
  apiKey?: string;
  model?: string; // Default model, e.g., 'claude-3-opus-20240229'
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  defaultTopP?: number;
  defaultTopK?: number;
  anthropicVersion?: string; // Specific Anthropic API version header
}

/**
 * Anthropic integration for AI capabilities (Claude models)
 */
export class AnthropicIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: AnthropicConfig;
  capabilities: {
    actions: string[];
    [key: string]: any; // Allow for additional capability flags
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  private apiClient: ApiClient;

  constructor(config: AnthropicConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;

    // Default Anthropic capabilities
    this.capabilities = {
      actions: [
        'chat_completion', // Using Anthropic's messages endpoint
        // 'completion', // Could add legacy completion if needed
        'list_models', // Assuming an endpoint exists or can be simulated
        // 'get_model' // Can be derived from list_models
      ],
      supportsWebhooks: false,
      supportsPolling: false,
    };

    // Create API client for Anthropic
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || 'https://api.anthropic.com/v1',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json',
        'anthropic-version': config.anthropicVersion || '2023-06-01', // Use configured or default version
      }
    };

    // Add API key header if provided
    if (apiConfig.headers) {
      apiConfig.headers['x-api-key'] = config.apiKey || '';
    }

    this.apiClient = new ApiClient(apiConfig);
  }

  /**
   * Connect to Anthropic API (verify API key)
   */
  async connect(): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('API key (x-api-key) is required to connect to Anthropic.');
    }
    try {
      // Verify API key by making a test request.
      // Anthropic doesn't have a simple /models endpoint like OpenAI.
      // We can try a minimal message request to a known cheap/fast model.
      await this.apiClient.post('/messages', {
          model: this.config.model || 'claude-3-haiku-20240307', // Use a fast model for testing
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 1,
      });
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      throw new Error(`Anthropic connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from Anthropic API (no specific action needed, just update status)
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Execute an Anthropic action
   */
  async execute(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.isConnected) {
       // Allow connection attempt if not connected
       if (action === 'connect') {
        return this.connect();
      }
      throw new Error('Not connected to Anthropic. Call connect() first.');
    }

    switch (action) {
      case 'chat_completion':
        return this.createChatCompletion(
          params.model || this.config.model,
          params.messages,
          params.system, // Anthropic supports a top-level system prompt
          params.options // Includes max_tokens, temperature, etc.
        );
      case 'list_models':
        // Anthropic doesn't have a public API endpoint for listing models.
        // We can return a hardcoded list of known major models or throw an error.
        return this.listKnownModels();
      // case 'get_model': // Can be implemented by filtering listKnownModels
      //   const knownModels = this.listKnownModels();
      //   const model = knownModels.find(m => m.id === params.modelId);
      //   if (!model) throw new Error(`Model ${params.modelId} not found or not supported.`);
      //   return model;
      default:
        throw new Error(`Unsupported Anthropic action: ${action}`);
    }
  }

  /**
   * Create a chat completion using the Messages API
   */
  private async createChatCompletion(
      model: string,
      messages: Array<{ role: 'user' | 'assistant'; content: string | any[] }>, // Content can be complex for vision
      system?: string,
      options?: Record<string, any>
    ): Promise<any> {
    if (!model) {
      throw new Error('Model must be provided for chat completion.');
    }
    if (!messages || messages.length === 0) {
      throw new Error('Messages array must be provided for chat completion.');
    }

    // Basic validation for message format
    if (!messages.every(msg => ['user', 'assistant'].includes(msg.role) && msg.content)) {
        throw new Error('Invalid message format. Each message must have a role ("user" or "assistant") and content.');
    }
    // Anthropic requires alternating user/assistant messages, starting with user
    if (messages[0].role !== 'user') {
        throw new Error('First message must be from the "user" role.');
    }
    for (let i = 1; i < messages.length; i++) {
        if (messages[i].role === messages[i-1].role) {
            throw new Error(`Messages must alternate between "user" and "assistant" roles. Found consecutive ${messages[i].role} roles.`);
        }
    }


    const payload: Record<string, any> = {
      model,
      messages,
      max_tokens: options?.max_tokens || this.config.defaultMaxTokens || 1024,
      temperature: options?.temperature ?? this.config.defaultTemperature ?? 0.7,
      top_p: options?.top_p ?? this.config.defaultTopP,
      top_k: options?.top_k ?? this.config.defaultTopK,
      stream: options?.stream ?? false,
      // Add other supported options
    };

    if (system) {
      payload.system = system;
    }

    // Remove undefined values to avoid sending them in the payload
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      // Note: If streaming is enabled, the response handling will differ.
      // ApiClient might need adjustments to handle streaming responses.
      return await this.apiClient.post('/messages', payload);
    } catch (error) {
      console.error(`Anthropic chat completion error for model ${model}: ${error instanceof Error ? error.message : String(error)}`, (error as any)?.response?.data);
      const errorDetails = (error as any)?.response?.data?.error;
      const errorMessage = errorDetails ? `${errorDetails.type}: ${errorDetails.message}` : (error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create Anthropic chat completion: ${errorMessage}`);
    }
  }

   /**
   * List known Anthropic models (as there's no API endpoint)
   */
  private listKnownModels(): Array<{ id: string; name: string; description: string; context_length?: number }> {
      // This list should be updated periodically based on Anthropic's documentation
      return [
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model for complex tasks.', context_length: 200000 },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced model for performance and speed.', context_length: 200000 },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest and most compact model.', context_length: 200000 },
          { id: 'claude-2.1', name: 'Claude 2.1', description: 'Previous generation model with 200K context.', context_length: 200000 },
          { id: 'claude-2.0', name: 'Claude 2.0', description: 'Previous generation model with 100K context.', context_length: 100000 },
          { id: 'claude-instant-1.2', name: 'Claude Instant 1.2', description: 'Faster, lower-priced previous generation model.', context_length: 100000 },
      ];
  }


  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    // Basic metadata, potentially enhance with model list if needed
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      config: {
        model: this.config.model,
        anthropicVersion: this.config.anthropicVersion || '2023-06-01',
        defaultMaxTokens: this.config.defaultMaxTokens,
        defaultTemperature: this.config.defaultTemperature,
        // Avoid exposing sensitive parts like API key
      },
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt,
      // Optionally add known models directly to metadata
      // knownModels: this.listKnownModels(),
    };
  }
}

/**
 * Create a new Anthropic integration
 */
export function createAnthropicIntegration(config: Partial<AnthropicConfig> = {}): AnthropicIntegration {
  const defaultConfig: AnthropicConfig = {
    id: 'anthropic',
    name: 'Anthropic',
    type: IntegrationType.AI,
    description: 'Access Anthropic\'s Claude family of AI models.',
    baseUrl: 'https://api.anthropic.com/v1',
    authType: AuthType.API_KEY, // Uses x-api-key header
    apiVersion: 'v1', // API base path version
    anthropicVersion: '2023-06-01', // Specific header version
    model: 'claude-3-sonnet-20240229', // Default to Sonnet
    defaultMaxTokens: 4096, // Anthropic's max_tokens default is higher, but setting a reasonable one
    defaultTemperature: 0.7,
    docUrl: 'https://docs.anthropic.com/claude/reference/messages_post',
    logoUrl: 'https://logo.clearbit.com/anthropic.com', // Found via Clearbit
  };

  const finalConfig = {
    ...defaultConfig,
    ...config,
    id: config.id || defaultConfig.id, // Ensure id is always set
    // Ensure headers in config don't overwrite essential ones unless intended
    defaultHeaders: {
        ...defaultConfig.defaultHeaders,
        ...config.defaultHeaders,
    }
  };

  // Ensure API key isn't accidentally placed in defaultHeaders
  if (finalConfig.defaultHeaders && finalConfig.defaultHeaders['x-api-key']) {
      if (!finalConfig.apiKey) {
          finalConfig.apiKey = finalConfig.defaultHeaders['x-api-key'];
      }
      delete finalConfig.defaultHeaders['x-api-key'];
  }
   if (finalConfig.defaultHeaders && finalConfig.defaultHeaders['anthropic-version']) {
      if (!finalConfig.anthropicVersion) {
          finalConfig.anthropicVersion = finalConfig.defaultHeaders['anthropic-version'];
      }
      delete finalConfig.defaultHeaders['anthropic-version'];
  }


  return new AnthropicIntegration(finalConfig);
}