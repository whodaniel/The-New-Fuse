import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import { AgentMessage, AgentMessageType } from '../../types/agent.types.js';

const MessageSchema = z.object({
  id: z.string().nonempty(),
  type: z.enum(["task", "notification", "command"]),
  content: z.unknown(),
  timestamp: z.string().datetime(),
  priority: z.enum(["high", "normal", "low"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

@Injectable()
export class MessageValidator {
  private readonly logger = new Logger(MessageValidator.name);

  validateMessage(message: unknown): AgentMessage {
    try {
      const validatedMessage = MessageSchema.parse(message);

      // Additional type-specific validation
      switch (validatedMessage.type) {
        case "task":
          this.validateTaskContent(validatedMessage.content);
          break;
        case "notification":
          this.validateNotificationContent(validatedMessage.content);
          break;
        case "command":
          this.validateCommandContent(validatedMessage.content);
          break;
      }

      return validatedMessage;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Invalid message format: ${details}`);
      }
      throw error;
    }
  }

  private validateTaskContent(content: unknown): void {
    const TaskContentSchema = z.object({
      taskId: z.string().nonempty(),
      params: z.record(z.unknown()).optional(),
    });

    try {
      TaskContentSchema.parse(content);
    } catch (error) {
      throw new Error("Invalid task content format");
    }
  }

  private validateNotificationContent(content: unknown): void {
    const NotificationContentSchema = z.object({
      message: z.string().nonempty(),
      level: z.enum(["info", "warning", "error"]).optional(),
    });

    try {
      NotificationContentSchema.parse(content);
    } catch (error) {
      throw new Error("Invalid notification content format");
    }
  }

  private validateCommandContent(content: unknown): void {
    const CommandContentSchema = z.object({
      command: z.string().nonempty(),
      args: z.array(z.unknown()).optional(),
    });

    try {
      CommandContentSchema.parse(content);
    } catch (error) {
      throw new Error("Invalid command content format");
    }
  }

  isValidMessageType(type: string): type is AgentMessageType {
    return ["task", "notification", "command"].includes(type);
  }
}
