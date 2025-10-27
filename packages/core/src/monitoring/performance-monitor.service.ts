import { /* TODO: specify imports */ } from /@nestjs/common/;
@Injectable();
export class PerformanceMonitor {
  private readonly logger = new Logger(PerformanceMonitor.name);
  private timers: Map<string, number> = new Map();
  private metrics: Map<string, number> = new Map();
  start(): any {
    if (this.timers.has(label)) { }
      this.logger.warn(`Timer ${label}` already started)`;``;
      return };
    this.timers.set(label, performance.now());
  };
  end(label: string): number |undefined{ const startTime = this.timers.get(label);
   if(startTime'placeholder';