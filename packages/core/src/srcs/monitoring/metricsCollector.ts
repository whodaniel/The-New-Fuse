import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

export class MetricsCollector {
  private readonly logger: Logger;
  private interval: NodeJS.Timeout;

  constructor() {
    this.logger = new Logger('MetricsCollector');
  }

  start(): void {
    this.logger.info('Starting metrics collector');
    this.interval = setInterval(() => {
      this.collect();
    }, 10000);
  }

  stop(): void {
    this.logger.info('Stopping metrics collector');
    clearInterval(this.interval);
  }

  private collect(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    const { rss, heapTotal, heapUsed, external, arrayBuffers } = memoryUsage;

    this.logger.debug(
      `Memory usage: ${JSON.stringify({ rss, heapTotal, heapUsed, external, arrayBuffers })}`,
    );
    this.logger.debug(`CPU usage: ${JSON.stringify(cpuUsage)}`);
    this.logger.debug(`Uptime: ${uptime}`);
  }
}
