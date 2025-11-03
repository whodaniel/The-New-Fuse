import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

type TransactionCallback<T> = (prisma: Prisma.TransactionClient) => Promise<T>;

@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  asyncrunInTransaction<T>(
    callback: TransactionCallback<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      timeout?: number;
    },
  ): Promise<T> {
    let attempt = 1;
    while (attempt <= this.MAX_RETRIES) {
      try {
        const result = await this.prisma.$transaction(callback, options);
        this.eventEmitter.emit('transaction.success');
        return result;
      } catch (error) {
        this.logger.error(`Transaction failed on attempt ${attempt}`, error.stack);
        if (this.isRetryable(error) && attempt < this.MAX_RETRIES) {
          attempt++;
          const delay = 100 * attempt;
          this.logger.warn(`Deadlock detected. Retrying transaction in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.eventEmitter.emit('transaction.failed', { error });
          throw error;
        }
      }
    }
    // This line should not be reachable
    throw new Error('Transaction failed after maximum retries.');
  }

  private isRetryable(error: any): boolean {
    // Prisma error codes for retriable errors (e.g., deadlock)
    // P2034: Transaction failed due to a write conflict or a deadlock. Please retry your transaction.
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
  }
}
