export interface SecurityVulnerability {
    type: 'xss' | 'injection' | 'crypto' | 'auth' | 'misc';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    file: string;
    line: number;
    column?: number;
    fix?: string;
}
export interface SecurityScanResult {
    vulnerabilities: SecurityVulnerability[];
    score: number;
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
export declare class SecurityScanner {
    private readonly patterns;
    scanFile(filePath: string, content: string): Promise<SecurityVulnerability[]>;
    scanProject(files: Array<{
        path: string;
        content: string;
    }>): Promise<SecurityScanResult>;
    private calculateSummary;
    private calculateSecurityScore;
}
//# sourceMappingURL=security.scanner.d.ts.map