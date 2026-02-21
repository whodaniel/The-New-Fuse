import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AgentMessage } from '../../types/agent.types.js';

interface CommandResult {
  messageId: string;
  timestamp: string;
  status: "success" | "error";
  error?: string;
}

@Injectable()
export class CommandProcessor {
  private readonly logger = new Logger(CommandProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async process(message: AgentMessage): Promise<void> {
    this.logger.debug(`Processing command: ${message.id}`);

    try {
      await this.executeCommand(message);

      const result: CommandResult = {
        messageId: message.id,
        timestamp: new Date().toISOString(),
        status: "success",
      };

      this.eventEmitter.emit("agent.command.processed", result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Command processing failed: ${errorMessage}`);

      const result: CommandResult = {
        messageId: message.id,
        timestamp: new Date().toISOString(),
        status: "error",
        error: errorMessage,
      };

      this.eventEmitter.emit("agent.command.error", result);
      throw error;
    }
  }

  private async executeCommand(message: AgentMessage): Promise<void> {
    const { content, metadata } = message;

    if (!content) {
      throw new Error("Command content is required");
    }

    // Implement command execution logic here
    // For example:
    switch (content.command) {
      case "start":
        await this.handleStartCommand(content.params);
        break;
      case "stop":
        await this.handleStopCommand(content.params);
        break;
      default:
        throw new Error(`Unknown command: ${content.command}`);
    }
  }

  private async handleStartCommand(params: unknown): Promise<void> {
    // Implement start command logic
  }

  private async handleStopCommand(params: unknown): Promise<void> {
    // Implement stop command logic
  }
}
