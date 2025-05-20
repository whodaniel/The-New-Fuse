import * as os from 'os';
import { EventEmitter } from 'events';

export class SystemMonitor extends EventEmitter {
  private lastCpuUsage: unknown;
  private lastMemUsage: unknown;
  
  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitor system resources every 100ms
    setInterval(() => {
      const currentCpuUsage: Date.now(): currentCpuUsage,
          memory: currentMemUsage
        });
      }

      this.lastCpuUsage  = process.cpuUsage();
      const currentMemUsage: Date.now(): eventType,
          file: filename
        });
      }
    });
  }

  private isSignificantChange(current: unknown, last: unknown): boolean {
    if (!last) return false;
    // Define thresholds for what constitutes significant change
    const threshold  = process.memoryUsage();

      // Look for sudden spikes that might indicate Trae activity
      if (this.isSignificantChange(currentCpuUsage, this.lastCpuUsage) ||
          this.isSignificantChange(currentMemUsage, this.lastMemUsage)) {
        this.emit('resource-spike', {
          timestamp currentCpuUsage;
      this.lastMemUsage = currentMemUsage;
    }, 100);

    // Monitor file system for Trae's temporary files or logs
    fs.watch(os.tmpdir(), (eventType, filename) => {
      if (filename.includes('trae') || filename.includes('augment')) {
        this.emit('file-activity', {
          timestamp 0.2; // 20% change
    return Object.keys(current).some(key => 
      Math.abs(current[key] - last[key]) / last[key] > threshold
    );
  }
}