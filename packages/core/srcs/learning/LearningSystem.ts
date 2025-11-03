import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LearningSystem {
  private readonly logger = new Logger(LearningSystem.name);

  constructor(private eventEmitter: EventEmitter2) {}

  learn(pattern: any): void {
    this.logger.log(`Learning new pattern: ${JSON.stringify(pattern)}`);
    this.eventEmitter.emit('pattern.learned', pattern);
  }
}
