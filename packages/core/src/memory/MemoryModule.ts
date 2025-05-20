import { Module } from '@nestjs/common';
import { MemoryManager } from './MemoryManager.js';
import { MemoryOptimizer } from './MemoryOptimizer.js';
import { MemoryIndexer } from './MemoryIndexer.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    MemoryManager,
    MemoryOptimizer,
    MemoryIndexer
  ],
  exports: [
    MemoryManager,
    MemoryOptimizer,
    MemoryIndexer
  ]
})
export class MemoryModule {}
