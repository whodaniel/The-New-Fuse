"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleAlertChannel = exports.AlertService = void 0;
const BaseService_1 = require("../core/BaseService");
const core_1 = require("../types/core");
const uuid_1 = require("uuid");
class AlertService extends BaseService_1.BaseService {
    constructor() {
        super({ name: 'AlertService' });
        this.channels = [];
        this.logger = new core_1.Logger('AlertService');
        this.registerChannel(new ConsoleAlertChannel());
        this.logger.info('AlertService initialized.');
    }
    registerChannel(channel) {
        this.channels.push(channel);
        this.logger.info(`Registered alert channel: ${channel.constructor.name}`);
    }
    async dispatchAlert(payload) {
        const alert = {
            ...payload,
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
        };
        if (alert.severity === 'info') {
            this.logger.info(`Dispatching alert: ${alert.message}`);
        }
        else if (alert.severity === 'warning') {
            this.logger.warn(`Dispatching alert: ${alert.message}`);
        }
        else {
            this.logger.error(`Dispatching alert: ${alert.message}`);
        }
        const dispatchPromises = this.channels.map(channel => channel.send(alert).catch(error => {
            this.logger.error(`Failed to send alert via ${channel.constructor.name}: ${error.message}`);
        }));
        await Promise.all(dispatchPromises);
    }
    info(message, source, details) {
        return this.dispatchAlert({ severity: 'info', message, source, details });
    }
    warn(message, source, details) {
        return this.dispatchAlert({ severity: 'warning', message, source, details });
    }
    error(message, source, details) {
        return this.dispatchAlert({ severity: 'error', message, source, details });
    }
    critical(message, source, details) {
        return this.dispatchAlert({ severity: 'critical', message, source, details });
    }
}
exports.AlertService = AlertService;
class ConsoleAlertChannel {
    constructor() {
        this.logger = new core_1.Logger(ConsoleAlertChannel.name);
    }
    async send(alert) {
        const logMessage = `[${alert.severity.toUpperCase()}] - ${alert.message} - Source: ${alert.source || 'Unknown'}`;
        this.logger.log(logMessage, alert.details);
    }
}
exports.ConsoleAlertChannel = ConsoleAlertChannel;
//# sourceMappingURL=AlertService.js.map