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
export interface OutputMetadata {
    timestamp: string;
    source_id: string;
    [key: string]: unknown;
}
export interface OutputContent {
    [key: string]: unknown;
}
export interface OutputData {
    type: string;
    content: OutputContent;
    metadata: OutputMetadata;
    [key: string]: unknown;
}
export type RequiredFields = {
    [key: string]: StringConstructor | ObjectConstructor;
};
