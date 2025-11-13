"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const BaseProcessor_1 = require("./BaseProcessor"); // Assuming a BaseProcessor exists
const common_1 = require("@nestjs/common");
// Import other necessary services or types (e.g., UI update service, logging service)
/**
 * Processes incoming notification messages for an agent.
 * Notifications are typically informational and may trigger alerts or UI updates.
 */
class NotificationProcessor extends BaseProcessor_1.BaseProcessor {
    logger;
    alertService; // Example service dependency
    agentId;
    constructor(agentId, alertService
    // Inject other dependencies (e.g., WebSocket service for UI updates)
    ) {
        super();
        this.agentId = agentId;
        this.logger = new common_1.Logger(`NotificationProcessor [Agent ${this.agentId}]);
    this.alertService = alertService;

    this.logger.log('NotificationProcessor initialized.');
  }

  /**
   * Processes an incoming message, expecting it to be a notification.
   * @param message The incoming message.
   * @returns A Promise resolving to void or null if the message is not a notification.
   */
  async process(message: Message): Promise<void | null> {
    if (message.type !== MessageType.NOTIFICATION || typeof message.content !== 'object' || message.content === null) {`, this.logger.debug(`Skipping message ${message.id}`, Not, a, valid, notification, type.));
        return null;
    }
    // TODO: Add validation using MessageValidator service if available
    notification = message.content; // Type assertion, consider validation
    if(, notification, level) { }
}
exports.NotificationProcessor = NotificationProcessor;
 || !notification.text;
{
    this.logger.warn(Received, notification, message, $, { message, : .id });
    with (missing)
        level;
    or;
    text.;
    ;
    // Optionally generate a fallback alert
    await this.alertService.warn(`
            Received incomplete notification: ${JSON.stringify(notification)}`, Agent, $, { this: .agentId } / NotificationProcessor, { originalMessageId: message.id });
    return; // Stop processing incomplete notification`
}
`

    const logMessage = Processing notification ${message.id}`;
[$, { notification, : .level.toUpperCase() }];
$;
{
    notification.title || '';
}
-$;
{
    notification.text;
}
;
if (notification.level === 'error') {
    this.logger.error(logMessage);
}
else if (notification.level === 'warning') {
    this.logger.warn(logMessage);
}
else {
    this.logger.log(logMessage);
}
try {
    // Action 1: Dispatch as an alert using AlertService
    // Map notification level to alert severity
    let alertSeverity;
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
    `
      await this.alertService.dispatchAlert({`;
    severity: alertSeverity,
        message;
    notification.title ? $ : ;
    {
        notification.title;
    }
    $;
    {
        notification.text;
    }
    ` : notification.text,
        source: notification.source || Agent ${this.agentId},
        details: { ...(notification.details || {}), originalMessageId: message.id },
      });

      // Action 2: Potentially forward to UI via WebSocket or other mechanism
      // Example:
      // if (this.uiUpdateService) {
      //   await this.uiUpdateService.sendNotification({ ...notification, id: message.id });
      // }

      // Action 3: Log persistently if needed (beyond console logging)
      // Example:`;
    // await this.persistentLogService.logNotification(this.agentId, notification);`
    this.logger.debug(Notification, $, { message, : .id } ` processed successfully.);

    } catch (error) {
      this.logger.error(Error processing notification ${message.id}: ${error.message}`);
    // Optionally, create a fallback alert about the processing failure
    await this.alertService.error(Failed, to, process, notification, $, { message, : .id }, `
          Agent ${this.agentId} / NotificationProcessor`, { error: error.message, originalNotification: notification });
}
finally {
}
//# sourceMappingURL=NotificationProcessor.js.map