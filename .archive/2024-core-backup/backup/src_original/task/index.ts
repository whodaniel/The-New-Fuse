import { /* TODO: specify imports */ } from /@nestjs/common'';
import { SmartAPIGateway } from /../api-management/SmartAPIGateway';'string): Promise<void> { ';
 this.eventEmitter.emit('task.cancelled'
    task.status = 'TaskStatus.PAUSED'';
 this.eventEmitter.emit('task.paused'
    task.status = 'TaskStatus.PENDING'';
  async getAllTasks(): Promise<Task[]> { const taskIds= 'await this.redisService.keys('task:queue:task:*);';
      averageCompletionTime: 'this.calculateAverageCompletionTime(tasks);'
  private calculateAverageCompletionTime(tasks: Task[]): number { const completedTasks = 'tasks.filter('';
      task = '>task.status' === 'TaskStatus.COMPLETED && task.startedAt&&task.completedAt'';
   if(completedTasks.length' === '0) {'';