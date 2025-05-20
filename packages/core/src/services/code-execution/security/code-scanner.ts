/**
 * Code Scanner for detecting malicious code patterns
 */
import { Injectable, Logger } from '@nestjs/common';
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
export enum SecurityIssueType {
  MALICIOUS_CODE = 'malicious_code',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  DATA_EXFILTRATION = 'data_exfiltration',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SANDBOX_ESCAPE = 'sandbox_escape',
  UNSAFE_IMPORT = 'unsafe_import',
}

/**
 * Severity of security issue
 */
export enum SecurityIssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Code Scanner Service
 */
@Injectable()
export class CodeScanner {
  private readonly logger = new Logger(CodeScanner.name);
  
  // Patterns to detect in JavaScript/TypeScript code
  private readonly jsPatterns = [
    {
      pattern: /process\s*\.\s*(exit|kill)/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to exit the process',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /require\s*\(\s*['"]child_process['"]\s*\)/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to import child_process module',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /exec|spawn|execSync|spawnSync/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to execute system commands',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /fs\s*\.\s*(readFile|writeFile|appendFile|readFileSync|writeFileSync|appendFileSync)/g,
      type: SecurityIssueType.DATA_EXFILTRATION,
      description: 'Attempt to access file system',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /net|http|https|request|fetch|XMLHttpRequest/g,
      type: SecurityIssueType.DATA_EXFILTRATION,
      description: 'Attempt to make network requests',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;;\s*\)/g,
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      description: 'Infinite loop detected',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /new\s+Array\s*\(\s*1e9\s*\)/g,
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      description: 'Attempt to allocate excessive memory',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /eval|Function\s*\(/g,
      type: SecurityIssueType.SANDBOX_ESCAPE,
      description: 'Attempt to use eval or Function constructor',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /constructor\s*\.\s*constructor|__proto__|prototype|Object\s*\.\s*setPrototypeOf/g,
      type: SecurityIssueType.SANDBOX_ESCAPE,
      description: 'Attempt to modify object prototypes',
      severity: SecurityIssueSeverity.HIGH,
    },
  ];
  
  // Patterns to detect in Python code
  private readonly pythonPatterns = [
    {
      pattern: /import\s+os|from\s+os\s+import/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to import os module',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /import\s+subprocess|from\s+subprocess\s+import/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to import subprocess module',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /import\s+sys|from\s+sys\s+import/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to import sys module',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /open\s*\(/g,
      type: SecurityIssueType.DATA_EXFILTRATION,
      description: 'Attempt to open files',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /exec\s*\(|eval\s*\(/g,
      type: SecurityIssueType.SANDBOX_ESCAPE,
      description: 'Attempt to use exec or eval',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /while\s+True:|for\s+i\s+in\s+range\s*\(\s*10\s*\*\*\s*10\s*\)/g,
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      description: 'Potential infinite loop or excessive iteration',
      severity: SecurityIssueSeverity.HIGH,
    },
  ];
  
  // Patterns to detect in Ruby code
  private readonly rubyPatterns = [
    {
      pattern: /`.*`|\%x\{.*\}|system\s*\(/g,
      type: SecurityIssueType.PRIVILEGE_ESCALATION,
      description: 'Attempt to execute system commands',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /File\s*\.\s*(read|write|open)/g,
      type: SecurityIssueType.DATA_EXFILTRATION,
      description: 'Attempt to access file system',
      severity: SecurityIssueSeverity.MEDIUM,
    },
    {
      pattern: /eval|instance_eval|class_eval/g,
      type: SecurityIssueType.SANDBOX_ESCAPE,
      description: 'Attempt to use eval',
      severity: SecurityIssueSeverity.HIGH,
    },
    {
      pattern: /while\s+true|loop\s+do/g,
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      description: 'Infinite loop detected',
      severity: SecurityIssueSeverity.HIGH,
    },
  ];
  
  // Patterns to detect in Shell code
  private readonly shellPatterns = [
    {
      pattern: /rm\s+-rf\s+\/|rm\s+--no-preserve-root/g,
      type: SecurityIssueType.MALICIOUS_CODE,
      description: 'Attempt to delete system files',
      severity: SecurityIssueSeverity.CRITICAL,
    },
    {
      pattern: />\s*\/dev\/sda|dd\s+if=.*of=\/dev\/sda/g,
      type: SecurityIssueType.MALICIOUS_CODE,
      description: 'Attempt to overwrite disk',
      severity: SecurityIssueSeverity.CRITICAL,
    },
    {
      pattern: /:\(\)\{\s*:\|\:&\s*\};:/g,
      type: SecurityIssueType.RESOURCE_EXHAUSTION,
      description: 'Fork bomb detected',
      severity: SecurityIssueSeverity.CRITICAL,
    },
  ];
  
  /**
   * Scan code for security issues
   * @param code Code to scan
   * @param language Programming language
   * @returns Security scan result
   */
  scanCode(code: string, language: CodeExecutionLanguage): SecurityScanResult {
    this.logger.log(`Scanning ${language} code for security issues`);
    
    const issues: SecurityIssue[] = [];
    
    // Select patterns based on language
    let patterns: any[] = [];
    
    switch (language) {
      case CodeExecutionLanguage.JAVASCRIPT:
      case CodeExecutionLanguage.TYPESCRIPT:
        patterns = this.jsPatterns;
        break;
      case CodeExecutionLanguage.PYTHON:
        patterns = this.pythonPatterns;
        break;
      case CodeExecutionLanguage.RUBY:
        patterns = this.rubyPatterns;
        break;
      case CodeExecutionLanguage.SHELL:
        patterns = this.shellPatterns;
        break;
      default:
        // For other languages, use a subset of JavaScript patterns
        patterns = this.jsPatterns.filter(p => 
          p.type === SecurityIssueType.RESOURCE_EXHAUSTION || 
          p.type === SecurityIssueType.SANDBOX_ESCAPE
        );
    }
    
    // Check each pattern
    for (const pattern of patterns) {
      const matches = code.match(pattern.pattern);
      
      if (matches) {
        // Find line and column for each match
        for (const match of matches) {
          const index = code.indexOf(match);
          const lines = code.substring(0, index).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          
          issues.push({
            type: pattern.type,
            description: pattern.description,
            severity: pattern.severity,
            line,
            column,
          });
        }
      }
    }
    
    // Check for critical issues
    const hasCriticalIssues = issues.some(issue => issue.severity === SecurityIssueSeverity.CRITICAL);
    
    // Check for high severity issues
    const hasHighSeverityIssues = issues.some(issue => issue.severity === SecurityIssueSeverity.HIGH);
    
    // Determine if code is safe to execute
    const safe = !hasCriticalIssues && !hasHighSeverityIssues;
    
    this.logger.log(`Security scan complete: ${issues.length} issues found, safe=${safe}`);
    
    return {
      safe,
      issues,
    };
  }
}
