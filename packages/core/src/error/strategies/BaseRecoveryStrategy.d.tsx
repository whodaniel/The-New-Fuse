import { Logger } from '@nestjs/common';
import { BaseError } from '../types.js';
import { IRecoveryStrategy } from './IRecoveryStrategy.js';
export declare abstract class BaseRecoveryStrategy implements IRecoveryStrategy {
    protected readonly logger: Logger;
    BaseError: any;
    boolean: any;
    abstract recover(error: BaseError): Promise<void>;
    protected withRetry(): Promise<void>;
}
