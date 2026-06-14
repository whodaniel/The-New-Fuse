import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SubTaskLifecycleManager {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    planSubTasks(task: any): any[];
    delegateSubTask(subTask: any, agent: any): void;
}
//# sourceMappingURL=sub-task-lifecycle-manager.d.ts.map