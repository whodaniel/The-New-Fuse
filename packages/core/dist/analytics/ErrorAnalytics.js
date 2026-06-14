var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let ErrorAnalytics = class ErrorAnalytics {
    constructor() {
        this.errors = [];
        this.maxStoredErrors = 10000;
    }
    trackError(type, message, severity, stack, metadata) {
        const errorEvent = {
            type,
            message,
            severity,
            timestamp: new Date(),
            stack,
            metadata
        };
        this.errors.push(errorEvent);
        // Keep only the most recent errors to prevent memory issues
        if (this.errors.length > this.maxStoredErrors) {
            this.errors = this.errors.slice(-this.maxStoredErrors);
        }
    }
    getMetrics(timeWindowMinutes = 60) {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
        const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
        const errorTypes = {};
        let criticalErrors = 0;
        recentErrors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
            if (error.severity === 'critical') {
                criticalErrors++;
            }
        });
        return {
            errorCount: recentErrors.length,
            errorRate: recentErrors.length / timeWindowMinutes, // per minute
            lastError: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].timestamp : undefined,
            errorTypes,
            averageErrorsPerHour: (recentErrors.length / timeWindowMinutes) * 60,
            criticalErrors
        };
    }
    getRecentErrors(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.errors.filter(e => e.timestamp > cutoff);
    }
    getErrorsByType(type, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.errors.filter(e => e.type === type && e.timestamp > cutoff);
    }
    getCriticalErrors(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.errors.filter(e => e.severity === 'critical' && e.timestamp > cutoff);
    }
    clearOldErrors(olderThanHours = 168) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        this.errors = this.errors.filter(e => e.timestamp > cutoff);
    }
    getTotalErrorCount() {
        return this.errors.length;
    }
};
ErrorAnalytics = __decorate([
    Injectable()
], ErrorAnalytics);
export { ErrorAnalytics };
//# sourceMappingURL=ErrorAnalytics.js.map