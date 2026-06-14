var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ErrorHandler_1;
import { Injectable, Logger } from '@nestjs/common';
import { ErrorHandlingService } from './ErrorHandlingService.js';
import { ErrorRecoveryService } from './ErrorRecoveryService.js';
import { ErrorReportingService } from './error-reporting.service.js';
let ErrorHandler = ErrorHandler_1 = class ErrorHandler {
    constructor(errorHandlingService, errorRecoveryService, errorReportingService) {
        this.errorHandlingService = errorHandlingService;
        this.errorRecoveryService = errorRecoveryService;
        this.errorReportingService = errorReportingService;
        this.logger = new Logger(ErrorHandler_1.name);
    }
    async handle(error, context = {}) {
        this.logger.error(`Handling error: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        this.errorHandlingService.handle(error, context);
        await this.errorRecoveryService.handle(error, context);
        this.errorReportingService.report(error, context);
    }
};
ErrorHandler = ErrorHandler_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ErrorHandlingService,
        ErrorRecoveryService,
        ErrorReportingService])
], ErrorHandler);
export { ErrorHandler };
//# sourceMappingURL=error-handler.js.map