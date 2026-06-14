var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let SubTaskLifecycleManager = class SubTaskLifecycleManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    planSubTasks(task) {
        console.log('SubTaskLifecycleManager: planning sub-tasks', task);
        // Return a mock sub-task for testing purposes
        return [{ id: 'subtask-1', parentTaskId: task.id, payload: 'mock payload' }];
    }
    delegateSubTask(subTask, agent) {
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
};
SubTaskLifecycleManager = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], SubTaskLifecycleManager);
export { SubTaskLifecycleManager };
//# sourceMappingURL=sub-task-lifecycle-manager.js.map