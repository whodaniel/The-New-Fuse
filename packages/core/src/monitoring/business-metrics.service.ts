import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordMetric(
    name: string,
    value: number,
    tags: Record<string, string | number | boolean> = {},
  ): Promise<void> {
    this.logger.log(`Recording metric: ${name} = ${value}`);
    try {
      await this.prisma.businessMetric.create({
        data: {
          name,
          value,
          tags,
        },
      });
      this.logger.debug(`Successfully recorded metric: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to record metric: ${name}`, error);
      // Depending on the criticality, you might want to re-throw the error
      // or handle it in a specific way (e.g., push to a fallback monitoring system).
    }
  }
}
