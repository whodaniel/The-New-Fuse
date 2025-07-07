import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from './config/ConfigService';
import { AxiosError } from 'axios';

const bridgeConfig = {
  type: 'redis',
  host: 'localhost',
  port: 6379
};

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function'
}

export enum MessageType {
  CHAT = 'chat',
  COMMAND = 'command',
  STREAM = 'stream',
  STATUS = 'status',
  RESPONSE = 'response'
}

export enum Provider {
  LITELLM = 'litellm',
  OPENROUTER = 'openrouter'
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
    
    // Initialize configuration using ConfigService
    const cascadeApiKey = this.configService.getCascadeApiKey() || '';
    const clineApiKey = this.configService.getClineApiKey() || '';
    
    this.agents = new Map([
      ['cascade', this.createAgentConfig(
        'Cascade',
        this.configService.getCascadeModel(),
        cascadeApiKey
      )],
      ['cline', this.createAgentConfig(
        'Cline',
        this.configService.getClineModel(),
        clineApiKey
      )]
    ]);

    this.maxMemoryMessages = this.configService.getMaxMemoryMessages();
    this.conversationContexts = new Map();
    
    this.subscribeToMessages();
    this.logger.log('MessageHandler initialized');
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
      
      // Add message to conversation context
      const agentId = this.determineTargetAgent(message);
      this.addToConversationContext(agentId, message);
      
      // Process the message
      await this.processMessage(message, agentId);
      
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.emit('error', error);
    }
  }

  private determineTargetAgent(message: MessageContent): string {
    // Simple routing logic - can be enhanced with more sophisticated routing
    if (message.metadata?.targetAgent) {
      return message.metadata.targetAgent;
    }
    
    // Default to cascade for system messages, cline for user messages
    return message.role === MessageRole.SYSTEM ? 'cascade' : 'cline';
  }

  private addToConversationContext(agentId: string, message: MessageContent): void {
    if (!this.conversationContexts.has(agentId)) {
      this.conversationContexts.set(agentId, []);
    }
    
    const context = this.conversationContexts.get(agentId)!;
    context.push(message);
    
    // Maintain memory limit
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
      
      // Add response to conversation context
      const responseMessage: MessageContent = {
        role: MessageRole.ASSISTANT,
        content: response,
        timestamp: Date.now(),
        metadata: { agentId }
      };
      
      this.addToConversationContext(agentId, responseMessage);
      
      // Emit response
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
    
    // Build conversation history
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
      
      if (!responseData.choices?.length) {
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
    ].join('\n');
  }

  async sendMessage(content: string, toAgent: string, fromAgent?: string): Promise<void> {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content must be a non-empty string');
    }

    if (!this.agents.has(toAgent)) {
      throw new Error(`Invalid agent: ${toAgent}`);
    }

    const message: MessageContent = {
      role: MessageRole.USER,
      content,
      timestamp: Date.now(),
      metadata: {
        targetAgent: toAgent,
        sourceAgent: fromAgent
      }
    };

    this.emit('message', message);
  }

  getConversationContext(agentId: string): MessageContent[] {
    return this.conversationContexts.get(agentId) || [];
  }

  clearConversationContext(agentId?: string): void {
    if (agentId) {
      this.conversationContexts.delete(agentId);
    } else {
      this.conversationContexts.clear();
    }
  }

  getAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  getAgentConfig(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }
}