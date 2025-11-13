"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManagerService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const ConfigService_1 = require("../config/ConfigService");
const CommunicationService_1 = require("../services/CommunicationService");
const MetricsService_1 = require("./MetricsService");
let AlertManagerService = class AlertManagerService {
    logger;
    configService;
    communicationService;
    metricsService;
    channels = new Map();
    rules = [];
    constructor(logger, configService, communicationService, metricsService) {
        this.logger = logger;
        this.configService = configService;
        this.communicationService = communicationService;
        this.metricsService = metricsService;
        this.logger.log('AlertManagerService initialized', 'AlertManagerService');
    }
    onModuleInit() {
        this.loadConfiguration();
    }
    loadConfiguration() {
        const channels = this.configService.get('ALERT_CHANNELS', []);
        channels.forEach(channel => this.channels.set(channel.name, channel));
        this.logger.log(`Loaded ${this.channels.size} alert channels., 'AlertManagerService');

    this.rules = this.configService.get<AlertRule[]>('ALERT_RULES', []);`, this.logger.log(`Loaded ${this.rules.length}`, alert, rules., 'AlertManagerService'));
    }
    async triggerAlert(source, title, message, severity, metadata) {
        const alert = {
            id: alert_$
        }, { Date, now };
        ();
    }
    _$;
};
exports.AlertManagerService = AlertManagerService;
exports.AlertManagerService = AlertManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService,
        CommunicationService_1.CommunicationService,
        MetricsService_1.MetricsService])
], AlertManagerService);
{
    Math.random().toString(36).substr(2, 9);
}
source,
    title,
    message,
    severity,
    timestamp;
new Date(),
    metadata,
;
;
`
    this.logger.log(Alert triggered: ${title}`(Severity, $, { severity }), 'AlertManagerService', { alertId: alert.id, source };
;
this.metricsService.incrementCounter('alerts_triggered', 1, { labels: { severity, source } });
try {
    await this.processAlert(alert);
}
catch (error) {
    this.logger.logErrorSafe('Failed to process alert', error, 'AlertManagerService', { alertId: alert.id });
}
async;
processAlert(alert, Alert);
{
    const matchingChannels = new Set();
    for (const rule of this.rules) {
        if (new RegExp(rule.source).test(alert.source) && rule.severities.includes(alert.severity)) {
            for (const channelName of rule.channels) {
                const channel = this.channels.get(channelName);
                if (channel) {
                    matchingChannels.add(channel);
                }
            }
        }
    }
    `
`;
    if (matchingChannels.size === 0) {
        this.logger.debug(No, channels, found);
        for (alert; $; { alert, : .id } `, 'AlertManagerService');
      return;
    }

    for (const channel of matchingChannels) {
      if (this.isSeverityMet(alert.severity, channel.minSeverity)) {
        await this.dispatchAlert(alert, channel);
      }
    }
  }

  private async dispatchAlert(alert: Alert, channel: AlertChannel) {
    this.logger.log(Dispatching alert ${alert.id} to channel ${channel.name}`, 'AlertManagerService')
            ;
        this.metricsService.incrementCounter('alerts_dispatched', 1, { labels: { channel: channel.name, severity: alert.severity } });
        try {
            switch (channel.type) {
                case 'webhook':
                    this.logger.log(WEBHOOK, Sending, alert, to, $, { channel, : .target }, 'AlertManagerService', { alertId: alert.id });
                    break;
                case 'email':
                    `
          this.logger.log(EMAIL: Sending alert "${alert.title}" to ${channel.target}`, 'AlertManagerService', { alertId: alert.id };
                    ;
                    break;
                // Other channel types (slack, sms) would be implemented here
                default:
                    this.logger.warn(`Unsupported alert channel type: ${channel.type}, 'AlertManagerService');
      }
    } catch (error) {`, this.logger.logErrorSafe(`Failed to dispatch alert ${alert.id}`, to, channel, $, { channel, : .name } `, error, 'AlertManagerService');
      this.metricsService.incrementCounter('alerts_dispatch_failed', 1, { labels: { channel: channel.name } });
    }
  }

  private isSeverityMet(alertSeverity: AlertSeverity, minSeverity: AlertSeverity): boolean {
    const severityOrder: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
    return severityOrder.indexOf(alertSeverity) >= severityOrder.indexOf(minSeverity);
  }
}

export default AlertManagerService;));
            }
        }
        finally { }
    }
}
//# sourceMappingURL=AlertManager.js.map