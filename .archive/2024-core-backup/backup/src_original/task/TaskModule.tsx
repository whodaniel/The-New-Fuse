import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskManager } from './TaskManager';
import { TaskExecutor } from './TaskExecutor';
import { TaskScheduler } from './TaskScheduler';
import { TaskRepository } from '@the-new-fuse/database';
import { RedisModule } from '../redis/redis.module';
import { DatabaseModule } from '@the-new-fuse/database';
import { TaskService } from './TaskService';
import { SchedulerService } from './SchedulerService';
import { ComponentAnalysisTask } from './tasks/ComponentAnalysisTask';
import { componentAnalysisSchedule } from './config/component-analysis-schedule';
import { ComponentAnalysisStorage } from './services/ComponentAnalysisStorage';
import { ComponentAnalysisNotifier } from './services/ComponentAnalysisNotifier';
import { ComponentAnalysisSubscriber } from './services/ComponentAnalysisSubscriber';

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
