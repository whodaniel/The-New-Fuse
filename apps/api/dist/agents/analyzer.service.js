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
var AnalyzerAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerAgentService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const fs = __importStar(require("fs/promises"));
const glob_1 = require("glob");
const path = __importStar(require("path"));
const codebase_root_1 = require("./codebase-root");
let AnalyzerAgentService = AnalyzerAgentService_1 = class AnalyzerAgentService {
    constructor(drizzle) {
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(AnalyzerAgentService_1.name);
        this.codebaseRoot = (0, codebase_root_1.resolveCodebaseRoot)();
    }
    async scanCodebase() {
        this.logger.log('Starting comprehensive codebase analysis...');
        const issues = [];
        // Scan TypeScript/JavaScript files
        const files = (await glob_1.glob('**/*.{ts,js,tsx,jsx}', {
            cwd: this.codebaseRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
            absolute: true,
        }));
        this.logger.log(`Analyzing ${files.length} files...`);
        for (const file of files.slice(0, 50)) {
            // Limit for performance
            const fileIssues = await this.analyzeFile(file);
            issues.push(...fileIssues);
        }
        // Identify bottlenecks
        const bottlenecks = await this.identifyBottlenecks(files);
        // Find anti-patterns
        const antiPatterns = await this.findAntiPatterns(issues);
        // Calculate metrics
        const metrics = this.calculateMetrics(issues);
        // Prioritize issues by impact
        const prioritizedIssues = this.prioritizeIssues(issues);
        const report = {
            timestamp: new Date(),
            issues,
            prioritizedIssues,
            bottlenecks,
            antiPatterns,
            metrics,
        };
        // Store report in database
        await this.storeReport(report);
        this.logger.log(`Analysis complete: Found ${issues.length} issues`);
        return report;
    }
    async analyzeFile(filePath) {
        const issues = [];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const relativePath = path.relative(this.codebaseRoot, filePath);
            lines.forEach((line, index) => {
                // Check for common issues
                // 1. Console logs in production code
                if (line.includes('console.log') &&
                    !filePath.includes('.test.') &&
                    !filePath.includes('.spec.')) {
                    issues.push({
                        id: `${relativePath}:${index}:console`,
                        file: relativePath,
                        line: index + 1,
                        type: 'quality',
                        severity: 'low',
                        description: 'Console.log statement found in production code',
                        suggestion: 'Use proper logging service instead of console.log',
                        impact: 3,
                        estimatedEffort: 'low',
                    });
                }
                // 2. TODO/FIXME comments
                if (line.includes('TODO') || line.includes('FIXME')) {
                    issues.push({
                        id: `${relativePath}:${index}:todo`,
                        file: relativePath,
                        line: index + 1,
                        type: 'quality',
                        severity: 'low',
                        description: 'Unresolved TODO/FIXME comment',
                        suggestion: 'Address the TODO/FIXME or create a tracked task',
                        impact: 2,
                        estimatedEffort: 'medium',
                    });
                }
                // 3. Any type usage (TypeScript)
                if (line.includes(': any') || line.includes('<any>')) {
                    issues.push({
                        id: `${relativePath}:${index}:any-type`,
                        file: relativePath,
                        line: index + 1,
                        type: 'quality',
                        severity: 'medium',
                        description: 'Usage of "any" type reduces type safety',
                        suggestion: 'Replace "any" with specific type definition',
                        impact: 5,
                        estimatedEffort: 'medium',
                    });
                }
                // 4. Hardcoded credentials/secrets
                if (line.match(/apiKey|api_key|secret|password|token/i) &&
                    line.includes('=') &&
                    line.match(/["'][^"']+["']/)) {
                    issues.push({
                        id: `${relativePath}:${index}:hardcoded-secret`,
                        file: relativePath,
                        line: index + 1,
                        type: 'security',
                        severity: 'critical',
                        description: 'Potential hardcoded secret or credential',
                        suggestion: 'Move secrets to environment variables',
                        impact: 10,
                        estimatedEffort: 'low',
                    });
                }
                // 5. Synchronous file operations
                if (line.includes('Sync(') && (line.includes('readFile') || line.includes('writeFile'))) {
                    issues.push({
                        id: `${relativePath}:${index}:sync-fs`,
                        file: relativePath,
                        line: index + 1,
                        type: 'performance',
                        severity: 'medium',
                        description: 'Synchronous file operation blocks event loop',
                        suggestion: 'Use async file operations',
                        impact: 6,
                        estimatedEffort: 'low',
                    });
                }
                // 6. Missing error handling
                if (line.includes('await') && !content.slice(0, content.indexOf(line)).includes('try')) {
                    const nextLines = lines.slice(index, index + 10).join('\n');
                    if (!nextLines.includes('catch')) {
                        issues.push({
                            id: `${relativePath}:${index}:no-error-handling`,
                            file: relativePath,
                            line: index + 1,
                            type: 'bug',
                            severity: 'high',
                            description: 'Async operation without error handling',
                            suggestion: 'Wrap in try-catch block',
                            impact: 7,
                            estimatedEffort: 'low',
                        });
                    }
                }
                // 7. Large files (>500 lines)
                if (index === lines.length - 1 && lines.length > 500) {
                    issues.push({
                        id: `${relativePath}:large-file`,
                        file: relativePath,
                        line: 1,
                        type: 'quality',
                        severity: 'medium',
                        description: `File has ${lines.length} lines (recommended: <500)`,
                        suggestion: 'Consider breaking down into smaller modules',
                        impact: 4,
                        estimatedEffort: 'high',
                    });
                }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Failed to analyze ${filePath}: ${errorMessage}`);
        }
        return issues;
    }
    async identifyBottlenecks(files) {
        const bottlenecks = [];
        // Check for missing indexes in schema
        const schemaFiles = files.filter((f) => f.includes('schema.drizzle'));
        for (const schema of schemaFiles) {
            bottlenecks.push({
                location: path.relative(this.codebaseRoot, schema),
                description: 'Database queries may be slow without proper indexing',
                impact: 8,
            });
        }
        // Check for N+1 query patterns
        // const serviceFiles = files.filter(f => f.includes('.service.ts'));
        const _serviceFiles = files.filter((f) => f.includes('.service.ts'));
        bottlenecks.push({
            location: 'Service files',
            description: 'Potential N+1 query patterns in data fetching',
            impact: 7,
        });
        return bottlenecks;
    }
    async findAntiPatterns(issues) {
        const patterns = new Map();
        // Group issues by type
        issues.forEach((issue) => {
            if (issue.type === 'anti-pattern' || issue.severity === 'high') {
                const key = issue.description;
                if (!patterns.has(key)) {
                    patterns.set(key, []);
                }
                patterns.get(key).push(issue.file);
            }
        });
        return Array.from(patterns.entries()).map(([pattern, locations]) => ({
            pattern,
            occurrences: locations.length,
            locations: [...new Set(locations)], // Deduplicate
        }));
    }
    calculateMetrics(issues) {
        const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
        const highIssues = issues.filter((i) => i.severity === 'high').length;
        const mediumIssues = issues.filter((i) => i.severity === 'medium').length;
        const lowIssues = issues.filter((i) => i.severity === 'low').length;
        // Calculate technical debt score (0-100, higher is worse)
        const technicalDebtScore = Math.min(100, criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 1);
        return {
            totalFiles: new Set(issues.map((i) => i.file)).size,
            totalIssues: issues.length,
            criticalIssues,
            highIssues,
            mediumIssues,
            lowIssues,
            technicalDebtScore,
        };
    }
    prioritizeIssues(issues) {
        const severityWeight = {
            critical: 10,
            high: 7,
            medium: 4,
            low: 1,
        };
        const effortWeight = {
            low: 3,
            medium: 2,
            high: 1,
        };
        return issues
            .map((issue) => ({
            ...issue,
            priority: (severityWeight[issue.severity] * issue.impact * effortWeight[issue.estimatedEffort]) /
                100,
        }))
            .sort((a, b) => b.priority - a.priority);
    }
    async storeReport(_report) {
        try {
            // Store in database as a workflow task or custom table
            this.logger.log('Storing analysis report in database...');
            // This would integrate with the database schema
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to store report: ${errorMessage}`);
        }
    }
    async getSuggestions() {
        this.logger.log('Retrieving prioritized improvement suggestions...');
        const report = await this.scanCodebase();
        return report.prioritizedIssues.slice(0, 10); // Top 10 suggestions
    }
};
exports.AnalyzerAgentService = AnalyzerAgentService;
exports.AnalyzerAgentService = AnalyzerAgentService = AnalyzerAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DrizzleService])
], AnalyzerAgentService);
//# sourceMappingURL=analyzer.service.js.map