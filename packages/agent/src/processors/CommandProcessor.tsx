import { BaseProcessor } from './BaseProcessor.js'; // Assuming a BaseProcessor exists
import { Logger } from '@packages/utils';
import { Command, CommandResult, Message, MessageType, UUID } from '@packages/types';
import { InterAgentChatService } from '../services/InterAgentChatService.js'; // Corrected import
import { RedisService } from '../services/RedisService.js'; // Corrected import
// Import other necessary services or types

/**
 * Interface for command handlers.
 */
interface CommandHandler {
  (command: Command, agentId: UUID): Promise<CommandResult>;
}

/**
 * Processes incoming command messages for an agent.
 */
export class CommandProcessor extends BaseProcessor {
  protected logger: Logger;
  private commandHandlers: Map<string, CommandHandler>;
  private chatService: InterAgentChatService; // Example service dependency
  private redisService: RedisService;       // Example service dependency
  private agentId: UUID;

  constructor(
    agentId: UUID,
    chatService: InterAgentChatService,
    redisService: RedisService
    // Inject other dependencies as needed
  ) {
    super();
    this.agentId = agentId;
    this.logger = new Logger(`CommandProcessor [Agent ${this.agentId}]`);
    this.chatService = chatService;
    this.redisService = redisService;
    this.commandHandlers = new Map();

    // Register default command handlers
    this.registerCommandHandler('ping', this.handlePing);
    this.registerCommandHandler('get_status', this.handleGetStatus);
    // TODO: Register more command handlers specific to the agent's capabilities

    this.logger.info('CommandProcessor initialized.');
  }

  /**
   * Registers a handler function for a specific command type.
   * @param commandType The type of command to handle (e.g., 'execute_task', 'update_config').
   * @param handler The asynchronous function to execute when the command is received.
   */
  registerCommandHandler(commandType: string, handler: CommandHandler): void {
    if (this.commandHandlers.has(commandType)) {
      this.logger.warn(`Overwriting existing handler for command type: ${commandType}`);
    }
    this.commandHandlers.set(commandType, handler.bind(this)); // Bind 'this' context
    this.logger.info(`Registered handler for command type: ${commandType}`);
  }

  /**
   * Processes an incoming message, expecting it to be a command.
   * @param message The incoming message.
   * @returns A Promise resolving to a CommandResult or null if the message is not a valid command.
   */
  async process(message: Message): Promise<CommandResult | null> {
    if (message.type !== MessageType.COMMAND || typeof message.content !== 'object' || message.content === null) {
      this.logger.debug(`Skipping message ${message.id}: Not a valid command type.`);
      return null;
    }

    // TODO: Add validation using MessageValidator service if available
    const command = message.content as Command; // Type assertion, consider validation

    if (!command.commandType) {
        this.logger.warn(`Received command message ${message.id} without a commandType.`);
        return {
            commandId: command.id || message.id, // Use command ID if present, else message ID
            status: 'failed',
            error: 'Missing commandType in command content.',
            timestamp: new Date(),
        };
    }

    const handler = this.commandHandlers.get(command.commandType);

    if (!handler) {
      this.logger.warn(`No handler registered for command type: ${command.commandType} (Command ID: ${command.id || message.id})`);
      return {
        commandId: command.id || message.id,
        status: 'failed',
        error: `Command type "${command.commandType}" not supported by this agent.`,
        timestamp: new Date(),
      };
    }

    this.logger.info(`Processing command ${command.id || message.id} (Type: ${command.commandType})...`);

    try {
      const result = await handler(command, this.agentId);
      this.logger.info(`Command ${command.id || message.id} processed with status: ${result.status}`);
      // Optionally send result back via chatService or another mechanism
      // Example: if (message.senderAgentId) { await this.chatService.sendMessage(message.senderAgentId, result, MessageType.COMMAND_RESULT); }
      return result;
    } catch (error) {
      this.logger.error(`Error executing handler for command ${command.commandType} (ID: ${command.id || message.id}): ${error.message}`, error);
      return {
        commandId: command.id || message.id,
        status: 'failed',
        error: `Internal error processing command: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  // --- Example Command Handlers ---

  private async handlePing(command: Command, agentId: UUID): Promise<CommandResult> {
    this.logger.debug(`Handling 'ping' command (ID: ${command.id})`);
    // Example: Use redisService
    const pingTimestamp = await this.redisService.get(`agent:${agentId}:last_ping`);
    return {
      commandId: command.id,
      status: 'success',
      result: {
        message: 'pong',
        agentId: agentId,
        timestamp: new Date(),
        lastPingRedis: pingTimestamp ? new Date(pingTimestamp) : null,
      },
      timestamp: new Date(),
    };
  }

  private async handleGetStatus(command: Command, agentId: UUID): Promise<CommandResult> {
     this.logger.debug(`Handling 'get_status' command (ID: ${command.id})`);
     // TODO: Implement logic to retrieve agent status (e.g., current task, health, load)
     return {
       commandId: command.id,
       status: 'success',
       result: {
         agentId: agentId,
         status: 'idle', // Placeholder
         timestamp: new Date(),
         // Add more status details
       },
       timestamp: new Date(),
     };
  }
}
