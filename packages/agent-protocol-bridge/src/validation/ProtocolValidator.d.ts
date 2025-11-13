import { ProtocolMessage } from '../AgentProtocolBridge';
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
    normalizedMessage?: ProtocolMessage;
}
export declare class ProtocolValidator {
    private readonly logger;
    private validationCache;
    /**
     * Validate a protocol message
     */
    validateMessage(message: ProtocolMessage): Promise<ValidationResult>;
}
//# sourceMappingURL=ProtocolValidator.d.ts.map