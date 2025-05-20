import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CodeQualityIssue, ErrorSeverity } from '@the-new-fuse/types';

interface ProjectFile {
  id: string;
  path: string;
  metrics?: {
    complexity: number;
    maintainability: number;
  };
  lintIssues?: Array<{
    severity: string;
    message: string;
    line: number;
    ruleId: string;
  }>;
}

@Injectable()
export class CodeQualityAnalyzer {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeCode(projectId: string): Promise<{
    issues: CodeQualityIssue[];
    metrics: Record<string, number>;
  }> {
    const files = await this.prisma.$queryRaw<ProjectFile[]>`
      SELECT f.*, m.*, l.*
      FROM files f
      LEFT JOIN file_metrics m ON f.id = m.file_id
      LEFT JOIN lint_issues l ON f.id = l.file_id
      WHERE f.project_id = ${projectId}
    `;

    const issues: CodeQualityIssue[] = [];
    const metrics: Record<string, number> = {
      totalFiles: files.length,
      totalIssues: 0,
      complexityScore: 0,
      maintainabilityIndex: 0,
      testCoverage: 0
    };

    for (const file of files) {
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);

      if (file.metrics?.complexity) {
        metrics.complexityScore += file.metrics.complexity;
      }

      if (file.metrics?.maintainability) {
        metrics.maintainabilityIndex += file.metrics.maintainability;
      }
    }

    if (files.length > 0) {
      metrics.complexityScore /= files.length;
      metrics.maintainabilityIndex /= files.length;
    }

    // Get test coverage
    const coverage = await this.getTestCoverage(projectId);
    metrics.testCoverage = coverage;
    metrics.totalIssues = issues.length;

    return { issues, metrics };
  }

  private async analyzeFile(file: ProjectFile): Promise<CodeQualityIssue[]> {
    const issues: CodeQualityIssue[] = [];

    try {
      // Get lint issues
      if (file.lintIssues && file.lintIssues.length > 0) {
        file.lintIssues.forEach(issue => {
          issues.push({
            type: 'lint',
            severity: this.mapSeverity(issue.severity),
            description: issue.message,
            location: `${file.path}:${issue.line}`,
            rule: issue.ruleId || 'lint',
            fix: 'Fix the lint issue according to the rule'
          });
        });
      }

      // Check for code complexity issues
      if (file.metrics?.complexity && file.metrics.complexity > 10) {
        issues.push({
          type: 'complexity',
          severity: ErrorSeverity.MEDIUM,
          description: `High code complexity (${file.metrics.complexity}) in ${file.path}`,
          location: file.path,
          rule: 'complexity',
          fix: 'Consider breaking down the function into smaller functions'
        });
      }

      // Check for maintainability issues
      if (file.metrics?.maintainability && file.metrics.maintainability < 50) {
        issues.push({
          type: 'maintainability',
          severity: ErrorSeverity.HIGH,
          description: `Low maintainability (${file.metrics.maintainability}) in ${file.path}`,
          location: file.path,
          rule: 'maintainability',
          fix: 'Consider refactoring the code to improve maintainability'
        });
      }

      return issues;
    } catch (error) {
      // Handle error
      console.error('Error analyzing file:', error);
      return issues;
    }
  }

  private async getTestCoverage(projectId: string): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ percentage: number }>>`
        SELECT percentage
        FROM test_coverage
        WHERE project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      return result[0]?.percentage || 0;
    } catch (error) {
      // Handle error
      console.error('Error getting test coverage:', error);
      return 0;
    }
  }

  private mapSeverity(severity: string): ErrorSeverity {
    switch (severity.toUpperCase()) {
      case 'ERROR':
      case 'CRITICAL':
        return ErrorSeverity.HIGH;
      case 'WARNING':
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  }
}
