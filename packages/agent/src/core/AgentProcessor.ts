import { Logger } from '../types/core';
import { Message, MessageType } from '@the-new-fuse/types';
import { UUID } from '@the-new-fuse/api-types';

/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
export class AgentProcessor {
  private logger: Logger;
  private agentId: UUID;

  constructor(
    agentId: UUID
  ) {
    this.agentId = agentId;
    this.logger = new Logger(`AgentProcessor [${this.agentId}]`);

    this.logger.info('AgentProcessor initialized.');
  }

  /**
   * Processes a single incoming message by routing it to the appropriate processor.
   * @param message The message to process.
   */
  async processMessage(message: unknown): Promise<void> {
    const typedMessage = message as Message;

    this.logger.debug(`Processing message ${typedMessage.id} of type ${typedMessage.type}`);

    try {
      switch (typedMessage.type) {
        case MessageType.COMMAND:
          // await this.commandProcessor.process(typedMessage);
          break;
        case MessageType.TASK_ASSIGNMENT:
          // await this.taskProcessor.process(typedMessage);
          break;
        case MessageType.NOTIFICATION:
          // await this.notificationProcessor.process(typedMessage);
          break;
        default:
          this.logger.warn(`Received message ${typedMessage.id} with unhandled type: ${typedMessage.type}`);
          break;
      }
    } catch (error) {
        this.logger.error(`Unhandled error processing message ${typedMessage.id} (Type: ${typedMessage.type}): ${(error as Error).message}`);
    }
  }

  /**
   * Starts the agent processor (e.g., connecting to message queues, starting listeners).
   */
  async start(): Promise<void> {
    this.logger.info('Starting AgentProcessor...');
    this.logger.info('AgentProcessor started.');
  }

  /**
   * Stops the agent processor gracefully.
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping AgentProcessor...');
    this.logger.info('AgentProcessor stopped.');
  }
}
