var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingService_1;
import { Injectable, Logger } from '@nestjs/common';
let LoggingService = LoggingService_1 = class LoggingService {
    logger = new Logger(LoggingService_1.name);
    info(message, context) {
        this.logger.log(message, context);
    }
    error(message, trace, context) {
        this.logger.error(message, trace, context);
    }
    warn(message, context) {
        this.logger.warn(message, context);
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
    verbose(message, context) {
        this.logger.verbose(message, context);
    }
};
LoggingService = LoggingService_1 = __decorate([
    Injectable()
], LoggingService);
export { LoggingService };
//# sourceMappingURL=logging.service.js.map