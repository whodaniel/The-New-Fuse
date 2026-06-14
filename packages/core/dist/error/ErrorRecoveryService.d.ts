import { BaseRecoveryStrategy } from './strategies/BaseRecoveryStrategy.js';
export declare class ErrorRecoveryService {
    private readonly logger;
    private readonly strategies;
    constructor();
    registerStrategy(strategy: BaseRecoveryStrategy): void;
    handle(error: Error, context?: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=ErrorRecoveryService.d.ts.map