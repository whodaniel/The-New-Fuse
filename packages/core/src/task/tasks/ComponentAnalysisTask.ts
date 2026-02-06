import { Injectable } from '@nestjs/common';

export interface ComponentAnalysisData {
  componentId: string;
  componentType: string;
  sourceCode?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface ComponentAnalysisResult {
  componentId: string;
  analysis: {
    complexity: number;
    maintainability: number;
    security: number;
    performance: number;
    issues: string[];
    recommendations: string[];
  };
  metrics: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class ComponentAnalysisTask {
  constructor() {}

  async execute(data: ComponentAnalysisData): Promise<ComponentAnalysisResult> {
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

  async analyzeComplexity(sourceCode: string | undefined): Promise<number> {
    if (!sourceCode) return 0;
    const lines = sourceCode.split('\n').length;
    const nesting = (sourceCode.match(/[{}]/g) || []).length / 2;
    const conditions = (sourceCode.match(/\b(if|else|switch|case)\b/g) || []).length;
    return Math.min(100, lines * 0.1 + nesting * 5 + conditions * 3);
  }

  async analyzeMaintainability(sourceCode: string | undefined): Promise<number> {
    if (!sourceCode) return 0;
    let score = 100;
    const patterns = [/eval\(/, /innerHTML/];
    patterns.forEach((pattern) => {
      const matches = sourceCode.match(pattern);
      if (matches) {
        score -= matches.length * 10;
      }
    });
    return Math.max(0, score);
  }

  async analyzePerformance(sourceCode: string | undefined): Promise<number> {
    if (!sourceCode) return 100;
    const inefficientPatterns = [
      /for\s*\([^)]*\)\s*{[^}]*for\s*\(/gi, // Nested loops
      /while\s*\([^)]*\)\s*{[^}]*while\s*\(/gi, // Nested while loops
    ];
    let score = 100;
    inefficientPatterns.forEach((pattern) => {
      const matches = sourceCode.match(pattern);
      if (matches) {
        score -= matches.length * 5;
      }
    });
    return Math.max(0, score);
  }

  async generateIssues(sourceCode: string | undefined): Promise<string[]> {
    const issues: string[] = [];
    if (!sourceCode) return issues;
    if (sourceCode.includes('eval(')) {
      issues.push('Use of eval() is dangerous and should be avoided');
    }
    if (sourceCode.includes('innerHTML')) {
      issues.push('Direct innerHTML assignment can lead to XSS vulnerabilities');
    }
    return issues;
  }

  async generateRecommendations(sourceCode: string | undefined): Promise<string[]> {
    const recommendations: string[] = [];
    if (!sourceCode) return recommendations;
    recommendations.push('Consider adding unit tests for this component');
    recommendations.push('Add JSDoc comments for better documentation');
    return recommendations;
  }
}
