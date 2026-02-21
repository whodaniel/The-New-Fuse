import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TaskService } from '../task/task.service';

@Injectable()
export class DirectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DirectorService.name);
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(private readonly taskService: TaskService) {}

  async onModuleInit() {
    this.logger.log('🚀 Director Service initializing...');
    this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  private startMonitoring() {
    // Monitor active tasks every minute
    this.intervalHandle = setInterval(async () => {
      await this.monitorActiveTasks();
    }, 60000);

    // Also run once immediately
    this.monitorActiveTasks();
  }

  private stopMonitoring() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async monitorActiveTasks() {
    try {
      this.logger.log('📊 Monitoring active tasks...');
      const activeTasks = await this.taskService.findActiveTasks();

      if (activeTasks.length === 0) {
        this.logger.log('✅ No active tasks found.');
        return;
      }

      this.logger.log(`🔍 Found ${activeTasks.length} tasks currently IN_PROGRESS`);

      activeTasks.forEach((task) => {
        const duration = task.startTime
          ? Math.round((Date.now() - new Date(task.startTime).getTime()) / 1000)
          : 'unknown';

        this.logger.log(
          `   - Task [${task.id}] "${task.title || 'Untitled'}": Status=${task.status}, Priority=${task.priority}, Duration=${duration}s`
        );
      });
    } catch (error) {
      this.logger.error('❌ Error during task monitoring:', error);
    }
  }
}
