/**
 * Code Scanner for detecting malicious code patterns
 */
import { Injectable, Logger } from '@nestjs/common';

export enum SecurityIssueType {
  MALICIOUS_CODE = 'Malicious Code',
  RESOURCE_EXHAUSTION = 'Resource Exhaustion',
  DATA_EXFILTRATION = 'Data Exfiltration',
  PRIVILEGE_ESCALATION = 'Privilege Escalation',
  SANDBOX_ESCAPE = 'Sandbox Escape',
  UNSAFE_IMPORT = 'Unsafe Import',
}

export enum SecurityIssueSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export interface SecurityIssue {
  type: SecurityIssueType;
  severity: SecurityIssueSeverity;
  description: string;
  lineNumber: number;
}

@Injectable()
export class CodeScanner {
  private readonly logger = new Logger(CodeScanner.name);
  private readonly rules = [
    {
      type: SecurityIssueType.UNSAFE_IMPORT,
      severity: SecurityIssueSeverity.HIGH,
      pattern: /require\s*\(\s*['"](fs|child_process|vm)['"]\s*\)/g,
      description: 'Unsafe module import detected.',
    },
    {
      type: SecurityIssueType.MALICIOUS_CODE,
      severity: SecurityIssueSeverity.CRITICAL,
      pattern: /eval\s*\(|new Function\s*\(/g,
      description: 'Execution of arbitrary code using eval() or new Function() is unsafe.',
    },
    {
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      severity: SecurityIssueSeverity.MEDIUM,
      pattern: /while\s*\(\s*true\s*\)/g,
      description: 'Infinite loop detected, which can lead to resource exhaustion.',
    },
  ];

  scan(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    for (const rule of this.rules) {
      let match;
      while ((match = rule.pattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index);
        issues.push({
          type: rule.type,
          severity: rule.severity,
          description: rule.description,
          lineNumber,
        });
      }
    }
    return issues;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
}
