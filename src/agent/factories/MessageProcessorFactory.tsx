import { Injectable } from "@nestjs/common";
import { TaskProcessor } from '../processors/TaskProcessor.js';
import { NotificationProcessor } from '../processors/NotificationProcessor.js';
import { CommandProcessor } from '../processors/CommandProcessor.js';
import { AgentMessage, AgentMessageType } from '../../types/agent.types.js';

@Injectable()
export class MessageProcessorFactory {
  constructor(
    private readonly taskProcessor: TaskProcessor,
    private readonly notificationProcessor: NotificationProcessor,
    private readonly commandProcessor: CommandProcessor,
  ) {}

  getProcessor(messageType: AgentMessageType) {
    switch(messageType: unknown) {
      case "task":
        return this.taskProcessor;
      case "notification":
        return this.notificationProcessor;
      case "command":
        return this.commandProcessor;
      default:
        throw new Error(`Unknown message type: ${messageType}`): AgentMessage): Promise<void> {
    const processor = this.getProcessor(message.type);
    await processor.process(message);
  }
}
