import { BaseProcessor } from './BaseProcessor'; // Assuming a BaseProcessor exists
import { Logger } from '@the-new-fuse/core';
import { Message, MessageType, Notification, UUID } from '@the-new-fuse/types';
import { AlertService } from '../services/AlertService';
import { MessageValidator } from '../services/MessageValidator';

/**
 * Processes incoming notification messages for an agent.
 * Notifications are typically informational and may trigger alerts or UI updates.
 */
export class NotificationProcessor extends BaseProcessor {
  protected logger: Logger;
  private alertService: AlertService;
  private messageValidator: MessageValidator;
  private agentId: UUID;

  constructor(
    agentId: UUID,
    alertService: AlertService,
    messageValidator: MessageValidator
  ) {
    super();
    this.agentId = agentId;
    this.logger = new Logger(`NotificationProcessor [Agent ${this.agentId}]`);
    this.alertService = alertService;
    this.messageValidator = messageValidator;

    this.logger.info('NotificationProcessor initialized.');
  }

  /**
   * Processes an incoming message, expecting it to be a notification.
   * @param message The incoming message.
   * @returns A Promise resolving to void or null if the message is not a notification.
   */
  async process(message: Message): Promise<void | null> {
    const { isValid, errors } = this.messageValidator.validate(message);
    if (!isValid) {
      this.logger.warn(`Invalid message received: ${errors.join(', ')}`);
      await this.alertService.warn(
        `Received an invalid message: ${errors.join(', ')}`,
        `Agent ${this.agentId} / NotificationProcessor`,
        { originalMessageId: message.id }
      );
      return;
    }

    if (message.type !== MessageType.NOTIFICATION || typeof message.content !== 'object' || message.content === null) {
      this.logger.debug(`Skipping message ${message.id}: Not a valid notification type.`);
      return null;
    }

    const notification = message.content as Notification;

    const logMessage = `Processing notification ${message.id}: [${notification.level.toUpperCase()}] ${notification.title || ''} - ${notification.text}`;

    if (notification.level === 'error') {
      this.logger.error(logMessage);
    } else if (notification.level === 'warning') {
      this.logger.warn(logMessage);
    } else {
      this.logger.info(logMessage);
    }

    try {
      let alertSeverity: 'info' | 'warning' | 'error' | 'critical';
      switch (notification.level) {
        case 'error':
          alertSeverity = 'error';
          break;
        case 'warning':
          alertSeverity = 'warning';
          break;
        case 'success':
          alertSeverity = 'info';
          break;
        case 'info':
        default:
          alertSeverity = 'info';
          break;
      }

      await this.alertService.dispatchAlert({
        severity: alertSeverity,
        message: notification.title ? `${notification.title}: ${notification.text}` : notification.text,
        source: notification.source || `Agent ${this.agentId}`,
        details: { ...(notification.details || {}), originalMessageId: message.id },
      });

      this.logger.debug(`Notification ${message.id} processed successfully.`);

    } catch (error) {
      this.logger.error(`Error processing notification ${message.id}: ${(error as Error).message}`);
      await this.alertService.error(
          `Failed to process notification ${message.id}`,
          `Agent ${this.agentId} / NotificationProcessor`,
          { error: (error as Error).message, originalNotification: notification }
      );
    }
  }
}
