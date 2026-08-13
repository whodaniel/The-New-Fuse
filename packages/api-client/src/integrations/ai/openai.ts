import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

/**
 * OpenAI integration configuration
 */
export interface OpenAIConfig extends IntegrationConfig {
  apiKey?: string;
  organization?: string;
  model?: string; // Default model, e.g., 'gpt-4', 'gpt-3.5-turbo'
  defaultMaxTokens?: number;
  defaultTemperature?: number;
}

/**
 * OpenAI integration for accessing AI models like GPT
 */
export class OpenAIIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: OpenAIConfig;
  capabilities: {
    actions: string[];
    [key: string]: any;
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  private apiClient: ApiClient;

  constructor(config: OpenAIConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;

    // Default OpenAI capabilities
    this.capabilities = {
      actions: [
        'chat_completion',
        'completion', // Legacy completion endpoint
        'embedding',
        'list_models',
        // Add other actions like 'image_generation', 'moderation' if needed
      ],
      supportsWebhooks: false,
      supportsPolling: false,
    };

    // Create API client for OpenAI
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json',
      },
    };

    // Ensure headers are always defined before assignment
    apiConfig.headers = apiConfig.headers || {};

    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Bearer ${config.apiKey}`,
      };
    }
    // Add Organization header if provided
    if (config.organization) {
      apiConfig.headers['OpenAI-Organization'] = config.organization;
    }

    this.apiClient = new ApiClient(apiConfig);
  }

  /**
   * Connect to OpenAI API (verify API key)
   */
  async connect(): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('API key is required to connect to OpenAI.');
    }
    try {
      // Verify API key by making a test request (e.g., list models)
      await this.apiClient.get('/models');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error(`OpenAI connection error: ${(error instanceof Error ? error.message : String(error))}`, (error as any).response?.data);
      throw new Error(`Failed to connect to OpenAI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from OpenAI (no specific action needed, just update status)
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Execute an OpenAI action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
       // Allow connection attempt if not connected
       if (action === 'connect') {
        return this.connect();
      }
      throw new Error('Not connected to OpenAI. Call connect() first.');
    }

    switch (action) {
      case 'chat_completion':
        return this.createChatCompletion(
          params.model || this.config.model || 'gpt-3.5-turbo',
          params.messages,
          params.options // Includes temperature, max_tokens etc.
        );
      case 'completion': // Legacy
        return this.createCompletion(
          params.model || this.config.model || 'text-davinci-003', // Adjust default legacy model if needed
          params.prompt,
          params.options
        );
      case 'embedding':
        return this.createEmbedding(
          params.model || 'text-embedding-ada-002', // Default embedding model
          params.input
        );
      case 'list_models':
        return this.listModels();
      default:
        throw new Error(`Unsupported OpenAI action: ${action}`);
    }
  }

  /**
   * Create a chat completion
   */
  private async createChatCompletion(model: string, messages: any[], options?: Record<string, any>): Promise<any> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array must be provided for chat completion.');
    }

    const payload: Record<string, any> = {
      model,
      messages,
      max_tokens: options?.max_tokens || this.config.defaultMaxTokens,
      temperature: options?.temperature ?? this.config.defaultTemperature ?? 0.7, // Use provided, then config, then default
      ...options, // Spread other potential options like top_p, stream, etc.
    };
    // Remove undefined values to avoid sending them in the payload
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);


    try {
      return await this.apiClient.post('/chat/completions', payload);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`OpenAI chat completion error for model ${model}: ${error.message}`, (error as any).response?.data);
        throw new Error(`Failed to create chat completion: ${error.message}`);
      } else {
        console.error(`OpenAI chat completion error for model ${model}: ${String(error)}`, error);
        throw new Error(`Failed to create chat completion: ${String(error)}`);
      }
    }
  }

  /**
   * Create a legacy completion
   */
  private async createCompletion(model: string, prompt: string, options?: Record<string, any>): Promise<any> {
     if (!prompt) {
      throw new Error('Prompt must be provided for completion.');
    }
    const payload: Record<string, any> = {
      model,
      prompt,
      max_tokens: options?.max_tokens || this.config.defaultMaxTokens || 150, // Default for legacy completion
      temperature: options?.temperature ?? this.config.defaultTemperature ?? 0.7,
      ...options,
    };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      return await this.apiClient.post('/completions', payload);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`OpenAI completion error for model ${model}: ${error.message}`, (error as any).response?.data);
        throw new Error(`Failed to create completion: ${error.message}`);
      } else {
        console.error(`OpenAI completion error for model ${model}: ${String(error)}`, error);
        throw new Error(`Failed to create completion: ${String(error)}`);
      }
    }
  }

  /**
   * Create an embedding
   */
  private async createEmbedding(model: string, input: string | string[]): Promise<any> {
     if (!input) {
      throw new Error('Input must be provided for embedding.');
    }
    const payload = { model, input };

    try {
      return await this.apiClient.post('/embeddings', payload);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`OpenAI embedding error for model ${model}: ${error.message}`, (error as any).response?.data);
        throw new Error(`Failed to create embedding: ${error.message}`);
      } else {
        console.error(`OpenAI embedding error for model ${model}: ${String(error)}`, error);
        throw new Error(`Failed to create embedding: ${String(error)}`);
      }
    }
  }

   /**
   * List available models
   */
  private async listModels(): Promise<any> {
    try {
      return await this.apiClient.get('/models');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`OpenAI list models error: ${error.message}`, (error as any).response?.data);
        throw new Error(`Failed to list models: ${error.message}`);
      } else {
        console.error(`OpenAI list models error: ${String(error)}`, error);
        throw new Error(`Failed to list models: ${String(error)}`);
      }
    }
  }


  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      config: {
        model: this.config.model,
        organization: this.config.organization ? '******' : undefined, // Mask organization ID
        defaultMaxTokens: this.config.defaultMaxTokens,
        defaultTemperature: this.config.defaultTemperature,
        // Avoid exposing sensitive parts of config like API key
      },
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt,
    };
  }
}

/**
 * Create a new OpenAI integration
 */
export function createOpenAIIntegration(config: Partial<OpenAIConfig> = {}): OpenAIIntegration {
  const defaultConfig: OpenAIConfig = {
    id: 'openai',
    name: 'OpenAI',
    type: IntegrationType.AI,
    description: 'Access powerful AI models like GPT-4 and GPT-3.5 for various natural language tasks.',
    baseUrl: 'https://api.openai.com/v1',
    authType: AuthType.API_KEY,
    apiVersion: 'v1',
    docUrl: 'https://beta.openai.com/docs',
    logoUrl: 'https://openai.com/favicon.ico', // Placeholder, find official logo URL
    model: 'gpt-4', // Default to gpt-4
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
  };

  const finalConfig = {
    ...defaultConfig,
    ...config,
    id: config.id || defaultConfig.id, // Ensure id is always set
  };

  return new OpenAIIntegration(finalConfig);
}