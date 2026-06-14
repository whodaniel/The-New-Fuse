var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AlertManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { AlertService } from './alerts/AlertService.js';
let AlertManager = AlertManager_1 = class AlertManager {
    constructor(alertService) {
        this.alertService = alertService;
        this.logger = new Logger(AlertManager_1.name);
        this.alerts = [];
    }
    createAlert(alert) {
        this.logger.log(`Creating alert: ${alert.name}`);
        this.alerts.push(alert);
    }
    checkAlerts() {
        this.logger.debug('Checking alerts...');
        for (const alert of this.alerts) {
            if (alert.condition()) {
                this.alertService.sendAlert(alert.name, alert.message, 'warning');
            }
        }
    }
};
AlertManager = AlertManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AlertService])
], AlertManager);
export { AlertManager };
//# sourceMappingURL=AlertManager.js.map