import { Message } from '@the-new-fuse/types';
import { BaseService } from '../core/BaseService.js';
type Schema = any;
export declare class MessageValidator extends BaseService {
    private logger;
    private ajv;
    private validators;
    constructor();
    addSchema(messageType: string, schema: Schema): void;
    validate(message: unknown): message is Message;
    private sanitizeMessageForLog;
    getLastErrors(messageType: string): any;
}
export {};
//# sourceMappingURL=MessageValidator.d.ts.map