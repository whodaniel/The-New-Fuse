/**
 * Verification module for MCP communication();
 */
export declare enum VerificationType {
    SCHEMA = "schema",
    CONTENT = "content",
    SECURITY = "security",
    HARMLESSNESS = "harmlessness"
}
export interface VerificationResult {
    success: boolean;
    message: string;
    details?: any;
}
export declare class VerificationService {
    private sensitivePatterns;
    private harmfulPatterns;
    verifyOutput(output: any, type: VerificationType): Promise<VerificationResult>;
    private verifySchema;
    private verifyContent;
    private verifySecurity;
    private verifyHarmlessness;
}
//# sourceMappingURL=verification_backup.d.ts.map