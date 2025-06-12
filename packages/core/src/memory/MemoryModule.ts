import { Module } from '@nestjs/common';
import { MemoryManager } from './MemoryManager.tsx';
import { MemoryOptimizer } from './MemoryOptimizer.tsx';
import { MemoryIndexer } from './MemoryIndexer.tsx';
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
