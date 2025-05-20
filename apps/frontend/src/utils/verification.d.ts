import { VerificationResult, OutputData } from '../types/verification.js';
export declare class OutputVerifier {
    private readonly requiredFields;
    private readonly sensitivePatterns;
    private readonly harmfulPatterns;
    constructor();
    verifySchema(output: OutputData): VerificationResult;
    verifyContent(output: OutputData): VerificationResult;
    verifySecurity(output: OutputData): VerificationResult;
    verifyHarmlessness(output: OutputData): VerificationResult;
    verifyAll(output: OutputData): VerificationResult[];
}
