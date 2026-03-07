import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly timers = new Map<string, number>();

  constructor() {}

  startTimer(name: string): void {
    this.logger.log(`Starting timer for: ${name}`);
    this.timers.set(name, Date.now());
  }

  endTimer(name: string): void {
    const startTime = this.timers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logger.log(`Timer for ${name} ended. Duration: ${duration}ms`);
      this.timers.delete(name);
      // In a real implementation, you would send this to a monitoring service.
    } else {
      this.logger.warn(`Timer for ${name} was not started.`);
    }
  }
}
