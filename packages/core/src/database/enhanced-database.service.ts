import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EnhancedDatabaseService {
  private readonly logger = new Logger(EnhancedDatabaseService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  async onModuleInit() {
    this.logger.log('EnhancedDatabaseService initialized');
  }

  async onModuleDestroy() {
    this.logger.log('EnhancedDatabaseService destroyed');
  }
}
