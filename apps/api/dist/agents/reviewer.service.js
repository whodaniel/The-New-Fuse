"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReviewerAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewerAgentService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const codebase_root_1 = require("./codebase-root");
let ReviewerAgentService = ReviewerAgentService_1 = class ReviewerAgentService {
    constructor(drizzle) {
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(ReviewerAgentService_1.name);
        this.codebaseRoot = (0, codebase_root_1.resolveCodebaseRoot)();
    }
    async reviewImplementation(implementation) {
        this.logger.log(`Starting code review for: ${implementation.taskId}`);
        const findings = [];
        const securityIssues = [];
        // Review each modified file
        for (const file of implementation.filesModified) {
            const fileFindings = await this.reviewFile(file);
            findings.push(...fileFindings.findings);
            securityIssues.push(...fileFindings.security);
        }
        // Check test coverage
        const testCoverage = await this.checkTestCoverage(implementation.filesModified, implementation.testsCreated);
        // Calculate quality metrics
        const qualityMetrics = await this.calculateQualityMetrics(implementation.filesModified);
        // Calculate overall score
        const score = this.calculateReviewScore({
            findings,
            securityIssues,
            testCoverage,
            qualityMetrics,
        });
        // Make decision
        const decision = this.makeDecision(score, securityIssues, testCoverage);
        // Generate feedback
        const feedback = this.generateFeedback({
            findings,
            securityIssues,
            testCoverage,
            qualityMetrics,
            score,
        });
        const review = {
            implementationId: implementation.taskId,
            approved: decision === 'approve',
            score,
            findings,
            securityIssues,
            testCoverage,
            qualityMetrics,
            suggestions: this.generateSuggestions(findings),
            decision,
            feedback,
        };
        await this.storeReview(review);
        this.logger.log(`Review completed: ${decision} (score: ${score}/100)`);
        return review;
    }
    async reviewFile(filePath) {
        const findings = [];
        const security = [];
        try {
            const fullPath = path.join(this.codebaseRoot, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                const lineNumber = index + 1;
                // Check for common issues
                // 1. SQL Injection
                if (line.includes('drizzle.$executeRaw') && line.includes('${')) {
                    security.push({
                        file: filePath,
                        line: lineNumber,
                        type: 'SQL Injection',
                        severity: 'critical',
                        description: 'Raw SQL with string interpolation can lead to SQL injection',
                        recommendation: "Use parameterized queries or Drizzle's type-safe query builder",
                        cwe: 'CWE-89',
                    });
                }
                // 2. Hardcoded secrets
                if (line.match(/password|secret|key|token/i) &&
                    line.includes('=') &&
                    line.match(/["'][^"']+["']/)) {
                    security.push({
                        file: filePath,
                        line: lineNumber,
                        type: 'Hardcoded Secret',
                        severity: 'high',
                        description: 'Potential hardcoded secret or credential',
                        recommendation: 'Use environment variables or secret management service',
                        cwe: 'CWE-798',
                    });
                }
                // 3. eval() usage
                if (line.includes('eval(')) {
                    security.push({
                        file: filePath,
                        line: lineNumber,
                        type: 'Code Injection',
                        severity: 'critical',
                        description: 'Use of eval() can lead to code injection',
                        recommendation: 'Avoid eval() and use safer alternatives',
                        cwe: 'CWE-95',
                    });
                }
                // 4. Missing input validation
                if (line.includes('req.body') && !content.includes('class-validator')) {
                    findings.push({
                        file: filePath,
                        line: lineNumber,
                        severity: 'warning',
                        category: 'security',
                        description: 'Request body usage without visible validation',
                        suggestion: 'Add input validation using class-validator',
                    });
                }
                // 5. Complex functions
                const functionMatch = line.match(/(?:function|const|let)\s+(\w+)\s*=?\s*(?:async\s*)?\(/);
                if (functionMatch) {
                    const functionBody = this.extractFunctionBody(lines, index);
                    if (functionBody.length > 50) {
                        findings.push({
                            file: filePath,
                            line: lineNumber,
                            severity: 'warning',
                            category: 'best-practice',
                            description: `Function '${functionMatch[1]}' is too long (${functionBody.length} lines)`,
                            suggestion: 'Break down into smaller functions',
                        });
                    }
                }
                // 6. Missing error handling
                if (line.includes('await') && !line.includes('try')) {
                    const hasErrorHandling = lines
                        .slice(Math.max(0, index - 5), index + 5)
                        .some((l) => l.includes('try') || l.includes('catch'));
                    if (!hasErrorHandling) {
                        findings.push({
                            file: filePath,
                            line: lineNumber,
                            severity: 'error',
                            category: 'bug',
                            description: 'Async operation without error handling',
                            suggestion: 'Wrap in try-catch block',
                        });
                    }
                }
                // 7. Console statements
                if (line.includes('console.') &&
                    !filePath.includes('.test.') &&
                    !filePath.includes('.spec.')) {
                    findings.push({
                        file: filePath,
                        line: lineNumber,
                        severity: 'warning',
                        category: 'style',
                        description: 'Console statement in production code',
                        suggestion: 'Use proper logger',
                    });
                }
                // 8. TODO comments
                if (line.includes('TODO') || line.includes('FIXME')) {
                    findings.push({
                        file: filePath,
                        line: lineNumber,
                        severity: 'info',
                        category: 'best-practice',
                        description: 'Unresolved TODO/FIXME comment',
                        suggestion: 'Address the TODO or create a tracked issue',
                    });
                }
                // 9. Magic numbers
                if (line.match(/\s+\d{3,}\s+/) && !line.includes('//')) {
                    findings.push({
                        file: filePath,
                        line: lineNumber,
                        severity: 'info',
                        category: 'style',
                        description: 'Magic number found',
                        suggestion: 'Use named constant',
                    });
                }
                // 10. Improper null checks
                if (line.includes('== null') || line.includes('!= null')) {
                    findings.push({
                        file: filePath,
                        line: lineNumber,
                        severity: 'info',
                        category: 'style',
                        description: 'Loose equality check for null',
                        suggestion: 'Use strict equality (=== null)',
                    });
                }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to review file ${filePath}: ${errorMessage}`);
        }
        return { findings, security };
    }
    extractFunctionBody(lines, startIndex) {
        let braceCount = 0;
        const body = [];
        for (let i = startIndex; i < lines.length && i < startIndex + 100; i++) {
            const line = lines[i];
            body.push(line);
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            if (braceCount === 0 && i > startIndex) {
                break;
            }
        }
        return body;
    }
    async checkTestCoverage(filesModified, testsCreated) {
        const missingTests = [];
        // Check if each modified file has a corresponding test
        for (const file of filesModified) {
            if (file.includes('.service.ts') || file.includes('.controller.ts')) {
                const testFile = file.replace(/\.ts$/, '.spec.ts');
                const hasTest = testsCreated.includes(testFile);
                if (!hasTest) {
                    missingTests.push(testFile);
                }
            }
        }
        const percentage = filesModified.length > 0
            ? ((filesModified.length - missingTests.length) / filesModified.length) * 100
            : 100;
        return {
            percentage: Math.round(percentage),
            missingTests,
        };
    }
    async calculateQualityMetrics(filesModified) {
        let totalComplexity = 0;
        let totalMaintainability = 0;
        let totalReadability = 0;
        let totalTestability = 0;
        for (const file of filesModified) {
            try {
                const fullPath = path.join(this.codebaseRoot, file);
                const content = await fs.readFile(fullPath, 'utf-8');
                // Simple heuristics for code quality
                const lines = content.split('\n');
                const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
                const hasTypes = content.includes(': ') && !content.includes(': any');
                const hasDocs = content.includes('/**');
                totalComplexity += Math.min(100, 100 - avgLineLength / 2);
                totalMaintainability += hasTypes ? 80 : 40;
                totalReadability += hasDocs ? 90 : 50;
                totalTestability += 70;
            }
            catch (_error) {
                const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
                this.logger.warn(`Failed to calculate metrics for ${file}: ${errorMessage}`);
            }
        }
        const fileCount = filesModified.length || 1;
        return {
            complexity: Math.round(totalComplexity / fileCount),
            maintainability: Math.round(totalMaintainability / fileCount),
            readability: Math.round(totalReadability / fileCount),
            testability: Math.round(totalTestability / fileCount),
        };
    }
    calculateReviewScore(params) {
        let score = 100;
        // Deduct for findings
        params.findings.forEach((f) => {
            if (f.severity === 'error')
                score -= 10;
            else if (f.severity === 'warning')
                score -= 5;
            else
                score -= 1;
        });
        // Deduct for security issues
        params.securityIssues.forEach((s) => {
            if (s.severity === 'critical')
                score -= 30;
            else if (s.severity === 'high')
                score -= 20;
            else if (s.severity === 'medium')
                score -= 10;
            else
                score -= 5;
        });
        // Factor in test coverage (20% weight)
        score = score * 0.8 + params.testCoverage.percentage * 0.2;
        // Factor in quality metrics (10% weight)
        const avgQuality = (params.qualityMetrics.complexity +
            params.qualityMetrics.maintainability +
            params.qualityMetrics.readability +
            params.qualityMetrics.testability) /
            4;
        score = score * 0.9 + avgQuality * 0.1;
        return Math.max(0, Math.round(score));
    }
    makeDecision(score, securityIssues, testCoverage) {
        const hasCriticalSecurity = securityIssues.some((s) => s.severity === 'critical');
        if (hasCriticalSecurity) {
            return 'reject';
        }
        if (score >= 80 && testCoverage.percentage >= 70) {
            return 'approve';
        }
        if (score >= 60) {
            return 'request_changes';
        }
        return 'reject';
    }
    generateFeedback(params) {
        const sections = [];
        sections.push(`## Review Score: ${params.score}/100\n`);
        if (params.securityIssues.length > 0) {
            sections.push(`### Security Issues (${params.securityIssues.length})`);
            params.securityIssues.forEach((issue) => {
                sections.push(`- [${issue.severity.toUpperCase()}] ${issue.description} (${issue.file}:${issue.line})`);
            });
            sections.push('');
        }
        if (params.findings.length > 0) {
            sections.push(`### Code Quality Findings (${params.findings.length})`);
            const errors = params.findings.filter((f) => f.severity === 'error');
            const warnings = params.findings.filter((f) => f.severity === 'warning');
            if (errors.length > 0) {
                sections.push(`#### Errors (${errors.length})`);
                errors.slice(0, 5).forEach((f) => {
                    sections.push(`- ${f.description} (${f.file}:${f.line})`);
                });
            }
            if (warnings.length > 0) {
                sections.push(`#### Warnings (${warnings.length})`);
                warnings.slice(0, 5).forEach((f) => {
                    sections.push(`- ${f.description} (${f.file}:${f.line})`);
                });
            }
            sections.push('');
        }
        sections.push('### Test Coverage');
        sections.push(`- Coverage: ${params.testCoverage.percentage}%`);
        if (params.testCoverage.missingTests.length > 0) {
            sections.push(`- Missing tests: ${params.testCoverage.missingTests.length}`);
        }
        sections.push('');
        sections.push('### Quality Metrics');
        sections.push(`- Complexity: ${params.qualityMetrics.complexity}/100`);
        sections.push(`- Maintainability: ${params.qualityMetrics.maintainability}/100`);
        sections.push(`- Readability: ${params.qualityMetrics.readability}/100`);
        sections.push(`- Testability: ${params.qualityMetrics.testability}/100`);
        return sections.join('\n');
    }
    generateSuggestions(findings) {
        const suggestions = new Map();
        findings.forEach((finding) => {
            const key = finding.suggestion;
            suggestions.set(key, (suggestions.get(key) || 0) + 1);
        });
        return Array.from(suggestions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([suggestion, count]) => `${suggestion} (${count} occurrences)`);
    }
    async storeReview(_review) {
        try {
            this.logger.log('Storing code review in database...');
            // Store in database
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to store review: ${errorMessage}`);
        }
    }
    async runSecurityScan(files) {
        this.logger.log('Running security scan...');
        const securityIssues = [];
        for (const file of files) {
            const result = await this.reviewFile(file);
            securityIssues.push(...result.security);
        }
        return securityIssues;
    }
};
exports.ReviewerAgentService = ReviewerAgentService;
exports.ReviewerAgentService = ReviewerAgentService = ReviewerAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DrizzleService])
], ReviewerAgentService);
//# sourceMappingURL=reviewer.service.js.map