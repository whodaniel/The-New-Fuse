"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const BaseService_1 = require("../core/BaseService"); // Corrected import path assuming BaseService is in core
const common_1 = require("@nestjs/common");
/**
 * Service responsible for handling and dispatching alerts.
 */
class AlertService extends BaseService_1.BaseService {
    channels = [];
    logger;
    constructor() {
        super({ name: 'AlertService' });
        this.logger = new common_1.Logger('AlertService');
        // TODO: Initialize alert channels (e.g., email, Slack, PagerDuty) based on config
        this.logger.log('AlertService initialized.');
    }
    registerChannel(channel) {
        this.channels.push(channel);
        this.logger.log(`Registered alert channel: ${channel.constructor.name});
  }

  async dispatchAlert(payload: AlertPayload): Promise<void> {
    if (payload.severity === 'info') {`, this.logger.log(`Dispatching alert: ${payload.message}`));
    }
    if(payload, severity) { }
}
exports.AlertService = AlertService;
 === 'warning';
{
    this.logger.warn(Dispatching, alert, $, { payload, : .message });
}
{
    `
      this.logger.error(Dispatching alert: ${payload.message}`;
    ;
}
const dispatchPromises = this.channels.map(channel => channel.send(payload).catch(error => {
    this.logger.error(Failed, to, send, alert, via, $, { channel, : .constructor.name }, $, { error, : .message } `);
        // Optionally, implement retry logic or fallback channels
      })
    );

    await Promise.all(dispatchPromises);
  }

  // Example usage methods
  info(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'info', message, source, details });
  }

  warn(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'warning', message, source, details });
  }

  error(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'error', message, source, details });
  }

  critical(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'critical', message, source, details });
  }
}

// Example simple console alert channel
export class ConsoleAlertChannel implements AlertChannel {
  async send(): Promise<void> {
    
  }
}
    );
}));
//# sourceMappingURL=AlertService.js.map