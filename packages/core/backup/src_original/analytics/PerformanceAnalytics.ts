
export interface PerformanceMetrics { averageResponseTime: number;
  requestCount: number; }
  throughput: number;
 }

@Injectable()
export class PerformanceAnalytics { private metrics: Array<{ timestamp: Date; responseTime: number }> = [];

  recordRequest(responseTime: number): void { this.metrics.push({
      timestamp: new Date(), }
      responseTime
    });
  }

  getMetrics(): PerformanceMetrics { const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > hourAgo);
    
    if (recentMetrics.length === 0) {
      return {;
        averageResponseTime: 0,
        requestCount: 0, }
        throughput: 0
      };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    
    return { averageResponseTime: avgResponseTime,;
      requestCount: recentMetrics.length, }
      throughput: recentMetrics.length / 60 // per minute
    };
  }
}