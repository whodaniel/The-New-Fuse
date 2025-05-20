import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    DataSource,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { Task } from '../task.entity.js'; // Adjusted path
// import { NotificationService } from '../../notification/notification.service.js'; // Example import

@EventSubscriber()
export class TaskSubscriber implements EntitySubscriberInterface<Task> {
    private readonly logger = new Logger(TaskSubscriber.name);

    constructor(
        private dataSource: DataSource,
        // private readonly notificationService: NotificationService, // Example injection
    ) {
        dataSource.subscribers.push(this); // Register subscriber
    }

    listenTo() {
        return Task;
    }

    beforeInsert(event: InsertEvent<Task>) {
        this.logger.log(`BEFORE TASK INSERTED: ${JSON.stringify(event.entity)}`);
        if (event.entity) {
            event.entity.createdAt = new Date(); // Automatically set createdAt
            event.entity.updatedAt = new Date(); // Automatically set updatedAt
        }
    }

    afterInsert(event: InsertEvent<Task>) {
        this.logger.log(`AFTER TASK INSERTED: ID ${event.entity.id}`);
        // Example: this.notificationService.notifyNewTask(event.entity);
    }

    beforeUpdate(event: UpdateEvent<Task>) {
        this.logger.log(`BEFORE TASK UPDATED: ID ${event.databaseEntity.id}`);
        if (event.entity) {
            (event.entity as Task).updatedAt = new Date(); // Automatically update updatedAt
        }
    }

    afterUpdate(event: UpdateEvent<Task>) {
        this.logger.log(`AFTER TASK UPDATED: ID ${event.databaseEntity.id}`);
        // Example: this.notificationService.notifyTaskUpdate(event.entity as Task);
    }

    beforeRemove(event: RemoveEvent<Task>) {
        this.logger.log(`BEFORE TASK REMOVED: ID ${event.entityId}, Entity: ${JSON.stringify(event.entity)}`);
    }

    afterRemove(event: RemoveEvent<Task>) {
        this.logger.log(`AFTER TASK REMOVED: ID ${event.databaseEntity?.id || event.entityId}`);
        // Example: this.notificationService.notifyTaskRemoval(event.databaseEntity as Task);
    }
}