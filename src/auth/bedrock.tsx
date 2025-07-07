import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BaseAIProvider, AIProviderConfig } from './ai-provider';

export interface BedrockConfig extends AIProviderConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  content: string;
  model: string;
}

export class AWSBedrockProvider extends BaseAIProvider {
  private readonly defaultModel = 'anthropic.claude-v2';
  private readonly models = ['anthropic.claude-v2', 'anthropic.claude-v1', 'anthropic.claude-instant-v1'];
  private readonly client: BedrockRuntimeClient;

  constructor(config: BedrockConfig) {
    super(config);
    this.client = new BedrockRuntimeClient({
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || ''
      }
    });
  }

  private formatMessage(message: BedrockMessage): string {
    return `${message.role}: ${message.content}`;
  }

  async chat(messages: BedrockMessage[]): Promise<BedrockResponse> {
    try {
      const bedrockMessages = messages.map(msg => this.formatMessage(msg));
      const prompt = bedrockMessages.join('\n');

      const command = new InvokeModelCommand({
        modelId: this.defaultModel,
        body: JSON.stringify({
          prompt,
          max_tokens_to_sample: 1000,
          temperature: 0.7,
          stop_sequences: ['\n\nHuman:', '\n\nAssistant:']
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        content: responseBody.completion,
        model: this.defaultModel
      };
    } catch (error) {
      throw new Error('Failed to chat with Bedrock: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async authenticate(): Promise<boolean> {
    return true;
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }]);
    return response.content;
  }

  async getDefaultModel(): Promise<string> {
    return this.defaultModel;
  }

  getModels(): string[] {
    return this.models;
  }
}

export { AWSBedrockProvider };