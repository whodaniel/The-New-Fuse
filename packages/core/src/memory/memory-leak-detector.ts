import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as v8 from 'v8';

@Injectable()
export class MemoryLeakDetector {
  private readonly logger = new Logger(MemoryLeakDetector.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async startDetection(): Promise<void> {
    this.logger.log('Memory leak detection started');
  }

  async checkMemoryUsage(): Promise<void> {
    const stats = v8.getHeapStatistics();
    this.logger.log(`Memory usage: ${stats.used_heap_size} bytes`);
    
    this.eventEmitter.emit('memory.leak.warning', {
      type: 'memory_leak_warning',
      heapUsed: stats.used_heap_size
    });
  }

  async cleanup(): Promise<void> {
    this.logger.debug('Memory leak detector cleanup completed');
  }
}