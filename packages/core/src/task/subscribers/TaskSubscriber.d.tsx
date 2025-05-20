import { EntitySubscriberInterface } from 'typeorm';
import { Task } from '../entities/Task.js';
import { NotificationService } from '../../notification/NotificationService.js';
export declare class TaskSubscriber implements EntitySubscriberInterface<Task> {
    private notificationService;
    constructor(notificationService: NotificationService);
    listenTo(): any;
    afterInsert(): Promise<void>;
}
