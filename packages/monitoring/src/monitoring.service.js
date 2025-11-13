var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
var _a, _b, _c, _d;
import { Injectable, Logger } from '@nestjs/common';
import { AlertService } from './alerts/alert.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { ErrorTrackingService } from './error-tracking.service';
import { SecurityLoggingService } from './security-logging.service';
let MonitoringService = MonitoringService_1 = class MonitoringService {
    alertService;
    performanceService;
    errorTracking;
    securityLogging;
    logger = new Logger(MonitoringService_1.name);
    constructor(alertService, performanceService, errorTracking, securityLogging) {
        this.alertService = alertService;
        this.performanceService = performanceService;
        this.errorTracking = errorTracking;
        this.securityLogging = securityLogging;
    }
    async initialize() {
        await Promise.all([
            this.alertService.initialize(),
            this.performanceService.initialize(),
            this.errorTracking.initialize(),
            this.securityLogging.initialize()
        ]);
        this.logger.log('Monitoring service initialized');
    }
    async trackMetric(name, value, tags = {}) {
        await this.performanceService.trackMetric(name, value, tags);
    }
    async trackError(error, context = {}) {
        await this.errorTracking.trackError(error, context);
    }
    async logSecurityEvent(event, data = {}) {
        await this.securityLogging.logEvent(event, data);
    }
    async createAlert(type, message, severity) {
        await this.alertService.createAlert(type, message, severity);
    }
};
MonitoringService = MonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AlertService !== "undefined" && AlertService) === "function" ? _a : Object, typeof (_b = typeof PerformanceMonitoringService !== "undefined" && PerformanceMonitoringService) === "function" ? _b : Object, typeof (_c = typeof ErrorTrackingService !== "undefined" && ErrorTrackingService) === "function" ? _c : Object, typeof (_d = typeof SecurityLoggingService !== "undefined" && SecurityLoggingService) === "function" ? _d : Object])
], MonitoringService);
export { MonitoringService };
//# sourceMappingURL=monitoring.service.js.map