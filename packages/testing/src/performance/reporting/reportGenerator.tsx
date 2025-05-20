import { PerformanceResult, PerformanceStats } from '../utils/measurePerformance.js';
import { RegressionAnalysisResult } from '../regression/regressionDetector.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestResult {
  name: string;
  timestamp: number;
  environment: string;
  results: PerformanceResult[];
  stats: PerformanceStats;
  regressionAnalysis?: RegressionAnalysisResult;
}

export interface ReportOptions {
  format: 'json' | 'html' | 'markdown';
  outputDir: string;
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export class PerformanceReportGenerator {
  constructor(private readonly defaultOptions: Partial<ReportOptions> = {}) {}

  public async generateReport(
    testResults: TestResult[],
    options: Partial<ReportOptions> = {}
  ): Promise<string> {
    const finalOptions: ReportOptions = {
      format: 'html',
      outputDir: path.join(process.cwd(), 'performance-reports'),
      includeCharts: true,
      includeRawData: false,
      ...this.defaultOptions,
      ...options
    };

    await this.ensureOutputDirectory(finalOptions.outputDir);

    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const reportFileName = `performance-report-${timestamp}`;
    const reportPath = path.join(
      finalOptions.outputDir,
      `${reportFileName}.${finalOptions.format}`
    );

    let report: string;
    switch (finalOptions.format) {
      case 'json':
        report = this.generateJsonReport(testResults);
        break;
      case 'markdown':
        report = this.generateMarkdownReport(testResults);
        break;
      case 'html':
        // Provide a default value for includeCharts if it's undefined
        report = this.generateHtmlReport(testResults, finalOptions.includeCharts ?? false);
        break;
      default:
        throw new Error(`Unsupported report format: ${finalOptions.format}`);
    }

    await fs.writeFile(reportPath, report);
    return reportPath;
  }

  private generateJsonReport(testResults: TestResult[]): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results: testResults
      },
      null,
      2
    );
  }

  private generateMarkdownReport(testResults: TestResult[]): string {
    let report = '# Performance Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const test of testResults) {
      report += `## ${test.name}\n\n`;
      report += `Environment: ${test.environment}\n`;
      report += `Timestamp: ${new Date(test.timestamp).toISOString()}\n\n`;

      report += '### Performance Statistics\n\n';
      report += '| Metric | Value |\n';
      report += '|--------|-------|\n';
      report += `| Mean Duration | ${test.stats.mean.toFixed(2)}ms |\n`;
      report += `| Median Duration | ${test.stats.median.toFixed(2)}ms |\n`;
      report += `| P95 Duration | ${test.stats.p95.toFixed(2)}ms |\n`;
      report += `| P99 Duration | ${test.stats.p99.toFixed(2)}ms |\n`;
      report += `| Min Duration | ${test.stats.min.toFixed(2)}ms |\n`;
      report += `| Max Duration | ${test.stats.max.toFixed(2)}ms |\n`;
      report += `| Standard Deviation | ${test.stats.standardDeviation.toFixed(2)}ms |\n\n`;

      if (test.regressionAnalysis) {
        report += '### Regression Analysis\n\n';
        if (test.regressionAnalysis.hasRegression) {
          report += '#### Regressions Detected:\n\n';
          for (const [testName, metrics] of Object.entries(test.regressionAnalysis.regressions)) {
            report += `**${testName}**:\n\n`;
            for (const metric of metrics) {
              report += `- ${metric.metric}: ${metric.percentChange.toFixed(2)}% increase `;
              report += `(${metric.baselineValue.toFixed(2)} → ${metric.currentValue.toFixed(2)})\n`;
            }
          }
          report += '\n';
        } else {
          report += 'No regressions detected.\n\n';
        }

        if (Object.keys(test.regressionAnalysis.improvements).length > 0) {
          report += '#### Improvements:\n\n';
          for (const [testName, metrics] of Object.entries(test.regressionAnalysis.improvements)) {
            report += `**${testName}**:\n\n`;
            for (const metric of metrics) {
              report += `- ${metric.metric}: ${Math.abs(metric.percentChange).toFixed(2)}% decrease `;
              report += `(${metric.baselineValue.toFixed(2)} → ${metric.currentValue.toFixed(2)})\n`;
            }
          }
          report += '\n';
        }
      }
    }

    return report;
  }

  private generateHtmlReport(testResults: TestResult[], includeCharts: boolean): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .test-result { margin-bottom: 30px; }
    .stats-table { border-collapse: collapse; margin: 15px 0; }
    .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .regression { color: #d32f2f; }
    .improvement { color: #388e3c; }
    .chart { margin: 20px 0; }
  </style>
  ${includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
</head>
<body>
  <h1>Performance Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>`;

    testResults.forEach((test, index) => {
      html += `
  <div class="test-result">
    <h2>${test.name}</h2>
    <p>Environment: ${test.environment}</p>
    <p>Timestamp: ${new Date(test.timestamp).toISOString()}</p>
    
    <h3>Performance Statistics</h3>
    <table class="stats-table">
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Mean Duration</td><td>${test.stats.mean.toFixed(2)}ms</td></tr>
      <tr><td>Median Duration</td><td>${test.stats.median.toFixed(2)}ms</td></tr>
      <tr><td>P95 Duration</td><td>${test.stats.p95.toFixed(2)}ms</td></tr>
      <tr><td>P99 Duration</td><td>${test.stats.p99.toFixed(2)}ms</td></tr>
      <tr><td>Min Duration</td><td>${test.stats.min.toFixed(2)}ms</td></tr>
      <tr><td>Max Duration</td><td>${test.stats.max.toFixed(2)}ms</td></tr>
      <tr><td>Standard Deviation</td><td>${test.stats.standardDeviation.toFixed(2)}ms</td></tr>
    </table>`;

      if (includeCharts) {
        html += `
    <div class="chart">
      <canvas id="durationChart${index}"></canvas>
    </div>
    <script>
      new Chart(document.getElementById('durationChart${index}'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(test.results.map((_, i) => `Run ${i + 1}`))},
          datasets: [{
            label: 'Duration (ms)',
            data: ${JSON.stringify(test.results.map(r => r.duration))},
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Test Duration Over Time'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    </script>`;
      }

      if (test.regressionAnalysis) {
        html += `
    <h3>Regression Analysis</h3>`;
        
        if (test.regressionAnalysis.hasRegression) {
          html += `
    <div class="regression">
      <h4>Regressions Detected:</h4>
      <ul>`;
          for (const [testName, metrics] of Object.entries(test.regressionAnalysis.regressions)) {
            html += `
        <li><strong>${testName}</strong>:
          <ul>`;
            for (const metric of metrics) {
              html += `
            <li>${metric.metric}: ${metric.percentChange.toFixed(2)}% increase 
              (${metric.baselineValue.toFixed(2)} → ${metric.currentValue.toFixed(2)})</li>`;
            }
            html += `
          </ul>
        </li>`;
          }
          html += `
      </ul>
    </div>`;
        } else {
          html += `
    <p>No regressions detected.</p>`;
        }

        if (Object.keys(test.regressionAnalysis.improvements).length > 0) {
          html += `
    <div class="improvement">
      <h4>Improvements:</h4>
      <ul>`;
          for (const [testName, metrics] of Object.entries(test.regressionAnalysis.improvements)) {
            html += `
        <li><strong>${testName}</strong>:
          <ul>`;
            for (const metric of metrics) {
              html += `
            <li>${metric.metric}: ${Math.abs(metric.percentChange).toFixed(2)}% decrease 
              (${metric.baselineValue.toFixed(2)} → ${metric.currentValue.toFixed(2)})</li>`;
            }
            html += `
          </ul>
        </li>`;
          }
          html += `
      </ul>
    </div>`;
        }
      }

      html += `
  </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  private async ensureOutputDirectory(outputDir: string): Promise<void> {
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }
  }
}