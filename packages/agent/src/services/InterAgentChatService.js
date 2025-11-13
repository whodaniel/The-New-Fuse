"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterAgentChatService = void 0;
const BaseService_1 = require("../core/BaseService"); // Corrected import path
const common_1 = require("@nestjs/common");
/**
 * Service responsible for facilitating communication between different agents.
 */
class InterAgentChatService extends BaseService_1.BaseService {
    logger;
    transport;
    currentAgentId; // ID of the agent instance using this service
    constructor(transport, agentId) {
        super({ name: 'InterAgentChatService' });
        this.logger = new common_1.Logger('InterAgentChatService');
        this.transport = transport;
        this.currentAgentId = agentId;
        // Setup listener for incoming messages
        this.transport.onMessage(this.handleIncomingMessage.bind(this));
        this.logger.log(`InterAgentChatService initialized for Agent ${agentId}.);
    // Connect transport and subscribe to own agent ID
    this.initializeTransport();
  }

  private async initializeTransport(): Promise<void> {
    try {
      await this.transport.connect();
      await this.transport.subscribeToAgent(this.currentAgentId);`, this.logger.log(`Transport connected and subscribed to Agent ${this.currentAgentId}`.));
    }
    catch(error) {
        this.logger.error(Failed, to, initialize, chat, transport, $, {}(error).message);
    }
    ;
}
exports.InterAgentChatService = InterAgentChatService;
/**
 * Sends a direct message to another agent.
 * @param recipientAgentId The ID of the recipient agent.
 * @param content The message content.
 * @param type The type of the message (defaults to 'chat').
 * @param conversationId Optional conversation ID.
 */
async;
sendMessage(recipientAgentId, UUID, content, string | (Record), _type, any = 'chat', conversationId ?  : UUID);
Promise < void  > {
    const: message, ChatMessage = {
        id: crypto.randomUUID(), // Generate a unique message ID
        senderAgentId: this.currentAgentId,
        recipientAgentId: recipientAgentId,
        timestamp: Date.now(),
        type: 'chat', // TODO: Fix MessageType enum
        content: content,
        conversationId: conversationId,
        sender: this.currentAgentId,
    },
    try: {
        await, this: .transport.sendMessage(message)
    } `
      this.logger.debug(Sent message ${message.id}`, to, Agent, $
};
{
    recipientAgentId;
}
;
`
    } catch (error) {
      this.logger.error(Failed to send message to Agent ${recipientAgentId}: ${error.message}`;
;
throw error; // Re-throw for the caller to handle
/**
 * Broadcasts a message to all subscribed agents (or a specific topic).
 * @param content The message content.
 * @param type The type of the message (defaults to 'broadcast').
 * @param topic Optional topic for targeted broadcast.
 */
async;
broadcast(content, string | (Record), topic ?  : string);
Promise < void  > {
    const: message, BroadcastMessage = {
        id: crypto.randomUUID(), // Generate a unique message ID
        senderAgentId: this.currentAgentId,
        timestamp: Date.now(),
        type: 'broadcast', // TODO: Fix MessageType enum
        content: content,
        topic: topic,
        sender: this.currentAgentId,
    },
    try: {
        await, this: .transport.broadcastMessage(message),
        this: .logger.debug(Broadcasted, message, $, { message, : .id }, $, { topic, on, topic, $ }, { topic } ` : ''}.);
    } catch (error) {
      this.logger.error(Failed to broadcast message: ${error.message});
      throw error; // Re-throw for the caller to handle
    }
  }

  /**
   * Handles incoming messages from the transport layer.
   * @param message The received message.
   */
  private handleIncomingMessage(message: ChatMessage | BroadcastMessage): void {
    // Avoid processing messages sent by self
    if (message.senderAgentId === this.currentAgentId) {
      return;
    }` `
    this.logger.debug(Received message ${message.id}`, from, Agent, $, { message, : .senderAgentId }.Type, $, { message, : .type })
    }
    /**
     * Subscribe to a specific topic for broadcast messages.
     * Requires transport support.
     * @param topic The topic name.
     */
    ,
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
            `
      await this.transport.subscribeToTopic(topic);`;
            this.logger.log(Subscribed, to, topic, $, { topic } `);
    } catch (error) {
      this.logger.error(Failed to subscribe to topic ${topic}: ${error.message});
    }
  }

   /**
   * Unsubscribe from a specific topic.
   * Requires transport support.
   * @param topic The topic name.
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
     if (!this.transport.unsubscribeFromTopic) {
      this.logger.warn('Transport does not support topic unsubscriptions.');
      return;
    }
    try {
      await this.transport.unsubscribeFromTopic(topic);`, this.logger.log(Unsubscribed, from, topic, $, { topic } `);
    } catch (error) {
      this.logger.error(Failed to unsubscribe from topic ${topic}: ${error.message}`));
        }
        finally {
        }
    },
    async disconnect() {
        try {
            await this.transport.disconnect();
            this.logger.log('Chat transport disconnected.');
        }
        catch (error) {
            this.logger.error(Error, disconnecting, chat, transport, $, {}(error).message);
        }
        `);
    }
  }
}
        ;
    }
};
//# sourceMappingURL=InterAgentChatService.js.map