var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let PerformanceAnalyzer = class PerformanceAnalyzer {
    async analyzePerformance(filePath) {
        try {
            const metrics = await this.collectMetrics(filePath);
            const issues = await this.detectIssues(metrics);
            const score = this.calculateScore(issues);
            const summary = this.calculateSummary(metrics);
            return {
                fileName: filePath,
                metrics,
                issues,
                score,
                summary
            };
        }
        catch (error) {
            console.error('Error analyzing performance:', error);
            throw error;
        }
    }
    async collectMetrics(filePath) {
        return [
            {
                name: 'responseTime',
                value: Math.random() * 1000,
                unit: 'ms',
                timestamp: new Date(),
                threshold: 500
            },
            {
                name: 'memoryUsage',
                value: Math.random() * 100,
                unit: 'MB',
                timestamp: new Date(),
                threshold: 512
            },
            {
                name: 'cpuUsage',
                value: Math.random() * 100,
                unit: '%',
                timestamp: new Date(),
                threshold: 80
            }
        ];
    }
    async detectIssues(metrics) {
        const issues = [];
        metrics.forEach(metric => {
            if (metric.threshold && metric.value > metric.threshold) {
                issues.push({
                    type: this.mapMetricToIssueType(metric.name),
                    severity: 'high',
                    description: `${metric.name} exceeded threshold`,
                    metric,
                    suggestion: `Optimize to bring ${metric.name} below ${metric.threshold}${metric.unit}`
                });
            }
        });
        return issues;
    }
    mapMetricToIssueType(metricName) {
        if (metricName.includes('memory'))
            return 'memory';
        if (metricName.includes('cpu'))
            return 'cpu';
        if (metricName.includes('network'))
            return 'network';
        return 'slow';
    }
    calculateScore(issues) {
        const weights = {
            low: 1,
            medium: 3,
            high: 7,
            critical: 15
        };
        const totalWeight = issues.reduce((sum, issue) => {
            return sum + weights[issue.severity];
        }, 0);
        return Math.max(0, 100 - totalWeight);
    }
    calculateSummary(metrics) {
        return {
            avgResponseTime: metrics.find(m => m.name === 'responseTime')?.value || 0,
            peakMemoryUsage: metrics.find(m => m.name === 'memoryUsage')?.value || 0,
            cpuUtilization: metrics.find(m => m.name === 'cpuUsage')?.value || 0
        };
    }
};
PerformanceAnalyzer = __decorate([
    Injectable()
], PerformanceAnalyzer);
export { PerformanceAnalyzer };
//# sourceMappingURL=performance.analyzer.js.map