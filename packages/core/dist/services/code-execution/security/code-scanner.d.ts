export declare enum SecurityIssueType {
    MALICIOUS_CODE = "Malicious Code",
    RESOURCE_EXHAUSTION = "Resource Exhaustion",
    DATA_EXFILTRATION = "Data Exfiltration",
    PRIVILEGE_ESCALATION = "Privilege Escalation",
    SANDBOX_ESCAPE = "Sandbox Escape",
    UNSAFE_IMPORT = "Unsafe Import"
}
export declare enum SecurityIssueSeverity {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
    CRITICAL = "Critical"
}
export interface SecurityIssue {
    type: SecurityIssueType;
    severity: SecurityIssueSeverity;
    description: string;
    lineNumber: number;
}
export declare class CodeScanner {
    private readonly logger;
    private readonly rules;
    scan(code: string): SecurityIssue[];
    private getLineNumber;
}
//# sourceMappingURL=code-scanner.d.ts.map