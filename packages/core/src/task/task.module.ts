import { Module } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database';
import { TaskService } from './task.service.tsx';

@Module({
  providers: [
    TaskService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
})
export class TaskModule {}
