"""import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '../config/ConfigService';

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

export enum MessageType {
  CHAT = 'chat',
  COMMAND = 'command',
  STREAM = 'stream',
  STATUS = 'status',
  RESPONSE = 'response',
}

export enum Provider {
  LITELLM = 'litellm',
  OPENROUTER = 'openrouter',
}

export interface MessageContent {
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  name: string;
  model: string;
  apiKey: string;
  provider: Provider;
  metadata: AgentMetadata;
}

export interface AgentMetadata {
  description: string;
  capabilities: string[];
  personalityTraits: string[];
  communicationStyle: string;
  expertiseAreas: string[];
}

@Injectable()
export class MessageHandler extends EventEmitter {
  private readonly logger = new Logger(MessageHandler.name);
  private readonly maxMemoryMessages: number;
  private readonly agents: Map<string, AgentConfig>;
  private readonly conversationContexts: Map<string, MessageContent[]>;

  constructor(private readonly configService: ConfigService) {
    super();
    this.maxMemoryMessages = this.configService.get('MAX_MEMORY_MESSAGES') || 100;
    this.agents = new Map<string, AgentConfig>();
    this.conversationContexts = new Map<string, MessageContent[]>();
    this.initializeAgents();
    this.subscribeToMessages();
  }

  private initializeAgents(): void {
    const agentConfigs = this.configService.get('AGENTS');
    if (agentConfigs && Array.isArray(agentConfigs)) {
      for (const config of agentConfigs) {
        this.agents.set(config.name.toLowerCase(), this.createAgentConfig(config.name, config.model, config.apiKey));
      }
    }
  }

  private createAgentConfig(name: string, model: string, apiKey: string): AgentConfig {
    const metadata: AgentMetadata = {
        description: name === 'Cascade' 
        ? "Cascade is a knowledgeable and analytical AI assistant"
        : 'Cline is a creative and collaborative AI assistant',
        capabilities: [
            'Natural language understanding',
            'Context-aware responses',
            'Knowledge integration',
            'Collaborative problem-solving'
        ],
        personalityTraits: name === 'Cascade'
        ? ['Analytical and precise', 'Detail-oriented', 'Systematic', 'Logical']
        : ['Creative and intuitive', 'Big-picture focused', 'Adaptable', 'Imaginative'],
        communicationStyle: name === 'Cascade'
        ? "Clear and structured"
        : 'Engaging and conversational',
        expertiseAreas: name === 'Cascade'
        ? ['Data analysis', 'Technical documentation', 'System design', 'Process optimization']
        : ['Creative problem-solving', 'Brainstorming', 'Innovation', 'User experience']
    };
    return {
        name,
        model,
        apiKey,
        provider: Provider.OPENROUTER,
        metadata
    };
  }

  private subscribeToMessages(): void {
    this.on('message', (message: MessageContent) => {
      this.handleMessage(message);
    });
  }

  private async handleMessage(message: MessageContent): Promise<void> {
    try {
      this.logger.debug(`Handling message: ${message.content.substring(0, 100)}...`);
      const agentId = this.determineTargetAgent(message);
      this.addToConversationContext(agentId, message);
      await this.processMessage(message, agentId);
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.emit('error', error);
    }
  }

  private determineTargetAgent(message: MessageContent): string {
    if (message.metadata && message.metadata.targetAgent) {
      return message.metadata.targetAgent;
    }
    return message.role === MessageRole.SYSTEM ? 'cascade' : 'cline';
  }

  private addToConversationContext(agentId: string, message: MessageContent): void {
    if (!this.conversationContexts.has(agentId)) {
      this.conversationContexts.set(agentId, []);
    }
    const context = this.conversationContexts.get(agentId)!;
    context.push(message);
    if (context.length > this.maxMemoryMessages) {
      context.shift();
    }
  }

  private async processMessage(message: MessageContent, agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    try {
      const response = await this.callAgent(agent, message);
      const responseMessage: MessageContent = {
        role: MessageRole.ASSISTANT,
        content: response,
        timestamp: Date.now(),
        metadata: { agentId }
      };
      this.addToConversationContext(agentId, responseMessage);
      this.emit('response', responseMessage);
    } catch (error) {
      this.logger.error(`Error calling agent ${agentId}:`, error);
      throw error;
    }
  }

  private async callAgent(agent: AgentConfig, message: MessageContent): Promise<string> {
    if (!message.content || typeof message.content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    const context = this.conversationContexts.get(agent.name.toLowerCase()) || [];
    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt(agent.metadata)
      },
      ...context.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const requestBody = {
      model: agent.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    };

    const headers = {
      'Authorization': `Bearer ${agent.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://openrouter.ai/docs',
      'X-Title': 'The New Fuse Framework'
    };

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Unexpected API response format');
      }

      return responseData.choices[0].message.content;
    } catch (error) {
      this.logger.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  private buildSystemPrompt(metadata: AgentMetadata): string {
    return [
      `You are ${metadata.description}.`,
      `- Key traits: ${metadata.personalityTraits.join(', ')}`,
      `- Communication style: ${metadata.communicationStyle}`,
      `- Expertise areas: ${metadata.expertiseAreas.join(', ')}`,
      `- Capabilities: ${metadata.capabilities.join(', ')}`,
      'Please respond in character with your defined personality and expertise.'
    ].join('
');
  }

  public async sendMessage(content: string, toAgent: string, fromAgent?: string): Promise<void> {
    if (!content || typeof content !== 'string') {
        throw new Error('Message content must be a non-empty string');
    }

    if (!this.agents.has(toAgent.toLowerCase())) {
        throw new Error(`Invalid agent: ${toAgent}`);
    }

    const message: MessageContent = {
        role: MessageRole.USER,
        content,
        timestamp: Date.now(),
        metadata: {
            targetAgent: toAgent,
            sourceAgent: fromAgent,
        },
    };
    this.emit('message', message);
  }

  public getConversationContext(agentId: string): MessageContent[] {
    return this.conversationContexts.get(agentId) || [];
  }

  public clearConversationContext(agentId?: string): void {
    if (agentId) {
      this.conversationContexts.delete(agentId);
    } else {
      this.conversationContexts.clear();
    }
  }

  public getAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  public getAgentConfig(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }
}
""