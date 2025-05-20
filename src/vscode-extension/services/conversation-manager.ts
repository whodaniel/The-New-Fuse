import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger, LogLevel  } from '../core/logging.js';
import { RelayService } from './relay-service.js';
import { AgentDiscoveryManager } from './agent-discovery.js';
import {
    AIMessage,
    MessageType
} from '../types/shared.js';

// Define ConversationState interface locally as its definition was not found elsewhere
interface ConversationState {
    id: string;
    sourceAgent: string;
    targetAgent: string;
    messages: AIMessage[];
    startTime: number;
    status: 'active' | 'idle' | 'ended'; // Assuming possible statuses
    metadata?: Record<string, any>;
    lastMessageTime?: number;
}

export class ConversationManager extends EventEmitter {
    private static instance: ConversationManager;
    private logger: Logger;
    private conversations: Map<string, ConversationState> = new Map();
    private relayService: RelayService;
    private agentDiscovery: AgentDiscoveryManager;
    private messageHandlers: Map<MessageType, Function[]> = new Map();

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.relayService = RelayService.getInstance();
        this.agentDiscovery = AgentDiscoveryManager.getInstance();
        this.setupEventHandlers();
    }

    public static getInstance(): ConversationManager {
        if (!ConversationManager.instance) {
            ConversationManager.instance = new ConversationManager();
        }
        return ConversationManager.instance;
    }

    private setupEventHandlers(): void {
        // Listen for agent status changes
        this.agentDiscovery.on('agentStatusChanged', ({ agentId, status }) => {
            this.handleAgentStatusChange(agentId, status);
        });

        // Register default message handlers
        this.registerHandler(MessageType.INITIATION, this.handleInitiation.bind(this));
        this.registerHandler(MessageType.MESSAGE, this.handleMessage.bind(this));
        this.registerHandler(MessageType.CODE_INPUT, this.handleCodeInput.bind(this));
        this.registerHandler(MessageType.AI_REQUEST, this.handleAIRequest.bind(this));
    }

    public async startConversation(
        sourceAgent: string,
        targetAgent: string,
        metadata?: Record<string, any>
    ): Promise<ConversationState> {
        const conversationId = uuidv4();
        const conversation: ConversationState = {
            id: conversationId,
            sourceAgent,
            targetAgent,
            messages: [],
            startTime: Date.now(),
            status: 'active',
            metadata
        };

        this.conversations.set(conversationId, conversation);
        this.emit('conversationStarted', conversation);
        this.logger.info(`Started conversation ${conversationId} between ${sourceAgent} and ${targetAgent}`);

        return conversation;
    }

    public async sendMessage(messageInput: string | AIMessage): Promise<AIMessage> {
        let message: Omit<AIMessage, 'id' | 'timestamp'>;

        // Handle simple string messages by creating a default message object
        if (typeof messageInput === 'string') {
            // Find the latest active conversation or create one
            let conversationId: string;
            const activeConversations = this.getActiveConversations();

            if (activeConversations.length > 0) {
                // Use the most recent conversation
                conversationId = activeConversations
                    .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))[0].id;
            } else {
                // Create a new conversation with default values
                const newConversation = await this.startConversation(
                    'vscode-user',
                    'default-ai-assistant',
                    { createdFromSimpleMessage: true }
                );
                conversationId = newConversation.id;
            }

            message = {
                conversationId,
                type: MessageType.MESSAGE,
                sourceAgent: 'vscode-user',
                targetAgent: 'default-ai-assistant',
                content: messageInput,
                text: messageInput
            };
        } else {
            message = messageInput;
        }

        const fullMessage: AIMessage = {
            ...message,
            id: uuidv4(),
            timestamp: Date.now()
        };

        const conversation = this.conversations.get(message.conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${message.conversationId} not found`);
        }

        conversation.messages.push(fullMessage);
        conversation.lastMessageTime = fullMessage.timestamp;

        this.emit('messageSent', fullMessage);
        await this.routeMessage(fullMessage);

        return fullMessage;
    }

    private async routeMessage(message: AIMessage): Promise<void> {
        try {
            const handlers = this.messageHandlers.get(message.type) || [];
            await Promise.all(handlers.map(handler => handler(message)));

            // Route based on target agent type
            if (message.targetAgent === 'chrome-extension') {
                this.relayService.sendMessage('chrome-extension', {
                    command: 'message',
                    data: message
                });
            } else {
                const agent = this.agentDiscovery.getAgent(message.targetAgent);
                if (!agent) {
                    throw new Error(`Target agent ${message.targetAgent} not found`);
                }

                if (agent.provider === 'vscode') {
                    this.relayService.sendMessage('vscode', {
                        command: 'message',
                        data: message
                    });
                }
            }
        } catch (error) {
            this.logger.error('Failed to route message:', error);
            throw error;
        }
    }

    private async handleInitiation(message: AIMessage): Promise<void> {
        const { conversationId, sourceAgent, targetAgent } = message;
        if (!this.conversations.has(conversationId)) {
            await this.startConversation(sourceAgent, targetAgent);
        }
    }

    private async handleMessage(message: AIMessage): Promise<void> {
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            conversation.lastMessageTime = Date.now();
        }
    }

    private async handleCodeInput(message: AIMessage): Promise<void> {
        // Handle code input messages (e.g., from Chrome extension)
        this.emit('codeInput', message);
    }

    private async handleAIRequest(message: AIMessage): Promise<void> {
        // Handle AI request messages
        this.emit('aiRequest', message);
    }

    private async handleAgentStatusChange(agentId: string, status: string): Promise<void> {
        // Update conversations involving this agent
        for (const conversation of this.conversations.values()) {
            if (conversation.sourceAgent === agentId || conversation.targetAgent === agentId) {
                if (status === 'disconnected') {
                    conversation.status = 'idle';
                }
                this.emit('conversationUpdated', conversation);
            }

        }
    }

    public registerHandler(type: MessageType, handler: Function): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)?.push(handler);
    }

    public getConversation(id: string): ConversationState | undefined {
        return this.conversations.get(id);
    }

    public getActiveConversations(): ConversationState[] {
        return Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active');
    }

    public async endConversation(id: string): Promise<void> {
        const conversation = this.conversations.get(id);
        if (conversation) {
            conversation.status = 'ended';
            this.emit('conversationEnded', conversation);
            this.logger.info(`Ended conversation ${id}`);
        }
    }

    /**
     * Clear all messages from all conversations
     */
    public clearMessages(): void {
        this.conversations.clear();
        this.emit('messagesCleared');
        this.logger.info('All messages cleared');
    }

    public dispose(): void {
        this.removeAllListeners();
        this.conversations.clear();
        this.messageHandlers.clear();
    }
}