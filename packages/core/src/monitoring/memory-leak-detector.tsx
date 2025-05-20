import { Injectable, Logger } from '@nestjs/common';
import { MetricCollector } from './metric-collector.js';
import * as v8 from 'v8';

interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  objectCounts: Map<string, number>;
  retainedSize: number;
}

@Injectable()
export class MemoryLeakDetector {
  private readonly logger = new Logger(MemoryLeakDetector.name);
  private readonly snapshots: MemorySnapshot[] = [];
  private readonly snapshotInterval: number = 300000; // 5 minutes
  private readonly maxSnapshots: number = 12; // Keep 1 hour of history
  private timer: NodeJS.Timer;

  constructor(private readonly metricCollector: MetricCollector) {}

  startMonitoring(): void {
    this.timer = setInterval(() => this.takeSnapshot(), this.snapshotInterval);
  }

  stopMonitoring(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async takeSnapshot(): Promise<void> {
    const heapUsed = process.memoryUsage().heapUsed;
    const heapStats = v8.getHeapStatistics();
    
    // Get object counts by type
    const objectCounts = new Map<string, number>();
    // Using v8 heap snapshot would go here in production
    
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed,
      objectCounts,
      retainedSize: heapStats.total_heap_size - heapStats.used_heap_size
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    await this.analyzeSnapshots();
  }

  private async analyzeSnapshots(): Promise<void> {
    if (this.snapshots.length < 2) return;

    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    // Calculate growth rates
    const heapGrowthRate = (latest.heapUsed - previous.heapUsed) / previous.heapUsed;
    const retainedSizeGrowthRate = (latest.retainedSize - previous.retainedSize) / previous.retainedSize;

    // Record metrics
    this.metricCollector.gauge('memory_heap_growth_rate', heapGrowthRate, 'percentage');
    this.metricCollector.gauge('memory_retained_growth_rate', retainedSizeGrowthRate, 'percentage');

    // Detect potential leaks
    if (this.detectLeakPattern()) {
      this.logger.warn('Potential memory leak detected', {
        heapGrowthRate,
        retainedSizeGrowthRate,
        currentHeapUsed: latest.heapUsed,
        currentRetainedSize: latest.retainedSize
      });
    }
  }

  private detectLeakPattern(): boolean {
    if (this.snapshots.length < 3) return false;

    // Check for consistent growth pattern
    let consistentGrowth = true;
    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];
      const previous = this.snapshots[i - 1];
      
      if (current.heapUsed <= previous.heapUsed) {
        consistentGrowth = false;
        break;
      }
    }

    // If we see consistent growth over multiple snapshots, likely a leak
    return consistentGrowth;
  }

  getLeakReport(): { 
    hasLeak: boolean; 
    growthRate: number; 
    largestObjects: Array<{ type: string; count: number }> 
  } {
    if (this.snapshots.length < 2) {
      return { hasLeak: false, growthRate: 0, largestObjects: [] };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const first = this.snapshots[0];
    const growthRate = (latest.heapUsed - first.heapUsed) / first.heapUsed;

    const largestObjects = Array.from(latest.objectCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      hasLeak: this.detectLeakPattern(),
      growthRate,
      largestObjects
    };
  }
}