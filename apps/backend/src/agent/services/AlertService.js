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
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
let AlertService = class AlertService {
    configService;
    eventEmitter;
    constructor(configService, eventEmitter) {
        this.configService = configService;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Send a system alert
     */
    sendAlert(alertType, message, severity = 'info', metadata = {}) {
        const alert = {
            type: alertType,
            message,
            severity,
            timestamp: new Date(),
            metadata,
        };
        // Emit event for alert handlers
        this.eventEmitter.emit('system.alert', alert);
        // Log critical alerts to console as well
        if (severity === 'critical' || severity === 'error') {
            console.error(`[ALERT] ${alertType}: ${message}`);
        }
    }
    /**
     * Send an info level alert
     */
    info(alertType, message, metadata = {}) {
        this.sendAlert(alertType, message, 'info', metadata);
    }
    /**
     * Send a warning level alert
     */
    warning(alertType, message, metadata = {}) {
        this.sendAlert(alertType, message, 'warning', metadata);
    }
    /**
     * Send an error level alert
     */
    error(alertType, message, metadata = {}) {
        this.sendAlert(alertType, message, 'error', metadata);
    }
    /**
     * Send a critical level alert
     */
    critical(alertType, message, metadata = {}) {
        this.sendAlert(alertType, message, 'critical', metadata);
    }
    /**
     * Check if alerts should be sent based on environment
     */
    shouldSendAlerts() {
        const environment = this.configService.get('NODE_ENV');
        const alertsEnabled = this.configService.get('ALERTS_ENABLED');
        // Default to enabled for production, disabled for development/test
        if (alertsEnabled !== undefined) {
            return alertsEnabled === 'true';
        }
        return environment === 'production';
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        event_emitter_1.EventEmitter2])
], AlertService);
