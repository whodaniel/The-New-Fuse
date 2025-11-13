import { BaseService } from '../core/BaseService';
type Schema = any;
/**
 * Service responsible for validating incoming and outgoing messages against predefined schemas.
 */
export declare class MessageValidator extends BaseService {
    private logger;
    private ajv;
    private validators;
    constructor();
    /**
     * Adds or updates a schema for a specific message type.
     * @param messageType The type of message the schema applies to.
     * @param schema The JSON schema definition.
     */
    addSchema(messageType: string, schema: Schema): void;
}
export {};
//# sourceMappingURL=MessageValidator.d.ts.map