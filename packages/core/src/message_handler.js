var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageHandler_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from './config/ConfigService';
const bridgeConfig = {
    type: 'redis',
    host: 'localhost',
    port: 6379
};
export var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["FUNCTION"] = "function";
})(MessageRole || (MessageRole = {}));
export var MessageType;
(function (MessageType) {
    MessageType["CHAT"] = "chat";
    MessageType["COMMAND"] = "command";
    MessageType["STREAM"] = "stream";
    MessageType["STATUS"] = "status";
    MessageType["RESPONSE"] = "response";
})(MessageType || (MessageType = {}));
export var Provider;
(function (Provider) {
    Provider["LITELLM"] = "litellm";
    Provider["OPENROUTER"] = "openrouter";
})(Provider || (Provider = {}));
let MessageHandler = MessageHandler_1 = class MessageHandler extends EventEmitter {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new Logger(MessageHandler_1.name);
        // Initialize configuration using ConfigService
        const cascadeApiKey = this.configService.getCascadeApiKey() || '';
        const clineApiKey = this.configService.getClineApiKey() || '';
        this.agents = new Map([
            ['cascade', this.createAgentConfig('Cascade', this.configService.getCascadeModel(), cascadeApiKey)],
            ['cline', this.createAgentConfig('Cline', this.configService.getClineModel(), clineApiKey)]
        ]);
        this.maxMemoryMessages = this.configService.getMaxMemoryMessages();
        this.conversationContexts = new Map();
        this.subscribeToMessages();
        this.logger.log('MessageHandler initialized');
    }
    createAgentConfig(name, model, apiKey) {
        const metadata = {
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
    subscribeToMessages() {
        this.on('message', (message) => {
            this.handleMessage(message);
        });
    }
    async handleMessage(message) {
        try {
            this.logger.debug(`Handling message: ${message.content.substring(0, 100)}...`);
            // Add message to conversation context
            const agentId = this.determineTargetAgent(message);
            this.addToConversationContext(agentId, message);
            // Process the message
            await this.processMessage(message, agentId);
        }
        catch (error) {
            this.logger.error('Error handling message:', error);
            this.emit('error', error);
        }
    }
    determineTargetAgent(message) {
        // Simple routing logic - can be enhanced with more sophisticated routing
        if (message.metadata?.targetAgent) {
            return message.metadata.targetAgent;
        }
        // Default to cascade for system messages, cline for user messages
        return message.role === MessageRole.SYSTEM ? 'cascade' : 'cline';
    }
    addToConversationContext(agentId, message) {
        if (!this.conversationContexts.has(agentId)) {
            this.conversationContexts.set(agentId, []);
        }
        const context = this.conversationContexts.get(agentId);
        context.push(message);
        // Maintain memory limit
        if (context.length > this.maxMemoryMessages) {
            context.shift();
        }
    }
    async processMessage(message, agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        try {
            const response = await this.callAgent(agent, message);
            // Add response to conversation context
            const responseMessage = {
                role: MessageRole.ASSISTANT,
                content: response,
                timestamp: Date.now(),
                metadata: { agentId }
            };
            this.addToConversationContext(agentId, responseMessage);
            // Emit response
            this.emit('response', responseMessage);
        }
        catch (error) {
            this.logger.error(`Error calling agent ${agentId}:`, error);
            throw error;
        }
    }
    async callAgent(agent, message) {
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
        }
        catch (error) {
            this.logger.error('Error calling OpenRouter API:', error);
            throw error;
        }
    }
    buildSystemPrompt(metadata) {
        return [
            `You are ${metadata.description}.`,
            `- Key traits: ${metadata.personalityTraits.join(', ')}`,
            `- Communication style: ${metadata.communicationStyle}`,
            `- Expertise areas: ${metadata.expertiseAreas.join(', ')}`,
            `- Capabilities: ${metadata.capabilities.join(', ')}`,
            'Please respond in character with your defined personality and expertise.'
        ].join('\n');
    }
    async sendMessage(content, toAgent, fromAgent) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content must be a non-empty string');
        }
        if (!this.agents.has(toAgent)) {
            throw new Error(`Invalid agent: ${toAgent}`);
        }
        const message = {
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
    getConversationContext(agentId) {
        return this.conversationContexts.get(agentId) || [];
    }
    clearConversationContext(agentId) {
        if (agentId) {
            this.conversationContexts.delete(agentId);
        }
        else {
            this.conversationContexts.clear();
        }
    }
    getAgents() {
        return Array.from(this.agents.keys());
    }
    getAgentConfig(agentId) {
        return this.agents.get(agentId);
    }
};
MessageHandler = MessageHandler_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MessageHandler);
export { MessageHandler };
