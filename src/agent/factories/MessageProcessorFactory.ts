import { Injectable } from '@nestjs/common';
import { AgentMessage, AgentMessageType } from '../../types/agent.types';
import { CommandProcessor } from '../processors/CommandProcessor';
import { NotificationProcessor } from '../processors/NotificationProcessor';
import { TaskProcessor } from '../processors/TaskProcessor';

@Injectable()
export class MessageProcessorFactory {
  constructor(
    private readonly taskProcessor: TaskProcessor,
    private readonly notificationProcessor: NotificationProcessor,
    private readonly commandProcessor: CommandProcessor
  ) {}

  getProcessor(messageType: AgentMessageType) {
    switch (messageType) {
      case 'task':
        return this.taskProcessor;
      case 'notification':
        return this.notificationProcessor;
      case 'command':
        return this.commandProcessor;
      default:
        throw new Error(`Unknown message type: ${messageType}`);
    }
  }

  async process(message: AgentMessage): Promise<void> {
    const processor = this.getProcessor(message.type);
    await processor.process(message);
  }
}
