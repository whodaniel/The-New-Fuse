import { Logger } from '@the-new-fuse/utils';
import { Message, MessageType, UUID } from '@the-new-fuse/types';
// import { CommandProcessor } from './processors/CommandProcessor.js';
// import { NotificationProcessor } from './processors/NotificationProcessor.js';
// import { TaskProcessor } from './processors/TaskProcessor.js';
// import { BaseProcessor } from './processors/BaseProcessor.js'; // Removed unused import
// import { MessageValidator } from './services/MessageValidator.js';
// Import other necessary services (e.g., InterAgentChatService, ConfigService, AlertService, RedisService)
// import { AlertService } from './services/AlertService.js';
// import { RedisService } from './services/RedisService.js';
// import { InterAgentChatService } from './services/InterAgentChatService.js';
// import { ConfigService } from './services/ConfigService.js'; // Assuming ConfigService exists

/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
export class AgentProcessor {
  private logger: Logger;
  private agentId: UUID;
  // private commandProcessor: CommandProcessor;
  // private notificationProcessor: NotificationProcessor;
  // private taskProcessor: TaskProcessor;
  // private messageValidator?: MessageValidator; // Optional: for validating messages

  constructor(
    agentId: UUID
    // configService: ConfigService, // Example dependency
    // alertService: AlertService,   // Example dependency
    // redisService: RedisService,   // Example dependency
    // chatService: InterAgentChatService // Example dependency
    // Inject other services and processors as needed
  ) {
    this.agentId = agentId;
    this.logger = new Logger(`AgentProcessor [${this.agentId}]`);

    // Instantiate services (or receive them via DI)
    // Example: Assuming MessageValidator is optional or created internally
    // try {
    //     this.messageValidator = new MessageValidator();
    // } catch (error) {
    //     this.logger.warn(`Failed to initialize MessageValidator: ${error.message}. Validation will be skipped.`);
    //     this.messageValidator = undefined;
    // }


    // Instantiate processors, injecting dependencies
    // this.commandProcessor = new CommandProcessor(this.agentId, chatService, redisService);
    // this.notificationProcessor = new NotificationProcessor(this.agentId, alertService);
    // this.taskProcessor = new TaskProcessor(this.agentId, alertService, redisService);
    // TODO: Instantiate other processors if needed

    this.logger.info('AgentProcessor initialized.');
  }

  /**
   * Processes a single incoming message by routing it to the appropriate processor.
   * @param message The message to process.
   */
  async processMessage(message: unknown): Promise<void> {
    // 1. Validate the message structure (optional but recommended)
    // if (this.messageValidator && !this.messageValidator.validate(message)) {
    //   this.logger.warn(`Invalid message structure received. Discarding message.`, { messageContent: message });
    //   // Optionally send an error back if the sender is known
    //   return;
    // }

    // We assume validation passed or was skipped, so 'message' is likely a Message object
    const typedMessage = message as Message;

    this.logger.debug(`Processing message ${typedMessage.id} of type ${typedMessage.type}`);

    try {
      // 2. Route based on message type
      switch (typedMessage.type) {
        case MessageType.COMMAND:
          // await this.commandProcessor.process(typedMessage);
          // TODO: Handle command result (e.g., send back via chatService)
          break;
        case MessageType.TASK_ASSIGNMENT:
          // await this.taskProcessor.process(typedMessage);
           // TODO: Handle task result (e.g., send back via chatService)
          break;
        case MessageType.NOTIFICATION:
          // await this.notificationProcessor.process(typedMessage);
          // Notifications usually don't require a direct response
          break;
        // Add cases for other message types (e.g., TASK_CANCEL, STATUS_QUERY, CHAT)
        case MessageType.TASK_CANCEL:
             if (typeof typedMessage.content === 'object' && typedMessage.content !== null && 'taskId' in typedMessage.content) {
                 // await this.taskProcessor.cancelTask((typedMessage.content as { taskId: UUID }).taskId);
             } else {
                 this.logger.warn(`Received TASK_CANCEL message ${typedMessage.id} without a valid taskId in content.`);
             }
             break;
        case MessageType.CHAT:
            this.logger.info(`Received CHAT message ${typedMessage.id}. Handling TBD.`);
            // TODO: Implement chat message handling (e.g., pass to an LLM, specific handler)
            break;
        default:
          this.logger.warn(`Received message ${typedMessage.id} with unhandled type: ${typedMessage.type}`);
          break;
      }
    } catch (error) {
        // Catch errors from processor.process methods
        this.logger.error(`Unhandled error processing message ${typedMessage.id} (Type: ${typedMessage.type}): ${(error as Error).message}`, error);
        // Optionally send a generic error notification/alert
        // await this.alertService.error(
        //     `Failed to process message ${typedMessage.id}`,
        //     `Agent ${this.agentId} / AgentProcessor`,
        //     { error: (error as Error).message, messageType: typedMessage.type }
        // );
    }
  }

  /**
   * Starts the agent processor (e.g., connecting to message queues, starting listeners).
   */
  async start(): Promise<void> {
    this.logger.info('Starting AgentProcessor...');
    // TODO: Implement startup logic, e.g., connect to Redis Pub/Sub, message queue, WebSocket
    // Example: await this.redisService.connect();
    // Example: await this.chatService.connect(); // Assuming chat service needs explicit connection
    // Example: Start listening for messages
    this.logger.info('AgentProcessor started.');
  }

  /**
   * Stops the agent processor gracefully.
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping AgentProcessor...');
    // TODO: Implement shutdown logic, e.g., disconnect services, finish processing active items
    // Example: await this.chatService.disconnect();
    // Example: await this.redisService.disconnect();
    // Wait for active tasks/commands to finish or handle cancellation
    this.logger.info('AgentProcessor stopped.');
  }
}
