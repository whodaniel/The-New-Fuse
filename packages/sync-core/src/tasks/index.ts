export { TaskSynchronizationService } from './TaskSynchronizationService.js';
export { EnhancedTaskManagementService } from './EnhancedTaskManagementService.js';
export { TaskNotificationService } from './TaskNotificationService.js';

export type {
  TaskSyncData,
  TaskExecutionSyncData,
  TaskDependencyUpdate,
  TaskNotification
} from './TaskSynchronizationService.js';

export type {
  EnhancedTaskData,
  TaskExecutionContext,
  WorkflowTaskIntegration
} from './EnhancedTaskManagementService.js';

export type {
  TaskNotificationRule,
  NotificationChannel,
  TaskNotificationHistory
} from './TaskNotificationService.js';