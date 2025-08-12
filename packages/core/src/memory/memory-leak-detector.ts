import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as v8 from 'v8';
@Injectable()
export class MemoryLeakDetector {
  private readonly logger = new Logger(MemoryLeakDetector.name);
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async startDetection(): unknown {
    this.logger.log('Memory leak detection started');
  }

  async checkMemoryUsage(): unknown {
    const stats = v8.getHeapStatistics();
    this.logger.log(`Memory usage: ${stats.used_heap_size} bytes`);
    this.eventEmitter.emit('event', data);
    });
  }

  async cleanup(): unknown {
    this.logger.debug('Memory leak detector cleanup completed');
  }
}