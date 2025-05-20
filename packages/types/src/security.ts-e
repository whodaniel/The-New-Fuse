export const enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  cvss?: number;
  cve?: string;
  location?: string;
  affectedDependency?: string;
  remediation?: string;
  references?: string[];
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface SecurityScanResult {
  vulnerabilities: SecurityVulnerability[];
  totalVulnerabilities: number;
  severityCounts: Record<SecuritySeverity, number>;
  scanTimestamp: Date;
  metadata: Record<string, unknown>;
}

export interface SecurityScanner {
  scanDependencies(dependencies: string[]): Promise<SecurityScanResult>;
  scanFiles(projectId: string): Promise<SecurityScanResult>;
  getSeverityCount(): Promise<Record<SecuritySeverity, number>>;
  getVulnerabilityById(id: string): Promise<SecurityVulnerability | null>;
  getVulnerabilities(filter?: {
    severity?: SecuritySeverity[];
    dependency?: string;
    cve?: string;
  }): Promise<SecurityVulnerability[]>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  rules: {
    maxSeverity?: SecuritySeverity;
    maxVulnerabilities?: number;
    blockedDependencies?: string[];
    allowedLicenses?: string[];
    requiredScans?: ('dependency' | 'file' | 'secret')[];
  };
  actions: {
    onViolation: 'block' | 'warn' | 'log';
    notification?: {
      channels: string[];
      template?: string;
    };
  };
  metadata?: Record<string, unknown>;
}
