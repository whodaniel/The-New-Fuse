import { Injectable } from '@nestjs/common';
export interface PerformanceMetrics {
  averageResponseTime: number;
  requestCount: number;
  throughput: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
}

export interface RequestRecord {
  timestamp: Date;
  responseTime: number;
  success: boolean;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

@Injectable()
export class PerformanceAnalytics {
  private metrics: RequestRecord[] = [];
  private readonly maxStoredMetrics = 50000;
  recordRequest(responseTime: number, success: boolean, endpoint?: string, method?: string, statusCode?: number): void {
    const record: RequestRecord = {
      timestamp: new Date(),
      responseTime,
      success,
      endpoint,
      method,
      statusCode
    };
    this.metrics.push(record);
    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }
  }

  getMetrics(timeWindowMinutes: number = 60): PerformanceMetrics {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > windowStart);
    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        requestCount: 0,
        throughput: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    return {
      averageResponseTime: avgResponseTime,
      requestCount: recentMetrics.length,
      throughput: recentMetrics.length / timeWindowMinutes, // per minute
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      successRate: successfulRequests / recentMetrics.length
    };
  }

  getEndpointMetrics(endpoint: string, timeWindowMinutes: number = 60): PerformanceMetrics {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const filteredMetrics = this.metrics.filter(m =>
      m.timestamp > windowStart && m.endpoint === endpoint
    );
    if (filteredMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        requestCount: 0,
        throughput: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0
      };
    }

    const responseTimes = filteredMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    return {
      averageResponseTime: avgResponseTime,
      requestCount: filteredMetrics.length,
      throughput: filteredMetrics.length / timeWindowMinutes,
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      p95ResponseTime: responseTimes[p95Index] || responseTimes[responseTimes.length - 1],
      p99ResponseTime: responseTimes[p99Index] || responseTimes[responseTimes.length - 1],
      successRate: successfulRequests / filteredMetrics.length
    };
  }

  getSlowRequests(thresholdMs: number, hours: number = 24): RequestRecord[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m =>
      m.timestamp > cutoff && m.responseTime > thresholdMs
    );
  }

  getTopEndpoints(limit: number = 10, timeWindowMinutes: number = 60): Array<{endpoint: string; count: number}> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > windowStart && m.endpoint);
    const endpointCounts: Record<string, number> = {};
    recentMetrics.forEach(m => {
      if (m.endpoint) {
        endpointCounts[m.endpoint] = (endpointCounts[m.endpoint] || 0) + 1;
      }
    });
    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clearOldMetrics(olderThanHours: number = 168): void { // Default to 1 week
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  getTotalRequestCount(): number {
    return this.metrics.length;
  }
}