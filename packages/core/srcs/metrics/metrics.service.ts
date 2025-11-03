import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCpuUsage(): Promise<number> {
    this.logger.log('Getting CPU usage');
    // This is a placeholder for a more robust implementation that would
    // get the CPU usage from a time-series database.
    return 0;
  }

  async getMemoryUsage(): Promise<number> {
    this.logger.log('Getting memory usage');
    // This is a placeholder for a more robust implementation that would
    // get the memory usage from a time-series database.
    return 0;
  }
}
