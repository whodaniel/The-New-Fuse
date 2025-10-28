import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptService } from './prompt.service';

@Injectable()
export class AgentLLMService {
  private readonly logger = new Logger(AgentLLMService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly promptService: PromptService,
  ) {}

  async generatePrompt(
    agentId: string,
    options: {
      includeConversationHistory?: boolean;
      includeMemory?: boolean;
      includeTools?: boolean;
    },
  ): Promise<string> {
    const agent = { id: agentId }; // Placeholder for fetching agent details
    const systemPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, 'system');
    const userPrompt = await this.promptService.getAgentTemplatesByPurpose(agent.id, 'user');

    let fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    if (options.includeConversationHistory) {
      // Placeholder for fetching conversation history
      fullPrompt += '\n\nConversation History:\n';
    }

    if (options.includeMemory) {
      // Placeholder for fetching relevant memories
      fullPrompt += '\n\nRelevant Memories:\n';
    }

    if (options.includeTools) {
      // Placeholder for fetching available tools
      fullPrompt += '\n\nAvailable Tools:\n';
    }

    return fullPrompt;
  }
}
