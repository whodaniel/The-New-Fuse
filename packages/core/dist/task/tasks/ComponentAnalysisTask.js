var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
let ComponentAnalysisTask = class ComponentAnalysisTask {
    constructor() { }
    async execute(data) {
        const { componentId, sourceCode } = data;
        const complexity = await this.analyzeComplexity(sourceCode);
        const maintainability = await this.analyzeMaintainability(sourceCode);
        const performance = await this.analyzePerformance(sourceCode);
        const issues = await this.generateIssues(sourceCode);
        const recommendations = await this.generateRecommendations(sourceCode);
        return {
            componentId,
            analysis: {
                complexity,
                maintainability,
                security: 0, // Placeholder
                performance,
                issues,
                recommendations,
            },
            metrics: {}, // Placeholder
            timestamp: new Date().toISOString(),
        };
    }
    async analyzeComplexity(sourceCode) {
        if (!sourceCode)
            return 0;
        const lines = sourceCode.split('\n').length;
        const nesting = (sourceCode.match(/[{}]/g) || []).length / 2;
        const conditions = (sourceCode.match(/\b(if|else|switch|case)\b/g) || []).length;
        return Math.min(100, lines * 0.1 + nesting * 5 + conditions * 3);
    }
    async analyzeMaintainability(sourceCode) {
        if (!sourceCode)
            return 0;
        let score = 100;
        const patterns = [/eval\(/, /innerHTML/];
        patterns.forEach(pattern => {
            const matches = sourceCode.match(pattern);
            if (matches) {
                score -= matches.length * 10;
            }
        });
        return Math.max(0, score);
    }
    async analyzePerformance(sourceCode) {
        if (!sourceCode)
            return 100;
        const inefficientPatterns = [
            /for\s*\([^)]*\)\s*{[^}]*for\s*\(/gi, // Nested loops
            /while\s*\([^)]*\)\s*{[^}]*while\s*\(/gi, // Nested while loops
        ];
        let score = 100;
        inefficientPatterns.forEach(pattern => {
            const matches = sourceCode.match(pattern);
            if (matches) {
                score -= matches.length * 5;
            }
        });
        return Math.max(0, score);
    }
    async generateIssues(sourceCode) {
        const issues = [];
        if (!sourceCode)
            return issues;
        if (sourceCode.includes('eval(')) {
            issues.push('Use of eval() is dangerous and should be avoided');
        }
        if (sourceCode.includes('innerHTML')) {
            issues.push('Direct innerHTML assignment can lead to XSS vulnerabilities');
        }
        return issues;
    }
    async generateRecommendations(sourceCode) {
        const recommendations = [];
        if (!sourceCode)
            return recommendations;
        recommendations.push('Consider adding unit tests for this component');
        recommendations.push('Add JSDoc comments for better documentation');
        return recommendations;
    }
};
ComponentAnalysisTask = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ComponentAnalysisTask);
export { ComponentAnalysisTask };
//# sourceMappingURL=ComponentAnalysisTask.js.map