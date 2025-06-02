import { CodeExecutionLanguage } from '../types.js';
/**
 * Security scan result
 */
export interface SecurityScanResult {
    /**
     * Whether the code is safe to execute
     */
    safe: boolean;
    /**
     * List of detected issues
     */
    issues: SecurityIssue[];
}
/**
 * Security issue detected in code
 */
export interface SecurityIssue {
    /**
     * Type of issue
     */
    type: SecurityIssueType;
    /**
     * Description of the issue
     */
    description: string;
    /**
     * Severity of the issue
     */
    severity: SecurityIssueSeverity;
    /**
     * Line number where the issue was detected
     */
    line?: number;
    /**
     * Column number where the issue was detected
     */
    column?: number;
}
/**
 * Type of security issue
 */
export declare enum SecurityIssueType {
    MALICIOUS_CODE = "malicious_code",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    DATA_EXFILTRATION = "data_exfiltration",
    PRIVILEGE_ESCALATION = "privilege_escalation",
    SANDBOX_ESCAPE = "sandbox_escape",
    UNSAFE_IMPORT = "unsafe_import"
}
/**
 * Severity of security issue
 */
export declare enum SecurityIssueSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Code Scanner Service
 */
export declare class CodeScanner {
    private readonly logger;
    private readonly jsPatterns;
    private readonly pythonPatterns;
    private readonly rubyPatterns;
    private readonly shellPatterns;
    /**
     * Scan code for security issues
     * @param code Code to scan
     * @param language Programming language
     * @returns Security scan result
     */
    scanCode(code: string, language: CodeExecutionLanguage): SecurityScanResult;
}
