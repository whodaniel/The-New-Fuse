import { getLogger } from '../../core/logging.js';
import { LLMProvider, LLMProviderInfo, GenerateOptions } from '../../types.js';

/**
 * Ollama LLM Provider implementation
 * Provides integration with locally running Ollama models
 */
export class OllamaProvider implements LLMProvider {
  private readonly logger = getLogger();
  private readonly availableModels = [
    'llama3',
    'llama3:8b',
    'llama3:70b',
    'codellama',
    'codellama:7b',
    'codellama:13b',
    'mistral',
    'mistral:7b',
    'mistral-openorca',
    'mixtral',
    'falcon'
  ];
  private model = 'llama3';
  private readonly baseUrl: string;
  
  // Required properties by LLMProvider interface
  public readonly id: string = 'ollama';
  public readonly name: string = 'Ollama';
  
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.logger.debug('Ollama provider initialized');
  }
  
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      return response.ok;
    } catch (error) {
      this.logger.error('Ollama availability check failed:', error);
      return false;
    }
  }
  
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      this.logger.debug(`Sending prompt to Ollama: ${prompt.substring(0, 50)}...`);
      
      // Check if Ollama is available
      if (!await this.isOllamaAvailable()) {
        return "Ollama is not available. Please make sure it's running on your machine.";
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 1000
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ollama API error: ${errorData || response.statusText}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      this.logger.error('Ollama generation failed', error);
      if (error.name === 'AbortError') {
        return 'Request timed out. Please try again.';
      }
      
      // Special case for network errors (likely Ollama not running)
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        return "Could not connect to Ollama. Please make sure it's running on your machine.";
      }
      
      throw error;
    }
  }
  
  public async getInfo(): Promise<LLMProviderInfo> {
    // Try to get actual models from Ollama
    const actualModels = await this.fetchAvailableModels();
    
    return {
      id: this.id,
      name: this.name,
      version: '1.0.0',
      description: 'Local LLM models via Ollama',
      maxTokens: 32000, // Typical context window for many Ollama models
      isAvailable: await this.isAvailable(),
      models: actualModels.length > 0 ? actualModels : this.availableModels,
      status: await this.isAvailable() ? 'available' : 'unavailable',
      metadata: {
        currentModel: this.model,
        baseUrl: this.baseUrl
      }
    };
  }
  
  public async setModel(modelId: string): Promise<boolean> {
    // Get available models
    const models = await this.fetchAvailableModels();
    
    if (models.length > 0 && !models.includes(modelId)) {
      return false;
    }
    
    this.model = modelId;
    return true;
  }
  
  /**
   * Check if Ollama is available
   */
  private async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      this.logger.warn('Ollama availability check failed', error);
      return false;
    }
  }
  
  /**
   * Fetch available models from Ollama
   */
  private async fetchAvailableModels(): Promise<string[]> {
    try {
      if (!await this.isOllamaAvailable()) {
        return [];
      }
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      this.logger.warn('Failed to fetch Ollama models', error);
      return [];
    }
  }
}