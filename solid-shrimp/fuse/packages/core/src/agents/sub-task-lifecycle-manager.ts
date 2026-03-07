import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SubTaskLifecycleManager {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  planSubTasks(task: any): any[] {
    console.log('SubTaskLifecycleManager: planning sub-tasks', task);
    // Return a mock sub-task for testing purposes
    return [{ id: 'subtask-1', parentTaskId: task.id, payload: 'mock payload' }];
  }

  delegateSubTask(subTask: any, agent: any): void {
    console.log('SubTaskLifecycleManager: delegating sub-task', subTask, agent);
    // Simulate sub-task completion
    setTimeout(() => {
      this.eventEmitter.emit('subtask.completed', {
        parentTaskId: subTask.parentTaskId,
        subTask: subTask,
        result: { success: true },
      });
    }, 1000);
  }
}
