import { ClaudeCodeCLIService, ClaudeCodeCLIMessage, ClaudeCodeCLIResponse } from './claude-code-cli.service';
export interface LocalLLMAdapter {
  // Implementation needed
}
  name: string;
  isAvailable() => Promise<boolean>;
  sendMessage(message: any) => Promise<any>;
}

export class ClaudeCodeCLIAdapter implements LocalLLMAdapter {
  // Implementation needed
}
  name = 'Claude Code CLI';
  private service: ClaudeCodeCLIService;
  constructor() {
  // Implementation needed
}
    this.service = new ClaudeCodeCLIService();
  }

  async isAvailable(): Promise<boolean> {
  // Implementation needed
}
    return await this.service.isClaudeCodeAvailable();
  }

  async sendMessage(message: {
  // Implementation needed
}
    text: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: any; metadata?: any }> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const claudeMessage: ClaudeCodeCLIMessage = {
  // Implementation needed
}
        prompt: message.text,
        context: message.systemPrompt,
        temperature: message.temperature,
        maxTokens: message.maxTokens
      };
      const response: ClaudeCodeCLIResponse = await this.service.sendMessage(claudeMessage);
      return {
  // Implementation needed
}
        text: response.content,
        usage: response.usage,
        metadata: {
  // Implementation needed
}
          ...response.metadata,
          provider: 'claude-code-cli',
          local: true
        }
      };
    } catch (error) {
  // Implementation needed
}
      throw new Error(`Claude Code CLI Error: ${error.message}`);
    }
  }

  async getVersion(): Promise<string> {
  // Implementation needed
}
    return await this.service.getVersion();
  }
}

// Singleton instance
export const claudeCodeCLIAdapter = new ClaudeCodeCLIAdapter();