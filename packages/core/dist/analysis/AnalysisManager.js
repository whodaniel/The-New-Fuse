var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnalysisManager_1;
import { Injectable, Logger } from '@nestjs/common';
let AnalysisManager = AnalysisManager_1 = class AnalysisManager {
    constructor() {
        this.logger = new Logger(AnalysisManager_1.name);
        this.analysisQueue = new Map();
    }
    async analyzeCode(files, config) {
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        this.logger.log(`Starting analysis: ${analysisId}`);
        try {
            const results = [];
            // Run different types of analysis based on config
            if (config.includeCodeQuality) {
                const qualityResults = await this.analyzeCodeQuality(files);
                results.push(...qualityResults);
            }
            if (config.includeSecurity) {
                const securityResults = await this.analyzeSecurity(files);
                results.push(...securityResults);
            }
            if (config.includePerformance) {
                const performanceResults = await this.analyzePerformance(files);
                results.push(...performanceResults);
            }
            if (config.includeDependency) {
                const dependencyResults = await this.analyzeDependencies(files);
                results.push(...dependencyResults);
            }
            if (config.includeComplexity) {
                const complexityResults = await this.analyzeComplexity(files);
                results.push(...complexityResults);
            }
            // Apply custom rules if any
            if (config.customRules && config.customRules.length > 0) {
                const customResults = await this.applyCustomRules(files, config.customRules);
                results.push(...customResults);
            }
            const filteredResults = this.filterBySeverity(results, config.severityThreshold);
            const summary = this.generateSummary(filteredResults);
            const executionTime = Date.now() - startTime;
            const report = {
                id: analysisId,
                timestamp: new Date(),
                config,
                results: filteredResults,
                summary,
                executionTime,
            };
            this.logger.log(`Analysis completed: ${analysisId} - ${filteredResults.length} issues found`);
            return report;
        }
        catch (error) {
            this.logger.error(`Analysis failed: ${analysisId}`, error);
            throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async analyzeCodeQuality(files) {
        const results = [];
        for (const file of files) {
            // Simulate code quality analysis
            results.push({
                id: `quality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'code_quality',
                severity: 'medium',
                message: 'Consider breaking this function into smaller functions',
                file,
                line: 42,
                column: 10,
                suggestions: [
                    'Split function into multiple smaller functions',
                    'Reduce cyclomatic complexity',
                ],
                timestamp: new Date(),
            });
        }
        return results;
    }
    async analyzeSecurity(files) {
        const results = [];
        for (const file of files) {
            // Simulate security analysis
            if (Math.random() > 0.7) {
                results.push({
                    id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'security',
                    severity: 'high',
                    message: 'Potential hardcoded credential detected',
                    file,
                    suggestions: [
                        'Use environment variables for credentials',
                        'Use a secure vault service',
                    ],
                    timestamp: new Date(),
                });
            }
        }
        return results;
    }
    async analyzePerformance(files) {
        const results = [];
        for (const file of files) {
            // Simulate performance analysis
            results.push({
                id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'performance',
                severity: 'low',
                message: 'Consider using async/await for better performance',
                file,
                suggestions: [
                    'Use async/await instead of callbacks',
                    'Consider caching frequently accessed data',
                ],
                timestamp: new Date(),
            });
        }
        return results;
    }
    async analyzeDependencies(files) {
        const results = [];
        // Simulate dependency analysis
        results.push({
            id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'dependency',
            severity: 'medium',
            message: 'Outdated dependency detected',
            suggestions: [
                'Update to latest stable version',
                'Review breaking changes before updating',
            ],
            timestamp: new Date(),
        });
        return results;
    }
    async analyzeComplexity(files) {
        const results = [];
        for (const file of files) {
            // Simulate complexity analysis
            results.push({
                id: `complex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'complexity',
                severity: 'medium',
                message: 'High cyclomatic complexity detected',
                file,
                line: 15,
                suggestions: [
                    'Refactor complex conditional logic',
                    'Extract methods to reduce complexity',
                ],
                timestamp: new Date(),
            });
        }
        return results;
    }
    async applyCustomRules(files, rules) {
        const results = [];
        for (const file of files) {
            for (const rule of rules) {
                // Simulate custom rule application
                results.push({
                    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: rule.type,
                    severity: rule.severity,
                    message: `Custom rule violation: ${rule.name}`,
                    file,
                    suggestions: rule.suggestions,
                    metadata: { ruleId: rule.id },
                    timestamp: new Date(),
                });
            }
        }
        return results;
    }
    filterBySeverity(results, threshold) {
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        const thresholdLevel = severityOrder[threshold];
        return results.filter(result => severityOrder[result.severity] >= thresholdLevel);
    }
    generateSummary(results) {
        const summary = {
            totalIssues: results.length,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            byType: {
                code_quality: 0,
                security: 0,
                performance: 0,
                dependency: 0,
                complexity: 0,
            },
        };
        for (const result of results) {
            summary[result.severity]++;
            summary.byType[result.type]++;
        }
        return summary;
    }
    async getAnalysisReport(id) {
        // This would typically retrieve from a database
        // For now, return null
        return null;
    }
    async listAnalysisReports() {
        // This would typically retrieve from a database
        // For now, return empty array
        return [];
    }
    getDefaultConfig() {
        return {
            includeCodeQuality: true,
            includeSecurity: true,
            includePerformance: true,
            includeDependency: true,
            includeComplexity: true,
            severityThreshold: 'low',
            excludePatterns: [
                'node_modules/**',
                'dist/**',
                '*.test.*',
                '*.spec.*',
            ],
        };
    }
};
AnalysisManager = AnalysisManager_1 = __decorate([
    Injectable()
], AnalysisManager);
export { AnalysisManager };
//# sourceMappingURL=AnalysisManager.js.map