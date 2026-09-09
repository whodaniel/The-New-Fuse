import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { DurableTasksController } from './durable-tasks.controller';
import { DurableTasksCostAuthority } from './durable-tasks.cost-authority';
import { DurableTasksFairQueue } from './durable-tasks.fair-queue';
import { DurableTasksService } from './durable-tasks.service';
import { DurableTasksWorkerService } from './durable-tasks.worker';

@Module({
  imports: [DatabaseModule],
  controllers: [DurableTasksController],
  providers: [
    DurableTasksService,
    DurableTasksCostAuthority,
    DurableTasksFairQueue,
    DurableTasksWorkerService,
  ],
  exports: [DurableTasksService, DurableTasksCostAuthority, DurableTasksFairQueue],
})
export class DurableTasksModule {}
