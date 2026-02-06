import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly timers = new Map<string, number>();

  constructor() {}

  start(name: string): void {
    this.logger.log(`Starting performance measurement for: ${name}`);
    this.timers.set(name, Date.now());
  }

  end(name: string): void {
    const startTime = this.timers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logger.log(`Performance measurement for ${name} ended. Duration: ${duration}ms`);
      this.timers.delete(name);
      // In a real implementation, you would send this to a monitoring service.
    } else {
      this.logger.warn(`Performance measurement for ${name} was not started.`);
    }
  }
}
