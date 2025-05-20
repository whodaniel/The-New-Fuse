import { BaseService } from '../core/BaseService.js'; // Corrected import path
import { Logger } from '@packages/utils'; // Assuming Logger is available
import { UUID, Message, MessageType } from '@packages/types'; // Assuming types are available

// Define specific message structures for inter-agent chat if needed
export interface ChatMessage extends Message {
  senderAgentId: UUID;
  recipientAgentId: UUID;
  conversationId?: UUID; // Optional: to group messages
}

export interface BroadcastMessage extends Message {
  senderAgentId: UUID;
  topic?: string; // Optional: for pub/sub style broadcasts
}

// Interface for the underlying transport mechanism (e.g., Redis Pub/Sub, WebSocket, gRPC)
export interface ChatTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: ChatMessage): Promise<void>;
  broadcastMessage(message: BroadcastMessage): Promise<void>;
  onMessage(handler: (message: ChatMessage | BroadcastMessage) => void): void; // Listener for incoming messages
  subscribeToAgent(agentId: UUID): Promise<void>; // Needed for direct messaging
  unsubscribeFromAgent(agentId: UUID): Promise<void>;
  subscribeToTopic?(topic: string): Promise<void>; // Optional for pub/sub
  unsubscribeFromTopic?(topic: string): Promise<void>; // Optional for pub/sub
}

/**
 * Service responsible for facilitating communication between different agents.
 */
export class InterAgentChatService extends BaseService {
  private logger: Logger;
  private transport: ChatTransport;
  private currentAgentId: UUID; // ID of the agent instance using this service

  constructor(transport: ChatTransport, agentId: UUID) {
    super();
    this.logger = new Logger('InterAgentChatService');
    this.transport = transport;
    this.currentAgentId = agentId;

    // Setup listener for incoming messages
    this.transport.onMessage(this.handleIncomingMessage.bind(this));

    this.logger.info(`InterAgentChatService initialized for Agent ${agentId}.`);
    // Connect transport and subscribe to own agent ID
    this.initializeTransport();
  }

  private async initializeTransport(): Promise<void> {
    try {
      await this.transport.connect();
      await this.transport.subscribeToAgent(this.currentAgentId);
      this.logger.info(`Transport connected and subscribed to Agent ${this.currentAgentId}.`);
    } catch (error) {
      this.logger.error(`Failed to initialize chat transport: ${error.message}`, error);
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
  async sendMessage(
    recipientAgentId: UUID,
    content: string | Record<string, unknown>,
    type: MessageType = 'chat',
    conversationId?: UUID
  ): Promise<void> {
    const message: ChatMessage = {
      id: crypto.randomUUID(), // Generate a unique message ID
      senderAgentId: this.currentAgentId,
      recipientAgentId: recipientAgentId,
      timestamp: new Date(),
      type: type,
      content: content,
      conversationId: conversationId,
    };

    try {
      await this.transport.sendMessage(message);
      this.logger.debug(`Sent message ${message.id} to Agent ${recipientAgentId}.`);
    } catch (error) {
      this.logger.error(`Failed to send message to Agent ${recipientAgentId}: ${error.message}`, error);
      throw error; // Re-throw for the caller to handle
    }
  }

  /**
   * Broadcasts a message to all subscribed agents (or a specific topic).
   * @param content The message content.
   * @param type The type of the message (defaults to 'broadcast').
   * @param topic Optional topic for targeted broadcast.
   */
  async broadcast(
    content: string | Record<string, unknown>,
    type: MessageType = 'broadcast',
    topic?: string
  ): Promise<void> {
     const message: BroadcastMessage = {
      id: crypto.randomUUID(), // Generate a unique message ID
      senderAgentId: this.currentAgentId,
      timestamp: new Date(),
      type: type,
      content: content,
      topic: topic,
    };

    try {
      await this.transport.broadcastMessage(message);
      this.logger.debug(`Broadcasted message ${message.id}${topic ? ` on topic ${topic}` : ''}.`);
    } catch (error) {
      this.logger.error(`Failed to broadcast message: ${error.message}`, error);
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
    }

    this.logger.debug(`Received message ${message.id} from Agent ${message.senderAgentId}. Type: ${message.type}`);

    // TODO: Implement logic to process the incoming message.
    // This might involve:
    // - Emitting an event
    // - Calling a registered handler based on message type
    // - Storing the message
    // - Triggering agent actions

    console.log('Received Message:', message); // Placeholder processing
  }

  /**
   * Subscribe to a specific topic for broadcast messages.
   * Requires transport support.
   * @param topic The topic name.
   */
  async subscribeToTopic(topic: string): Promise<void> {
    if (!this.transport.subscribeToTopic) {
      this.logger.warn('Transport does not support topic subscriptions.');
      return;
    }
    try {
      await this.transport.subscribeToTopic(topic);
      this.logger.info(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}: ${error.message}`, error);
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
      await this.transport.unsubscribeFromTopic(topic);
      this.logger.info(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}: ${error.message}`, error);
    }
  }


  async disconnect(): Promise<void> {
    try {
      await this.transport.disconnect();
      this.logger.info('Chat transport disconnected.');
    } catch (error) {
      this.logger.error(`Error disconnecting chat transport: ${error.message}`, error);
    }
  }
}
