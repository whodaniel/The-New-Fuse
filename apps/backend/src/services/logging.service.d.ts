import { LoggerService } from '@nestjs/common';
export declare class LoggingService implements LoggerService {
    private coreLogger;
    private context;
    constructor();
    setContext(context: string): void;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
}
//# sourceMappingURL=logging.service.d.ts.map