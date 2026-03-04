/**
 * Task Module - Migrated to Drizzle ORM
 * Provides task management capabilities using Drizzle database service
 */
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { UnifiedLedgerModule } from '../unified-ledger/unified-ledger.module';
import { TaskHealthMonitorService } from './task-health-monitor.service';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService with Drizzle repositories
    UnifiedLedgerModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskHealthMonitorService],
  exports: [TaskService],
})
export class TaskModule {}
