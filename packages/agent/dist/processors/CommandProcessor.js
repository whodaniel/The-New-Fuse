"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandProcessor = void 0;
const BaseProcessor_1 = require("./BaseProcessor");
const core_1 = require("../types/core");
const types_1 = require("@the-new-fuse/types");
/**
 * Processes incoming command messages for an agent.
 */
class CommandProcessor extends BaseProcessor_1.BaseProcessor {
    constructor(agentId, chatService, redisService, messageValidator, taskProcessor) {
        super();
        this.agentId = agentId;
        this.logger = new core_1.Logger(`CommandProcessor [Agent ${this.agentId}]`);
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
    registerCommandHandler(commandType, handler) {
        if (this.commandHandlers.has(commandType)) {
            this.logger.warn(`Overwriting existing handler for command type: ${commandType}`);
        }
        this.commandHandlers.set(commandType, handler.bind(this));
        this.logger.info(`Registered handler for command type: ${commandType}`);
    }
    async process(message) {
        if (!this.messageValidator.validate(message) || message.type !== types_1.MessageType.COMMAND) {
            this.logger.debug(`Skipping message ${message.id}: Not a valid command type.`);
            return null;
        }
        const command = message.content;
        const handler = this.commandHandlers.get(command.commandType);
        if (!handler) {
            this.logger.warn(`No handler registered for command type: ${command.commandType} (Command ID: ${command.id || message.id})`);
            return {
                id: `result_${command.id || message.id}`,
                commandId: command.id || message.id,
                status: 'error',
                error: `Command type "${command.commandType}" not supported by this agent.`,
                timestamp: new Date(),
            };
        }
        this.logger.info(`Processing command ${command.id || message.id} (Type: ${command.commandType})...`);
        try {
            const result = await handler(command, this.agentId);
            this.logger.info(`Command ${command.id || message.id} processed with status: ${result.status}`);
            if (message.senderAgentId) {
                await this.chatService.sendMessage(message.senderAgentId, result, types_1.MessageType.COMMAND_RESULT);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Error executing handler for command ${command.commandType} (ID: ${command.id || message.id}): ${error.message}`);
            return {
                id: `result_${command.id || message.id}`,
                commandId: command.id || message.id,
                status: 'error',
                error: `Internal error processing command: ${error.message}`,
                timestamp: new Date(),
            };
        }
    }
    async handlePing(command, agentId) {
        this.logger.debug(`Handling 'ping' command (ID: ${command.id})`);
        const pingTimestamp = await this.redisService.get(`agent:${agentId}:last_ping`);
        return {
            id: `result_${command.id}`,
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
    async handleGetStatus(command, agentId) {
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
            status: 'success',
            result: status,
            timestamp: new Date(),
        };
    }
    async handleCancelTask(command, agentId) {
        this.logger.debug(`Handling 'cancel_task' command (ID: ${command.id})`);
        const taskId = command.payload?.taskId;
        if (!taskId) {
            return {
                id: `result_${command.id}`,
                commandId: command.id,
                status: 'error',
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
                message: success ? `Task ${taskId} cancelled.` : `Task ${taskId} not found or already cancelled.`,
            },
            timestamp: new Date(),
        };
    }
}
exports.CommandProcessor = CommandProcessor;
//# sourceMappingURL=CommandProcessor.js.map