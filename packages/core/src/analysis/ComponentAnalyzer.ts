import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ComponentAnalysis {
  componentName: string;
  type: 'memory' | 'repository' | 'api' | 'frontend' | 'module';
  path: string;
  dependencies: string[];
  size: number;
  complexity: number;
  lastModified: Date;
  issues: ComponentIssue[];
}

export interface ComponentIssue {
  type: 'performance' | 'security' | 'maintainability' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
}

export interface AnalysisOptions {
  includeTests?: boolean;
  depth?: number;
  excludePatterns?: string[];
}

export class ComponentAnalyzer extends EventEmitter {
  private readonly logger = new Logger(ComponentAnalyzer.name);

  async analyzeComponent(filePath: string, options?: AnalysisOptions): Promise<ComponentAnalysis> {
    this.logger.debug(`Analyzing component at path: ${filePath}`);
    try {
      const stats = await fs.promises.stat(filePath);
      const analysis: ComponentAnalysis = {
        componentName: this.extractComponentName(filePath),
        type: this.determineComponentType(filePath),
        path: filePath,
        dependencies: await this.analyzeDependencies(filePath),
        size: stats.size,
        complexity: await this.calculateComplexity(filePath),
        lastModified: stats.mtime,
        issues: await this.detectIssues(filePath),
      };
      this.emit('analysisComplete', analysis);
      return analysis;
    } catch (error) {
      this.logger.error(`Component analysis failed for ${filePath}`, error);
      throw new Error(`Failed to analyze component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeMultipleComponents(paths: string[], options?: AnalysisOptions): Promise<ComponentAnalysis[]> {
    const results: ComponentAnalysis[] = [];
    for (const p of paths) {
      try {
        const analysis = await this.analyzeComponent(p, options);
        results.push(analysis);
      } catch (error) {
        this.logger.warn(`Skipping analysis for ${p} due to error:`, error);
      }
    }
    return results;
  }

  private extractComponentName(filePath: string): string {
    return path.basename(filePath);
  }

  private determineComponentType(filePath: string): ComponentAnalysis['type'] {
    if (filePath.includes('service')) return 'module';
    if (filePath.includes('controller')) return 'api';
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'frontend';
    if (filePath.includes('repository') || filePath.includes('database')) return 'repository';
    if (filePath.includes('memory')) return 'memory';
    return 'module';
  }

  private async analyzeDependencies(filePath: string): Promise<string[]> {
    // Simulate dependency analysis
    return [
      'react',
      '@nestjs/common',
      'lodash',
    ];
  }

  private async calculateComplexity(filePath: string): Promise<number> {
    // Simulate complexity calculation (cyclomatic complexity)
    return Math.floor(Math.random() * 20) + 1;
  }

  private async detectIssues(filePath: string): Promise<ComponentIssue[]> {
    const issues: ComponentIssue[] = [];
    // Simulate issue detection
    if (Math.random() > 0.5) {
      issues.push({
        type: 'maintainability',
        severity: 'medium',
        message: 'Function complexity is high',
        suggestion: 'Consider breaking down large functions into smaller ones',
      });
    }

    if (Math.random() > 0.7) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: 'Potential performance optimization opportunity',
        suggestion: 'Consider memoization for expensive calculations',
      });
    }

    return issues;
  }

  generateReport(analyses: ComponentAnalysis[]): string {
    if (!analyses || analyses.length === 0) {
        return "No analysis results to report.";
    }
    const totalComponents = analyses.length;
    const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
    const averageComplexity = analyses.reduce((sum, analysis) => sum + analysis.complexity, 0) / totalComponents;
    
    const report = [
      '# Component Analysis Report',
      '',
      `## Summary`,
      `- Total Components Analyzed: ${totalComponents}`,
      `- Total Issues Found: ${totalIssues}`,
      `- Average Complexity: ${averageComplexity.toFixed(2)}`,
      '',
      '## Components by Type',
    ];

    const typeGroups = analyses.reduce((groups, analysis) => {
      const type = analysis.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(analysis);
      return groups;
    }, {} as Record<string, ComponentAnalysis[]>);

    Object.entries(typeGroups).forEach(([type, components]) => {
      report.push(`- ${type}: ${components.length} components`);
    });

    report.push('', '## High Priority Issues');
    const highPriorityIssues = analyses
      .flatMap(analysis =>
        analysis.issues
          .filter(issue => issue.severity === 'high' || issue.severity === 'critical')
          .map(issue => ({ ...issue, component: analysis.componentName }))
      );

    if (highPriorityIssues.length === 0) {
      report.push('No high priority issues found.');
    } else {
      highPriorityIssues.forEach(issue => {
        report.push(`- **${issue.component}**: ${issue.message} (${issue.severity})`);
        if (issue.suggestion) {
          report.push(`  Suggestion: ${issue.suggestion}`);
        }
      });
    }

    return report.join('\n');
  }
}