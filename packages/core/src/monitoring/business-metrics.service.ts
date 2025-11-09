import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
  ): Promise<void> {
    this.logger.log(`Recording metric: ${name} = ${value}`);
    await this.prisma.businessMetric.create({
      data: {
        name,
        value,
        tags,
      },
    });
  }
}
