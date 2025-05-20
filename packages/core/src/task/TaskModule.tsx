import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskManager } from './TaskManager.js';
import { TaskExecutor } from './TaskExecutor.js';
import { TaskScheduler } from './TaskScheduler.js';
import { TaskRepository } from '@the-new-fuse/database';
import { RedisModule } from '../redis/redis.module.js';
import { DatabaseModule } from '@the-new-fuse/database';
import { TaskService } from './TaskService.js';
import { SchedulerService } from './SchedulerService.js';
import { ComponentAnalysisTask } from './tasks/ComponentAnalysisTask.js';
import { componentAnalysisSchedule } from './config/component-analysis-schedule.js';
import { ComponentAnalysisStorage } from './services/ComponentAnalysisStorage.js';
import { ComponentAnalysisNotifier } from './services/ComponentAnalysisNotifier.js';
import { ComponentAnalysisSubscriber } from './services/ComponentAnalysisSubscriber.js';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    DatabaseModule,
    EventEmitterModule.forRoot()
  ],
  providers: [
    TaskManager,
    TaskExecutor,
    TaskScheduler,
    TaskService,
    SchedulerService,
    ComponentAnalysisTask,
    ComponentAnalysisStorage,
    ComponentAnalysisNotifier,
    ComponentAnalysisSubscriber,
    {
      provide: 'TASK_SCHEDULES',
      useValue: [componentAnalysisSchedule]
    }
  ],
  exports: [
    TaskManager,
    TaskExecutor,
    TaskScheduler,
    TaskService,
    SchedulerService,
    ComponentAnalysisStorage,
    ComponentAnalysisNotifier,
    ComponentAnalysisSubscriber
  ]
})
export class TaskModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly taskScheduler: TaskScheduler,
    private readonly schedulerService: SchedulerService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.taskScheduler.start();
    await this.schedulerService.loadSchedules();
  }

  async onModuleDestroy(): Promise<void> {
    await this.taskScheduler.stop();
  }
}
