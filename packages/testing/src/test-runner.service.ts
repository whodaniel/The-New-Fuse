// Test Runner Service - Orchestrates automated testing for agent workflows
// Provides REST API endpoints for running tests and viewing results

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentWorkflowTestSuite } from './agent-workflow.test-suite';

// Mock service interfaces since packages are not available
interface OptimizedQueueService {
  addJob(type: string, payload: any): Promise<any>;
  getQueueMetrics(): Promise<any>;
}

interface RedisCacheService {
  set(key: string, value: any, options?: any): Promise<void>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<void>;
}

interface OptimizedWebSocketService {}

interface OptimizedA2AService {
  registerAgent(agent: any): Promise<boolean>;
  unregisterAgent(id: string): Promise<void>;
  getMetrics(): Promise<any>;
  sendMessage(message: any): Promise<any>;
  broadcastMessage(message: any): Promise<any>;
}

export interface TestRunResult {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  passed: number;
  failed: number;
  total: number;
  results: TestCaseResult[];
  summary?: string;
  error?: string;
}

export interface TestCaseResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  description: string;
  error?: string;
  metrics?: {
    assertions: number;
    performance: {
      memoryUsage: number;
      cpuTime: number;
      networkRequests: number;
    };
  };
}

export interface TestSchedule {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  testSuites: string[];
}

export interface TestConfiguration {
  timeout: number;
  retryAttempts: number;
  parallel: boolean;
  maxConcurrentTests: number;
  environment: 'development' | 'staging' | 'production';
  cleanup: boolean;
  verbose: boolean;
}

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);
  
  private testRuns: Map<string, TestRunResult> = new Map();
  private testSchedules: Map<string, TestSchedule> = new Map();
  private currentlyRunning: Set<string> = new Set();
  
  private defaultConfig: TestConfiguration = {
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
    parallel: true,
    maxConcurrentTests: 3,
    environment: 'development',
    cleanup: true,
    verbose: false,
  };

  constructor(
    private configService: ConfigService,
    private queueService?: OptimizedQueueService,
    private cacheService?: RedisCacheService,
    private websocketService?: OptimizedWebSocketService,
    private a2aService?: OptimizedA2AService,
  ) {
    this.initializeDefaultSchedules();
  }

  // Main test execution methods
  async runAgentWorkflowTests(config?: Partial<TestConfiguration>): Promise<TestRunResult> {
    const runId = this.generateRunId();
    const testConfig = { ...this.defaultConfig, ...config };
    
    const testRun: TestRunResult = {
      id: runId,
      name: 'Agent Workflow Test Suite',
      status: 'running',
      startTime: Date.now(),
      passed: 0,
      failed: 0,
      total: 0,
      results: [],
    };
    
    this.testRuns.set(runId, testRun);
    this.currentlyRunning.add(runId);
    
    this.logger.log(`Starting test run: ${runId}`);
    
    try {
      // Create test suite instance
      const testSuite = new AgentWorkflowTestSuite(
        null as any, // app instance would be injected in real implementation
        this.queueService as any,
        this.cacheService as any,
        this.websocketService as any,
        this.a2aService as any
      );
      
      // Run tests
      const results = await testSuite.runAllTests();
      
      // Update test run with results
      testRun.status = 'completed';
      testRun.endTime = Date.now();
      testRun.duration = testRun.endTime - testRun.startTime;
      testRun.passed = results.passed;
      testRun.failed = results.failed;
      testRun.total = results.results.length;
      testRun.results = results.results.map(result => ({
        name: result.name,
        status: result.status,
        duration: result.duration || 0,
        description: result.description,
        error: result.error,
        metrics: {
          assertions: 1,
          performance: {
            memoryUsage: process.memoryUsage().heapUsed,
            cpuTime: result.duration || 0,
            networkRequests: 0,
          },
        },
      }));
      
      testRun.summary = this.generateTestSummary(testRun);
      
      this.logger.log(`Test run completed: ${runId} - ${results.passed}/${results.results.length} passed`);
      
    } catch (error: any) {
      testRun.status = 'failed';
      testRun.endTime = Date.now();
      testRun.duration = testRun.endTime - testRun.startTime;
      testRun.error = error?.message || 'Unknown error';
      
      this.logger.error(`Test run failed: ${runId}`, error);
    } finally {
      this.currentlyRunning.delete(runId);
      
      // Cache test results
      if (this.cacheService) {
        await this.cacheService.set(`test_run:${runId}`, testRun, { ttl: 86400 }); // 24 hours
      }
    }
    
    return testRun;
  }

  async runSingleTest(testName: string, config?: Partial<TestConfiguration>): Promise<TestCaseResult> {
    const testConfig = { ...this.defaultConfig, ...config };
    
    this.logger.log(`Running single test: ${testName}`);
    
    try {
      const testSuite = new AgentWorkflowTestSuite(
        null as any,
        this.queueService as any,
        this.cacheService as any,
        this.websocketService as any,
        this.a2aService as any
      );
      
      const startTime = Date.now();
      const result = await testSuite.runSingleTest(testName);
      const duration = Date.now() - startTime;
      
      return {
        name: testName,
        status: result.status,
        duration,
        description: `Single test execution: ${testName}`,
        error: result.error,
        metrics: {
          assertions: 1,
          performance: {
            memoryUsage: process.memoryUsage().heapUsed,
            cpuTime: duration,
            networkRequests: 0,
          },
        },
      };
      
    } catch (error: any) {
      this.logger.error(`Single test failed: ${testName}`, error);
      
      return {
        name: testName,
        status: 'FAILED',
        duration: 0,
        description: `Single test execution: ${testName}`,
        error: error?.message || 'Unknown error',
      };
    }
  }

  // Test scheduling methods
  async scheduleTests(schedule: Omit<TestSchedule, 'id'>): Promise<string> {
    const scheduleId = this.generateScheduleId();
    
    const newSchedule: TestSchedule = {
      id: scheduleId,
      ...schedule,
      nextRun: this.calculateNextRun(schedule.cron),
    };
    
    this.testSchedules.set(scheduleId, newSchedule);
    
    // Cache schedule
    if (this.cacheService) {
      await this.cacheService.set(`test_schedule:${scheduleId}`, newSchedule, { ttl: 86400 * 7 }); // 7 days
    }
    
    this.logger.log(`Test schedule created: ${scheduleId} - ${schedule.name}`);
    
    return scheduleId;
  }

  async updateSchedule(scheduleId: string, updates: Partial<TestSchedule>): Promise<boolean> {
    const schedule = this.testSchedules.get(scheduleId);
    if (!schedule) {
      return false;
    }
    
    Object.assign(schedule, updates);
    
    if (updates.cron) {
      schedule.nextRun = this.calculateNextRun(updates.cron);
    }
    
    if (this.cacheService) {
      await this.cacheService.set(`test_schedule:${scheduleId}`, schedule, { ttl: 86400 * 7 });
    }
    
    this.logger.log(`Test schedule updated: ${scheduleId}`);
    
    return true;
  }

  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const deleted = this.testSchedules.delete(scheduleId);
    
    if (deleted) {
      if (this.cacheService) {
        await this.cacheService.delete(`test_schedule:${scheduleId}`);
      }
      this.logger.log(`Test schedule deleted: ${scheduleId}`);
    }
    
    return deleted;
  }

  // Test result retrieval methods
  async getTestRun(runId: string): Promise<TestRunResult | null> {
    let testRun = this.testRuns.get(runId);
    
    if (!testRun && this.cacheService) {
      // Try to load from cache
      testRun = await this.cacheService.get(`test_run:${runId}`);
    }
    
    return testRun || null;
  }

  async getAllTestRuns(limit: number = 50): Promise<TestRunResult[]> {
    const recentRuns = Array.from(this.testRuns.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
    
    return recentRuns;
  }

  async getTestRunsByStatus(status: 'running' | 'completed' | 'failed'): Promise<TestRunResult[]> {
    return Array.from(this.testRuns.values())
      .filter(run => run.status === status)
      .sort((a, b) => b.startTime - a.startTime);
  }

  async getTestSchedules(): Promise<TestSchedule[]> {
    return Array.from(this.testSchedules.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Test analytics and reporting
  async getTestAnalytics(days: number = 30): Promise<{
    totalRuns: number;
    successRate: number;
    averageDuration: number;
    trends: {
      daily: Array<{ date: string; runs: number; passed: number; failed: number }>;
      testCases: Array<{ name: string; successRate: number; averageDuration: number }>;
    };
    topFailures: Array<{ testCase: string; failures: number; lastFailure: number }>;
  }> {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRuns = Array.from(this.testRuns.values())
      .filter(run => run.startTime > cutoffDate);
    
    const totalRuns = recentRuns.length;
    const completedRuns = recentRuns.filter(run => run.status === 'completed');
    const successRate = totalRuns > 0 ? (completedRuns.length / totalRuns) * 100 : 0;
    const averageDuration = completedRuns.length > 0 
      ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length 
      : 0;
    
    // Generate daily trends
    const dailyTrends = this.generateDailyTrends(recentRuns, days);
    
    // Generate test case analytics
    const testCaseAnalytics = this.generateTestCaseAnalytics(recentRuns);
    
    // Find top failures
    const topFailures = this.getTopFailures(recentRuns);
    
    return {
      totalRuns,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      trends: {
        daily: dailyTrends,
        testCases: testCaseAnalytics,
      },
      topFailures,
    };
  }

  async generateTestReport(runId: string): Promise<{
    summary: string;
    details: string;
    recommendations: string[];
  }> {
    const testRun = await this.getTestRun(runId);
    if (!testRun) {
      throw new Error(`Test run not found: ${runId}`);
    }
    
    const summary = this.generateTestSummary(testRun);
    const details = this.generateTestDetails(testRun);
    const recommendations = this.generateRecommendations(testRun);
    
    return {
      summary,
      details,
      recommendations,
    };
  }

  // Utility methods
  private generateRunId(): string {
    return `test_run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateNextRun(cron: string): number {
    // Simple cron calculation - in production, use a proper cron library
    // For now, return next hour
    return Date.now() + (60 * 60 * 1000);
  }

  private generateTestSummary(testRun: TestRunResult): string {
    const successRate = testRun.total > 0 ? (testRun.passed / testRun.total) * 100 : 0;
    const duration = testRun.duration ? Math.round(testRun.duration / 1000) : 0;
    
    return `Test run completed in ${duration}s with ${successRate.toFixed(1)}% success rate (${testRun.passed}/${testRun.total} passed)`;
  }

  private generateTestDetails(testRun: TestRunResult): string {
    let details = `Test Run: ${testRun.name}\n`;
    details += `ID: ${testRun.id}\n`;
    details += `Status: ${testRun.status}\n`;
    details += `Duration: ${testRun.duration ? Math.round(testRun.duration / 1000) : 0}s\n`;
    details += `Results: ${testRun.passed} passed, ${testRun.failed} failed\n\n`;
    
    details += 'Test Cases:\n';
    testRun.results.forEach(result => {
      details += `- ${result.name}: ${result.status}`;
      if (result.duration) {
        details += ` (${Math.round(result.duration)}ms)`;
      }
      if (result.error) {
        details += ` - ${result.error}`;
      }
      details += '\n';
    });
    
    return details;
  }

  private generateRecommendations(testRun: TestRunResult): string[] {
    const recommendations = [];
    
    if (testRun.failed > 0) {
      recommendations.push('Review and fix failing test cases');
    }
    
    if (testRun.duration && testRun.duration > 300000) { // 5 minutes
      recommendations.push('Consider optimizing test execution time');
    }
    
    const longRunningTests = testRun.results.filter(r => r.duration > 30000); // 30 seconds
    if (longRunningTests.length > 0) {
      recommendations.push('Optimize long-running test cases: ' + longRunningTests.map(t => t.name).join(', '));
    }
    
    return recommendations;
  }

  private generateDailyTrends(runs: TestRunResult[], days: number): Array<{ date: string; runs: number; passed: number; failed: number }> {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.startTime).toISOString().split('T')[0];
        return runDate === dateStr;
      });
      
      trends.push({
        date: dateStr,
        runs: dayRuns.length,
        passed: dayRuns.reduce((sum, run) => sum + run.passed, 0),
        failed: dayRuns.reduce((sum, run) => sum + run.failed, 0),
      });
    }
    
    return trends;
  }

  private generateTestCaseAnalytics(runs: TestRunResult[]): Array<{ name: string; successRate: number; averageDuration: number }> {
    const testCaseStats = new Map<string, { total: number; passed: number; totalDuration: number }>();
    
    runs.forEach(run => {
      run.results.forEach(result => {
        const stats = testCaseStats.get(result.name) || { total: 0, passed: 0, totalDuration: 0 };
        stats.total++;
        if (result.status === 'PASSED') {
          stats.passed++;
        }
        stats.totalDuration += result.duration;
        testCaseStats.set(result.name, stats);
      });
    });
    
    return Array.from(testCaseStats.entries()).map(([name, stats]) => ({
      name,
      successRate: (stats.passed / stats.total) * 100,
      averageDuration: stats.totalDuration / stats.total,
    }));
  }

  private getTopFailures(runs: TestRunResult[]): Array<{ testCase: string; failures: number; lastFailure: number }> {
    const failureStats = new Map<string, { failures: number; lastFailure: number }>();
    
    runs.forEach(run => {
      run.results.forEach(result => {
        if (result.status === 'FAILED') {
          const stats = failureStats.get(result.name) || { failures: 0, lastFailure: 0 };
          stats.failures++;
          stats.lastFailure = Math.max(stats.lastFailure, run.startTime);
          failureStats.set(result.name, stats);
        }
      });
    });
    
    return Array.from(failureStats.entries())
      .map(([testCase, stats]) => ({ testCase, ...stats }))
      .sort((a, b) => b.failures - a.failures)
      .slice(0, 10);
  }

  private initializeDefaultSchedules(): void {
    // Initialize some default test schedules
    const defaultSchedules: Omit<TestSchedule, 'id'>[] = [
      {
        name: 'Daily Agent Workflow Tests',
        cron: '0 2 * * *', // 2 AM daily
        enabled: true,
        testSuites: ['agent_workflow'],
      },
      {
        name: 'Hourly Smoke Tests',
        cron: '0 * * * *', // Every hour
        enabled: false,
        testSuites: ['agent_registration', 'simple_workflow'],
      },
    ];
    
    defaultSchedules.forEach(schedule => {
      const id = this.generateScheduleId();
      this.testSchedules.set(id, {
        id,
        ...schedule,
        nextRun: this.calculateNextRun(schedule.cron),
      });
    });
  }

  // Health check for test runner
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    runningTests: number;
    totalRuns: number;
    lastSuccessfulRun?: number;
  }> {
    const runningTests = this.currentlyRunning.size;
    const totalRuns = this.testRuns.size;
    const recentRuns = Array.from(this.testRuns.values())
      .filter(run => run.startTime > Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
    
    const lastSuccessfulRun = recentRuns
      .filter(run => run.status === 'completed' && run.failed === 0)
      .sort((a, b) => b.startTime - a.startTime)[0]?.startTime;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (runningTests > 5) {
      status = 'degraded';
    }
    
    if (!lastSuccessfulRun || Date.now() - lastSuccessfulRun > (48 * 60 * 60 * 1000)) {
      status = 'unhealthy';
    }
    
    return {
      status,
      runningTests,
      totalRuns,
      lastSuccessfulRun,
    };
  }
}