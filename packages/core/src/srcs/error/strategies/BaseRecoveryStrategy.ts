import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export abstract class BaseRecoveryStrategy {
  protected readonly logger = new Logger(this.constructor.name);

  constructor() {}

  abstract canHandle(error: Error): boolean;

  abstract handle(error: Error, context: Record<string, any>): Promise<void>;
}
