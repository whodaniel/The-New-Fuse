/**
 * Verification module for MCP communication.
 */
export declare enum VerificationType {
    SCHEMA = "schema",
    CONTENT = "content",
    SECURITY = "security",
    HARMLESSNESS = "harmlessness"
}
export interface VerificationResult {
    success: boolean;
    type: VerificationType;
    message: string;
    details?: Record<string, unknown>;
}
export declare class OutputVerifier {
    private readonly requiredFields;
    private readonly sensitivePatterns;
    private readonly harmfulPatterns;
    constructor();
    /**
     * Verify output schema.
     */
    verifySchema(output: Record<string, unknown>): VerificationResult;
}
