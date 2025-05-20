import { PerformanceResult, PerformanceStats } from '../utils/measurePerformance.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BaselineMetrics {
  timestamp: number;
  environment: string;
  metrics: {
    [key: string]: {
      results: PerformanceResult[];
      stats: PerformanceStats;
    };
  };
}

export interface RegressionAnalysisResult {
  hasRegression: boolean;
  regressions: {
    [key: string]: {
      metric: string;
      baselineValue: number;
      currentValue: number;
      difference: number;
      percentChange: number;
    }[];
  };
  improvements: {
    [key: string]: {
      metric: string;
      baselineValue: number;
      currentValue: number;
      difference: number;
      percentChange: number;
    }[];
  };
}

export interface RegressionThresholds {
  maxDurationIncrease?: number;  // percentage
  maxMemoryIncrease?: number;    // percentage
  minSignificantChange?: number; // percentage
}

export class RegressionDetector {
  private baselinePath: string;
  private thresholds: RegressionThresholds;

  constructor(
    baselinePath: string = path.join(process.cwd(), 'performance-baselines'),
    thresholds: RegressionThresholds = {
      maxDurationIncrease: 10,    // 10% increase in duration
      maxMemoryIncrease: 15,      // 15% increase in memory
      minSignificantChange: 5     // 5% minimum change to be considered significant
    }
  ) {
    this.baselinePath = baselinePath;
    this.thresholds = thresholds;
  }

  public async saveBaseline(
    testName: string,
    results: { results: PerformanceResult[]; stats: PerformanceStats },
    environment: string = process.env.NODE_ENV || 'development'
  ): Promise<void> {
    await this.ensureBaselineDirectory();
    
    const baselineFile = path.join(this.baselinePath, `${testName}.json`);
    const baseline: BaselineMetrics = {
      timestamp: Date.now(),
      environment,
      metrics: {
        [environment]: results
      }
    };

    let existingBaseline: BaselineMetrics;
    try {
      const content = await fs.readFile(baselineFile, 'utf-8');
      existingBaseline = JSON.parse(content);
      existingBaseline.metrics[environment] = results;
      await fs.writeFile(baselineFile, JSON.stringify(existingBaseline, null, 2));
    } catch (error) {
      await fs.writeFile(baselineFile, JSON.stringify(baseline, null, 2));
    }
  }

  public async detectRegression(
    testName: string,
    currentResults: { results: PerformanceResult[]; stats: PerformanceStats },
    environment: string = process.env.NODE_ENV || 'development'
  ): Promise<RegressionAnalysisResult> {
    const baseline = await this.loadBaseline(testName, environment);
    if (!baseline) {
      throw new Error(`No baseline found for test "${testName}" in environment "${environment}"`);
    }

    const baselineMetrics = baseline.metrics[environment];
    const regressions: RegressionAnalysisResult['regressions'] = {};
    const improvements: RegressionAnalysisResult['improvements'] = {};

    // Check for duration regressions
    const durationChange = this.calculatePercentChange(
      baselineMetrics.stats.mean,
      currentResults.stats.mean
    );

    if (Math.abs(durationChange) >= (this.thresholds.minSignificantChange || 0)) {
      const changeMetric = {
        metric: 'duration',
        baselineValue: baselineMetrics.stats.mean,
        currentValue: currentResults.stats.mean,
        difference: currentResults.stats.mean - baselineMetrics.stats.mean,
        percentChange: durationChange
      };

      if (durationChange > (this.thresholds.maxDurationIncrease || 0)) {
        regressions[testName] = [changeMetric];
      } else if (durationChange < 0) {
        improvements[testName] = [changeMetric];
      }
    }

    // Check for memory regressions
    const baselineMemoryMean = this.calculateMeanMemoryUsage(baselineMetrics.results);
    const currentMemoryMean = this.calculateMeanMemoryUsage(currentResults.results);
    const memoryChange = this.calculatePercentChange(baselineMemoryMean, currentMemoryMean);

    if (Math.abs(memoryChange) >= (this.thresholds.minSignificantChange || 0)) {
      const changeMetric = {
        metric: 'memory',
        baselineValue: baselineMemoryMean,
        currentValue: currentMemoryMean,
        difference: currentMemoryMean - baselineMemoryMean,
        percentChange: memoryChange
      };

      if (memoryChange > (this.thresholds.maxMemoryIncrease || 0)) {
        regressions[testName] = [...(regressions[testName] || []), changeMetric];
      } else if (memoryChange < 0) {
        improvements[testName] = [...(improvements[testName] || []), changeMetric];
      }
    }

    return {
      hasRegression: Object.keys(regressions).length > 0,
      regressions,
      improvements
    };
  }

  private async loadBaseline(
    testName: string,
    environment: string
  ): Promise<BaselineMetrics | null> {
    try {
      const content = await fs.readFile(
        path.join(this.baselinePath, `${testName}.json`),
        'utf-8'
      );
      const baseline: BaselineMetrics = JSON.parse(content);
      return baseline.metrics[environment] ? baseline : null;
    } catch (error) {
      return null;
    }
  }

  private async ensureBaselineDirectory(): Promise<void> {
    try {
      await fs.access(this.baselinePath);
    } catch {
      await fs.mkdir(this.baselinePath, { recursive: true });
    }
  }

  private calculateMeanMemoryUsage(results: PerformanceResult[]): number {
    return results.reduce((sum, result) => sum + result.memoryDiff, 0) / results.length;
  }

  private calculatePercentChange(baseline: number, current: number): number {
    return ((current - baseline) / baseline) * 100;
  }
}