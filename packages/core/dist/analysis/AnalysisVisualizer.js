var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnalysisVisualizer_1;
import { Injectable, Logger } from '@nestjs/common';
export var AnalysisType;
(function (AnalysisType) {
    AnalysisType["DEPENDENCY"] = "dependency";
    AnalysisType["SECURITY"] = "security";
    AnalysisType["PERFORMANCE"] = "performance";
    AnalysisType["CODE_QUALITY"] = "code_quality";
    AnalysisType["COMPLEXITY"] = "complexity";
})(AnalysisType || (AnalysisType = {}));
let AnalysisVisualizer = AnalysisVisualizer_1 = class AnalysisVisualizer {
    constructor() {
        this.logger = new Logger(AnalysisVisualizer_1.name);
    }
    async visualizeAnalysis(report, options = {}) {
        this.logger.debug(`Visualizing analysis report: ${report.id}`);
        try {
            const format = options.format || 'json';
            switch (format) {
                case 'json':
                    return this.generateJsonVisualization(report, options);
                case 'html':
                    return this.generateHtmlVisualization(report, options);
                case 'svg':
                    return this.generateSvgVisualization(report, options);
                case 'text':
                    return this.generateTextVisualization(report, options);
                default:
                    this.logger.warn('No visualization format specified, defaulting to json');
                    return this.generateJsonVisualization(report, options);
            }
        }
        catch (error) {
            this.logger.error(`Visualization failed for report ${report.id}`, error);
            throw new Error(`Visualization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async visualizeByType(results, analysisType, options = {}) {
        const filteredResults = results.filter(r => r.type === analysisType);
        switch (analysisType) {
            case AnalysisType.DEPENDENCY:
                return this.createDependencyVisualization(filteredResults, options);
            case AnalysisType.SECURITY:
                return this.createSecurityVisualization(filteredResults, options);
            case AnalysisType.PERFORMANCE:
                return this.createPerformanceVisualization(filteredResults, options);
            case AnalysisType.CODE_QUALITY:
                return this.createCodeQualityVisualization(filteredResults, options);
            case AnalysisType.COMPLEXITY:
                return this.createComplexityVisualization(filteredResults, options);
            default:
                throw new Error(`Unsupported analysis type: ${analysisType}`);
        }
    }
    generateJsonVisualization(report, options) {
        return {
            type: 'text',
            title: 'Analysis Report (JSON)',
            description: 'Raw JSON representation of the analysis report',
            data: JSON.stringify(report, null, 2),
            metadata: { format: 'json', reportId: report.id },
        };
    }
    generateHtmlVisualization(report, options) {
        const theme = options.theme || 'light';
        const html = this.createHtmlReport(report, theme);
        return {
            type: 'text',
            title: 'Analysis Report (HTML)',
            description: 'HTML formatted analysis report',
            data: html,
            metadata: { format: 'html', theme, reportId: report.id },
        };
    }
    generateSvgVisualization(report, options) {
        const svg = this.createSvgChart(report);
        return {
            type: 'chart',
            title: 'Analysis Report (SVG Chart)',
            description: 'SVG chart visualization of analysis results',
            data: svg,
            metadata: { format: 'svg', reportId: report.id },
        };
    }
    generateTextVisualization(report, options) {
        const sections = [];
        sections.push(`Analysis Report: ${report.id}`);
        sections.push(`Timestamp: ${report.timestamp.toISOString()}`);
        sections.push(`Execution Time: ${report.executionTime}ms`);
        sections.push(`Total Issues: ${report.summary.totalIssues}`);
        sections.push('');
        sections.push('Summary by Severity:');
        sections.push(`  Critical: ${report.summary.critical}`);
        sections.push(`  High: ${report.summary.high}`);
        sections.push(`  Medium: ${report.summary.medium}`);
        sections.push(`  Low: ${report.summary.low}`);
        sections.push('');
        sections.push('Summary by Type:');
        Object.entries(report.summary.byType).forEach(([type, count]) => {
            sections.push(`  ${type}: ${count}`);
        });
        if (report.results.length > 0) {
            sections.push('');
            sections.push('Top Issues:');
            const topIssues = report.results
                .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
                .slice(0, 10);
            topIssues.forEach((issue, index) => {
                sections.push(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
                if (issue.file) {
                    sections.push(`     File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
                }
            });
        }
        return {
            type: 'text',
            title: 'Analysis Report (Text)',
            description: 'Text summary of analysis report',
            data: sections.join('\n'),
            metadata: { format: 'text', reportId: report.id },
        };
    }
    createDependencyVisualization(results, options) {
        const sections = [];
        sections.push('Dependency Analysis');
        sections.push('This visualization shows dependency-related issues and vulnerabilities.');
        sections.push('');
        results.forEach((result, index) => {
            sections.push(`${index + 1}. ${result.message}`);
            if (result.suggestions && result.suggestions.length > 0) {
                sections.push(`   Suggestions: ${result.suggestions.join(', ')}`);
            }
        });
        return {
            type: 'text',
            title: 'Dependency Analysis',
            description: 'Analysis of project dependencies',
            data: sections.join('\n'),
            metadata: { analysisType: 'dependency' },
        };
    }
    createSecurityVisualization(results, options) {
        const sections = [];
        sections.push('Security Analysis');
        sections.push('This visualization shows security vulnerabilities and risks.');
        sections.push('');
        const criticalIssues = results.filter(r => r.severity === 'critical');
        const highIssues = results.filter(r => r.severity === 'high');
        if (criticalIssues.length > 0) {
            sections.push('Critical Security Issues:');
            criticalIssues.forEach((issue, index) => {
                sections.push(`  ${index + 1}. ${issue.message}`);
                if (issue.file)
                    sections.push(`     File: ${issue.file}`);
            });
            sections.push('');
        }
        if (highIssues.length > 0) {
            sections.push('High Priority Security Issues:');
            highIssues.forEach((issue, index) => {
                sections.push(`  ${index + 1}. ${issue.message}`);
                if (issue.file)
                    sections.push(`     File: ${issue.file}`);
            });
        }
        return {
            type: 'text',
            title: 'Security Analysis',
            description: 'Security vulnerability analysis',
            data: sections.join('\n'),
            metadata: { analysisType: 'security' },
        };
    }
    createPerformanceVisualization(results, options) {
        const sections = [];
        sections.push('Performance Analysis');
        sections.push('This visualization shows performance issues and optimization opportunities.');
        sections.push('');
        results.forEach((result, index) => {
            sections.push(`${index + 1}. ${result.message}`);
            if (result.file) {
                sections.push(`   File: ${result.file}${result.line ? `:${result.line}` : ''}`);
            }
            if (result.suggestions && result.suggestions.length > 0) {
                sections.push(`   Suggestions: ${result.suggestions.join(', ')}`);
            }
            sections.push('');
        });
        return {
            type: 'text',
            title: 'Performance Analysis',
            description: 'Performance optimization analysis',
            data: sections.join('\n'),
            metadata: { analysisType: 'performance' },
        };
    }
    createCodeQualityVisualization(results, options) {
        const sections = [];
        sections.push('Code Quality Analysis');
        sections.push('This visualization shows code quality metrics and issues.');
        sections.push('');
        const groupedByFile = this.groupResultsByFile(results);
        Object.entries(groupedByFile).forEach(([file, fileResults]) => {
            sections.push(`File: ${file}`);
            fileResults.forEach((result, index) => {
                sections.push(`  ${index + 1}. [${result.severity.toUpperCase()}] ${result.message}`);
                if (result.line)
                    sections.push(`     Line: ${result.line}`);
            });
            sections.push('');
        });
        return {
            type: 'text',
            title: 'Code Quality Analysis',
            description: 'Code quality assessment',
            data: sections.join('\n'),
            metadata: { analysisType: 'code_quality' },
        };
    }
    createComplexityVisualization(results, options) {
        const sections = [];
        sections.push('Complexity Analysis');
        sections.push('This visualization shows code complexity metrics.');
        sections.push('');
        const complexFiles = this.groupResultsByFile(results);
        const sortedFiles = Object.entries(complexFiles).sort(([, a], [, b]) => b.length - a.length);
        sections.push('Most Complex Files:');
        sortedFiles.slice(0, 10).forEach(([file, issues], index) => {
            sections.push(`  ${index + 1}. ${file} (${issues.length} complexity issues)`);
        });
        return {
            type: 'text',
            title: 'Complexity Analysis',
            description: 'Code complexity assessment',
            data: sections.join('\n'),
            metadata: { analysisType: 'complexity' },
        };
    }
    visualizeMetrics(metrics) {
        const sections = [];
        sections.push('System Metrics');
        sections.push('');
        if (metrics.cpuUsage !== undefined) {
            sections.push(`CPU Usage: ${metrics.cpuUsage}%`);
        }
        if (metrics.memoryUsage !== undefined) {
            sections.push(`Memory Usage: ${metrics.memoryUsage} MB`);
        }
        if (metrics.throughput !== undefined) {
            sections.push(`Throughput: ${metrics.throughput} req/s`);
        }
        if (metrics.errorRate !== undefined) {
            sections.push(`Error Rate: ${metrics.errorRate}%`);
        }
        if (metrics.responseTime !== undefined) {
            sections.push(`Response Time: ${metrics.responseTime}ms`);
        }
        if (metrics.activeConnections !== undefined) {
            sections.push(`Active Connections: ${metrics.activeConnections}`);
        }
        return {
            type: 'text',
            title: 'System Metrics',
            description: 'Current system performance metrics',
            data: sections.join('\n'),
            metadata: { type: 'metrics' },
        };
    }
    visualizeDependencyGraph(dependencies) {
        if (!dependencies || dependencies.length === 0) {
            return {
                type: 'text',
                title: 'Dependency Graph',
                description: 'No dependencies found',
                data: 'No dependencies found.',
                metadata: { type: 'dependency_graph' },
            };
        }
        const sections = [];
        sections.push('Dependency Graph');
        sections.push('');
        dependencies.forEach(dep => {
            sections.push(`${dep.name}${dep.version ? ` v${dep.version}` : ''}`);
            sections.push(`  Type: ${dep.type}`);
            if (dep.vulnerable) {
                sections.push(`  ⚠️  VULNERABLE`);
            }
            if (dep.dependencies && dep.dependencies.length > 0) {
                sections.push(`  Dependencies: ${dep.dependencies.join(', ')}`);
            }
            sections.push('');
        });
        return {
            type: 'graph',
            title: 'Dependency Graph',
            description: 'Project dependency visualization',
            data: sections.join('\n'),
            metadata: { type: 'dependency_graph', nodeCount: dependencies.length },
        };
    }
    createHtmlReport(report, theme) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analysis Report - ${report.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; }
          .summary { margin: 20px 0; }
          .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
          .critical { border-left-color: #ff0000; }
          .high { border-left-color: #ff6600; }
          .medium { border-left-color: #ffcc00; }
          .low { border-left-color: #00cc00; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Analysis Report</h1>
          <p>Report ID: ${report.id}</p>
          <p>Generated: ${report.timestamp.toISOString()}</p>
          <p>Execution Time: ${report.executionTime}ms</p>
        </div>
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Issues: ${report.summary.totalIssues}</p>
          <ul>
            <li>Critical: ${report.summary.critical}</li>
            <li>High: ${report.summary.high}</li>
            <li>Medium: ${report.summary.medium}</li>
            <li>Low: ${report.summary.low}</li>
          </ul>
        </div>
        <div class="issues">
          <h2>Issues</h2>
          ${report.results.map(issue => `
            <div class="issue ${issue.severity}">
              <strong>[${issue.severity.toUpperCase()}] ${issue.message}</strong>
              ${issue.file ? `<br>File: ${issue.file}${issue.line ? `:${issue.line}` : ''}` : ''}
              ${issue.suggestions ? `<br>Suggestions: ${issue.suggestions.join(', ')}` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
    }
    createSvgChart(report) {
        const data = [
            { label: 'Critical', value: report.summary.critical, color: '#ff0000' },
            { label: 'High', value: report.summary.high, color: '#ff6600' },
            { label: 'Medium', value: report.summary.medium, color: '#ffcc00' },
            { label: 'Low', value: report.summary.low, color: '#00cc00' }
        ];
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0)
            return '<svg width="400" height="300"><text x="100" y="150">No data to display</text></svg>';
        let currentAngle = 0;
        const slices = data.map(item => {
            const sliceAngle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;
            return {
                ...item,
                startAngle,
                endAngle,
                percentage: ((item.value / total) * 100).toFixed(1)
            };
        });
        return `
      <svg width="400" height="300" viewBox="0 0 400 300">
        <title>Analysis Results by Severity</title>
        <g transform="translate(150, 150)">
          ${slices.map(slice => {
            const x1 = Math.cos((slice.startAngle - 90) * Math.PI / 180) * 80;
            const y1 = Math.sin((slice.startAngle - 90) * Math.PI / 180) * 80;
            const x2 = Math.cos((slice.endAngle - 90) * Math.PI / 180) * 80;
            const y2 = Math.sin((slice.endAngle - 90) * Math.PI / 180) * 80;
            const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
            return `
              <path d="M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z"
                    fill="${slice.color}"
                    stroke="white"
                    stroke-width="2">
                <title>${slice.label}: ${slice.value} (${slice.percentage}%)</title>
              </path>
            `;
        }).join('')}
        </g>
        <g transform="translate(280, 50)">
          ${slices.map((slice, index) => `
            <g transform="translate(0, ${index * 25})">
              <rect x="0" y="0" width="15" height="15" fill="${slice.color}"/>
              <text x="20" y="12" font-family="Arial" font-size="12">
                ${slice.label}: ${slice.value}
              </text>
            </g>
          `).join('')}
        </g>
      </svg>
    `;
    }
    getSeverityWeight(severity) {
        const weights = { low: 1, medium: 2, high: 3, critical: 4 };
        return weights[severity] || 0;
    }
    groupResultsByFile(results) {
        return results.reduce((groups, result) => {
            const file = result.file || 'Unknown';
            if (!groups[file]) {
                groups[file] = [];
            }
            groups[file].push(result);
            return groups;
        }, {});
    }
};
AnalysisVisualizer = AnalysisVisualizer_1 = __decorate([
    Injectable()
], AnalysisVisualizer);
export { AnalysisVisualizer };
//# sourceMappingURL=AnalysisVisualizer.js.map