var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let SecurityScanner = class SecurityScanner {
    constructor() {
        this.patterns = [
            {
                type: 'injection',
                severity: 'high',
                pattern: /eval\s*\(/g,
                title: 'Dangerous eval() usage',
                description: 'Use of eval() function can lead to code injection vulnerabilities',
                fix: 'Avoid using eval(). Use JSON.parse() for JSON data or safer alternatives.'
            },
            {
                type: 'xss',
                severity: 'medium',
                pattern: /innerHTML\s*=/g,
                title: 'Direct innerHTML manipulation',
                description: 'Direct innerHTML manipulation can lead to XSS vulnerabilities',
                fix: 'Use textContent or properly sanitize HTML content before setting innerHTML.'
            },
            {
                type: 'injection',
                severity: 'high',
                pattern: /document\.write\s*\(/g,
                title: 'Dangerous document.write usage',
                description: 'document.write can be exploited for XSS attacks',
                fix: 'Use safer DOM manipulation methods like appendChild or textContent.'
            },
            {
                type: 'crypto',
                severity: 'critical',
                pattern: /Math\.random\s*\(\)/g,
                title: 'Weak random number generation',
                description: 'Math.random() is not cryptographically secure',
                fix: 'Use crypto.getRandomValues() for cryptographic purposes.'
            },
            {
                type: 'auth',
                severity: 'high',
                pattern: /localStorage\.setItem\s*\(\s*['"](token|password|secret)/g,
                title: 'Sensitive data in localStorage',
                description: 'Storing sensitive data in localStorage is insecure',
                fix: 'Use secure HTTP-only cookies or sessionStorage with proper encryption.'
            }
        ];
    }
    async scanFile(filePath, content) {
        const vulnerabilities = [];
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
        }
        catch (error) {
            console.error('Error scanning file:', error);
        }
        return vulnerabilities;
    }
    async scanProject(files) {
        const allVulnerabilities = [];
        for (const { path: filePath, content } of files) {
            try {
                const vulnerabilities = await this.scanFile(filePath, content);
                allVulnerabilities.push(...vulnerabilities);
            }
            catch (error) {
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
    calculateSummary(vulnerabilities) {
        return vulnerabilities.reduce((acc, vuln) => {
            acc[vuln.severity]++;
            return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });
    }
    calculateSecurityScore(summary) {
        const weights = { critical: 20, high: 10, medium: 5, low: 1 };
        const totalDeductions = summary.critical * weights.critical +
            summary.high * weights.high +
            summary.medium * weights.medium +
            summary.low * weights.low;
        return Math.max(0, 100 - totalDeductions);
    }
};
SecurityScanner = __decorate([
    Injectable()
], SecurityScanner);
export { SecurityScanner };
//# sourceMappingURL=security.scanner.js.map