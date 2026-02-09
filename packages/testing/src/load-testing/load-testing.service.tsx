import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';

const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

export interface LoadTestConfig {
  url: string;
  method: string;
  duration: number;
  rate: number;
  connections: number;
  headers?: Record<string, string>;
  body?: any;
  variables?: Record<string, any>;
  assertions?: {
    responseTime?: number;
    statusCode?: number;
    failureRate?: number;
  };
}

export interface LoadTestResult {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p90ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  assertions: {
    passed: boolean;
    details: {
      responseTime?: { passed: boolean; actual: number; expected: number };
      statusCode?: { passed: boolean; actual: number; expected: number };
      failureRate?: { passed: boolean; actual: number; expected: number };
    };
  };
  timestamp: Date;
  config: LoadTestConfig;
  rawOutput: string;
}

@Injectable()
export class LoadTestingService {
  private readonly outputDir: string;

  constructor(private readonly configService: ConfigService) {
    this.outputDir = this.configService.get<string>('testing.loadTesting.outputDir', 'test-results/load-tests');
  }

  /**
   * Run a load test using k6
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    // Ensure output directory exists
    await mkdir(this.outputDir, { recursive: true });
    
    // Generate k6 script
    const scriptPath = await this.generateK6Script(config);
    
    // Run k6
    const { stdout, stderr } = await exec(`k6 run ${scriptPath}`);
    
    // Parse results
    const result = this.parseK6Output(stdout, config);
    
    // Save results
    await this.saveResults(result);
    
    return result;
  }

  /**
   * Generate a k6 script from a configuration
   */
  private async generateK6Script(config: LoadTestConfig): Promise<string> {
    const scriptContent = `
      import http from 'k6/http';
      import { check, sleep } from 'k6';
      
      export const options = {
        vus: ${config.connections},
        duration: '${config.duration}s',
        thresholds: {
          http_req_duration: ['p(95)<${config.assertions?.responseTime || 500}'],
          http_req_failed: ['rate<${(config.assertions?.failureRate || 0.01) * 100}%']
        }
      };
      
      export default function() {
        const url = '${config.url}';
        const params = {
          headers: ${JSON.stringify(config.headers || {})},
        };
        
        ${config.body ? `const payload = ${JSON.stringify(config.body)};` : ''}
        
        const response = http.${config.method.toLowerCase()}(url, ${config.body ? 'payload, ' : ''}params);
        
        check(response, {
          'status is ${config.assertions?.statusCode || 200}': (r) => r.status === ${config.assertions?.statusCode || 200},
        });
        
        sleep(1 / ${config.rate});
      }
    `;
    
    const scriptPath = path.join(this.outputDir, `load-test-${Date.now()}.js`);
    await writeFile(scriptPath, scriptContent);
    
    return scriptPath;
  }

  /**
   * Parse k6 output into a structured result
   */
  private parseK6Output(output: string, config: LoadTestConfig): LoadTestResult {
    // Extract metrics from k6 output
    const httpReqDurationAvg = this.extractMetric(output, 'http_req_duration', 'avg');
    const httpReqDurationMin = this.extractMetric(output, 'http_req_duration', 'min');
    const httpReqDurationMax = this.extractMetric(output, 'http_req_duration', 'max');
    const httpReqDurationP50 = this.extractMetric(output, 'http_req_duration', 'p(50)');
    const httpReqDurationP90 = this.extractMetric(output, 'http_req_duration', 'p(90)');
    const httpReqDurationP95 = this.extractMetric(output, 'http_req_duration', 'p(95)');
    const httpReqDurationP99 = this.extractMetric(output, 'http_req_duration', 'p(99)');
    
    const httpReqs = this.extractMetric(output, 'http_reqs', 'count');
    const httpReqsFailed = this.extractMetric(output, 'http_req_failed', 'rate');
    const httpReqsPerSec = this.extractMetric(output, 'http_reqs', 'rate');
    
    const failureRate = httpReqsFailed / 100; // Convert from percentage to decimal
    const successfulRequests = Math.round(httpReqs * (1 - failureRate));
    const failedRequests = Math.round(httpReqs * failureRate);
    
    // Check assertions
    const responseTimePassed = !config.assertions?.responseTime || httpReqDurationP95 <= config.assertions.responseTime;
    const failureRatePassed = !config.assertions?.failureRate || failureRate <= config.assertions.failureRate;
    
    return {
      summary: {
        totalRequests: httpReqs,
        successfulRequests,
        failedRequests,
        requestsPerSecond: httpReqsPerSec,
        averageResponseTime: httpReqDurationAvg,
        minResponseTime: httpReqDurationMin,
        maxResponseTime: httpReqDurationMax,
        p50ResponseTime: httpReqDurationP50,
        p90ResponseTime: httpReqDurationP90,
        p95ResponseTime: httpReqDurationP95,
        p99ResponseTime: httpReqDurationP99
      },
      assertions: {
        passed: responseTimePassed && failureRatePassed,
        details: {
          responseTime: config.assertions?.responseTime ? {
            passed: responseTimePassed,
            actual: httpReqDurationP95,
            expected: config.assertions.responseTime
          } : undefined,
          failureRate: config.assertions?.failureRate ? {
            passed: failureRatePassed,
            actual: failureRate,
            expected: config.assertions.failureRate
          } : undefined
        }
      },
      timestamp: new Date(),
      config,
      rawOutput: output
    };
  }

  /**
   * Extract a metric from k6 output
   */
  private extractMetric(output: string, name: string, type: string): number {
    const regex = new RegExp(`${name}\\s+:\\s+${type}=([\\d\\.]+)`);
    const match = output.match(regex);
    
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    
    return 0;
  }

  /**
   * Save test results to a file
   */
  private async saveResults(result: LoadTestResult): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultPath = path.join(this.outputDir, `load-test-result-${timestamp}.json`);
    
    await writeFile(resultPath, JSON.stringify(result, null, 2));
  }
}
