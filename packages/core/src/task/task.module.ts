import { Module } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database/client';
import { TaskService } from './task.service.js';

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
