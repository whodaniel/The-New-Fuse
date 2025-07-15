import { Injectable } from '@nestjs/common';

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

@Injectable()
export class SecurityScanner {
  private readonly patterns = [
    {
      type: 'injection' as const,
      severity: 'high' as const,
      pattern: /eval\s*\(/g,
      title: 'Dangerous eval() usage',
      description: 'Use of eval() function can lead to code injection vulnerabilities',
      fix: 'Avoid using eval(). Use JSON.parse() for JSON data or safer alternatives.'
    },
    {
      type: 'xss' as const,
      severity: 'medium' as const,
      pattern: /innerHTML\s*=/g,
      title: 'Direct innerHTML manipulation',
      description: 'Direct innerHTML manipulation can lead to XSS vulnerabilities',
      fix: 'Use textContent or properly sanitize HTML content before setting innerHTML.'
    },
    {
      type: 'injection' as const,
      severity: 'high' as const,
      pattern: /document\.write\s*\(/g,
      title: 'Dangerous document.write usage',
      description: 'document.write can be exploited for XSS attacks',
      fix: 'Use safer DOM manipulation methods like appendChild or textContent.'
    },
    {
      type: 'crypto' as const,
      severity: 'critical' as const,
      pattern: /Math\.random\s*\(\)/g,
      title: 'Weak random number generation',
      description: 'Math.random() is not cryptographically secure',
      fix: 'Use crypto.getRandomValues() for cryptographic purposes.'
    },
    {
      type: 'auth' as const,
      severity: 'high' as const,
      pattern: /localStorage\.setItem\s*\(\s*['"](token|password|secret)/g,
      title: 'Sensitive data in localStorage',
      description: 'Storing sensitive data in localStorage is insecure',
      fix: 'Use secure HTTP-only cookies or sessionStorage with proper encryption.'
    }
  ];

  async scanFile(filePath: string, content: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const lines = content.split('\n');

      this.patterns.forEach(pattern => {
        lines.forEach((line, lineIndex) => {
          const matches = line.matchAll(pattern.pattern);
          for (const match of matches) {
            vulnerabilities.push({
              type: pattern.type,
              severity: pattern.severity,
              title: pattern.title,
              description: pattern.description,
              file: filePath,
              line: lineIndex + 1,
              column: match.index,
              fix: pattern.fix
            });
          }
        });
      });
    } catch (error) {
      console.error('Error scanning file:', error);
    }

    return vulnerabilities;
  }

  async scanProject(files: Map<string, string>): Promise<SecurityScanResult> {
    const allVulnerabilities: SecurityVulnerability[] = [];

    for (const [filePath, content] of files.entries()) {
      try {
        const vulnerabilities = await this.scanFile(filePath, content);
        allVulnerabilities.push(...vulnerabilities);
      } catch (error) {
        console.error(`Error scanning ${filePath}:`, error);
      }
    }

    const summary = this.calculateSummary(allVulnerabilities);
    const score = this.calculateSecurityScore(summary);

    return {
      vulnerabilities: allVulnerabilities,
      score,
      summary
    };
  }

  private calculateSummary(vulnerabilities: SecurityVulnerability[]) {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity]++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
  }

  private calculateSecurityScore(summary: ReturnType<typeof this.calculateSummary>): number {
    const weights = { critical: 20, high: 10, medium: 5, low: 1 };
    const totalDeductions = summary.critical * weights.critical +
                          summary.high * weights.high +
                          summary.medium * weights.medium +
                          summary.low * weights.low;
    
    return Math.max(0, 100 - totalDeductions);
  }
}