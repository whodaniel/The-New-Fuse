import { Logger } from '@nestjs/common';
export declare abstract class BaseRecoveryStrategy {
    protected readonly logger: Logger;
    constructor();
    abstract canHandle(error: Error): boolean;
    abstract handle(error: Error, context: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=BaseRecoveryStrategy.d.ts.map