// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

/**
 * Hugging Face integration configuration
 */
export interface HuggingFaceConfig extends IntegrationConfig {
  apiKey?: string;
  model?: string; // Default model to use
  useInferenceEndpoint?: boolean; // Flag to use specific inference endpoints
}

/**
 * Hugging Face integration for accessing AI models
 */
export class HuggingFaceIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: HuggingFaceConfig;
  capabilities: {
    actions: string[];
    [key: string]: any;
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  private apiClient: ApiClient;

  constructor(config: HuggingFaceConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;

    // Default Hugging Face capabilities
    this.capabilities = {
      actions: [
        'inference', // Generic inference action
        'list_models',
        'get_model_details',
        // Add specific task actions if needed, e.g., 'text_generation', 'summarization'
      ],
      supportsWebhooks: false, // Typically no webhook support for inference
      supportsPolling: false,
    };

    // Create API client for Hugging Face
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || 'https://api-inference.huggingface.co', // Default inference API base URL
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json',
      },
    };

    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Bearer ${config.apiKey}`,
      };
    }

    this.apiClient = new ApiClient(apiConfig);
  }

  /**
   * Connect to Hugging Face API (verify API key)
   */
  async connect(): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('API key is required to connect to Hugging Face.');
    }
    try {
      // Verify API key by making a test request (e.g., list models if available, or a simple inference)
      // Using a simple model inference as a test
      await this.apiClient.post(`/models/${this.config.model || 'gpt2'}`, { inputs: 'test' });
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      // Log the specific error for debugging
      console.error(`Hugging Face connection error: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to connect to Hugging Face: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from Hugging Face (no specific action needed, just update status)
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Execute a Hugging Face action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      // Allow connection attempt if not connected
      if (action === 'connect') {
        return this.connect();
      }
      throw new Error('Not connected to Hugging Face. Call connect() first.');
    }

    switch (action) {
      case 'inference':
        return this.runInference(params.model || this.config.model, params.inputs, params.options);
      case 'list_models':
        // Note: Hugging Face Hub API for listing models might require a different endpoint/client setup
        throw new Error('Listing models via API is not directly supported by the inference client. Use Hugging Face Hub libraries or website.');
      case 'get_model_details':
        // Note: Similar to listing models, requires Hub interaction.
        throw new Error('Getting model details via API is not directly supported by the inference client. Use Hugging Face Hub libraries or website.');
      default:
        throw new Error(`Unsupported Hugging Face action: ${action}`);
    }
  }

  /**
   * Run inference on a specified model
   */
  private async runInference(model: string, inputs: any, options?: Record<string, any>): Promise<any> {
    if (!model) {
      throw new Error('Model ID must be provided for inference.');
    }
    if (!inputs) {
      throw new Error('Input data must be provided for inference.');
    }

    const endpoint = this.config.useInferenceEndpoint ? `/models/${model}` : `/pipeline/${model}`; // Adjust based on API structure if needed
    const payload = { inputs, options };

    try {
      return await this.apiClient.post(endpoint, payload);
    } catch (error) {
      console.error(`Hugging Face inference error for model ${model}: ${error instanceof Error ? error.message : String(error)}`, (error as any)?.response?.data);
      throw new Error(`Failed to run inference on model ${model}: ${error instanceof Error ? error.message : String(error)}`);
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
        useInferenceEndpoint: this.config.useInferenceEndpoint,
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
 * Create a new Hugging Face integration
 */
export function createHuggingFaceIntegration(config: Partial<HuggingFaceConfig> = {}): HuggingFaceIntegration {
  const defaultConfig: HuggingFaceConfig = {
    id: 'huggingface',
    name: 'Hugging Face',
    type: IntegrationType.AI,
    description: 'Access a vast collection of AI models for various tasks via the Hugging Face Inference API.',
    baseUrl: 'https://api-inference.huggingface.co',
    authType: AuthType.API_KEY,
    apiVersion: 'v1', // Inference API doesn't have explicit versioning like this, but good for consistency
    docUrl: 'https://huggingface.co/docs/api-inference/index',
    logoUrl: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg',
    useInferenceEndpoint: true, // Default to using model-specific inference endpoints
  };

  // Ensure required config fields like id are present
  const finalConfig = {
    ...defaultConfig,
    ...config,
    id: config.id || defaultConfig.id, // Ensure id is always set
  };

  return new HuggingFaceIntegration(finalConfig);
}