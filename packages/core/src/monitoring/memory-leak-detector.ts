import { Injectable, Logger } from '@nestjs/common';
import * as gcProfiler from 'gc-profiler';
import { AlertService } from './alerts/AlertService';

@Injectable()
export class MemoryLeakDetector {
  private readonly logger = new Logger(MemoryLeakDetector.name);
  private lastHeapUsage = 0;
  private consecutiveIncreases = 0;
  private readonly LEAK_THRESHOLD = 5; // Number of consecutive GC cycles with increased heap usage to trigger an alert

  constructor(private readonly alertService: AlertService) {
    this.startMonitoring();
  }

  startMonitoring(): void {
    this.logger.log('Starting memory leak monitoring...');
    gcProfiler.on('gc', (info) => {
      this.logger.debug(`GC event: ${info.type} (${info.duration}ms), Heap before: ${this.lastHeapUsage}, Heap after: ${info.after.heapSizeUsed}`);

      const heapSizeUsed = info.after.heapSizeUsed;

      if (heapSizeUsed > this.lastHeapUsage) {
        this.consecutiveIncreases++;
        this.logger.debug(`Heap usage increased. Consecutive increases: ${this.consecutiveIncreases}`);
      } else {
        // Reset the counter if the heap usage does not increase
        this.consecutiveIncreases = 0;
        this.logger.debug('Heap usage did not increase. Resetting consecutive increases counter.');
      }

      this.lastHeapUsage = heapSizeUsed;

      if (this.consecutiveIncreases >= this.LEAK_THRESHOLD) {
        const message = `Potential memory leak detected. Heap usage has increased for ${this.consecutiveIncreases} consecutive GC cycles. Current heap usage: ${heapSizeUsed} bytes.`;
        this.logger.warn(message);
        this.alertService.sendAlert('MemoryLeakWarning', message, 'warning');
        // Reset after alerting to avoid spamming
        this.consecutiveIncreases = 0;
      }
    });
  }
}
