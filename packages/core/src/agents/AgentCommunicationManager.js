"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCommunicationManager = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
let AgentCommunicationManager = class AgentCommunicationManager {
    logger;
    messages = new Map();
    messageHandlers = new Map();
    agentSubscriptions = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Send message from one agent to another
     */
    async sendMessage(fromAgentId, toAgentId, type, payload, metadata) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)};
    
    const message: AgentMessage = {
      id: messageId,
      fromAgentId,
      toAgentId,
      type,
      payload,
      timestamp: new Date(),
      status: 'sent',
      metadata
    };

    this.messages.set(messageId, message);
    
    // Attempt to deliver message
    await this.deliverMessage(message);
    
    this.logger.log(`;
        Message;
        sent: $;
        {
            fromAgentId;
        }
        ` -> ${toAgentId}`($, { type }),
            'AgentCommunicationManager';
        ;
        return messageId;
    }
    /**
     * Broadcast message to all subscribed agents
     */
    async broadcastMessage(fromAgentId, type, payload, metadata) {
        const subscribers = this.agentSubscriptions.get(type) || [];
        const messageIds = [];
        for (const subscriberId of subscribers) {
            if (subscriberId !== fromAgentId) {
                const messageId = await this.sendMessage(fromAgentId, subscriberId, 'broadcast', { type, ...payload }, metadata);
                messageIds.push(messageId);
            }
        }
        this.logger.log(`
      Broadcast sent: ${fromAgentId}` -  > $, { subscribers, : .length }, agents($, { type } `),
      'AgentCommunicationManager'
    );

    return messageIds;
  }

  /**
   * Register message handler for agent
   */
  registerMessageHandler(agentId: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(agentId)) {
      this.messageHandlers.set(agentId, []);
    }
    this.messageHandlers.get(agentId)!.push(handler);
    
    this.logger.debug(
      Message handler registered for agent: ${agentId},
      'AgentCommunicationManager'
    );
  }

  /**
   * Subscribe agent to message type
   */
  subscribeToMessageType(agentId: string, messageType: string): void {
    if (!this.agentSubscriptions.has(messageType)) {
      this.agentSubscriptions.set(messageType, []);
    }
    
    const subscribers = this.agentSubscriptions.get(messageType)!;
    if (!subscribers.includes(agentId)) {
      subscribers.push(agentId);
      
      this.logger.debug(`, Agent, subscribed, $, { agentId } -  > $, { messageType } `,
        'AgentCommunicationManager'
      );
    }
  }

  /**
   * Unsubscribe agent from message type
   */
  unsubscribeFromMessageType(agentId: string, messageType: string): void {
    const subscribers = this.agentSubscriptions.get(messageType);
    if (subscribers) {
      const index = subscribers.indexOf(agentId);
      if (index > -1) {
        subscribers.splice(index, 1);
        
        this.logger.debug(
          Agent unsubscribed: ${agentId} <- ${messageType}`, 'AgentCommunicationManager'));
    }
};
exports.AgentCommunicationManager = AgentCommunicationManager;
exports.AgentCommunicationManager = AgentCommunicationManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], AgentCommunicationManager);
/**
 * Get message by ID
 */
getMessage(messageId, string);
AgentMessage | undefined;
{
    return this.messages.get(messageId);
}
/**
 * Get messages for agent
 */
getAgentMessages(agentId, string, limit, number = 100);
AgentMessage[];
{
    return Array.from(this.messages.values())
        .filter(msg => msg.fromAgentId === agentId || msg.toAgentId === agentId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}
/**
 * Update message status
 */
async;
updateMessageStatus(messageId, string, status, AgentMessage['status']);
Promise < void  > {
    const: message = this.messages.get(messageId),
    if(message) {
        message.status = status;
        this.logger.debug(Message, status, updated, $, { messageId } -  > $, { status }, 'AgentCommunicationManager');
    }
};
async;
deliverMessage(message, AgentMessage);
Promise < void  > {
    const: handlers = this.messageHandlers.get(message.toAgentId),
    if(handlers) { }
} && handlers.length > 0;
{
    try {
        // Execute all handlers for the target agent
        await Promise.all(handlers.map(handler => handler(message)));
        message.status = 'delivered';
    }
    catch (error) {
        message.status = 'failed';
        this.logger.error(`
          Failed to deliver message ${message.id}`, error instanceof Error ? error : new Error(String(error)), 'AgentCommunicationManager');
    }
}
{
    // No handlers registered, but message is sent
    message.status = 'delivered';
    this.logger.warn(No, message, handlers, registered);
    for (agent; ; )
        : $;
    {
        message.toAgentId;
    }
    `,
        'AgentCommunicationManager'
      );
    }
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(): {
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    activeSubscriptions: number;
    registeredHandlers: number;
  } {
    const messages = Array.from(this.messages.values());
    const subscriptions = Array.from(this.agentSubscriptions.values());
    
    return {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => m.status === 'sent').length,
      deliveredMessages: messages.filter(m => m.status === 'delivered').length,
      failedMessages: messages.filter(m => m.status === 'failed').length,
      activeSubscriptions: subscriptions.reduce((total, subs) => total + subs.length, 0),
      registeredHandlers: this.messageHandlers.size
    };
  }
}
    ;
}
//# sourceMappingURL=AgentCommunicationManager.js.map