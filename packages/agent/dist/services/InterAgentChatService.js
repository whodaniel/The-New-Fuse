"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterAgentChatService = void 0;
const types_1 = require("@the-new-fuse/types"); // Import Message and MessageType
const BaseService_1 = require("../core/BaseService"); // Corrected import path
const core_1 = require("../types/core");
/**
 * Service responsible for facilitating communication between different agents.
 */
class InterAgentChatService extends BaseService_1.BaseService {
    constructor(transport, agentId) {
        super({ name: 'InterAgentChatService' });
        this.logger = new core_1.Logger('InterAgentChatService');
        this.transport = transport;
        this.currentAgentId = agentId;
        // Setup listener for incoming messages
        this.transport.onMessage(this.handleIncomingMessage.bind(this));
        this.logger.info(`InterAgentChatService initialized for Agent ${agentId}.`);
        // Connect transport and subscribe to own agent ID
        this.initializeTransport();
    }
    async initializeTransport() {
        try {
            await this.transport.connect();
            await this.transport.subscribeToAgent(this.currentAgentId);
            this.logger.info(`Transport connected and subscribed to Agent ${this.currentAgentId}.`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize chat transport: ${error.message}`);
            // Implement retry or error handling strategy
        }
    }
    /**
     * Sends a direct message to another agent.
     * @param recipientAgentId The ID of the recipient agent.
     * @param content The message content.
     * @param type The type of the message (defaults to 'chat').
     * @param conversationId Optional conversation ID.
     */
    async sendMessage(recipientAgentId, content, _type = 'chat', conversationId) {
        const message = {
            id: crypto.randomUUID(), // Generate a unique message ID
            senderAgentId: this.currentAgentId,
            recipientAgentId: recipientAgentId,
            timestamp: Date.now(),
            type: types_1.MessageType.TEXT,
            content: content,
            conversationId: conversationId,
            sender: this.currentAgentId,
        };
        try {
            await this.transport.sendMessage(message);
            this.logger.debug(`Sent message ${message.id} to Agent ${recipientAgentId}.`);
        }
        catch (error) {
            this.logger.error(`Failed to send message to Agent ${recipientAgentId}: ${error.message}`);
            throw error; // Re-throw for the caller to handle
        }
    }
    /**
     * Broadcasts a message to all subscribed agents (or a specific topic).
     * @param content The message content.
     * @param type The type of the message (defaults to 'broadcast').
     * @param topic Optional topic for targeted broadcast.
     */
    async broadcast(content, topic) {
        const message = {
            id: crypto.randomUUID(), // Generate a unique message ID
            senderAgentId: this.currentAgentId,
            timestamp: Date.now(),
            type: types_1.MessageType.NOTIFICATION,
            content: content,
            topic: topic,
            sender: this.currentAgentId,
        };
        try {
            await this.transport.broadcastMessage(message);
            this.logger.debug(`Broadcasted message ${message.id}${topic ? ` on topic ${topic}` : ''}.`);
        }
        catch (error) {
            this.logger.error(`Failed to broadcast message: ${error.message}`);
            throw error; // Re-throw for the caller to handle
        }
    }
    /**
     * Handles incoming messages from the transport layer.
     * @param message The received message.
     */
    handleIncomingMessage(message) {
        // Avoid processing messages sent by self
        if (message.senderAgentId === this.currentAgentId) {
            return;
        }
        this.logger.debug(`Received message ${message.id} from Agent ${message.senderAgentId}. Type: ${message.type}`);
        // TODO: Implement logic to process the incoming message.
        // This might involve:
        // - Emitting an event
        // - Calling a registered handler based on message type
        // - Storing the message
        // - Triggering agent actions
    }
    /**
     * Subscribe to a specific topic for broadcast messages.
     * Requires transport support.
     * @param topic The topic name.
     */
    async subscribeToTopic(topic) {
        if (!this.transport.subscribeToTopic) {
            this.logger.warn('Transport does not support topic subscriptions.');
            return;
        }
        try {
            await this.transport.subscribeToTopic(topic);
            this.logger.info(`Subscribed to topic: ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to subscribe to topic ${topic}: ${error.message}`);
        }
    }
    /**
     * Unsubscribe from a specific topic.
     * Requires transport support.
     * @param topic The topic name.
     */
    async unsubscribeFromTopic(topic) {
        if (!this.transport.unsubscribeFromTopic) {
            this.logger.warn('Transport does not support topic unsubscriptions.');
            return;
        }
        try {
            await this.transport.unsubscribeFromTopic(topic);
            this.logger.info(`Unsubscribed from topic: ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to unsubscribe from topic ${topic}: ${error.message}`);
        }
    }
    async disconnect() {
        try {
            await this.transport.disconnect();
            this.logger.info('Chat transport disconnected.');
        }
        catch (error) {
            this.logger.error(`Error disconnecting chat transport: ${error.message}`);
        }
    }
}
exports.InterAgentChatService = InterAgentChatService;
//# sourceMappingURL=InterAgentChatService.js.map