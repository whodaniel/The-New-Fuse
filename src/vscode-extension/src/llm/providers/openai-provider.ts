import { getLogger } from '../../core/logging.js';
import { LLMProvider, LLMProviderInfo, GenerateOptions } from '../../types.js';

/**
 * OpenAI LLM Provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private readonly logger = getLogger();
  private readonly apiKey: string;
  private readonly availableModels = [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ];
  private model = 'gpt-3.5-turbo';
  
  // Required properties by LLMProvider interface
  public readonly id: string = 'openai';
  public readonly name: string = 'OpenAI';
  
  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model && this.availableModels.includes(model)) {
      this.model = model;
    }
    this.logger.debug('OpenAI provider initialized');
  }
  
  public async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
  
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      
      this.logger.debug(`Sending prompt to OpenAI: ${prompt.substring(0, 50)}...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1000
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      this.logger.error('OpenAI generation failed', error);
      if (error.name === 'AbortError') {
        return 'Request timed out. Please try again.';
      }
      throw error;
    }
  }
  
  public async getInfo(): Promise<LLMProviderInfo> {
    return {
      id: this.id,
      name: this.name,
      version: '1.0.0',
      description: 'OpenAI ChatGPT and GPT-4 models',
      maxTokens: 8192, // Typical for GPT-3.5, adjust based on model
      isAvailable: await this.isAvailable(),
      models: this.availableModels,
      status: await this.isAvailable() ? 'available' : 'unavailable',
      metadata: {
        currentModel: this.model
      }
    };
  }
  
  public async setModel(modelId: string): Promise<boolean> {
    if (!this.availableModels.includes(modelId)) {
      return false;
    }
    
    this.model = modelId;
    return true;
  }
}