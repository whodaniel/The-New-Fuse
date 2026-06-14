var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ErrorMonitoringService_1;
import { Injectable, Logger } from '@nestjs/common';
let ErrorMonitoringService = ErrorMonitoringService_1 = class ErrorMonitoringService {
    constructor() {
        this.logger = new Logger(ErrorMonitoringService_1.name);
    }
    captureError(error, context = {}) {
        this.logger.error(`Capturing error: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        // This is a placeholder for a more robust implementation that would send
        // this error to a service like Sentry, Bugsnag, or a custom error tracking system.
    }
};
ErrorMonitoringService = ErrorMonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ErrorMonitoringService);
export { ErrorMonitoringService };
//# sourceMappingURL=error-monitoring.service.js.map