import { ClaudeCodeCLIService, ClaudeCodeCLIMessage, ClaudeCodeCLIResponse } from './claude-code-cli.service';

export interface LocalLLMAdapter {
  name: string;
  isAvailable: () => Promise<boolean>;
  sendMessage: (message: any) => Promise<any>;
}

export class ClaudeCodeCLIAdapter implements LocalLLMAdapter {
  name = 'Claude Code CLI';
  private service: ClaudeCodeCLIService;

  constructor() {
    this.service = new ClaudeCodeCLIService();
  }

  async isAvailable(): Promise<boolean> {
    return await this.service.isClaudeCodeAvailable();
  }

  async sendMessage(message: {
    text: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: any; metadata?: any }> {
    try {
      const claudeMessage: ClaudeCodeCLIMessage = {
        prompt: message.text,
        context: message.systemPrompt,
        temperature: message.temperature,
        maxTokens: message.maxTokens
      };

      const response: ClaudeCodeCLIResponse = await this.service.sendMessage(claudeMessage);

      return {
        text: response.content,
        usage: response.usage,
        metadata: {
          ...response.metadata,
          provider: 'claude-code-cli',
          local: true
        }
      };
    } catch (error) {
      throw new Error(`Claude Code CLI Error: ${error.message}`);
    }
  }

  async getVersion(): Promise<string> {
    return await this.service.getVersion();
  }
}

// Singleton instance
export const claudeCodeCLIAdapter = new ClaudeCodeCLIAdapter();