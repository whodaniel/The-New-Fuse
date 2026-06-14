var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ErrorRecoveryService_1;
import { Injectable, Logger } from '@nestjs/common';
let ErrorRecoveryService = ErrorRecoveryService_1 = class ErrorRecoveryService {
    constructor() {
        this.logger = new Logger(ErrorRecoveryService_1.name);
        this.strategies = [];
    }
    registerStrategy(strategy) {
        this.logger.log(`Registering recovery strategy: ${strategy.constructor.name}`);
        this.strategies.push(strategy);
    }
    async handle(error, context = {}) {
        this.logger.error(`Handling error for recovery: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        for (const strategy of this.strategies) {
            if (strategy.canHandle(error)) {
                await strategy.handle(error, context);
                return;
            }
        }
        this.logger.warn(`No recovery strategy found for error: ${error.message}`);
    }
};
ErrorRecoveryService = ErrorRecoveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ErrorRecoveryService);
export { ErrorRecoveryService };
//# sourceMappingURL=ErrorRecoveryService.js.map