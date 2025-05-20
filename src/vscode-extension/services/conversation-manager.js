"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const logging_1 = require("../core/logging");
const relay_service_1 = require("./relay-service");
const agent_discovery_1 = require("./agent-discovery");
const shared_1 = require("../types/shared");
class ConversationManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.conversations = new Map();
        this.messageHandlers = new Map();
        this.logger = logging_1.Logger.getInstance();
        this.relayService = relay_service_1.RelayService.getInstance();
        this.agentDiscovery = agent_discovery_1.AgentDiscoveryManager.getInstance();
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!ConversationManager.instance) {
            ConversationManager.instance = new ConversationManager();
        }
        return ConversationManager.instance;
    }
    setupEventHandlers() {
        // Listen for agent status changes
        this.agentDiscovery.on('agentStatusChanged', ({ agentId, status }) => {
            this.handleAgentStatusChange(agentId, status);
        });
        // Register default message handlers
        this.registerHandler(shared_1.MessageType.INITIATION, this.handleInitiation.bind(this));
        this.registerHandler(shared_1.MessageType.MESSAGE, this.handleMessage.bind(this));
        this.registerHandler(shared_1.MessageType.CODE_INPUT, this.handleCodeInput.bind(this));
        this.registerHandler(shared_1.MessageType.AI_REQUEST, this.handleAIRequest.bind(this));
    }
    async startConversation(sourceAgent, targetAgent, metadata) {
        const conversationId = (0, uuid_1.v4)();
        const conversation = {
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
    async sendMessage(messageInput) {
        let message;
        // Handle simple string messages by creating a default message object
        if (typeof messageInput === 'string') {
            // Find the latest active conversation or create one
            let conversationId;
            const activeConversations = this.getActiveConversations();
            if (activeConversations.length > 0) {
                // Use the most recent conversation
                conversationId = activeConversations
                    .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))[0].id;
            }
            else {
                // Create a new conversation with default values
                const newConversation = await this.startConversation('vscode-user', 'default-ai-assistant', { createdFromSimpleMessage: true });
                conversationId = newConversation.id;
            }
            message = {
                conversationId,
                type: shared_1.MessageType.MESSAGE,
                sourceAgent: 'vscode-user',
                targetAgent: 'default-ai-assistant',
                content: messageInput,
                text: messageInput
            };
        }
        else {
            message = messageInput;
        }
        const fullMessage = {
            ...message,
            id: (0, uuid_1.v4)(),
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
    async routeMessage(message) {
        try {
            const handlers = this.messageHandlers.get(message.type) || [];
            await Promise.all(handlers.map(handler => handler(message)));
            // Route based on target agent type
            if (message.targetAgent === 'chrome-extension') {
                this.relayService.sendMessage('chrome-extension', {
                    command: 'message',
                    data: message
                });
            }
            else {
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
        }
        catch (error) {
            this.logger.error('Failed to route message:', error);
            throw error;
        }
    }
    async handleInitiation(message) {
        const { conversationId, sourceAgent, targetAgent } = message;
        if (!this.conversations.has(conversationId)) {
            await this.startConversation(sourceAgent, targetAgent);
        }
    }
    async handleMessage(message) {
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            conversation.lastMessageTime = Date.now();
        }
    }
    async handleCodeInput(message) {
        // Handle code input messages (e.g., from Chrome extension)
        this.emit('codeInput', message);
    }
    async handleAIRequest(message) {
        // Handle AI request messages
        this.emit('aiRequest', message);
    }
    async handleAgentStatusChange(agentId, status) {
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
    registerHandler(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)?.push(handler);
    }
    getConversation(id) {
        return this.conversations.get(id);
    }
    getActiveConversations() {
        return Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active');
    }
    async endConversation(id) {
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
    clearMessages() {
        this.conversations.clear();
        this.emit('messagesCleared');
        this.logger.info('All messages cleared');
    }
    dispose() {
        this.removeAllListeners();
        this.conversations.clear();
        this.messageHandlers.clear();
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=conversation-manager.js.map