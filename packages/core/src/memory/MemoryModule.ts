import { Module } from '@nestjs/common';
import { MemoryManager } from './MemoryManager';
import { MemoryOptimizer } from './MemoryOptimizer';
import { MemoryIndexer } from './MemoryIndexer';
import { VectorMemoryStore } from './VectorMemoryStore';
import { MemoryLeakDetector } from './MemoryLeakDetector';
@Module({
  // Implementation needed
}
  providers: [
    MemoryManager,
    MemoryOptimizer,
    MemoryIndexer,
    VectorMemoryStore,
    MemoryLeakDetector,
  ],
  exports: [
    MemoryManager,
    MemoryOptimizer,
    MemoryIndexer,
    VectorMemoryStore,
    MemoryLeakDetector,
  ],
})
export class MemoryModule {}