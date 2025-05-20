import { TaskProcessor } from '../processors/TaskProcessor.js';
import { NotificationProcessor } from '../processors/NotificationProcessor.js';
import { CommandProcessor } from '../processors/CommandProcessor.js';
export declare class MessageProcessorFactory {
  private readonly taskProcessor;
  private readonly notificationProcessor;
  private readonly commandProcessor;
  constructor(
    taskProcessor: TaskProcessor,
    notificationProcessor: NotificationProcessor,
    commandProcessor: CommandProcessor,
  );
  getProcessor(
    messageType: AgentMessageType,
  ): TaskProcessor | NotificationProcessor | CommandProcessor;
  processMessage(message: AgentMessage): Promise<void>;
}
