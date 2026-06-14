var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ErrorTrackingService_1;
import { Injectable, Logger } from '@nestjs/common';
let ErrorTrackingService = ErrorTrackingService_1 = class ErrorTrackingService {
    constructor() {
        this.logger = new Logger(ErrorTrackingService_1.name);
    }
    captureException(error, context = {}) {
        this.logger.error(`Capturing exception: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        // This is a placeholder for a more robust implementation that would send
        // this error to a service like Sentry, Bugsnag, or a custom error tracking system.
    }
};
ErrorTrackingService = ErrorTrackingService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ErrorTrackingService);
export { ErrorTrackingService };
//# sourceMappingURL=ErrorTrackingService.js.map