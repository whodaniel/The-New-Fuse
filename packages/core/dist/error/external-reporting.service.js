var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExternalReportingService_1;
import { Injectable, Logger } from '@nestjs/common';
let ExternalReportingService = ExternalReportingService_1 = class ExternalReportingService {
    constructor() {
        this.logger = new Logger(ExternalReportingService_1.name);
    }
    report(error, context = {}) {
        this.logger.error(`Reporting error to external service: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        // This is a placeholder for a more robust implementation that would
        // send the error to a remote service like Sentry, Bugsnag, or a
        // custom error reporting system.
    }
};
ExternalReportingService = ExternalReportingService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ExternalReportingService);
export { ExternalReportingService };
//# sourceMappingURL=external-reporting.service.js.map