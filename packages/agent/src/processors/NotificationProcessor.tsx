import { BaseProcessor } from './BaseProcessor.js'; // Assuming a BaseProcessor exists
import { Logger } from '@packages/utils';
import { Message, MessageType, Notification, UUID } from '@packages/types';
import { AlertService } from '../services/AlertService.js'; // Corrected import
// Import other necessary services or types (e.g., UI update service, logging service)

/**
 * Processes incoming notification messages for an agent.
 * Notifications are typically informational and may trigger alerts or UI updates.
 */
export class NotificationProcessor extends BaseProcessor {
  protected logger: Logger;
  private alertService: AlertService; // Example service dependency
  private agentId: UUID;

  constructor(
    agentId: UUID,
    alertService: AlertService
    // Inject other dependencies (e.g., WebSocket service for UI updates)
  ) {
    super();
    this.agentId = agentId;
    this.logger = new Logger(`NotificationProcessor [Agent ${this.agentId}]`);
    this.alertService = alertService;

    this.logger.info('NotificationProcessor initialized.');
  }

  /**
   * Processes an incoming message, expecting it to be a notification.
   * @param message The incoming message.
   * @returns A Promise resolving to void or null if the message is not a notification.
   */
  async process(message: Message): Promise<void | null> {
    if (message.type !== MessageType.NOTIFICATION || typeof message.content !== 'object' || message.content === null) {
      this.logger.debug(`Skipping message ${message.id}: Not a valid notification type.`);
      return null;
    }

    // TODO: Add validation using MessageValidator service if available
    const notification = message.content as Notification; // Type assertion, consider validation

    if (!notification.level || !notification.text) {
        this.logger.warn(`Received notification message ${message.id} with missing level or text.`);
        // Optionally generate a fallback alert
        await this.alertService.warn(
            `Received incomplete notification: ${JSON.stringify(notification)}`,
            `Agent ${this.agentId} / NotificationProcessor`,
            { originalMessageId: message.id }
        );
        return; // Stop processing incomplete notification
    }

    this.logger.log(
        notification.level === 'error' || notification.level === 'critical' ? 'error' :
        notification.level === 'warning' ? 'warn' : 'info',
        `Processing notification ${message.id}: [${notification.level.toUpperCase()}] ${notification.title || ''} - ${notification.text}`,
        { details: notification.details, source: notification.source }
    );

    try {
      // Action 1: Dispatch as an alert using AlertService
      // Map notification level to alert severity
      let alertSeverity: 'info' | 'warning' | 'error' | 'critical';
      switch (notification.level) {
        case 'critical':
          alertSeverity = 'critical';
          break;
        case 'error':
          alertSeverity = 'error';
          break;
        case 'warning':
          alertSeverity = 'warning';
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

      // Action 2: Potentially forward to UI via WebSocket or other mechanism
      // Example:
      // if (this.uiUpdateService) {
      //   await this.uiUpdateService.sendNotification({ ...notification, id: message.id });
      // }

      // Action 3: Log persistently if needed (beyond console logging)
      // Example:
      // await this.persistentLogService.logNotification(this.agentId, notification);

      this.logger.debug(`Notification ${message.id} processed successfully.`);

    } catch (error) {
      this.logger.error(`Error processing notification ${message.id}: ${error.message}`, error);
      // Optionally, create a fallback alert about the processing failure
      await this.alertService.error(
          `Failed to process notification ${message.id}`,
          `Agent ${this.agentId} / NotificationProcessor`,
          { error: error.message, originalNotification: notification }
      );
    }
  }
}
