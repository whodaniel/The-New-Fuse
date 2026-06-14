var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
let CodeQualityAnalyzer = class CodeQualityAnalyzer {
    async analyzeFile(filePath) {
        try {
            const issues = [];
            // Analyze lint issues
            const lintIssues = await this.analyzeLintIssues(filePath);
            issues.push(...lintIssues);
            // Analyze complexity
            const complexityIssues = await this.analyzeComplexity(filePath);
            issues.push(...complexityIssues);
            // Analyze maintainability
            const maintainabilityIssues = await this.analyzeMaintainability(filePath);
            issues.push(...maintainabilityIssues);
            const score = this.calculateScore(issues);
            const metrics = await this.getMetrics(filePath);
            return {
                fileName: filePath,
                issues,
                score,
                metrics
            };
        }
        catch (error) {
            console.error('Error analyzing file:', error);
            throw error;
        }
    }
    async analyzeLintIssues(filePath) {
        // Implementation for lint analysis
        return [];
    }
    async analyzeComplexity(filePath) {
        // Implementation for complexity analysis
        return [];
    }
    async analyzeMaintainability(filePath) {
        // Implementation for maintainability analysis
        return [];
    }
    calculateScore(issues) {
        const weights = {
            [ErrorSeverity.LOW]: 1,
            [ErrorSeverity.MEDIUM]: 3,
            [ErrorSeverity.HIGH]: 7,
            [ErrorSeverity.CRITICAL]: 15
        };
        const totalWeight = issues.reduce((sum, issue) => {
            return sum + weights[issue.severity];
        }, 0);
        return Math.max(0, 100 - totalWeight);
    }
    async getMetrics(filePath) {
        try {
            // Implementation for getting metrics
            return {
                complexity: 1,
                maintainability: 80,
                coverage: 85
            };
        }
        catch (error) {
            console.error('Error getting metrics:', error);
            return {
                complexity: 1,
                maintainability: 80
            };
        }
    }
    getSeverityLevel(score) {
        if (score >= 90)
            return ErrorSeverity.LOW;
        if (score >= 70)
            return ErrorSeverity.MEDIUM;
        if (score >= 50)
            return ErrorSeverity.HIGH;
        return ErrorSeverity.CRITICAL;
    }
};
CodeQualityAnalyzer = __decorate([
    Injectable()
], CodeQualityAnalyzer);
export { CodeQualityAnalyzer };
//# sourceMappingURL=code.quality.analyzer.js.map