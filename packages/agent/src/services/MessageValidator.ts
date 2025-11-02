import { Message, MessageType, Command, Notification } from '@the-new-fuse/types';

export class MessageValidator {
  validate(message: Message): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.id) errors.push('Message ID is missing.');
    if (!message.type) errors.push('Message type is missing.');
    if (!message.content) errors.push('Message content is missing.');
    if (!message.timestamp) errors.push('Message timestamp is missing.');

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    switch (message.type) {
      case MessageType.COMMAND:
        return this.validateCommand(message.content as Command);
      case MessageType.NOTIFICATION:
        return this.validateNotification(message.content as Notification);
      // Add other message type validations here
      default:
        return { isValid: true, errors: [] };
    }
  }

  private validateCommand(command: Command): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!command.name) errors.push('Command name is missing.');
    return { isValid: errors.length === 0, errors };
  }

  private validateNotification(notification: Notification): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!notification.level) errors.push('Notification level is missing.');
    if (!notification.text) errors.push('Notification text is missing.');
    return { isValid: errors.length === 0, errors };
  }
}
