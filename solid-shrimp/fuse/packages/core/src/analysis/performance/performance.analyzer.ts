import { Injectable } from '@nestjs/common';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: number;
}

export interface PerformanceIssue {
  type: 'slow' | 'memory' | 'cpu' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metric: PerformanceMetric;
  suggestion?: string;
}

export interface PerformanceReport {
  fileName: string;
  metrics: PerformanceMetric[];
  issues: PerformanceIssue[];
  score: number;
  summary: {
    avgResponseTime: number;
    peakMemoryUsage: number;
    cpuUtilization: number;
  };
}

@Injectable()
export class PerformanceAnalyzer {
  async analyzePerformance(filePath: string): Promise<PerformanceReport> {
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
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  private async collectMetrics(filePath: string): Promise<PerformanceMetric[]> {
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

  private async detectIssues(metrics: PerformanceMetric[]): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];

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

  private mapMetricToIssueType(metricName: string): PerformanceIssue['type'] {
    if (metricName.includes('memory')) return 'memory';
    if (metricName.includes('cpu')) return 'cpu';
    if (metricName.includes('network')) return 'network';
    return 'slow';
  }

  private calculateScore(issues: PerformanceIssue[]): number {
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

  private calculateSummary(metrics: PerformanceMetric[]) {
    return {
      avgResponseTime: metrics.find(m => m.name === 'responseTime')?.value || 0,
      peakMemoryUsage: metrics.find(m => m.name === 'memoryUsage')?.value || 0,
      cpuUtilization: metrics.find(m => m.name === 'cpuUsage')?.value || 0
    };
  }
}
