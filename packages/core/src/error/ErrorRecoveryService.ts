import { Injectable, Logger } from '@nestjs/common';
import { BaseRecoveryStrategy } from './strategies/BaseRecoveryStrategy.js';

@Injectable()
export class ErrorRecoveryService {
    private readonly logger = new Logger(ErrorRecoveryService.name);
    private readonly strategies: BaseRecoveryStrategy[] = [];

    constructor() {}

    registerStrategy(strategy: BaseRecoveryStrategy): void {
        this.logger.log(`Registering recovery strategy: ${strategy.constructor.name}`);
        this.strategies.push(strategy);
    }

    async handle(error: Error, context: Record<string, any> = {}): Promise<void> {
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
}
