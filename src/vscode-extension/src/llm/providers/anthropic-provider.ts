import { getLogger } from '../../core/logging.js';
import { LLMProvider, LLMProviderInfo, GenerateOptions } from '../../types.js';

/**
 * Anthropic Claude LLM Provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  private readonly logger = getLogger();
  private readonly apiKey: string;
  private readonly availableModels = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ];
  private model = 'claude-3-sonnet-20240229';
  
  // Required properties by LLMProvider interface
  public readonly id: string = 'anthropic';
  public readonly name: string = 'Anthropic Claude';
  
  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model && this.availableModels.includes(model)) {
      this.model = model;
    }
    this.logger.debug('Anthropic provider initialized');
  }
  
  public async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
  
  public async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      
      this.logger.debug(`Sending prompt to Anthropic: ${prompt.substring(0, 50)}...`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: options?.maxTokens ?? 1000,
          temperature: options?.temperature ?? 0.7
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      this.logger.error('Anthropic generation failed', error);
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
      description: 'Anthropic Claude models',
      maxTokens: 100000, // Maximum tokens supported
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
  
  /**
   * Parses XML function call output from Claude
   * Used for MCP tools integration
   */
  public parseXmlFunctionCall(content: string): { name: string; arguments: Record<string, any> } | null {
    try {
      // Extract XML function call tags
      const functionCallMatch = content.match(/<function_call>\s*([\s\S]*?)\s*<\/function_call>/);
      if (!functionCallMatch) return null;
      
      const functionCallContent = functionCallMatch[1];
      
      // FIXED: Both opening and closing tags now properly match as 'name'
      const nameMatch = functionCallContent.match(/<name>\s*(.*?)\s*<\/name>/);
      if (!nameMatch) return null;
      
      const name = nameMatch[1];
      
      // Extract arguments
      const argsMatch = functionCallContent.match(/<arguments>\s*([\s\S]*?)\s*<\/arguments>/);
      if (!argsMatch) {
        return { name, arguments: {} };
      }
      
      // Try to parse arguments as JSON
      try {
        const args = JSON.parse(argsMatch[1]);
        return { name, arguments: args };
      } catch (jsonError) {
        this.logger.error('Failed to parse function call arguments as JSON', jsonError);
        return { name, arguments: { raw: argsMatch[1] } };
      }
    } catch (error) {
      this.logger.error('Failed to parse XML function call', error);
      return null;
    }
  }
}