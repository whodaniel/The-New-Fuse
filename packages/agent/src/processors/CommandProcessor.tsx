import type { Command, CommandResult, Message, UUID } from '@the-new-fuse/types';
import { MessageType } from '@the-new-fuse/types';

import { Logger } from '../types/core';

import { BaseProcessor } from './BaseProcessor';

import type { InterAgentChatService } from '../services/InterAgentChatService';
import type { MessageValidator } from '../services/MessageValidator';
import type { RedisService } from '../services/RedisService';
import type { TaskProcessor } from './TaskProcessor';

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
  private chatService: InterAgentChatService;
  private redisService: RedisService;
  private messageValidator: MessageValidator;
  private taskProcessor: TaskProcessor;
  private agentId: UUID;

  constructor(
    agentId: UUID,
    chatService: InterAgentChatService,
    redisService: RedisService,
    messageValidator: MessageValidator,
    taskProcessor: TaskProcessor
  ) {
    super();
    this.agentId = agentId;
    this.logger = new Logger(`CommandProcessor [Agent ${this.agentId}]`);
    this.chatService = chatService;
    this.redisService = redisService;
    this.messageValidator = messageValidator;
    this.taskProcessor = taskProcessor;
    this.commandHandlers = new Map();

    this.registerCommandHandler('ping', this.handlePing);
    this.registerCommandHandler('get_status', this.handleGetStatus);
    this.registerCommandHandler('cancel_task', this.handleCancelTask);

    this.logger.info('CommandProcessor initialized.');
  }

  registerCommandHandler(commandType: string, handler: CommandHandler): void {
    if (this.commandHandlers.has(commandType)) {
      this.logger.warn(`Overwriting existing handler for command type: ${commandType}`);
    }
    this.commandHandlers.set(commandType, handler.bind(this));
    this.logger.info(`Registered handler for command type: ${commandType}`);
  }

  async process(message: Message): Promise<CommandResult | null> {
    if (!this.messageValidator.validate(message) || message.type !== MessageType.COMMAND) {
      this.logger.debug(`Skipping message ${message.id}: Not a valid command type.`);
      return null;
    }

    const command = message.content as unknown as Command;

    const handler = this.commandHandlers.get(command.commandType);

    if (!handler) {
      this.logger.warn(
        `No handler registered for command type: ${command.commandType} (Command ID: ${command.id || message.id})`
      );
      return {
        id: `result_${command.id || message.id}`,
        commandId: command.id || message.id,
        status: 'error' as const,
        error: `Command type "${command.commandType}" not supported by this agent.`,
        timestamp: new Date(),
      };
    }

    this.logger.info(
      `Processing command ${command.id || message.id} (Type: ${command.commandType})...`
    );

    try {
      const result = await handler(command, this.agentId);
      this.logger.info(
        `Command ${command.id || message.id} processed with status: ${result.status}`
      );
      if (message.senderAgentId) {
        await this.chatService.sendMessage(
          message.senderAgentId,
          result,
          MessageType.COMMAND_RESULT
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Error executing handler for command ${command.commandType} (ID: ${command.id || message.id}): ${(error as Error).message}`
      );
      return {
        id: `result_${command.id || message.id}`,
        commandId: command.id || message.id,
        status: 'error' as const,
        error: `Internal error processing command: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  private async handlePing(command: Command, agentId: UUID): Promise<CommandResult> {
    this.logger.debug(`Handling 'ping' command (ID: ${command.id})`);
    const pingTimestamp = await this.redisService.get(`agent:${agentId}:last_ping`);
    return {
      id: `result_${command.id}`,
      commandId: command.id,
      status: 'success' as const,
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

    const activeTasks = Array.from(this.taskProcessor.activeTasks.keys());
    const status = {
      agentId: agentId,
      status: activeTasks.length > 0 ? 'busy' : 'idle',
      activeTaskCount: activeTasks.length,
      activeTasks: activeTasks,
      timestamp: new Date(),
    };

    return {
      id: `result_${command.id}`,
      commandId: command.id,
      status: 'success' as const,
      result: status,
      timestamp: new Date(),
    };
  }

  private async handleCancelTask(command: Command, agentId: UUID): Promise<CommandResult> {
    this.logger.debug(`Handling 'cancel_task' command (ID: ${command.id})`);
    const taskId = command.payload?.taskId as UUID;
    if (!taskId) {
      return {
        id: `result_${command.id}`,
        commandId: command.id,
        status: 'error' as const,
        error: 'Missing taskId in command parameters.',
        timestamp: new Date(),
      };
    }

    const success = await this.taskProcessor.cancelTask(taskId);
    return {
      id: `result_${command.id}`,
      commandId: command.id,
      status: success ? 'success' : 'error',
      result: {
        message: success
          ? `Task ${taskId} cancelled.`
          : `Task ${taskId} not found or already cancelled.`,
      },
      timestamp: new Date(),
    };
  }
}
