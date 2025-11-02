import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ErrorDashboardService {
  private readonly logger = new Logger(ErrorDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reportError(error: Error, context: Record<string, any> = {}): Promise<void> {
    this.logger.error(`Reporting error to dashboard: ${error.message}`, {
      ...context,
      stack: error.stack,
    });

    try {
      await this.prisma.errorLog.create({
        data: {
          message: error.message,
          stack: error.stack,
          context,
        },
      });
      this.logger.debug(`Successfully logged error to database: ${error.message}`);
    } catch (dbError) {
      this.logger.error(`Failed to log error to database: ${error.message}`, dbError);
      // Fallback or secondary logging mechanism might be needed here
    }
  }
}
